import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';

/**
 * Tiny sparkle overlay (decorative). Uses CSS animation `mp-sparkle`.
 */
export default function Sparkles({ className, count = 8 }) {
  const sparkles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 1.8;
      const dur = 1.6 + Math.random() * 1.6;
      const size = 2 + Math.random() * 2.5;
      return { id: i, left, top, delay, dur, size };
    });
  }, [count]);

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white/70 mp-sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
