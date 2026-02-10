import React from 'react';

/**
 * Forge-themed dashboard stat card with top colored border accent,
 * monospace value display, and optional delta badge.
 *
 * @param {string} label - Stat label (Space Mono uppercase, muted)
 * @param {string|number} value - Primary value (JetBrains Mono 700, large)
 * @param {string|number} delta - Change percentage (e.g. "+12.5%")
 * @param {'positive'|'negative'|'neutral'} deltaType - Determines delta badge color
 * @param {string} accentColor - Top border color (CSS value, e.g. 'var(--forge-accent-primary)')
 * @param {React.ReactNode} children - Optional slot for sparkline or extra content
 */
export default function ForgeStatCard({
  label,
  value,
  delta,
  deltaType = 'positive',
  accentColor = 'var(--forge-accent-primary)',
  children,
}) {
  const containerStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    borderTop: `2px solid ${accentColor}`,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 400,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--forge-text-muted)',
    margin: 0,
    lineHeight: 1.4,
  };

  const valueRowStyle = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const valueStyle = {
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 700,
    fontSize: 'var(--forge-text-3xl)',
    color: 'var(--forge-text-primary)',
    margin: 0,
    lineHeight: 1.1,
  };

  const deltaColors = {
    positive: {
      backgroundColor: 'rgba(0,212,170,0.12)',
      color: 'var(--forge-success)',
    },
    negative: {
      backgroundColor: 'rgba(255,71,87,0.12)',
      color: 'var(--forge-error)',
    },
    neutral: {
      backgroundColor: 'var(--forge-bg-overlay)',
      color: 'var(--forge-text-muted)',
    },
  };

  const deltaStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    fontFamily: 'var(--forge-font-mono)',
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.4,
    ...(deltaColors[deltaType] || deltaColors.neutral),
  };

  return (
    <div style={containerStyle}>
      {label && <p style={labelStyle}>{label}</p>}
      <div style={valueRowStyle}>
        <span style={valueStyle}>{value}</span>
        {delta != null && <span style={deltaStyle}>{delta}</span>}
      </div>
      {children}
    </div>
  );
}
