import React, { useEffect, useRef, useState } from 'react';

interface PerspectiveScrollProps {
  children: React.ReactNode;
  className?: string;
  maxRotateX?: number; // default: 12 degrees
  minScale?: number; // default: 0.94
}

export const PerspectiveScroll: React.FC<PerspectiveScrollProps> = ({
  children,
  className = '',
  maxRotateX = 12,
  minScale = 0.94,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState({
    rotateX: maxRotateX,
    scale: minScale,
    translateY: 30,
    opacity: 0.85,
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!containerRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Target: when element top is at 60% of viewport, progress = 1 (fully flat)
          // When element top is at 100% of viewport (entering bottom), progress = 0
          const start = windowHeight;
          const end = windowHeight * 0.45;

          let progress = (start - rect.top) / (start - end);
          progress = Math.max(0, Math.min(1, progress));

          // Apple easeOutQuad curve
          const easeProgress = 1 - Math.pow(1 - progress, 2);

          const currentRotateX = maxRotateX * (1 - easeProgress);
          const currentScale = minScale + (1 - minScale) * easeProgress;
          const currentTranslateY = 30 * (1 - easeProgress);
          const currentOpacity = 0.85 + 0.15 * easeProgress;

          setTransformStyle({
            rotateX: parseFloat(currentRotateX.toFixed(2)),
            scale: parseFloat(currentScale.toFixed(3)),
            translateY: parseFloat(currentTranslateY.toFixed(1)),
            opacity: parseFloat(currentOpacity.toFixed(2)),
          });

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // initial trigger

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [maxRotateX, minScale]);

  return (
    <div
      ref={containerRef}
      className={`transition-transform duration-75 ease-out ${className}`}
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 30%',
      }}
    >
      <div
        style={{
          transform: `rotateX(${transformStyle.rotateX}deg) scale(${transformStyle.scale}) translateY(${transformStyle.translateY}px)`,
          opacity: transformStyle.opacity,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PerspectiveScroll;
