import Groq from 'groq-sdk';
import { AnalysisApiError } from './analysisErrors.js';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  return apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: false }) : null;
}

function buildSystemPrompt() {
  return `You are a code review assistant. Analyze code for quality, security, performance, and best practices.
Return your analysis as a JSON object with the following structure:
{
  "summary": "Brief overview of the code quality",
  "issues": [
    {
      "line": number,
      "severity": "error" | "warning" | "info",
      "message": "description of the issue",
      "suggestion": "how to fix it",
      "code": "relevant code snippet"
    }
  ],
  "suggestions": ["improvement suggestions"],
  "score": number (0-100),
  "language": "programming language"
}`;
}

function buildUserPrompt(language, code) {
  return `Analyze the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive analysis with issues, suggestions, and a quality score. Return ONLY valid JSON, no other text.`;
}

export async function analyzeWithProvider({ code, language }) {
  const groq = getGroqClient();
  if (!groq) {
    throw new AnalysisApiError(503, 'ANALYSIS_PROVIDER_NOT_CONFIGURED', 'The analysis service is not configured on the server.');
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(language, code) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new AnalysisApiError(502, 'ANALYSIS_PROVIDER_ERROR', 'No response was returned by the analysis provider.');
    }

    const parsed = JSON.parse(content);

    if (!parsed || typeof parsed !== 'object' || typeof parsed.score !== 'number' || !Array.isArray(parsed.issues)) {
      throw new AnalysisApiError(502, 'ANALYSIS_PROVIDER_ERROR', 'The analysis provider returned an invalid payload.');
    }

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Code analysis completed.',
      issues: parsed.issues.map((issue) => ({
        line: Number(issue?.line ?? 0),
        severity: issue?.severity === 'error' || issue?.severity === 'warning' || issue?.severity === 'info' ? issue.severity : 'info',
        message: typeof issue?.message === 'string' ? issue.message : 'Issue detected.',
        suggestion: typeof issue?.suggestion === 'string' ? issue.suggestion : undefined,
        code: typeof issue?.code === 'string' ? issue.code : undefined,
      })),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((item) => typeof item === 'string') : [],
      score: Number(parsed.score),
      language: typeof parsed.language === 'string' ? parsed.language : language,
    };
  } catch (error) {
    if (error instanceof AnalysisApiError) {
      throw error;
    }

    if (error instanceof Error && error.message?.includes('API key')) {
      throw new AnalysisApiError(503, 'ANALYSIS_PROVIDER_NOT_CONFIGURED', 'The analysis service is not configured on the server.');
    }

    throw new AnalysisApiError(502, 'ANALYSIS_PROVIDER_ERROR', 'The analysis service failed to generate a result.');
  }
}
