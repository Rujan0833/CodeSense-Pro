import React, { useState } from 'react';
import type { CodeAnalysis, CodeIssue } from '../types/analysis';
import { 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Lightbulb, 
  ShieldAlert, 
  ArrowUpRight,
  ChevronDown,
  Download,
  Printer
} from 'lucide-react';
import Badge from './ui/Badge';
import ScoreGauge from './ui/ScoreGauge';
import Button from './ui/Button';
import { downloadMarkdownReport } from '../lib/exportReport';

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  isDark?: boolean;
  code?: string;
  createdAt?: string;
}

const ScoreRing: React.FC<{ score: number; isDark?: boolean }> = ({ score, isDark = false }) => {
  const getStatus = (s: number) => {
    if (s >= 80) return { text: isDark ? 'text-emerald-400' : 'text-emerald-600', label: 'Exceptional' };
    if (s >= 60) return { text: isDark ? 'text-amber-400' : 'text-amber-600', label: 'Acceptable' };
    return { text: isDark ? 'text-rose-400' : 'text-rose-600', label: 'Needs Polish' };
  };

  const status = getStatus(score);

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border backdrop-blur-md ${
      isDark 
        ? 'bg-white/[0.02] border-white/[0.08]' 
        : 'bg-black/[0.02] border-black/[0.08]'
    }`}>
      {/* Animated VisionOS SVG Radial Gauge */}
      <ScoreGauge score={score} isDark={isDark} size={112} strokeWidth={9} />

      {/* Score Description */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className={`text-xs uppercase tracking-widest font-semibold ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>Quality Index</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.text} ${
            isDark ? 'bg-white/[0.05]' : 'bg-black/[0.04]'
          }`}>
            {status.label}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${
          isDark ? 'text-neutral-300' : 'text-neutral-600'
        }`}>
          {score >= 80 
            ? 'Production grade. Adheres to modern architectural safety standards.' 
            : score >= 60 
            ? 'Functional with minor structural caveats. See issues below.' 
            : 'Immediate refactoring suggested to avoid runtime regressions.'}
        </p>
      </div>
    </div>
  );
};

