import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CodeAnalysis } from '../types/analysis';
import AnalysisPanel from './AnalysisPanel';
import Button from './ui/Button';

interface HistoryAnalysisModalProps {
  title: string;
  eyebrow: string;
  analysis: CodeAnalysis;
  code: string;
  createdAt?: string;
  isDark?: boolean;
  onClose: () => void;
}

const HistoryAnalysisModal: React.FC<HistoryAnalysisModalProps> = ({
  title,
  eyebrow,
  analysis,
  code,
  createdAt,
  isDark = false,
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
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Saved analysis result">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${
        isDark ? 'border-white/15 bg-[#0b0b11]/[0.99] text-white' : 'border-black/10 bg-white/[0.99] text-neutral-900'
      }`}>
        <div className={`flex shrink-0 items-center justify-between gap-4 border-b p-4 sm:p-6 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{eyebrow}</p>
            <h2 className="mt-1 truncate text-base font-semibold">{title}</h2>
          </div>
          <Button variant="secondary" size="sm" isDark={isDark} onClick={onClose} title="Close saved analysis">
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <AnalysisPanel analysis={analysis} code={code} createdAt={createdAt} isDark={isDark} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HistoryAnalysisModal;
