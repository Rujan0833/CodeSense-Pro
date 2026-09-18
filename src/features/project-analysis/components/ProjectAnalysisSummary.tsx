import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ProjectFileResult } from '../hooks/useProjectAnalysis';

interface ProjectAnalysisSummaryProps {
  results: ProjectFileResult[];
  fileCount: number;
  completedCount: number;
  isAnalyzing: boolean;
  error: string | null;
  projectScore: number | null;
  issueCount: number;
  riskCounts: { error: number; warning: number; info: number };
  status: 'idle' | 'running' | 'complete' | 'cancelled' | 'failed';
  isDark: boolean;
  onSelectResult: (result: ProjectFileResult) => void;
}

const ProjectAnalysisSummary: React.FC<ProjectAnalysisSummaryProps> = ({ results, fileCount, completedCount, isAnalyzing, error, projectScore, issueCount, riskCounts, status, isDark, onSelectResult }) => {
  const muted = isDark ? 'text-neutral-500' : 'text-neutral-500';

  if (!isAnalyzing && !results.length && !error) return null;

  return (
    <div className="mt-5 border-t pt-5">
      {(isAnalyzing || results.length > 0 || error) && <p className={`mb-3 text-xs ${muted}`}>{isAnalyzing ? `Analyzing ${completedCount} of ${fileCount} files...` : status === 'cancelled' ? `Partial result: ${results.length} of ${fileCount} files analyzed` : results.length ? `${results.length} of ${fileCount} files analyzed` : 'Project analysis failed.'}</p>}
      {error && <p className={`mt-3 rounded-xl border p-3 text-xs ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</p>}
      {results.length > 0 && <>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"><div className={`rounded-xl border p-3 text-center ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}><p className={`text-[10px] uppercase tracking-wider ${muted}`}>Project score</p><p className="mt-1 text-2xl font-bold font-mono">{projectScore}/100</p></div><div className={`rounded-xl border p-3 text-center ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}><p className={`text-[10px] uppercase tracking-wider ${muted}`}>Files</p><p className="mt-1 text-2xl font-bold font-mono">{results.length}</p></div><div className={`col-span-2 rounded-xl border p-3 text-center sm:col-span-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}><p className={`text-[10px] uppercase tracking-wider ${muted}`}>Issues</p><p className="mt-1 flex items-center justify-center gap-1 text-2xl font-bold font-mono"><AlertTriangle className="h-4 w-4 text-amber-500" />{issueCount}</p></div></div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium"><span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-500">{riskCounts.error} errors</span><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-500">{riskCounts.warning} warnings</span><span className={`rounded-full px-2.5 py-1 ${isDark ? 'bg-white/10 text-neutral-400' : 'bg-black/5 text-neutral-500'}`}>{riskCounts.info} info</span></div>
        <div className="mt-4 space-y-2">{results.map((result) => {
          const isHighestRisk = result.analysis.score === Math.min(...results.map((item) => item.analysis.score));
          return <button type="button" key={result.fileId} onClick={() => onSelectResult(result)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isDark ? 'border-white/[0.06] hover:bg-white/[0.05]' : 'border-black/[0.06] hover:bg-black/[0.03]'}`}><CheckCircle2 className={`h-4 w-4 shrink-0 ${result.analysis.score >= 80 ? 'text-emerald-500' : result.analysis.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`} /><span className="min-w-0 flex-1 truncate text-xs font-medium">{result.path}</span>{isHighestRisk && <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'}`}>Highest risk</span>}<span className="shrink-0 text-xs font-mono">{result.analysis.score}/100</span></button>;
        })}</div>
      </>}
    </div>
  );
};

export default ProjectAnalysisSummary;
