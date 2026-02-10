import React from 'react';

/**
 * Forge-themed progress indicator, linear or circular.
 *
 * Props:
 *  - value: 0-100
 *  - type: 'linear' | 'circular'
 *  - size: 'sm' | 'md' | 'lg'
 *  - label: string (optional label above the bar)
 *  - showValue: boolean (default true)
 *  - className: string
 */
export default function ForgeProgressBar({
  value = 0,
  type = 'linear',
  size = 'md',
  label,
  showValue = true,
  className = '',
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  if (type === 'circular') {
    return (
      <CircularProgress
        value={clampedValue}
        size={size}
        showValue={showValue}
        label={label}
        className={className}
      />
    );
  }

  return (
    <LinearProgress
      value={clampedValue}
      size={size}
      showValue={showValue}
      label={label}
      className={className}
    />
  );
}

/* ---------- LINEAR ---------- */

function LinearProgress({ value, size, showValue, label, className }) {
  const heightMap = { sm: '3px', md: '4px', lg: '6px' };
  const trackHeight = heightMap[size] || heightMap.md;

  const wrapperStyle = {
    width: '100%',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: label || showValue ? '8px' : 0,
  };

  const labelStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--forge-text-muted)',
  };

  const valueStyle = {
    fontFamily: "'JetBrains Mono', var(--forge-font-tech)",
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textAlign: 'right',
    marginLeft: 'auto',
  };

  const trackStyle = {
    width: '100%',
    height: trackHeight,
    backgroundColor: 'var(--forge-bg-overlay)',
    borderRadius: '2px',
    overflow: 'hidden',
  };

  const fillStyle = {
    width: `${value}%`,
    height: '100%',
    backgroundColor: 'var(--forge-accent-primary)',
    borderRadius: '2px',
    transition: 'width 300ms ease-out',
  };

  return (
    <div className={className} style={wrapperStyle}>
      {(label || showValue) && (
        <div style={headerStyle}>
          {label && <span style={labelStyle}>{label}</span>}
          {showValue && <span style={valueStyle}>{Math.round(value)}%</span>}
        </div>
      )}
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
}

/* ---------- CIRCULAR ---------- */

function CircularProgress({ value, size, showValue, label, className }) {
  const sizeMap = { sm: 48, md: 64, lg: 96 };
  const dimension = sizeMap[size] || sizeMap.md;
  const strokeWidth = 3;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const fontSizeMap = { sm: 11, md: 14, lg: 20 };
  const fontSize = fontSizeMap[size] || fontSizeMap.md;

  const wrapperStyle = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  };

  const svgContainerStyle = {
    position: 'relative',
    width: `${dimension}px`,
    height: `${dimension}px`,
  };

  const svgStyle = {
    transform: 'rotate(-90deg)',
    display: 'block',
  };

  const centerTextStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontFamily: "'JetBrains Mono', var(--forge-font-tech)",
    fontWeight: 700,
    fontSize: `${fontSize}px`,
    color: 'var(--forge-text-primary)',
    lineHeight: 1,
  };

  const labelStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--forge-text-muted)',
  };

  return (
    <div className={className} style={wrapperStyle}>
      <div style={svgContainerStyle}>
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          style={svgStyle}
        >
          {/* Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="var(--forge-border-default)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="var(--forge-accent-primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
          />
        </svg>
        {showValue && (
          <span style={centerTextStyle}>{Math.round(value)}%</span>
        )}
      </div>
      {label && <span style={labelStyle}>{label}</span>}
    </div>
  );
}
