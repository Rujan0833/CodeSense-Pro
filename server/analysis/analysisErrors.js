import { randomUUID } from 'node:crypto';

export class AnalysisApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AnalysisApiError';
    this.status = status;
    this.code = code;
  }
}

export function createRequestId() {
  return randomUUID();
}

export function sendAnalysisError(res, requestId, error) {
  const isStructuredError = error instanceof AnalysisApiError || (
    error && typeof error === 'object' && typeof error.status === 'number' && typeof error.code === 'string'
  );
  const status = isStructuredError ? error.status : 500;
  const code = isStructuredError ? error.code : 'INTERNAL_ERROR';
  const message = isStructuredError && typeof error.message === 'string' ? error.message : 'Analysis request failed.';

  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: { code, message, requestId } }));
}