const IssueCard: React.FC<{ issue: CodeIssue; isDark?: boolean }> = ({ issue, isDark = false }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getVariant = (sev: string): 'error' | 'warning' | 'info' => {
    if (sev === 'error') return 'error';
    if (sev === 'warning') return 'warning';
    return 'info';
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isDark 
        ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.08] hover:border-white/15' 
        : 'bg-black/[0.01] hover:bg-black/[0.03] border-black/[0.08] hover:border-black/15 shadow-sm'
    }`}>
      {/* Clickable Header for Expand/Collapse */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getVariant(issue.severity)} isDark={isDark}>
              {issue.severity.toUpperCase()}
            </Badge>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-md border ${
              isDark 
                ? 'text-neutral-400 bg-white/[0.05] border-white/10' 
                : 'text-neutral-600 bg-black/[0.04] border-black/10'
            }`}>
              Line {issue.line}
            </span>
          </div>
          <p className={`text-sm font-medium leading-relaxed ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          } ${!isExpanded ? 'line-clamp-1' : ''}`}>
            {issue.message}
          </p>
        </div>
        <div className={`p-1.5 rounded-lg border transition-transform duration-200 ${
          isDark ? 'bg-white/[0.05] border-white/10 text-neutral-400' : 'bg-black/[0.05] border-black/10 text-neutral-600'
        } ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t animate-in slide-in-from-top-2 fade-in duration-200 ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          {issue.suggestion && (
            <div className={`text-xs flex items-start gap-2.5 p-3.5 rounded-xl border leading-relaxed ${
              isDark 
                ? 'text-neutral-300 bg-white/[0.03] border-white/[0.06]' 
                : 'text-neutral-700 bg-black/[0.02] border-black/[0.06]'
            }`}>
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{issue.suggestion}</span>
            </div>
          )}

          {issue.code && (
            <div className={`relative rounded-xl border overflow-hidden ${
              isDark 
                ? 'bg-[#07070a] border-white/[0.08]' 
                : 'bg-[#f4f4f7] border-black/[0.08]'
            }`}>
              <div className={`flex items-center justify-between px-4 py-2 border-b text-[11px] font-mono ${
                isDark 
                  ? 'bg-white/[0.02] border-white/[0.06] text-neutral-400' 
                  : 'bg-black/[0.02] border-black/[0.06] text-neutral-600'
              }`}>
                <span>Code snippet</span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyCode(issue.code!); }}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer px-2 py-0.5 rounded ${
                    isDark 
                      ? 'text-neutral-400 hover:text-white hover:bg-white/10' 
                      : 'text-neutral-600 hover:text-black hover:bg-black/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className={`p-4 text-xs font-mono overflow-x-auto leading-relaxed ${
                isDark ? 'text-neutral-300' : 'text-neutral-800'
              }`}>
                <code>{issue.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isDark = false, code = '', createdAt }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'suggestions'>('overview');

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center select-none space-y-5">
        <div className={`w-18 h-18 rounded-3xl border flex items-center justify-center shadow-lg ${
          isDark 
            ? 'bg-gradient-to-tr from-white/[0.08] to-white/[0.02] border-white/10' 
            : 'bg-white border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
        }`}>
          <Sparkles className={`w-8 h-8 animate-pulse ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
        </div>
        <div className="space-y-2 max-w-sm text-center">
          <h3 className={`text-lg font-semibold tracking-tight ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            Ready for Analysis
          </h3>
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            Click <span className={isDark ? 'text-white font-medium' : 'text-black font-semibold'}>Analyze Code</span> or choose a preset to inspect vulnerabilities, code quality, and security diagnostics.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono opacity-70">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>AI Engine Standby</span>
        </div>
      </div>
    );
  }

  const issueCount = analysis.issues?.length || 0;
  const suggestionCount = analysis.suggestions?.length || 0;

  return (
    <div className="analysis-panel space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          isDark={isDark}
          onClick={() => downloadMarkdownReport(analysis, code, createdAt)}
          title="Download Markdown report"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Markdown</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isDark={isDark}
          onClick={() => window.print()}
          title="Print or save as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print / PDF</span>
        </Button>
      </div>
      {/* Symmetrical Score Ring Card */}
      <ScoreRing score={analysis.score} isDark={isDark} />

      {/* Segmented Pill Tabs (Apple macOS style) - Now Sticky! */}
      <div className={`sticky top-0 z-20 flex items-center p-1.5 border rounded-2xl backdrop-blur-xl ${
        isDark 
          ? 'bg-[#0a0a0f] border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
          : 'bg-[#f8f8fa] border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.05)]'
      }`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview'
              ? isDark 
                ? 'bg-white text-black shadow-sm font-semibold' 
                : 'bg-white text-black shadow-sm font-semibold'
              : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-black'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-white text-black shadow-sm font-semibold'
              : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span>Issues</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeTab === 'issues'
              ? 'bg-black/10 text-black'
              : isDark ? 'bg-white/10 text-neutral-300' : 'bg-black/[0.06] text-neutral-700'
          }`}>
            {issueCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'suggestions'
              ? 'bg-white text-black shadow-sm font-semibold'
              : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span>Suggestions</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeTab === 'suggestions'
              ? 'bg-black/10 text-black'
              : isDark ? 'bg-white/10 text-neutral-300' : 'bg-black/[0.06] text-neutral-700'
          }`}>
            {suggestionCount}
          </span>
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Executive Summary */}
          <div className={`p-5 sm:p-6 rounded-2xl border space-y-2 ${
            isDark 
              ? 'bg-white/[0.02] border-white/[0.06]' 
              : 'bg-black/[0.02] border-black/[0.06]'
          }`}>
            <h4 className={`text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Executive Summary
            </h4>
            <p className={`text-sm leading-relaxed ${
              isDark ? 'text-neutral-200' : 'text-neutral-700'
            }`}>
              {analysis.summary}
            </p>
          </div>

          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border text-center space-y-1 ${
              isDark 
                ? 'bg-white/[0.02] border-white/[0.06]' 
                : 'bg-black/[0.02] border-black/[0.06]'
            }`}>
              <div className={`flex items-center justify-center gap-1.5 text-xs ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Total Issues</span>
              </div>
              <div className={`text-3xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>{issueCount}</div>
            </div>
            <div className={`p-5 rounded-2xl border text-center space-y-1 ${
              isDark 
                ? 'bg-white/[0.02] border-white/[0.06]' 
                : 'bg-black/[0.02] border-black/[0.06]'
            }`}>
              <div className={`flex items-center justify-center gap-1.5 text-xs ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Suggestions</span>
              </div>
              <div className={`text-3xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>{suggestionCount}</div>
            </div>
          </div>

          {/* Top Issue Preview if any */}
          {issueCount > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className={`text-xs uppercase tracking-wider font-semibold ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  Primary Finding
                </h4>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`text-xs flex items-center gap-1 cursor-pointer font-medium ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>View all {issueCount}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <IssueCard issue={analysis.issues[0]} isDark={isDark} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-4 animate-in fade-in duration-200 max-h-[540px] overflow-y-auto pr-1">
          {issueCount === 0 ? (
            <div className={`p-10 text-center rounded-2xl border space-y-2 ${
              isDark 
                ? 'bg-emerald-500/[0.05] border-emerald-500/20' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-base font-semibold text-emerald-700">Clean bill of health!</p>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                No syntax errors, security flaws, or code smells found.
              </p>
            </div>
          ) : (
            analysis.issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} isDark={isDark} />
            ))
          )}
        </div>
      )}

      {/* Tab: Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="space-y-3 animate-in fade-in duration-200 max-h-[540px] overflow-y-auto pr-1">
          {suggestionCount === 0 ? (
            <div className={`p-10 text-center rounded-2xl border ${
              isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'
            }`}>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                No specific improvements proposed.
              </p>
            </div>
          ) : (
            analysis.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border transition-colors leading-relaxed ${
                  isDark 
                    ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06]' 
                    : 'bg-black/[0.02] hover:bg-black/[0.04] border-black/[0.06]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isDark 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {suggestion}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Symmetrical Footer Info */}
      <div className={`pt-5 border-t flex items-center justify-between text-xs font-mono select-none px-1 ${
        isDark ? 'border-white/[0.06] text-neutral-500' : 'border-black/[0.06] text-neutral-500'
      }`}>
        <span>Engine: GPT-4 Intelligence</span>
        <span className="capitalize">{analysis.language}</span>
      </div>

    </div>
  );
};

export default AnalysisPanel;