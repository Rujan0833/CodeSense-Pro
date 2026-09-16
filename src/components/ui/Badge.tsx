import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  withDot?: boolean;
  isDark?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  withDot = true,
  isDark = false
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-tight border backdrop-blur-md transition-all duration-200';
  
  const darkVariants = {
    default: 'bg-white/[0.06] border-white/10 text-neutral-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
  };

  const lightVariants = {
    default: 'bg-black/[0.04] border-black/10 text-neutral-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800'
  };

  const dotColors = {
    default: isDark ? 'bg-neutral-400' : 'bg-neutral-600',
    success: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
    warning: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
    error: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
    info: 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)]'
  };

  const variants = isDark ? darkVariants : lightVariants;

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;