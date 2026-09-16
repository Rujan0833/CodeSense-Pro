import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  showIcon?: boolean;
  isDark?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  showIcon = false,
  isDark = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'group relative inline-flex items-center justify-center font-medium tracking-tight rounded-full transition-all duration-200 active:scale-[0.98] select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';
  
  const darkVariants = {
    primary: 'bg-white text-black hover:bg-[#ededed] shadow-[0_4px_20px_rgba(255,255,255,0.15)] border border-white/20',
    secondary: 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 shadow-sm backdrop-blur-md',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-neutral-300 hover:text-white',
  };

  const lightVariants = {
    primary: 'bg-[#1d1d1f] text-white hover:bg-black shadow-[0_6px_20px_rgba(0,0,0,0.12)] border border-black/10',
    secondary: 'bg-black/[0.04] hover:bg-black/[0.08] text-neutral-800 border border-black/10 shadow-sm backdrop-blur-md',
    ghost: 'bg-transparent hover:bg-black/[0.05] text-neutral-700 hover:text-black',
  };
  
  const variants = isDark ? darkVariants : lightVariants;

  const sizes = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-9 py-3.5 text-sm font-semibold gap-2.5'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
        {showIcon && (
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </span>
    </button>
  );
};

export default Button;