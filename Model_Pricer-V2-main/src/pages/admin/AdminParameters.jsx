import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { PRUSA_PARAMETER_CATALOG } from '../../data/prusaParameterCatalog';
import { appendTenantLog, readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';

// =============================
// Parameters & Presets (Admin) — Variant A (front-end demo)
// - Library: active_for_slicing + admin defaults (overrides)
// - Widget params: visibility + input type + allowed values
// - Overview: KPI + recent changes
// - Validation tab: architecture placeholder (future)
// Persistence is localStorage so the UI is fully usable for demos.
// =============================

const STORAGE_NS = 'parameters:v1';
const STORAGE_LOG = 'parameters:activity:v1';
const STORAGE_PRESETS = 'presets:v1';

function nowIso() {
  return new Date().toISOString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function safeEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getLabel(def, language) {
  if (!def?.label) return def?.key || '';
  return def.label[language] || def.label.cs || def.label.en || def.key;
}

function getHelp(def, language) {
  if (!def?.help) return '';
  return def.help[language] || def.help.cs || def.help.en || '';
}

function getDefByKey() {
  const map = {};
  for (const d of PRUSA_PARAMETER_CATALOG) map[d.key] = d;
  return map;
}

function buildDefaultState(language) {
  const parameters = {};
  const widget = {};

  for (const def of PRUSA_PARAMETER_CATALOG) {
    parameters[def.key] = {
      active_for_slicing: Boolean(def.defaultActiveForSlicing),
      // null means "use catalog default"
      default_value_override: null,
    };

    widget[def.key] = {
      visible_in_widget: false,
      widget_label: getLabel(def, language),
      widget_help: getHelp(def, language),
      input_type: 'auto',
      // null means "use catalog allowed values"
      allowed_values_override: null,
      locked_readonly: false,
    };
  }

  return {
    enable_widget_overrides: true,
    parameters,
    widget,
    updated_at: nowIso(),
    updated_by: 'admin',
  };
}

function loadPersisted(language) {
  const persisted = readTenantJson(STORAGE_NS, null);
  const base = buildDefaultState(language);
  if (!persisted) return base;

  // Merge persisted over base (forward-compatible).
  const merged = deepClone(base);
  merged.enable_widget_overrides = typeof persisted.enable_widget_overrides === 'boolean'
    ? persisted.enable_widget_overrides
    : base.enable_widget_overrides;

  if (persisted.parameters) {
    for (const [key, v] of Object.entries(persisted.parameters)) {
      if (!merged.parameters[key]) continue;
      merged.parameters[key] = {
        ...merged.parameters[key],
        ...v,
      };
    }
  }

  if (persisted.widget) {
    for (const [key, v] of Object.entries(persisted.widget)) {
      if (!merged.widget[key]) continue;
      merged.widget[key] = {
        ...merged.widget[key],
        ...v,
      };
    }
  }

  merged.updated_at = persisted.updated_at || merged.updated_at;
  merged.updated_by = persisted.updated_by || merged.updated_by;

  return merged;
}

function computeDiffCount(a, b) {
  // counts how many keys are different between draft and persisted (for unsaved indicator)
  let n = 0;
  if ((a?.enable_widget_overrides ?? true) !== (b?.enable_widget_overrides ?? true)) n += 1;

  const keys = new Set([
    ...Object.keys(a?.parameters || {}),
    ...Object.keys(b?.parameters || {}),
    ...Object.keys(a?.widget || {}),
    ...Object.keys(b?.widget || {}),
  ]);

  for (const key of keys) {
    const pa = a?.parameters?.[key];
    const pb = b?.parameters?.[key];
    if (!safeEqual(pa, pb)) n += 1;

    const wa = a?.widget?.[key];
    const wb = b?.widget?.[key];
    if (!safeEqual(wa, wb)) n += 1;
  }
  return n;
}

function roundToStep(value, step, mode) {
  const s = Number(step);
  const v = Number(value);
  if (!Number.isFinite(v) || !Number.isFinite(s) || s <= 0) return value;
  const q = v / s;
  if (mode === 'up') return Math.ceil(q) * s;
  return Math.round(q) * s;
}

/**
 * TOGGLE "AKTIVNÍ" - BUDOUCÍ FUNKCIONALITA
 * =========================================
 * Pole visible_in_widget určuje, zda bude parametr VIDITELNÝ v zákaznické kalkulačce:
 * 
 * - TRUE (zelená): Parametr se zobrazí zákazníkovi v kalkulačce. Zákazník může změnit
 *   jeho hodnotu podle svého uvážení. Při slicování se použije hodnota zadaná
 *   zákazníkem místo výchozí hodnoty z admin nastavení nebo presetu.
 *   Příklad: Infill je "Aktivní" → zákazník vidí slider 20% a může změnit na 30%.
 * 
 * - FALSE (červená): Parametr je skrytý před zákazníkem. Při slicování se vždy použije
 *   výchozí hodnota z admin nastavení nebo presetu. Zákazník nemá možnost
 *   tuto hodnotu ovlivnit.
 * 
 * DŮLEŽITÉ: Všechny parametry jsou VŽDY posílány do sliceru bez ohledu na toto
 * nastavení. Toggle pouze řídí uživatelské rozhraní kalkulačky, ne logiku slicování.
 * Data z .ini souborů (presetů) nejsou nikdy blokována.
 */
function GradientToggle({ checked, onChange, disabled = false }) {
  return (
    <label className={`gradient-toggle ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="gradient-toggle-track" />
      <style>{`
        .gradient-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .gradient-toggle.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .gradient-toggle input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }
        .gradient-toggle-track {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: linear-gradient(to right, #fb7185, #ef4444);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          transition: background 0.3s ease;
        }
        .gradient-toggle input:checked + .gradient-toggle-track {
          background: linear-gradient(to right, #10b981, #059669);
        }
        .gradient-toggle-track::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #f9fafb;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gradient-toggle input:checked + .gradient-toggle-track::after {
          transform: translateX(20px);
        }
        .gradient-toggle input:focus + .gradient-toggle-track {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }
      `}</style>
    </label>
  );
}

function Toggle({ checked, onChange, disabled = false, label, hint, rightSlot }) {
  return (
    <div className={`toggle ${disabled ? 'disabled' : ''}`}>
      <GradientToggle checked={checked} onChange={onChange} disabled={disabled} />
      {(label || hint || rightSlot) && (
        <div className="toggle-text">
          <div className="toggle-title-row">
            {label && <div className="toggle-title">{label}</div>}
            {rightSlot}
          </div>
          {hint && <div className="toggle-hint">{hint}</div>}
        </div>
      )}
      <style>{`
        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .toggle.disabled {
          opacity: 0.6;
        }
        .toggle-text {
          flex: 1;
        }
        .toggle-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .toggle-title {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        }
        .toggle-hint {
          margin-top: 4px;
          font-size: 12px;
          color: #6B7280;
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}

function Badge({ children, tone = 'gray' }) {
  return (
    <span className={`badge ${tone}`}>{children}
      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .badge.gray { background: #F3F4F6; color: #374151; border-color: #E5E7EB; }
        .badge.blue { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
        .badge.amber { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
        .badge.red { background: #FEF2F2; color: #B91C1C; border-color: #FECACA; }
        .badge.green { background: #ECFDF5; color: #065F46; border-color: #A7F3D0; }
      `}</style>
    </span>
  );
}

function ConfirmModal({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-title">{title}</div>
        {description && <div className="modal-desc">{description}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>{cancelText}</button>
          <button className={`btn primary ${danger ? 'danger' : ''}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 1000;
        }
        .modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 10px 35px rgba(0,0,0,0.25);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .modal-desc {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.45;
        }
        .modal-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #D1D5DB;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
        }
        .btn.primary {
          background: #2563EB;
          border-color: #2563EB;
          color: #fff;
        }
        .btn.primary.danger {
          background: #DC2626;
          border-color: #DC2626;
        }
      `}</style>
    </div>
  );
}

function Hint({ children }) {
  return (
    <div className="hint">
      <Icon name="Info" size={16} />
      <span>{children}</span>
      <style>{`
        .hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          color: #374151;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

function formatDateTime(iso, language) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US');
  } catch {
    return iso;
  }
}

// =============================
// Subpages
// =============================

function LibraryPage({ language, defsByKey, draft, persisted, onPatchDraft, onResetGroup, onResetAll, onEnableGroup, onDisableGroup, saveDisabled, onSave }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('basic');
  const [confirm, setConfirm] = useState({ open: false, action: null, title: '', description: '' });

  const groups = useMemo(() => {
    const set = new Set(PRUSA_PARAMETER_CATALOG.map(d => d.group || 'Other'));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return PRUSA_PARAMETER_CATALOG
      .filter(def => {
        if (group && def.group !== group) return false;
        if (typeFilter && def.dataType !== typeFilter) return false;
        const _lvlOrder = { basic: 0, mid: 1, pro: 2 };
        const _defLvl = def.uiLevel || 'pro';
        if (_lvlOrder[_defLvl] > _lvlOrder[levelFilter || 'basic']) return false;

        const row = draft.parameters[def.key];
        if (!row) return false;

        const active = !!row.active_for_slicing;
        if (onlyActive && !active) return false;

        const baseDefault = def.defaultValue;
        const value = row.default_value_override === null ? baseDefault : row.default_value_override;
        const isValueChanged = row.default_value_override !== null && !safeEqual(row.default_value_override, baseDefault);
        const isActiveChanged = active !== Boolean(def.defaultActiveForSlicing);
        if (onlyChanged && !(isValueChanged || isActiveChanged)) return false;

        if (!s) return true;
        const label = getLabel(def, language).toLowerCase();
        const key = def.key.toLowerCase();
        return label.includes(s) || key.includes(s);
      })
      .sort((a, b) => {
        const ga = a.group || 'Other';
        const gb = b.group || 'Other';
        if (ga !== gb) return ga.localeCompare(gb);
        return getLabel(a, language).localeCompare(getLabel(b, language));
      });
  }, [search, group, onlyActive, onlyChanged, typeFilter, levelFilter, draft, language]);

  const grouped = useMemo(() => {
    const out = {};
    for (const d of filtered) {
      const g = d.group || 'Other';
      if (!out[g]) out[g] = [];
      out[g].push(d);
    }
    return out;
  }, [filtered]);

  const changedCountVsCatalog = useMemo(() => {
    let n = 0;
    for (const def of PRUSA_PARAMETER_CATALOG) {
      const row = draft.parameters[def.key];
      if (!row) continue;
      const isValueChanged = row.default_value_override !== null && !safeEqual(row.default_value_override, def.defaultValue);
      const isActiveChanged = Boolean(row.active_for_slicing) !== Boolean(def.defaultActiveForSlicing);
      if (isValueChanged || isActiveChanged) n += 1;
    }
    return n;
  }, [draft]);

  const handleConfirm = (action, title, description) => {
    setConfirm({ open: true, action, title, description });
  };

  const runConfirmAction = () => {
    const action = confirm.action;
    setConfirm({ open: false, action: null, title: '', description: '' });
    if (!action) return;
    action();
  };

  return (
    <div>
      <div className="compact-toolbar">
        <div className="toolbar-row">
          <div className="search-compact">
            <Icon name="Search" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'cs' ? 'Hledat…' : 'Search…'}
            />
          </div>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="filter-select">
            <option value="">{language === 'cs' ? 'Skupiny' : 'Groups'}</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
            <option value="">{language === 'cs' ? 'Typ' : 'Type'}</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="enum">enum</option>
            <option value="string">string</option>
          </select>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="filter-select">
            <option value="basic">Basic</option>
            <option value="mid">Mid</option>
            <option value="pro">Pro</option>
          </select>
          <button className={`filter-chip ${onlyActive ? 'active' : ''}`} onClick={() => setOnlyActive(v => !v)}>
            {language === 'cs' ? 'Aktivní' : 'Active'}
          </button>
          <button className={`filter-chip ${onlyChanged ? 'active' : ''}`} onClick={() => setOnlyChanged(v => !v)}>
            {language === 'cs' ? 'Změněné' : 'Changed'}
          </button>
          <div className="toolbar-spacer" />
          <span className="changes-badge">{changedCountVsCatalog} {language === 'cs' ? 'změn' : 'changes'}</span>
          <button className="btn primary" onClick={onSave} disabled={saveDisabled}>
            <Icon name="Save" size={16} />
            {language === 'cs' ? 'Uložit' : 'Save'}
          </button>
        </div>
      </div>

      {group && (
        <div className="bulk">
          <div className="bulk-left">
            <strong>{group}</strong>
            <span className="bulk-hint">{language === 'cs' ? 'Hromadné akce pro skupinu' : 'Bulk actions for group'}</span>
          </div>
          <div className="bulk-right">
            <button className="btn" onClick={() => handleConfirm(() => onEnableGroup(group), language === 'cs' ? 'Zapnout všechny v této skupině?' : 'Enable all in this group?', language === 'cs' ? 'Označí všechny parametry jako aktivní pro slicování.' : 'Marks all parameters as active for slicing.') }>
              {language === 'cs' ? 'Enable all' : 'Enable all'}
            </button>
            <button className="btn" onClick={() => handleConfirm(() => onDisableGroup(group), language === 'cs' ? 'Vypnout všechny v této skupině?' : 'Disable all in this group?', language === 'cs' ? 'Označí všechny parametry jako neaktivní pro slicování.' : 'Marks all parameters as inactive for slicing.') }>
              {language === 'cs' ? 'Disable all' : 'Disable all'}
            </button>
            <button className="btn danger" onClick={() => handleConfirm(() => onResetGroup(group), language === 'cs' ? 'Resetovat skupinu na default?' : 'Reset group to defaults?', language === 'cs' ? 'Vrátí hodnoty i aktivitu na defaulty katalogu (destruktivní).' : 'Resets values and active flags to catalog defaults (destructive).') }>
              {language === 'cs' ? 'Reset group' : 'Reset group'}
            </button>
            <button className="btn danger" onClick={() => handleConfirm(() => onResetAll(), language === 'cs' ? 'Resetovat všechny parametry?' : 'Reset ALL parameters?', language === 'cs' ? 'Vrátí všechny hodnoty i aktivitu na defaulty katalogu (destruktivní).' : 'Resets all values and active flags to catalog defaults (destructive).') }>
              {language === 'cs' ? 'Reset all' : 'Reset all'}
            </button>
          </div>
        </div>
      )}

      {!group && (
        <div className="bulk" style={{ justifyContent: 'space-between' }}>
          <Hint>
            {language === 'cs'
              ? 'Checkbox v knihovně = použít parametr v konfiguraci (active_for_slicing). Viditelnost ve widgetu řeš v záložce „Widget parametry“.'
              : 'Checkbox in the library = include parameter in config (active_for_slicing). Widget visibility is configured in “Widget parameters”.'}
          </Hint>
          <button className="btn danger" onClick={() => handleConfirm(() => onResetAll(), language === 'cs' ? 'Resetovat všechny parametry?' : 'Reset ALL parameters?', language === 'cs' ? 'Vrátí všechny hodnoty i aktivitu na defaulty katalogu (destruktivní).' : 'Resets all values and active flags to catalog defaults (destructive).') }>
            {language === 'cs' ? 'Reset all to defaults' : 'Reset all to defaults'}
          </button>
        </div>
      )}

      <div className="list">
        {Object.keys(grouped).length === 0 && (
          <div className="empty">
            <Icon name="SearchX" size={20} />
            <span>{language === 'cs' ? 'Nic nenalezeno.' : 'No results.'}</span>
          </div>
        )}

        {Object.entries(grouped).map(([g, defs]) => (
          <div key={g} className="group-card">
            <div className="group-header">
              <div className="group-title">{g}</div>
              <div className="group-meta">
                <Badge tone="gray">{defs.length} {language === 'cs' ? 'parametrů' : 'params'}</Badge>
              </div>
            </div>
            <div className="rows">
              {defs.map(def => (
                <ParamRow
                  key={def.key}
                  def={def}
                  language={language}
                  row={draft.parameters[def.key]}
                  persistedRow={persisted.parameters[def.key]}
                  onChange={(patch) => onPatchDraft({ parameters: { [def.key]: patch } })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText={language === 'cs' ? 'Potvrdit' : 'Confirm'}
        cancelText={language === 'cs' ? 'Zrušit' : 'Cancel'}
        danger
        onConfirm={runConfirmAction}
        onCancel={() => setConfirm({ open: false, action: null, title: '', description: '' })}
      />

      <style>{`
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #F5F5F5;
          padding: 12px 0;
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 10px 12px;
          min-width: 340px;
        }
        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }
        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        select {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 10px;
          font-size: 14px;
        }
        .chip {
          border: 1px solid #D1D5DB;
          background: #fff;
          border-radius: 999px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
        }
        .chip.on {
          background: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #D1D5DB;
          background: #fff;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .btn.primary {
          background: #2563EB;
          border-color: #2563EB;
          color: #fff;
        }
        .btn.danger {
          background: #fff;
          border-color: #FCA5A5;
          color: #B91C1C;
        }
        .bulk {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .bulk-left {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .bulk-hint {
          font-size: 13px;
          color: #6B7280;
        }
        .bulk-right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .group-card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #E5E7EB;
          background: #F9FAFB;
        }
        .group-title {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }
        .rows {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 12px;
                  padding: 12px 14px 14px;
                }

                @media (max-width: 1200px) {
                  .rows {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                  }
                }

                @media (max-width: 720px) {
                  .rows {
                    grid-template-columns: 1fr;
                  }
                }
        .empty {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6B7280;
          background: #fff;
          border: 1px dashed #D1D5DB;
          border-radius: 14px;
          padding: 16px;
        }
        @media (max-width: 960px) {
          .search { min-width: 240px; }
        }
      `}</style>
    </div>
  );
}

function ParamRow({ def, row, selected, onToggleSelected, onChange, language }) {
  const value = row.default_value_override;
  const isChanged = value !== null && !safeEqual(value, def.defaultValue);
  const hasError = !!row.validation_error;

  const defaultLabel = language === 'cs' ? '(výchozí)' : '(default)';

  const unitRight = def.unit
    ? def.unit === 'percent'
      ? '%'
      : def.unit
    : null;

  // cliKey: def.key (e.g. "fill_density") - used for slicer CLI commands
  function setOverride(next) {
    onChange({ ...row, default_value_override: next });
  }

  function setActive(next) {
    onChange({ ...row, active_for_slicing: next });
  }

  function renderValueInput() {
    // boolean
    if (def.dataType === 'boolean') {
      // Show effective value (override or default)
      const effective = value === null ? def.defaultValue : value;
      const effectiveStr = String(effective);
      return (
        <select
          value={effectiveStr}
          onChange={(e) => {
            const raw = e.target.value;
            setOverride(raw === 'true');
          }}
          className={value === null ? 'is-default' : ''}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    // enum
    if (def.dataType === 'enum') {
      const effective = value === null ? def.defaultValue : value;
      return (
        <select
          value={effective}
          onChange={(e) => {
            setOverride(e.target.value);
          }}
          className={value === null ? 'is-default' : ''}
        >
          {(def.options || def.enumValues || []).map((opt) => {
             // Handle both object options {value, label} and string arrays
             const val = typeof opt === 'object' ? opt.value : opt;
             const lbl = typeof opt === 'object' ? opt.label : opt;
             return (
               <option key={val} value={val}>
                 {lbl}
               </option>
             );
          })}
        </select>
      );
    }

    // number-like
    if (def.dataType === 'number') {
      const effective = value === null ? def.defaultValue : value;
      return (
        <input
          type="number"
          value={effective}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return setOverride(null);
            const num = Number(raw);
            if (Number.isFinite(num)) setOverride(num);
          }}
          className={value === null ? 'is-default' : ''}
        />
      );
    }

    // string (incl. gcode snippets)
    const effective = value === null ? def.defaultValue : value;
    return (
      <textarea
        className={`code-input ${value === null ? 'is-default' : ''}`}
        value={effective}
        onChange={(e) => setOverride(e.target.value)}
        rows={def.dataType === 'gcode' ? 3 : 1}
      />
    );
  }

  return (
    <div className={`paramCard ${hasError ? 'has-error' : ''}`}>
      <div className="top">
        <label className="select" title={language === 'cs' ? 'Vybrat' : 'Select'}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(def.key)}
          />
        </label>

        <div className="title">
          <div className="label" title={getLabel(def, language)}>
            {getLabel(def, language)}
          </div>
          <div className="key" title={def.key}>
            {def.key}
          </div>

          <div className="badges">
            <span className="badge">{def.dataType}</span>
            {isChanged ? (
              <span className="badge changed">
                {language === 'cs' ? 'změněno' : 'changed'}
              </span>
            ) : (
              <span className="badge muted">{language === 'cs' ? 'výchozí' : 'default'}</span>
            )}
            {!row.active_for_slicing && (
              <span className="badge inactive">
                {language === 'cs' ? 'neaktivní' : 'inactive'}
              </span>
            )}
          </div>
        </div>

        <div className="controls">
          <Toggle
            checked={!!row.active_for_slicing}
            onChange={(v) => setActive(v)}
            label={language === 'cs' ? 'Aktivní' : 'Active'}
          />
        </div>
      </div>

      <div className="valueWrap">
        <div className="valueRow">
          <div className="inputWrap">
            {renderValueInput()}
            {unitRight ? <span className="unit">{unitRight}</span> : null}
          </div>

          <button
            type="button"
            className="reset"
            onClick={() => setOverride(null)}
            disabled={value === null}
            title={language === 'cs' ? 'Vrátit na výchozí' : 'Reset to default'}
          >
            ↺
          </button>
        </div>



        {hasError ? <div className="error">{row.validation_error}</div> : null}
      </div>

      <style>{`
        .paramCard {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
          min-width: 0;
        }

        .paramCard.has-error {
          border-color: #fca5a5;
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
        }

        .top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .select {
          margin-top: 2px;
        }

        .title {
          flex: 1;
          min-width: 0;
        }

        .label {
          font-weight: 900;
          font-size: 14px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .key {
          margin-top: 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badges {
          margin-top: 8px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
          font-weight: 800;
        }

        .badge.changed {
          background: #eef2ff;
          color: #3730a3;
        }

        .badge.muted {
          background: #f8fafc;
          color: #64748b;
        }

        .badge.inactive {
          background: #fff7ed;
          color: #9a3412;
        }

        .controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .valueWrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .valueRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .inputWrap {
          flex: 1;
          position: relative;
          min-width: 0;
        }

        input,
        select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        input:focus,
        select:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
        }

        .unit {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #6b7280;
          font-weight: 800;
          pointer-events: none;
        }

        .reset {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
          line-height: 1;
        }

        .reset:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
          color: #6b7280;
        }

        .error {
          font-size: 12px;
          color: #b91c1c;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}

function OverviewPage({ language, draft }) {
  const presets = readTenantJson(STORAGE_PRESETS, []);
  const activity = readTenantJson(STORAGE_LOG, []);

  const stats = useMemo(() => {
    let active = 0;
    let changed = 0;
    let visible = 0;

    for (const def of PRUSA_PARAMETER_CATALOG) {
      const row = draft.parameters[def.key];
      if (!row) continue;
      if (row.active_for_slicing) active += 1;
      const isValueChanged = row.default_value_override !== null && !safeEqual(row.default_value_override, def.defaultValue);
      const isActiveChanged = Boolean(row.active_for_slicing) !== Boolean(def.defaultActiveForSlicing);
      if (isValueChanged || isActiveChanged) changed += 1;
      if (draft.widget[def.key]?.visible_in_widget) visible += 1;
    }

    return { active, changed, visible, presets: presets.length };
  }, [draft, presets.length]);

  return (
    <div className="overview">
      <div className="grid">
        <KpiCard title={language === 'cs' ? 'Aktivní parametry' : 'Active parameters'} value={stats.active} icon="CheckCircle" />
        <KpiCard title={language === 'cs' ? 'Změněné parametry' : 'Changed parameters'} value={stats.changed} icon="Edit" />
        <KpiCard title={language === 'cs' ? 'Viditelné ve widgetu' : 'Visible in widget'} value={stats.visible} icon="Eye" />
        <KpiCard title={language === 'cs' ? 'Presetů' : 'Presets'} value={stats.presets} icon="Layers" />
      </div>

      <div className="section">
        <div className="section-title">{language === 'cs' ? 'Poslední změny' : 'Recent changes'}</div>
        {activity.length === 0 ? (
          <div className="empty">
            <Icon name="History" size={18} />
            <span>{language === 'cs' ? 'Zatím žádné změny.' : 'No changes yet.'}</span>
          </div>
        ) : (
          <div className="activity">
            {activity.slice(0, 8).map((e, idx) => (
              <div key={idx} className="activity-row">
                <div className="when">{formatDateTime(e.at, language)}</div>
                <div className="what">
                  <strong>{e.summary}</strong>
                  {e.details?.length ? (
                    <div className="details">
                      {e.details.slice(0, 5).map((d, i) => (
                        <div key={i} className="detail-item">
                          <code>{d.key}</code>
                          <span>{d.field}</span>
                          <span className="arrow">→</span>
                          <span className="to">{String(d.to)}</span>
                        </div>
                      ))}
                      {e.details.length > 5 && <div className="more">+{e.details.length - 5}…</div>}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .section {
          margin-top: 16px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 12px;
        }
        .empty {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6B7280;
        }
        .activity {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
          padding: 12px;
          border: 1px solid #F3F4F6;
          border-radius: 12px;
          background: #F9FAFB;
        }
        .when {
          font-size: 12px;
          color: #6B7280;
        }
        .what {
          font-size: 13px;
          color: #374151;
        }
        .details {
          margin-top: 8px;
          display: grid;
          gap: 6px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #374151;
        }
        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: #fff;
          border: 1px solid #E5E7EB;
          padding: 2px 6px;
          border-radius: 8px;
        }
        .arrow { color: #9CA3AF; }
        .to { font-weight: 700; }
        .more { font-size: 12px; color: #6B7280; }
        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 700px) {
          .grid { grid-template-columns: 1fr; }
          .activity-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="kpi">
      <div className="icon"><Icon name={icon} size={18} /></div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="value">{value}</div>
      </div>
      <style>{`
        .kpi {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
        }
        .title {
          font-size: 12px;
          color: #6B7280;
          font-weight: 700;
        }
        .value {
          font-size: 22px;
          color: #111827;
          font-weight: 900;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

function WidgetPage({ language, draft, onPatchDraft }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [onlyVisible, setOnlyVisible] = useState(false);

  const groups = useMemo(() => {
    const set = new Set(PRUSA_PARAMETER_CATALOG.map(d => d.group || 'Other'));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return PRUSA_PARAMETER_CATALOG
      .filter(def => {
        if (group && def.group !== group) return false;
        const lib = draft.parameters[def.key];
        const w = draft.widget[def.key];
        if (!lib || !w) return false;
        if (onlyActive && !lib.active_for_slicing) return false;
        if (onlyVisible && !w.visible_in_widget) return false;
        if (!s) return true;
        const label = getLabel(def, language).toLowerCase();
        const key = def.key.toLowerCase();
        return label.includes(s) || key.includes(s);
      })
      .sort((a, b) => {
        const ga = a.group || 'Other';
        const gb = b.group || 'Other';
        if (ga !== gb) return ga.localeCompare(gb);
        return getLabel(a, language).localeCompare(getLabel(b, language));
      });
  }, [search, group, onlyActive, onlyVisible, draft, language]);

  return (
    <div>
      <div className="top">
        <div className="card">
          <Toggle
            checked={!!draft.enable_widget_overrides}
            onChange={(v) => onPatchDraft({ enable_widget_overrides: v })}
            label={language === 'cs' ? 'Povolit zákazníkovi měnit parametry ve widgetu' : 'Allow customers to change parameters in widget'}
            hint={language === 'cs'
              ? 'Když je vypnuto, kalkulačka vždy použije admin defaults/preset a zákazník neuvidí parametry.'
              : 'When off, widget won\'t show parameter controls; defaults/presets are still used.'}
          />
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="Search" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'cs' ? 'Hledat…' : 'Search…'}
          />
        </div>

        <div className="filters">
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">{language === 'cs' ? 'Všechny skupiny' : 'All groups'}</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button className={`chip ${onlyActive ? 'on' : ''}`} onClick={() => setOnlyActive(v => !v)}>
            {language === 'cs' ? 'Jen aktivní pro slicování' : 'Active for slicing only'}
          </button>
          <button className={`chip ${onlyVisible ? 'on' : ''}`} onClick={() => setOnlyVisible(v => !v)}>
            {language === 'cs' ? 'Jen viditelné ve widgetu' : 'Visible in widget only'}
          </button>
        </div>
      </div>

      <div className="table">
        {filtered.map(def => (
          <WidgetRow
            key={def.key}
            language={language}
            def={def}
            libraryRow={draft.parameters[def.key]}
            widgetRow={draft.widget[def.key]}
            enabled={!!draft.enable_widget_overrides}
            onChange={(patch) => onPatchDraft({ widget: { [def.key]: patch } })}
          />
        ))}
      </div>

      <style>{`
        .top {
          margin-bottom: 14px;
        }
        .card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 10px 12px;
          min-width: 340px;
        }
        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }
        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        select {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 10px;
          font-size: 14px;
        }
        .chip {
          border: 1px solid #D1D5DB;
          background: #fff;
          border-radius: 999px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
        }
        .chip.on {
          background: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }
        .table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (max-width: 960px) {
          .search { min-width: 240px; }
        }
      `}</style>
    </div>
  );
}

function WidgetRow({ language, def, libraryRow, widgetRow, enabled, onChange }) {
  const inactiveForSlicing = !libraryRow?.active_for_slicing;
  const disabled = !enabled || inactiveForSlicing;

  const baseAllowed = useMemo(() => {
    if (def.dataType === 'number') {
      return { min: def.min ?? 0, max: def.max ?? 999999, step: def.step ?? 1 };
    }
    if (def.dataType === 'enum') {
      return { options: (def.options || []).map(o => o.value) };
    }
    return null;
  }, [def]);

  const allowed = widgetRow.allowed_values_override || baseAllowed;

  const setAllowed = (next) => {
    // store null when equal to base
    if (safeEqual(next, baseAllowed)) {
      onChange({ ...widgetRow, allowed_values_override: null });
    } else {
      onChange({ ...widgetRow, allowed_values_override: next });
    }
  };

  return (
    <div className={`row ${disabled ? 'disabled' : ''}`}>
      <div className="head">
        <div className="title">
          <div className="name">{getLabel(def, language)}</div>
          <div className="meta">
            <span className="key">{def.key}</span>
            <Badge tone={inactiveForSlicing ? 'gray' : widgetRow.visible_in_widget ? 'blue' : 'gray'}>
              {inactiveForSlicing
                ? (language === 'cs' ? 'Neaktivní pro slicování' : 'Inactive for slicing')
                : widgetRow.visible_in_widget
                  ? (language === 'cs' ? 'Viditelné' : 'Visible')
                  : (language === 'cs' ? 'Skryté' : 'Hidden')}
            </Badge>
          </div>
        </div>
        <div className="controls">
          <Toggle
            checked={!!widgetRow.visible_in_widget}
            onChange={(v) => onChange({ ...widgetRow, visible_in_widget: v })}
            disabled={disabled}
            label={language === 'cs' ? 'Ve widgetu' : 'In widget'}
            hint={null}
          />
        </div>
      </div>

      <div className="body">
        <div className="col">
          <label>{language === 'cs' ? 'Widget label' : 'Widget label'}</label>
          <input
            value={widgetRow.widget_label || ''}
            onChange={(e) => onChange({ ...widgetRow, widget_label: e.target.value })}
            disabled={!enabled}
          />
        </div>
        <div className="col">
          <label>{language === 'cs' ? 'Help text' : 'Help text'}</label>
          <input
            value={widgetRow.widget_help || ''}
            onChange={(e) => onChange({ ...widgetRow, widget_help: e.target.value })}
            disabled={!enabled}
          />
        </div>
      </div>

      <div className="advanced">
        <div className="advanced-grid">
          <div className="col">
            <label>{language === 'cs' ? 'Input typ' : 'Input type'}</label>
            <select
              value={widgetRow.input_type || 'auto'}
              onChange={(e) => onChange({ ...widgetRow, input_type: e.target.value })}
              disabled={!enabled}
            >
              <option value="auto">auto</option>
              <option value="slider">slider</option>
              <option value="select">select</option>
              <option value="toggle">toggle</option>
              <option value="text">text</option>
            </select>
          </div>

          <div className="col">
            <label>{language === 'cs' ? 'Read-only' : 'Read-only'}</label>
            <select
              value={widgetRow.locked_readonly ? 'yes' : 'no'}
              onChange={(e) => onChange({ ...widgetRow, locked_readonly: e.target.value === 'yes' })}
              disabled={!enabled}
            >
              <option value="no">{language === 'cs' ? 'Ne' : 'No'}</option>
              <option value="yes">{language === 'cs' ? 'Ano' : 'Yes'}</option>
            </select>
          </div>

          <div className="col span2">
            <label>{language === 'cs' ? 'Povolené hodnoty' : 'Allowed values'}</label>

            {def.dataType === 'number' ? (
              <div className="allowed">
                <input
                  type="number"
                  value={String(allowed?.min ?? '')}
                  onChange={(e) => setAllowed({ ...allowed, min: Number(e.target.value) })}
                  disabled={!enabled}
                  placeholder="min"
                />
                <input
                  type="number"
                  value={String(allowed?.max ?? '')}
                  onChange={(e) => setAllowed({ ...allowed, max: Number(e.target.value) })}
                  disabled={!enabled}
                  placeholder="max"
                />
                <input
                  type="number"
                  value={String(allowed?.step ?? '')}
                  onChange={(e) => setAllowed({ ...allowed, step: Number(e.target.value) })}
                  disabled={!enabled}
                  placeholder="step"
                />
                {def.unit ? <span className="unit">{def.unit}</span> : null}
              </div>
            ) : def.dataType === 'enum' ? (
              <div className="allowed enum">
                {(def.options || []).map(opt => {
                  const allowedSet = new Set((allowed?.options || baseAllowed?.options || []));
                  const checked = allowedSet.has(opt.value);
                  return (
                    <label key={opt.value} className="opt">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set((allowed?.options || baseAllowed?.options || []));
                          if (e.target.checked) set.add(opt.value); else set.delete(opt.value);
                          setAllowed({ options: Array.from(set) });
                        }}
                        disabled={!enabled}
                      />
                      <span>{opt.label?.[language] || opt.label?.cs || opt.label?.en || opt.value}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="allowed note">
                {language === 'cs' ? 'Pro tento typ se povolené hodnoty typicky neřeší.' : 'Allowed values are typically not needed for this type.'}
              </div>
            )}
          </div>
        </div>

        {inactiveForSlicing && (
          <div className="warn">
            <Icon name="AlertTriangle" size={16} />
            <span>
              {language === 'cs'
                ? 'Parametr je neaktivní pro slicování → nedoporučuje se ho zobrazovat ve widgetu.'
                : 'Parameter is inactive for slicing → it should not be shown in widget.'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .row {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .row.disabled {
          opacity: 0.85;
        }
        .head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .name {
          font-size: 15px;
          font-weight: 900;
          color: #111827;
        }
        .meta {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .key {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
        }
        .body {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .advanced {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #F3F4F6;
        }
        .advanced-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          gap: 12px;
          align-items: end;
        }
        .col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .span2 {
          grid-column: span 1;
        }
        label {
          font-size: 12px;
          color: #6B7280;
          font-weight: 700;
        }
        input, select {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          outline: none;
          font-size: 14px;
          background: #fff;
        }
        .allowed {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .allowed input { max-width: 120px; }
        .allowed .unit { font-size: 12px; color: #6B7280; }
        .allowed.enum {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 10px;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          background: #F9FAFB;
        }
        .opt {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }
        .allowed.note {
          padding: 10px;
          border: 1px dashed #D1D5DB;
          border-radius: 12px;
          background: #F9FAFB;
          font-size: 13px;
          color: #6B7280;
        }
        .warn {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 12px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          color: #92400E;
          font-size: 13px;
        }
        @media (max-width: 1000px) {
          .body { grid-template-columns: 1fr; }
          .advanced-grid { grid-template-columns: 1fr; }
          .allowed input { max-width: none; flex: 1; }
          .allowed.enum { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function ValidationPage({ language }) {
  return (
    <div className="wrap">
      <div className="banner">
        <Icon name="Construction" size={18} />
        <span>
          {language === 'cs'
            ? 'Validace & limity je připravené architektonicky (tab), ale logika pravidel bude doplněna později.'
            : 'Validation & limits is prepared as a tab, rule engine will be added later.'}
        </span>
      </div>

      <div className="card">
        <div className="title">{language === 'cs' ? 'Příklady pravidel (budoucí)' : 'Example rules (future)'} </div>
        <ul>
          <li><code>layer_height</code> ≤ 0.75 × <code>nozzle_diameter</code></li>
          <li><code>fill_density</code> v rozsahu 0..100</li>
          <li><code>perimeters</code> ≥ 1</li>
          <li>Pokud <code>support_material=false</code>, support parametry se ignorují/skrývají</li>
        </ul>
        <div className="note">
          {language === 'cs'
            ? 'Chování: ve widgetu blokovat kalkulaci s vysvětlením; v adminu zabránit uložení, pokud je to tvrdý limit.'
            : 'Behavior: block widget calculation with explanation; in admin, prevent save for hard limits.'}
        </div>
      </div>

      <style>{`
        .banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1D4ED8;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px;
        }
        .title {
          font-size: 16px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 10px;
        }
        ul { margin: 0; padding-left: 18px; color: #374151; }
        li { margin: 6px 0; }
        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: #F3F4F6;
          padding: 2px 6px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }
        .note {
          margin-top: 12px;
          font-size: 13px;
          color: #6B7280;
        }
      `}</style>
    </div>
  );
}

// =============================
// Main module
// =============================

export default function AdminParameters() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const defsByKey = useMemo(() => getDefByKey(), []);

  const [persisted, setPersisted] = useState(() => loadPersisted(language));
  const [draft, setDraft] = useState(() => deepClone(persisted));
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | dirty | saving
  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);

  // If language changes, we keep tenant values but refresh default labels/help for widget defaults (only when fields are empty).
  useEffect(() => {
    const p = loadPersisted(language);
    setPersisted(p);
    setDraft((prev) => {
      // keep existing draft values, but ensure new catalog keys exist
      const next = deepClone(prev);
      for (const def of PRUSA_PARAMETER_CATALOG) {
        if (!next.parameters[def.key]) {
          next.parameters[def.key] = {
            active_for_slicing: Boolean(def.defaultActiveForSlicing),
            default_value_override: null,
          };
        }
        if (!next.widget[def.key]) {
          next.widget[def.key] = {
            visible_in_widget: false,
            widget_label: getLabel(def, language),
            widget_help: getHelp(def, language),
            input_type: 'auto',
            allowed_values_override: null,
            locked_readonly: false,
          };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const dirtyCount = useMemo(() => computeDiffCount(draft, persisted), [draft, persisted]);

  useEffect(() => {
    setSaveStatus(dirtyCount === 0 ? 'saved' : 'dirty');
  }, [dirtyCount]);

  const saveDisabled = useMemo(() => {
    // Validate only catalog-defined number/enum types in draft
    for (const def of PRUSA_PARAMETER_CATALOG) {
      const row = draft.parameters[def.key];
      if (!row) continue;
      const effectiveValue = row.default_value_override === null ? def.defaultValue : row.default_value_override;

      if (def.dataType === 'number') {
        const v = Number(effectiveValue);
        if (!Number.isFinite(v)) return true;
        if (typeof def.min === 'number' && v < def.min) return true;
        if (typeof def.max === 'number' && v > def.max) return true;
      }

      if (def.dataType === 'enum') {
        const allowed = (def.options || []).map(o => o.value);
        if (allowed.length && !allowed.includes(String(effectiveValue))) return true;
      }
    }
    return saveStatus === 'saving';
  }, [draft, saveStatus]);

  const onPatchDraft = (patch) => {
    setDraft((prev) => {
      const next = deepClone(prev);
      if (patch.enable_widget_overrides !== undefined) next.enable_widget_overrides = patch.enable_widget_overrides;

      if (patch.parameters) {
        for (const [key, value] of Object.entries(patch.parameters)) {
          if (!next.parameters[key]) next.parameters[key] = value;
          else next.parameters[key] = { ...next.parameters[key], ...value };
        }
      }

      if (patch.widget) {
        for (const [key, value] of Object.entries(patch.widget)) {
          if (!next.widget[key]) next.widget[key] = value;
          else next.widget[key] = { ...next.widget[key], ...value };
        }
      }

      return next;
    });
  };

  const resetAllToDefaults = () => {
    const base = buildDefaultState(language);
    setDraft(base);
  };

  const resetGroupToDefaults = (group) => {
    setDraft((prev) => {
      const next = deepClone(prev);
      for (const def of PRUSA_PARAMETER_CATALOG.filter(d => (d.group || 'Other') === group)) {
        next.parameters[def.key] = {
          active_for_slicing: Boolean(def.defaultActiveForSlicing),
          default_value_override: null,
        };
      }
      return next;
    });
  };

  const setGroupActive = (group, active) => {
    setDraft((prev) => {
      const next = deepClone(prev);
      for (const def of PRUSA_PARAMETER_CATALOG.filter(d => (d.group || 'Other') === group)) {
        if (!next.parameters[def.key]) continue;
        next.parameters[def.key].active_for_slicing = active;
      }
      return next;
    });
  };

  const handleSave = () => {
    setSaveStatus('saving');

    // Build change log summary
    const details = [];

    for (const def of PRUSA_PARAMETER_CATALOG) {
      const key = def.key;
      const before = persisted.parameters[key];
      const after = draft.parameters[key];
      if (before && after) {
        if (before.active_for_slicing !== after.active_for_slicing) {
          details.push({ key, field: 'active_for_slicing', from: before.active_for_slicing, to: after.active_for_slicing });
        }
        if (!safeEqual(before.default_value_override, after.default_value_override)) {
          details.push({ key, field: 'default_value_override', from: before.default_value_override, to: after.default_value_override });
        }
      }

      const wBefore = persisted.widget[key];
      const wAfter = draft.widget[key];
      if (wBefore && wAfter && !safeEqual(wBefore, wAfter)) {
        details.push({ key, field: 'widget', from: '…', to: '…' });
      }
    }

    const nextPersisted = deepClone(draft);
    nextPersisted.updated_at = nowIso();
    nextPersisted.updated_by = 'admin';

    writeTenantJson(STORAGE_NS, nextPersisted);
    setPersisted(nextPersisted);
    setDraft(nextPersisted);

    appendTenantLog(STORAGE_LOG, {
      at: nowIso(),
      summary: details.length
        ? `Saved parameters (${details.length} change${details.length === 1 ? '' : 's'})`
        : 'Saved parameters',
      details,
    });

    setSaveStatus('saved');
  };

  const tabs = useMemo(() => {
    const path = location.pathname;
    const base = '/admin/parameters';
    const active = (p) => (p === base ? path === base || path === base + '/' : path.startsWith(p));

    return [
      { path: base, label: language === 'cs' ? 'Knihovna' : 'Library', icon: 'List' },
      { path: base + '/overview', label: language === 'cs' ? 'Overview' : 'Overview', icon: 'BarChart3' },
      { path: base + '/widget', label: language === 'cs' ? 'Widget parametry' : 'Widget', icon: 'SlidersHorizontal' },
      { path: base + '/validation', label: language === 'cs' ? 'Validace' : 'Validation', icon: 'ShieldCheck' },
    ].map(t => ({ ...t, active: active(t.path) }));
  }, [location.pathname, language]);

  return (
    <div className="admin-parameters">
      <div className="page-header">
        <div>
          <h1>Parameters</h1>
          <p className="subtitle">
            {language === 'cs'
              ? 'Správa parametrů pro PrusaSlicer: aktivita, defaulty a widget možnosti. Změny se projeví v nových kalkulacích.'
              : 'Manage PrusaSlicer parameters: activity, defaults and widget options. Changes apply to new calculations.'}
          </p>
        </div>

        <div className="header-actions">
          <Badge tone={dirtyCount ? 'amber' : 'green'}>
            {dirtyCount ? (language === 'cs' ? 'Neuložené změny' : 'Unsaved changes') : (language === 'cs' ? 'Uloženo' : 'Saved')}
            {dirtyCount ? ` (${dirtyCount})` : ''}
          </Badge>
          <button className="btn" onClick={() => setConfirmResetAllOpen(true)} disabled={saveStatus === 'saving'}>
            <Icon name="RotateCcw" size={16} />
            {language === 'cs' ? 'Reset' : 'Reset'}
          </button>
          <button className="btn primary" onClick={handleSave} disabled={saveDisabled || dirtyCount === 0}>
            <Icon name="Save" size={16} />
            {language === 'cs' ? 'Uložit změny' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.path}
            className={`tab ${t.active ? 'active' : ''}`}
            onClick={() => navigate(t.path)}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
        <div className="tabs-right">
          <button className="tab link" onClick={() => navigate('/admin/presets')}>
            <Icon name="Layers" size={16} />
            {language === 'cs' ? 'Presety' : 'Presets'}
          </button>
        </div>
      </div>

      <Routes>
        <Route
          index
          element={
            <LibraryPage
              language={language}
              defsByKey={defsByKey}
              draft={draft}
              persisted={persisted}
              onPatchDraft={onPatchDraft}
              onResetGroup={(g) => resetGroupToDefaults(g)}
              onResetAll={() => resetAllToDefaults()}
              onEnableGroup={(g) => setGroupActive(g, true)}
              onDisableGroup={(g) => setGroupActive(g, false)}
              saveDisabled={saveDisabled}
              onSave={handleSave}
            />
          }
        />
        <Route path="overview" element={<OverviewPage language={language} draft={draft} />} />
        <Route path="widget" element={<WidgetPage language={language} draft={draft} onPatchDraft={onPatchDraft} />} />
        <Route path="validation" element={<ValidationPage language={language} />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>

      <ConfirmModal
        open={confirmResetAllOpen}
        title={language === 'cs' ? 'Resetovat všechny parametry?' : 'Reset all parameters?'}
        description={language === 'cs'
          ? 'Tato akce vrátí všechny parametry na katalogové defaulty (aktivita + hodnoty). Je to destruktivní změna.'
          : 'This will restore all parameters to catalog defaults (active flags + values). This is destructive.'}
        confirmText={language === 'cs' ? 'Resetovat' : 'Reset'}
        cancelText={language === 'cs' ? 'Zrušit' : 'Cancel'}
        danger
        onConfirm={() => {
          setConfirmResetAllOpen(false);
          resetAllToDefaults();
        }}
        onCancel={() => setConfirmResetAllOpen(false)}
      />

      <style>{`
        .admin-parameters {
          max-width: 1100px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 800;
          color: #111827;
        }
        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #6B7280;
          line-height: 1.45;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #D1D5DB;
          background: #fff;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          color: #111827;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn.primary {
          background: #2563EB;
          border-color: #2563EB;
          color: #fff;
        }
        .tabs {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          background: #fff;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          color: #374151;
        }
        .tab.active {
          background: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }
        .tabs-right {
          margin-left: auto;
        }
        .tab.link {
          background: #F9FAFB;
        }
        @media (max-width: 700px) {
          .admin-parameters { max-width: none; }
          .page-header { flex-direction: column; align-items: stretch; }
          .tabs-right { margin-left: 0; }
        }

        /* Compact Toolbar Styles */
        .compact-toolbar {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 24px;
          margin: -24px -24px 20px -24px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .toolbar-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .search-compact {
          position: relative;
          width: 240px;
        }
        .search-compact input {
          width: 100%;
          padding: 6px 10px 6px 32px;
          border-radius: 6px !important;
          font-size: 13px;
          height: 32px;
          border: 1px solid #e5e7eb;
        }
        .search-compact .lucide {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        .filter-select {
          width: auto;
          height: 32px;
          padding: 0 24px 0 10px !important;
          font-size: 13px;
          border-radius: 6px !important;
          border: 1px solid #e5e7eb;
          background: #fff;
        }
        .filter-chip {
          height: 32px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
        }
        .filter-chip:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .filter-chip.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
        }
        .toolbar-spacer {
          flex: 1;
        }
        .changes-badge {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
