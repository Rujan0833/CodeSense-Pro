import React, { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  isDark?: boolean;
}

export const IosSpinner: React.FC<{ size?: number; className?: string }> = ({ 
  size = 28, 
  className = '' 
}) => {
  const blades = Array.from({ length: 12 });
  return (
    <div 
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {blades.map((_, i) => (
        <div
          key={i}
          className="absolute left-[44%] top-[6%] w-[12%] h-[28%] rounded-full bg-current"
          style={{
            transformOrigin: '50% 155%',
            transform: `rotate(${i * 30}deg)`,
            animation: 'ios-blade 1.2s linear infinite',
            animationDelay: `${-1.2 + (i * 0.1)}s`,
          }}
        />
      ))}
    </div>
  );
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Analyzing code...',
  isDark = false 
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    'Parsing abstract syntax tree...',
    'Checking security & logic flow...',
    'Evaluating code complexity...',
    'Synthesizing recommendations...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [phases.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none space-y-4">
      {/* Discreet, Compact Apple iOS Activity Indicator */}
      <div className={isDark ? 'text-white' : 'text-neutral-900'}>
        <IosSpinner size={30} />
      </div>

      <div className="space-y-1.5 max-w-sm text-center">
        <h4 className={`text-sm font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {message}
        </h4>
        <p className={`text-xs font-mono transition-opacity duration-300 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {phases[phaseIndex]}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;