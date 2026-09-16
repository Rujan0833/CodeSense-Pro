import React from 'react';
import Editor from '@monaco-editor/react';
import { Terminal, Copy, Check } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  isAnalyzing?: boolean;
  isDark?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  language, 
  onChange, 
  height = '420px',
  isAnalyzing = false,
  isDark = false
}) => {
  const [copied, setCopied] = React.useState(false);

  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code.length;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 border ${
      isDark 
        ? 'border-white/10 bg-[#0a0a0f] shadow-[0_20px_50px_rgba(0,0,0,0.6)]' 
        : 'border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
    } group`}>
      {/* macOS Window Chrome Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b select-none backdrop-blur-md ${
        isDark 
          ? 'bg-[#111118]/90 border-white/[0.06]' 
          : 'bg-[#f4f4f7] border-black/[0.06]'
      }`}>
        {/* Traffic Light Dots */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]/90 hover:bg-[#ff5f56] transition-colors shadow-[0_0_8px_rgba(255,95,86,0.3)]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 hover:bg-[#ffbd2e] transition-colors shadow-[0_0_8px_rgba(255,189,46,0.3)]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]/90 hover:bg-[#27c93f] transition-colors shadow-[0_0_8px_rgba(39,201,63,0.3)]" />
          <div className="ml-3 flex items-center gap-1.5 text-xs font-mono">
            <Terminal className={`w-3 h-3 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
            <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
              source.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : language}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              isDark 
                ? 'text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]' 
                : 'text-neutral-600 hover:text-black bg-black/[0.04] hover:bg-black/[0.08]'
            }`}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Container with Monaco */}
      <div className="relative">
        {/* Radar Scanning Laser Beam Animation when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden bg-indigo-500/[0.03]">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-laser-sweep" />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-purple-500/10 animate-pulse" />
          </div>
        )}

        <Editor
          height={height}
          language={language}
          value={code}
          onChange={onChange}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', monospace",
            fontLigatures: true,
            renderWhitespace: 'none',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            lineDecorationsWidth: 8,
            glyphMargin: false,
            roundedSelection: true,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>

      {/* Symmetrical Footer Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-t text-[11px] font-mono select-none ${
        isDark 
          ? 'bg-[#0d0d14]/80 border-white/[0.05] text-neutral-400' 
          : 'bg-[#f4f4f7] border-black/[0.05] text-neutral-600'
      }`}>
        <div className="flex items-center gap-3">
          <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span className="opacity-30">•</span>
          <span>{charCount} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="uppercase text-[10px] tracking-wider opacity-70">UTF-8</span>
          <span className="opacity-30">•</span>
          <span className="uppercase text-[10px] tracking-wider font-semibold">{language}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;