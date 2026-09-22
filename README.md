# Code Review Tool

A web-based code analyzer that uses AI to review your code for quality issues, security problems, and best practices.

## What it does

- Paste your code into the editor
- Choose the programming language
- Get an AI-powered analysis with:
  - Quality score (0-100)
  - Detailed issues with line numbers
  - Improvement suggestions
  - Code summary
- Review GitHub pull request files in the same workflow
- Analyze multi-file project uploads in a project view

## Tech stack

- React + TypeScript
- Monaco Editor (the same editor used in VS Code)
- Tailwind CSS for styling
- Groq API for server-side analysis
- TanStack Query for API state management
- Node-based server middleware for the analysis API

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Groq API key (server-side only)

### Environment setup

Create a `.env` file in the project root and add:

```bash
GROQ_API_KEY=your_key_here
```

Optional compatibility for existing local setup:

```bash
VITE_GROQ_API_KEY=your_key_here
```

The browser should not be responsible for the Groq SDK or API key usage.

### Installation

```bash
npm install
```

### Run it

```bash
npm run dev
```

Open http://localhost:5173

## Project structure

```text
src/
├── components/
├── context/
├── features/
├── hooks/
├── lib/
├── types/
├── App.tsx
├── main.tsx
└── index.css

server/
├── analysis/
├── authMiddleware.js
├── db.js
├── github.js
└── ...
```

## Analysis API contract

All analysis requests use the same server route:

```http
POST /api/analyze
```

Request:

```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

Success response:

```json
{
  "analysis": {
    "summary": "...",
    "issues": [],
    "suggestions": [],
    "score": 92,
    "language": "javascript"
  },
  "meta": {
    "language": "javascript",
    "codeSize": 123,
    "requestId": "..."
  }
}
```

Error response:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Code and language are required.",
    "requestId": "..."
  }
}
```

## Validation and limits

The server enforces the following limits before calling the provider:

- empty code is rejected
- unsupported language is rejected
- code must be 512 KB or smaller
- request body must be 768 KB or smaller
- project file uploads are capped
- project total size is capped
- analysis requests are rate limited

## Supported languages

JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, CSS, HTML, SQL, Shell, PowerShell, JSON, YAML, XML, TOML, Markdown, Plaintext

## Development

```bash
npm run dev
npm run build
npm run preview
npm run test:analysis
```

## Build

The project builds successfully with TypeScript strict mode enabled and the server analysis route is validated through the project build and focused Node tests.
