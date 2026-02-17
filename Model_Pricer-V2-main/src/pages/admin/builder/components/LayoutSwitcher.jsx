/**
 * LayoutSwitcher — gallery of 4 preset layouts for the widget builder.
 *
 * Each preset card shows a name, description, and simple thumbnail icon.
 * Clicking applies the preset layout (with confirmation dialog).
 */
import React, { useState } from 'react';
import { LayoutGrid, Minimize2, Maximize2, Minus } from 'lucide-react';
import { PRESET_LAYOUTS } from '../config/presetLayouts';

const PRESET_ICONS = {
  classic: LayoutGrid,
  compact: Minimize2,
  wide: Maximize2,
  minimal: Minus,
};

export default function LayoutSwitcher({ activePresetId, onApplyPreset }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleClick = (presetId) => {
    if (activePresetId === presetId) return;
    setConfirmId(presetId);
  };

  const handleConfirm = () => {
    if (confirmId) {
      onApplyPreset(confirmId);
      setConfirmId(null);
    }
  };

  const handleCancel = () => {
    setConfirmId(null);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>ROZLOZENI</div>

      <div style={gridStyle}>
        {PRESET_LAYOUTS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const IconComp = PRESET_ICONS[preset.id] || LayoutGrid;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleClick(preset.id)}
              style={{
                ...cardStyle,
                ...(isActive ? activeCardStyle : {}),
              }}
              title={preset.description.cs}
              aria-pressed={isActive}
            >
              <IconComp
                size={24}
                color={isActive
                  ? 'var(--builder-accent-primary, #3B82F6)'
                  : 'var(--builder-text-muted)'
                }
              />
              <span style={{
                ...cardLabelStyle,
                color: isActive
                  ? 'var(--builder-text-primary)'
                  : 'var(--builder-text-secondary)',
              }}>
                {preset.name.cs}
              </span>
            </button>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {confirmId && (
        <div style={confirmStyle}>
          <span style={confirmTextStyle}>
            Prepnout rozlozeni? Toto prepise vase aktualni usporadani prvku.
          </span>
          <div style={confirmBtnRow}>
            <button onClick={handleCancel} style={cancelBtnStyle}>Zrusit</button>
            <button onClick={handleConfirm} style={applyBtnStyle}>Prepnout</button>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headerStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--builder-text-muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  paddingBottom: 8,
  borderBottom: '1px solid var(--builder-border-subtle)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '16px 8px',
  background: 'var(--builder-bg-elevated, #1E2128)',
  border: '2px solid var(--builder-border-default, #2E3340)',
  borderRadius: 'var(--builder-radius-md, 8px)',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, background 150ms ease',
};

const activeCardStyle = {
  borderColor: 'var(--builder-accent-primary, #3B82F6)',
  background: 'var(--builder-active-overlay, rgba(59, 130, 246, 0.12))',
};

const cardLabelStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  fontWeight: 500,
  textAlign: 'center',
};

const confirmStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '10px 12px',
  background: 'var(--builder-bg-elevated, #1E2128)',
  border: '1px solid var(--builder-accent-warning, #F59E0B)',
  borderRadius: 'var(--builder-radius-md, 8px)',
};

const confirmTextStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  color: 'var(--builder-text-secondary)',
  lineHeight: 1.4,
};

const confirmBtnRow = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
};

const cancelBtnStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--builder-text-secondary)',
  background: 'none',
  border: '1px solid var(--builder-border-default)',
  borderRadius: 'var(--builder-radius-sm, 6px)',
  padding: '4px 12px',
  cursor: 'pointer',
};

const applyBtnStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: '#FFFFFF',
  background: 'var(--builder-accent-primary, #3B82F6)',
  border: 'none',
  borderRadius: 'var(--builder-radius-sm, 6px)',
  padding: '4px 12px',
  cursor: 'pointer',
};
