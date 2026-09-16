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

## Tech stack

- React + TypeScript
- Monaco Editor (the same editor used in VS Code)
- Tailwind CSS for styling
- Groq API for code analysis (free tier available)
- TanStack Query for API state management

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Groq API key (free)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your Groq API key to .env
# Get one from https://console.groq.com/keys
```

### Run it

```bash
npm run dev
```

Open http://localhost:5173

## Project structure

```
src/
├── components/      # React components
├── hooks/          # Custom React hooks
├── lib/            # API clients
├── types/          # TypeScript types
└── App.tsx         # Main app
```

## Supported languages

JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, PHP, Ruby, Swift, Kotlin

## API costs

This uses Groq's free API tier. Generous free limits for testing and development. Check Groq's current pricing for production usage.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Build

The project builds successfully with TypeScript strict mode enabled. All type errors have been resolved and the production build is optimized.
