import test from 'node:test';
import assert from 'node:assert/strict';

import { getExitCodeForResult, renderAnalysisOutput, renderProjectOutput } from './output.js';

test('renders a single-file response as JSON', () => {
  const output = renderAnalysisOutput({
    filePath: 'src/app.js',
    language: 'javascript',
    analysis: {
      summary: 'Looks good.',
      issues: [{ line: 4, severity: 'warning', message: 'Minor issue', suggestion: 'Fix it.' }],
      suggestions: ['Refactor later.'],
      score: 90,
      language: 'javascript',
    },
  }, 'json');

  const parsed = JSON.parse(output);
  assert.equal(parsed.type, 'file');
  assert.equal(parsed.summary, 'Looks good.');
  assert.equal(parsed.score, 90);
  assert.equal(parsed.issues.length, 1);
});

test('renders a project response as JSON', () => {
  const output = renderProjectOutput({
    rootPath: 'src',
    fileCount: 2,
    score: 85,
    issueCount: 3,
    results: [
      { filePath: 'src/a.js', analysis: { summary: 'A', issues: [], suggestions: [], score: 90, language: 'javascript' } },
      { filePath: 'src/b.js', analysis: { summary: 'B', issues: [], suggestions: [], score: 80, language: 'javascript' } },
    ],
  }, 'json');

  const parsed = JSON.parse(output);
  assert.equal(parsed.type, 'project');
  assert.equal(parsed.averageScore, 85);
  assert.equal(parsed.files.length, 2);
});

test('maps issue-bearing results to exit code 1 and clean results to 0', () => {
  assert.equal(getExitCodeForResult({ analysis: { issues: [{ message: 'x' }] } }), 1);
  assert.equal(getExitCodeForResult({ analysis: { issues: [] } }), 0);
  assert.equal(getExitCodeForResult({ issueCount: 2 }), 1);
  assert.equal(getExitCodeForResult({ issueCount: 0 }), 0);
});
