import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, GitCompare, History, X } from 'lucide-react';
import type { AnalysisHistoryEntry } from '../types/analysis';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface HistoryComparePickerProps {
  entries: AnalysisHistoryEntry[];
  isDark?: boolean;
  onClose: () => void;
  onCompare: (previous: AnalysisHistoryEntry, current: AnalysisHistoryEntry) => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

const HistoryComparePicker: React.FC<HistoryComparePickerProps> = ({
  entries,
  isDark = false,
  onClose,
  onCompare,
}) => {
  const [firstId, setFirstId] = useState<string | null>(null);

  const handleSelect = (entry: AnalysisHistoryEntry) => {
    if (!firstId) {
      setFirstId(entry.id);
      return;
    }

    if (entry.id === firstId) return;
    const first = entries.find((item) => item.id === firstId);
    if (first) onCompare(first, entry);
  };

  return createPortal(
    (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Choose analyses to compare">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className={`relative z-10 w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
        isDark
          ? 'bg-[#0b0b11]/[0.99] border-white/15 text-white'
          : 'bg-white/[0.99] border-black/10 text-neutral-900'
      }`}>
        <div className="history-picker-content max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <GitCompare className={`w-4 h-4 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`} />
                <h2 className="text-sm font-semibold">Choose history to compare</h2>
              </div>
              <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                {!firstId ? 'Select the older analysis first.' : 'Now select the second analysis.'}
              </p>
            </div>
            <Button variant="secondary" size="sm" isDark={isDark} onClick={onClose} title="Close comparison picker">
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </Button>
          </div>

          {entries.length < 2 ? (
            <div className={`rounded-2xl border p-8 text-center text-sm ${isDark ? 'border-white/[0.08] text-neutral-400' : 'border-black/[0.08] text-neutral-500'}`}>
              <History className="w-7 h-7 mx-auto mb-3 opacity-60" />
              Analyze another version before comparing history entries.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isFirst = entry.id === firstId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelect(entry)}
                    disabled={isFirst}
                    className={`w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors cursor-pointer disabled:cursor-default ${
                      isFirst
                        ? isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'
                        : isDark ? 'border-white/[0.08] hover:bg-white/[0.05]' : 'border-black/[0.08] hover:bg-black/[0.03]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                      isFirst
                        ? isDark ? 'border-emerald-400/40 text-emerald-300' : 'border-emerald-400 text-emerald-700'
                        : isDark ? 'border-white/10 text-neutral-500' : 'border-black/10 text-neutral-400'
                    }`}>
                      {isFirst ? <Check className="w-4 h-4" /> : <History className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                        {entry.analysis.summary || 'Code analysis'}
                      </p>
                      <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                        {formatDate(entry.createdAt)} · {entry.language} · Score {entry.analysis.score}/100
                      </p>
                    </div>
                    {isFirst && <Badge variant="success" isDark={isDark}>Older</Badge>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    ),
    document.body
  );
};

export default HistoryComparePicker;
