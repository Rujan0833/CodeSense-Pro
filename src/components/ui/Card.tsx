import React, { useRef, useState } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'spotlight';
  spotlightGlow?: boolean;
  isDark?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'spotlight',
  spotlightGlow = true,
  isDark = false,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !spotlightGlow) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    if (spotlightGlow) setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (spotlightGlow) setOpacity(0);
  };

  const baseStyles = 'relative rounded-3xl overflow-hidden transition-all duration-300';
  
  const darkVariants = {
    default: 'apple-glass-card-dark',
    elevated: 'bg-[#121218]/90 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]',
    glass: 'bg-white/[0.03] border border-white/[0.08] hover:border-white/15',
    spotlight: 'apple-glass-card-dark hover:border-white/20',
  };

  const lightVariants = {
    default: 'apple-glass-card-light',
    elevated: 'bg-white border border-black/10 shadow-[0_20px_40px_rgba(0,0,0,0.08)]',
    glass: 'bg-white/70 border border-black/[0.06] hover:border-black/15 shadow-sm',
    spotlight: 'apple-glass-card-light hover:border-black/15 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)]',
  };

  const selectedVariant = isDark ? darkVariants[variant] : lightVariants[variant];

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} ${selectedVariant} ${className}`}
      {...props}
    >
      {/* Spotlight Cursor Gradient */}
      {spotlightGlow && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: isDark
              ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`
              : `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,0,0,0.03), transparent 40%)`,
          }}
        />
      )}

      {/* Subtle specular top highlight */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
        isDark 
          ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-black/5 to-transparent'
      }`} />

      {children}
    </div>
  );
};

export default Card;