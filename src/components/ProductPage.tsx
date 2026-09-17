import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../lib/detector';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import ScrollReveal from './ui/ScrollReveal';
import AnimatedCounter from './ui/AnimatedCounter';
import ScrollProgress from './ui/ScrollProgress';
import ScoreGauge from './ui/ScoreGauge';
import { 
  Code2, 
  Play, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Zap, 
  ArrowRight,
  Terminal,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  name: string;
  filename: string;
  score: number;
  badgeVariant: 'success' | 'warning' | 'error';
  statusLabel: string;
  summary: string;
  latency: number;
  nodes: number;
  codeLines: { code: string; colorClass?: string }[];
}

const PREVIEW_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'clean',
    name: 'Production Grade',
    filename: 'secureHandler.ts',
    score: 98,
    badgeVariant: 'success',
    statusLabel: 'OPTIMAL AST',
    summary: '0 vulnerabilities • Zero memory leaks',
    latency: 4,
    nodes: 142,
    codeLines: [
      { code: 'export async function auditSecurity(req: Request) {', colorClass: 'text-purple-400' },
      { code: '  // Automatic AST vector analysis & input validation', colorClass: 'text-neutral-500' },
      { code: '  const user = await db.sanitize(req.id);', colorClass: 'text-emerald-400 font-medium' },
      { code: '  return Response.json({ success: true, user });', colorClass: 'text-neutral-400' },
      { code: '}', colorClass: 'text-purple-400' },
    ]
  },
  {
    id: 'injection',
    name: 'SQL Vulnerability',
    filename: 'userDatabase.ts',
    score: 24,
    badgeVariant: 'error',
    statusLabel: 'CRITICAL INJECTION',
    summary: 'Direct string concatenation in raw SQL query',
    latency: 3,
    nodes: 114,
    codeLines: [
      { code: 'export async function getUser(req: Request) {', colorClass: 'text-purple-400' },
      { code: '  const id = req.query.id;', colorClass: 'text-neutral-400' },
      { code: '  // Vulnerable: unescaped parameter injection!', colorClass: 'text-rose-500 font-medium' },
      { code: "  const query = `SELECT * FROM users WHERE id = '${id}'`;", colorClass: 'text-rose-400 font-semibold' },
      { code: '  return db.raw(query);', colorClass: 'text-neutral-400' },
      { code: '}', colorClass: 'text-purple-400' },
    ]
  },
  {
    id: 'recursion',
    name: 'Recursive Stack Risk',
    filename: 'factorial.ts',
    score: 48,
    badgeVariant: 'warning',
    statusLabel: 'STACK OVERFLOW RISK',
    summary: 'Unbounded recursion without tail-call guard',
    latency: 6,
    nodes: 88,
    codeLines: [
      { code: 'function computeDepth(depth: number) {', colorClass: 'text-purple-400' },
      { code: '  if (depth <= 1) return 1;', colorClass: 'text-neutral-400' },
      { code: '  // Missing tail-call optimization & stack guard', colorClass: 'text-amber-500 font-medium' },
      { code: '  return depth * computeDepth(depth - 1);', colorClass: 'text-amber-400 font-semibold' },
      { code: '}', colorClass: 'text-purple-400' },
    ]
  }
];

interface ProductPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigateToStudio: () => void;
  mousePosition?: { x: number; y: number };
  isMouseActive?: boolean;
}

// Magnetic Button Effect Wrapper
const MagneticButton: React.FC<{ children: React.ReactNode; strength?: number }> = ({ children, strength = 0.3 }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    ref.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0px, 0px)';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block transition-transform duration-300 ease-out"
    >
      {children}
    </div>
  );
};

// Floating Code Particles
const PARTICLES = [
  { symbol: '{ }', x: '12%', y: '20%', delay: '0s', duration: '18s', size: 'text-lg', opacity: 'opacity-[0.06]' },
  { symbol: '< />', x: '78%', y: '35%', delay: '3s', duration: '22s', size: 'text-base', opacity: 'opacity-[0.05]' },
  { symbol: '//', x: '88%', y: '15%', delay: '6s', duration: '20s', size: 'text-xl', opacity: 'opacity-[0.04]' },
  { symbol: '( )', x: '5%', y: '55%', delay: '2s', duration: '24s', size: 'text-base', opacity: 'opacity-[0.05]' },
  { symbol: '[ ]', x: '65%', y: '65%', delay: '8s', duration: '19s', size: 'text-sm', opacity: 'opacity-[0.04]' },
  { symbol: '=>', x: '30%', y: '75%', delay: '4s', duration: '21s', size: 'text-lg', opacity: 'opacity-[0.05]' },
  { symbol: '&&', x: '50%', y: '10%', delay: '7s', duration: '23s', size: 'text-sm', opacity: 'opacity-[0.04]' },
];

