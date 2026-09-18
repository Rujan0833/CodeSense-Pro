import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalysisHistoryEntry, CodeAnalysis } from '../types/analysis';

const HISTORY_QUERY_KEY = ['analysis-history'];

async function historyRequest<T>(token: string, endpoint = '/api/history', input?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...input,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...input?.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Analysis history request failed.');
  }

  return data;
}

export function useAnalysisHistory(token: string | null) {
  const queryClient = useQueryClient();
  const historyQuery = useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: async () => {
      const data = await historyRequest<{ history: AnalysisHistoryEntry[] }>(token!);
      return data.history;
    },
    enabled: !!token,
  });

  const saveHistory = useMutation({
    mutationFn: async ({ code, language, analysis }: { code: string; language: string; analysis: CodeAnalysis }) => {
      const data = await historyRequest<{ entry: AnalysisHistoryEntry }>(token!, '/api/history', {
        method: 'POST',
        body: JSON.stringify({ code, language, analysis }),
      });
      return data.entry;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<AnalysisHistoryEntry[]>(HISTORY_QUERY_KEY, (current = []) => {
        if (current.some((existing) => existing.id === entry.id)) return current;
        return [entry, ...current];
      });
      void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
    },
  });

  const deleteHistory = useMutation({
    mutationFn: async (historyId: string) => {
      await historyRequest<{ success: boolean }>(token!, `/api/history/${historyId}`, {
        method: 'DELETE',
        headers: {},
      });
      return historyId;
    },
    onSuccess: (historyId) => {
      queryClient.setQueryData<AnalysisHistoryEntry[]>(HISTORY_QUERY_KEY, (current = []) =>
        current.filter((entry) => entry.id !== historyId)
      );
    },
  });

  return {
    history: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    saveHistory,
    deleteHistory,
  };
}

export function useGitHubReviewHistory(token: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['github-review-history'];
  const historyQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await historyRequest<{ history: import('../types/analysis').GitHubReviewHistoryEntry[] }>(token!, '/api/github/review-history');
      return data.history;
    },
    enabled: !!token,
  });

  const saveReview = useMutation({
    mutationFn: async (review: { repository: string; pullNumber: number; filename: string; code: string; analysis: CodeAnalysis }) => {
      const data = await historyRequest<{ entry: import('../types/analysis').GitHubReviewHistoryEntry }>(token!, '/api/github/review-history', {
        method: 'POST',
        body: JSON.stringify(review),
      });
      return data.entry;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<import('../types/analysis').GitHubReviewHistoryEntry[]>(queryKey, (current = []) => [entry, ...current]);
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      await historyRequest<{ success: boolean }>(token!, `/api/github/review-history/${reviewId}`, { method: 'DELETE', headers: {} });
      return reviewId;
    },
    onSuccess: (reviewId) => {
      queryClient.setQueryData<import('../types/analysis').GitHubReviewHistoryEntry[]>(queryKey, (current = []) => current.filter((entry) => entry.id !== reviewId));
    },
  });

  return { history: historyQuery.data || [], isLoading: historyQuery.isLoading, error: historyQuery.error, saveReview, deleteReview };
}
