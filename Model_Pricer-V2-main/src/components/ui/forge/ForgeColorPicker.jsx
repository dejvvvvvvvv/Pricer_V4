import React, { useState } from 'react';

/**
 * Forge-themed color picker with swatch grid and hex input.
 * Swatches: 32x32px, 4px gap, 4px radius.
 * Selected swatch has 2px outline in --forge-text-primary.
 * Custom hex input below in monospace font.
 * Props: colors (array of hex strings), value, onChange, label, className.
 */
export default function ForgeColorPicker({
  colors = [
    '#00D4AA', '#00B894', '#0984E3', '#6C5CE7',
    '#E17055', '#FF7675', '#FDCB6E', '#FD79A8',
    '#2D3436', '#636E72', '#B2BEC3', '#DFE6E9',
    '#FFFFFF', '#08090C', '#1A1D23', '#2A2D35',
  ],
  value = '',
  onChange,
  label,
  className = '',
}) {
  const [hexInput, setHexInput] = useState(value);

  // Keep hex input in sync when value changes externally
  React.useEffect(() => {
    setHexInput(value);
  }, [value]);

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-secondary)',
    marginBottom: '8px',
    display: 'block',
  };

  const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '12px',
  };

  const getSwatchStyle = (color) => {
    const isSelected = value && color.toLowerCase() === value.toLowerCase();
    return {
      width: '32px',
      height: '32px',
      borderRadius: '4px',
      backgroundColor: color,
      border: 'none',
      cursor: 'pointer',
      outline: isSelected ? '2px solid var(--forge-text-primary)' : '1px solid var(--forge-border-default)',
      outlineOffset: isSelected ? '1px' : '0px',
      padding: 0,
      transition: 'outline 100ms ease-out, transform 100ms ease-out',
      flexShrink: 0,
    };
  };

  const inputWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const previewStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    backgroundColor: value || 'transparent',
    border: '1px solid var(--forge-border-default)',
    flexShrink: 0,
  };

  const hexInputStyle = {
    height: '32px',
    flex: 1,
    padding: '0 8px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: 'var(--forge-text-primary)',
    outline: 'none',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
    textTransform: 'uppercase',
  };

  const handleSwatchClick = (color) => {
    if (onChange) {
      onChange(color);
    }
  };

  const handleHexChange = (e) => {
    let val = e.target.value;
    // Allow user to type with or without hash
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    setHexInput(val);
  };

  const handleHexBlur = () => {
    // Validate hex on blur — 3 or 6 hex digits, with leading #
    const cleaned = hexInput.trim();
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(cleaned)) {
      if (onChange) {
        onChange(cleaned.toUpperCase());
      }
    } else {
      // Revert to current value if invalid
      setHexInput(value);
    }
  };

  const handleHexKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={gridStyle} role="radiogroup" aria-label={label || 'Color picker'}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value && color.toLowerCase() === value.toLowerCase()}
            aria-label={color}
            style={getSwatchStyle(color)}
            onClick={() => handleSwatchClick(color)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        ))}
      </div>
      <div style={inputWrapperStyle}>
        <div style={previewStyle} aria-hidden="true" />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          onKeyDown={handleHexKeyDown}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--forge-accent-primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
          }}
          onBlurCapture={(e) => {
            e.target.style.borderColor = 'var(--forge-border-default)';
            e.target.style.boxShadow = 'none';
          }}
          style={hexInputStyle}
          placeholder="#00D4AA"
          maxLength={7}
          aria-label="Hex color value"
        />
      </div>
    </div>
  );
}
