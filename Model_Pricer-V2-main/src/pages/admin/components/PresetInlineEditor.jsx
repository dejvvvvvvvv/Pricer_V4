import React, { useState, useMemo, useCallback, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import { finalizeDecimal, parseIntInput } from '@/utils/formatters';
import ForgeToggle from '../../../components/ui/forge/ForgeToggle';

/**
 * Inline preset editor — simplified to 4 editable fields only.
 * Advanced print parameter editing is disabled (sliders, toggles, selects removed).
 *
 * Editable fields:
 *   1. Name (nazev presetu)
 *   2. Order/Priority (poradi)
 *   3. Material selection (k jakemu materialu preset patri)
 *   4. Widget visibility toggle (viditelnost ve widget kalkulacce)
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

export default function PresetInlineEditor({
  preset,
  onSave,
  onCancel,
  language = 'cs',
  availableMaterials = [],
}) {
  // Build initial draft from preset — only the 4 editable fields + preserved print_overrides
  const initialDraft = useMemo(() => ({
    name: preset?.name || '',
    order: preset?.order || 0,
    visibleInWidget: !!preset?.visibleInWidget,
    material_key: preset?.material_key || null,
    print_overrides: preset?.print_overrides ? { ...preset.print_overrides } : {},
  }), [preset]);

  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  // Track last successfully saved draft so hasChanges resets after save
  const savedDraftRef = useRef(initialDraft);

  const updateField = useCallback((field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedDraftRef.current);
  }, [draft]);

  const handleSave = async () => {
    setSaving(true);
    setValidationErrors([]);

    // Client-side validation: name is required
    if (!draft.name || !draft.name.trim()) {
      setValidationErrors([pickLang(language, 'Nazev je povinny', 'Name is required')]);
      setSaving(false);
      return;
    }

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
      {/* Metadata fields — the only editable section */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          {pickLang(language, 'Nastaveni presetu', 'Preset settings')}
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
          onClick={handleSave}
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
          {pickLang(language, 'Ulozit zmeny', 'Save changes')}
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
