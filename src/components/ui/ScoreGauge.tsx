import React, { useEffect, useRef, useState } from 'react';
import AnimatedCounter from './AnimatedCounter';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  isDark?: boolean;
  className?: string;
  animateOnMount?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 110,
  strokeWidth = 9,
  isDark = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else if (entry.boundingClientRect.top > (window.innerHeight || 600) * 0.3) {
          // Reset when scrolled back up above the element so it re-draws when scrolling down
          setIsInView(false);
          setAnimatedScore(0);
        }
      },
      { threshold: 0.15 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    // Delay slightly to trigger the smooth CSS stroke-dashoffset transition
    const timer = setTimeout(() => {
      setAnimatedScore(Math.min(Math.max(score, 0), 100));
    }, 60);
    return () => clearTimeout(timer);
  }, [score, isInView]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColorConfig = () => {
    if (score >= 90) {
      return {
        color: '#10b981', // 12 o'clock: Pure Apple Emerald Green
        glow: 'rgba(16, 185, 129, 0.4)',
        textClass: 'text-emerald-500',
        label: 'Optimal',
      };
    }
    if (score >= 75) {
      return {
        color: '#22c55e', // Lighter Green
        glow: 'rgba(34, 197, 94, 0.35)',
        textClass: 'text-green-500',
        label: 'Good',
      };
    }
    if (score >= 45) {
      return {
        color: '#f59e0b', // Half circle (6 o'clock): Warm Orange/Amber
        glow: 'rgba(245, 158, 11, 0.35)',
        textClass: 'text-amber-500',
        label: 'Acceptable',
      };
    }
    if (score >= 30) {
      return {
        color: '#f97316', // Below half: Deep Orange
        glow: 'rgba(249, 115, 22, 0.35)',
        textClass: 'text-orange-500',
        label: 'Warning',
      };
    }
    return {
      color: '#ef4444', // Below 3pm / Low score: Critical Red
      glow: 'rgba(239, 68, 68, 0.4)',
      textClass: 'text-rose-500',
      label: 'Critical',
    };
  };

  const { color, glow, textClass } = getColorConfig();

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-xl transition-all duration-700 pointer-events-none"
        style={{ 
          background: glow,
          opacity: 0.6,
          transform: 'scale(0.85)',
        }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Score Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.6s ease',
          }}
        />
      </svg>

      {/* Centered Score Display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${textClass}`}>
          <AnimatedCounter target={isInView ? score : 0} duration={1100} />
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-widest font-semibold opacity-60`}>
          / 100
        </span>
      </div>
    </div>
  );
};

export default ScoreGauge;