export const ProductPage: React.FC<ProductPageProps> = ({
  isDark,
  onToggleTheme,
  onNavigateToStudio,
  mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  isMouseActive = false
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [activeScenarioId, setActiveScenarioId] = useState<string>('clean');

  const currentScenario = PREVIEW_SCENARIOS.find(s => s.id === activeScenarioId) || PREVIEW_SCENARIOS[0];

  const handleUseCodeSense = () => {
    if (isAuthenticated) {
      onNavigateToStudio();
    } else {
      openAuthModal('signin');
    }
  };

  return (
    <div className={`relative min-h-screen font-sans transition-colors duration-300 ${
      isDark 
        ? 'bg-[#050508] text-neutral-100 selection:bg-white/20 selection:text-white' 
        : 'bg-[#f5f5f7] text-[#1d1d1f] selection:bg-black/10 selection:text-black'
    }`}>
      {/* Apple 2px Frosted Scroll Progress Beam */}
      <ScrollProgress isDark={isDark} />

      {/* Background Ambient Lights */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Dynamic animated light streaks */}
        <div className="absolute inset-0">
          {/* Main streak from top-right */}
          <div 
            className="absolute top-0 right-0 w-[1200px] h-[400px] animate-float-streak-1"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, transparent 0%, rgba(100, 150, 255, 0.15) 40%, rgba(150, 100, 255, 0.1) 70%, transparent 100%)'
                : 'linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.03) 70%, transparent 100%)',
              filter: 'blur(60px)',
              transform: 'rotate(-30deg) translate(50%, -50%)',
              mixBlendMode: isDark ? 'screen' : 'multiply'
            }}
          />
          
          {/* Secondary streak from bottom-left */}
          <div 
            className="absolute bottom-0 left-0 w-[800px] h-[300px] animate-float-streak-2"
            style={{
              background: isDark 
                ? 'linear-gradient(45deg, transparent 0%, rgba(150, 200, 255, 0.12) 30%, rgba(200, 150, 255, 0.08) 60%, transparent 100%)'
                : 'linear-gradient(45deg, transparent 0%, rgba(0, 0, 0, 0.04) 30%, rgba(0, 0, 0, 0.02) 60%, transparent 100%)',
              filter: 'blur(50px)',
              transform: 'rotate(25deg) translate(-30%, 30%)',
              mixBlendMode: isDark ? 'screen' : 'multiply'
            }}
          />
          
          {/* Mouse-following Blue Star light trail & strong outside radial gradient */}
          {/* 1. Trailing Blue Star Starlight Ghost (Smooth celestial trail following cursor) */}
          <div 
            className="fixed w-[360px] h-[360px] rounded-full pointer-events-none transition-transform duration-500 ease-out"
            style={{
              background: isDark 
                ? 'radial-gradient(circle, rgba(186, 230, 253, 0.20) 0%, rgba(56, 189, 248, 0.12) 30%, rgba(14, 165, 233, 0.05) 60%, transparent 75%)'
                : 'radial-gradient(circle, rgba(125, 211, 252, 0.12) 0%, rgba(56, 189, 248, 0.06) 35%, transparent 70%)',
              transform: `translate(${mousePosition.x - 180}px, ${mousePosition.y - 180}px)`,
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isMouseActive ? 1 : 0,
              transition: 'transform 500ms ease-out, opacity 250ms ease-out',
              zIndex: 1
            }}
          />

          {/* 2. Strong Blue Supergiant Radial Gradient (Intense, hot light-blue celestial glow) */}
          <div 
            className="fixed w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{
              background: isDark 
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(186, 230, 253, 0.20) 20%, rgba(56, 189, 248, 0.15) 42%, rgba(14, 165, 233, 0.05) 65%, transparent 78%)'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.60) 0%, rgba(186, 230, 253, 0.25) 25%, rgba(56, 189, 248, 0.08) 50%, transparent 75%)',
              transform: `translate(${mousePosition.x - 240}px, ${mousePosition.y - 240}px)`,
              mixBlendMode: isDark ? 'screen' : 'soft-light',
              opacity: isMouseActive ? 1 : 0,
              transition: 'transform 200ms ease-out, opacity 250ms ease-out',
              zIndex: 2
            }}
          />
        </div>
        
        {/* Existing ambient lights */}
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

      {/* Top Navigation Bar */}
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

            {/* Right Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
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

              {/* Use CodeSense Pro CTA */}
              <Button
                variant="primary"
                size="sm"
                isDark={isDark}
                onClick={handleUseCodeSense}
                className="px-4 py-2 text-xs font-semibold"
              >
                <Code2 className="w-3.5 h-3.5 mr-1" />
                <span>Use CodeSense Pro</span>
              </Button>

              {/* Auth state actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" isDark={isDark} withDot={true}>
                    {user?.name || 'Developer'}
                  </Badge>
                  <button
                    onClick={() => logout()}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center ${
                      isDark 
                        ? 'text-neutral-400 hover:text-white border-white/10' 
                        : 'text-neutral-600 hover:text-black border-black/10'
                    }`}
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  isDark={isDark}
                  onClick={() => openAuthModal('signin')}
                  className="text-xs px-3.5 py-1.5"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-24">
        {/* Dedicated Full-Screen Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-between text-center max-w-3xl mx-auto pt-10 sm:pt-16 pb-8 sm:pb-10 relative">
          {/* Floating Code Particles */}
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className={`absolute font-mono select-none pointer-events-none animate-float-particle ${p.size} ${p.opacity} ${
                isDark ? 'text-white' : 'text-black'
              }`}
              style={{
                left: p.x,
                top: p.y,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            >
              {p.symbol}
            </div>
          ))}

          {/* Central Hero Headline & CTA Package */}
          <div className="my-auto space-y-6 sm:space-y-7 flex flex-col items-center">
            <ScrollReveal delay={0} distance={20}>
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md tracking-wide ${
                isDark 
                  ? 'bg-white/[0.04] border-white/10 text-neutral-300' 
                  : 'bg-black/[0.04] border-black/10 text-neutral-700'
              }`}>
                <span>AI-Powered Heuristic Engine</span>
              </div>
            </ScrollReveal>


            <ScrollReveal delay={100} distance={28}>
              <h1 className={`text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] ${
                isDark ? 'text-apple-headline-dark' : 'text-apple-headline-light'
              }`}>
                Code review, redefined.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200} distance={28}>
              <p className={`text-base sm:text-xl leading-relaxed max-w-2xl mx-auto font-normal ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}>
                Surgical static inspection, runtime safety diagnostics, and architectural guidance crafted with Apple precision.
              </p>
            </ScrollReveal>

            {/* Primary CTA Button with Magnetic Effect */}
            <ScrollReveal delay={300} distance={24}>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <MagneticButton strength={0.25}>
                  <Button
                    variant="primary"
                    size="lg"
                    isDark={isDark}
                    onClick={handleUseCodeSense}
                    className="px-10 py-4 rounded-full text-sm font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    <Play className={`w-4 h-4 mr-2 ${isDark ? 'fill-black' : 'fill-white'}`} />
                    <span>Use CodeSense Pro</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </MagneticButton>
              </div>
            </ScrollReveal>
          </div>

          {/* Apple Downward Scroll Cue Button - Anchored at bottom of Hero Viewport */}
          <ScrollReveal delay={380} distance={15}>
            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={() => {
                  const previewEl = document.getElementById('preview-showcase');
                  if (previewEl) {
                    previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`group inline-flex items-center gap-2 text-xs font-medium tracking-wide transition-all cursor-pointer select-none py-2 px-4 rounded-full border shadow-sm ${
                  isDark
                    ? 'text-neutral-400 hover:text-white border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'text-neutral-500 hover:text-black border-black/10 hover:border-black/20 bg-black/[0.03] hover:bg-black/[0.06]'
                }`}
              >
                <span>Explore Heuristics</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5 animate-bounce" />
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* Interactive Studio Preview Showcase */}
        <section id="preview-showcase" className="max-w-5xl mx-auto space-y-6 pt-12 sm:pt-16 scroll-mt-24">
          {/* Scenario Selector Pills */}
          <ScrollReveal delay={0}>
            <div className="flex flex-col items-center space-y-3 text-center">
              <span className={`text-xs font-semibold uppercase tracking-widest ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Live Heuristic Preview • Choose Scenario
              </span>
              <div className={`inline-flex flex-wrap items-center justify-center p-1.5 rounded-full border backdrop-blur-xl gap-1.5 transition-all shadow-sm ${
                isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'
              }`}>
                {PREVIEW_SCENARIOS.map((sc) => {
                  const isActive = sc.id === activeScenarioId;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setActiveScenarioId(sc.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                        isActive
                          ? isDark
                            ? 'bg-white text-black shadow-md scale-105'
                            : 'bg-[#1d1d1f] text-white shadow-md scale-105'
                          : isDark
                          ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                          : 'text-neutral-600 hover:text-black hover:bg-black/5'
                      }`}
                    >
                      {sc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* 3D Perspective Card with Orbiting Satellite Pills */}
          <div className="relative">
            {/* Satellite Floating Glass Badges (Clean Typography, No Icons) */}
            <div className={`hidden md:flex absolute -top-4 -left-3 z-20 items-center px-3.5 py-1.5 rounded-full border backdrop-blur-2xl shadow-lg animate-float-1 select-none ${
              isDark 
                ? 'bg-[#101018]/85 border-white/15 text-neutral-200 shadow-black/40' 
                : 'bg-white/90 border-black/10 text-neutral-800 shadow-black/10'
            }`}>
              <span className="text-[11px] font-medium tracking-wide">Zero Injection Risk</span>
            </div>

            <div className={`hidden md:flex absolute -top-4 -right-3 z-20 items-center px-3.5 py-1.5 rounded-full border backdrop-blur-2xl shadow-lg animate-float-2 select-none ${
              isDark 
                ? 'bg-[#101018]/85 border-white/15 text-neutral-200 shadow-black/40' 
                : 'bg-white/90 border-black/10 text-neutral-800 shadow-black/10'
            }`}>
              <span className="text-[11px] font-medium tracking-wide">0.04ms AST Latency</span>
            </div>

            <div className={`hidden lg:flex absolute -bottom-4 -left-3 z-20 items-center px-3.5 py-1.5 rounded-full border backdrop-blur-2xl shadow-lg animate-float-3 select-none ${
              isDark 
                ? 'bg-[#101018]/85 border-white/15 text-neutral-200 shadow-black/40' 
                : 'bg-white/90 border-black/10 text-neutral-800 shadow-black/10'
            }`}>
              <span className="text-[11px] font-medium tracking-wide">12 Polyglot Runtimes</span>
            </div>

            {/* Main Preview Card */}
            <Card isDark={isDark} className={`p-4 sm:p-6 rounded-3xl border shadow-2xl transition-all ${
              isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
            }`}>
                {/* Window Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b text-xs select-none ${
                  isDark ? 'border-white/10 text-neutral-400' : 'border-black/10 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 font-mono text-[11px]">
                      CodeSense Studio • {currentScenario.filename}
                    </span>
                  </div>
                  <Badge variant={currentScenario.badgeVariant} isDark={isDark} withDot={true}>
                    {currentScenario.statusLabel}
                  </Badge>
                </div>

                {/* Body: Morphing Code Pane + Dynamic Radial Score Gauge */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 items-center">
                  {/* Code Snippet */}
                  <div className="md:col-span-7 space-y-3 font-mono text-xs p-4 sm:p-5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 min-h-[160px] flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-neutral-400 text-[11px] mb-1">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{currentScenario.filename}</span>
                    </div>
                    <div className="space-y-1 opacity-90 transition-all duration-300">
                      {currentScenario.codeLines.map((line, idx) => (
                        <p key={idx} className={line.colorClass || 'text-neutral-300'}>
                          {line.code}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Quality Index Gauge & Diagnostics */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 space-y-3 text-center">
                    <ScoreGauge 
                      score={currentScenario.score} 
                      isDark={isDark} 
                      size={96} 
                      strokeWidth={8} 
                    />
                    <div>
                      <div className="text-xs font-semibold">
                        {currentScenario.statusLabel}
                      </div>
                      <p className="text-[11px] opacity-70 mt-0.5">
                        {currentScenario.summary}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full pt-1 text-[11px]">
                      <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/5'}`}>
                        <div className="font-bold text-xs">
                          <AnimatedCounter target={currentScenario.latency} suffix="ms" />
                        </div>
                        <div className="opacity-60 text-[10px]">Scan Latency</div>
                      </div>
                      <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.03] border-black/5'}`}>
                        <div className="font-bold text-xs">
                          <AnimatedCounter target={currentScenario.nodes} suffix=" AST" />
                        </div>
                        <div className="opacity-60 text-[10px]">Nodes Checked</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
          </div>
        </section>

        {/* Features Bento Grid with Staggered Scroll Reveal */}
        <section className="space-y-8 mt-24 sm:mt-32">
          <ScrollReveal delay={0}>
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                Engineered for surgical precision
              </h2>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Everything you need to audit, protect, and refine your codebase in seconds.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ScrollReveal delay={60} className="h-full">
              <Card isDark={isDark} className="h-full p-6 sm:p-7 space-y-3 text-center flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-white/[0.05] border-white/10 text-cyan-400' : 'bg-black/[0.04] border-black/10 text-blue-600'
                }`}>
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold">Real-Time AST Diagnostics</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Deconstructs abstract syntax trees to identify anti-patterns, memory traps, and unbound recursions.
                </p>
                <div className="mt-auto pt-3 text-[11px] font-mono opacity-70">
                  <AnimatedCounter target={0.04} decimals={2} suffix="ms AST parse" />
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={140} className="h-full">
              <Card isDark={isDark} className="h-full p-6 sm:p-7 space-y-3 text-center flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-white/[0.05] border-white/10 text-emerald-400' : 'bg-black/[0.04] border-black/10 text-emerald-600'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold">Security & Safety Vectors</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Evaluates SQL injections, async race conditions, token leaks, and improper input sanitization.
                </p>
                <div className="mt-auto pt-3 text-[11px] font-mono text-emerald-500 opacity-90">
                  <AnimatedCounter target={100} suffix="% Local Execution" />
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={220} className="h-full">
              <Card isDark={isDark} className="h-full p-6 sm:p-7 space-y-3 text-center flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-white/[0.05] border-white/10 text-purple-400' : 'bg-black/[0.04] border-black/10 text-purple-600'
                }`}>
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold">Polyglot Auto-Detection</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Instant syntax recognition across 12 modern languages with zero manual configuration.
                </p>
                <div className="mt-auto pt-3 text-[11px] font-mono text-purple-400 opacity-90">
                  <AnimatedCounter target={12} suffix=" Runtimes Supported" />
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* Supported Languages Shelf */}
        <ScrollReveal delay={100}>
          <section className="space-y-4 text-center pt-4 mt-24 sm:mt-32">
            <div className="space-y-1">
              <h3 className={`text-xs uppercase tracking-widest font-bold ${
                isDark ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                Universal Language Support
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                Instant heuristics across all 12 major programming runtimes
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <div
                  key={lang.id}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2 ${
                    isDark
                      ? 'bg-white/[0.02] border-white/[0.06] text-neutral-300 hover:border-white/20'
                      : 'bg-white/80 border-black/[0.06] text-neutral-700 shadow-xs hover:border-black/20'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[10px] font-mono opacity-50">{lang.extension}</span>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Bottom CTA Banner */}
        <ScrollReveal delay={80} scale={0.96}>
          <section className="max-w-4xl mx-auto text-center mt-24 sm:mt-32">
            <Card isDark={isDark} className={`p-8 sm:p-12 rounded-3xl text-center space-y-5 border ${
              isDark ? 'bg-[#0a0a10] border-white/15' : 'bg-white border-black/10 shadow-lg'
            }`}>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Ready to elevate your code standard?
              </h2>
              <p className={`text-sm max-w-md mx-auto leading-relaxed ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}>
                Open the studio now to benchmark performance, audit vulnerabilities, and generate intelligent fixes.
              </p>
              <div className="pt-2 flex justify-center">
                <MagneticButton strength={0.25}>
                  <Button
                    variant="primary"
                    size="lg"
                    isDark={isDark}
                    onClick={handleUseCodeSense}
                    className="px-10 py-4 rounded-full text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    <span>Launch CodeSense Studio</span>
                  </Button>
                </MagneticButton>
              </div>
            </Card>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className={`mt-24 sm:mt-32 pt-12 sm:pt-16 border-t text-center space-y-4 select-none ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <div className={`flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>Security Heuristics</span>
            <span>•</span>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>AST Diagnostics</span>
            <span>•</span>
            <span className={isDark ? 'hover:text-neutral-200 cursor-pointer' : 'hover:text-black cursor-pointer'}>SQLite Persistence</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ProductPage;
