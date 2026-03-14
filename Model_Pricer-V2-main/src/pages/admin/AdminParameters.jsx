import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PRUSA_PARAMETER_CATALOG } from '../../data/prusaParameterCatalog';
import { loadPricingConfigV3, savePricingConfigV3, getDefaultPricingConfigV3 } from '../../utils/adminPricingStorage';
import { appendTenantLog, readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';
import { safeJsonParse } from '../../utils/sanitizeJson';

// =============================
// Parameters & Presets (Admin) — Variant A (front-end demo)
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
      default_value_override: null,
    };

    widget[def.key] = {
      visible_in_widget: false,
      widget_label: getLabel(def, language),
      widget_help: getHelp(def, language),
      input_type: 'auto',
      allowed_values_override: null,
      locked_readonly: false,
    };
  }

  return {
    enable_widget_overrides: true,
    parameters,
    widget,
    updated_at: nowIso(),
    updated_by: 'admin', // default value; overwritten with actual user on save
  };
}

function loadPersisted(language) {
  const persisted = readTenantJson(STORAGE_NS, null);
  const base = buildDefaultState(language);
  if (!persisted) return base;

  const merged = deepClone(base);
  merged.enable_widget_overrides = typeof persisted.enable_widget_overrides === 'boolean'
    ? persisted.enable_widget_overrides
    : base.enable_widget_overrides;

  if (persisted.parameters) {
    for (const [key, v] of Object.entries(persisted.parameters)) {
      if (!merged.parameters[key]) continue;
      merged.parameters[key] = { ...merged.parameters[key], ...v };
    }
  }

  if (persisted.widget) {
    for (const [key, v] of Object.entries(persisted.widget)) {
      if (!merged.widget[key]) continue;
      merged.widget[key] = { ...merged.widget[key], ...v };
    }
  }

  merged.updated_at = persisted.updated_at || merged.updated_at;
  merged.updated_by = persisted.updated_by || merged.updated_by;

  return merged;
}

function computeDiffCount(a, b) {
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

function formatDateTime(iso, language) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US');
  } catch {
    return iso;
  }
}

// ─── Printer profile defaults (for the new Printer Profile section) ───
const DEFAULT_PRINTER_PROFILE = {
  name: 'Original Prusa MK4S',
  buildVolume: { x: 250, y: 210, z: 220 },
  nozzleDiameters: [0.25, 0.4, 0.6, 0.8],
  currentNozzle: 0.4,
  layerHeights: { min: 0.05, max: 0.35, default: 0.2 },
  temperaturePresets: {
    PLA: { nozzle: 215, bed: 60 },
    PETG: { nozzle: 240, bed: 85 },
    ASA: { nozzle: 260, bed: 100 },
    TPU: { nozzle: 220, bed: 50 },
    PC: { nozzle: 275, bed: 110 },
  },
};

// ─── Shared small components ───

