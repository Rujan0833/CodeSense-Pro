import OpenAI from 'openai';
import type { CodeAnalysis, AnalysisRequest } from '../types/analysis';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
}

const openai = new OpenAI({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true
});

export async function analyzeCode(request: AnalysisRequest): Promise<CodeAnalysis> {
  const { code, language } = request;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file');
  }

  const systemPrompt = `You are a code review assistant. Analyze code for quality, security, performance, and best practices. 
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

  const userPrompt = `Analyze the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive analysis with issues, suggestions, and a quality score.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as CodeAnalysis;
    return analysis;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to analyze code. Please check your API key and try again.');
  }
}