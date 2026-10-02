import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { analyzeFile, CliAnalysisError, resolveLanguage } from './analyzeFile.js';

export const MAX_FILES = 50;
export const MAX_PROJECT_SIZE = 5 * 1024 * 1024;
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.venv', 'coverage', '__pycache__']);

export async function discoverProjectFiles(rootPath) {
  const files = [];
  const seen = new Set();

  async function walk(currentPath) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
      }

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        await walk(join(currentPath, entry.name));
        continue;
      }

      if (!entry.isFile()) continue;

      try {
        resolveLanguage(entry.name);
      } catch {
        continue;
      }

      const filePath = join(currentPath, entry.name);
      const fileStats = await stat(filePath);
      const relativePath = relative(rootPath, filePath).replace(/\\/g, '/');
      if (seen.has(relativePath)) continue;
      seen.add(relativePath);
      files.push({ path: filePath, relativePath, size: fileStats.size, language: resolveLanguage(entry.name) });
    }
  }

  await walk(rootPath);
  return files;
}

export async function analyzeProject({ rootPath, endpoint, fetchImpl = fetch, language }) {
  const discoveredFiles = await discoverProjectFiles(rootPath);

  if (!discoveredFiles.length) {
    throw new CliAnalysisError({
      code: 'NO_PROJECT_FILES',
      message: 'No supported source files were found in the target directory.',
      exitCode: 3,
    });
  }

  if (discoveredFiles.length > MAX_FILES) {
    throw new CliAnalysisError({
      code: 'PROJECT_TOO_LARGE',
      message: `The project exceeds the ${MAX_FILES}-file limit for CLI analysis.`,
      exitCode: 3,
    });
  }

  const totalSize = discoveredFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_PROJECT_SIZE) {
    throw new CliAnalysisError({
      code: 'PROJECT_TOO_LARGE',
      message: `Project exceeds the ${Math.round(MAX_PROJECT_SIZE / 1024 / 1024)} MB limit.`,
      exitCode: 3,
    });
  }

  const results = [];
  let totalScore = 0;
  let issueCount = 0;
  for (const file of discoveredFiles) {
    const result = await analyzeFile({
      filePath: file.path,
      language: language || file.language,
      endpoint,
      fetchImpl,
    });
    results.push(result);
    totalScore += result.analysis.score;
    issueCount += result.analysis.issues.length;
  }

  const averageScore = results.length ? Math.round(totalScore / results.length) : 0;
  return {
    rootPath,
    fileCount: results.length,
    score: averageScore,
    issueCount,
    results,
  };
}
