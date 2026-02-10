import React, { useRef, useCallback } from 'react';

/**
 * Forge-themed range slider.
 * Track: 4px height, --forge-bg-overlay background.
 * Filled portion: --forge-accent-primary.
 * Thumb: 16px circle, --forge-accent-primary.
 * Props: min, max, step, value, onChange, label, showValue, disabled, className.
 */
export default function ForgeSlider({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  label,
  showValue = false,
  disabled = false,
  className = '',
}) {
  const inputRef = useRef(null);

  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-secondary)',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const valueStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--forge-accent-primary)',
    textTransform: 'none',
    letterSpacing: 'normal',
  };

  // We use a native <input type="range"> with a custom gradient background
  // to show the filled track portion. The thumb is styled via inline style injection.
  const trackBackground = `linear-gradient(to right, var(--forge-accent-primary) 0%, var(--forge-accent-primary) ${percent}%, var(--forge-bg-overlay) ${percent}%, var(--forge-bg-overlay) 100%)`;

  const inputStyle = {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: trackBackground,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    margin: '8px 0',
  };

  // Inject thumb styles via a unique class (CSS-in-JS approach for pseudo-elements)
  const styleId = 'forge-slider-thumb-styles';
  const injectThumbStyles = useCallback((node) => {
    if (!node) return;
    inputRef.current = node;

    // Inject stylesheet once
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .forge-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--forge-accent-primary);
          border: none;
          cursor: pointer;
          margin-top: -6px;
          transition: box-shadow 120ms ease-out;
        }
        .forge-slider-input::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.2);
        }
        .forge-slider-input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--forge-accent-primary);
          border: none;
          cursor: pointer;
        }
        .forge-slider-input::-moz-range-thumb:hover {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.2);
        }
        .forge-slider-input::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
        }
        .forge-slider-input::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
        .forge-slider-input:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.25);
        }
        .forge-slider-input:focus::-moz-range-thumb {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.25);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(Number(e.target.value));
    }
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div style={labelStyle}>
          {label && <span>{label}</span>}
          {showValue && <span style={valueStyle}>{value}</span>}
        </div>
      )}
      <input
        ref={injectThumbStyles}
        type="range"
        className="forge-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        style={inputStyle}
        aria-label={label || 'Slider'}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
