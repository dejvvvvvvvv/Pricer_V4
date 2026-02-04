// src/pages/widget-kalkulacka/components/WidgetHeader.jsx
// Brand header for the embeddable widget calculator.

import React from 'react';

/**
 * WidgetHeader - Displays brand header at top of widget.
 *
 * Uses CSS custom properties (--widget-*) for all theme-dependent styles.
 * Supports builder mode with click-to-select interaction.
 *
 * Props:
 * - title: Header title text (default: 'Kalkulacka 3D tisku')
 * - tagline: Subtitle/tagline text (default: null)
 * - taglineVisible: Whether to show the tagline (default: true)
 * - logo: Logo image source - base64 data URI or URL (default: null)
 * - logoUrl: Clickable URL for the logo (default: null)
 * - alignment: Text alignment - 'left' or 'center' (default: 'left')
 * - builderMode: Enable click-to-select for the builder (default: false)
 * - elementId: Element identifier for builder selection (default: 'header')
 * - onElementSelect: Callback when element is clicked in builder mode
 */
const WidgetHeader = ({
  title = 'Kalkulacka 3D tisku',
  tagline = null,
  taglineVisible = true,
  logo = null,
  logoUrl = null,
  alignment = 'left',
  builderMode = false,
  elementId = 'header',
  onElementSelect,
}) => {
  const containerStyle = {
    background: 'var(--widget-header-bg, #FFFFFF)',
    padding: 'var(--widget-header-padding, 16px)',
    textAlign: 'var(--widget-header-align, left)',
  };

  // Override alignment from prop if it differs from CSS var default
  if (alignment === 'center') {
    containerStyle.textAlign = 'center';
  } else if (alignment === 'left') {
    containerStyle.textAlign = 'left';
  }

  const titleStyle = {
    color: 'var(--widget-header, #1F2937)',
    fontFamily: 'var(--widget-heading-font, "DM Sans", system-ui, sans-serif)',
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.3,
  };

  const taglineStyle = {
    color: 'var(--widget-muted, #6B7280)',
    fontSize: '0.875rem',
    marginTop: '4px',
    margin: 0,
    marginBlockStart: '4px',
    lineHeight: 1.5,
  };

  const logoImgStyle = {
    width: 'var(--widget-header-logo-size, 48px)',
    height: 'var(--widget-header-logo-size, 48px)',
    objectFit: 'contain',
    display: 'block',
    flexShrink: 0,
  };

  if (alignment === 'center') {
    logoImgStyle.marginLeft = 'auto';
    logoImgStyle.marginRight = 'auto';
  }

  const handleBuilderClick = (e) => {
    if (builderMode && onElementSelect) {
      e.stopPropagation();
      onElementSelect(elementId);
    }
  };

  const wrapperProps = builderMode
    ? {
        onClick: handleBuilderClick,
        style: { ...containerStyle, cursor: 'pointer' },
      }
    : { style: containerStyle };

  const renderLogo = () => {
    if (!logo) return null;

    const img = (
      <img
        src={logo}
        alt={title || 'Logo'}
        style={logoImgStyle}
      />
    );

    if (logoUrl && !builderMode) {
      return (
        <a
          href={logoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: alignment === 'center' ? 'flex' : 'inline-flex',
            justifyContent: alignment === 'center' ? 'center' : 'flex-start',
            textDecoration: 'none',
            marginBottom: '8px',
          }}
        >
          {img}
        </a>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: alignment === 'center' ? 'center' : 'flex-start',
          marginBottom: '8px',
        }}
      >
        {img}
      </div>
    );
  };

  return (
    <div className="widget-header" {...wrapperProps}>
      {renderLogo()}
      <h1 style={titleStyle}>{title}</h1>
      {tagline && taglineVisible !== false && (
        <p style={taglineStyle}>{tagline}</p>
      )}
    </div>
  );
};

export default WidgetHeader;
