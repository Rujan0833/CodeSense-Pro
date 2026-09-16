import React from 'react';
import { AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import Button from './ui/Button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  isDark?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, isDark = false }) => {
  const isApiKeyIssue = error.toLowerCase().includes('api key') || error.toLowerCase().includes('openai');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
      {/* Glow icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rose-500/15 blur-xl animate-pulse" />
        <div className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md ${
          isDark 
            ? 'bg-rose-500/10 border-rose-500/30' 
            : 'bg-rose-50 border-rose-200'
        }`}>
          {isApiKeyIssue ? (
            <KeyRound className="w-7 h-7 text-rose-500" />
          ) : (
            <AlertCircle className="w-7 h-7 text-rose-500" />
          )}
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className={`text-lg font-semibold tracking-tight ${
          isDark ? 'text-white' : 'text-neutral-900'
        }`}>
          Analysis Encountered an Issue
        </h3>
        <p className={`text-sm leading-relaxed ${
          isDark ? 'text-neutral-400' : 'text-neutral-600'
        }`}>
          {error}
        </p>
        {isApiKeyIssue && (
          <p className={`text-xs rounded-xl p-3 mt-2 font-mono border ${
            isDark 
              ? 'bg-white/[0.03] border-white/5 text-neutral-400' 
              : 'bg-black/[0.03] border-black/5 text-neutral-600'
          }`}>
            Ensure <code className="text-rose-500 font-semibold">VITE_OPENAI_API_KEY</code> is configured in your <code className="font-semibold">.env</code> file.
          </p>
        )}
      </div>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry} isDark={isDark} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;