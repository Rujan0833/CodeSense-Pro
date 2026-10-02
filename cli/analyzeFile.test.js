import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { analyzeFile, resolveLanguage } from './analyzeFile.js';

test('detects language from common file extensions', () => {
  assert.equal(resolveLanguage('sample.tsx'), 'typescript');
  assert.equal(resolveLanguage('sample.py'), 'python');
  assert.equal(resolveLanguage('sample.cpp'), 'cpp');
});

test('allows a supported language override for unknown extensions', () => {
  assert.equal(resolveLanguage('sample.source', '  Python '), 'python');
});

test('rejects unknown extensions and unsupported overrides', () => {
  assert.throws(() => resolveLanguage('sample.unknown'), /Cannot detect/);
  assert.throws(() => resolveLanguage('sample.js', 'fortran'), /Unsupported language/);
});

test('reads a file and sends the shared analysis request contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'codesense-cli-'));
  const filePath = join(directory, 'sample.js');
  const code = 'const answer = 42;';
  await writeFile(filePath, code, 'utf8');

  let requestUrl;
  let requestOptions;
  try {
    const result = await analyzeFile({
      filePath,
      endpoint: 'http://localhost:5173/api/analyze',
      fetchImpl: async (url, options) => {
        requestUrl = url;
        requestOptions = options;
        return new Response(JSON.stringify({
          analysis: { summary: 'Looks good.', issues: [], suggestions: [], score: 95, language: 'javascript' },
          meta: { language: 'javascript', codeSize: Buffer.byteLength(code), requestId: 'test-request' },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      },
    });

    assert.equal(requestUrl, 'http://localhost:5173/api/analyze');
    assert.equal(requestOptions.method, 'POST');
    assert.deepEqual(JSON.parse(requestOptions.body), { code, language: 'javascript' });
    assert.equal(result.analysis.score, 95);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects empty files before making a request', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'codesense-cli-'));
  const filePath = join(directory, 'empty.js');
  await writeFile(filePath, '  ', 'utf8');

  try {
    await assert.rejects(
      analyzeFile({ filePath, endpoint: 'http://localhost:5173/api/analyze', fetchImpl: () => assert.fail('unexpected request') }),
      /file is empty/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('maps structured provider errors to CLI exit codes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'codesense-cli-'));
  const filePath = join(directory, 'sample.js');
  await writeFile(filePath, 'const answer = 42;', 'utf8');

  try {
    await assert.rejects(
      analyzeFile({
        filePath,
        endpoint: 'http://localhost:5173/api/analyze',
        fetchImpl: async () => ({
          ok: false,
          status: 503,
          json: async () => ({
            error: {
              code: 'ANALYSIS_PROVIDER_NOT_CONFIGURED',
              message: 'The analysis service is not configured on the server.',
              requestId: 'req-123',
            },
          }),
        }),
      }),
      (error) => error.code === 'ANALYSIS_PROVIDER_NOT_CONFIGURED' && error.exitCode === 5
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});