import { AnalysisApiError } from './analysisErrors.js';

export const MAX_CODE_SIZE = 512 * 1024;
export const MAX_LANGUAGE_LENGTH = 40;
export const SUPPORTED_LANGUAGES = new Set([
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust',
  'php', 'ruby', 'swift', 'kotlin', 'css', 'html', 'sql', 'shell', 'powershell',
  'json', 'yaml', 'xml', 'toml', 'markdown', 'plaintext'
]);

export function validateAnalysisRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AnalysisApiError(400, 'INVALID_REQUEST', 'A JSON object is required.');
  }

  const { code, language } = body;
  if (typeof code !== 'string' || typeof language !== 'string') {
    throw new AnalysisApiError(400, 'INVALID_REQUEST', 'Code and language are required.');
  }
  if (!code.trim()) {
    throw new AnalysisApiError(400, 'EMPTY_CODE', 'Code cannot be empty.');
  }
  if (language.length > MAX_LANGUAGE_LENGTH) {
    throw new AnalysisApiError(400, 'UNSUPPORTED_LANGUAGE', 'Language name is too long.');
  }
  if (!SUPPORTED_LANGUAGES.has(language.toLowerCase())) {
    throw new AnalysisApiError(400, 'UNSUPPORTED_LANGUAGE', `Language "${language}" is not supported.`);
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE) {
    throw new AnalysisApiError(413, 'CODE_TOO_LARGE', 'Code must be 512 KB or smaller.');
  }

  return { code, language: language.toLowerCase() };
}