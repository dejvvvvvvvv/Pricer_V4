import React, { useState, useMemo, useCallback, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import { finalizeDecimal, parseIntInput } from '@/utils/formatters';
import ForgeSlider from '../../../components/ui/forge/ForgeSlider';
import ForgeToggle from '../../../components/ui/forge/ForgeToggle';
import { validatePresetConfig } from '../../../services/presetsApi';

/**
 * Inline preset editor with visual sliders and toggles.
 * Expands below a preset row.
 *
 * Props:
 *   preset: preset object (from server)
 *   onSave: (presetId, updatedData) => Promise<void>
 *   onCancel: () => void
 *   language: 'cs' | 'en'
 *   availableMaterials: array of { key, name }
 */

function pickLang(language, cs, en) {
  return String(language || '').toLowerCase().startsWith('en') ? en : cs;
}

// Validation ranges matching the backend
const VALIDATION_RANGES = {
  layer_height: { min: 0.04, max: 0.6, step: 0.01, unit: 'mm' },
  first_layer_height: { min: 0.05, max: 0.6, step: 0.01, unit: 'mm' },
  infill_sparse_density: { min: 0, max: 100, step: 1, unit: '%' },
  perimeters: { min: 1, max: 10, step: 1, unit: '' },
  max_print_speed: { min: 5, max: 600, step: 5, unit: 'mm/s' },
  temperature: { min: 150, max: 500, step: 1, unit: '\u00b0C' },
  bed_temperature: { min: 0, max: 200, step: 1, unit: '\u00b0C' },
  support_material_threshold: { min: 0, max: 90, step: 1, unit: '\u00b0' },
};

// Fields displayed as sliders
const SLIDER_FIELDS = [
  { key: 'layer_height', cs: 'Vyska vrstvy', en: 'Layer height' },
  { key: 'first_layer_height', cs: 'Prvni vrstva', en: 'First layer height' },
  { key: 'infill_sparse_density', cs: 'Infill', en: 'Infill' },
  { key: 'perimeters', cs: 'Perimetry', en: 'Perimeters' },
  { key: 'max_print_speed', cs: 'Max rychlost', en: 'Max speed' },
  { key: 'temperature', cs: 'Teplota trysky', en: 'Nozzle temp' },
  { key: 'bed_temperature', cs: 'Teplota podlozky', en: 'Bed temp' },
];

// Fields displayed as toggles
const TOGGLE_FIELDS = [
  { key: 'support_material', cs: 'Supporty', en: 'Supports' },
];

// Select fields
const SELECT_FIELDS = [
  {
    key: 'fill_pattern',
    cs: 'Vzor vyplne',
    en: 'Fill pattern',
    options: ['rectilinear', 'grid', 'triangles', 'stars', 'cubic', 'gyroid', 'honeycomb', 'line', 'concentric'],
  },
];

export default function PresetInlineEditor({
  preset,
  onSave,
  onCancel,
  language = 'cs',
  availableMaterials = [],
}) {
  // Build initial draft from preset
  const initialDraft = useMemo(() => ({
    name: preset?.name || '',
    order: preset?.order || 0,
    visibleInWidget: !!preset?.visibleInWidget,
    material_key: preset?.material_key || null,
    print_overrides: { ...(preset?.print_overrides || {}) },
  }), [preset]);

  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validating, setValidating] = useState(false);
  // Track last successfully saved draft so hasChanges resets after save
  const savedDraftRef = useRef(initialDraft);

  const updateField = useCallback((field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  }, []);

  const updateOverride = useCallback((key, value) => {
    setDraft(prev => {
      const overrides = { ...(prev.print_overrides || {}) };
      if (value === null || value === undefined || value === '') {
        delete overrides[key];
      } else {
        overrides[key] = value;
      }
      return { ...prev, print_overrides: overrides };
    });
    setValidationErrors([]);
  }, []);

  const getOverrideValue = (key) => {
    const val = draft.print_overrides?.[key];
    return val !== undefined && val !== null ? val : null;
  };

  const hasChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedDraftRef.current);
  }, [draft]);

  const handleValidateAndSave = async () => {
    setSaving(true);
    setValidating(true);
    setValidationErrors([]);

    // Build config for backend validation
    const overrides = draft.print_overrides || {};
    const config = {
      name: draft.name || preset?.name || 'Untitled',
      layerHeight: overrides.layer_height,
      infillDensity: overrides.infill_sparse_density,
      printSpeed: overrides.max_print_speed,
      temperature: overrides.temperature,
      bedTemperature: overrides.bed_temperature,
    };

    // Client-side range validation
    const clientErrors = [];
    for (const [key, range] of Object.entries(VALIDATION_RANGES)) {
      const val = overrides[key];
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          clientErrors.push(`${key}: ${pickLang(language, 'musi byt cislo', 'must be a number')}`);
        } else if (num < range.min || num > range.max) {
          clientErrors.push(`${key}: ${pickLang(language, `hodnota ${num} mimo rozsah ${range.min}-${range.max}`, `value ${num} out of range ${range.min}-${range.max}`)}`);
        }
      }
    }

    if (clientErrors.length > 0) {
      setValidationErrors(clientErrors);
      setSaving(false);
      setValidating(false);
      return;
    }

    // Try backend validation
    try {
      const res = await validatePresetConfig(config);
      if (res.ok && res.data && !res.data.valid && res.data.errors?.length > 0) {
        setValidationErrors(res.data.errors);
        setSaving(false);
        setValidating(false);
        return;
      }
    } catch {
      // Backend validation unavailable - proceed with client-side only
    }

    setValidating(false);

    // Save
    try {
      await onSave(preset.id, draft);
      // Sync saved reference so hasChanges returns false after successful save
      savedDraftRef.current = JSON.parse(JSON.stringify(draft));
      setValidationErrors([]);
    } catch (e) {
      setValidationErrors([String(e?.message || 'Save failed')]);
    }
    setSaving(false);
  };

  return (
    <div style={styles.container}>
      {/* Metadata row */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          {pickLang(language, 'Metadata', 'Metadata')}
        </div>
        <div style={styles.metaGrid}>
          <div style={styles.field}>
            <label style={styles.fieldLabel} htmlFor={`pe-name-${preset.id}`}>
              {pickLang(language, 'Nazev', 'Name')}
            </label>
            <input
              id={`pe-name-${preset.id}`}
              style={styles.input}
              type="text"
              value={draft.name}
              onChange={e => updateField('name', e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel} htmlFor={`pe-order-${preset.id}`}>
              {pickLang(language, 'Poradi', 'Order')}
            </label>
            <input
              id={`pe-order-${preset.id}`}
              style={styles.input}
              type="text"
              inputMode="numeric"
              value={draft.order ?? ''}
              onChange={e => updateField('order', parseIntInput(e.target.value))}
              onBlur={() => updateField('order', finalizeDecimal(draft.order, 0))}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel} htmlFor={`pe-mat-${preset.id}`}>
              {pickLang(language, 'Material', 'Material')}
            </label>
            <select
              id={`pe-mat-${preset.id}`}
              style={styles.input}
              value={draft.material_key || ''}
              onChange={e => updateField('material_key', e.target.value || null)}
            >
              <option value="">{pickLang(language, '-- Vsechny --', '-- All --')}</option>
              {availableMaterials.map(m => (
                <option key={m.key} value={m.key}>{m.name}</option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.field, justifyContent: 'flex-end' }}>
            <ForgeToggle
              checked={!!draft.visibleInWidget}
              onChange={val => updateField('visibleInWidget', val)}
              label={pickLang(language, 'Viditelny ve widgetu', 'Visible in widget')}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Sliders section */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          {pickLang(language, 'Tiskove parametry', 'Print Parameters')}
        </div>
        <div style={styles.slidersGrid}>
          {SLIDER_FIELDS.map(field => {
            const range = VALIDATION_RANGES[field.key];
            if (!range) return null;
            const val = getOverrideValue(field.key);
            const hasVal = val !== null;
            const numVal = hasVal ? Number(val) : range.min;
            const label = pickLang(language, field.cs, field.en);

            return (
              <div key={field.key} style={styles.sliderItem}>
                <div style={styles.sliderHeader}>
                  <span style={styles.sliderLabel}>{label}</span>
                  <div style={styles.sliderValueRow}>
                    <input
                      type="number"
                      style={styles.numberInput}
                      value={hasVal ? val : ''}
                      placeholder="--"
                      step={range.step}
                      min={range.min}
                      max={range.max}
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '') {
                          updateOverride(field.key, null);
                        } else {
                          updateOverride(field.key, Number(v));
                        }
                      }}
                      aria-label={`${label} value`}
                    />
                    <span style={styles.unitLabel}>{range.unit}</span>
                    {hasVal && (
                      <button
                        onClick={() => updateOverride(field.key, null)}
                        style={styles.clearBtn}
                        title={pickLang(language, 'Resetovat na vychozi', 'Reset to default')}
                        aria-label={pickLang(language, `Resetovat ${label}`, `Reset ${label}`)}
                      >
                        <Icon name="RotateCcw" size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <ForgeSlider
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={numVal}
                  onChange={v => updateOverride(field.key, v)}
                  disabled={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Toggles & selects section */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          {pickLang(language, 'Dalsi nastaveni', 'Additional Settings')}
        </div>
        <div style={styles.togglesRow}>
          {TOGGLE_FIELDS.map(field => {
            const val = getOverrideValue(field.key);
            const label = pickLang(language, field.cs, field.en);
            return (
              <div key={field.key} style={styles.toggleItem}>
                <ForgeToggle
                  checked={!!val}
                  onChange={v => updateOverride(field.key, v)}
                  label={label}
                />
                {val !== null && (
                  <button
                    onClick={() => updateOverride(field.key, null)}
                    style={styles.clearBtn}
                    title={pickLang(language, 'Resetovat na vychozi', 'Reset to default')}
                    aria-label={pickLang(language, `Resetovat ${label}`, `Reset ${label}`)}
                  >
                    <Icon name="RotateCcw" size={10} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Support threshold slider (only shown when supports enabled) */}
          {getOverrideValue('support_material') && (
            <div style={{ ...styles.sliderItem, maxWidth: 280 }}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderLabel}>
                  {pickLang(language, 'Uhel pro supporty', 'Support threshold')}
                </span>
                <div style={styles.sliderValueRow}>
                  <input
                    type="number"
                    style={styles.numberInput}
                    value={getOverrideValue('support_material_threshold') ?? ''}
                    placeholder="--"
                    step={1}
                    min={0}
                    max={90}
                    onChange={e => {
                      const v = e.target.value;
                      updateOverride('support_material_threshold', v === '' ? null : Number(v));
                    }}
                    aria-label={pickLang(language, 'Uhel pro supporty', 'Support threshold')}
                  />
                  <span style={styles.unitLabel}>°</span>
                </div>
              </div>
              <ForgeSlider
                min={0}
                max={90}
                step={1}
                value={Number(getOverrideValue('support_material_threshold') || 0)}
                onChange={v => updateOverride('support_material_threshold', v)}
              />
            </div>
          )}

          {SELECT_FIELDS.map(field => {
            const val = getOverrideValue(field.key);
            const label = pickLang(language, field.cs, field.en);
            return (
              <div key={field.key} style={styles.selectItem}>
                <label style={styles.fieldLabel} htmlFor={`pe-sel-${preset.id}-${field.key}`}>
                  {label}
                </label>
                <select
                  id={`pe-sel-${preset.id}-${field.key}`}
                  style={styles.input}
                  value={val || ''}
                  onChange={e => updateOverride(field.key, e.target.value || null)}
                >
                  <option value="">{pickLang(language, '-- Vychozi z .ini --', '-- Default from .ini --')}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div style={styles.errorsBox}>
          <Icon name="AlertTriangle" size={14} style={{ color: 'var(--forge-error)', flexShrink: 0 }} />
          <div>
            <div style={styles.errorsTitle}>
              {pickLang(language, 'Validacni chyby:', 'Validation errors:')}
            </div>
            <ul style={styles.errorsList}>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div style={styles.footer}>
        <button
          onClick={onCancel}
          style={styles.cancelBtn}
          disabled={saving}
        >
          <Icon name="X" size={14} />
          {pickLang(language, 'Zrusit', 'Cancel')}
        </button>
        <button
          onClick={handleValidateAndSave}
          disabled={saving || !hasChanges}
          style={{
            ...styles.saveBtn,
            opacity: (saving || !hasChanges) ? 0.5 : 1,
            cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer',
          }}
        >
          {saving
            ? <Icon name="Loader2" size={14} className="spin" />
            : <Icon name="Save" size={14} />
          }
          {validating
            ? pickLang(language, 'Validuji...', 'Validating...')
            : pickLang(language, 'Ulozit zmeny', 'Save changes')
          }
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--forge-bg-void)',
    borderTop: '2px solid var(--forge-accent-primary)',
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
    marginBottom: 12,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 0.5fr 1fr auto',
    gap: 12,
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-primary)',
    fontSize: 13,
  },
  divider: {
    borderTop: '1px solid var(--forge-border-default)',
    margin: '12px 0',
  },
  slidersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px 24px',
  },
  sliderItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  sliderHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
  },
  sliderValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  numberInput: {
    width: 64,
    padding: '4px 6px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-accent-primary)',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--forge-font-tech)',
    textAlign: 'right',
  },
  unitLabel: {
    fontSize: 11,
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
    minWidth: 28,
  },
  clearBtn: {
    width: 20,
    height: 20,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-muted)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  togglesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  toggleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  selectItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 180,
  },
  errorsBox: {
    display: 'flex',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(255,71,87,0.06)',
    border: '1px solid rgba(255,71,87,0.25)',
    borderRadius: 'var(--forge-radius-md, 8px)',
    marginTop: 8,
    marginBottom: 8,
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--forge-error)',
    marginBottom: 4,
  },
  errorsList: {
    margin: 0,
    paddingLeft: 16,
    fontSize: 12,
    color: 'var(--forge-error)',
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid var(--forge-border-default)',
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid rgba(0,212,170,0.3)',
    background: 'rgba(0,212,170,0.1)',
    color: 'var(--forge-accent-primary)',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
