import React, { useState } from 'react';
import { ArrowLeft, Clock3, FileCode2, History, Trash2 } from 'lucide-react';
import { useAnalysisHistory, useGitHubReviewHistory } from '../hooks/useAnalysisHistory';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../lib/router';
import type { AnalysisHistoryEntry, GitHubReviewHistoryEntry } from '../types/analysis';
import HistoryAnalysisModal from './HistoryAnalysisModal';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface HistoryPageProps {
  isDark: boolean;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

const HistoryPage: React.FC<HistoryPageProps> = ({ isDark }) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const { history: analyses, isLoading: isAnalysesLoading, deleteHistory } = useAnalysisHistory(token);
  const { history: reviews, isLoading: isReviewsLoading, deleteReview } = useGitHubReviewHistory(token);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    title: string;
    eyebrow: string;
    analysis: AnalysisHistoryEntry['analysis'];
    code: string;
    createdAt: string;
  } | null>(null);

  const surface = isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10';
  const muted = isDark ? 'text-neutral-500' : 'text-neutral-500';

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-[#050508] text-neutral-100' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
      <header className={`border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" isDark={isDark} onClick={() => navigate('/studio')} title="Back to Studio"><ArrowLeft className="w-3.5 h-3.5" /></Button>
            <div><p className="text-lg font-semibold">History</p><p className={`text-xs ${muted}`}>Your Studio analyses and GitHub reviews</p></div>
          </div>
          <Button variant="primary" size="sm" isDark={isDark} onClick={() => navigate('/studio')}>Open Studio</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2"><History className="w-4 h-4" /><h1 className="text-sm font-semibold uppercase tracking-wider">Studio analyses</h1><Badge variant="default" isDark={isDark}>{analyses.length}</Badge></div>
          <div className={`rounded-3xl border p-4 sm:p-5 ${surface}`}>
            {isAnalysesLoading ? <p className={`py-8 text-center text-sm ${muted}`}>Loading your analyses...</p> : analyses.length === 0 ? <p className={`py-8 text-center text-sm ${muted}`}>Completed analyses will appear here.</p> : <div className="space-y-2">
              {analyses.map((entry: AnalysisHistoryEntry) => <div key={entry.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <button type="button" onClick={() => setSelectedAnalysis({ title: entry.analysis.summary || 'Code analysis', eyebrow: 'Studio analysis', analysis: entry.analysis, code: entry.code, createdAt: entry.createdAt })} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold">{entry.analysis.summary || 'Code analysis'}</p><p className={`mt-1 flex items-center gap-2 text-xs ${muted}`}><Clock3 className="w-3 h-3" />{formatDate(entry.createdAt)} · {entry.language} · Score {entry.analysis.score}/100</p>
                </button>
                <Button variant="secondary" size="sm" isDark={isDark} onClick={() => deleteHistory.mutate(entry.id)} disabled={deleteHistory.isPending && deleteHistory.variables === entry.id} title="Delete analysis"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>)}
            </div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2"><FileCode2 className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">GitHub reviews</h2><Badge variant="default" isDark={isDark}>{reviews.length}</Badge></div>
          <div className={`rounded-3xl border p-4 sm:p-5 ${surface}`}>
            {isReviewsLoading ? <p className={`py-8 text-center text-sm ${muted}`}>Loading your GitHub reviews...</p> : reviews.length === 0 ? <p className={`py-8 text-center text-sm ${muted}`}>Analyzed pull request files will appear here.</p> : <div className="space-y-2">
              {reviews.map((review: GitHubReviewHistoryEntry) => <div key={review.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                <button type="button" onClick={() => setSelectedAnalysis({ title: review.filename, eyebrow: `${review.repository} · PR #${review.pullNumber}`, analysis: review.analysis, code: review.code, createdAt: review.createdAt })} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold">{review.filename}</p><p className={`mt-1 text-xs ${muted}`}>{review.repository} · PR #{review.pullNumber} · Score {review.score}/100 · {formatDate(review.createdAt)}</p></button>
                <Button variant="secondary" size="sm" isDark={isDark} onClick={() => deleteReview.mutate(review.id)} disabled={deleteReview.isPending && deleteReview.variables === review.id} title="Delete GitHub review"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>)}
            </div>}
          </div>
        </section>

        {selectedAnalysis && <HistoryAnalysisModal {...selectedAnalysis} isDark={isDark} onClose={() => setSelectedAnalysis(null)} />}
      </main>
    </div>
  );
};

export default HistoryPage;
