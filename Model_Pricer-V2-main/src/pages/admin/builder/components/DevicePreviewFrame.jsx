/**
 * DevicePreviewFrame - Simulates device dimensions around its children.
 *
 * Supported device modes:
 *   - mobile:  375px wide, max-height 812px
 *   - tablet:  768px wide, max-height 1024px
 *   - desktop: 100% width (max 1200px), no max-height constraint
 *
 * Visual: white background, rounded corners, medium shadow, scrollable
 * content, smooth width transition on device mode change.
 *
 * Pure presentational component.
 */
import React from 'react';

const DEVICE_DIMENSIONS = {
  mobile: {
    width: 375,
    maxHeight: 812,
  },
  tablet: {
    width: 768,
    maxHeight: 1024,
  },
  desktop: {
    width: '100%',
    maxWidth: 1200,
    maxHeight: 'none',
  },
};

const DevicePreviewFrame = ({ deviceMode = 'desktop', children }) => {
  const dims = DEVICE_DIMENSIONS[deviceMode] || DEVICE_DIMENSIONS.desktop;
  const isDesktop = deviceMode === 'desktop';

  const frameStyle = {
    /* dimensions */
    width: isDesktop ? '100%' : dims.width,
    maxWidth: isDesktop ? dims.maxWidth : dims.width,
    maxHeight: isDesktop ? 'none' : dims.maxHeight,

    /* visual */
    background: '#FFFFFF',
    borderRadius: 'var(--builder-radius-lg, 12px)',
    boxShadow: 'var(--builder-shadow-md, 0 4px 12px rgba(0,0,0,0.4))',
    overflow: 'hidden',

    /* scroll */
    overflowY: 'auto',

    /* transition */
    transition: 'width 300ms ease, max-width 300ms ease',

    /* center in parent */
    margin: '0 auto',

    /* ensure it can shrink */
    minWidth: 0,

    /* dark scrollbar */
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--builder-scrollbar-thumb) transparent',
  };

  return (
    <div style={frameStyle}>
      {children}
    </div>
  );
};

export default DevicePreviewFrame;
