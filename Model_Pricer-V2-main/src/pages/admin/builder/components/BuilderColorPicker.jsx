/**
 * BuilderColorPicker -- advanced color picker for the Widget Builder.
 *
 * Uses react-colorful for the gradient + hue slider area.
 * Popover pattern: click trigger to open, draft color while editing,
 * apply/cancel buttons, click-outside to cancel.
 *
 * Features:
 *   - HexColorPicker gradient area
 *   - HEX text input
 *   - 8-color per-session history (newest first)
 *   - 8-color preset palette
 *   - "Pouzit" (apply) and "Zrusit" (cancel) buttons
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#6B7280',
];

const MAX_HISTORY = 8;

/**
 * Validate a hex color string (# + 6 hex chars).
 * @param {string} hex
 * @returns {boolean}
 */
function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export default function BuilderColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(value || '#000000');
  const [hexInput, setHexInput] = useState(value || '#000000');

  // Per-session color history (persisted across open/close but not page reload)
  const historyRef = useRef([]);

  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Sync draft when value changes externally while closed
  useEffect(() => {
    if (!open) {
      setDraftColor(value || '#000000');
      setHexInput(value || '#000000');
    }
  }, [value, open]);

  // Click outside handler -- cancel on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        // Cancel -- revert
        setDraftColor(value || '#000000');
        setHexInput(value || '#000000');
        setOpen(false);
      }
    }

    // Use a small delay so the opening click does not immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, value]);

  // Open popover and snapshot original value
  const handleOpen = useCallback(() => {
    setDraftColor(value || '#000000');
    setHexInput(value || '#000000');
    setOpen((prev) => !prev);
  }, [value]);

  // When react-colorful changes the color
  const handlePickerChange = useCallback((hex) => {
    setDraftColor(hex);
    setHexInput(hex);
  }, []);

  // HEX text input change
  const handleHexInputChange = useCallback((e) => {
    const raw = e.target.value;
    setHexInput(raw);
    if (isValidHex(raw)) {
      setDraftColor(raw);
    }
  }, []);

  // Apply: commit draft and close
  const handleApply = useCallback(() => {
    const finalColor = isValidHex(draftColor) ? draftColor : value || '#000000';

    // Add to history (if not already the first item)
    const history = historyRef.current;
    const idx = history.indexOf(finalColor.toUpperCase());
    if (idx !== -1) {
      history.splice(idx, 1);
    }
    history.unshift(finalColor.toUpperCase());
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }

    onChange(finalColor);
    setOpen(false);
  }, [draftColor, value, onChange]);

  // Cancel: revert and close
  const handleCancel = useCallback(() => {
    setDraftColor(value || '#000000');
    setHexInput(value || '#000000');
    setOpen(false);
  }, [value]);

  // Click a history or preset swatch
  const handleSwatchClick = useCallback((hex) => {
    setDraftColor(hex);
    setHexInput(hex);
  }, []);

  const displayColor = value || '#000000';

  return (
    <div style={styles.root}>
      {label && <span style={styles.label}>{label}</span>}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={styles.trigger}
        aria-label={`Vybrat barvu${label ? ` pro ${label}` : ''}`}
      >
        <span
          style={{
            ...styles.triggerSwatch,
            backgroundColor: displayColor,
          }}
        />
        <span style={styles.triggerHex}>{displayColor}</span>
      </button>

      {/* Popover */}
      {open && (
        <div ref={popoverRef} style={styles.popover}>
          {/* react-colorful picker */}
          <div style={styles.pickerWrapper} role="group" aria-label="Vyber barvy">
            <HexColorPicker
              color={draftColor}
              onChange={handlePickerChange}
              style={{ width: '100%', height: 160 }}
            />
          </div>

          {/* HEX input */}
          <div style={styles.hexRow}>
            <label htmlFor="builder-hex-input" style={styles.hexLabel}>HEX</label>
            <input
              id="builder-hex-input"
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              maxLength={7}
              spellCheck={false}
              aria-invalid={!isValidHex(hexInput)}
              style={{
                ...styles.hexInput,
                borderColor: isValidHex(hexInput)
                  ? 'var(--builder-border-default)'
                  : 'var(--builder-accent-error)',
              }}
            />
          </div>

          {/* Color history */}
          {historyRef.current.length > 0 && (
            <div style={styles.swatchSection}>
              <span style={styles.swatchLabel}>Historie</span>
              <div style={styles.swatchRow}>
                {historyRef.current.map((hex, i) => (
                  <button
                    key={`h-${i}-${hex}`}
                    type="button"
                    onClick={() => handleSwatchClick(hex)}
                    style={{
                      ...styles.swatchCircle,
                      backgroundColor: hex || '#000000',
                      outline:
                        draftColor.toUpperCase() === hex
                          ? '2px solid var(--builder-accent-primary)'
                          : 'none',
                      outlineOffset: 1,
                    }}
                    title={hex}
                    aria-label={`Historie barva ${hex}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset palette */}
          <div style={styles.swatchSection}>
            <span style={styles.swatchLabel}>Paleta</span>
            <div style={styles.presetGrid}>
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleSwatchClick(hex)}
                  style={{
                    ...styles.swatchCircle,
                    backgroundColor: hex || '#000000',
                    outline:
                      draftColor.toUpperCase() === hex.toUpperCase()
                        ? '2px solid var(--builder-accent-primary)'
                        : 'none',
                    outlineOffset: 1,
                  }}
                  title={hex}
                  aria-label={`Paleta barva ${hex}`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelBtn}
            >
              Zrusit
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={styles.applyBtn}
            >
              Pouzit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    position: 'relative',
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },

  /* Trigger */
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 10px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color var(--builder-transition-fast)',
  },
  triggerSwatch: {
    display: 'inline-block',
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid var(--builder-border-default)',
    flexShrink: 0,
  },
  triggerHex: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
  },

  /* Popover */
  popover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    zIndex: 200,
    width: 260,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-md)',
    boxShadow: 'var(--builder-shadow-md)',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  pickerWrapper: {
    borderRadius: 'var(--builder-radius-sm)',
    overflow: 'hidden',
  },

  /* HEX row */
  hexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hexLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
    fontWeight: 600,
    width: 30,
    flexShrink: 0,
  },
  hexInput: {
    flex: 1,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 8px',
    outline: 'none',
    transition: 'border-color var(--builder-transition-fast)',
  },

  /* Swatch sections */
  swatchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  swatchLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  },
  swatchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    justifyItems: 'center',
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
    transition: 'transform var(--builder-transition-fast)',
    flexShrink: 0,
  },

  /* Action buttons */
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
    borderTop: '1px solid var(--builder-border-subtle)',
  },
  cancelBtn: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--builder-text-secondary)',
    background: 'transparent',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 12px',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
  },
  applyBtn: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: '#FFFFFF',
    background: 'var(--builder-accent-success)',
    border: 'none',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 12px',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
  },
};
