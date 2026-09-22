import test from 'node:test';
import assert from 'node:assert/strict';

import { AnalysisApiError } from './analysisErrors.js';
import { validateAnalysisRequest } from './analysisValidation.js';

const validRequest = {
  code: 'function add(a, b) { return a + b; }',
  language: 'javascript',
};

test('accepts a valid request', () => {
  const result = validateAnalysisRequest(validRequest);
  assert.deepEqual(result, { code: validRequest.code, language: 'javascript' });
});

test('rejects empty code', () => {
  assert.throws(
    () => validateAnalysisRequest({ code: '   ', language: 'javascript' }),
    (error) => error instanceof AnalysisApiError && error.code === 'EMPTY_CODE'
  );
});

test('rejects unsupported languages', () => {
  assert.throws(
    () => validateAnalysisRequest({ code: 'console.log(1)', language: 'fortran' }),
    (error) => error instanceof AnalysisApiError && error.code === 'UNSUPPORTED_LANGUAGE'
  );
});

test('rejects oversized code', () => {
  const oversized = { code: 'x'.repeat(512 * 1024 + 1), language: 'javascript' };
  assert.throws(
    () => validateAnalysisRequest(oversized),
    (error) => error instanceof AnalysisApiError && error.code === 'CODE_TOO_LARGE'
  );
});

test('rejects malformed payloads', () => {
  assert.throws(
    () => validateAnalysisRequest(null),
    (error) => error instanceof AnalysisApiError && error.code === 'INVALID_REQUEST'
  );
});
