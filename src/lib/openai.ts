import Groq from 'groq-sdk';
import type { CodeAnalysis, AnalysisRequest } from '../types/analysis';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  console.warn('Groq API key not found. Please set VITE_GROQ_API_KEY in your .env file');
}

const groq = new Groq({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true
});

export async function analyzeCode(request: AnalysisRequest): Promise<CodeAnalysis> {
  const { code, language } = request;

  if (!apiKey) {
    throw new Error('Groq API key not configured. Please set VITE_GROQ_API_KEY in your .env file');
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

Provide a comprehensive analysis with issues, suggestions, and a quality score. Return ONLY valid JSON, no other text.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const analysis = JSON.parse(content) as CodeAnalysis;
    return analysis;
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('Failed to analyze code. Please check your API key and try again.');
  }
}