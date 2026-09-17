import React, { useRef, useState } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'spotlight';
  spotlightGlow?: boolean;
  isDark?: boolean;
  tiltEnabled?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'spotlight',
  spotlightGlow = true,
  isDark = false,
  tiltEnabled = true,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (spotlightGlow) {
      setPosition({ x, y });
    }

    // 3D Tilt calculations
    if (tiltEnabled) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4; // Max 4 deg tilt
      const rotateY = ((x - centerX) / centerX) * 4;
      setTilt({ rx: rotateX, ry: rotateY });
    }
  };

  const handleMouseEnter = () => {
    if (spotlightGlow) setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (spotlightGlow) setOpacity(0);
    if (tiltEnabled) setTilt({ rx: 0, ry: 0 }); // Reset tilt
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
      style={{
        transform: tiltEnabled
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : undefined,
        transition: opacity === 1 ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      {...props}
    >
      {/* Liquid Glass Surface Glow */}
      {spotlightGlow && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: isDark
              ? `radial-gradient(550px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.085) 0%, rgba(255, 255, 255, 0.035) 25%, rgba(96, 165, 250, 0.02) 45%, transparent 65%)`
              : `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.20) 25%, rgba(0, 113, 227, 0.035) 45%, transparent 70%)`,
          }}
        />
      )}

      {/* Liquid Glass Edge Refraction (Beveled Rim Glow) */}
      {spotlightGlow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-10"
          style={{
            opacity,
            border: '1px solid transparent',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            background: isDark
              ? `radial-gradient(350px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.20) 0%, rgba(96, 165, 250, 0.10) 35%, transparent 70%)`
              : `radial-gradient(350px circle at ${position.x}px ${position.y}px, rgba(0, 113, 227, 0.18) 0%, rgba(0, 0, 0, 0.06) 35%, transparent 70%)`,
          }}
        />
      )}

      {/* Subtle specular top highlight */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
        isDark 
          ? 'bg-gradient-to-r from-transparent via-white/25 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-black/8 to-transparent'
      }`} />

      {children}
    </div>
  );
};

export default Card;