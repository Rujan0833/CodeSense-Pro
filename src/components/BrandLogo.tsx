import React from 'react';
import { Code2 } from 'lucide-react';

interface BrandLogoProps {
  isDark: boolean;
  badge?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ isDark, badge }) => (
  <div className="group flex items-center gap-3">
    <div className={`studio-logo w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105 ${
      isDark ? 'bg-white/[0.06] border-white/15' : 'bg-white/80 border-black/10'
    }`}>
      <Code2 className={`studio-logo-icon w-4 h-4 ${isDark ? 'text-neutral-100' : 'text-neutral-700'}`} />
    </div>
    <div className="flex items-center gap-2">
      <span className={`font-semibold tracking-tight text-base ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
        CodeSense
      </span>
      {badge && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          isDark
            ? 'bg-white/10 text-neutral-300 border-white/15'
            : 'bg-black/[0.05] text-neutral-700 border-black/10'
        }`}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default BrandLogo;
