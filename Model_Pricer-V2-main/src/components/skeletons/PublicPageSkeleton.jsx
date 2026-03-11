/**
 * PublicPageSkeleton — Loading skeleton for public pages (account, etc.).
 *
 * Mimics a centered content page with heading and content area.
 * Uses ForgeSkeleton components and Forge dark theme tokens.
 */
import React from 'react';
import { Skeleton, SkeletonCard } from '../ui/forge/ForgeSkeleton';
import '../../styles/animations.css';

const s = {
  container: {
    padding: '48px 24px',
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
};

export default function PublicPageSkeleton() {
  return (
    <div style={s.container} className="skeleton-pulse" aria-hidden="true" role="status" aria-label="Loading page">
      <Skeleton width="240px" height="1.75rem" style={{ marginBottom: '8px' }} />
      <Skeleton width="360px" height="0.875rem" />
      <SkeletonCard textLines={4} />
    </div>
  );
}
