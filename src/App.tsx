import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Code2,  
  RotateCcw, 
  Play, 
  CheckCircle,
  Sun,
  Moon,
  Home,
  LogOut,
  GitBranch
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import AnalysisPanel from './components/AnalysisPanel';
import AnalysisHistory from './components/AnalysisHistory';
import AnalysisComparison from './components/AnalysisComparison';
import HistoryComparePicker from './components/HistoryComparePicker';
import PrintAnalysisReport from './components/PrintAnalysisReport';
import GitHubPage from './features/github/GitHubPage';
import LoadingSpinner, { IosSpinner } from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import ProductPage from './components/ProductPage';
import HistoryPage from './components/HistoryPage';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRouter } from './lib/router';
import { useCodeAnalysis } from './hooks/useCodeAnalysis';
import { useAnalysisHistory } from './hooks/useAnalysisHistory';
import { useStudioSession } from './hooks/useStudioSession';
import { detectLanguage, SUPPORTED_LANGUAGES } from './lib/detector';
import type { AnalysisHistoryEntry, AnalysisRequest } from './types/analysis';
import { compareAnalyses } from './lib/compareAnalysis';

const queryClient = new QueryClient();

interface Preset {
  id: string;
  name: string;
  category: string;
  code: string;
}

const PRESETS: Preset[] = [
  {
    id: 'memory-leak',
    name: 'Recursive Stack Risk',
    category: 'Memory & Performance',
    code: `// Potential stack overflow with unbounded recursion
function calculateFactorial(n) {
  if (n <= 1) return 1;
  // Missing tail-call optimization & negative check
  return n * calculateFactorial(n - 1);
}

const result = calculateFactorial(50000);
console.log(result);`
  },
  {
    id: 'sql-injection',
    name: 'SQL Vulnerability',
    category: 'Security Risk',
    code: `import { Request, Response } from 'express';
import db from './database';

export async function getUserProfile(req: Request, res: Response) {
  const userId = req.query.id;
  
  // Vulnerable to SQL Injection: Direct string interpolation!
  const query = \`SELECT * FROM users WHERE id = '\${userId}' AND active = 1\`;
  
  const user = await db.raw(query);
  return res.json(user);
}`
  },
  {
    id: 'react-leak',
    name: 'Async Race Condition',
    category: 'React Architecture',
    code: `import { useState, useEffect } from 'react';

export function UserAvatar({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Race condition: previous fetch is not cancelled on rapid userId change
    fetch(\`/api/user/\${userId}\`)
      .then(res => res.json())
      .then(result => setData(result));
  }, [userId]);

  if (!data) return <div>Loading...</div>;
  return <img src={data.avatarUrl} alt="avatar" />;
}`
  },
  {
    id: 'clean-code',
    name: 'Clean TS Architecture',
    category: 'Best Practice',
    code: `interface Result<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export async function safeExecute<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown exception occurred';
    return { success: false, error };
  }
}`
  }
];

