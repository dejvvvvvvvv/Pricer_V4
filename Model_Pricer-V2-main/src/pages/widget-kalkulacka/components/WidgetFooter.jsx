// src/pages/widget-kalkulacka/components/WidgetFooter.jsx
// Footer with "Powered by ModelPricer" branding for the embeddable widget.

import React from 'react';

/**
 * WidgetFooter - Footer with "Powered by ModelPricer" text.
 *
 * Uses CSS custom properties (--widget-footer-*) for all theme-dependent styles.
 * Show/hide controlled by showPoweredBy prop.
 *
 * Props:
 * - showPoweredBy: Whether to show the footer (default: true)
 * - builderMode: Enable click-to-select for the builder (default: false)
 * - elementId: Element identifier for builder selection (default: 'footer')
 * - onElementSelect: Callback when element is clicked in builder mode
 */
const WidgetFooter = ({
  showPoweredBy = true,
  builderMode = false,
  elementId = 'footer',
  onElementSelect,
}) => {
  if (!showPoweredBy) return null;

  const handleBuilderClick = (e) => {
    if (builderMode && onElementSelect) {
      e.stopPropagation();
      onElementSelect(elementId);
    }
  };

  const containerStyle = {
    background: 'var(--widget-footer-bg, transparent)',
    padding: '16px 0',
    textAlign: 'center',
    marginTop: '24px',
  };

  if (builderMode) {
    containerStyle.cursor = 'pointer';
  }

  const textStyle = {
    color: 'var(--widget-footer-text, #94A3B8)',
    fontSize: '0.75rem',
    lineHeight: 1.5,
    margin: 0,
  };

  const linkStyle = {
    color: 'var(--widget-footer-link, #3B82F6)',
    textDecoration: 'none',
    fontWeight: 500,
  };

  return (
    <div
      className="widget-footer"
      style={containerStyle}
      onClick={builderMode ? handleBuilderClick : undefined}
    >
      <p style={textStyle}>
        Powered by{' '}
        {builderMode ? (
          <span style={linkStyle}>ModelPricer</span>
        ) : (
          <a
            href="https://modelpricer.com"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            ModelPricer
          </a>
        )}
      </p>
    </div>
  );
};

export default WidgetFooter;
