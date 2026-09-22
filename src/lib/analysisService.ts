import type { AnalysisApiErrorResponse, AnalysisRequest, AnalysisResponse, CodeAnalysis } from '../types/analysis';

export async function analyzeCode(request: AnalysisRequest, signal?: AbortSignal): Promise<CodeAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  const data = (await response.json()) as AnalysisResponse | AnalysisApiErrorResponse;

  if (!response.ok) {
    const message = 'error' in data ? data.error.message : 'Analysis request failed.';
    throw new Error(message);
  }

  if (!('analysis' in data) || !('meta' in data)) {
    throw new Error('Analysis response was invalid.');
  }

  return data.analysis;
}
