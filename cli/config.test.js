import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCliConfig } from './config.js';

test('uses the local development URL by default', () => {
  assert.deepEqual(loadCliConfig({}, {}), {
    serverUrl: 'http://localhost:5173',
    analysisEndpoint: 'http://localhost:5173/api/analyze',
    source: 'default',
  });
});

test('uses and normalizes the environment URL', () => {
  const config = loadCliConfig({}, { CODESENSE_API_URL: 'https://codesense.example/' });

  assert.equal(config.serverUrl, 'https://codesense.example');
  assert.equal(config.analysisEndpoint, 'https://codesense.example/api/analyze');
  assert.equal(config.source, 'CODESENSE_API_URL');
});

test('command option takes precedence over environment configuration', () => {
  const config = loadCliConfig(
    { serverUrl: 'http://127.0.0.1:4173' },
    { CODESENSE_API_URL: 'https://codesense.example' }
  );

  assert.equal(config.analysisEndpoint, 'http://127.0.0.1:4173/api/analyze');
  assert.equal(config.source, 'command option');
});

test('rejects unsupported URL protocols', () => {
  assert.throws(() => loadCliConfig({ serverUrl: 'file:///tmp' }), /must use http or https/);
});

test('rejects URLs with paths, credentials, query strings, or fragments', () => {
  assert.throws(() => loadCliConfig({ serverUrl: 'https://user:pass@example.com' }), /must be an origin/);
  assert.throws(() => loadCliConfig({ serverUrl: 'https://example.com/api' }), /must be an origin/);
  assert.throws(() => loadCliConfig({ serverUrl: 'https://example.com?debug=1' }), /must be an origin/);
});