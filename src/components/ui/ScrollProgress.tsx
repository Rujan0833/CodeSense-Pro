import React, { useEffect, useState } from 'react';

interface ScrollProgressProps {
  isDark?: boolean;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ isDark = false }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const currentProgress = window.scrollY / scrollHeight;
        setProgress(Math.min(Math.max(currentProgress, 0), 1));
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none">
      <div
        className={`h-full transition-transform duration-75 ease-out origin-left ${
          isDark
            ? 'bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
            : 'bg-[#1d1d1f] shadow-[0_0_4px_rgba(0,0,0,0.15)]'
        }`}
        style={{
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
};

export default ScrollProgress;
