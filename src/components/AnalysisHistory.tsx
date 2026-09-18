import React from 'react';
import { Clock3, GitCompare, History, Trash2 } from 'lucide-react';
import type { AnalysisHistoryEntry } from '../types/analysis';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface AnalysisHistoryProps {
  entries: AnalysisHistoryEntry[];
  isLoading: boolean;
  isDark?: boolean;
  onSelect: (entry: AnalysisHistoryEntry) => void;
  onCompare: () => void;
  onDelete: (id: string) => void;
  deletingId?: string;
  onShowAll?: () => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  entries,
  isLoading,
  isDark = false,
  onSelect,
  onCompare,
  onDelete,
  deletingId,
  onShowAll,
}) => (
  <section className="space-y-4 pt-6">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2.5">
        <History className={`w-4 h-4 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`} />
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${
          isDark ? 'text-neutral-300' : 'text-neutral-700'
        }`}>
          Analysis History
        </h2>
        <Badge variant="default" isDark={isDark}>{entries.length}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className={`hidden sm:inline text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Saved to your account
        </span>
        <Button
          variant="secondary"
          size="sm"
          isDark={isDark}
          onClick={onCompare}
          disabled={entries.length < 2}
          title="Choose history to compare"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </Button>
        {onShowAll && entries.length > 0 && (
          <Button variant="secondary" size="sm" isDark={isDark} onClick={onShowAll} title="View all analysis history">
            <span>Show all</span>
          </Button>
        )}
      </div>
    </div>

    <div className={`rounded-3xl border p-4 sm:p-5 ${
      isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
    }`}>
      {isLoading ? (
        <div className={`py-8 text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Loading your analyses...
        </div>
      ) : entries.length === 0 ? (
        <div className={`py-8 text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Completed analyses will appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                isDark
                  ? 'border-white/[0.06] hover:bg-white/[0.04]'
                  : 'border-black/[0.06] hover:bg-black/[0.03]'
              }`}
            >
              <button onClick={() => onSelect(entry)} className="min-w-0 flex-1 text-left cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold truncate ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {entry.analysis.summary || 'Code analysis'}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${
                    isDark ? 'text-neutral-400 border-white/10' : 'text-neutral-500 border-black/10'
                  }`}>
                    {entry.language}
                  </span>
                </div>
                <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatDate(entry.createdAt)}</span>
                  <span>Score {entry.analysis.score}/100</span>
                </div>
              </button>
              <Button
                variant="secondary"
                size="sm"
                isDark={isDark}
                onClick={() => onDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="!px-2.5"
                title="Delete analysis"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

export default AnalysisHistory;
