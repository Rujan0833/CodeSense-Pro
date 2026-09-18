import type { CodeAnalysis } from '../types/analysis';

function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}[\]()#+.!|>])/g, '\\$1');
}

export function buildMarkdownReport(analysis: CodeAnalysis, code: string, createdAt = new Date().toISOString()) {
  const issues = analysis.issues?.length
    ? analysis.issues.map((issue) => {
        const details = [
          `- **Severity:** ${escapeMarkdown(issue.severity)}`,
          `- **Line:** ${issue.line}`,
          `- **Finding:** ${escapeMarkdown(issue.message)}`,
          issue.suggestion ? `- **Suggestion:** ${escapeMarkdown(issue.suggestion)}` : '',
          issue.code ? `\n\`\`\`${analysis.language}\n${issue.code}\n\`\`\`` : '',
        ].filter(Boolean).join('\n');
        return `### ${escapeMarkdown(issue.message)}\n\n${details}`;
      }).join('\n\n')
    : 'No issues found.';

  const suggestions = analysis.suggestions?.length
    ? analysis.suggestions.map((suggestion) => `- ${escapeMarkdown(suggestion)}`).join('\n')
    : 'No specific improvements proposed.';

  return `# CodeSense Analysis Report

- **Generated:** ${new Date(createdAt).toLocaleString()}
- **Language:** ${escapeMarkdown(analysis.language)}
- **Quality score:** ${analysis.score}/100

## Summary

${escapeMarkdown(analysis.summary)}

## Issues

${issues}

## Suggestions

${suggestions}

## Analyzed code

\`\`\`${analysis.language}
${code}
\`\`\`
`;
}

export function downloadMarkdownReport(analysis: CodeAnalysis, code: string, createdAt?: string) {
  const markdown = buildMarkdownReport(analysis, code, createdAt);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `codesense-report-${timestamp}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
