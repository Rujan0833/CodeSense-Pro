import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';

const MAX_CODE_SIZE = 512 * 1024;

export class CliAnalysisError extends Error {
  constructor({ code, message, exitCode, cause }) {
    super(message);
    this.name = 'CliAnalysisError';
    this.code = code;
    this.exitCode = exitCode;
    this.cause = cause;
  }
}

const LANGUAGE_BY_EXTENSION = new Map([
  ['.c', 'c'],
  ['.cc', 'cpp'],
  ['.cpp', 'cpp'],
  ['.cs', 'csharp'],
  ['.cxx', 'cpp'],
  ['.css', 'css'],
  ['.cjs', 'javascript'],
  ['.go', 'go'],
  ['.h', 'c'],
  ['.hpp', 'cpp'],
  ['.htm', 'html'],
  ['.html', 'html'],
  ['.java', 'java'],
  ['.js', 'javascript'],
  ['.json', 'json'],
  ['.jsx', 'javascript'],
  ['.kt', 'kotlin'],
  ['.kts', 'kotlin'],
  ['.md', 'markdown'],
  ['.mjs', 'javascript'],
  ['.php', 'php'],
  ['.ps1', 'powershell'],
  ['.py', 'python'],
  ['.pyw', 'python'],
  ['.rb', 'ruby'],
  ['.rs', 'rust'],
  ['.sh', 'shell'],
  ['.sql', 'sql'],
  ['.swift', 'swift'],
  ['.toml', 'toml'],
  ['.ts', 'typescript'],
  ['.tsx', 'typescript'],
  ['.xml', 'xml'],
  ['.yaml', 'yaml'],
  ['.yml', 'yaml'],
]);

const SUPPORTED_LANGUAGES = new Set([
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust',
  'php', 'ruby', 'swift', 'kotlin', 'css', 'html', 'sql', 'shell', 'powershell',
  'json', 'yaml', 'xml', 'toml', 'markdown', 'plaintext',
]);

export function resolveLanguage(filePath, languageOverride) {
  const language = languageOverride?.trim().toLowerCase()
    || LANGUAGE_BY_EXTENSION.get(extname(filePath).toLowerCase());

  if (!language) {
    throw new Error(`Cannot detect a supported language for "${filePath}". Specify one with --language.`);
  }
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error(`Unsupported language: "${language}".`);
  }

  return language;
}

async function requestAnalysis({ code, language, endpoint, fetchImpl = fetch }) {
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new CliAnalysisError({
        code: 'INVALID_SERVER_RESPONSE',
        message: 'The analysis server returned invalid JSON.',
        exitCode: 5,
      });
    }

    if (!response.ok) {
      const errorCode = typeof payload?.error?.code === 'string' ? payload.error.code : 'ANALYSIS_REQUEST_FAILED';
      const message = typeof payload?.error?.message === 'string'
        ? payload.error.message
        : `Analysis request failed with status ${response.status}.`;
      const exitCode = response.status === 400 || response.status === 413 || response.status === 429 ? 2 : 5;

      throw new CliAnalysisError({
        code: errorCode,
        message,
        exitCode,
      });
    }

    const analysis = payload?.analysis;
    if (!analysis || typeof analysis.summary !== 'string' || typeof analysis.score !== 'number' || !Array.isArray(analysis.issues)) {
      throw new CliAnalysisError({
        code: 'INVALID_SERVER_RESPONSE',
        message: 'The analysis server returned an invalid response.',
        exitCode: 5,
      });
    }

    return analysis;
  } catch (error) {
    if (error instanceof CliAnalysisError) {
      throw error;
    }
    throw new CliAnalysisError({
      code: 'NETWORK_ERROR',
      message: error instanceof Error && error.message ? error.message : 'Unable to reach the analysis server.',
      exitCode: 4,
      cause: error,
    });
  }
}

export async function analyzeFile({ filePath, language, endpoint, fetchImpl = fetch }) {
  const resolvedLanguage = resolveLanguage(filePath, language);
  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: `Cannot access file: "${filePath}".`,
      exitCode: 3,
    });
  }

  if (!fileStats.isFile()) {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: `Not a regular file: "${filePath}".`,
      exitCode: 3,
    });
  }
  if (fileStats.size > MAX_CODE_SIZE) {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: 'File exceeds the 512 KB analysis limit.',
      exitCode: 3,
    });
  }

  let code;
  try {
    code = await readFile(filePath, 'utf8');
  } catch {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: `Cannot read file: "${filePath}".`,
      exitCode: 3,
    });
  }
  if (!code.trim()) {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: 'The file is empty.',
      exitCode: 3,
    });
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE) {
    throw new CliAnalysisError({
      code: 'FILE_ERROR',
      message: 'File exceeds the 512 KB analysis limit.',
      exitCode: 3,
    });
  }

  const analysis = await requestAnalysis({ code, language: resolvedLanguage, endpoint, fetchImpl });
  return { filePath, language: resolvedLanguage, analysis };
}