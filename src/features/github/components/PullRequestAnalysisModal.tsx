import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CodeAnalysis } from '../../../types/analysis';
import AnalysisPanel from '../../../components/AnalysisPanel';
import Button from '../../../components/ui/Button';
import { IosSpinner } from '../../../components/LoadingSpinner';

interface PullRequestAnalysisModalProps {
  analysis: CodeAnalysis;
  filename: string;
  code: string;
  repository: string;
  pullNumber: number;
  isDark?: boolean;
  isPosting?: boolean;
  postError?: string | null;
  postSuccess?: string | null;
  onPostComment: (comment: string) => void;
  onClose: () => void;
}

const PullRequestAnalysisModal: React.FC<PullRequestAnalysisModalProps> = ({ analysis, filename, code, repository, pullNumber, isDark = false, isPosting = false, postError, postSuccess, onPostComment, onClose }) => {
  const defaultComment = `## CodeSense review\n\n**File:** \`${filename}\`\n**Score:** ${analysis.score}/100\n\n### Summary\n${analysis.summary}\n\n### Findings\n${analysis.issues?.length ? analysis.issues.map((issue) => `- **${issue.severity}** (line ${issue.line}): ${issue.message}${issue.suggestion ? `\n  - Suggestion: ${issue.suggestion}` : ''}`).join('\n') : '- No issues found.'}\n\n### Suggestions\n${analysis.suggestions?.length ? analysis.suggestions.map((suggestion) => `- ${suggestion}`).join('\n') : '- No additional suggestions.'}\n\n_Reviewed by CodeSense for ${repository} PR #${pullNumber}._`;
  const [comment, setComment] = useState(defaultComment);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Pull request file analysis">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-white/15 bg-[#0b0b11]/[0.99] text-white' : 'border-black/10 bg-white/[0.99] text-neutral-900'}`}>
        <div className={`flex shrink-0 items-center justify-between gap-4 border-b p-4 sm:p-6 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="min-w-0"><p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>File analysis result</p><h2 className="mt-1 truncate text-base font-semibold">{filename}</h2></div>
          <Button variant="secondary" size="sm" isDark={isDark} onClick={onClose} title="Close analysis result"><X className="w-3.5 h-3.5" /><span className="hidden sm:inline">Close</span></Button>
        </div>
        <div className="github-review-modal-body min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <AnalysisPanel analysis={analysis} isDark={isDark} code={code} />
          <section className={`rounded-2xl border p-4 space-y-3 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'}`}>
            <div><h3 className="text-sm font-semibold">Post review to GitHub</h3><p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Review the generated comment before publishing it to PR #{pullNumber}.</p></div>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={10000} rows={10} className={`w-full resize-y rounded-xl border p-3 text-xs leading-relaxed outline-none ${isDark ? 'border-white/10 bg-black/20 text-neutral-200 focus:border-white/25' : 'border-black/10 bg-white text-neutral-800 focus:border-black/25'}`} aria-label="GitHub review comment preview" />
            {postError && <p className={`rounded-xl border p-3 text-xs ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{postError}</p>}
            {postSuccess && <p className={`rounded-xl border p-3 text-xs ${isDark ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{postSuccess}</p>}
            <div className="flex items-center justify-end gap-2"><span className={`mr-auto text-[11px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{comment.length}/10000</span><Button variant="primary" size="sm" isDark={isDark} onClick={() => onPostComment(comment)} disabled={isPosting || !comment.trim()}>{isPosting ? <><IosSpinner size={13} /> Posting...</> : 'Post to GitHub'}</Button></div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PullRequestAnalysisModal;