/*
  ForgeSkeleton — Reusable loading skeleton components with shimmer animation.
  Uses Forge design tokens and the existing forge-shimmer animation from forge-animations.css.

  Variants:
  - Skeleton       — single rectangular placeholder (configurable width/height/radius)
  - SkeletonText   — multi-line text placeholder (last line shorter)
  - SkeletonCard   — card with title + text skeleton
  - SkeletonTable  — table with header + rows
  - SkeletonCircle — circular avatar/icon placeholder
*/

import React from 'react';

/**
 * Base skeleton block with shimmer animation.
 * Uses .forge-shimmer class from forge-animations.css for the shimmer effect.
 *
 * @param {string|number} [width='100%'] - CSS width
 * @param {string|number} [height='1rem'] - CSS height
 * @param {string} [borderRadius] - CSS border-radius (defaults to --forge-radius-sm)
 * @param {string} [className] - Additional CSS class names
 * @param {object} [style] - Additional inline styles
 */
export function Skeleton({ width, height = '1rem', borderRadius, className = '', style = {} }) {
  return (
    <div
      className={`forge-shimmer ${className}`}
      style={{
        width: width || '100%',
        height,
        borderRadius: borderRadius || 'var(--forge-radius-sm, 4px)',
        background: 'var(--forge-bg-overlay, #1C1F28)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      role="status"
      aria-label="Loading"
      aria-hidden="true"
    />
  );
}

/**
 * Multi-line text skeleton. Last line is rendered at 60% width for realism.
 *
 * @param {number} [lines=3] - Number of text lines
 * @param {string} [gap='0.5rem'] - Vertical gap between lines
 * @param {string} [lineHeight='0.875rem'] - Height of each line
 */
export function SkeletonText({ lines = 3, gap = '0.5rem', lineHeight = '0.875rem' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={lineHeight}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton with a title bar and text lines.
 *
 * @param {number} [textLines=3] - Number of body text lines
 */
export function SkeletonCard({ textLines = 3 }) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--forge-radius-lg, 8px)',
        background: 'var(--forge-bg-elevated, #161920)',
        border: '1px solid var(--forge-border-default, #1E2230)',
      }}
      aria-hidden="true"
    >
      <Skeleton height="1.25rem" width="40%" style={{ marginBottom: '0.75rem' }} />
      <SkeletonText lines={textLines} />
    </div>
  );
}

/**
 * Table skeleton with header row and data rows.
 *
 * @param {number} [rows=5] - Number of data rows
 * @param {number} [cols=4] - Number of columns
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        borderRadius: 'var(--forge-radius-md, 6px)',
        overflow: 'hidden',
        border: '1px solid var(--forge-border-default, #1E2230)',
      }}
      aria-hidden="true"
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--forge-bg-overlay, #1C1F28)',
        }}
      >
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height="0.75rem" width="70%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--forge-bg-elevated, #161920)',
          }}
        >
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height="0.875rem" width={`${60 + (c * 10) % 40}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Circular skeleton for avatars or icons.
 *
 * @param {string|number} [size='2.5rem'] - Diameter
 */
export function SkeletonCircle({ size = '2.5rem' }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
    />
  );
}

export default Skeleton;
