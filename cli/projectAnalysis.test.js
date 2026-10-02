import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { discoverProjectFiles, analyzeProject } from './projectAnalysis.js';

test('discovers supported project files and ignores ignored directories', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'codesense-project-'));
  const appDir = join(directory, 'src');
  const nestedDir = join(appDir, 'nested');
  await mkdir(nestedDir, { recursive: true });
  await mkdir(join(directory, 'node_modules', 'ignored'), { recursive: true });
  await mkdir(join(directory, 'dist'), { recursive: true });
  await writeFile(join(appDir, 'index.js'), 'const a = 1;\n', 'utf8');
  await writeFile(join(nestedDir, 'helper.ts'), 'export const b = 2;\n', 'utf8');
  await writeFile(join(directory, 'node_modules', 'ignored', 'bad.js'), 'ignored', 'utf8');
  await writeFile(join(directory, 'dist', 'bundle.js'), 'ignored', 'utf8');

  try {
    const files = await discoverProjectFiles(directory);
    const relativePaths = files.map((file) => file.relativePath).sort();
    assert.deepEqual(relativePaths, ['src/index.js', 'src/nested/helper.ts']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects projects that exceed the project size limit', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'codesense-project-'));
  const filePath = join(directory, 'big.js');
  await writeFile(filePath, 'const x = ' + '1,'.repeat(6 * 1024 * 1024), 'utf8');

  try {
    await assert.rejects(
      analyzeProject({
        rootPath: directory,
        endpoint: 'http://localhost:5173/api/analyze',
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({
            analysis: { summary: 'ok', issues: [], suggestions: [], score: 100, language: 'javascript' },
            meta: { language: 'javascript', codeSize: 1, requestId: 'req-1' },
          }),
        }),
      }),
      /project exceeds/i
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