function StudioContent({ 
  isDark, 
  onToggleTheme,
  onNavigateHome,
  onNavigateGithub,
  onNavigateHistory
}: { 
  isDark: boolean; 
  onToggleTheme: () => void;
  onNavigateHome: () => void;
  onNavigateGithub: () => void;
  onNavigateHistory: () => void;
}) {
  const { user, token, logout } = useAuth();
  const { navigate } = useRouter();

  const {
    code,
    snapshot: savedSnapshot,
    updateCode: setCode,
    saveSnapshot,
    clearSession,
  } = useStudioSession(user?.id || 'anonymous', PRESETS[0].code);
  const [activePresetId, setActivePresetId] = useState('memory-leak');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<AnalysisHistoryEntry | null>(null);
  const [comparison, setComparison] = useState<ReturnType<typeof compareAnalyses> | null>(null);
  const [isComparePickerOpen, setIsComparePickerOpen] = useState(false);
  const lastAnalyzedSignature = useRef<string | null>(null);

  // Auto-detect programming language based on code input
  const detectedLanguage = useMemo(() => detectLanguage(code), [code]);
  const hasCode = code.trim().length > 0;
  const editorLanguage = hasCode ? detectedLanguage : 'plaintext';

  const { mutate: analyzeCode, data: analysis, isPending, error, reset: resetAnalysis } = useCodeAnalysis();
  const { history, isLoading: isHistoryLoading, saveHistory, deleteHistory } = useAnalysisHistory(token);
  const displayedAnalysis = selectedHistory?.analysis || analysis || savedSnapshot?.analysis;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) {
      showToast('Please enter or paste code before analyzing');
      return;
    }

    setSelectedHistory(null);
    const request: AnalysisRequest = {
      code,
      language: detectedLanguage
    };

    analyzeCode(request, {
      onSuccess: (result) => {
        const signature = `${detectedLanguage}:${code}`;
        if (lastAnalyzedSignature.current === signature) return;

        lastAnalyzedSignature.current = signature;
        const snapshot = { code, language: detectedLanguage, analysis: result, createdAt: new Date().toISOString() };
        saveSnapshot(snapshot);
        setComparison(null);
        saveHistory.mutate({ code, language: detectedLanguage, analysis: result });
      },
    });
  }, [code, detectedLanguage, analyzeCode, saveHistory, saveSnapshot]);

  const handleClear = useCallback(() => {
    setActivePresetId('');
    resetAnalysis();
    setSelectedHistory(null);
    setComparison(null);
    clearSession();
    showToast('Workspace cleared');
  }, [clearSession, resetAnalysis]);

  // Global Keyboard Shortcuts (⌘↵ / Ctrl↵ to Analyze, ⌘K / Ctrl+K to Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isPending && code.trim()) {
          handleAnalyze();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnalyze, handleClear, isPending, code]);

  const handleSelectPreset = (preset: Preset) => {
    setCode(preset.code);
    setActivePresetId(preset.id);
    resetAnalysis();
    setSelectedHistory(null);
    setComparison(null);
    showToast(`Loaded: ${preset.name}`);
  };

  const handleSelectHistory = (entry: AnalysisHistoryEntry) => {
    setCode(entry.code);
    setActivePresetId('');
    setSelectedHistory(entry);
    lastAnalyzedSignature.current = `${entry.language}:${entry.code}`;
    showToast(`Loaded analysis from ${new Date(entry.createdAt).toLocaleDateString()}`);
  };

  const handleOpenComparePicker = () => {
    setIsComparePickerOpen(true);
  };

  const handleCompareEntries = (previous: AnalysisHistoryEntry, current: AnalysisHistoryEntry) => {
    setIsComparePickerOpen(false);
    setComparison(compareAnalyses(previous, {
      code: current.code,
      language: current.language,
      analysis: current.analysis,
      createdAt: current.createdAt,
    }));
  };

  // Keyboard shortcut listener: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnalyze]);

  return (
    <div className={`studio-shell relative min-h-screen font-sans transition-colors duration-300 ${
      isDark 
        ? 'bg-[#050508] text-neutral-100 selection:bg-white/20 selection:text-white' 
        : 'bg-[#f5f5f7] text-[#1d1d1f] selection:bg-black/10 selection:text-black'
    }`}>

      {displayedAnalysis && (
        <PrintAnalysisReport
          analysis={displayedAnalysis}
          code={code}
          createdAt={selectedHistory?.createdAt}
        />
      )}


      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-5 py-3 rounded-full text-xs font-medium backdrop-blur-2xl shadow-xl flex items-center gap-2.5 border ${
            isDark 
              ? 'bg-[#15151c]/90 text-white border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9)]' 
              : 'bg-white/95 text-neutral-900 border-black/10 shadow-[0_15px_35px_rgba(0,0,0,0.12)]'
          }`}>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Apple-style Symmetrical Top Navigation Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors ${
        isDark 
          ? 'bg-[#050508]/80 border-white/[0.08]' 
          : 'bg-[#f5f5f7]/85 border-black/[0.08]'
      }`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Breadcrumb to Home */}
            <div className="flex items-center gap-3">
              <button 
                onClick={onNavigateHome}
                className="flex items-center gap-3 cursor-pointer text-left group"
                title="Back to Product Page"
              >
                <div className={`w-9 h-9 rounded-xl p-0.5 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                  isDark 
                    ? 'bg-gradient-to-tr from-white to-neutral-300' 
                    : 'bg-gradient-to-tr from-[#1d1d1f] to-neutral-600'
                }`}>
                  <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                    isDark ? 'bg-[#09090e]' : 'bg-white'
                  }`}>
                    <Code2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold tracking-tight text-base ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    CodeSense
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isDark 
                      ? 'bg-white/10 text-neutral-300 border-white/15' 
                      : 'bg-black/[0.05] text-neutral-700 border-black/10'
                  }`}>
                    Studio
                  </span>
                </div>
              </button>
            </div>

            {/* Right Quick Actions: Home link, User profile badge, Theme Switcher, Sign Out */}
            <div className="flex items-center gap-3">
              {/* Home / Product Page Link */}
              <button
                onClick={onNavigateGithub}
                className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'text-neutral-300 hover:text-white bg-white/[0.03] border-white/10'
                    : 'text-neutral-700 hover:text-black bg-black/[0.03] border-black/10'
                }`}
                title="Connect GitHub"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>

              {/* Home / Product Page Link */}
              <button
                onClick={onNavigateHome}
                className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark 
                    ? 'text-neutral-300 hover:text-white bg-white/[0.03] border-white/10' 
                    : 'text-neutral-700 hover:text-black bg-black/[0.03] border-black/10'
                }`}
                title="View Product Page"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Product</span>
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-amber-300' 
                    : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/10 text-neutral-700'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Profile Pill */}
              <div className="hidden md:flex items-center">
                <Badge variant="default" isDark={isDark} withDot={true}>
                  {user?.name || user?.email || 'Authenticated'}
                </Badge>
              </div>

              {/* Reset Editor */}
              <Button
                variant="secondary"
                size="sm"
                isDark={isDark}
                onClick={handleClear}
                className="text-xs px-3.5 py-1.5"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Clear
              </Button>

              {/* Sign Out */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center ${
                  isDark 
                    ? 'text-neutral-400 hover:text-white border-white/10 hover:bg-white/5' 
                    : 'text-neutral-600 hover:text-black border-black/10 hover:bg-black/5'
                }`}
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Body: Focused Workspace without the Marketing Headline */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {/* Symmetrical Scenario Presets Bar */}
        <div className="space-y-3.5 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
            <span className={`uppercase tracking-widest font-bold ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}>
              Interactive Scenarios
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
              Pick a preset to preview reactive diagnostics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {PRESETS.map((p) => {
              const isActive = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`relative p-4 sm:p-5 rounded-2xl text-center border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    isActive
                      ? isDark
                        ? 'bg-white/10 border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
                        : 'bg-white border-black/30 shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
                      : isDark
                        ? 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/15'
                        : 'bg-white/70 hover:bg-white border-black/[0.06] hover:border-black/15 shadow-sm'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {p.category}
                  </span>
                  <span className={`text-xs sm:text-sm font-semibold truncate w-full text-center ${
                    isDark ? 'text-white' : 'text-[#1d1d1f]'
                  }`}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>



        {/* Side-by-Side Asymmetrical Studio & Results Grid (Left: Code Studio wider 7 cols, Right: Results 5 cols) */}
        <div className="studio-print-target grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          {/* Left Column: Code Studio (Wider 7 cols / ~58%) */}
          <div className="flex flex-col space-y-5 lg:col-span-7">
            {/* Header with Title & Auto-Detected Language Pill */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Code Section
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase tracking-wider font-semibold ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  Auto-detected
                </span>
                <Badge variant={hasCode ? 'success' : 'default'} isDark={isDark} withDot={hasCode}>
                  {hasCode ? detectedLanguage.toUpperCase() : 'NO CODE'}
                </Badge>
              </div>
            </div>

            {/* Symmetrical Left Card Container */}
            <Card isDark={isDark} tiltEnabled={false} className={`flex-1 flex flex-col p-5 sm:p-6 rounded-3xl space-y-5 ${
              isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
            }`}>
              <div className="flex-1">
                <CodeEditor
                  code={code}
                  language={editorLanguage}
                  onChange={(value) => {
                    setCode(value || '');
                    setSelectedHistory(null);
                  }}
                  height="480px"
                  isAnalyzing={isPending}
                  isDark={isDark}
                />
              </div>

              {/* Centered Apple Pill Analyze Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  isDark={isDark}
                  onClick={handleAnalyze}
                  disabled={isPending || !code.trim()}
                  className="px-10 py-4 rounded-full text-sm font-semibold shadow-lg"
                >
                  {isPending ? (
                    <div className="flex items-center gap-3">
                      {/* Compact 12-blade iOS Activity Indicator inside Button */}
                      <IosSpinner size={14} className={isDark ? 'text-black' : 'text-white'} />
                      <span>Inspecting Code...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Play className={`w-4 h-4 ${isDark ? 'fill-black' : 'fill-white'}`} />
                      <span>Analyze Code</span>
                      <span className="text-xs opacity-60 font-mono ml-1">(⌘↵)</span>
                    </div>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Results Section (Focused 5 cols / ~42%) */}
          <div className="studio-results-column flex flex-col space-y-5 lg:col-span-5">
            {/* Header with Title & Status badge */}
            <div className="studio-results-header flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Results Section
                </h2>
                <Badge variant={isPending ? 'warning' : displayedAnalysis ? 'success' : 'default'} isDark={isDark}>
                  {isPending ? 'Analyzing' : displayedAnalysis ? 'Report Ready' : 'Standby'}
                </Badge>
              </div>
              <span className={`text-xs font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                AI Inspector
              </span>
            </div>

            {/* Symmetrical Right Card Container */}
            <Card isDark={isDark} tiltEnabled={false} className={`studio-results-card flex-1 flex flex-col p-6 sm:p-7 rounded-3xl min-h-[580px] ${
              isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
            }`}>
              <div className="flex-1 flex flex-col justify-center">
                {isPending ? (
                  <LoadingSpinner message="Auditing Code Architecture" isDark={isDark} />
                ) : error ? (
                  <ErrorDisplay
                    error={error.message || 'Failed to complete analysis'}
                    onRetry={handleAnalyze}
                    isDark={isDark}
                  />
                ) : (
                  <AnalysisPanel
                    analysis={displayedAnalysis || null}
                    code={code}
                    createdAt={selectedHistory?.createdAt || savedSnapshot?.createdAt}
                    isDark={isDark}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>

        <AnalysisHistory
          entries={history.slice(0, 4)}
          isLoading={isHistoryLoading}
          isDark={isDark}
          onSelect={handleSelectHistory}
          onCompare={handleOpenComparePicker}
          onDelete={(historyId) => deleteHistory.mutate(historyId)}
          deletingId={deleteHistory.isPending ? deleteHistory.variables : undefined}
                  onShowAll={onNavigateHistory}
        />

        {isComparePickerOpen && (
          <HistoryComparePicker
            entries={history}
            isDark={isDark}
            onClose={() => setIsComparePickerOpen(false)}
            onCompare={handleCompareEntries}
          />
        )}

        {comparison && (
          <AnalysisComparison
            comparison={comparison}
            isDark={isDark}
            onClose={() => setComparison(null)}
          />
        )}

        {/* Supported Languages Shelf in the Bottom Section */}
        <div className="space-y-4 text-center pt-6">
          <div className="space-y-1">
            <h3 className={`text-xs uppercase tracking-widest font-bold ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}>
              Supported Languages & Runtimes
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {hasCode ? 'Auto-detected in real time as you write or paste code' : 'Enter code to detect its language'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isCurrent = hasCode && lang.id === detectedLanguage;
              return (
                <div
                  key={lang.id}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-2 select-none ${
                    isCurrent
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                      : isDark
                        ? 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                        : 'bg-white/80 border-black/[0.06] text-neutral-600 shadow-xs'
                  }`}
                >
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span>{lang.name}</span>
                  <span className="text-[10px] font-mono opacity-60">
                    {lang.extension}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Symmetrical Centered Footer */}
        <footer className={`pt-12 sm:pt-16 border-t text-center space-y-4 select-none ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <div className={`flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>Security Heuristics</span>
            <span>•</span>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>AST Inspection</span>
            <span>•</span>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>Performance Diagnostics</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MainApp() {
  const { currentRoute, navigate } = useRouter();
  const { isAuthenticated, isLoading, token, isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal } = useAuth();

  // Theme state: defaults to Dark Mode, saved in localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('codesense_theme');
      if (saved) return saved === 'dark';
    } catch {
      // fallback
    }
    return true; // Default to dark mode
  });

  // Mouse position for background light brush effect
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isMouseActive, setIsMouseActive] = useState(false);

  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMouseActive(true);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => setIsMouseActive(false), 300);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(inactivityTimer);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('codesense_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Route protection:
  // Wait until auth session check finishes before making any redirect decisions!
  useEffect(() => {
    if (isLoading) return;

    if ((currentRoute === '/studio' || currentRoute === '/github' || currentRoute === '/history') && !isAuthenticated) {
      navigate('/');
      openAuthModal('signin');
    } else if ((currentRoute === '/login' || currentRoute === '/signup') && isAuthenticated) {
      navigate('/studio');
    }
  }, [currentRoute, isAuthenticated, isLoading, navigate, openAuthModal]);

  // Open modal if user navigates to /login or /signup directly
  useEffect(() => {
    if (currentRoute === '/login') {
      openAuthModal('signin');
    } else if (currentRoute === '/signup') {
      openAuthModal('signup');
    }
  }, [currentRoute, openAuthModal]);

  const handleAuthModalClose = () => {
    closeAuthModal();
    if (currentRoute === '/login' || currentRoute === '/signup') {
      navigate('/');
    }
  };

  const handleAuthSuccess = () => {
    navigate('/studio');
  };

  // Smooth loading state while validating session on protected route during hard refresh
  if (isLoading && (currentRoute === '/studio' || currentRoute === '/github' || currentRoute === '/history') && token) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-[#050508]' : 'bg-[#f5f5f7]'
      }`}>
        <IosSpinner size={32} className={isDark ? 'text-white' : 'text-neutral-800'} />
      </div>
    );
  }

  return (
    <>
      {/* Route Switcher */}
      {currentRoute === '/studio' && isAuthenticated ? (
        <StudioContent 
          isDark={isDark} 
          onToggleTheme={handleToggleTheme} 
          onNavigateHome={() => navigate('/')}
          onNavigateGithub={() => navigate('/github')}
          onNavigateHistory={() => navigate('/history')}
        />
      ) : currentRoute === '/history' && isAuthenticated ? (
        <HistoryPage isDark={isDark} />
      ) : currentRoute === '/github' && isAuthenticated ? (
        <GitHubPage
          isDark={isDark}
          onNavigateStudio={() => navigate('/studio')}
        />
      ) : (
        <ProductPage 
          isDark={isDark} 
          onToggleTheme={handleToggleTheme} 
          onNavigateToStudio={() => navigate('/studio')}
          mousePosition={mousePosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 }}
          isMouseActive={isMouseActive}
        />
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        initialTab={authModalTab}
        isDark={isDark}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;