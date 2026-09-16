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