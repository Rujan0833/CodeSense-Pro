export interface CodeAnalysis {
  summary: string;
  issues: CodeIssue[];
  suggestions: string[];
  score: number; // 0-100 quality score
  language: string;
}

export interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  code?: string;
}

export interface AnalysisRequest {
  code: string;
  language: string;
}

export interface AnalysisResponse {
  analysis: CodeAnalysis;
  meta: {
    language: string;
    codeSize: number;
    requestId: string;
  };
}

export interface AnalysisApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export interface AnalysisHistoryEntry {
  id: string;
  userId: string;
  code: string;
  language: string;
  fingerprint?: string;
  analysis: CodeAnalysis;
  createdAt: string;
}

export interface GitHubReviewHistoryEntry {
  id: string;
  userId: string;
  repository: string;
  pullNumber: number;
  filename: string;
  code: string;
  score: number;
  analysis: CodeAnalysis;
  createdAt: string;
}

export interface AnalysisSnapshot {
  code: string;
  language: string;
  analysis: CodeAnalysis;
  createdAt?: string;
}

export interface AnalysisComparison {
  previous: AnalysisHistoryEntry;
  current: AnalysisSnapshot;
  scoreDelta: number;
  fixedIssues: CodeIssue[];
  newIssues: CodeIssue[];
  unchangedIssues: CodeIssue[];
  codeLines: DiffLine[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLine?: number;
  newLine?: number;
}