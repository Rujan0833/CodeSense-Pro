import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeCode } from '../../../lib/openai';
import type { CodeAnalysis } from '../../../types/analysis';
import type { ProjectFile } from '../types';

export interface ProjectFileResult {
  fileId: string;
  path: string;
  size: number;
  analysis: CodeAnalysis;
}

interface UseProjectAnalysisOptions {
  onFileAnalyzed?: (file: ProjectFile, analysis: CodeAnalysis) => void;
  userId?: string;
}

function getStorageKey(userId: string) {
  return `codesense_project_results_${userId}`;
}

function readStoredResults(userId: string): ProjectFileResult[] {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return JSON.parse(stored) as ProjectFileResult[];
  } catch {
    // Continue without saved results when storage is unavailable or malformed.
  }
  return [];
}

export function useProjectAnalysis({ onFileAnalyzed, userId = 'anonymous' }: UseProjectAnalysisOptions = {}) {
  const [results, setResults] = useState<ProjectFileResult[]>(() => readStoredResults(userId));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'cancelled' | 'failed'>('idle');
  const cancelRef = useRef(false);

  useEffect(() => {
    try {
      if (results.length) localStorage.setItem(getStorageKey(userId), JSON.stringify(results));
      else localStorage.removeItem(getStorageKey(userId));
    } catch {
      setError('Project results could not be saved locally.');
    }
  }, [results, userId]);

  const analyzeProject = useCallback(async (files: ProjectFile[]) => {
    if (!files.length || isAnalyzing) return;
    setIsAnalyzing(true);
    setStatus('running');
    cancelRef.current = false;
    setCompletedCount(0);
    setError(null);
    setResults([]);

    const nextResults: ProjectFileResult[] = [];
    let failed = false;
    try {
      for (const file of files) {
        if (cancelRef.current) break;
        const analysis = await analyzeCode({ code: file.content, language: file.language });
        nextResults.push({ fileId: file.id, path: file.path, size: file.size, analysis });
        onFileAnalyzed?.(file, analysis);
        setResults([...nextResults]);
        setCompletedCount(nextResults.length);
      }
    } catch (analysisError) {
      failed = true;
      setError(analysisError instanceof Error ? analysisError.message : 'Project analysis failed.');
      setStatus('failed');
    } finally {
      setIsAnalyzing(false);
      if (cancelRef.current) setStatus('cancelled');
      else if (!failed) setStatus('complete');
    }
  }, [isAnalyzing, onFileAnalyzed]);

  const cancelAnalysis = useCallback(() => {
    cancelRef.current = true;
    setStatus('cancelled');
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setCompletedCount(0);
    setError(null);
    setStatus('idle');
  }, []);

  const totalSize = results.reduce((total, result) => total + Math.max(result.size, 1), 0);
  const projectScore = results.length
    ? Math.round(results.reduce((total, result) => total + result.analysis.score * Math.max(result.size, 1), 0) / totalSize)
    : null;
  const issueCount = results.reduce((total, result) => total + result.analysis.issues.length, 0);
  const riskCounts = results.reduce((counts, result) => {
    result.analysis.issues.forEach((issue) => { counts[issue.severity] += 1; });
    return counts;
  }, { error: 0, warning: 0, info: 0 });

  return { results, isAnalyzing, completedCount, error, status, projectScore, issueCount, riskCounts, analyzeProject, cancelAnalysis, clearResults };
}
