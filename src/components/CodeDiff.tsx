import React from 'react';
import type { DiffLine } from '../types/analysis';

interface CodeDiffProps {
  lines: DiffLine[];
  isDark?: boolean;
}

const CodeDiff: React.FC<CodeDiffProps> = ({ lines, isDark = false }) => {
  const hasChanges = lines.some((line) => line.type !== 'unchanged');

  if (!hasChanges) {
    return (
      <div className={`rounded-2xl border p-5 text-center text-sm ${
        isDark ? 'border-white/[0.08] text-neutral-400' : 'border-black/[0.08] text-neutral-500'
      }`}>
        No code changes between these analyses.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border font-mono text-xs ${
      isDark ? 'border-white/[0.08] bg-[#07070a]' : 'border-black/[0.08] bg-[#f7f7f8]'
    }`}>
      {lines.map((line, index) => {
        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        const tone = line.type === 'added'
          ? isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
          : line.type === 'removed'
            ? isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-800'
            : isDark ? 'text-neutral-400' : 'text-neutral-600';

        return (
          <div key={`${line.type}-${index}`} className={`flex min-w-max px-3 py-1 ${tone}`}>
            <span className="w-14 shrink-0 opacity-50">{line.oldLine || ''}:{line.newLine || ''}</span>
            <span className="w-4 shrink-0 font-bold">{prefix}</span>
            <span className="whitespace-pre">{line.content || ' '}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CodeDiff;