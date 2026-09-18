import React, { useState } from 'react';
import type { CodeAnalysis } from '../types/analysis';

interface PrintAnalysisReportProps {
  analysis: CodeAnalysis;
  code: string;
  createdAt?: string;
}

const PrintAnalysisReport: React.FC<PrintAnalysisReportProps> = ({ analysis, code, createdAt }) => {
  const [reportGeneratedAt] = useState(() => new Date().toISOString());

  return (
    <article className="print-report">
    <h1>CodeSense Analysis Report</h1>
    <p>Generated: {new Date(createdAt || reportGeneratedAt).toLocaleString()}</p>
    <p>Language: {analysis.language} | Quality score: {analysis.score}/100</p>
    <h2>Summary</h2>
    <p>{analysis.summary}</p>
    <h2>Issues</h2>
    {analysis.issues?.length ? analysis.issues.map((issue, index) => (
      <section key={`${issue.line}-${index}`}>
        <h3>{issue.message}</h3>
        <p>Severity: {issue.severity} | Line: {issue.line}</p>
        {issue.suggestion && <p>Suggestion: {issue.suggestion}</p>}
        {issue.code && <pre>{issue.code}</pre>}
      </section>
    )) : <p>No issues found.</p>}
    <h2>Suggestions</h2>
    {analysis.suggestions?.length ? (
      <ul>{analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul>
    ) : <p>No specific improvements proposed.</p>}
    <h2>Analyzed code</h2>
    <pre>{code}</pre>
    </article>
  );
};

export default PrintAnalysisReport;
