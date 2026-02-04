// src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx
// Loading skeleton that mimics the widget calculator layout.

import React from 'react';

/**
 * WidgetSkeleton - Loading skeleton with shimmer animation.
 *
 * Mimics the widget layout: header block, stepper line, upload area, config blocks.
 * Uses CSS custom properties --widget-skeleton-base and --widget-skeleton-shine.
 * No props needed - pure visual placeholder component.
 */

const SHIMMER_KEYFRAMES = `
@keyframes widgetSkeletonShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

const WidgetSkeleton = () => {
  const baseColor = 'var(--widget-skeleton-base, #E5E7EB)';
  const shineColor = 'var(--widget-skeleton-shine, #F3F4F6)';

  const shimmerStyle = {
    background: `linear-gradient(90deg, ${baseColor} 25%, ${shineColor} 50%, ${baseColor} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'widgetSkeletonShimmer 1.5s infinite',
    borderRadius: '6px',
  };

  return (
    <div
      className="widget-skeleton"
      style={{
        padding: '24px',
        maxWidth: '64rem',
        margin: '0 auto',
      }}
    >
      {/* Inject keyframes */}
      <style>{SHIMMER_KEYFRAMES}</style>

      {/* Header block: logo + title */}
      <div style={{ marginBottom: '24px' }}>
        {/* Logo placeholder */}
        <div
          style={{
            ...shimmerStyle,
            width: 48,
            height: 48,
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        />
        {/* Title placeholder */}
        <div
          style={{
            ...shimmerStyle,
            width: '220px',
            height: 24,
            marginBottom: '8px',
          }}
        />
        {/* Tagline placeholder */}
        <div
          style={{
            ...shimmerStyle,
            width: '300px',
            height: 14,
          }}
        />
      </div>

      {/* Stepper line: 3 circles with connecting lines */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          marginBottom: '32px',
          maxWidth: '420px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <div
              style={{
                ...shimmerStyle,
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            {i < 2 && (
              <div
                style={{
                  ...shimmerStyle,
                  flex: 1,
                  height: 2,
                  marginLeft: 8,
                  marginRight: 8,
                  borderRadius: 1,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main content grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left column: upload zone */}
        <div>
          {/* Upload rectangle - large dashed border area */}
          <div
            style={{
              ...shimmerStyle,
              width: '100%',
              height: 200,
              borderRadius: '12px',
              opacity: 0.7,
            }}
          />
        </div>

        {/* Right column: config sidebar blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Config block 1 */}
          <div
            style={{
              ...shimmerStyle,
              width: '100%',
              height: 44,
            }}
          />
          {/* Config block 2 */}
          <div
            style={{
              ...shimmerStyle,
              width: '80%',
              height: 44,
            }}
          />
          {/* Config block 3 */}
          <div
            style={{
              ...shimmerStyle,
              width: '90%',
              height: 44,
            }}
          />
          {/* Config block 4 */}
          <div
            style={{
              ...shimmerStyle,
              width: '60%',
              height: 36,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WidgetSkeleton;
