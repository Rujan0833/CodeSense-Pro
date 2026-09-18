import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Minus, X } from 'lucide-react';
import type { AnalysisComparison } from '../types/analysis';
import Badge from './ui/Badge';
import Button from './ui/Button';
import CodeDiff from './CodeDiff';

interface AnalysisComparisonProps {
  comparison: AnalysisComparison;
  isDark?: boolean;
  onClose: () => void;
}

const AnalysisComparison: React.FC<AnalysisComparisonProps> = ({ comparison, isDark = false, onClose }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const { previous, current, scoreDelta } = comparison;
  const scoreTone = scoreDelta > 0
    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
    : scoreDelta < 0
      ? isDark ? 'text-rose-400' : 'text-rose-600'
      : isDark ? 'text-neutral-300' : 'text-neutral-600';
  const ScoreIcon = scoreDelta > 0 ? ArrowUp : scoreDelta < 0 ? ArrowDown : Minus;

  return createPortal(
    (
    <div
      className="comparison-modal fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Code comparison"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div
        className={`relative z-10 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-[#0b0b11]/[0.98] border-white/15 text-white shadow-[0_25px_80px_rgba(0,0,0,0.8)]'
            : 'bg-white/[0.98] border-black/10 text-neutral-900 shadow-[0_25px_80px_rgba(0,0,0,0.2)]'
        }`}
      >
        <div className="comparison-modal-content max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden overscroll-contain">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Code Comparison
              </h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                Read-only comparison between two saved history entries. No new analysis was run.
              </p>
            </div>
            <Button variant="secondary" size="sm" isDark={isDark} onClick={onClose} title="Close comparison">
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </Button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Previous score</p>
                <p className={`mt-1 text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>{previous.analysis.score}/100</p>
              </div>
              <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Current score</p>
                <p className={`mt-1 text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>{current.analysis.score}/100</p>
              </div>
              <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Score change</p>
                <p className={`mt-1 flex items-center gap-1 text-2xl font-bold font-mono ${scoreTone}`}>
                  <ScoreIcon className="w-5 h-5" />{scoreDelta > 0 ? '+' : ''}{scoreDelta}
                </p>
              </div>
            </div>

            {previous.language !== current.language && (
              <div className={`rounded-xl border p-3 text-xs ${isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                These analyses use different languages: {previous.language} and {current.language}. The code diff is shown, but score comparisons may not be directly meaningful.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" isDark={isDark}>{comparison.fixedIssues.length} fixed</Badge>
              <Badge variant="error" isDark={isDark}>{comparison.newIssues.length} new</Badge>
              <Badge variant="default" isDark={isDark}>{comparison.unchangedIssues.length} unchanged</Badge>
            </div>

            <div className="space-y-3">
              <h3 className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Code changes</h3>
              <CodeDiff lines={comparison.codeLines} isDark={isDark} />
            </div>

            {(comparison.fixedIssues.length > 0 || comparison.newIssues.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.fixedIssues.length > 0 && (
                  <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-emerald-200 bg-emerald-50'}`}>
                    <h3 className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Fixed issues</h3>
                    {comparison.fixedIssues.map((issue) => <p key={`${issue.line}-${issue.message}`} className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{issue.message}</p>)}
                  </div>
                )}
                {comparison.newIssues.length > 0 && (
                  <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? 'border-rose-500/20 bg-rose-500/[0.04]' : 'border-rose-200 bg-rose-50'}`}>
                    <h3 className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>New issues</h3>
                    {comparison.newIssues.map((issue) => <p key={`${issue.line}-${issue.message}`} className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{issue.message}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        </div>
      </div>
    </div>
    ),
    document.body
  );
};

export default AnalysisComparison;
