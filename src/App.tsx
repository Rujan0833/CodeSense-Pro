import { useState, useEffect, useMemo, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Code2, 
  Layers, 
  Cpu, 
  RotateCcw, 
  Play, 
  ShieldCheck, 
  FileCode2, 
  Command,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import AnalysisPanel from './components/AnalysisPanel';
import LoadingSpinner, { IosSpinner } from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import Button from './components/ui/Button';
import Dropdown from './components/ui/Dropdown';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import { useCodeAnalysis } from './hooks/useCodeAnalysis';
import type { AnalysisRequest } from './types/analysis';

const queryClient = new QueryClient();

interface Preset {
  id: string;
  name: string;
  category: string;
  language: string;
  code: string;
}

const PRESETS: Preset[] = [
  {
    id: 'memory-leak',
    name: 'Recursive Stack Risk',
    category: 'Memory & Performance',
    language: 'javascript',
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
    language: 'typescript',
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
    language: 'typescript',
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
    language: 'typescript',
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

function AppContent() {
  // Default to Light Mode as explicitly requested
  const [isDark, setIsDark] = useState(false);

  const [code, setCode] = useState(PRESETS[0].code);
  const [language, setLanguage] = useState('javascript');
  const [activePresetId, setActivePresetId] = useState('memory-leak');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { mutate: analyzeCode, data: analysis, isPending, error, reset: resetAnalysis } = useCodeAnalysis();

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'cpp',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin'
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) {
      showToast('Please enter or paste code before analyzing');
      return;
    }

    const request: AnalysisRequest = {
      code,
      language
    };

    analyzeCode(request);
  }, [code, language, analyzeCode]);

  const handleClear = () => {
    setCode('');
    setActivePresetId('');
    resetAnalysis();
    showToast('Workspace cleared');
  };

  const handleSelectPreset = (preset: Preset) => {
    setCode(preset.code);
    setLanguage(preset.language);
    setActivePresetId(preset.id);
    resetAnalysis();
    showToast(`Loaded: ${preset.name}`);
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

  // Live computed stats
  const stats = useMemo(() => {
    const lines = code ? code.split('\n').length : 0;
    const chars = code.length;
    const nonWhitespace = code.replace(/\s/g, '').length;
    return { lines, chars, nonWhitespace };
  }, [code]);

  return (
    <div className={`relative min-h-screen font-sans transition-colors duration-300 ${
      isDark 
        ? 'bg-[#050508] text-neutral-100 selection:bg-white/20 selection:text-white' 
        : 'bg-[#f5f5f7] text-[#1d1d1f] selection:bg-black/10 selection:text-black'
    }`}>
      {/* Background Ambient Lights */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {isDark ? (
          <>
            <div className="absolute -top-[15%] left-[20%] w-[650px] h-[550px] bg-gradient-to-br from-indigo-600/12 via-purple-600/10 to-transparent rounded-full blur-[140px] animate-aurora-1" />
            <div className="absolute top-[40%] -right-[10%] w-[600px] h-[500px] bg-gradient-to-bl from-cyan-600/12 via-blue-600/10 to-transparent rounded-full blur-[140px] animate-aurora-2" />
          </>
        ) : (
          <>
            <div className="absolute -top-[15%] left-[25%] w-[650px] h-[500px] bg-gradient-to-br from-blue-200/40 via-purple-100/30 to-transparent rounded-full blur-[140px] animate-aurora-1" />
            <div className="absolute top-[35%] -right-[5%] w-[600px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-sky-100/30 to-transparent rounded-full blur-[140px] animate-aurora-2" />
          </>
        )}
      </div>

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
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl p-0.5 flex items-center justify-center shadow-md ${
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
                  Pro
                </span>
              </div>
            </div>

            {/* Center Status Pill */}
            <div className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border ${
              isDark 
                ? 'bg-white/[0.04] border-white/[0.08] text-neutral-300' 
                : 'bg-black/[0.03] border-black/[0.08] text-neutral-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
              <span className="text-xs font-medium">GPT-4 Intelligence Ready</span>
            </div>

            {/* Right Quick Actions & Theme Switcher */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle (Default Light) */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-amber-300' 
                    : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/10 text-neutral-700'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border ${
                isDark 
                  ? 'bg-white/[0.03] border-white/[0.06] text-neutral-400' 
                  : 'bg-black/[0.03] border-black/[0.06] text-neutral-600'
              }`}>
                <Command className="w-3.5 h-3.5 opacity-60" />
                <span>↵ inspect</span>
              </div>

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
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body with Generous Padding */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 sm:py-16 space-y-12 sm:space-y-16">
        {/* Symmetrical Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Pill WITHOUT icon as requested */}
          <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md tracking-wide ${
            isDark 
              ? 'bg-white/[0.04] border-white/10 text-neutral-300' 
              : 'bg-black/[0.04] border-black/10 text-neutral-700'
          }`}>
            <span>AI-Powered Heuristic Engine</span>
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] ${
            isDark ? 'text-apple-headline-dark' : 'text-apple-headline-light'
          }`}>
            Code review, redefined.
          </h1>

          <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            Surgical static inspection, runtime safety diagnostics, and architectural guidance crafted with Apple precision.
          </p>
        </div>

        {/* Symmetrical Scenario Presets Bar */}
        <div className="space-y-3.5 text-center">
          {/* Label WITHOUT icon as requested */}
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

        {/* Symmetrical 4-Card Bento Metrics Shelf */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          <Card variant="glass" isDark={isDark} className="p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2" spotlightGlow={false}>
            <div className={`flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              <FileCode2 className="w-4 h-4" />
              <span>Lines</span>
            </div>
            <div className={`text-3xl font-bold font-mono tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {stats.lines}
            </div>
            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {stats.lines > 100 ? 'High complexity' : 'Standard scope'}
            </div>
          </Card>

          <Card variant="glass" isDark={isDark} className="p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2" spotlightGlow={false}>
            <div className={`flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              <Cpu className="w-4 h-4" />
              <span>Tokens</span>
            </div>
            <div className={`text-3xl font-bold font-mono tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {stats.chars}
            </div>
            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {stats.nonWhitespace} characters
            </div>
          </Card>

          <Card variant="glass" isDark={isDark} className="p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2" spotlightGlow={false}>
            <div className={`flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              <Layers className="w-4 h-4" />
              <span>Language</span>
            </div>
            <div className={`text-3xl font-bold font-mono tracking-tight capitalize ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {language}
            </div>
            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              Active parser profile
            </div>
          </Card>

          <Card variant="glass" isDark={isDark} className="p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2" spotlightGlow={false}>
            <div className={`flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              <ShieldCheck className="w-4 h-4" />
              <span>Status</span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight">
              {isPending ? (
                <span className="text-cyan-500 animate-pulse">Running</span>
              ) : analysis ? (
                <span className="text-emerald-500">{analysis.score}/100</span>
              ) : (
                <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Ready</span>
              )}
            </div>
            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              {isPending ? 'Inspecting AST...' : analysis ? 'Inspection complete' : 'Idle standby'}
            </div>
          </Card>
        </div>

        {/* Side-by-Side Asymmetrical Studio & Results Grid (Left: Code Studio wider, Right: Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-stretch">
          {/* Left Column: Code Studio (Wider 7 cols / ~58%) */}
          <div className="flex flex-col space-y-5 lg:col-span-7">
            {/* Header with Title & Language selector */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Code Section
                </h2>
                <Badge variant="default" withDot={false} isDark={isDark}>
                  {language}
                </Badge>
              </div>
              <div className="w-44">
                <Dropdown
                  value={language}
                  onChange={setLanguage}
                  options={languages}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* Symmetrical Left Card Container */}
            <Card isDark={isDark} className={`flex-1 flex flex-col p-5 sm:p-6 rounded-3xl space-y-5 ${
              isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
            }`}>
              <div className="flex-1">
                <CodeEditor
                  code={code}
                  language={language}
                  onChange={(value) => setCode(value || '')}
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
          <div className="flex flex-col space-y-5 lg:col-span-5">
            {/* Header with Title & Status badge */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  Results Section
                </h2>
                <Badge variant={isPending ? 'warning' : analysis ? 'success' : 'default'} isDark={isDark}>
                  {isPending ? 'Analyzing' : analysis ? 'Report Ready' : 'Standby'}
                </Badge>
              </div>
              <span className={`text-xs font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                AI Inspector
              </span>
            </div>

            {/* Symmetrical Right Card Container */}
            <Card isDark={isDark} className={`flex-1 flex flex-col p-6 sm:p-7 rounded-3xl min-h-[580px] ${
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
                  <AnalysisPanel analysis={analysis || null} isDark={isDark} />
                )}
              </div>
            </Card>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;