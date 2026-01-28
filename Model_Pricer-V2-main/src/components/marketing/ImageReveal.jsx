import React, { useId, useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * Lightweight before/after reveal.
 * Pass `before` and `after` as React nodes.
 */
export default function ImageReveal({
  before,
  after,
  className,
  initial = 0.55,
}) {
  const id = useId();
  const [pct, setPct] = useState(initial);

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border bg-card', className)}>
      <div className="relative aspect-[16/9]">
        <div className="absolute inset-0">{before}</div>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pct * 100}%` }}
        >
          <div className="absolute inset-0">{after}</div>
        </div>

        {/* Divider */}
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-white/40 shadow"
          style={{ left: `${pct * 100}%` }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center"
          style={{ left: `calc(${pct * 100}% - 20px)` }}
        >
          <div className="h-4 w-4 rounded-full bg-primary/80" />
        </div>

        {/* Slider */}
        <label htmlFor={id} className="sr-only">
          Reveal
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
