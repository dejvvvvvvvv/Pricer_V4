import React, { useMemo, useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * Card with a "spotlight" hover effect (radial glow follows cursor).
 */
export default function SpotlightCard({ className, children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const bg = useMemo(() => ({
    background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(37,99,235,0.18), transparent 40%)`,
  }), [pos]);

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-micro hover:shadow-lg',
        className
      )}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={bg}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
      <div className="relative">{children}</div>
    </div>
  );
}
