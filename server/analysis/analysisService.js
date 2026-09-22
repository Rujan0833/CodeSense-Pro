import { randomUUID } from 'node:crypto';
import { AnalysisApiError } from './analysisErrors.js';
import { analyzeWithProvider } from './analysisProvider.js';

export async function analyzeCodeServer({ code, language, requestId = randomUUID() }) {
  if (typeof code !== 'string' || typeof language !== 'string') {
    throw new AnalysisApiError(400, 'INVALID_REQUEST', 'Code and language are required.');
  }

  const analysis = await analyzeWithProvider({ code, language });

  return {
    analysis,
    meta: {
      language,
      codeSize: Buffer.byteLength(code, 'utf8'),
      requestId,
    },
  };
}
