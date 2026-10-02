#!/usr/bin/env node

import { loadCliConfig } from './config.js';
import { analyzeFile, CliAnalysisError } from './analyzeFile.js';
import { analyzeProject } from './projectAnalysis.js';
import { renderAnalysisOutput, renderProjectOutput } from './output.js';
const HELP_TEXT = `CodeSense CLI

Usage:
  codesense <command> [options]
  codesense analyze <file> [--language NAME] [--server-url URL]

Commands:
  analyze <file>    Analyze one source file or directory
  config            Show the configured analysis server
  help              Show this help message

Options:
  --language NAME   Override the file language for analyze
  --server-url URL  Set the analysis server
  --format FORMAT   Output format: human or json (default: human)
  -h, --help        Show this help message

The default server is http://localhost:5173. Set CODESENSE_API_URL to override it.
`;

const args = process.argv.slice(2);

function printAnalysis(result, format = 'human') {
  process.stdout.write(`${renderAnalysisOutput(result, format)}\n`);
  process.exitCode = result.analysis.issues.length > 0 ? 1 : 0;
}

function printProjectSummary(result, format = 'human') {
  process.stdout.write(`${renderProjectOutput(result, format)}\n`);
  process.exitCode = result.issueCount > 0 ? 1 : 0;
}

async function main() {
if (args.length === 0 || args.length === 1 && ['help', '-h', '--help'].includes(args[0])) {
  process.stdout.write(HELP_TEXT);
} else if (args[0] === 'config') {
  let serverUrl;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] !== '--server-url' || !args[index + 1] || args[index + 1].startsWith('--')) {
      process.stderr.write(`Invalid config option: ${args[index]}\n\n${HELP_TEXT}`);
      process.exitCode = 2;
      break;
    }
    serverUrl = args[index + 1];
    index += 1;
  }

  if (process.exitCode !== 2) {
    try {
      const config = loadCliConfig({ serverUrl });
      process.stdout.write(`Analysis server: ${config.serverUrl}\nEndpoint: ${config.analysisEndpoint}\nSource: ${config.source}\n`);
    } catch (error) {
      process.stderr.write(`Configuration error: ${error.message}\n`);
      process.exitCode = 2;
    }
  }
} else if (args[0] === 'analyze') {
  const filePath = args[1];
  const options = { format: 'human' };
  let optionError;

  if (!filePath || filePath.startsWith('--')) {
    optionError = 'A file path is required.';
  }
  for (let index = 2; !optionError && index < args.length; index += 1) {
    if (args[index] === '--language' || args[index] === '--server-url' || args[index] === '--format') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        optionError = `A value is required after ${args[index]}.`;
        break;
      }
      if (args[index] === '--language') options.language = value;
      else if (args[index] === '--server-url') options.serverUrl = value;
      else {
        const normalizedFormat = value.toLowerCase();
        if (normalizedFormat !== 'human' && normalizedFormat !== 'json') {
          optionError = 'The output format must be either human or json.';
          break;
        }
        options.format = normalizedFormat;
      }
      index += 1;
    } else {
      optionError = `Unknown analyze option: ${args[index]}.`;
    }
  }

  if (optionError) {
    process.stderr.write(`${optionError}\n\n${HELP_TEXT}`);
    process.exitCode = 2;
  } else {
    let config;
    try {
      config = loadCliConfig({ serverUrl: options.serverUrl });
    } catch (error) {
      process.stderr.write(`Configuration error: ${error.message}\n`);
      process.exitCode = 2;
    }

    if (process.exitCode !== 2) {
      try {
        const targetStats = await import('node:fs/promises').then(({ stat }) => stat(filePath).catch(() => null));
        if (targetStats && targetStats.isDirectory()) {
          const result = await analyzeProject({ rootPath: filePath, endpoint: config.analysisEndpoint });
          printProjectSummary(result, options.format);
          return;
        }

        const result = await analyzeFile({ filePath, language: options.language, endpoint: config.analysisEndpoint });
        printAnalysis(result, options.format);
      } catch (error) {
        if (error instanceof CliAnalysisError) {
          process.stderr.write(`${error.message}\n`);
          process.exitCode = error.exitCode;
        } else {
          process.stderr.write(`Analysis failed: ${error.message}\n`);
          process.exitCode = 5;
        }
      }
    }
  }
} else {
  process.stderr.write(`Unknown command: ${args[0]}\n\n${HELP_TEXT}`);
  process.exitCode = 2;
}
}

main();