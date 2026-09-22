import { createRequestId, sendAnalysisError } from './analysisErrors.js';
import { analyzeCodeServer } from './analysisService.js';
import { checkRateLimit } from './rateLimiter.js';
import { validateAnalysisRequest } from './analysisValidation.js';

const MAX_REQUEST_BYTES = 768 * 1024;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodyBytes = 0;

    req.on('data', (chunk) => {
      bodyBytes += Buffer.byteLength(chunk);
      if (bodyBytes > MAX_REQUEST_BYTES) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Malformed JSON request body.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleAnalysisRequest(req, res) {
  const requestId = createRequestId();

  try {
    checkRateLimit(req);
    const request = validateAnalysisRequest(await readJsonBody(req));
    const response = await analyzeCodeServer({ ...request, requestId });
    return sendJson(res, 200, response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Request body is too large.') {
      return sendAnalysisError(res, requestId, { status: 413, code: 'REQUEST_TOO_LARGE', message: error.message });
    }
    if (error instanceof Error && error.message === 'Malformed JSON request body.') {
      return sendAnalysisError(res, requestId, { status: 400, code: 'INVALID_REQUEST', message: error.message });
    }
    return sendAnalysisError(res, requestId, error);
  }
}