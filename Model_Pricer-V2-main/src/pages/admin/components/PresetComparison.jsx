import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * Preset Comparison — side-by-side table for 2-3 presets.
 * Highlights differences in teal. Forge dark theme.
 *
 * Props:
 *   presets: array of preset objects (max 3)
 *   allPresets: full list for selection
 *   onClose: callback
 *   onChangeSelection: (selectedIds: string[]) => void
 *   selectedIds: string[]
 *   language: 'cs' | 'en'
 */

const COMPARE_FIELDS = [
  { key: 'name', cs: 'Nazev', en: 'Name' },
  { key: 'order', cs: 'Poradi', en: 'Order' },
  { key: 'visibleInWidget', cs: 'Viditelny ve widgetu', en: 'Visible in widget', format: 'bool' },
  { key: 'material_key', cs: 'Material', en: 'Material' },
  { key: 'layer_height', cs: 'Vyska vrstvy (mm)', en: 'Layer height (mm)', path: 'print_overrides' },
  { key: 'perimeters', cs: 'Pocet perimetru', en: 'Perimeters', path: 'print_overrides' },
  { key: 'infill_sparse_density', cs: 'Infill (%)', en: 'Infill (%)', path: 'print_overrides' },
  { key: 'fill_pattern', cs: 'Vzor vyplne', en: 'Fill pattern', path: 'print_overrides' },
  { key: 'support_material', cs: 'Supporty', en: 'Supports', path: 'print_overrides', format: 'bool' },
  { key: 'support_material_threshold', cs: 'Uhel pro supporty', en: 'Support threshold', path: 'print_overrides' },
  { key: 'first_layer_height', cs: 'Prvni vrstva (mm)', en: 'First layer height (mm)', path: 'print_overrides' },
  { key: 'temperature', cs: 'Teplota trysky (C)', en: 'Nozzle temp (C)', path: 'print_overrides' },
  { key: 'bed_temperature', cs: 'Teplota podlozky (C)', en: 'Bed temp (C)', path: 'print_overrides' },
  { key: 'max_print_speed', cs: 'Max rychlost (mm/s)', en: 'Max speed (mm/s)', path: 'print_overrides' },
];

function pickLang(language, cs, en) {
  return String(language || '').toLowerCase().startsWith('en') ? en : cs;
}

function getValue(preset, field) {
  if (field.path === 'print_overrides') {
    const val = preset?.print_overrides?.[field.key];
    if (val === undefined || val === null || val === '') return null;
    return val;
  }
  const val = preset?.[field.key];
  if (val === undefined || val === null || val === '') return null;
  return val;
}

function formatValue(val, field, language) {
  if (val === null || val === undefined) return pickLang(language, '—', '—');
  if (field.format === 'bool') return val ? pickLang(language, 'Ano', 'Yes') : pickLang(language, 'Ne', 'No');
  return String(val);
}

export default function PresetComparison({
  allPresets = [],
  onClose,
  onChangeSelection,
  selectedIds = [],
  language = 'cs',
}) {
  const selectedPresets = useMemo(
    () => selectedIds.map(id => allPresets.find(p => p.id === id)).filter(Boolean),
    [selectedIds, allPresets]
  );

  const hasDifference = (field) => {
    if (selectedPresets.length < 2) return false;
    const values = selectedPresets.map(p => {
      const v = getValue(p, field);
      return v === null ? '__NULL__' : String(v);
    });
    return !values.every(v => v === values[0]);
  };

  const togglePreset = (id) => {
    if (selectedIds.includes(id)) {
      onChangeSelection(selectedIds.filter(x => x !== id));
    } else if (selectedIds.length < 3) {
      onChangeSelection([...selectedIds, id]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Icon name="Columns" size={18} style={{ color: 'var(--forge-accent-primary)' }} />
          <span style={styles.headerTitle}>
            {pickLang(language, 'Porovnani presetu', 'Preset Comparison')}
          </span>
          <span style={styles.headerCount}>
            {selectedIds.length}/3
          </span>
        </div>
        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Preset selector */}
      <div style={styles.selectorWrap}>
        <div style={styles.selectorLabel}>
          {pickLang(language, 'Vyberte 2-3 presety k porovnani:', 'Select 2-3 presets to compare:')}
        </div>
        <div style={styles.selectorChips}>
          {allPresets.map(p => {
            const active = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePreset(p.id)}
                style={{
                  ...styles.chip,
                  ...(active ? styles.chipActive : {}),
                  opacity: !active && selectedIds.length >= 3 ? 0.4 : 1,
                  cursor: !active && selectedIds.length >= 3 ? 'not-allowed' : 'pointer',
                }}
                disabled={!active && selectedIds.length >= 3}
                aria-pressed={active}
              >
                {active && <Icon name="Check" size={12} />}
                {p.name || p.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selectedPresets.length >= 2 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  {pickLang(language, 'Parametr', 'Parameter')}
                </th>
                {selectedPresets.map(p => (
                  <th key={p.id} style={styles.th}>
                    {p.name || p.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FIELDS.map((field, idx) => {
                const diff = hasDifference(field);
                const rowBg = idx % 2 === 0
                  ? 'var(--forge-bg-surface)'
                  : 'var(--forge-bg-void)';
                return (
                  <tr key={field.key}>
                    <td style={{
                      ...styles.td,
                      ...styles.tdLabel,
                      background: rowBg,
                      fontWeight: diff ? 700 : 500,
                      color: diff ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
                    }}>
                      {pickLang(language, field.cs, field.en)}
                      {diff && (
                        <Icon name="AlertCircle" size={12} style={{ marginLeft: 6, color: 'var(--forge-accent-primary)', verticalAlign: -1 }} />
                      )}
                    </td>
                    {selectedPresets.map(p => {
                      const val = getValue(p, field);
                      const formatted = formatValue(val, field, language);
                      return (
                        <td key={p.id} style={{
                          ...styles.td,
                          background: rowBg,
                          fontWeight: diff ? 700 : 400,
                          color: diff ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)',
                        }}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPresets.length < 2 && (
        <div style={styles.emptyHint}>
          <Icon name="Info" size={16} style={{ color: 'var(--forge-text-muted)' }} />
          {pickLang(language,
            'Vyberte alespon 2 presety pro zobrazeni porovnani.',
            'Select at least 2 presets to see the comparison.'
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md, 8px)',
    background: 'var(--forge-bg-surface)',
    overflow: 'hidden',
    marginTop: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
  },
  headerCount: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
    padding: '2px 8px',
    borderRadius: 999,
    border: '1px solid var(--forge-border-default)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    cursor: 'pointer',
    color: 'var(--forge-text-secondary)',
  },
  selectorWrap: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--forge-border-default)',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--forge-text-secondary)',
    marginBottom: 8,
  },
  selectorChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'rgba(0,212,170,0.12)',
    borderColor: 'rgba(0,212,170,0.4)',
    color: 'var(--forge-accent-primary)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--forge-text-muted)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 800,
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--forge-border-default)',
    fontSize: 13,
    verticalAlign: 'middle',
  },
  tdLabel: {
    fontFamily: 'var(--forge-font-body)',
    whiteSpace: 'nowrap',
    minWidth: 180,
  },
  emptyHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '24px 16px',
    color: 'var(--forge-text-muted)',
    fontSize: 13,
  },
};
