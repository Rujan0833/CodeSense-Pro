import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileCode2, RefreshCw, X } from 'lucide-react';
import type { GitHubPullRequest, GitHubPullRequestFile } from './types';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { IosSpinner } from '../../components/LoadingSpinner';

interface PullRequestReviewModalProps {
  pullRequest: GitHubPullRequest;
  files: GitHubPullRequestFile[];
  isLoading: boolean;
  error: string | null;
  selectedFile: GitHubPullRequestFile | null;
  isReviewing: boolean;
  reviewError: string | null;
  isDark?: boolean;
  onSelectFile: (file: GitHubPullRequestFile) => void;
  onAnalyzeFile: () => void;
  onReload: () => void;
  onClose: () => void;
}

const PullRequestReviewModal: React.FC<PullRequestReviewModalProps> = ({
  pullRequest,
  files,
  isLoading,
  error,
  selectedFile,
  isReviewing,
  reviewError,
  isDark = false,
  onSelectFile,
  onAnalyzeFile,
  onReload,
  onClose,
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className="github-review-modal fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Pull request review">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${
        isDark ? 'border-white/15 bg-[#0b0b11]/[0.99] text-white' : 'border-black/10 bg-white/[0.99] text-neutral-900'
      }`}>
        <div className={`flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-6 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Pull request review</p>
            <h2 className="mt-1 truncate text-base font-semibold">#{pullRequest.number} {pullRequest.title}</h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{pullRequest.author} · {pullRequest.sourceBranch} → {pullRequest.targetBranch}</p>
          </div>
          <Button variant="secondary" size="sm" isDark={isDark} onClick={onClose} title="Close pull request review">
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>

        <div className="github-review-modal-body min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-16"><IosSpinner size={28} className={isDark ? 'text-white' : 'text-neutral-800'} /></div>
          ) : error ? (
            <div className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              <div className="flex items-center justify-between gap-3"><span>{error}</span><Button variant="secondary" size="sm" isDark={isDark} onClick={onReload}>Retry</Button></div>
            </div>
          ) : files.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center text-sm ${isDark ? 'border-white/[0.08] text-neutral-500' : 'border-black/[0.08] text-neutral-500'}`}>
              No changed files were returned for this pull request.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className={`space-y-3 lg:col-span-5 lg:border-r lg:pr-5 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Changed files</h3>
                    <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Select one file to review.</p>
                  </div>
                  <Button variant="secondary" size="sm" isDark={isDark} onClick={onReload} disabled={isLoading} title="Refresh changed files"><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="space-y-2">
                  {files.map((file) => (
                    <button key={file.sha} type="button" onClick={() => onSelectFile(file)} className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                      selectedFile?.sha === file.sha
                        ? isDark ? 'border-white/25 bg-white/[0.08]' : 'border-black/20 bg-black/[0.04]'
                        : isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.03]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileCode2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.filename}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pl-6 text-[11px] font-mono"><span className="text-emerald-500">+{file.additions}</span><span className="text-rose-500">-{file.deletions}</span><Badge variant={file.status === 'removed' ? 'error' : file.status === 'added' ? 'success' : 'default'} isDark={isDark}>{file.status}</Badge></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-0 lg:col-span-7">
                {!selectedFile ? (
                  <div className={`flex min-h-64 items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm ${isDark ? 'border-white/10 text-neutral-500' : 'border-black/10 text-neutral-500'}`}>Select a changed file to see its patch and analyze it.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{selectedFile.filename}</h3><p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Review this file&apos;s patch with CodeSense.</p></div><Button variant="primary" size="sm" isDark={isDark} onClick={onAnalyzeFile} disabled={!selectedFile.patch || isReviewing}>{isReviewing ? 'Analyzing...' : 'Analyze file'}</Button></div>
                    {selectedFile.patch ? <pre className={`max-h-72 overflow-auto rounded-2xl border p-4 text-[11px] leading-relaxed ${isDark ? 'border-white/[0.08] bg-[#07070a] text-neutral-300' : 'border-black/[0.08] bg-[#f4f4f7] text-neutral-700'}`}>{selectedFile.patch}</pre> : <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>GitHub did not return a patch for this file, so it cannot be analyzed yet.</div>}
                    {reviewError && <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{reviewError}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PullRequestReviewModal;
