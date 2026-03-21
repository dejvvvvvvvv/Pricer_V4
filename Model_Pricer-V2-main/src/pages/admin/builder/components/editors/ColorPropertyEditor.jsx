/**
 * ColorPropertyEditor -- enhanced color swatch + full color picker.
 *
 * Features:
 *   - Color swatch preview
 *   - Hex input field
 *   - HTML5 color picker popup
 *   - Preset color palette (10 common colors)
 *   - Opacity slider
 *   - Reset to default button
 *   - Recent colors (last 5 used, session-scoped)
 */
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#3B82F6', '#EF4444', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280',
];

// Session-scoped recent colors (shared across all instances)
let recentColorsStore = [];
const MAX_RECENT = 5;

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function ColorPropertyEditor({
  label,
  labelCs,
  value,
  onChange,
  defaultValue,
}) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [opacity, setOpacity] = useState(1);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const nativePickerRef = useRef(null);

  const currentValue = value || '#000000';
  const displayLabel = labelCs || label || '';

  // Sync hex input when value changes externally
  useEffect(() => {
    if (!open) {
      setHexInput(currentValue);
    }
  }, [currentValue, open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const addToRecent = useCallback((color) => {
    const upper = color.toUpperCase();
    recentColorsStore = [
      upper,
      ...recentColorsStore.filter((c) => c !== upper),
    ].slice(0, MAX_RECENT);
  }, []);

  const handleHexInputChange = useCallback((e) => {
    let raw = e.target.value;
    if (!raw.startsWith('#')) raw = '#' + raw;
    setHexInput(raw);
    if (isValidHex(raw)) {
      onChange(raw);
      addToRecent(raw);
    }
  }, [onChange, addToRecent]);

  const handleNativePickerChange = useCallback((e) => {
    const hex = e.target.value;
    setHexInput(hex);
    onChange(hex);
    addToRecent(hex);
  }, [onChange, addToRecent]);

  const handleSwatchClick = useCallback((hex) => {
    setHexInput(hex);
    onChange(hex);
    addToRecent(hex);
  }, [onChange, addToRecent]);

  const handleOpacityChange = useCallback((e) => {
    setOpacity(parseFloat(e.target.value));
  }, []);

  const handleReset = useCallback(() => {
    const def = defaultValue || '#000000';
    setHexInput(def);
    setOpacity(1);
    onChange(def);
  }, [defaultValue, onChange]);

  const handleOpenNativePicker = useCallback(() => {
    if (nativePickerRef.current) {
      nativePickerRef.current.click();
    }
  }, []);

  return (
    <div style={styles.root}>
      {displayLabel && (
        <div style={styles.labelRow}>
          <span style={styles.label}>{displayLabel}</span>
          {defaultValue && (
            <button
              type="button"
              onClick={handleReset}
              style={styles.resetBtn}
              title="Reset to default"
              aria-label="Reset to default"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      )}

      {/* Trigger row: swatch + hex input */}
      <div style={styles.triggerRow} ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            ...styles.swatch,
            backgroundColor: opacity < 1
              ? hexToRgba(currentValue, opacity)
              : currentValue,
          }}
          aria-label={`Color swatch: ${currentValue}`}
        />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          maxLength={7}
          spellCheck={false}
          style={{
            ...styles.hexInput,
            borderColor: isValidHex(hexInput)
              ? 'var(--builder-border-default)'
              : 'var(--builder-accent-error)',
          }}
          aria-label={`${displayLabel} hex value`}
        />
        {/* Hidden native color input */}
        <input
          ref={nativePickerRef}
          type="color"
          value={currentValue}
          onChange={handleNativePickerChange}
          style={styles.hiddenColorInput}
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleOpenNativePicker}
          style={styles.pickerBtn}
          title="Open color picker"
          aria-label="Open color picker"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </button>
      </div>

      {/* Popover with presets, recent, and opacity */}
      {open && (
        <div ref={popoverRef} style={styles.popover}>
          {/* Opacity slider */}
          <div style={styles.opacityRow}>
            <span style={styles.opacityLabel}>Opacity</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={handleOpacityChange}
              style={styles.opacitySlider}
              aria-label="Opacity"
            />
            <span style={styles.opacityValue}>{opacity.toFixed(2)}</span>
          </div>

          {/* Recent colors */}
          {recentColorsStore.length > 0 && (
            <div style={styles.swatchSection}>
              <span style={styles.swatchSectionLabel}>Recent</span>
              <div style={styles.swatchGrid}>
                {recentColorsStore.map((hex, i) => (
                  <button
                    key={`r-${i}-${hex}`}
                    type="button"
                    onClick={() => handleSwatchClick(hex)}
                    style={{
                      ...styles.swatchCircle,
                      backgroundColor: hex,
                      outline: currentValue.toUpperCase() === hex
                        ? '2px solid var(--builder-accent-primary)'
                        : 'none',
                      outlineOffset: 1,
                    }}
                    title={hex}
                    aria-label={`Recent color ${hex}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset palette */}
          <div style={styles.swatchSection}>
            <span style={styles.swatchSectionLabel}>Palette</span>
            <div style={styles.swatchGrid}>
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleSwatchClick(hex)}
                  style={{
                    ...styles.swatchCircle,
                    backgroundColor: hex,
                    outline: currentValue.toUpperCase() === hex.toUpperCase()
                      ? '2px solid var(--builder-accent-primary)'
                      : 'none',
                    outlineOffset: 1,
                  }}
                  title={hex}
                  aria-label={`Palette color ${hex}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    position: 'relative',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },
  resetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    borderRadius: 3,
    padding: 0,
    opacity: 0.6,
    transition: 'opacity var(--builder-transition-fast)',
  },
  triggerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 'var(--builder-radius-sm)',
    border: '2px solid var(--builder-border-default)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    outline: 'none',
  },
  hexInput: {
    flex: 1,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--builder-transition-fast)',
  },
  hiddenColorInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  pickerBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    cursor: 'pointer',
    color: 'var(--builder-text-secondary)',
    flexShrink: 0,
    padding: 0,
  },
  popover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    zIndex: 200,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-md)',
    boxShadow: 'var(--builder-shadow-md)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  opacityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  opacityLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    width: 44,
    flexShrink: 0,
  },
  opacitySlider: {
    flex: 1,
    height: 4,
    accentColor: 'var(--builder-accent-primary)',
    cursor: 'pointer',
  },
  opacityValue: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-secondary)',
    width: 32,
    textAlign: 'right',
    flexShrink: 0,
  },
  swatchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  swatchSectionLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  swatchGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  swatchCircle: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '1px solid var(--builder-border-default)',
    cursor: 'pointer',
    padding: 0,
    backgroundColor: 'transparent',
    WebkitAppearance: 'none',
    flexShrink: 0,
    transition: 'transform var(--builder-transition-fast)',
  },
};

export default memo(ColorPropertyEditor);