function GradientToggle({ checked, onChange, disabled = false }) {
  return (
    <label className={`ap-gradient-toggle ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="ap-gradient-toggle-track" />
    </label>
  );
}

function Toggle({ checked, onChange, disabled = false, label, hint, rightSlot }) {
  return (
    <div className={`ap-toggle ${disabled ? 'disabled' : ''}`}>
      <GradientToggle checked={checked} onChange={onChange} disabled={disabled} />
      {(label || hint || rightSlot) && (
        <div className="ap-toggle-text">
          <div className="ap-toggle-title-row">
            {label && <div className="ap-toggle-title">{label}</div>}
            {rightSlot}
          </div>
          {hint && <div className="ap-toggle-hint">{hint}</div>}
        </div>
      )}
    </div>
  );
}

function Badge({ children, tone = 'gray' }) {
  return <span className={`ap-badge ap-badge-${tone}`}>{children}</span>;
}

function ConfirmModal({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const el = overlayRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleKeyDown = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div ref={overlayRef} className="ap-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ap-modal">
        <div className="ap-modal-title">{title}</div>
        {description && <div className="ap-modal-desc">{description}</div>}
        <div className="ap-modal-actions">
          <button className="ap-btn" onClick={onCancel}>{cancelText}</button>
          <button className={`ap-btn ap-btn-primary ${danger ? 'ap-btn-danger' : ''}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function Hint({ children }) {
  return (
    <div className="ap-hint">
      <Icon name="Info" size={16} />
      <span>{children}</span>
    </div>
  );
}

// Collapsible section wrapper
function CollapsibleSection({ title, icon, badge, defaultOpen = true, children, headerRight, id }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ap-collapsible ${open ? 'open' : 'closed'}`} id={id}>
      <button className="ap-collapsible-header" onClick={() => setOpen(v => !v)} type="button">
        <Icon name={open ? 'ChevronDown' : 'ChevronRight'} size={16} />
        {icon && <Icon name={icon} size={16} />}
        <span className="ap-collapsible-title">{title}</span>
        {badge && <span className="ap-collapsible-badge">{badge}</span>}
        <div className="ap-collapsible-spacer" />
        {headerRight && <div className="ap-collapsible-right" onClick={e => e.stopPropagation()}>{headerRight}</div>}
      </button>
      {open && <div className="ap-collapsible-body">{children}</div>}
    </div>
  );
}

// Number stepper input
function StepperInput({ value, onChange, min, max, step = 1, unit, disabled, placeholder }) {
  const numVal = Number(value);
  const canDec = !disabled && Number.isFinite(numVal) && (min === undefined || numVal - step >= min);
  const canInc = !disabled && Number.isFinite(numVal) && (max === undefined || numVal + step <= max);

  return (
    <div className="ap-stepper">
      <button
        type="button"
        className="ap-stepper-btn"
        disabled={!canDec}
        onClick={() => onChange(Math.max(min ?? -Infinity, numVal - step))}
        aria-label="Decrease"
      >-</button>
      <div className="ap-stepper-input-wrap">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return onChange(null);
            const num = Number(raw);
            if (!Number.isFinite(num)) return;
            // Clamp to min/max bounds when typing
            const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, num));
            onChange(clamped);
          }}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="ap-stepper-unit">{unit}</span>}
      </div>
      <button
        type="button"
        className="ap-stepper-btn"
        disabled={!canInc}
        onClick={() => onChange(Math.min(max ?? Infinity, numVal + step))}
        aria-label="Increase"
      >+</button>
    </div>
  );
}

// Search highlight helper
function HighlightText({ text, search }) {
  if (!search || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="ap-highlight">{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </>
  );
}

// =============================
// KPI Card
// =============================
function KpiCard({ title, value, icon, tone }) {
  return (
    <div className={`ap-kpi ${tone ? `ap-kpi-${tone}` : ''}`}>
      <div className="ap-kpi-icon"><Icon name={icon} size={18} /></div>
      <div className="ap-kpi-content">
        <div className="ap-kpi-title">{title}</div>
        <div className="ap-kpi-value">{value}</div>
      </div>
    </div>
  );
}

// =============================
// Printer Profile Section (NEW)
// =============================
function PrinterProfileSection({ language }) {
  const profile = DEFAULT_PRINTER_PROFILE;
  const { t } = useLanguage();

  return (
    <div className="ap-printer-profile">
      <div className="ap-printer-header">
        <div className="ap-printer-name">
          <Icon name="Cpu" size={20} />
          <span>{profile.name}</span>
        </div>
        <Badge tone="blue">
          {t('admin.parameters.printerActiveProfile', 'Active profile')}
        </Badge>
      </div>

      <div className="ap-printer-grid">
        {/* Build volume */}
        <div className="ap-printer-card">
          <div className="ap-printer-card-title">
            <Icon name="Box" size={14} />
            {t('admin.parameters.printerBuildVolume', 'Build Volume')}
          </div>
          <div className="ap-build-volume-visual">
            <div className="ap-build-volume-box">
              <div className="ap-build-dim ap-build-dim-x">{profile.buildVolume.x} mm</div>
              <div className="ap-build-dim ap-build-dim-y">{profile.buildVolume.y} mm</div>
              <div className="ap-build-dim ap-build-dim-z">{profile.buildVolume.z} mm</div>
            </div>
          </div>
          <div className="ap-printer-card-footer">
            {profile.buildVolume.x} x {profile.buildVolume.y} x {profile.buildVolume.z} mm
          </div>
        </div>

        {/* Nozzle */}
        <div className="ap-printer-card">
          <div className="ap-printer-card-title">
            <Icon name="Target" size={14} />
            {t('admin.parameters.printerNozzle', 'Nozzle')}
          </div>
          <div className="ap-nozzle-grid">
            {profile.nozzleDiameters.map(d => (
              <div key={d} className={`ap-nozzle-item ${d === profile.currentNozzle ? 'active' : ''}`}>
                {d} mm
              </div>
            ))}
          </div>
          <div className="ap-printer-card-footer">
            {t('admin.parameters.printerNozzleCurrent', 'Current:')} <strong>{profile.currentNozzle} mm</strong>
          </div>
        </div>

        {/* Layer heights */}
        <div className="ap-printer-card">
          <div className="ap-printer-card-title">
            <Icon name="Layers" size={14} />
            {t('admin.parameters.printerLayerHeight', 'Layer Height')}
          </div>
          <div className="ap-layer-range">
            <div className="ap-layer-range-bar">
              <div className="ap-layer-range-fill" style={{
                left: `${((profile.layerHeights.default - profile.layerHeights.min) / (profile.layerHeights.max - profile.layerHeights.min)) * 100}%`
              }} />
            </div>
            <div className="ap-layer-range-labels">
              <span>{profile.layerHeights.min} mm</span>
              <span className="ap-layer-default">{profile.layerHeights.default} mm</span>
              <span>{profile.layerHeights.max} mm</span>
            </div>
          </div>
          <div className="ap-printer-card-footer">
            {t('admin.parameters.printerLayerDefault', 'Default:')} <strong>{profile.layerHeights.default} mm</strong>
          </div>
        </div>

        {/* Temperature presets */}
        <div className="ap-printer-card ap-printer-card-wide">
          <div className="ap-printer-card-title">
            <Icon name="Thermometer" size={14} />
            {t('admin.parameters.printerTempPresets', 'Temperature Presets')}
          </div>
          <div className="ap-temp-grid">
            {Object.entries(profile.temperaturePresets).map(([mat, temps]) => (
              <div key={mat} className="ap-temp-item">
                <div className="ap-temp-material">{mat}</div>
                <div className="ap-temp-values">
                  <span className="ap-temp-val"><Icon name="Flame" size={12} /> {temps.nozzle}°C</span>
                  <span className="ap-temp-val ap-temp-bed"><Icon name="LayoutGrid" size={12} /> {temps.bed}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================
// ParamRow (improved with stepper, highlight, change indicator)
// =============================
function ParamRow({ def, row, selected, onToggleSelected, onChange, language, searchTerm, isChanged: isChangedProp }) {
  const { t } = useLanguage();
  const value = row.default_value_override;
  const isChanged = value !== null && !safeEqual(value, def.defaultValue);
  const isActiveChanged = Boolean(row.active_for_slicing) !== Boolean(def.defaultActiveForSlicing);
  const hasAnyChange = isChanged || isActiveChanged;
  const hasError = !!row.validation_error;
  const [justChanged, setJustChanged] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (!safeEqual(prevValueRef.current, value)) {
      setJustChanged(true);
      const timer = setTimeout(() => setJustChanged(false), 1200);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const unitLabel = def.unit
    ? def.unit === 'percent' ? '%' : def.unit
    : null;

  function setOverride(next) {
    onChange({ ...row, default_value_override: next });
  }

  function setActive(next) {
    onChange({ ...row, active_for_slicing: next });
  }

  function renderValueInput() {
    if (def.dataType === 'boolean') {
      const effective = value === null ? def.defaultValue : value;
      return (
        <select
          value={String(effective)}
          onChange={(e) => setOverride(e.target.value === 'true')}
          className={value === null ? 'ap-is-default' : ''}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    if (def.dataType === 'enum') {
      const effective = value === null ? def.defaultValue : value;
      return (
        <select
          value={effective}
          onChange={(e) => setOverride(e.target.value)}
          className={value === null ? 'ap-is-default' : ''}
        >
          {(def.options || def.enumValues || []).map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      );
    }

    if (def.dataType === 'number') {
      const effective = value === null ? def.defaultValue : value;
      return (
        <StepperInput
          value={effective}
          onChange={(v) => {
            if (v === null) return setOverride(null);
            setOverride(v);
          }}
          min={def.min}
          max={def.max}
          step={def.step || 1}
          unit={unitLabel}
          disabled={false}
        />
      );
    }

    const effective = value === null ? def.defaultValue : value;
    return (
      <textarea
        className={`ap-code-input ${value === null ? 'ap-is-default' : ''}`}
        value={effective || ''}
        onChange={(e) => setOverride(e.target.value)}
        rows={def.dataType === 'gcode' ? 3 : 1}
      />
    );
  }

  return (
    <div className={`ap-paramCard ${hasError ? 'ap-has-error' : ''} ${hasAnyChange ? 'ap-has-change' : ''} ${justChanged ? 'ap-just-changed' : ''}`}>
      <div className="ap-paramCard-top">
        <ForgeCheckbox
          checked={selected}
          onChange={() => onToggleSelected(def.key)}
        />

        <div className="ap-paramCard-title">
          <div className="ap-paramCard-label" title={getLabel(def, language)}>
            <HighlightText text={getLabel(def, language)} search={searchTerm} />
          </div>
          <div className="ap-paramCard-key" title={def.key}>
            <HighlightText text={def.key} search={searchTerm} />
          </div>
          <div className="ap-paramCard-badges">
            <span className="ap-paramCard-badge">{def.dataType}</span>
            {unitLabel && <span className="ap-paramCard-badge ap-paramCard-badge-unit">{unitLabel}</span>}
            {hasAnyChange ? (
              <span className="ap-paramCard-badge ap-paramCard-badge-changed">
                {t('admin.parameters.paramBadgeChanged', 'changed')}
              </span>
            ) : (
              <span className="ap-paramCard-badge ap-paramCard-badge-muted">{t('admin.parameters.paramBadgeDefault', 'default')}</span>
            )}
            {!row.active_for_slicing && (
              <span className="ap-paramCard-badge ap-paramCard-badge-inactive">
                {t('admin.parameters.paramBadgeInactive', 'inactive')}
              </span>
            )}
          </div>
        </div>

        <div className="ap-paramCard-controls">
          <Toggle
            checked={!!row.active_for_slicing}
            onChange={(v) => setActive(v)}
            label={t('admin.parameters.paramActive', 'Active')}
          />
        </div>
      </div>

      <div className="ap-paramCard-valueWrap">
        <div className="ap-paramCard-valueRow">
          <div className="ap-paramCard-inputWrap">
            {renderValueInput()}
          </div>

          <button
            type="button"
            className="ap-paramCard-reset"
            onClick={() => setOverride(null)}
            disabled={value === null}
            title={t('admin.parameters.paramResetTitle', 'Reset to default')}
          >
            <Icon name="RotateCcw" size={14} />
          </button>
        </div>

        {def.help && getHelp(def, language) && (
          <div className="ap-paramCard-help">{getHelp(def, language)}</div>
        )}

        {hasError ? <div className="ap-paramCard-error">{row.validation_error}</div> : null}
      </div>
    </div>
  );
}

// =============================
// LibraryPage (improved with collapsible sections, search highlight, per-group reset)
// =============================
function LibraryPage({ language, defsByKey, draft, persisted, onPatchDraft, onResetGroup, onResetAll, onEnableGroup, onDisableGroup, saveDisabled, onSave }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('pro');
  const [confirm, setConfirm] = useState({ open: false, action: null, title: '', description: '' });
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const toggleSelected = useCallback((key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const hasAnyFilter = search || group || typeFilter || levelFilter !== 'pro' || onlyActive || onlyInactive || onlyChanged;
  const clearAllFilters = () => {
    setSearch('');
    setGroup('');
    setTypeFilter('');
    setLevelFilter('pro');
    setOnlyActive(false);
    setOnlyInactive(false);
    setOnlyChanged(false);
  };

  const groups = useMemo(() => {
    const set = new Set(PRUSA_PARAMETER_CATALOG.map(d => d.group || 'Other'));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const lvlOrder = { basic: 0, mid: 1, pro: 2 };

    return PRUSA_PARAMETER_CATALOG
      .filter(def => {
        if (group && def.group !== group) return false;
        if (typeFilter && def.dataType !== typeFilter) return false;
        const defLvl = def.uiLevel || 'pro';
        if (lvlOrder[defLvl] > lvlOrder[levelFilter || 'pro']) return false;

        const row = draft.parameters[def.key];
        if (!row) return false;

        const active = !!row.active_for_slicing;
        if (onlyActive && !active) return false;
        if (onlyInactive && active) return false;

        const baseDefault = def.defaultValue;
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
  }, [search, group, onlyActive, onlyInactive, onlyChanged, typeFilter, levelFilter, draft, language]);

  const grouped = useMemo(() => {
    const out = {};
    for (const d of filtered) {
      const g = d.group || 'Other';
      if (!out[g]) out[g] = [];
      out[g].push(d);
    }
    return out;
  }, [filtered]);

  // Per-group change counts
  const groupChangeCounts = useMemo(() => {
    const counts = {};
    for (const def of PRUSA_PARAMETER_CATALOG) {
      const g = def.group || 'Other';
      if (!counts[g]) counts[g] = { total: 0, changed: 0, active: 0 };
      counts[g].total += 1;
      const row = draft.parameters[def.key];
      if (!row) continue;
      if (row.active_for_slicing) counts[g].active += 1;
      const isValueChanged = row.default_value_override !== null && !safeEqual(row.default_value_override, def.defaultValue);
      const isActiveChanged = Boolean(row.active_for_slicing) !== Boolean(def.defaultActiveForSlicing);
      if (isValueChanged || isActiveChanged) counts[g].changed += 1;
    }
    return counts;
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

  const { t } = useLanguage();

  return (
    <div>
      {/* Search & Filter Panel */}
      <div className="ap-lib-filter-panel">
        <div className="ap-lib-filter-row-search">
          <div className="ap-lib-search-box">
            <Icon name="Search" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.parameters.filterSearchPlaceholder', 'Search by name or key...')}
            />
            {search && (
              <button className="ap-lib-search-clear" onClick={() => setSearch('')} title={t('admin.parameters.filterClearBtn', 'Clear')}>
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
          <div className="ap-lib-filter-result">
            <span className="ap-lib-filter-result-count">{filtered.length}</span>
            <span className="ap-lib-filter-result-sep">/</span>
            <span className="ap-lib-filter-result-total">{PRUSA_PARAMETER_CATALOG.length}</span>
            <span className="ap-lib-filter-result-label">{t('admin.parameters.filterParamCount', 'params')}</span>
          </div>
        </div>

        <div className="ap-lib-filter-row-controls">
          <div className="ap-lib-filter-selects">
            <div className="ap-lib-filter-select-wrap">
              <span className="ap-lib-filter-select-label">{t('admin.parameters.filterGroup', 'Group')}</span>
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">{t('admin.parameters.filterAll', 'All')}</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="ap-lib-filter-select-wrap">
              <span className="ap-lib-filter-select-label">{t('admin.parameters.filterDataType', 'Data type')}</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">{t('admin.parameters.filterAll', 'All')}</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="enum">Enum</option>
                <option value="string">String</option>
              </select>
            </div>
            <div className="ap-lib-filter-select-wrap">
              <span className="ap-lib-filter-select-label">{t('admin.parameters.filterLevel', 'Level')}</span>
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="pro">{t('admin.parameters.filterAll', 'All')}</option>
                <option value="basic">Basic</option>
                <option value="mid">Basic + Mid</option>
              </select>
            </div>
          </div>

          <div className="ap-lib-filter-divider" />

          <div className="ap-lib-filter-chips">
            <button
              className={`ap-lib-chip ${onlyActive ? 'on' : ''}`}
              onClick={() => { setOnlyActive(v => !v); if (!onlyActive) setOnlyInactive(false); }}
            >
              {t('admin.parameters.filterActive', 'Active')}
            </button>
            <button
              className={`ap-lib-chip ${onlyInactive ? 'on' : ''}`}
              onClick={() => { setOnlyInactive(v => !v); if (!onlyInactive) setOnlyActive(false); }}
            >
              {t('admin.parameters.filterInactive', 'Inactive')}
            </button>
            <button
              className={`ap-lib-chip ${onlyChanged ? 'on' : ''}`}
              onClick={() => setOnlyChanged(v => !v)}
            >
              {t('admin.parameters.filterChanged', 'Changed')}
            </button>
          </div>

          {hasAnyFilter && (
            <button className="ap-lib-filter-clear-btn" onClick={clearAllFilters}>
              <Icon name="X" size={14} />
              {t('admin.parameters.filterClearBtn', 'Clear')}
            </button>
          )}
        </div>
      </div>

      {/* Global bulk actions */}
      {!group && (
        <div className="ap-bulk" style={{ justifyContent: 'space-between' }}>
          <Hint>
            {t('admin.parameters.groupHint', 'Checkbox in the library = include parameter in config (active_for_slicing). Widget visibility is configured in "Widget parameters".')}
          </Hint>
          <button className="ap-btn ap-btn-danger-outline" onClick={() => handleConfirm(() => onResetAll(), t('admin.parameters.resetAllConfirmTitle', 'Reset ALL parameters?'), t('admin.parameters.resetAllConfirmDesc', 'Resets all values and active flags to catalog defaults (destructive).'))}>
            <Icon name="RotateCcw" size={14} />
            {t('admin.parameters.groupResetAll', 'Reset all to defaults')}
          </button>
        </div>
      )}

      {/* Parameter groups as collapsible sections */}
      <div className="ap-list">
        {Object.keys(grouped).length === 0 && (
          <div className="ap-empty">
            <Icon name="SearchX" size={20} />
            <span>{t('admin.parameters.filterNoResults', 'No results.')}</span>
          </div>
        )}

        {Object.entries(grouped).map(([g, defs]) => {
          const counts = groupChangeCounts[g] || { total: 0, changed: 0, active: 0 };
          return (
            <CollapsibleSection
              key={g}
              title={g}
              icon="FolderOpen"
              badge={`${defs.length} ${t('admin.parameters.filterParamCount', 'params')}${counts.changed > 0 ? ` / ${counts.changed} ${t('admin.parameters.filterChanged', 'changed')}` : ''}`}
              defaultOpen={Object.keys(grouped).length <= 3}
              headerRight={
                <div className="ap-group-actions">
                  <button className="ap-btn-sm" onClick={() => handleConfirm(() => onEnableGroup(g), t('admin.parameters.groupEnableConfirmTitle', 'Enable all in this group?'), t('admin.parameters.groupEnableConfirmDesc', 'Marks all parameters as active for slicing.'))}>
                    <Icon name="Check" size={12} /> {t('admin.parameters.groupEnableBtn', 'Enable')}
                  </button>
                  <button className="ap-btn-sm" onClick={() => handleConfirm(() => onDisableGroup(g), t('admin.parameters.groupDisableConfirmTitle', 'Disable all in this group?'), t('admin.parameters.groupDisableConfirmDesc', 'Marks all parameters as inactive for slicing.'))}>
                    <Icon name="X" size={12} /> {t('admin.parameters.groupDisableBtn', 'Disable')}
                  </button>
                  <button className="ap-btn-sm ap-btn-sm-danger" onClick={() => handleConfirm(() => onResetGroup(g), t('admin.parameters.groupResetConfirmTitle', 'Reset group to defaults?'), t('admin.parameters.groupResetConfirmDesc', 'Resets values and active flags to catalog defaults (destructive).'))}>
                    <Icon name="RotateCcw" size={12} /> {t('admin.parameters.groupResetBtn', 'Reset')}
                  </button>
                </div>
              }
            >
              <div className="ap-rows">
                {defs.map(def => (
                  <ParamRow
                    key={def.key}
                    def={def}
                    language={language}
                    row={draft.parameters[def.key]}
                    persistedRow={persisted.parameters[def.key]}
                    selected={selectedKeys.has(def.key)}
                    onToggleSelected={toggleSelected}
                    onChange={(patch) => onPatchDraft({ parameters: { [def.key]: patch } })}
                    searchTerm={search}
                  />
                ))}
              </div>
            </CollapsibleSection>
          );
        })}
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText={t('admin.parameters.confirmConfirm', 'Confirm')}
        cancelText={t('admin.parameters.confirmCancel', 'Cancel')}
        danger
        onConfirm={runConfirmAction}
        onCancel={() => setConfirm({ open: false, action: null, title: '', description: '' })}
      />
    </div>
  );
}

// =============================
// OverviewPage (improved with printer profile)
// =============================
function OverviewPage({ language, draft }) {
  const presets = readTenantJson(STORAGE_PRESETS, []);
  const activity = readTenantJson(STORAGE_LOG, []);
  const { t } = useLanguage();

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
    <div className="ap-overview">
      <div className="ap-overview-grid">
        <KpiCard title={t('admin.parameters.overviewActiveParams', 'Active parameters')} value={stats.active} icon="CheckCircle" />
        <KpiCard title={t('admin.parameters.overviewChangedParams', 'Changed parameters')} value={stats.changed} icon="Edit" tone={stats.changed > 0 ? 'amber' : undefined} />
        <KpiCard title={t('admin.parameters.overviewVisibleWidget', 'Visible in widget')} value={stats.visible} icon="Eye" />
        <KpiCard title={t('admin.parameters.overviewPresets', 'Presets')} value={stats.presets} icon="Layers" />
      </div>

      {/* Printer Profile */}
      <CollapsibleSection
        title={t('admin.parameters.overviewProfileTitle', 'Printer Profile')}
        icon="Cpu"
        defaultOpen={true}
      >
        <PrinterProfileSection language={language} />
      </CollapsibleSection>

      {/* Recent Changes */}
      <CollapsibleSection
        title={t('admin.parameters.overviewRecentChanges', 'Recent Changes')}
        icon="History"
        badge={activity.length > 0 ? String(activity.length) : undefined}
        defaultOpen={true}
      >
        {activity.length === 0 ? (
          <div className="ap-empty">
            <Icon name="History" size={18} />
            <span>{t('admin.parameters.overviewNoChanges', 'No changes yet.')}</span>
          </div>
        ) : (
          <div className="ap-activity">
            {activity.slice(0, 8).map((e, idx) => (
              <div key={idx} className="ap-activity-row">
                <div className="ap-activity-when">{formatDateTime(e.at, language)}</div>
                <div className="ap-activity-what">
                  <strong>{e.summary}</strong>
                  {e.details?.length ? (
                    <div className="ap-activity-details">
                      {e.details.slice(0, 5).map((d, i) => (
                        <div key={i} className="ap-activity-detail-item">
                          <code>{d.key}</code>
                          <span>{d.field}</span>
                          <span className="ap-arrow">&#8594;</span>
                          <span className="ap-to">{String(d.to)}</span>
                        </div>
                      ))}
                      {e.details.length > 5 && <div className="ap-more">+{e.details.length - 5}...</div>}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

// =============================
// WidgetPage (kept with minor improvements)
// =============================
function WidgetPage({ language, draft, onPatchDraft }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [onlyVisible, setOnlyVisible] = useState(false);
  const { t } = useLanguage();

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
      <div className="ap-widget-top">
        <div className="ap-card">
          <Toggle
            checked={!!draft.enable_widget_overrides}
            onChange={(v) => onPatchDraft({ enable_widget_overrides: v })}
            label={t('admin.parameters.widgetAllowCustomers', 'Allow customers to change parameters in widget')}
            hint={t('admin.parameters.widgetAllowHint', "When off, widget won't show parameter controls; defaults/presets are still used.")}
          />
        </div>
      </div>

      <div className="ap-widget-toolbar">
        <div className="ap-widget-search">
          <Icon name="Search" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.parameters.widgetSearchPlaceholder', 'Search...')}
          />
        </div>

        <div className="ap-widget-filters">
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">{t('admin.parameters.widgetAllGroups', 'All groups')}</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button className={`ap-chip ${onlyActive ? 'on' : ''}`} onClick={() => setOnlyActive(v => !v)}>
            {t('admin.parameters.widgetActiveOnly', 'Active for slicing only')}
          </button>
          <button className={`ap-chip ${onlyVisible ? 'on' : ''}`} onClick={() => setOnlyVisible(v => !v)}>
            {t('admin.parameters.widgetVisibleOnly', 'Visible in widget only')}
          </button>
        </div>
      </div>

      <div className="ap-widget-table">
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
    </div>
  );
}

function WidgetRow({ language, def, libraryRow, widgetRow, enabled, onChange }) {
  const inactiveForSlicing = !libraryRow?.active_for_slicing;
  const disabled = !enabled || inactiveForSlicing;
  const { t } = useLanguage();

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
    if (safeEqual(next, baseAllowed)) {
      onChange({ ...widgetRow, allowed_values_override: null });
    } else {
      onChange({ ...widgetRow, allowed_values_override: next });
    }
  };

  return (
    <div className={`ap-widget-row ${disabled ? 'disabled' : ''}`}>
      <div className="ap-widget-row-head">
        <div className="ap-widget-row-title">
          <div className="ap-widget-row-name">{getLabel(def, language)}</div>
          <div className="ap-widget-row-meta">
            <span className="ap-widget-row-key">{def.key}</span>
            <Badge tone={inactiveForSlicing ? 'gray' : widgetRow.visible_in_widget ? 'blue' : 'gray'}>
              {inactiveForSlicing
                ? t('admin.parameters.widgetBadgeInactive', 'Inactive for slicing')
                : widgetRow.visible_in_widget
                  ? t('admin.parameters.widgetBadgeVisible', 'Visible')
                  : t('admin.parameters.widgetBadgeHidden', 'Hidden')}
            </Badge>
          </div>
        </div>
        <div className="ap-widget-row-controls">
          <Toggle
            checked={!!widgetRow.visible_in_widget}
            onChange={(v) => onChange({ ...widgetRow, visible_in_widget: v })}
            disabled={disabled}
            label={t('admin.parameters.widgetInWidget', 'In widget')}
          />
        </div>
      </div>

      <div className="ap-widget-row-body">
        <div className="ap-widget-row-col">
          <label>{t('admin.parameters.widgetLabelField', 'Widget label')}</label>
          <input
            value={widgetRow.widget_label || ''}
            onChange={(e) => onChange({ ...widgetRow, widget_label: e.target.value })}
            disabled={!enabled}
          />
        </div>
        <div className="ap-widget-row-col">
          <label>{t('admin.parameters.widgetHelpText', 'Help text')}</label>
          <input
            value={widgetRow.widget_help || ''}
            onChange={(e) => onChange({ ...widgetRow, widget_help: e.target.value })}
            disabled={!enabled}
          />
        </div>
      </div>

      <div className="ap-widget-row-advanced">
        <div className="ap-widget-row-advanced-grid">
          <div className="ap-widget-row-col">
            <label>{t('admin.parameters.widgetInputType', 'Input type')}</label>
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

          <div className="ap-widget-row-col">
            <label>{t('admin.parameters.widgetReadOnly', 'Read-only')}</label>
            <select
              value={widgetRow.locked_readonly ? 'yes' : 'no'}
              onChange={(e) => onChange({ ...widgetRow, locked_readonly: e.target.value === 'yes' })}
              disabled={!enabled}
            >
              <option value="no">{t('admin.parameters.widgetNo', 'No')}</option>
              <option value="yes">{t('admin.parameters.widgetYes', 'Yes')}</option>
            </select>
          </div>

          <div className="ap-widget-row-col">
            <label>{t('admin.parameters.widgetAllowedValues', 'Allowed values')}</label>

            {def.dataType === 'number' ? (
              <div className="ap-widget-allowed">
                <input
                  type="number"
                  value={String(allowed?.min ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAllowed({ ...allowed, min: raw === '' ? undefined : Number(raw) });
                  }}
                  disabled={!enabled}
                  placeholder="min"
                  min={def.min}
                  max={allowed?.max ?? def.max}
                />
                <input
                  type="number"
                  value={String(allowed?.max ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAllowed({ ...allowed, max: raw === '' ? undefined : Number(raw) });
                  }}
                  disabled={!enabled}
                  placeholder="max"
                  min={allowed?.min ?? def.min}
                  max={def.max}
                />
                <input
                  type="number"
                  value={String(allowed?.step ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAllowed({ ...allowed, step: raw === '' ? undefined : Number(raw) });
                  }}
                  disabled={!enabled}
                  placeholder="step"
                  min={0.001}
                  step="any"
                />
                {def.unit ? <span className="ap-widget-unit">{def.unit}</span> : null}
              </div>
            ) : def.dataType === 'enum' ? (
              <div className="ap-widget-allowed-enum">
                {(def.options || []).map(opt => {
                  const allowedSet = new Set((allowed?.options || baseAllowed?.options || []));
                  const checked = allowedSet.has(opt.value);
                  return (
                    <div key={opt.value} className="ap-widget-opt">
                      <ForgeCheckbox
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set((allowed?.options || baseAllowed?.options || []));
                          if (e.target.checked) set.add(opt.value); else set.delete(opt.value);
                          setAllowed({ options: Array.from(set) });
                        }}
                        disabled={!enabled}
                        label={opt.label?.[language] || opt.label?.cs || opt.label?.en || opt.value}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ap-widget-allowed-note">
                {t('admin.parameters.widgetAllowedNote', 'Allowed values are typically not needed for this type.')}
              </div>
            )}
          </div>
        </div>

        {inactiveForSlicing && (
          <div className="ap-widget-warn">
            <Icon name="AlertTriangle" size={16} />
            <span>
              {t('admin.parameters.widgetInactiveWarn', 'Parameter is inactive for slicing - it should not be shown in widget.')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================
// ValidationPage
// =============================
function ValidationPage({ language }) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="ap-validation-banner">
        <Icon name="Construction" size={18} />
        <span>
          {t('admin.parameters.validationBanner', 'Validation & limits is prepared as a tab, rule engine will be added later.')}
        </span>
      </div>

      <div className="ap-card">
        <div className="ap-card-title">{t('admin.parameters.validationExamplesTitle', 'Example rules (future)')}</div>
        <ul className="ap-validation-list">
          <li><code>layer_height</code> &#8804; 0.75 x <code>nozzle_diameter</code></li>
          <li><code>fill_density</code> v rozsahu 0..100</li>
          <li><code>perimeters</code> &#8805; 1</li>
          <li>Pokud <code>support_material=false</code>, support parametry se ignoruji/skryvaji</li>
        </ul>
        <div className="ap-validation-note">
          {t('admin.parameters.validationNote', 'Behavior: block widget calculation with explanation; in admin, prevent save for hard limits.')}
        </div>
      </div>
    </div>
  );
}

// =============================
// MaterialsPage — Materials management with sorting, filtering, bulk actions, import/export
// =============================

/** Returns a CSS color based on material density value */
function getDensityColor(density) {
  const d = Number(density) || 0;
  if (d <= 1.0) return 'var(--forge-success)';        // light (PLA ~1.24 but some foams/nylons)
  if (d <= 1.2) return 'var(--forge-accent-primary)';  // standard
  if (d <= 1.4) return 'var(--forge-warning)';          // medium (ABS, PETG range)
  return 'var(--forge-error)';                          // heavy (PC, metals-filled)
}

/** Returns a density label */
function getDensityLabel(density, t) {
  const d = Number(density) || 0;
  if (d <= 1.0) return t('Lehky', 'Light');
  if (d <= 1.2) return t('Standardni', 'Standard');
  if (d <= 1.4) return t('Stredni', 'Medium');
  return t('Tezky', 'Heavy');
}

/** Known material densities (g/cm3) */
const MATERIAL_DENSITIES = {
  pla: 1.24, abs: 1.04, petg: 1.27, asa: 1.07,
  tpu: 1.21, pc: 1.20, nylon: 1.14, pva: 1.23,
  hips: 1.04, pp: 0.90, peek: 1.30, pei: 1.27,
};

function getMaterialDensity(mat) {
  const key = String(mat?.key || '').toLowerCase();
  return MATERIAL_DENSITIES[key] || null;
}

function MaterialsPage({ language }) {
  const { t } = useLanguage();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const fileInputRef = useRef(null);

  // Load materials from pricing config
  const [materials, setMaterials] = useState(() => {
    const cfg = loadPricingConfigV3();
    return Array.isArray(cfg.materials) ? cfg.materials : [];
  });

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name'); // 'name' | 'density' | 'price'
  const [sortDir, setSortDir] = useState('asc');
  const [showPreview, setShowPreview] = useState(null); // material id for preview
  const [importError, setImportError] = useState(null);
  const importErrorTimerRef = useRef(null);

  // Reload materials from storage
  const reloadMaterials = useCallback(() => {
    const cfg = loadPricingConfigV3();
    setMaterials(Array.isArray(cfg.materials) ? cfg.materials : []);
  }, []);

  // Save materials back to pricing config
  const saveMaterials = useCallback((nextMaterials) => {
    const cfg = loadPricingConfigV3();
    cfg.materials = nextMaterials;
    savePricingConfigV3(cfg);
    setMaterials(nextMaterials);
  }, []);

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDir === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  // Filtered + sorted materials
  const filteredMaterials = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = materials.filter(m => {
      if (!s) return true;
      return (m.name || '').toLowerCase().includes(s) || (m.key || '').toLowerCase().includes(s);
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'density') {
        const da = getMaterialDensity(a) || 99;
        const db = getMaterialDensity(b) || 99;
        cmp = da - db;
      } else if (sortField === 'price') {
        cmp = (Number(a.price_per_gram) || 0) - (Number(b.price_per_gram) || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [materials, search, sortField, sortDir]);

  // Bulk enable/disable
  const enabledCount = materials.filter(m => m.enabled !== false).length;
  const allEnabled = enabledCount === materials.length;
  const noneEnabled = enabledCount === 0;

  const handleBulkToggle = async () => {
    const targetEnabled = !allEnabled;
    const ok = await confirm({
      title: targetEnabled
        ? t('admin.parameters.matBulkEnableConfirmTitle', 'Enable all materials?')
        : t('admin.parameters.matBulkDisableConfirmTitle', 'Disable all materials?'),
      message: targetEnabled
        ? t('admin.parameters.matBulkEnableConfirmMsg', 'All materials will be enabled for calculations.')
        : t('admin.parameters.matBulkDisableConfirmMsg', 'All materials will be disabled. Calculations will not be possible.'),
      confirmLabel: targetEnabled ? t('admin.parameters.matBulkEnableBtn', 'Enable all') : t('admin.parameters.matBulkDisableBtn', 'Disable all'),
      destructive: !targetEnabled,
    });
    if (!ok) return;
    saveMaterials(materials.map(m => ({ ...m, enabled: targetEnabled })));
  };

  // Reset to defaults
  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: t('admin.parameters.matResetConfirmTitle', 'Reset materials to defaults?'),
      message: t('admin.parameters.matResetConfirmMsg', 'This will replace your materials configuration with defaults. This action cannot be undone.'),
      confirmLabel: t('admin.parameters.matResetBtn', 'Reset'),
      destructive: true,
    });
    if (!ok) return;
    const defaults = getDefaultPricingConfigV3();
    saveMaterials(defaults.materials);
  };

  // Show an auto-dismissing import error banner
  const showImportError = (msg) => {
    clearTimeout(importErrorTimerRef.current);
    setImportError(msg);
    importErrorTimerRef.current = setTimeout(() => setImportError(null), 4000);
  };

  // Export materials as JSON
  const handleExport = () => {
    const data = {
      _export: 'modelpricer_materials',
      _version: 1,
      _exported_at: new Date().toISOString(),
      materials,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import materials from JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = safeJsonParse(ev.target.result);
        if (!parsed.materials || !Array.isArray(parsed.materials)) {
          showImportError(t('admin.parameters.matImportInvalid', 'Invalid file format. Expected JSON with "materials" array.'));
          return;
        }
        const ok = await confirm({
          title: t('admin.parameters.matImportConfirmTitle', 'Import materials?'),
          message: language === 'cs'
            ? `Soubor obsahuje ${parsed.materials.length} materialu. Aktualni konfigurace bude nahrazena.`
            : `File contains ${parsed.materials.length} materials. Current configuration will be replaced.`,
          confirmLabel: t('admin.parameters.matImportBtn', 'Import'),
        });
        if (!ok) return;
        saveMaterials(parsed.materials);
      } catch {
        showImportError(t('admin.parameters.matImportReadError', 'Error reading file. Check JSON format.'));
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be imported again
    e.target.value = '';
  };

  // Toggle single material
  const toggleMaterial = (id) => {
    saveMaterials(materials.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  return (
    <div className="ap-materials-page">
      {/* Toolbar */}
      <div className="ap-mat-toolbar">
        <div className="ap-mat-toolbar-left">
          <div className="ap-lib-search-box">
            <Icon name="Search" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.parameters.matSearchPlaceholder', 'Search material...')}
            />
            {search && (
              <button className="ap-lib-search-clear" onClick={() => setSearch('')}>
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
          <div className="ap-mat-count">
            <span className="ap-mat-count-num">{filteredMaterials.length}</span>
            <span className="ap-mat-count-sep">/</span>
            <span>{materials.length}</span>
            <span className="ap-mat-count-label">{t('admin.parameters.matCount', 'materials')}</span>
          </div>
        </div>

        <div className="ap-mat-toolbar-right">
          <button className="ap-btn-sm" onClick={handleBulkToggle} title={allEnabled ? t('admin.parameters.matBulkDisable', 'Disable all') : t('admin.parameters.matBulkEnable', 'Enable all')}>
            <Icon name={allEnabled ? 'ToggleRight' : 'ToggleLeft'} size={14} />
            {allEnabled ? t('admin.parameters.matBulkDisable', 'Disable all') : t('admin.parameters.matBulkEnable', 'Enable all')}
          </button>
          <div className="ap-lib-filter-divider" />
          <button className="ap-btn-sm" onClick={handleExport} title={t('admin.parameters.matExport', 'Export JSON')}>
            <Icon name="Download" size={14} />
            {t('admin.parameters.matExport', 'Export')}
          </button>
          <button className="ap-btn-sm" onClick={() => fileInputRef.current?.click()} title={t('admin.parameters.matImport', 'Import JSON')}>
            <Icon name="Upload" size={14} />
            {t('admin.parameters.matImport', 'Import')}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <div className="ap-lib-filter-divider" />
          <button className="ap-btn-sm ap-btn-sm-danger" onClick={handleResetDefaults}>
            <Icon name="RotateCcw" size={14} />
            {t('admin.parameters.matReset', 'Reset to defaults')}
          </button>
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="ap-import-error-banner" role="alert">
          <Icon name="XCircle" size={16} />
          <span>{importError}</span>
          <button className="ap-import-error-close" onClick={() => setImportError(null)} aria-label={t('admin.parameters.matDismiss', 'Dismiss')}>
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Materials Table */}
      <div className="ap-mat-table-wrap">
        <table className="ap-mat-table">
          <thead>
            <tr>
              <th style={{ width: '32px' }}>
                <ForgeCheckbox
                  checked={allEnabled && materials.length > 0}
                  indeterminate={!allEnabled && !noneEnabled}
                  onChange={handleBulkToggle}
                />
              </th>
              <th className="ap-mat-th-sortable" onClick={() => handleSort('name')}>
                {t('admin.parameters.matTableMaterial', 'Material')}
                <Icon name={sortIcon('name')} size={14} />
              </th>
              <th className="ap-mat-th-sortable" onClick={() => handleSort('density')}>
                {t('admin.parameters.matTableDensity', 'Density')}
                <Icon name={sortIcon('density')} size={14} />
              </th>
              <th className="ap-mat-th-sortable" onClick={() => handleSort('price')}>
                {t('admin.parameters.matTablePrice', 'Price/g')}
                <Icon name={sortIcon('price')} size={14} />
              </th>
              <th>{t('admin.parameters.matTableColors', 'Colors')}</th>
              <th>{t('admin.parameters.matTableStatus', 'Status')}</th>
              <th>{t('admin.parameters.matTablePreview', 'Preview')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={7} className="ap-mat-empty-row">
                  <Icon name="SearchX" size={18} />
                  {t('admin.parameters.matNoResults', 'No materials found.')}
                </td>
              </tr>
            )}
            {filteredMaterials.map(mat => {
              const density = getMaterialDensity(mat);
              const densityColor = density ? getDensityColor(density) : null;
              const isEnabled = mat.enabled !== false;
              const colorCount = Array.isArray(mat.colors) ? mat.colors.length : 0;

              return (
                <tr key={mat.id} className={isEnabled ? '' : 'ap-mat-row-disabled'}>
                  <td>
                    <ForgeCheckbox
                      checked={isEnabled}
                      onChange={() => toggleMaterial(mat.id)}
                    />
                  </td>
                  <td>
                    <div className="ap-mat-name-cell">
                      <span className="ap-mat-name">{mat.name}</span>
                      <span className="ap-mat-key">{mat.key}</span>
                    </div>
                  </td>
                  <td>
                    {density ? (
                      <div className="ap-mat-density-cell">
                        <span className="ap-mat-density-dot" style={{ background: densityColor }} />
                        <span className="ap-mat-density-val">{density.toFixed(2)}</span>
                        <span className="ap-mat-density-unit">g/cm3</span>
                        <span className="ap-mat-density-label" style={{ color: densityColor }}>
                          {getDensityLabel(density, t)}
                        </span>
                      </div>
                    ) : (
                      <span className="ap-mat-density-na">{t('N/A', 'N/A')}</span>
                    )}
                  </td>
                  <td>
                    <span className="ap-mat-price">{Number(mat.price_per_gram || 0).toFixed(2)}</span>
                    <span className="ap-mat-price-unit"> CZK/g</span>
                  </td>
                  <td>
                    <div className="ap-mat-colors-cell">
                      {colorCount > 0 ? (
                        <>
                          {mat.colors.slice(0, 5).map(c => (
                            <span
                              key={c.id}
                              className="ap-mat-color-dot"
                              style={{ background: c.hex || '#888' }}
                              title={`${c.name}${c.price_per_gram != null ? ` (${c.price_per_gram} CZK/g)` : ''}`}
                            />
                          ))}
                          {colorCount > 5 && <span className="ap-mat-color-more">+{colorCount - 5}</span>}
                        </>
                      ) : (
                        <span className="ap-mat-no-colors">{t('admin.parameters.matNoColors', 'None')}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge tone={isEnabled ? 'green' : 'gray'}>
                      {isEnabled ? t('admin.parameters.matActive', 'Active') : t('admin.parameters.matInactive', 'Inactive')}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="ap-btn-sm"
                      onClick={() => setShowPreview(showPreview === mat.id ? null : mat.id)}
                      title={t('admin.parameters.matTablePreview', 'Show calculator preview')}
                    >
                      <Icon name={showPreview === mat.id ? 'EyeOff' : 'Eye'} size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mini-preview panel */}
      {showPreview && (() => {
        const mat = materials.find(m => m.id === showPreview);
        if (!mat) return null;
        const density = getMaterialDensity(mat);
        const price = Number(mat.price_per_gram || 0);
        const exampleWeight = 100; // grams
        const exampleCost = (price * exampleWeight).toFixed(2);

        return (
          <div className="ap-mat-preview">
            <div className="ap-mat-preview-header">
              <Icon name="Eye" size={16} />
              <span>{t('admin.parameters.matPreviewTitle', 'Calculator preview')}</span>
              <button className="ap-lib-search-clear" onClick={() => setShowPreview(null)}>
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="ap-mat-preview-body">
              <div className="ap-mat-preview-card">
                <div className="ap-mat-preview-label">{t('admin.parameters.matPreviewMaterial', 'Material')}</div>
                <div className="ap-mat-preview-value">{mat.name}</div>
              </div>
              {density && (
                <div className="ap-mat-preview-card">
                  <div className="ap-mat-preview-label">{t('admin.parameters.matPreviewDensity', 'Density')}</div>
                  <div className="ap-mat-preview-value">
                    <span className="ap-mat-density-dot" style={{ background: getDensityColor(density) }} />
                    {density.toFixed(2)} g/cm3
                  </div>
                </div>
              )}
              <div className="ap-mat-preview-card">
                <div className="ap-mat-preview-label">{t('admin.parameters.matPreviewPricePerG', 'Price per gram')}</div>
                <div className="ap-mat-preview-value ap-mat-preview-price">{price.toFixed(2)} CZK</div>
              </div>
              <div className="ap-mat-preview-card">
                <div className="ap-mat-preview-label">{language === 'cs' ? `Priklad: ${exampleWeight}g model` : `Example: ${exampleWeight}g model`}</div>
                <div className="ap-mat-preview-value ap-mat-preview-total">{exampleCost} CZK</div>
              </div>
              {Array.isArray(mat.colors) && mat.colors.length > 0 && (
                <div className="ap-mat-preview-card ap-mat-preview-card-wide">
                  <div className="ap-mat-preview-label">{t('admin.parameters.matPreviewColors', 'Available colors')}</div>
                  <div className="ap-mat-preview-colors">
                    {mat.colors.map(c => (
                      <div key={c.id} className="ap-mat-preview-color-item">
                        <span className="ap-mat-color-swatch" style={{ background: c.hex || '#888' }} />
                        <span>{c.name}</span>
                        {c.price_per_gram != null && (
                          <span className="ap-mat-preview-color-price">{c.price_per_gram} CZK/g</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ap-mat-preview-footer">
              <Icon name="Info" size={14} />
              {t('admin.parameters.matPreviewFooter', 'This is how the customer sees the material in the calculator.')}
            </div>
          </div>
        );
      })()}

      <ConfirmDialog />
    </div>
  );
}

// =============================
// Main module
// =============================
export default function AdminParameters() {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const defsByKey = useMemo(() => getDefByKey(), []);

  const [persisted, setPersisted] = useState(() => loadPersisted(language));
  const [draft, setDraft] = useState(() => deepClone(persisted));
  const [saveStatus, setSaveStatus] = useState('saved');
  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    const p = loadPersisted(language);
    setPersisted(p);
    setDraft((prev) => {
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
        details.push({ key, field: 'widget', from: '...', to: '...' });
      }
    }

    const nextPersisted = deepClone(draft);
    nextPersisted.updated_at = nowIso();
    nextPersisted.updated_by = currentUser;

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
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2500);
  };

  const tabs = useMemo(() => {
    const path = location.pathname;
    const base = '/admin/parameters';
    const active = (p) => (p === base ? path === base || path === base + '/' : path.startsWith(p));

    return [
      { path: base + '/overview', label: t('admin.parameters.tabOverview', 'Overview'), icon: 'BarChart3' },
      { path: base + '/library', label: t('admin.parameters.tabLibrary', 'Parameter Library'), icon: 'List' },
      { path: base + '/widget', label: t('admin.parameters.tabWidget', 'Widget'), icon: 'SlidersHorizontal' },
      { path: base + '/validation', label: t('admin.parameters.tabValidation', 'Validation'), icon: 'ShieldCheck' },
    ].map(t2 => ({ ...t2, active: active(t2.path) }));
  }, [location.pathname, language]);

  return (
    <div className="ap-root">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-h1">{t('admin.parameters.pageTitle', 'Parameters')}</h1>
          <p className="ap-subtitle">
            {t('admin.parameters.pageSubtitle', 'Manage PrusaSlicer parameters: activity, defaults and widget options. Changes apply to new calculations.')}
          </p>
        </div>

        <div className="ap-header-actions">
          {showSaveSuccess && (
            <Badge tone="green">
              <Icon name="Check" size={14} />
              {t('admin.parameters.badgeSaved', 'Saved')}
            </Badge>
          )}
          <Badge tone={dirtyCount ? 'amber' : 'green'}>
            {dirtyCount ? t('admin.parameters.badgeUnsaved', 'Unsaved changes') : t('admin.parameters.badgeSaved', 'Saved')}
            {dirtyCount ? ` (${dirtyCount})` : ''}
          </Badge>
          <button className="ap-btn" onClick={() => setConfirmResetAllOpen(true)} disabled={saveStatus === 'saving'}>
            <Icon name="RotateCcw" size={16} />
            {t('admin.parameters.btnReset', 'Reset')}
          </button>
          <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saveDisabled || dirtyCount === 0}>
            <Icon name="Save" size={16} />
            {t('admin.parameters.btnSave', 'Save changes')}
          </button>
        </div>
      </div>

      <div className="ap-tabs">
        {tabs.map(tab => (
          <button
            key={tab.path}
            className={`ap-tab ${tab.active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
        <div className="ap-tabs-right">
          <button className="ap-tab ap-tab-link" onClick={() => navigate('/admin/presets')}>
            <Icon name="Layers" size={16} />
            {t('admin.parameters.tabPresets', 'Presets')}
          </button>
        </div>
      </div>

      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage language={language} draft={draft} />} />
        <Route path="library" element={
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
        } />
        <Route path="widget" element={<WidgetPage language={language} draft={draft} onPatchDraft={onPatchDraft} />} />
        <Route path="validation" element={<ValidationPage language={language} />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>

      <ConfirmModal
        open={confirmResetAllOpen}
        title={t('admin.parameters.resetAllConfirmTitle', 'Reset all parameters?')}
        description={t('admin.parameters.resetAllConfirmDesc', 'This will restore all parameters to catalog defaults (active flags + values). This is destructive.')}
        confirmText={t('admin.parameters.resetAllConfirmBtn', 'Reset')}
        cancelText={t('admin.parameters.confirmCancel', 'Cancel')}
        danger
        onConfirm={() => {
          setConfirmResetAllOpen(false);
          resetAllToDefaults();
        }}
        onCancel={() => setConfirmResetAllOpen(false)}
      />

      <style>{adminParametersStyles}</style>
    </div>
  );
}

// =============================
// All styles in one place (scoped via ap- prefix)
// =============================
const adminParametersStyles = `
/* ─── Root ─── */
.ap-root {
  max-width: 1100px;
}

/* ─── Page header ─── */
.ap-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}
.ap-h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 800;
  font-family: var(--forge-font-heading);
  color: var(--forge-text-primary);
}
.ap-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--forge-text-secondary);
  line-height: 1.45;
}
.ap-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ─── Buttons ─── */
.ap-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--forge-radius-lg);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
  color: var(--forge-text-primary);
  transition: border-color 0.15s, background 0.15s;
}
.ap-btn:hover:not(:disabled) {
  border-color: var(--forge-border-active);
  background: var(--forge-bg-overlay);
}
.ap-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ap-btn-primary {
  background: var(--forge-accent-primary);
  border-color: var(--forge-accent-primary);
  color: var(--forge-bg-void);
}
.ap-btn-primary:hover:not(:disabled) {
  background: var(--forge-accent-primary-h, var(--forge-accent-primary));
  border-color: var(--forge-accent-primary-h, var(--forge-accent-primary));
}
.ap-btn-danger-outline {
  background: var(--forge-bg-elevated);
  border-color: rgba(255,71,87,0.4);
  color: var(--forge-error);
}
.ap-btn-danger-outline:hover:not(:disabled) {
  background: rgba(255,71,87,0.08);
}
.ap-btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  cursor: pointer;
  font-weight: 700;
  font-size: 11px;
  color: var(--forge-text-secondary);
  transition: all 0.15s;
  white-space: nowrap;
}
.ap-btn-sm:hover {
  border-color: var(--forge-border-active);
  color: var(--forge-text-primary);
}
.ap-btn-sm-danger {
  border-color: rgba(255,71,87,0.3);
  color: var(--forge-error);
}
.ap-btn-sm-danger:hover {
  background: rgba(255,71,87,0.08);
}

/* ─── Tabs ─── */
.ap-tabs {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.ap-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--forge-radius-lg);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-surface);
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
  font-family: var(--forge-font-tech);
  color: var(--forge-text-secondary);
  transition: all 0.15s;
}
.ap-tab:hover {
  border-color: var(--forge-border-active);
  color: var(--forge-text-primary);
}
.ap-tab.active {
  background: rgba(0,212,170,0.1);
  border-color: rgba(0,212,170,0.3);
  color: var(--forge-accent-primary);
}
.ap-tabs-right {
  margin-left: auto;
}
.ap-tab-link {
  background: var(--forge-bg-elevated);
}

/* ─── Badge ─── */
.ap-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--forge-font-tech);
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  white-space: nowrap;
}
.ap-badge-gray { background: var(--forge-bg-elevated); color: var(--forge-text-secondary); border-color: var(--forge-border-default); }
.ap-badge-blue { background: rgba(0,212,170,0.1); color: var(--forge-accent-primary); border-color: rgba(0,212,170,0.25); }
.ap-badge-amber { background: rgba(255,181,71,0.12); color: var(--forge-warning); border-color: rgba(255,181,71,0.3); }
.ap-badge-red { background: rgba(255,71,87,0.12); color: var(--forge-error); border-color: rgba(255,71,87,0.3); }
.ap-badge-green { background: rgba(0,212,170,0.12); color: var(--forge-success); border-color: rgba(0,212,170,0.3); }

/* ─── Toggle ─── */
.ap-gradient-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.ap-gradient-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ap-gradient-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.ap-gradient-toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--forge-error), #c0392b);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  position: relative;
  transition: background 0.3s ease;
}
.ap-gradient-toggle input:checked + .ap-gradient-toggle-track {
  background: linear-gradient(to right, var(--forge-accent-primary), #00a886);
}
.ap-gradient-toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--forge-text-primary);
  border: 1px solid rgba(0,0,0,0.2);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
}
.ap-gradient-toggle input:checked + .ap-gradient-toggle-track::after {
  transform: translateX(20px);
}
.ap-gradient-toggle input:focus + .ap-gradient-toggle-track {
  outline: 2px solid var(--forge-accent-primary);
  outline-offset: 2px;
}
.ap-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ap-toggle.disabled { opacity: 0.6; }
.ap-toggle-text { flex: 1; }
.ap-toggle-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ap-toggle-title {
  font-weight: 600;
  color: var(--forge-text-primary);
  font-size: 14px;
}
.ap-toggle-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--forge-text-muted);
  line-height: 1.35;
}

/* ─── Hint ─── */
.ap-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--forge-radius-lg);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  color: var(--forge-text-secondary);
  font-size: 13px;
}

/* ─── Modal ─── */
.ap-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}
.ap-modal {
  width: 100%;
  max-width: 520px;
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 20px;
  box-shadow: var(--forge-shadow-lg);
}
.ap-modal-title {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--forge-font-heading);
  color: var(--forge-text-primary);
  margin-bottom: 8px;
}
.ap-modal-desc {
  font-size: 14px;
  color: var(--forge-text-secondary);
  line-height: 1.45;
}
.ap-modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.ap-btn-danger {
  background: var(--forge-error);
  border-color: var(--forge-error);
  color: #fff;
}

/* ─── Collapsible Section ─── */
.ap-collapsible {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  overflow: hidden;
  box-shadow: var(--forge-shadow-sm);
  margin-bottom: 14px;
}
.ap-collapsible-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: none;
  background: var(--forge-bg-elevated);
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 16px;
  font-weight: 800;
  font-family: var(--forge-font-heading);
  color: var(--forge-text-primary);
  transition: background 0.15s;
}
.ap-collapsible-header:hover {
  background: var(--forge-bg-overlay);
}
.ap-collapsible.open .ap-collapsible-header {
  border-bottom: 1px solid var(--forge-border-default);
}
.ap-collapsible-title {
  flex: 1;
  min-width: 0;
}
.ap-collapsible-badge {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--forge-font-tech);
  color: var(--forge-text-muted);
  white-space: nowrap;
}
.ap-collapsible-spacer { flex: 1; }
.ap-collapsible-right {
  display: flex;
  gap: 6px;
  align-items: center;
}
.ap-collapsible-body {
  padding: 14px 16px;
}

/* ─── Number Stepper ─── */
.ap-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  overflow: hidden;
  background: var(--forge-bg-elevated);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ap-stepper:focus-within {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-stepper-btn {
  width: 36px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--forge-bg-overlay);
  color: var(--forge-text-secondary);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.ap-stepper-btn:hover:not(:disabled) {
  background: rgba(0,212,170,0.1);
  color: var(--forge-accent-primary);
}
.ap-stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.ap-stepper-input-wrap {
  flex: 1;
  position: relative;
  min-width: 0;
}
.ap-stepper-input-wrap input {
  width: 100%;
  padding: 8px 12px;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-size: 14px;
  font-family: var(--forge-font-mono);
  color: var(--forge-text-primary);
  text-align: center;
  box-shadow: none !important;
  height: auto !important;
  -moz-appearance: textfield;
}
.ap-stepper-input-wrap input::-webkit-outer-spin-button,
.ap-stepper-input-wrap input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ap-stepper-unit {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--forge-text-muted);
  font-weight: 700;
  font-family: var(--forge-font-tech);
  pointer-events: none;
}

/* ─── Search Highlight ─── */
.ap-highlight {
  background: rgba(255,181,71,0.3);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

/* ─── Param Card ─── */
.ap-paramCard {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--forge-shadow-sm);
  min-width: 0;
  transition: border-color 0.15s, box-shadow 0.3s;
}
.ap-paramCard:hover {
  border-color: var(--forge-border-active);
}
.ap-paramCard.ap-has-error {
  border-color: rgba(255,71,87,0.5);
  box-shadow: 0 0 0 3px rgba(255,71,87,0.1);
}
.ap-paramCard.ap-has-change {
  border-left: 3px solid var(--forge-accent-primary);
}
.ap-paramCard.ap-just-changed {
  box-shadow: 0 0 0 3px rgba(0,212,170,0.15);
}
.ap-paramCard-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}
.ap-paramCard-title {
  flex: 1;
  min-width: 0;
}
.ap-paramCard-label {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--forge-text-primary);
}
.ap-paramCard-key {
  margin-top: 2px;
  font-family: var(--forge-font-mono);
  font-size: 12px;
  color: var(--forge-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-paramCard-badges {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ap-paramCard-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--forge-bg-elevated);
  color: var(--forge-text-secondary);
  font-weight: 800;
  font-family: var(--forge-font-tech);
  letter-spacing: 0.04em;
}
.ap-paramCard-badge-unit {
  background: rgba(77,168,218,0.1);
  color: var(--forge-info, #4DA8DA);
  border: 1px solid rgba(77,168,218,0.2);
}
.ap-paramCard-badge-changed {
  background: rgba(0,212,170,0.1);
  color: var(--forge-accent-primary);
}
.ap-paramCard-badge-muted {
  background: var(--forge-bg-overlay);
  color: var(--forge-text-disabled);
}
.ap-paramCard-badge-inactive {
  background: rgba(255,181,71,0.1);
  color: var(--forge-warning);
}
.ap-paramCard-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.ap-paramCard-valueWrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ap-paramCard-valueRow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ap-paramCard-inputWrap {
  flex: 1;
  position: relative;
  min-width: 0;
}
.ap-paramCard-inputWrap select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  font-size: 14px;
  outline: none;
  background: var(--forge-bg-elevated);
  color: var(--forge-text-primary);
  font-family: var(--forge-font-mono);
}
.ap-paramCard-inputWrap select:focus {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-code-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  font-size: 13px;
  outline: none;
  background: var(--forge-bg-elevated);
  color: var(--forge-text-primary);
  font-family: var(--forge-font-mono);
  resize: vertical;
}
.ap-code-input:focus {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-paramCard-reset {
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  color: var(--forge-text-secondary);
  border-radius: var(--forge-radius-lg);
  padding: 10px 12px;
  cursor: pointer;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
  display: flex;
  align-items: center;
}
.ap-paramCard-reset:hover:not(:disabled) {
  border-color: var(--forge-accent-primary);
  color: var(--forge-accent-primary);
}
.ap-paramCard-reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ap-paramCard-help {
  font-size: 12px;
  color: var(--forge-text-muted);
  line-height: 1.4;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-paramCard-error {
  font-size: 12px;
  color: var(--forge-error);
  font-weight: 900;
}

/* ─── Library layout ─── */
.ap-rows {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1200px) {
  .ap-rows { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .ap-rows { grid-template-columns: 1fr; }
}
.ap-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.ap-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--forge-text-muted);
  background: var(--forge-bg-surface);
  border: 1px dashed var(--forge-border-active);
  border-radius: var(--forge-radius-xl);
  padding: 16px;
}
.ap-bulk {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.ap-group-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* ─── Filter panel ─── */
.ap-lib-filter-panel {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--forge-shadow-sm);
}
.ap-lib-filter-row-search {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ap-lib-search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--forge-bg-elevated);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  padding: 8px 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ap-lib-search-box:focus-within {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-lib-search-box input {
  flex: 1;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-size: 14px;
  padding: 0 !important;
  height: auto !important;
  box-shadow: none !important;
  width: 100%;
  color: var(--forge-text-primary);
}
.ap-lib-search-box .lucide {
  color: var(--forge-text-muted);
  flex-shrink: 0;
}
.ap-lib-search-clear {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--forge-text-muted);
  padding: 2px;
  border-radius: 4px;
}
.ap-lib-search-clear:hover { color: var(--forge-text-primary); }
.ap-lib-filter-result {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  color: var(--forge-text-muted);
  white-space: nowrap;
}
.ap-lib-filter-result-count {
  font-weight: 800;
  color: var(--forge-accent-primary);
  font-size: 16px;
  font-family: var(--forge-font-mono);
}
.ap-lib-filter-result-sep { color: var(--forge-text-disabled); }
.ap-lib-filter-result-total {
  font-weight: 600;
  font-family: var(--forge-font-mono);
}
.ap-lib-filter-result-label {
  margin-left: 2px;
  font-family: var(--forge-font-tech);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.08em;
}
.ap-lib-filter-row-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-lib-filter-selects {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ap-lib-filter-select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ap-lib-filter-select-label {
  font-size: 11px;
  color: var(--forge-text-muted);
  font-weight: 600;
  white-space: nowrap;
  font-family: var(--forge-font-tech);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.ap-lib-filter-select-wrap select {
  height: 32px;
  padding: 0 28px 0 10px;
  font-size: 13px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  color: var(--forge-text-primary);
  font-weight: 500;
  cursor: pointer;
  min-width: 90px;
}
.ap-lib-filter-select-wrap select:focus {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 2px rgba(0,212,170,0.1);
}
.ap-lib-filter-divider {
  width: 1px;
  height: 24px;
  background: var(--forge-border-default);
  flex-shrink: 0;
}
.ap-lib-filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ap-lib-chip {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  font-size: 13px;
  font-weight: 600;
  color: var(--forge-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.ap-lib-chip:hover {
  background: var(--forge-bg-overlay);
  border-color: var(--forge-border-active);
}
.ap-lib-chip.on {
  background: rgba(0,212,170,0.1);
  border-color: rgba(0,212,170,0.3);
  color: var(--forge-accent-primary);
}
.ap-lib-filter-clear-btn {
  height: 32px;
  padding: 0 10px;
  border-radius: var(--forge-radius-md);
  border: 1px solid rgba(255,71,87,0.3);
  background: var(--forge-bg-elevated);
  font-size: 12px;
  font-weight: 600;
  color: var(--forge-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  margin-left: auto;
}
.ap-lib-filter-clear-btn:hover {
  background: rgba(255,71,87,0.08);
}

/* ─── Overview ─── */
.ap-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
@media (max-width: 1100px) {
  .ap-overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .ap-overview-grid { grid-template-columns: 1fr; }
}

/* ─── KPI ─── */
.ap-kpi {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--forge-shadow-sm);
  transition: border-color 0.15s;
}
.ap-kpi:hover { border-color: var(--forge-border-active); }
.ap-kpi-amber { border-left: 3px solid var(--forge-warning); }
.ap-kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--forge-radius-lg);
  background: var(--forge-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--forge-accent-primary);
}
.ap-kpi-title {
  font-size: 11px;
  color: var(--forge-text-muted);
  font-weight: 700;
  font-family: var(--forge-font-tech);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.ap-kpi-value {
  font-size: 22px;
  color: var(--forge-text-primary);
  font-weight: 900;
  font-family: var(--forge-font-mono);
  margin-top: 2px;
}

/* ─── Printer Profile ─── */
.ap-printer-profile { padding: 0; }
.ap-printer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.ap-printer-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  font-family: var(--forge-font-heading);
  color: var(--forge-text-primary);
}
.ap-printer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 900px) {
  .ap-printer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .ap-printer-grid { grid-template-columns: 1fr; }
}
.ap-printer-card {
  background: var(--forge-bg-elevated);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  padding: 14px;
}
.ap-printer-card-wide {
  grid-column: 1 / -1;
}
.ap-printer-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--forge-font-tech);
  color: var(--forge-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}
.ap-printer-card-footer {
  margin-top: 10px;
  font-size: 12px;
  color: var(--forge-text-muted);
  font-family: var(--forge-font-tech);
}
.ap-printer-card-footer strong {
  color: var(--forge-accent-primary);
}

/* Build volume visual */
.ap-build-volume-visual {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.ap-build-volume-box {
  width: 80px;
  height: 70px;
  border: 2px solid var(--forge-accent-primary);
  border-radius: var(--forge-radius-md);
  position: relative;
  background: rgba(0,212,170,0.05);
}
.ap-build-dim {
  position: absolute;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--forge-font-mono);
  color: var(--forge-accent-primary);
  white-space: nowrap;
}
.ap-build-dim-x { bottom: -18px; left: 50%; transform: translateX(-50%); }
.ap-build-dim-y { right: -44px; top: 50%; transform: translateY(-50%); }
.ap-build-dim-z { left: -24px; top: 50%; transform: translateY(-50%) rotate(-90deg); }

/* Nozzle grid */
.ap-nozzle-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ap-nozzle-item {
  padding: 6px 12px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--forge-font-mono);
  color: var(--forge-text-secondary);
  background: var(--forge-bg-surface);
}
.ap-nozzle-item.active {
  border-color: var(--forge-accent-primary);
  background: rgba(0,212,170,0.1);
  color: var(--forge-accent-primary);
}

/* Layer range */
.ap-layer-range { padding: 8px 0; }
.ap-layer-range-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--forge-bg-overlay);
  position: relative;
  margin-bottom: 8px;
}
.ap-layer-range-fill {
  position: absolute;
  top: -4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--forge-accent-primary);
  border: 2px solid var(--forge-bg-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transform: translateX(-50%);
}
.ap-layer-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-family: var(--forge-font-mono);
  color: var(--forge-text-muted);
}
.ap-layer-default {
  color: var(--forge-accent-primary);
  font-weight: 700;
}

/* Temperature presets */
.ap-temp-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-temp-item {
  flex: 1;
  min-width: 100px;
  padding: 10px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-surface);
}
.ap-temp-material {
  font-size: 13px;
  font-weight: 800;
  color: var(--forge-text-primary);
  margin-bottom: 6px;
}
.ap-temp-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ap-temp-val {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-family: var(--forge-font-mono);
  color: var(--forge-accent-primary);
}
.ap-temp-bed {
  color: var(--forge-warning);
}

/* ─── Activity log ─── */
.ap-activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ap-activity-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  background: var(--forge-bg-elevated);
}
.ap-activity-row:hover { background: var(--forge-bg-overlay); }
.ap-activity-when {
  font-size: 12px;
  color: var(--forge-text-muted);
  font-family: var(--forge-font-mono);
}
.ap-activity-what {
  font-size: 13px;
  color: var(--forge-text-secondary);
}
.ap-activity-what strong { color: var(--forge-text-primary); }
.ap-activity-details {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}
.ap-activity-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--forge-text-secondary);
}
.ap-activity-detail-item code {
  font-family: var(--forge-font-mono);
  background: var(--forge-bg-overlay);
  border: 1px solid var(--forge-border-default);
  padding: 2px 6px;
  border-radius: var(--forge-radius-md);
  color: var(--forge-accent-primary);
}
.ap-arrow { color: var(--forge-text-disabled); }
.ap-to { font-weight: 700; color: var(--forge-text-primary); }
.ap-more { font-size: 12px; color: var(--forge-text-muted); }

/* ─── Widget page ─── */
.ap-widget-top { margin-bottom: 14px; }
.ap-card {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 16px;
  box-shadow: var(--forge-shadow-sm);
}
.ap-card-title {
  font-size: 16px;
  font-weight: 900;
  font-family: var(--forge-font-heading);
  color: var(--forge-text-primary);
  margin-bottom: 10px;
}
.ap-widget-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.ap-widget-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--forge-bg-elevated);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  padding: 10px 12px;
  min-width: 300px;
  color: var(--forge-text-muted);
}
.ap-widget-search:focus-within {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-widget-search input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 14px;
  background: transparent;
  color: var(--forge-text-primary);
}
.ap-widget-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-widget-filters select {
  background: var(--forge-bg-elevated);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  padding: 10px;
  font-size: 14px;
  color: var(--forge-text-primary);
}
.ap-chip {
  border: 1px solid var(--forge-border-default);
  background: var(--forge-bg-elevated);
  border-radius: 999px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: var(--forge-text-secondary);
  transition: all 0.15s;
}
.ap-chip:hover { border-color: var(--forge-border-active); }
.ap-chip.on {
  background: rgba(0,212,170,0.1);
  border-color: rgba(0,212,170,0.3);
  color: var(--forge-accent-primary);
}
.ap-widget-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ap-widget-row {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-xl);
  padding: 14px;
  box-shadow: var(--forge-shadow-sm);
  transition: border-color 0.15s;
}
.ap-widget-row:hover { border-color: var(--forge-border-active); }
.ap-widget-row.disabled { opacity: 0.85; }
.ap-widget-row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ap-widget-row-name {
  font-size: 15px;
  font-weight: 900;
  color: var(--forge-text-primary);
}
.ap-widget-row-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-widget-row-key {
  font-family: var(--forge-font-mono);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--forge-bg-elevated);
  color: var(--forge-text-muted);
  border: 1px solid var(--forge-border-default);
}
.ap-widget-row-body {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ap-widget-row-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ap-widget-row-col label {
  font-size: 11px;
  color: var(--forge-text-muted);
  font-weight: 700;
  font-family: var(--forge-font-tech);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.ap-widget-row-col input,
.ap-widget-row-col select {
  padding: 10px 12px;
  border-radius: var(--forge-radius-lg);
  border: 1px solid var(--forge-border-default);
  outline: none;
  font-size: 14px;
  background: var(--forge-bg-elevated);
  color: var(--forge-text-primary);
  font-family: var(--forge-font-mono);
}
.ap-widget-row-col input:focus,
.ap-widget-row-col select:focus {
  border-color: var(--forge-accent-primary);
  box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
}
.ap-widget-row-advanced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--forge-border-default);
}
.ap-widget-row-advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 12px;
  align-items: end;
}
.ap-widget-allowed {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-widget-allowed input { max-width: 120px; }
.ap-widget-unit {
  font-size: 12px;
  color: var(--forge-text-muted);
  font-family: var(--forge-font-tech);
}
.ap-widget-allowed-enum {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-lg);
  background: var(--forge-bg-elevated);
}
.ap-widget-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--forge-text-secondary);
}
.ap-widget-allowed-note {
  padding: 10px;
  border: 1px dashed var(--forge-border-active);
  border-radius: var(--forge-radius-lg);
  background: var(--forge-bg-elevated);
  font-size: 13px;
  color: var(--forge-text-muted);
}
.ap-widget-warn {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--forge-radius-lg);
  background: rgba(255,181,71,0.08);
  border: 1px solid rgba(255,181,71,0.3);
  color: var(--forge-warning);
  font-size: 13px;
}
@media (max-width: 1000px) {
  .ap-widget-row-body { grid-template-columns: 1fr; }
  .ap-widget-row-advanced-grid { grid-template-columns: 1fr; }
  .ap-widget-allowed input { max-width: none; flex: 1; }
  .ap-widget-allowed-enum { grid-template-columns: 1fr; }
}

/* ─── Validation page ─── */
.ap-validation-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--forge-radius-xl);
  background: rgba(77,168,218,0.08);
  border: 1px solid rgba(77,168,218,0.3);
  color: var(--forge-info, #4DA8DA);
  font-weight: 700;
  margin-bottom: 14px;
}
.ap-validation-list {
  margin: 0;
  padding-left: 18px;
  color: var(--forge-text-secondary);
}
.ap-validation-list li { margin: 6px 0; }
.ap-validation-list code {
  font-family: var(--forge-font-mono);
  background: var(--forge-bg-elevated);
  padding: 2px 6px;
  border-radius: var(--forge-radius-md);
  border: 1px solid var(--forge-border-default);
  color: var(--forge-accent-primary);
}
.ap-validation-note {
  margin-top: 12px;
  font-size: 13px;
  color: var(--forge-text-muted);
}

/* ─── Import error banner ─── */
.ap-import-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: var(--forge-radius-xl);
  background: rgba(255,71,87,0.06);
  border: 1px solid rgba(255,71,87,0.3);
  color: var(--forge-error, #FF4757);
  font-size: 13px;
  font-weight: 500;
}
.ap-import-error-close {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: auto;
  color: inherit;
  padding: 2px;
  display: flex;
  align-items: center;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .ap-lib-filter-row-search {
    flex-direction: column;
    align-items: stretch;
  }
  .ap-lib-filter-result { justify-content: center; }
  .ap-lib-filter-row-controls { justify-content: flex-start; }
  .ap-lib-filter-divider { display: none; }
  .ap-activity-row { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .ap-root { max-width: none; }
  .ap-page-header { flex-direction: column; align-items: stretch; }
  .ap-tabs-right { margin-left: 0; }
}
`;
