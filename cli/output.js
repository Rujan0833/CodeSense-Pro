export function getExitCodeForResult(result) {
  if (result && 'issueCount' in result) {
    return result.issueCount > 0 ? 1 : 0;
  }
  if (result && 'analysis' in result) {
    return result.analysis.issues.length > 0 ? 1 : 0;
  }
  return 0;
}

export function renderAnalysisOutput(result, format = 'human') {
  if (format === 'json') {
    return JSON.stringify({
      type: 'file',
      filePath: result.filePath,
      language: result.language,
      summary: result.analysis.summary,
      score: result.analysis.score,
      suggestions: result.analysis.suggestions,
      issues: result.analysis.issues.map((issue) => ({
        line: issue.line,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion,
        code: issue.code,
      })),
    }, null, 2);
  }

  const lines = [
    `Analysis: ${result.filePath}`,
    `Language: ${result.language}`,
    `Score: ${result.analysis.score}/100`,
    '',
    result.analysis.summary,
  ];

  if (!result.analysis.issues.length) {
    lines.push('', 'No issues reported.');
    return lines.join('\n');
  }

  lines.push('', `Issues (${result.analysis.issues.length}):`);
  for (const issue of result.analysis.issues) {
    const severity = issue.severity ? issue.severity.toUpperCase() : 'INFO';
    const lineRef = Number.isInteger(issue.line) && issue.line > 0 ? `Line ${issue.line}: ` : '';
    lines.push(`[${severity}] ${lineRef}${issue.message || 'Issue detected.'}`);
  }
  return lines.join('\n');
}

export function renderProjectOutput(result, format = 'human') {
  if (format === 'json') {
    return JSON.stringify({
      type: 'project',
      rootPath: result.rootPath,
      fileCount: result.fileCount,
      averageScore: result.score,
      issueCount: result.issueCount,
      files: result.results.map((file) => ({
        filePath: file.filePath,
        language: file.language,
        score: file.analysis.score,
        summary: file.analysis.summary,
        issues: file.analysis.issues.length,
      })),
    }, null, 2);
  }

  const lines = [
    `Project: ${result.rootPath}`,
    `Files analyzed: ${result.fileCount}`,
    `Average score: ${result.score}/100`,
    `Issues found: ${result.issueCount}`,
    '',
  ];

  for (const file of result.results) {
    lines.push(`${file.filePath}: ${file.analysis.score}/100`);
  }
  return lines.join('\n');
}
