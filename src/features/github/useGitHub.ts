import { useCallback, useEffect, useState } from 'react';
import type { GitHubPullRequest, GitHubPullRequestFile, GitHubRepository } from './types';

async function githubRequest<T>(token: string, endpoint: string): Promise<T> {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'GitHub request failed.');
  return data;
}

export function useGitHubRepositories(token: string | null, connected: boolean) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    if (!token || !connected) {
      setRepositories([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await githubRequest<{ repositories: GitHubRepository[] }>(token, '/api/github/repositories');
      setRepositories(data.repositories);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load GitHub repositories.');
    } finally {
      setIsLoading(false);
    }
  }, [connected, token]);

  useEffect(() => {
    void loadRepositories();
  }, [loadRepositories]);

  return { repositories, isLoading, error, reload: loadRepositories };
}

export function useGitHubPullRequests(token: string | null, repository: string | null) {
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPullRequests = useCallback(async () => {
    if (!token || !repository) {
      setPullRequests([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await githubRequest<{ pullRequests: GitHubPullRequest[] }>(
        token,
        `/api/github/pull-requests?repository=${encodeURIComponent(repository)}`
      );
      setPullRequests(data.pullRequests);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load pull requests.');
    } finally {
      setIsLoading(false);
    }
  }, [repository, token]);

  useEffect(() => {
    void loadPullRequests();
  }, [loadPullRequests]);

  return { pullRequests, isLoading, error, reload: loadPullRequests };
}

export function useGitHubPullRequestFiles(token: string | null, repository: string | null, pullNumber: number | null) {
  const [files, setFiles] = useState<GitHubPullRequestFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!token || !repository || !pullNumber) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await githubRequest<{ files: GitHubPullRequestFile[] }>(
        token,
        `/api/github/pull-request-files?repository=${encodeURIComponent(repository)}&pullNumber=${pullNumber}`
      );
      setFiles(data.files);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load changed files.');
    } finally {
      setIsLoading(false);
    }
  }, [pullNumber, repository, token]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  return { files, isLoading, error, reload: loadFiles };
}
