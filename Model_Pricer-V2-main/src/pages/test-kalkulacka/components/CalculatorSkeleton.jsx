/**
 * CalculatorSkeleton — Loading skeleton that mimics the test-kalkulacka layout.
 *
 * Shown as Suspense fallback while the calculator page chunk is loading.
 * Uses ForgeSkeleton variants and Forge dark theme tokens.
 * Respects prefers-reduced-motion via forge-shimmer animation.
 */
import React from 'react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from '../../../components/ui/forge/ForgeSkeleton';
import '../../../styles/animations.css';

const s = {
  page: {
    backgroundColor: 'var(--forge-bg-void, #08090C)',
    color: 'var(--forge-text-primary, #E8ECF1)',
    minHeight: '100vh',
    fontFamily: 'var(--forge-font-body)',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 24px 48px',
  },
  // Breadcrumb + title area
  header: {
    marginBottom: '32px',
  },
  // Stepper row
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--forge-bg-elevated, #161920)',
    border: '2px solid var(--forge-border-default, #1E2230)',
    flexShrink: 0,
  },
  stepConnector: {
    width: '48px',
    height: 0,
    borderTop: '2px dashed var(--forge-border-default, #1E2230)',
    flexShrink: 0,
  },
  // Main 2-column grid
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '32px',
  },
  // Left column
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  // Right column
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  // Upload zone skeleton
  uploadZone: {
    padding: '48px 24px',
    borderRadius: 'var(--forge-radius-xl, 12px)',
    border: '2px dashed var(--forge-border-active, #2A2F3E)',
    background: 'var(--forge-bg-void, #08090C)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  // Card container
  card: {
    padding: '16px',
    borderRadius: 'var(--forge-radius-xl, 12px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-surface, #12141B)',
  },
  cardElevated: {
    padding: '16px',
    borderRadius: 'var(--forge-radius-xl, 12px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-elevated, #161920)',
  },
  // Config section
  configRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  configOption: {
    padding: '12px',
    borderRadius: 'var(--forge-radius-md, 6px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-elevated, #161920)',
  },
  // Model viewer placeholder
  viewerBox: {
    aspectRatio: '4/3',
    borderRadius: 'var(--forge-radius-xl, 12px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-surface, #12141B)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pricing card
  pricingCard: {
    padding: '16px',
    borderRadius: 'var(--forge-radius-xl, 12px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-surface, #12141B)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  // File list item
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: 'var(--forge-radius-md, 6px)',
    border: '1px solid var(--forge-border-default, #1E2230)',
    background: 'var(--forge-bg-elevated, #161920)',
  },
};

export default function CalculatorSkeleton() {
  return (
    <div style={s.page} className="skeleton-pulse" aria-hidden="true" role="status" aria-label="Loading calculator">
      <div style={s.container}>
        {/* Breadcrumb */}
        <div style={s.header}>
          <Skeleton width="180px" height="0.75rem" style={{ marginBottom: '12px' }} />
          <Skeleton width="280px" height="1.75rem" style={{ marginBottom: '8px' }} />
          <Skeleton width="340px" height="0.875rem" />
        </div>

        {/* Stepper */}
        <div style={s.stepper}>
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div style={s.stepCircle} />
              {i < 4 && <div style={s.stepConnector} />}
            </React.Fragment>
          ))}
        </div>

        {/* Main grid */}
        <div style={s.grid} className="tk-skel-grid">
          {/* Left column: upload zone + config */}
          <div style={s.leftCol}>
            {/* Upload zone */}
            <div style={s.uploadZone}>
              <SkeletonCircle size="4rem" />
              <Skeleton width="200px" height="1.25rem" />
              <Skeleton width="260px" height="0.875rem" />
              <Skeleton width="160px" height="0.75rem" />
            </div>

            {/* Config panel placeholder */}
            <div style={s.card}>
              <Skeleton width="120px" height="0.75rem" style={{ marginBottom: '16px' }} />
              <div style={s.configRow}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={s.configOption}>
                    <Skeleton width="60%" height="0.75rem" style={{ marginBottom: '8px' }} />
                    <Skeleton width="80%" height="0.625rem" />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <Skeleton width="100px" height="0.75rem" style={{ marginBottom: '12px' }} />
                <div style={s.configRow}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={s.configOption}>
                      <Skeleton width="70%" height="0.75rem" />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Skeleton width="80px" height="0.75rem" style={{ marginBottom: '12px' }} />
                <Skeleton width="100%" height="2rem" borderRadius="var(--forge-radius-md, 6px)" />
              </div>
            </div>
          </div>

          {/* Right column: viewer + pricing + file list */}
          <div style={s.rightCol}>
            {/* 3D viewer */}
            <div style={s.viewerBox}>
              <Skeleton width="48px" height="48px" borderRadius="50%" />
            </div>

            {/* Pricing card */}
            <div style={s.pricingCard}>
              <Skeleton width="140px" height="0.875rem" />
              <SkeletonText lines={3} lineHeight="0.75rem" />
              <div style={{
                paddingTop: '8px',
                borderTop: '2px solid var(--forge-border-default, #1E2230)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Skeleton width="60px" height="0.625rem" />
                <Skeleton width="100px" height="1.5rem" />
              </div>
            </div>

            {/* File list */}
            <div style={s.card}>
              <Skeleton width="100px" height="0.75rem" style={{ marginBottom: '12px' }} />
              {[0, 1].map((i) => (
                <div key={i} style={{ ...s.fileItem, marginBottom: i < 1 ? '6px' : 0 }}>
                  <Skeleton width="32px" height="32px" borderRadius="var(--forge-radius-sm, 4px)" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height="0.75rem" style={{ marginBottom: '4px' }} />
                    <Skeleton width="40%" height="0.625rem" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive: single column on mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .tk-skel-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
