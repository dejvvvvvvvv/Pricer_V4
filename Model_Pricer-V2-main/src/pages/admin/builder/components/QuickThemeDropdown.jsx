/**
 * QuickThemeDropdown -- dropdown selector for quick theme presets.
 *
 * Shows a trigger button with the current theme name + 3 color dots.
 * Clicking opens a dropdown listing all QUICK_THEMES plus a "Vlastni" option.
 * If isDirty and user selects a theme, a confirm dialog warns about unsaved changes.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Palette } from 'lucide-react';

import { QUICK_THEMES, CUSTOM_THEME_ID } from '../config/quickThemes';

/**
 * Render 3 small color circles from a theme's representative colors.
 */
function ColorDots({ colors, size = 10 }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {(colors || []).slice(0, 3).map((c, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: c,
            border: '1px solid var(--builder-border-default)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function QuickThemeDropdown({
  currentThemeId,
  onApplyTheme,
  isDirty,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Resolve current label + colors for the trigger
  const isCustom = !currentThemeId || currentThemeId === CUSTOM_THEME_ID;
  const currentPreset = !isCustom
    ? QUICK_THEMES.find((t) => t.id === currentThemeId) || null
    : null;

  const triggerLabel = currentPreset
    ? (currentPreset.name.cs || currentPreset.name.en)
    : 'Vlastni';
  const triggerColors = currentPreset ? currentPreset.colors : [];

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
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

  // Handle selecting a theme
  const handleSelect = useCallback(
    (themeEntry) => {
      if (isDirty) {
        const confirmed = window.confirm(
          'Neulozene zmeny budou ztraceny. Pokracovat?',
        );
        if (!confirmed) return;
      }

      onApplyTheme(themeEntry);
      setOpen(false);
    },
    [isDirty, onApplyTheme],
  );

  return (
    <div style={styles.root}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Palette
          size={14}
          color="var(--builder-text-muted)"
          style={{ flexShrink: 0 }}
        />
        {triggerColors.length > 0 && <ColorDots colors={triggerColors} />}
        <span style={styles.triggerLabel}>{triggerLabel}</span>
        <ChevronDown
          size={14}
          color="var(--builder-text-muted)"
          style={{
            flexShrink: 0,
            marginLeft: 'auto',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--builder-transition-fast)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div ref={dropdownRef} style={styles.dropdown} role="listbox">
          {/* Preset themes */}
          {QUICK_THEMES.map((theme) => {
            const isActive = currentThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme)}
                style={{
                  ...styles.option,
                  ...(isActive ? styles.optionActive : {}),
                }}
                role="option"
                aria-selected={isActive}
              >
                <ColorDots colors={theme.colors} size={12} />
                <span style={styles.optionLabel}>
                  {theme.name.cs || theme.name.en}
                </span>
                {isActive && (
                  <Check
                    size={14}
                    color="var(--builder-accent-success)"
                    style={{ flexShrink: 0, marginLeft: 'auto' }}
                  />
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div style={styles.separator} />

          {/* Custom option */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              ...styles.option,
              ...(isCustom ? styles.optionActive : {}),
            }}
            role="option"
            aria-selected={isCustom}
          >
            <Palette
              size={12}
              color="var(--builder-text-muted)"
              style={{ flexShrink: 0 }}
            />
            <span style={styles.optionLabel}>Vlastni</span>
            {isCustom && (
              <Check
                size={14}
                color="var(--builder-accent-success)"
                style={{ flexShrink: 0, marginLeft: 'auto' }}
              />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles = {
  root: {
    position: 'relative',
  },

  /* Trigger */
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '7px 10px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color var(--builder-transition-fast)',
  },
  triggerLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  /* Dropdown */
  dropdown: {
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
    padding: '4px 0',
    maxHeight: 280,
    overflowY: 'auto',
  },

  /* Option row */
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: '7px 12px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background var(--builder-transition-fast)',
  },
  optionActive: {
    background: 'var(--builder-active-overlay)',
  },
  optionLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    whiteSpace: 'nowrap',
  },

  separator: {
    height: 1,
    background: 'var(--builder-border-subtle)',
    margin: '4px 8px',
  },
};
