import type {
  AnalysisComparison,
  AnalysisHistoryEntry,
  AnalysisSnapshot,
  CodeIssue,
  DiffLine,
} from '../types/analysis';

function issueKey(issue: CodeIssue) {
  return `${issue.severity}:${issue.line}:${issue.message}`;
}

function buildDiff(previousCode: string, currentCode: string): DiffLine[] {
  const previousLines = previousCode.split('\n');
  const currentLines = currentCode.split('\n');
  const rows = Array.from({ length: previousLines.length + 1 }, () =>
    Array<number>(currentLines.length + 1).fill(0)
  );

  for (let oldIndex = previousLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = currentLines.length - 1; newIndex >= 0; newIndex -= 1) {
      rows[oldIndex][newIndex] = previousLines[oldIndex] === currentLines[newIndex]
        ? rows[oldIndex + 1][newIndex + 1] + 1
        : Math.max(rows[oldIndex + 1][newIndex], rows[oldIndex][newIndex + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < previousLines.length || newIndex < currentLines.length) {
    if (
      oldIndex < previousLines.length &&
      newIndex < currentLines.length &&
      previousLines[oldIndex] === currentLines[newIndex]
    ) {
      lines.push({ type: 'unchanged', content: currentLines[newIndex], oldLine: oldIndex + 1, newLine: newIndex + 1 });
      oldIndex += 1;
      newIndex += 1;
    } else if (
      newIndex < currentLines.length &&
      (oldIndex >= previousLines.length || rows[oldIndex][newIndex + 1] >= rows[oldIndex + 1][newIndex])
    ) {
      lines.push({ type: 'added', content: currentLines[newIndex], newLine: newIndex + 1 });
      newIndex += 1;
    } else {
      lines.push({ type: 'removed', content: previousLines[oldIndex], oldLine: oldIndex + 1 });
      oldIndex += 1;
    }
  }

  return lines;
}

export function compareAnalyses(previous: AnalysisHistoryEntry, current: AnalysisSnapshot): AnalysisComparison {
  const previousIssues = new Map(previous.analysis.issues.map((issue) => [issueKey(issue), issue]));
  const currentIssues = new Map(current.analysis.issues.map((issue) => [issueKey(issue), issue]));

  return {
    previous,
    current,
    scoreDelta: current.analysis.score - previous.analysis.score,
    fixedIssues: previous.analysis.issues.filter((issue) => !currentIssues.has(issueKey(issue))),
    newIssues: current.analysis.issues.filter((issue) => !previousIssues.has(issueKey(issue))),
    unchangedIssues: current.analysis.issues.filter((issue) => previousIssues.has(issueKey(issue))),
    codeLines: buildDiff(previous.code, current.code),
  };
}