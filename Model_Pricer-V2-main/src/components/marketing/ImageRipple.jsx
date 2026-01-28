import React, { useMemo, useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * Subtle "image ripple" highlight on hover.
 * Works with any children (image / mockup / screenshot).
 */
export default function ImageRipple({ className, children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const overlayStyle = useMemo(() => {
    return {
      background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.22), transparent 40%)`,
    };
  }, [pos.x, pos.y]);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-sm shadow-lg',
        className
      )}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={overlayStyle}
      />
      {/* soft border glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
    </div>
  );
}
