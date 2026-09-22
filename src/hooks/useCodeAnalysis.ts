import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeCode } from '../lib/analysisService';
import type { AnalysisRequest } from '../types/analysis';

export function useCodeAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AnalysisRequest) => analyzeCode(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['analysis'], data);
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
    },
  });
}