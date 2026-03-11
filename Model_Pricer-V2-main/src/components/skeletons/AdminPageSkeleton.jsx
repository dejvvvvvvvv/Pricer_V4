/**
 * AdminPageSkeleton — Loading skeleton for admin panel pages.
 *
 * Mimics typical admin page layout: page title, action bar, content cards/table.
 * Uses ForgeSkeleton components and Forge dark theme tokens.
 */
import React from 'react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from '../ui/forge/ForgeSkeleton';
import '../../styles/animations.css';

const s = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    padding: '16px',
    borderRadius: 'var(--forge-radius-lg, 8px)',
    background: 'var(--forge-bg-elevated, #161920)',
    border: '1px solid var(--forge-border-default, #1E2230)',
  },
};

export default function AdminPageSkeleton({ variant = 'default' }) {
  return (
    <div style={s.container} className="skeleton-pulse" aria-hidden="true" role="status" aria-label="Loading admin page">
      {/* Page header */}
      <div style={s.header}>
        <div>
          <Skeleton width="200px" height="1.5rem" style={{ marginBottom: '8px' }} />
          <Skeleton width="300px" height="0.875rem" />
        </div>
        <div style={s.actionBar}>
          <Skeleton width="120px" height="36px" borderRadius="var(--forge-radius-md, 6px)" />
        </div>
      </div>

      {variant === 'dashboard' && (
        /* Dashboard: stat cards + table */
        <>
          <div style={s.statsGrid}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={s.statCard}>
                <Skeleton width="60%" height="0.75rem" style={{ marginBottom: '12px' }} />
                <Skeleton width="40%" height="1.75rem" />
              </div>
            ))}
          </div>
          <SkeletonTable rows={6} cols={5} />
        </>
      )}

      {variant === 'table' && (
        /* Table-based pages (orders, presets, etc.) */
        <>
          <div style={s.actionBar}>
            <Skeleton width="240px" height="36px" borderRadius="var(--forge-radius-md, 6px)" />
            <Skeleton width="100px" height="36px" borderRadius="var(--forge-radius-md, 6px)" />
          </div>
          <SkeletonTable rows={8} cols={5} />
        </>
      )}

      {variant === 'form' && (
        /* Form-based pages (branding, pricing, fees) */
        <>
          <SkeletonCard textLines={4} />
          <SkeletonCard textLines={3} />
          <SkeletonCard textLines={2} />
        </>
      )}

      {variant === 'default' && (
        /* Generic fallback */
        <>
          <SkeletonCard textLines={3} />
          <SkeletonCard textLines={4} />
        </>
      )}
    </div>
  );
}
