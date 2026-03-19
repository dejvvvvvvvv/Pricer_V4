// Admin Pricing Configuration Page - Dynamic Materials + Advanced Pricing Rules (Demo-first)
// This file is meant to be a drop-in replacement for the original:
//   src/pages/admin/AdminPricing.jsx
//
// Notes (current phase):
// - Single source of truth: tenant-scoped V3 storage (namespace: pricing:v3)
// - No backend sync here (handled elsewhere). This page reads/writes only via loadPricingConfigV3/savePricingConfigV3.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { SkeletonCard, SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadPricingConfigV3, savePricingConfigV3 } from '../../utils/adminPricingStorage';
import { getTenantId } from '../../utils/adminTenantStorage';
import { safeJsonParse } from '../../utils/sanitizeJson';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { addNotification } from '../../utils/adminNotificationStorage';
import ForgeHelpIcon from '../../components/ui/forge/ForgeHelpIcon';
import { getHelpText, getLearnMore } from './helpTexts';

const DEFAULT_RULES = {
  // time
  rate_per_hour: 150,

  // minimum billed time
  min_billed_minutes_enabled: false,
  min_billed_minutes_value: 30,

  // minimum prices
  min_price_per_model_enabled: false,
  min_price_per_model_value: 99,

  min_order_total_enabled: false,
  min_order_total_value: 199,

  // rounding
  rounding_enabled: false,
  rounding_step: 5, // 1/5/10/50
  rounding_mode: 'nearest', // 'nearest' | 'up'
  smart_rounding_enabled: true, // true => round only final total; false => round per-model too

  // markup
  markup_enabled: false,
  markup_mode: 'flat', // 'flat' | 'percent' | 'min_flat'
  markup_value: 20,
};

const DEFAULT_PREVIEW = {
  material_price_per_g: 0.6,
  weight_g: 100,
  time_min: 60,
  quantity: 1,
  fees_total: 0, // simulated "Fees" total per model (Kč) for preview
};

const PRICING_TABS = [
  { id: 'materials', icon: 'Package', label_cs: 'Materialy', label_en: 'Materials' },
  { id: 'time', icon: 'Clock', label_cs: 'Cas tisku', label_en: 'Print Time' },
  { id: 'rules', icon: 'Calculator', label_cs: 'Cenova pravidla', label_en: 'Pricing Rules' },
  { id: 'discounts', icon: 'Percent', label_cs: 'Slevy', label_en: 'Discounts' },
  { id: 'preview', icon: 'Eye', label_cs: 'Nahled', label_en: 'Preview' },
];

// --- Collapsible section state (tenant-scoped UI preference) ---
function getCollapsedKey() {
  const tenantId = getTenantId() || 'default';
  return `modelpricer:${tenantId}:pricing:ui:collapsed`;
}
function loadCollapsedState() {
  try {
    const raw = localStorage.getItem(getCollapsedKey());
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveCollapsedState(state) {
  try { localStorage.setItem(getCollapsedKey(), JSON.stringify(state)); } catch {}
}

// --- Number Stepper component ---
function NumberStepper({ value, onChange, min = 0, step = 1, className = '', error = false, style }) {
  const handleStep = (dir) => {
    const next = safeNum(value, 0) + dir * step;
    if (next < min) return;
    onChange(next);
  };
  const stepBtnStyle = {
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--forge-border-default, #1a1a2e)', borderRadius: 6,
    background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-secondary, #a0a0a0)',
    cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: 0, lineHeight: 1,
    transition: 'background 120ms, color 120ms, border-color 120ms',
  };
  return (
    <div className="number-stepper-wrap" style={{ display: 'flex', alignItems: 'center', gap: 4, ...style }}>
      <button
        type="button" style={stepBtnStyle} tabIndex={-1}
        onClick={() => handleStep(-1)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)'; e.currentTarget.style.color = 'var(--forge-text-primary, #e0e0e0)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--forge-border-default, #1a1a2e)'; e.currentTarget.style.color = 'var(--forge-text-secondary, #a0a0a0)'; }}
        aria-label="Decrease"
      >−</button>
      <input
        type="number" min={min} step={step}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        value={value}
        onChange={(e) => onChange(safeNum(e.target.value, 0))}
        style={{ textAlign: 'center', MozAppearance: 'textfield', width: '100%' }}
      />
      <button
        type="button" style={stepBtnStyle} tabIndex={-1}
        onClick={() => handleStep(1)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)'; e.currentTarget.style.color = 'var(--forge-text-primary, #e0e0e0)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--forge-border-default, #1a1a2e)'; e.currentTarget.style.color = 'var(--forge-text-secondary, #a0a0a0)'; }}
        aria-label="Increase"
      >+</button>
    </div>
  );
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Parse decimal input: handles comma and dot, allows empty during editing.
// Returns raw string for display, filters non-numeric characters.
function parseDecimal(v) {
  if (v === '' || v == null) return '';
  const s = String(v).replace(',', '.');
  // Allow: digits, one dot, optional leading minus
  if (/^-?\d*\.?\d*$/.test(s)) return v;
  // Invalid char typed — reject by returning previous-compatible value
  // Strip last char (the invalid one)
  const stripped = String(v).slice(0, -1);
  return stripped === '' ? '' : stripped;
}

// Finalize decimal on blur: always returns a number (or custom fallback like null)
function finalizeDecimal(v, fallback = 0) {
  if (v === '' || v == null) return fallback;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function clampMin0(n) {
  const x = safeNum(n, 0);
  return x < 0 ? 0 : x;
}

const MAX_NUMERIC_BOUND = 999999;

function clampBounded(n, fallback = 0) {
  const x = safeNum(n, fallback);
  if (x < 0) return 0;
  if (x > MAX_NUMERIC_BOUND) return MAX_NUMERIC_BOUND;
  return x;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createStableId(prefix = 'id') {
  try {
    // Modern browsers
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    // ignore
  }
  return `${prefix}-${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugifyMaterialKey(input) {
  const s = String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return s;
}

function isValidMaterialKey(key) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(String(key || ''));
}

function ensureUniqueMaterialKey(baseKey, materials, currentId = null) {
  const existing = new Set(
    (materials || [])
      .filter((m) => (currentId ? m?.id !== currentId : true))
      .map((m) => String(m?.key || '').toLowerCase())
      .filter(Boolean)
  );
  let k = String(baseKey || '').toLowerCase();
  if (!k) return k;
  if (!existing.has(k)) return k;
  let i = 2;
  while (existing.has(`${k}_${i}`)) i += 1;
  return `${k}_${i}`;
}

function normalizeHex(hex) {
  const raw = String(hex || '').trim();
  if (!raw) return '';
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  const up = withHash.toUpperCase();
  return up;
}

function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/.test(String(hex || '').trim().toUpperCase());
}

// ─── Material type definitions with sensible defaults ───
const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC', 'PA', 'HIPS', 'PVA', 'Jiný'];

const MATERIAL_TYPE_DEFAULTS = {
  PLA:  { density: 1.24, temp_nozzle_min: 190, temp_nozzle_max: 220, temp_bed_min: 50, temp_bed_max: 65, cooling_fan: 100, speed_min: 40, speed_max: 80 },
  PETG: { density: 1.27, temp_nozzle_min: 225, temp_nozzle_max: 250, temp_bed_min: 70, temp_bed_max: 90, cooling_fan: 50, speed_min: 30, speed_max: 60 },
  ABS:  { density: 1.04, temp_nozzle_min: 230, temp_nozzle_max: 260, temp_bed_min: 90, temp_bed_max: 110, cooling_fan: 0, speed_min: 30, speed_max: 60 },
  ASA:  { density: 1.07, temp_nozzle_min: 240, temp_nozzle_max: 270, temp_bed_min: 95, temp_bed_max: 110, cooling_fan: 0, speed_min: 30, speed_max: 50 },
  TPU:  { density: 1.21, temp_nozzle_min: 210, temp_nozzle_max: 240, temp_bed_min: 40, temp_bed_max: 60, cooling_fan: 50, speed_min: 15, speed_max: 35 },
  PC:   { density: 1.20, temp_nozzle_min: 260, temp_nozzle_max: 310, temp_bed_min: 100, temp_bed_max: 120, cooling_fan: 0, speed_min: 20, speed_max: 50 },
  PA:   { density: 1.14, temp_nozzle_min: 240, temp_nozzle_max: 270, temp_bed_min: 70, temp_bed_max: 90, cooling_fan: 30, speed_min: 25, speed_max: 50 },
  HIPS: { density: 1.05, temp_nozzle_min: 220, temp_nozzle_max: 250, temp_bed_min: 90, temp_bed_max: 110, cooling_fan: 50, speed_min: 30, speed_max: 60 },
  PVA:  { density: 1.23, temp_nozzle_min: 185, temp_nozzle_max: 210, temp_bed_min: 45, temp_bed_max: 60, cooling_fan: 100, speed_min: 20, speed_max: 40 },
};

function getMaterialDefaults(type) {
  return MATERIAL_TYPE_DEFAULTS[type] || { density: 1.0, temp_nozzle_min: 200, temp_nozzle_max: 250, temp_bed_min: 50, temp_bed_max: 80, cooling_fan: 50, speed_min: 30, speed_max: 60 };
}

const DEFAULT_WHITE_COLOR = { name: 'White', hex: '#FFFFFF' };

function createDefaultWhiteColor(stableId) {
  return {
    id: stableId || createStableId('clr'),
    name: DEFAULT_WHITE_COLOR.name,
    hex: DEFAULT_WHITE_COLOR.hex,
    price_per_gram: null,
  };
}

function buildMaterialPrices(materials) {
  // Derived map for compatibility: { [materialKey]: pricePerGram }
  const materialPrices = {};
  (materials || []).forEach((mat) => {
    if (mat?.enabled && mat?.key) {
      const key = String(mat.key).toLowerCase();
      materialPrices[key] = clampMin0(mat.price_per_gram);
    }
  });
  return materialPrices;
}

function materialPricesToMaterialsV3(materialPrices) {
  const out = [];
  if (!materialPrices || typeof materialPrices !== 'object') return out;
  Object.entries(materialPrices).forEach(([key, price]) => {
    const k = slugifyMaterialKey(key);
    if (!k) return;
    const matId = createStableId('mat');
    out.push({
      id: matId,
      key: k,
      name: String(key).replace(/_/g, ' ').toUpperCase(),
      enabled: true,
      price_per_gram: clampMin0(price),
      colors: [createDefaultWhiteColor(`clr-${matId}-white`)],
    });
  });
  return out;
}

function formatCzk(n) {
  const x = safeNum(n, 0);
  // keep simple formatting for UI consistency
  return `${x.toFixed(2)} Kč`;
}

function roundToStep(value, step, mode) {
  const v = safeNum(value, 0);
  const s = Math.max(1, safeNum(step, 1));
  if (mode === 'up') return Math.ceil(v / s) * s;
  return Math.round(v / s) * s;
}

function calcPricingPreview(rules, preview) {
  const r = { ...DEFAULT_RULES, ...rules };
  const p = { ...DEFAULT_PREVIEW, ...preview };

  const material = clampMin0(p.weight_g) * clampMin0(p.material_price_per_g);

  const billedMinutes = r.min_billed_minutes_enabled
    ? Math.max(clampMin0(p.time_min), clampMin0(r.min_billed_minutes_value))
    : clampMin0(p.time_min);

  const time = (billedMinutes / 60) * clampMin0(r.rate_per_hour);

  const fees = clampMin0(p.fees_total);

  // base -> fees
  let perModel = material + time + fees;

  // -> markup
  let markup = 0;
  if (r.markup_enabled) {
    if (r.markup_mode === 'flat') {
      markup = clampMin0(r.markup_value);
      perModel += markup;
    } else if (r.markup_mode === 'percent') {
      markup = (perModel * clampMin0(r.markup_value)) / 100;
      perModel += markup;
    } else if (r.markup_mode === 'min_flat') {
      // "Minimum price after base+fees+time": if perModel is below markup_value, bump it to that value
      const minTarget = clampMin0(r.markup_value);
      if (perModel < minTarget) {
        markup = minTarget - perModel;
        perModel = minTarget;
      }
    }
  }

  // -> minima
  let minPerModelApplied = false;
  if (r.min_price_per_model_enabled) {
    const minModel = clampMin0(r.min_price_per_model_value);
    if (perModel < minModel) {
      perModel = minModel;
      minPerModelApplied = true;
    }
  }

  const qty = Math.max(1, Math.floor(clampMin0(p.quantity)));

  // smart_rounding: if disabled, round per-model BEFORE multiplying by qty
  let perModelRounded = perModel;
  let roundingAppliedPerModel = false;
  if (r.rounding_enabled && !r.smart_rounding_enabled) {
    const rounded = roundToStep(perModel, r.rounding_step, r.rounding_mode);
    roundingAppliedPerModel = rounded !== perModel;
    perModelRounded = rounded;
  }

  let total = perModelRounded * qty;

  // min order (after sum)
  let minOrderApplied = false;
  if (r.min_order_total_enabled) {
    const minOrder = clampMin0(r.min_order_total_value);
    if (total < minOrder) {
      total = minOrder;
      minOrderApplied = true;
    }
  }

  // rounding (final) - always applied at the end if rounding enabled
  let totalRounded = total;
  let roundingAppliedFinal = false;
  if (r.rounding_enabled) {
    const rounded = roundToStep(total, r.rounding_step, r.rounding_mode);
    roundingAppliedFinal = rounded !== total;
    totalRounded = rounded;
  }

  return {
    material,
    time,
    billedMinutes,
    fees,
    basePlusFees: material + time + fees,
    markup,
    perModel,
    perModelRounded,
    qty,
    totalBeforeFinalRounding: total,
    total: totalRounded,
    flags: {
      min_price_per_model_applied: minPerModelApplied,
      min_order_total_applied: minOrderApplied,
      rounding_per_model_applied: roundingAppliedPerModel,
      rounding_final_applied: roundingAppliedFinal,
    },
  };
}

const AdminPricing = () => {
  const { t, language } = useLanguage();
  const cs = language === 'cs';
  const { copyToClipboard: copyText } = useCopyToClipboard();
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  // Tenant-scoped V3 storage is the single source of truth.

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Materials (existing feature)
  const [materials, setMaterials] = useState([]);
  // Default material (key). Saved in V3 config so other parts (widget/calc) have a stable default.
  const [defaultMaterialKey, setDefaultMaterialKey] = useState('pla');
  // Advanced rules + time rate
  const [rules, setRules] = useState(deepClone(DEFAULT_RULES));
  // S05: Volume discounts
  const [volumeDiscounts, setVolumeDiscounts] = useState({
    enabled: false, mode: 'percent', scope: 'per_model', tiers: [],
  });
  // Preview panel state
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [preview, setPreview] = useState(deepClone(DEFAULT_PREVIEW));

  // Tab navigation
  const [activeTab, setActiveTab] = useState('materials');
  // Time unit toggle (hour vs minute) — display only, stored value is always rate_per_hour
  const [timeUnit, setTimeUnit] = useState('hour');

  // UI state
  const [banner, setBanner] = useState(null); // { type: 'info'|'error'|'success', text: string }
  const [savedSnapshot, setSavedSnapshot] = useState(''); // JSON snapshot
  const [touched, setTouched] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState(null); // null = closed, number = index
  const [dialogDraft, setDialogDraft] = useState(null); // deep copy of material being edited
  // Material enhancements
  const [materialSort, setMaterialSort] = useState('name'); // 'name' | 'type' | 'price' | 'status'
  const [materialSortDir, setMaterialSortDir] = useState('asc'); // 'asc' | 'desc'
  const [compareIds, setCompareIds] = useState([]); // max 3 material ids for comparison
  const [showPropsFor, setShowPropsFor] = useState({}); // { [materialId]: boolean } — expanded cards
  const [costCalc, setCostCalc] = useState({ spool_weight_kg: 1, spool_price: 600 });

  // Collapsible card sections (UI-only, non-tenant localStorage)
  const [collapsedSections, setCollapsedSections] = useState(() => loadCollapsedState());
  const toggleSection = useCallback((sectionId) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  // Quick test floating panel
  const [quickTestOpen, setQuickTestOpen] = useState(false);

  const ui = useMemo(() => {
    return {
      title: t('admin.pricing.title', 'Pricing'),
      subtitle: t('admin.pricing.subtitle', 'Configure time rate, minimums, rounding, markup and materials (including colors). Saved per-tenant in V3 storage.'),
      save: t('admin.pricing.save', 'Save changes'),
      saved: t('admin.pricing.saved', 'Saved'),
      unsaved: t('admin.pricing.unsaved', 'Unsaved changes'),
      reset: t('admin.pricing.reset', 'Reset to defaults'),
      export: t('admin.pricing.export', 'Export JSON'),
      import: t('admin.pricing.import', 'Import JSON'),
      copyOk: t('admin.pricing.copyOk', 'Copied to clipboard.'),
      copyFail: t('admin.pricing.copyFail', 'Copy failed – copy manually from the dialog.'),
      loadOk: t('admin.pricing.loadOk', 'Configuration loaded.'),
      saveOk: t('admin.pricing.saveOk', 'Saved.'),
      saveError: t('admin.pricing.saveError', 'Save failed.'),
      exportOk: t('admin.pricing.exportOk', 'JSON copied to clipboard.'),
      importOk: t('admin.pricing.importOk', "Configuration imported (don't forget to save)."),
      resetOk: t('admin.pricing.resetOk', "Reset to defaults (don't forget to save)."),
      invalid: t('admin.pricing.invalid', 'Fix validation errors (values must be ≥ 0).'),
      preview: t('admin.pricing.preview', 'Pricing sandbox'),
      previewToggle: t('admin.pricing.previewToggle', 'Test with example'),
    };
  }, [t, language]);

  // Pricing summary bar data
  const pricingSummary = useMemo(() => {
    const baseRate = clampMin0(rules.rate_per_hour);
    let avgMarkup = '---';
    if (rules.markup_enabled) {
      if (rules.markup_mode === 'percent') avgMarkup = `${clampMin0(rules.markup_value)}%`;
      else if (rules.markup_mode === 'flat') avgMarkup = `+${clampMin0(rules.markup_value)} Kč`;
      else if (rules.markup_mode === 'min_flat') avgMarkup = `min ${clampMin0(rules.markup_value)} Kč`;
    }
    const minOrder = rules.min_order_total_enabled ? `${clampMin0(rules.min_order_total_value)} Kč` : '---';
    let rounding = '---';
    if (rules.rounding_enabled) {
      const dir = rules.rounding_mode === 'up' ? (language === 'cs' ? 'nahoru' : 'up') : (language === 'cs' ? 'nejblizsi' : 'nearest');
      rounding = `${rules.rounding_step} (${dir})`;
    }
    const matCount = materials.filter(m => m?.enabled).length;
    return { baseRate, avgMarkup, minOrder, rounding, matCount };
  }, [rules, materials, language]);

  // CollapsibleCard helper component
  const CollapsibleCard = useCallback(({ id, title, description, headerRight, children, className = '' }) => {
    const isCollapsed = !!collapsedSections[id];
    return (
      <div className={`admin-card ${className}`}>
        <div
          className="card-header card-header--collapsible"
          onClick={() => toggleSection(id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(id); } }}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Icon name="ChevronRight" size={16} className={`collapse-chevron ${isCollapsed ? '' : 'expanded'}`} />
            <div>
              <h2>{title}</h2>
              {description && <p className="card-description">{description}</p>}
            </div>
          </div>
          {headerRight && <div onClick={e => e.stopPropagation()}>{headerRight}</div>}
        </div>
        {!isCollapsed && children}
      </div>
    );
  }, [collapsedSections, toggleSection]);

  const setRule = (key, value) => {
    setRules((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const setPreviewField = (key, value) => {
    setPreview((prev) => ({ ...prev, [key]: value }));
  };

  const createDefaultMaterial = () => ({
    id: 'mat-pla',
    key: 'pla',
    name: 'PLA',
    type: 'PLA',
    enabled: true,
    price_per_gram: 0.6,
    density: 1.24,
    temp_nozzle_min: 190,
    temp_nozzle_max: 220,
    temp_bed_min: 50,
    temp_bed_max: 65,
    cooling_fan: 100,
    speed_min: 40,
    speed_max: 80,
    colors: [createDefaultWhiteColor()],
  });

  const ensureAtLeastOneMaterial = (list) => {
    const arr = Array.isArray(list) ? list.filter(Boolean) : [];
    return arr.length > 0 ? arr : [createDefaultMaterial()];
  };

  const [colorDrafts, setColorDrafts] = useState({}); // { [materialId]: { name, hex } }
  const colorHexRafRef = useRef(new Map()); // key => { raf, hex }

  const addMaterial = (baseMat = null) => {
    const defaults = getMaterialDefaults('PLA');
    const newMat = baseMat ? {
      ...deepClone(baseMat),
      id: createStableId('mat'),
      key: baseMat.key ? ensureUniqueMaterialKey(baseMat.key, materials) : '',
      name: baseMat.name ? `${baseMat.name} (kopie)` : '',
      colors: (Array.isArray(baseMat.colors) ? baseMat.colors : [createDefaultWhiteColor()]).map(c => ({ ...c, id: createStableId('clr') })),
    } : {
      id: createStableId('mat'),
      key: '',
      name: '',
      type: 'PLA',
      enabled: true,
      price_per_gram: 0,
      density: defaults.density,
      temp_nozzle_min: defaults.temp_nozzle_min,
      temp_nozzle_max: defaults.temp_nozzle_max,
      temp_bed_min: defaults.temp_bed_min,
      temp_bed_max: defaults.temp_bed_max,
      cooling_fan: defaults.cooling_fan,
      speed_min: defaults.speed_min,
      speed_max: defaults.speed_max,
      colors: [createDefaultWhiteColor()],
    };
    setMaterials((prev) => {
      const next = [...prev, newMat];
      // Auto-open dialog for the new material
      setTimeout(() => {
        setEditingMaterialIndex(next.length - 1);
        setDialogDraft(deepClone(newMat));
      }, 0);
      return next;
    });
    setTouched(true);
  };

  const updateMaterial = (index, field, value) => {
    const currentMat = materials[index];
    const currentKey = String(currentMat?.key || '').toLowerCase();
    const defKey = String(defaultMaterialKey || '').toLowerCase();

    setMaterials((prev) =>
      prev.map((mat, i) => {
        if (i !== index) return mat;
        const next = { ...mat, [field]: value };

        // Ensure colors array exists
        if (!Array.isArray(next.colors)) next.colors = [];

        // Auto-generate key ONLY if it's currently empty (stable afterwards)
        if (field === 'name') {
          if (!String(mat.key || '').trim()) {
            const slug = slugifyMaterialKey(value);
            if (slug) next.key = ensureUniqueMaterialKey(slug, prev, mat.id);
          }
        }

        if (field === 'key') {
          const slug = slugifyMaterialKey(value);
          next.key = slug;
        }

        if (field === 'price_per_gram') {
          next.price_per_gram = safeNum(value, 0);
        }

        return next;
      })
    );

    // Keep default material pointing to the same material where possible
    if (field === 'key' && currentKey && currentKey === defKey) {
      const slug = slugifyMaterialKey(value);
      if (slug) setDefaultMaterialKey(slug);
    }
    if (field === 'enabled' && currentKey && currentKey === defKey && value === false) {
      // If default got disabled, try to move default to another enabled material.
      const fallback = materials.find((m, i) => i !== index && m?.enabled && String(m?.key || '').trim());
      if (fallback?.key) setDefaultMaterialKey(String(fallback.key).toLowerCase());
    }

    setTouched(true);
  };

  const deleteMaterial = (index) => {
    const deletingKey = String(materials[index]?.key || '').toLowerCase();
    const defKey = String(defaultMaterialKey || '').toLowerCase();
    const remaining = materials.filter((_, i) => i !== index);

    setMaterials((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });

    if (materials.length > 1 && deletingKey && deletingKey === defKey) {
      const nextDefault =
        remaining.find((m) => m?.enabled && String(m?.key || '').trim())?.key ||
        remaining.find((m) => String(m?.key || '').trim())?.key ||
        'pla';
      setDefaultMaterialKey(String(nextDefault).toLowerCase());
    }
    setTouched(true);
  };

  const setColorDraft = (materialId, fieldOrPatch, maybeValue) => {
    // Support both: setColorDraft(id, { name, hex }) and setColorDraft(id, 'name', value)
    const patch =
      typeof fieldOrPatch === 'string'
        ? { [fieldOrPatch]: maybeValue }
        : fieldOrPatch && typeof fieldOrPatch === 'object'
          ? fieldOrPatch
          : {};
    setColorDrafts((prev) => {
      const current = prev[materialId] || { name: '', hex: '#FFFFFF' };
      return { ...prev, [materialId]: { ...current, ...patch } };
    });
  };

  const addColorToMaterial = (materialIndex) => {
    const mat = materials[materialIndex];
    if (!mat) return;
    const draft = colorDrafts[mat.id] || { name: '', hex: '#FFFFFF' };
    const name = String(draft.name || '').trim();
    const hex = normalizeHex(draft.hex);
    if (!name || !isValidHex(hex)) {
      setBanner({
        type: 'error',
        text: language === 'cs' ? 'Barva musí mít název a platný HEX (#RRGGBB).' : 'Color must have a name and valid HEX (#RRGGBB).',
      });
      return;
    }

    setMaterials((prev) =>
      prev.map((m, i) => {
        if (i !== materialIndex) return m;
        const colors = Array.isArray(m.colors) ? m.colors : [];
        return {
          ...m,
          colors: [...colors, { id: createStableId('clr'), name, hex }],
        };
      })
    );

    setColorDrafts((prev) => ({ ...prev, [mat.id]: { name: '', hex: '#FFFFFF' } }));
    setTouched(true);
  };

  const applyColorPatch = (materialIndex, colorId, patch) => {
    setMaterials((prev) => {
      const mat = prev[materialIndex];
      if (!mat) return prev;

      const colors = Array.isArray(mat.colors) ? mat.colors : [];
      const idx = colors.findIndex((c) => c.id === colorId);
      if (idx === -1) return prev;

      const next = [...prev];
      const nextMat = { ...mat };
      const nextColors = [...colors];
      nextColors[idx] = { ...nextColors[idx], ...patch };
      nextMat.colors = nextColors;
      next[materialIndex] = nextMat;
      return next;
    });
  };

  const scheduleColorHexUpdate = (materialIndex, colorId, rawHex) => {
    const hex = normalizeHex(rawHex);
    const key = `${materialIndex}:${colorId}`;
    const map = colorHexRafRef.current;
    const entry = map.get(key) || { raf: 0, hex: '' };

    entry.hex = hex;
    if (entry.raf) {
      map.set(key, entry);
      return;
    }

    entry.raf = requestAnimationFrame(() => {
      const latest = map.get(key);
      if (!latest) return;
      const hexToApply = latest.hex;
      map.delete(key);

      applyColorPatch(materialIndex, colorId, { hex: hexToApply });
      setTouched(true);
    });

    map.set(key, entry);
  };

  const updateColorInMaterial = (materialIndex, colorId, field, value) => {
    if (field === 'hex') {
      applyColorPatch(materialIndex, colorId, { hex: normalizeHex(value) });
      setTouched(true);
      return;
    }
    if (field === 'name') {
      applyColorPatch(materialIndex, colorId, { name: value });
      setTouched(true);
      return;
    }

    applyColorPatch(materialIndex, colorId, { [field]: value });
    setTouched(true);
  };

  const deleteColorFromMaterial = (materialIndex, colorId) => {
    let blocked = false;

    setMaterials((prev) => {
      const mat = prev[materialIndex];
      if (!mat) return prev;
      const colors = Array.isArray(mat.colors) ? mat.colors : [];
      if (colors.length <= 1) {
        blocked = true;
        return prev;
      }

      const next = [...prev];
      const nextMat = { ...mat, colors: colors.filter((c) => c.id !== colorId) };
      next[materialIndex] = nextMat;
      return next;
    });

    if (blocked) {
      setBanner({
        type: 'info',
        text:
          language === 'cs'
            ? 'Každý materiál musí mít alespoň 1 barvu — poslední barvu nelze smazat.'
            : 'Each material must have at least 1 color — you cannot delete the last color.',
      });
      return;
    }

    setTouched(true);
  };

  // Backwards-friendly aliases for JSX handlers
  const addMaterialColor = addColorToMaterial;
  const updateMaterialColor = updateColorInMaterial;
  const deleteMaterialColor = deleteColorFromMaterial;

  // --- Dialog open/close/save handlers ---
  const openMaterialDialog = (index) => {
    setEditingMaterialIndex(index);
    setDialogDraft(deepClone(materials[index]));
  };

  const closeMaterialDialog = () => {
    setEditingMaterialIndex(null);
    setDialogDraft(null);
  };

  const saveMaterialDialog = () => {
    if (dialogDraft == null || editingMaterialIndex == null) return;
    // Normalize all numeric fields before saving (in case user didn't blur)
    const normalized = {
      ...dialogDraft,
      price_per_gram: finalizeDecimal(dialogDraft.price_per_gram, 0),
      density: finalizeDecimal(dialogDraft.density, 1.0),
      temp_nozzle_min: finalizeDecimal(dialogDraft.temp_nozzle_min, 0),
      temp_nozzle_max: finalizeDecimal(dialogDraft.temp_nozzle_max, 0),
      temp_bed_min: finalizeDecimal(dialogDraft.temp_bed_min, 0),
      temp_bed_max: finalizeDecimal(dialogDraft.temp_bed_max, 0),
      cooling_fan: finalizeDecimal(dialogDraft.cooling_fan, 0),
      speed_min: finalizeDecimal(dialogDraft.speed_min, 0),
      speed_max: finalizeDecimal(dialogDraft.speed_max, 0),
    };
    setMaterials(prev => prev.map((m, i) => i === editingMaterialIndex ? normalized : m));
    setTouched(true);
    closeMaterialDialog();
  };

  // Dialog-local handlers that operate on dialogDraft instead of materials
  const updateDialogDraft = (field, value) => {
    setDialogDraft(prev => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (!Array.isArray(next.colors)) next.colors = [];
      if (field === 'name' && !String(prev.key || '').trim()) {
        const slug = slugifyMaterialKey(value);
        if (slug) next.key = ensureUniqueMaterialKey(slug, materials, prev.id);
      }
      if (field === 'key') next.key = slugifyMaterialKey(value);
      // price_per_gram and density: store raw value during editing (string with comma/dot allowed).
      // Conversion to number happens on blur (finalizeDecimal) and on save (saveMaterialDialog).
      // No conversion here — otherwise trailing comma/dot gets stripped immediately.
      // When type changes, auto-fill properties if they haven't been customized
      if (field === 'type') {
        const defaults = getMaterialDefaults(value);
        const prevDefaults = getMaterialDefaults(prev.type);
        // Only auto-fill if current value matches previous type's default (not customized)
        if (safeNum(prev.density, 0) === safeNum(prevDefaults.density, 0) || !prev.density) next.density = defaults.density;
        if (safeNum(prev.temp_nozzle_min, 0) === safeNum(prevDefaults.temp_nozzle_min, 0) || !prev.temp_nozzle_min) next.temp_nozzle_min = defaults.temp_nozzle_min;
        if (safeNum(prev.temp_nozzle_max, 0) === safeNum(prevDefaults.temp_nozzle_max, 0) || !prev.temp_nozzle_max) next.temp_nozzle_max = defaults.temp_nozzle_max;
        if (safeNum(prev.temp_bed_min, 0) === safeNum(prevDefaults.temp_bed_min, 0) || !prev.temp_bed_min) next.temp_bed_min = defaults.temp_bed_min;
        if (safeNum(prev.temp_bed_max, 0) === safeNum(prevDefaults.temp_bed_max, 0) || !prev.temp_bed_max) next.temp_bed_max = defaults.temp_bed_max;
        if (safeNum(prev.cooling_fan, -1) === safeNum(prevDefaults.cooling_fan, -1) || prev.cooling_fan == null) next.cooling_fan = defaults.cooling_fan;
        if (safeNum(prev.speed_min, 0) === safeNum(prevDefaults.speed_min, 0) || !prev.speed_min) next.speed_min = defaults.speed_min;
        if (safeNum(prev.speed_max, 0) === safeNum(prevDefaults.speed_max, 0) || !prev.speed_max) next.speed_max = defaults.speed_max;
      }
      return next;
    });
  };

  const addColorToDialog = (name, hex) => {
    if (!name || !isValidHex(hex)) return false;
    setDialogDraft(prev => {
      if (!prev) return prev;
      const colors = Array.isArray(prev.colors) ? prev.colors : [];
      return { ...prev, colors: [...colors, { id: createStableId('clr'), name, hex, price_per_gram: null }] };
    });
    return true;
  };

  const updateDialogColor = (colorId, field, value) => {
    setDialogDraft(prev => {
      if (!prev) return prev;
      const colors = Array.isArray(prev.colors) ? prev.colors : [];
      return {
        ...prev,
        colors: colors.map(c => c.id === colorId ? { ...c, [field]: field === 'hex' ? normalizeHex(value) : value } : c),
      };
    });
  };

  const deleteDialogColor = (colorId) => {
    setDialogDraft(prev => {
      if (!prev) return prev;
      const colors = Array.isArray(prev.colors) ? prev.colors : [];
      if (colors.length <= 1) return prev;
      return { ...prev, colors: colors.filter(c => c.id !== colorId) };
    });
  };

  const currentConfigFull = useMemo(() => {
    const normalizedMaterials = ensureAtLeastOneMaterial(materials).map((m) => ({
      ...m,
      key: String(m.key || '').toLowerCase(),
      price_per_gram: clampMin0(m.price_per_gram),
      colors: Array.isArray(m.colors) && m.colors.length > 0
        ? m.colors.map((c) => ({
            id: c.id,
            name: String(c.name || '').trim(),
            hex: normalizeHex(c.hex),
            price_per_gram: c.price_per_gram != null ? clampMin0(c.price_per_gram) : null,
          }))
        : [createDefaultWhiteColor(`clr-${m.id}-white`)],
    }));

    const materialPrices = buildMaterialPrices(normalizedMaterials);

    const validKeys = new Set(normalizedMaterials.map((m) => String(m?.key || '').toLowerCase()).filter(Boolean));
    let defKey = String(defaultMaterialKey || '').toLowerCase();
    if (!defKey || !validKeys.has(defKey)) {
      defKey =
        normalizedMaterials.find((m) => m?.enabled && String(m?.key || '').trim())?.key ||
        normalizedMaterials.find((m) => String(m?.key || '').trim())?.key ||
        'pla';
    }

    return {
      // Source of truth (V3)
      materials: normalizedMaterials,

      // Default material key
      default_material_key: defKey,

      // Compatibility derived map
      materialPrices,

      // Keep legacy compatibility fields used by other parts of the demo
      timeRate: clampMin0(rules.rate_per_hour),
      tenant_pricing: { ...rules },

      // S05: Volume discounts
      volume_discounts: volumeDiscounts,

      updated_at: new Date().toISOString(),
    };
  }, [materials, rules, defaultMaterialKey, volumeDiscounts]);

  const dirty = useMemo(() => {
    if (!savedSnapshot) return touched;
    try {
      const snap = JSON.parse(savedSnapshot);
      const now = currentConfigFull;
      // Compare relevant fields only (ignore updated_at)
      const a = JSON.stringify({ ...snap, updated_at: undefined });
      const b = JSON.stringify({ ...now, updated_at: undefined });
      return a !== b;
    } catch {
      return touched;
    }
  }, [savedSnapshot, currentConfigFull, touched]);

  const materialIssues = useMemo(() => {
    const mats = Array.isArray(materials) ? materials : [];
    const keyCounts = {};
    mats.forEach((m) => {
      const k = String(m?.key || '').toLowerCase();
      if (!k) return;
      keyCounts[k] = (keyCounts[k] || 0) + 1;
    });

    const byMaterialId = {};
    let hasAny = false;

    mats.forEach((m) => {
      const id = m?.id;
      if (!id) return;
      const name = String(m?.name || '').trim();
      const key = String(m?.key || '').trim();
      const keyLower = key.toLowerCase();
      const colors = Array.isArray(m?.colors) ? m.colors : [];

      const issues = {
        nameMissing: !name,
        keyMissing: !key,
        keyInvalid: !!key && !isValidMaterialKey(keyLower),
        keyDuplicate: !!key && (keyCounts[keyLower] || 0) > 1,
        priceInvalid: safeNum(m?.price_per_gram, 0) < 0,
        colors: {}, // { [colorId]: { nameMissing, hexInvalid } }
      };

      colors.forEach((c) => {
        const cid = c?.id;
        if (!cid) return;
        const cname = String(c?.name || '').trim();
        const chex = String(c?.hex || '').trim();
        issues.colors[cid] = {
          nameMissing: !cname,
          hexInvalid: !isValidHex(chex),
        };
      });

      const hasColorIssue = Object.values(issues.colors).some((x) => x.nameMissing || x.hexInvalid);
      const hasMaterialIssue =
        issues.nameMissing ||
        issues.keyMissing ||
        issues.keyInvalid ||
        issues.keyDuplicate ||
        issues.priceInvalid ||
        hasColorIssue;

      if (hasMaterialIssue) hasAny = true;
      byMaterialId[id] = issues;
    });

    // Must always have at least one material
    if (mats.length === 0) {
      hasAny = true;
    }

    return { byMaterialId, hasAny };
  }, [materials]);

  const validationErrors = useMemo(() => {
    const errs = [];

    const mustBeMin0 = [
      ['rate_per_hour', rules.rate_per_hour],
      ['min_billed_minutes_value', rules.min_billed_minutes_value],
      ['min_price_per_model_value', rules.min_price_per_model_value],
      ['min_order_total_value', rules.min_order_total_value],
      ['markup_value', rules.markup_value],
    ];
    mustBeMin0.forEach(([k, v]) => {
      if (safeNum(v, 0) < 0) errs.push(k);
    });

    if (![1, 5, 10, 50].includes(safeNum(rules.rounding_step, 5))) errs.push('rounding_step');
    if (!['nearest', 'up'].includes(rules.rounding_mode)) errs.push('rounding_mode');
    if (!['flat', 'percent', 'min_flat'].includes(rules.markup_mode)) errs.push('markup_mode');

    // Materials + colors
    if (materialIssues.hasAny) errs.push('materials');

    return errs;
  }, [rules, materialIssues]);

  const isValid = validationErrors.length === 0;

  const previewResult = useMemo(() => {
    return calcPricingPreview(rules, preview);
  }, [rules, preview]);

  const handleResetDefaults = () => {
    // Keep materials as-is (often already configured), reset advanced rules + preview.
    setRules(deepClone(DEFAULT_RULES));
    setPreview(deepClone(DEFAULT_PREVIEW));
    setTouched(true);
    setBanner({
      type: 'info',
      text: language === 'cs' ? 'Nastavení bylo resetováno na default.' : 'Settings reset to defaults.',
    });
  };

  const handleExport = async () => {
    const json = JSON.stringify(currentConfigFull, null, 2);
    const ok = await copyText(json);
    if (ok) {
      setBanner({ type: 'success', text: ui.copyOk });
    } else {
      window.prompt('Zkopíruj JSON:', json);
      setBanner({ type: 'error', text: ui.copyFail });
    }
  };

  const handleImport = () => {
    const raw = window.prompt(t('admin.pricing.importPrompt', 'Paste JSON configuration:'));
    if (!raw) return;
    try {
      const parsed = safeJsonParse(raw);

      // Sanitize: prevent prototype pollution and strip dangerous string values
      if (parsed && typeof parsed === 'object') {
        delete parsed.__proto__;
        delete parsed.constructor;
        if (Array.isArray(parsed.materials)) {
          parsed.materials.forEach((m) => {
            if (m && typeof m === 'object') {
              delete m.__proto__;
              if (m.name) m.name = String(m.name).slice(0, 100);
              if (m.color) m.color = String(m.color).replace(/[<>"'&]/g, '');
              if (Array.isArray(m.colors)) {
                m.colors.forEach((c) => {
                  if (c && typeof c === 'object') {
                    if (c.name) c.name = String(c.name).slice(0, 100);
                    if (c.hex) c.hex = String(c.hex).replace(/[^#0-9a-fA-F]/g, '').slice(0, 7);
                  }
                });
              }
            }
          });
        }
      }

      // Accept both new and older shapes.
      // Preferred V3: { materials[], tenant_pricing, ... }
      // Legacy: { materialPrices: {key: pricePerGram}, timeRate, tenant_pricing }
      const maybeMaterials = Array.isArray(parsed.materials)
        ? parsed.materials
        : Array.isArray(parsed?.config?.materials)
          ? parsed.config.materials
          : null;

      const materialPrices = parsed.materialPrices || parsed?.config?.materialPrices || {};
      const timeRate =
        parsed.timeRate ??
        parsed?.config?.timeRate ??
        parsed?.tenant_pricing?.rate_per_hour ??
        DEFAULT_RULES.rate_per_hour;
      const tenantPricing = parsed.tenant_pricing || {};

      let nextMaterials = [];
      if (Array.isArray(maybeMaterials) && maybeMaterials.length > 0) {
        nextMaterials = maybeMaterials;
      } else {
        nextMaterials = materialPricesToMaterialsV3(materialPrices);
      }

      // Normalize + ensure at least one material
      nextMaterials = ensureAtLeastOneMaterial(nextMaterials).map((m) => {
        const id = m?.id || createStableId('mat');
        const key = slugifyMaterialKey(m?.key || m?.name || '');
        const typeDefaults = getMaterialDefaults(m?.type || '');
        return {
          id,
          key: key,
          name: String(m?.name || '').trim(),
          type: m?.type || '',
          enabled: m?.enabled !== false,
          price_per_gram: clampBounded(m?.price_per_gram ?? m?.price ?? 0),
          density: clampBounded(m?.density, typeDefaults.density),
          temp_nozzle_min: clampBounded(m?.temp_nozzle_min, typeDefaults.temp_nozzle_min),
          temp_nozzle_max: clampBounded(m?.temp_nozzle_max, typeDefaults.temp_nozzle_max),
          temp_bed_min: clampBounded(m?.temp_bed_min, typeDefaults.temp_bed_min),
          temp_bed_max: clampBounded(m?.temp_bed_max, typeDefaults.temp_bed_max),
          cooling_fan: m?.cooling_fan != null ? clampBounded(m.cooling_fan, typeDefaults.cooling_fan) : typeDefaults.cooling_fan,
          speed_min: clampBounded(m?.speed_min, typeDefaults.speed_min),
          speed_max: clampBounded(m?.speed_max, typeDefaults.speed_max),
          colors: Array.isArray(m?.colors) && m.colors.length > 0
            ? m.colors.map((c) => ({
                id: c?.id || createStableId('clr'),
                name: String(c?.name || '').trim(),
                hex: normalizeHex(c?.hex),
                price_per_gram: c?.price_per_gram != null ? clampBounded(c.price_per_gram) : null,
              }))
            : [createDefaultWhiteColor(`clr-${id}-white`)],
        };
      });

      // Ensure unique keys after normalization
      const used = new Set();
      nextMaterials = nextMaterials.map((m) => {
        let k = String(m.key || '').toLowerCase();
        if (!k) k = ensureUniqueMaterialKey('material', nextMaterials, m.id);
        if (used.has(k)) k = ensureUniqueMaterialKey(k, nextMaterials, m.id);
        used.add(k);
        return { ...m, key: k };
      });

      // Default material key (persisted)
      const validKeys = new Set(nextMaterials.map((m) => String(m?.key || '').toLowerCase()).filter(Boolean));
      let defKey = String(parsed.default_material_key ?? parsed.defaultMaterialKey ?? parsed.default_material ?? '').toLowerCase();
      if (!defKey || !validKeys.has(defKey)) {
        defKey =
          nextMaterials.find((m) => m?.enabled && String(m?.key || '').trim())?.key ||
          nextMaterials.find((m) => String(m?.key || '').trim())?.key ||
          'pla';
      }

      setMaterials(nextMaterials);
      setDefaultMaterialKey(String(defKey).toLowerCase());

      // Clamp all numeric rule fields to [0, 999999] to prevent abuse via crafted JSON
      const clampedPricing = { ...tenantPricing };
      const NUMERIC_RULE_KEYS = [
        'rate_per_hour', 'min_billed_minutes_value', 'min_price_per_model_value',
        'min_order_total_value', 'rounding_step', 'markup_value',
      ];
      for (const k of NUMERIC_RULE_KEYS) {
        if (clampedPricing[k] != null) {
          clampedPricing[k] = clampBounded(clampedPricing[k]);
        }
      }

      setRules({
        ...deepClone(DEFAULT_RULES),
        ...clampedPricing,
        rate_per_hour: clampBounded(clampedPricing.rate_per_hour ?? timeRate),
      });
      setTouched(true);
      setBanner({ type: 'success', text: t('admin.pricing.importOk', "Configuration imported (don't forget to save).") });
    } catch (e) {
      setBanner({ type: 'error', text: t('admin.pricing.importInvalid', 'Invalid JSON.') });
    }
  };

  const handleSave = () => {
    if (!isValid) {
      setBanner({ type: 'error', text: ui.invalid });
      return;
    }

    try {
      setSaving(true);
      setBanner(null);

      // Single source of truth: tenant-scoped V3 storage
      savePricingConfigV3(currentConfigFull);

      const newSnap = JSON.stringify({ ...currentConfigFull, updated_at: undefined });
      setSavedSnapshot(newSnap);
      setTouched(false);

      setBanner({ type: 'success', text: ui.saveOk });

      addNotification({
        type: 'config',
        title: 'Cenova konfigurace ulozena',
        description: `Pricing V3 konfiguraci aktualizoval admin`,
      });
    } catch {
      setBanner({ type: 'error', text: ui.saveError });
    } finally {
      setSaving(false);
    }
  };

  // Load initial configuration
  useEffect(() => {
    let isMounted = true;

    const normalizeLoadedConfig = (raw) => {
      const cfg = raw && typeof raw === 'object' ? raw : {};

      // Prefer V3 materials[], fallback to legacy materialPrices
      let mats = [];
      if (Array.isArray(cfg.materials) && cfg.materials.length > 0) {
        mats = cfg.materials;
      } else if (cfg.materialPrices && typeof cfg.materialPrices === 'object') {
        mats = materialPricesToMaterialsV3(cfg.materialPrices);
      }

      mats = ensureAtLeastOneMaterial(mats).map((m) => {
        const id = m?.id || createStableId('mat');
        const key = slugifyMaterialKey(m?.key || m?.name || '');
        const typeDefaults = getMaterialDefaults(m?.type || '');
        return {
          id,
          key,
          name: String(m?.name || '').trim(),
          type: m?.type || '',
          enabled: m?.enabled !== false,
          price_per_gram: clampBounded(m?.price_per_gram ?? m?.price ?? 0),
          density: clampBounded(m?.density, typeDefaults.density),
          temp_nozzle_min: clampBounded(m?.temp_nozzle_min, typeDefaults.temp_nozzle_min),
          temp_nozzle_max: clampBounded(m?.temp_nozzle_max, typeDefaults.temp_nozzle_max),
          temp_bed_min: clampBounded(m?.temp_bed_min, typeDefaults.temp_bed_min),
          temp_bed_max: clampBounded(m?.temp_bed_max, typeDefaults.temp_bed_max),
          cooling_fan: m?.cooling_fan != null ? clampBounded(m.cooling_fan, typeDefaults.cooling_fan) : typeDefaults.cooling_fan,
          speed_min: clampBounded(m?.speed_min, typeDefaults.speed_min),
          speed_max: clampBounded(m?.speed_max, typeDefaults.speed_max),
          colors: Array.isArray(m?.colors) && m.colors.length > 0
            ? m.colors.map((c) => ({
                id: c?.id || createStableId('clr'),
                name: String(c?.name || '').trim(),
                hex: normalizeHex(c?.hex),
                price_per_gram: c?.price_per_gram != null ? clampBounded(c.price_per_gram) : null,
              }))
            : [createDefaultWhiteColor(`clr-${id}-white`)],
        };
      });

      // Unique keys
      const keyCounts = {};
      mats.forEach((m) => {
        const k = String(m.key || '').toLowerCase();
        if (!k) return;
        keyCounts[k] = (keyCounts[k] || 0) + 1;
      });
      mats = mats.map((m) => {
        let k = String(m.key || '').toLowerCase();
        if (!k) k = ensureUniqueMaterialKey('material', mats, m.id);
        if ((keyCounts[k] || 0) > 1) k = ensureUniqueMaterialKey(k, mats, m.id);
        return { ...m, key: k };
      });

      // Default material key (persisted)
      const validKeys = new Set(mats.map((m) => String(m?.key || '').toLowerCase()).filter(Boolean));
      let defKey = String(cfg.default_material_key ?? cfg.defaultMaterialKey ?? cfg.default_material ?? '').toLowerCase();
      if (!defKey || !validKeys.has(defKey)) {
        defKey =
          mats.find((m) => m?.enabled && String(m?.key || '').trim())?.key ||
          mats.find((m) => String(m?.key || '').trim())?.key ||
          'pla';
      }

      const tenantPricing = cfg.tenant_pricing || {};
      const timeRate = cfg.timeRate ?? tenantPricing.rate_per_hour ?? DEFAULT_RULES.rate_per_hour;

      const nextRules = {
        ...deepClone(DEFAULT_RULES),
        ...tenantPricing,
        rate_per_hour: clampMin0(tenantPricing.rate_per_hour ?? timeRate),
      };

      const normalized = {
        ...cfg,
        materials: mats,
        default_material_key: defKey,
        materialPrices: buildMaterialPrices(mats),
        timeRate: clampMin0(nextRules.rate_per_hour),
        tenant_pricing: { ...nextRules },
        updated_at: new Date().toISOString(),
      };

      return { mats, nextRules, normalized, defKey };
    };

    const load = () => {
      setLoading(true);
      setBanner(null);

      const loaded = loadPricingConfigV3();
      const { mats, nextRules, normalized, defKey } = normalizeLoadedConfig(loaded);

      if (!isMounted) return;
      setMaterials(mats);
      setRules(nextRules);
      setDefaultMaterialKey(String(defKey || 'pla').toLowerCase());
      // S05: load volume discounts
      if (loaded?.volume_discounts && typeof loaded.volume_discounts === 'object') {
        setVolumeDiscounts({
          enabled: !!loaded.volume_discounts.enabled,
          mode: loaded.volume_discounts.mode || 'percent',
          scope: loaded.volume_discounts.scope || 'per_model',
          tiers: Array.isArray(loaded.volume_discounts.tiers) ? loaded.volume_discounts.tiers : [],
        });
      }
      setPreview(deepClone(DEFAULT_PREVIEW));
      setSavedSnapshot(JSON.stringify({ ...normalized, updated_at: undefined }));
      setTouched(false);
      setLoading(false);

      // Ensure config exists (default material if needed) — guard: only if still mounted
      if (isMounted) savePricingConfigV3(normalized);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: material dropdown for preview
  const enabledMaterials = useMemo(() => {
    return materials.filter((m) => m?.enabled && m?.name?.trim());
  }, [materials]);

  // Sorted materials for grid display (preserves original indices)
  const sortedMaterialEntries = useMemo(() => {
    const entries = materials.map((m, i) => ({ mat: m, origIndex: i }));
    const dir = materialSortDir === 'asc' ? 1 : -1;
    entries.sort((a, b) => {
      switch (materialSort) {
        case 'type': {
          const ta = String(a.mat.type || '').toLowerCase();
          const tb = String(b.mat.type || '').toLowerCase();
          return ta < tb ? -dir : ta > tb ? dir : 0;
        }
        case 'price':
          return (safeNum(a.mat.price_per_gram, 0) - safeNum(b.mat.price_per_gram, 0)) * dir;
        case 'status': {
          const sa = a.mat.enabled ? 0 : 1;
          const sb = b.mat.enabled ? 0 : 1;
          return (sa - sb) * dir || (String(a.mat.name || '').localeCompare(String(b.mat.name || '')) * dir);
        }
        default: // name
          return String(a.mat.name || '').localeCompare(String(b.mat.name || '')) * dir;
      }
    });
    return entries;
  }, [materials, materialSort, materialSortDir]);

  const toggleMaterialSort = (field) => {
    if (materialSort === field) {
      setMaterialSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMaterialSort(field);
      setMaterialSortDir('asc');
    }
  };

  const toggleCompare = (matId) => {
    setCompareIds(prev => {
      if (prev.includes(matId)) return prev.filter(id => id !== matId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, matId];
    });
  };

  const setPreviewFromMaterial = (materialIndex) => {
    const mat = enabledMaterials[materialIndex];
    if (!mat) return;
    setPreviewField('material_price_per_g', clampMin0(mat.price_per_gram));
  };

  const ToggleRow = ({ checked, onChange, label, hint }) => {
    return (
      <div className="toggle-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ForgeCheckbox
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          label={label}
        />
        {hint ? (
          <span className="hint" title={hint}>
            <Icon name="Info" size={16} />
          </span>
        ) : null}
      </div>
    );
  };

  const FieldError = ({ show }) => {
    if (!show) return null;
    return <div className="field-error">{language === 'cs' ? 'Zadej hodnotu ≥ 0' : 'Enter value ≥ 0'}</div>;
  };

  const DialogAddColor = ({ language: lang, onAdd }) => {
    const [name, setName] = useState('');
    const [hex, setHex] = useState('#FFFFFF');

    const handleAdd = () => {
      if (!name.trim() || !isValidHex(hex)) return;
      const ok = onAdd(name.trim(), normalizeHex(hex));
      if (ok) { setName(''); setHex('#FFFFFF'); }
    };

    return (
      <div className="color-add" style={{ marginTop: 12 }}>
        <div className="muted" style={{ marginBottom: 8 }}>{lang === 'cs' ? 'Přidat novou barvu:' : 'Add a new color:'}</div>
        <div className="dialog-color-add-row">
          <input className="input" placeholder={lang === 'cs' ? 'Název nové barvy' : 'New color name'} value={name} onChange={(e) => setName(e.target.value)} />
          <input type="color" className="color-picker" value={isValidHex(hex) ? hex : '#FFFFFF'} onChange={(e) => setHex(normalizeHex(e.target.value))} />
          <input className="input mono" placeholder="#RRGGBB" value={hex} onChange={(e) => setHex(normalizeHex(e.target.value))} style={{ width: 100 }} />
          <button className="btn-secondary" onClick={handleAdd} disabled={!name.trim() || !isValidHex(hex)}>
            <Icon name="Plus" size={18} />
            {lang === 'cs' ? 'Přidat' : 'Add'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <SkeletonCard textLines={2} />
            <SkeletonCard textLines={2} />
            <SkeletonCard textLines={2} />
          </div>
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>{ui.title}</h1>
          <p className="subtitle">{ui.subtitle}</p>
        </div>

        <div className="header-actions">
          <div className={`status-pill ${dirty ? 'dirty' : 'clean'}`}>
            <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={16} />
            <span>{dirty ? ui.unsaved : ui.saved}</span>
          </div>

          <button className="btn-secondary" onClick={handleResetDefaults} disabled={saving}>
            <Icon name="RotateCcw" size={18} />
            {ui.reset}
          </button>

          <button className="btn-secondary" onClick={handleExport} disabled={saving}>
            <Icon name="Copy" size={18} />
            {ui.export}
          </button>

          <button className="btn-secondary" onClick={handleImport} disabled={saving}>
            <Icon name="Upload" size={18} />
            {ui.import}
          </button>

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!dirty || saving || !isValid}
            title={!isValid ? ui.invalid : ''}
          >
            <Icon name="Save" size={18} />
            {saving ? t('common.saving') : ui.save}
          </button>
        </div>
      </div>

      {banner ? (
        <div className={`banner ${banner.type}`}>
          <Icon
            name={banner.type === 'error' ? 'XCircle' : banner.type === 'success' ? 'CheckCircle2' : 'Info'}
            size={18}
          />
          <span>{banner.text}</span>
        </div>
      ) : null}

      {/* PRICING SUMMARY BAR */}
      <div className="pricing-summary-bar">
        <div className="psb-item">
          <span className="psb-label">{t('admin.pricing.summaryRate', 'Rate')} <ForgeHelpIcon text={getHelpText('pricing_rate_per_hour', language)} position="bottom" size={14} /></span>
          <span className="psb-value">{pricingSummary.baseRate} Kč/h</span>
        </div>
        <div className="psb-sep" />
        <div className="psb-item">
          <span className="psb-label">{t('admin.pricing.summaryMarkup', 'Markup')} <ForgeHelpIcon text={getHelpText('pricing_markup', language)} position="bottom" size={14} /></span>
          <span className="psb-value">{pricingSummary.avgMarkup}</span>
        </div>
        <div className="psb-sep" />
        <div className="psb-item">
          <span className="psb-label">{t('admin.pricing.summaryMinOrder', 'Min order')} <ForgeHelpIcon text={getHelpText('pricing_min_order_total', language)} position="bottom" size={14} /></span>
          <span className="psb-value">{pricingSummary.minOrder}</span>
        </div>
        <div className="psb-sep" />
        <div className="psb-item">
          <span className="psb-label">{t('admin.pricing.summaryRound', 'Round')} <ForgeHelpIcon text={getHelpText('pricing_rounding', language)} position="bottom" size={14} /></span>
          <span className="psb-value">{pricingSummary.rounding}</span>
        </div>
        <div className="psb-sep" />
        <div className="psb-item">
          <span className="psb-label">{t('admin.pricing.summaryMaterials', 'Materials')}</span>
          <span className="psb-value">{pricingSummary.matCount}</span>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="tab-bar">
        {PRICING_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{cs ? tab.label_cs : tab.label_en}</span>
          </button>
        ))}
      </div>

      <div className="tab-content-area">
          {/* TAB: MATERIALS */}
          {activeTab === 'materials' && (<>
          {/* Card: Materials */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{t('admin.pricing.materials')}</h2>
                <p className="card-description">
                  {cs
                    ? 'Nastav materialy, typ, hustotu, cenu a barvy. Klikni na material pro upravu.'
                    : 'Configure materials, type, density, price and colors. Click a material to edit.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {compareIds.length >= 2 && (
                  <button className="btn-secondary" onClick={() => { /* scroll to comparison */ const el = document.getElementById('mat-comparison'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                    <Icon name="GitCompare" size={16} />
                    {cs ? `Porovnat (${compareIds.length})` : `Compare (${compareIds.length})`}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => addMaterial()}>
                  <Icon name="Plus" size={18} />
                  {t('admin.pricing.addMaterial')}
                </button>
              </div>
            </div>

            {/* Sort controls */}
            {materials.length > 1 && (
              <div className="mat-sort-bar">
                <span className="mat-sort-label">{t('admin.pricing.sortLabel', 'Sort:')}</span>
                {[
                  { id: 'name', label: t('admin.pricing.sortName', 'Name') },
                  { id: 'type', label: t('admin.pricing.sortType', 'Type') },
                  { id: 'price', label: t('admin.pricing.sortPrice', 'Price') },
                  { id: 'status', label: t('admin.pricing.sortStatus', 'Status') },
                ].map(s => (
                  <button
                    key={s.id}
                    className={`mat-sort-btn ${materialSort === s.id ? 'active' : ''}`}
                    onClick={() => toggleMaterialSort(s.id)}
                  >
                    {s.label}
                    {materialSort === s.id && (
                      <Icon name={materialSortDir === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} />
                    )}
                  </button>
                ))}
                {compareIds.length > 0 && (
                  <button className="mat-sort-btn" onClick={() => setCompareIds([])} style={{ marginLeft: 'auto' }}>
                    <Icon name="X" size={12} />
                    {t('admin.pricing.clearSelection', 'Clear selection')}
                  </button>
                )}
              </div>
            )}

            {materials.length === 0 ? (
              <div className="empty-state">
                <Icon name="Package" size={48} />
                <h3>{t('admin.pricing.noMaterials', 'No materials configured')}</h3>
                <p>{t('admin.pricing.noMaterialsHint', 'Click "Add Material" to create your first material.')}</p>
              </div>
            ) : (
              <div className="materials-compact-grid">
                {sortedMaterialEntries.map(({ mat: material, origIndex: index }) => {
                  const matKeyLower = String(material.key || '').toLowerCase();
                  const isDefault = !!matKeyLower && matKeyLower === String(defaultMaterialKey || '').toLowerCase();
                  const issues = materialIssues.byMaterialId?.[material.id] || {};
                  const hasIssue = issues.nameMissing || issues.keyMissing || issues.keyInvalid || issues.keyDuplicate || issues.priceInvalid;
                  const colors = Array.isArray(material.colors) ? material.colors : [];
                  const pricePerKg = (clampMin0(material.price_per_gram) * 1000).toFixed(0);
                  const isComparing = compareIds.includes(material.id);
                  const isExpanded = !!showPropsFor[material.id];
                  const firstColorHex = colors.length > 0 && isValidHex(colors[0].hex) ? colors[0].hex : null;

                  return (
                    <div
                      key={material.id}
                      className={`material-compact-card ${hasIssue ? 'has-issue' : ''} ${isComparing ? 'comparing' : ''}`}
                    >
                      {/* Compare checkbox */}
                      <div className="mcc-compare-check" onClick={(e) => { e.stopPropagation(); toggleCompare(material.id); }}>
                        <input type="checkbox" checked={isComparing} readOnly tabIndex={-1} />
                      </div>

                      {/* Main clickable area */}
                      <div
                        className="mcc-body"
                        onClick={() => openMaterialDialog(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openMaterialDialog(index); }}
                      >
                        <div className="mcc-header">
                          <div className="mcc-name-row">
                            {firstColorHex && <span className="mcc-swatch" style={{ backgroundColor: firstColorHex }} />}
                            <div className="mcc-name">{material.name || t('admin.pricing.unnamed', '(unnamed)')}</div>
                          </div>
                          <div className="mcc-card-actions">
                            <button
                              className="icon-btn-sm"
                              title={t('admin.pricing.duplicate', 'Duplicate')}
                              onClick={(e) => { e.stopPropagation(); addMaterial(material); }}
                            >
                              <Icon name="Copy" size={13} />
                            </button>
                            <button
                              className="icon-btn-sm"
                              title={t('admin.pricing.delete', 'Delete')}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (materials.length <= 1) return;
                                const ok = await confirm({
                                  title: t('admin.pricing.deleteMaterial', 'Delete material'),
                                  message: t('admin.pricing.deleteMaterialConfirm', `Really delete material "${material.name}"?`),
                                });
                                if (!ok) return;
                                deleteMaterial(index);
                              }}
                              disabled={materials.length <= 1}
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                            <Icon name="Pencil" size={13} className="mcc-edit-icon" />
                          </div>
                        </div>
                        <div className="mcc-key">{material.key || '\u2014'}</div>
                        <div className="mcc-badges">
                          {material.type && <span className="mcc-badge type">{material.type}</span>}
                          {isDefault && <span className="mcc-badge default">{t('admin.pricing.badgeDefault', 'Default')}</span>}
                          <span className={`mcc-badge ${material.enabled ? 'active' : 'inactive'}`}>
                            {material.enabled ? t('admin.pricing.badgeActive', 'Active') : t('admin.pricing.badgeInactive', 'Inactive')}
                          </span>
                          {hasIssue && <span className="mcc-badge error">{t('admin.pricing.badgeError', 'Error')}</span>}
                        </div>
                        <div className="mcc-price-row">
                          <div className="mcc-price">
                            <span className="mcc-price-value">{clampMin0(material.price_per_gram)}</span>
                            <span className="mcc-price-unit">Kc/g</span>
                          </div>
                          <div className="mcc-price-secondary">
                            <span className="mcc-price-value-sm">{pricePerKg}</span>
                            <span className="mcc-price-unit">Kc/kg</span>
                          </div>
                        </div>
                        {material.density > 0 && (
                          <div className="mcc-density">
                            <Icon name="Droplets" size={11} />
                            <span>{cs ? 'Hustota' : 'Density'}: {material.density} g/cm³</span>
                          </div>
                        )}
                        <div className="mcc-colors">
                          {colors.slice(0, 6).map(c => (
                            <div key={c.id} className="mcc-color-chip">
                              <span className="mcc-color-dot" style={{ backgroundColor: isValidHex(c.hex) ? c.hex : '#888' }} />
                              <span className="mcc-color-name">{c.name || '?'}</span>
                            </div>
                          ))}
                          {colors.length > 6 && (
                            <span className="mcc-color-more">+{colors.length - 6}</span>
                          )}
                        </div>
                      </div>

                      {/* Expandable properties */}
                      <button
                        className="mcc-expand-btn"
                        onClick={(e) => { e.stopPropagation(); setShowPropsFor(prev => ({ ...prev, [material.id]: !prev[material.id] })); }}
                      >
                        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={13} />
                        <span>{t('admin.pricing.properties', 'Properties')}</span>
                      </button>
                      {isExpanded && (
                        <div className="mcc-props-grid">
                          <div className="mcc-prop"><span>{t('admin.pricing.propNozzle', 'Nozzle')}</span><strong>{material.temp_nozzle_min || '?'}-{material.temp_nozzle_max || '?'} °C</strong></div>
                          <div className="mcc-prop"><span>{t('admin.pricing.propBed', 'Bed')}</span><strong>{material.temp_bed_min || '?'}-{material.temp_bed_max || '?'} °C</strong></div>
                          <div className="mcc-prop"><span>{t('admin.pricing.propFan', 'Fan')}</span><strong>{material.cooling_fan != null ? `${material.cooling_fan}%` : '?'}</strong></div>
                          <div className="mcc-prop"><span>{t('admin.pricing.propSpeed', 'Speed')}</span><strong>{material.speed_min || '?'}-{material.speed_max || '?'} mm/s</strong></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Material Cost Calculator */}
          <CollapsibleCard
            id="mat_cost_calc"
            title={cs ? 'Kalkulacka ceny materialu' : 'Material cost calculator'}
            description={cs ? 'Spocitej cenu za gram z ceny civky.' : 'Calculate price per gram from spool price.'}
          >
            <div className="cost-calc-row">
              <div className="field" style={{ flex: 1 }}>
                <label>{cs ? 'Hmotnost civky' : 'Spool weight'}</label>
                <div className="input-with-unit">
                  <NumberStepper value={costCalc.spool_weight_kg} onChange={v => setCostCalc(p => ({ ...p, spool_weight_kg: v }))} min={0.1} step={0.25} />
                  <span className="unit">kg</span>
                </div>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>{cs ? 'Cena civky' : 'Spool price'}</label>
                <div className="input-with-unit">
                  <NumberStepper value={costCalc.spool_price} onChange={v => setCostCalc(p => ({ ...p, spool_price: v }))} min={0} step={50} />
                  <span className="unit">Kc</span>
                </div>
              </div>
              <div className="cost-calc-result">
                <div className="cost-calc-result-label">{cs ? 'Cena za gram' : 'Price per gram'}</div>
                <div className="cost-calc-result-value">
                  {costCalc.spool_weight_kg > 0
                    ? `${(costCalc.spool_price / (costCalc.spool_weight_kg * 1000)).toFixed(3)} Kc/g`
                    : '---'}
                </div>
                <div className="cost-calc-result-secondary">
                  {costCalc.spool_weight_kg > 0
                    ? `${(costCalc.spool_price / costCalc.spool_weight_kg).toFixed(0)} Kc/kg`
                    : ''}
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Material Comparison */}
          {compareIds.length >= 2 && (() => {
            const compareMats = compareIds.map(id => materials.find(m => m.id === id)).filter(Boolean);
            if (compareMats.length < 2) return null;
            return (
              <div id="mat-comparison" className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{cs ? 'Porovnani materialu' : 'Material comparison'}</h2>
                    <p className="card-description">{cs ? 'Porovnej vybrané materialy vedle sebe.' : 'Compare selected materials side by side.'}</p>
                  </div>
                  <button className="btn-secondary" onClick={() => setCompareIds([])}>
                    <Icon name="X" size={16} />
                    {cs ? 'Zavrit' : 'Close'}
                  </button>
                </div>
                <div className="mat-compare-table-wrap">
                  <table className="mat-compare-table">
                    <thead>
                      <tr>
                        <th>{cs ? 'Vlastnost' : 'Property'}</th>
                        {compareMats.map(m => (
                          <th key={m.id}>
                            <span className="mcc-swatch" style={{ backgroundColor: (m.colors?.[0]?.hex && isValidHex(m.colors[0].hex)) ? m.colors[0].hex : '#888', display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                            {m.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'type', label: cs ? 'Typ' : 'Type', fn: m => m.type || '---' },
                        { key: 'price', label: cs ? 'Cena/g' : 'Price/g', fn: m => `${clampMin0(m.price_per_gram)} Kc` },
                        { key: 'pricekg', label: cs ? 'Cena/kg' : 'Price/kg', fn: m => `${(clampMin0(m.price_per_gram) * 1000).toFixed(0)} Kc` },
                        { key: 'density', label: cs ? 'Hustota' : 'Density', fn: m => m.density ? `${m.density} g/cm³` : '---' },
                        { key: 'nozzle', label: cs ? 'Teplota trysky' : 'Nozzle temp', fn: m => (m.temp_nozzle_min && m.temp_nozzle_max) ? `${m.temp_nozzle_min}-${m.temp_nozzle_max} °C` : '---' },
                        { key: 'bed', label: cs ? 'Teplota podlozky' : 'Bed temp', fn: m => (m.temp_bed_min && m.temp_bed_max) ? `${m.temp_bed_min}-${m.temp_bed_max} °C` : '---' },
                        { key: 'fan', label: cs ? 'Chlazeni' : 'Cooling fan', fn: m => m.cooling_fan != null ? `${m.cooling_fan}%` : '---' },
                        { key: 'speed', label: cs ? 'Rychlost' : 'Speed', fn: m => (m.speed_min && m.speed_max) ? `${m.speed_min}-${m.speed_max} mm/s` : '---' },
                        { key: 'colors', label: cs ? 'Barvy' : 'Colors', fn: m => `${(m.colors || []).length}` },
                        { key: 'status', label: cs ? 'Stav' : 'Status', fn: m => m.enabled ? (cs ? 'Aktivni' : 'Active') : (cs ? 'Neaktivni' : 'Inactive') },
                      ].map(row => (
                        <tr key={row.key}>
                          <td className="mat-compare-label">{row.label}</td>
                          {compareMats.map(m => (
                            <td key={m.id}>{row.fn(m)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Material Edit Dialog */}
          <ForgeDialog
            open={editingMaterialIndex != null && dialogDraft != null}
            onClose={closeMaterialDialog}
            title={dialogDraft?.name || t('admin.pricing.newMaterial', 'New material')}
            maxWidth="56vw"
            footer={
              <>
                <button className="btn-secondary" onClick={closeMaterialDialog}>
                  {t('admin.pricing.cancel', 'Cancel')}
                </button>
                <button className="btn-primary" onClick={saveMaterialDialog}>
                  <Icon name="Save" size={16} />
                  {t('admin.pricing.saveChanges', 'Save changes')}
                </button>
              </>
            }
          >
            {dialogDraft && (() => {
              const mat = dialogDraft;
              const draftIssues = materialIssues.byMaterialId?.[mat.id] || {};
              const keyError = draftIssues.keyMissing || draftIssues.keyInvalid || draftIssues.keyDuplicate;
              const nameError = draftIssues.nameMissing;
              const priceError = draftIssues.priceInvalid;
              const draftColors = Array.isArray(mat.colors) ? mat.colors : [];

              return (
                <div className="dialog-material-form">
                  {/* Row 1: Name + Type */}
                  <div className="dialog-row-2">
                    <div className="field" style={{ flex: 2 }}>
                      <label>{t('admin.pricing.fieldMaterialName', 'Material name')}</label>
                      <input
                        className={`input ${nameError ? 'input-error' : ''}`}
                        placeholder={t('admin.pricing.fieldMaterialNamePlaceholder', 'Material name (e.g. PLA, ABS)')}
                        value={mat.name || ''}
                        onChange={(e) => updateDialogDraft('name', e.target.value)}
                      />
                      {nameError && <div className="field-error">{t('admin.pricing.errorNameRequired', 'Name is required')}</div>}
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>{t('admin.pricing.fieldMaterialType', 'Material type')}</label>
                      <select
                        className="select"
                        value={mat.type || ''}
                        onChange={(e) => updateDialogDraft('type', e.target.value)}
                      >
                        <option value="">{t('admin.pricing.selectType', '-- select type --')}</option>
                        {MATERIAL_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Key + Active + Price + Density */}
                  <div className="dialog-row-2">
                    <div className="field" style={{ flex: 1 }}>
                      <label>{t('admin.pricing.fieldKey', 'Key (slug)')}</label>
                      <input
                        className={`input ${keyError ? 'input-error' : ''}`}
                        placeholder={t('admin.pricing.fieldKeyPlaceholder', 'e.g. pla, petg_carbon')}
                        value={mat.key || ''}
                        onChange={(e) => updateDialogDraft('key', e.target.value)}
                      />
                      {draftIssues.keyMissing && <div className="field-error">{t('admin.pricing.errorKeyRequired', 'Key is required')}</div>}
                      {draftIssues.keyInvalid && <div className="field-error">{t('admin.pricing.errorKeyInvalid', 'Key may contain only a-z, 0-9 and underscores.')}</div>}
                      {draftIssues.keyDuplicate && <div className="field-error">{t('admin.pricing.errorKeyDuplicate', 'Key must be unique')}</div>}
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>{t('admin.pricing.fieldPricePerGram', 'Price per gram')} <ForgeHelpIcon text={getHelpText('pricing_material_price_per_gram', language)} size={14} /></label>
                      <div className="input-with-unit">
                        <input
                          type="text" inputMode="decimal"
                          className={`input ${priceError ? 'input-error' : ''}`}
                          value={mat.price_per_gram ?? ''}
                          onChange={(e) => updateDialogDraft('price_per_gram', parseDecimal(e.target.value))}
                          onBlur={() => updateDialogDraft('price_per_gram', finalizeDecimal(mat.price_per_gram, 0))}
                        />
                        <span className="unit">Kc/g</span>
                      </div>
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>{cs ? 'Hustota' : 'Density'} <ForgeHelpIcon text={getHelpText('pricing_material_density', language)} size={14} /></label>
                      <div className="input-with-unit">
                        <input
                          type="text" inputMode="decimal"
                          className="input"
                          value={mat.density ?? ''}
                          onChange={(e) => updateDialogDraft('density', parseDecimal(e.target.value))}
                          onBlur={() => updateDialogDraft('density', finalizeDecimal(mat.density, 1.0))}
                        />
                        <span className="unit">g/cm³</span>
                      </div>
                    </div>
                  </div>

                  <div className="dialog-row-2" style={{ marginTop: 8 }}>
                    <ForgeCheckbox
                      checked={mat.enabled}
                      onChange={(e) => updateDialogDraft('enabled', e.target.checked)}
                      label={cs ? 'Aktivni' : 'Active'}
                    />
                    <p className="help-text" style={{ margin: 0, flex: 1 }}>
                      {cs ? 'Cena se pouzije pro vsechny barvy bez vlastni ceny.' : 'Price used for all colors without custom override.'}
                    </p>
                  </div>

                  <div className="divider" />

                  {/* Print properties section */}
                  <div className="dialog-props-section">
                    <div className="colors-title">{cs ? 'Tiskove vlastnosti' : 'Print properties'}</div>
                    <p className="help-text" style={{ marginTop: 0, marginBottom: 12 }}>
                      {cs ? 'Informativni parametry pro tisk. Neovlivnuji kalkulaci ceny.' : 'Informational print parameters. Do not affect pricing.'}
                    </p>
                    <div className="dialog-props-grid">
                      <div className="field">
                        <label>{cs ? 'Teplota trysky (min-max)' : 'Nozzle temp (min-max)'}</label>
                        <div className="input-with-unit">
                          <input type="text" inputMode="decimal" className="input" value={mat.temp_nozzle_min ?? ''} onChange={(e) => updateDialogDraft('temp_nozzle_min', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('temp_nozzle_min', finalizeDecimal(mat.temp_nozzle_min, 0))} style={{ width: 70 }} />
                          <span style={{ color: 'var(--forge-text-muted)', margin: '0 2px' }}>-</span>
                          <input type="text" inputMode="decimal" className="input" value={mat.temp_nozzle_max ?? ''} onChange={(e) => updateDialogDraft('temp_nozzle_max', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('temp_nozzle_max', finalizeDecimal(mat.temp_nozzle_max, 0))} style={{ width: 70 }} />
                          <span className="unit">°C</span>
                        </div>
                      </div>
                      <div className="field">
                        <label>{cs ? 'Teplota podlozky (min-max)' : 'Bed temp (min-max)'}</label>
                        <div className="input-with-unit">
                          <input type="text" inputMode="decimal" className="input" value={mat.temp_bed_min ?? ''} onChange={(e) => updateDialogDraft('temp_bed_min', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('temp_bed_min', finalizeDecimal(mat.temp_bed_min, 0))} style={{ width: 70 }} />
                          <span style={{ color: 'var(--forge-text-muted)', margin: '0 2px' }}>-</span>
                          <input type="text" inputMode="decimal" className="input" value={mat.temp_bed_max ?? ''} onChange={(e) => updateDialogDraft('temp_bed_max', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('temp_bed_max', finalizeDecimal(mat.temp_bed_max, 0))} style={{ width: 70 }} />
                          <span className="unit">°C</span>
                        </div>
                      </div>
                      <div className="field">
                        <label>{cs ? 'Chlazeni (ventilator)' : 'Cooling fan'}</label>
                        <div className="input-with-unit">
                          <input type="text" inputMode="decimal" className="input" value={mat.cooling_fan ?? ''} onChange={(e) => updateDialogDraft('cooling_fan', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('cooling_fan', finalizeDecimal(mat.cooling_fan, 0))} style={{ width: 70 }} />
                          <span className="unit">%</span>
                        </div>
                      </div>
                      <div className="field">
                        <label>{cs ? 'Rychlost tisku (min-max)' : 'Print speed (min-max)'}</label>
                        <div className="input-with-unit">
                          <input type="text" inputMode="decimal" className="input" value={mat.speed_min ?? ''} onChange={(e) => updateDialogDraft('speed_min', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('speed_min', finalizeDecimal(mat.speed_min, 0))} style={{ width: 70 }} />
                          <span style={{ color: 'var(--forge-text-muted)', margin: '0 2px' }}>-</span>
                          <input type="text" inputMode="decimal" className="input" value={mat.speed_max ?? ''} onChange={(e) => updateDialogDraft('speed_max', parseDecimal(e.target.value))} onBlur={() => updateDialogDraft('speed_max', finalizeDecimal(mat.speed_max, 0))} style={{ width: 70 }} />
                          <span className="unit">mm/s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divider" />

                  <div className="dialog-colors-section">
                    <div className="colors-title">{cs ? 'Barvy materialu' : 'Material colors'}</div>
                    <p className="help-text" style={{ marginTop: 0, marginBottom: 12 }}>
                      {cs
                        ? 'Muzes nastavit specificou cenu pro kazdou barvu. Pokud cenu nezadas, pouzije se vychozi cena materialu.'
                        : 'You can set a specific price for each color. If not set, the default material price is used.'}
                    </p>

                    {draftColors.map(c => {
                      const cIssues = draftIssues.colors?.[c.id] || {};
                      const hexVal = c.hex || '#FFFFFF';
                      const canDeleteColor = draftColors.length > 1;

                      return (
                        <div key={c.id} className="dialog-color-row">
                          <input
                            className={`input ${cIssues.nameMissing ? 'input-error' : ''}`}
                            placeholder={cs ? 'Nazev barvy' : 'Color name'}
                            value={c.name || ''}
                            onChange={(e) => updateDialogColor(c.id, 'name', e.target.value)}
                          />
                          <input
                            type="color"
                            className="color-picker"
                            value={isValidHex(hexVal) ? hexVal : '#FFFFFF'}
                            onChange={(e) => updateDialogColor(c.id, 'hex', e.target.value)}
                          />
                          <input
                            className={`input mono ${cIssues.hexInvalid ? 'input-error' : ''}`}
                            placeholder="#RRGGBB"
                            value={c.hex || ''}
                            onChange={(e) => updateDialogColor(c.id, 'hex', e.target.value)}
                            style={{ width: 100 }}
                          />
                          <div className="dialog-color-price-field">
                            <input
                              type="text" inputMode="decimal"
                              className="input"
                              placeholder={`${clampMin0(mat.price_per_gram)}`}
                              value={c.price_per_gram != null ? c.price_per_gram : ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === '' ? null : parseDecimal(raw);
                                updateDialogColor(c.id, 'price_per_gram', val);
                              }}
                              onBlur={() => {
                                if (c.price_per_gram != null && c.price_per_gram !== '') {
                                  updateDialogColor(c.id, 'price_per_gram', finalizeDecimal(c.price_per_gram, null));
                                }
                              }}
                              title={cs ? 'Vlastni cena za gram (prazdne = vychozi)' : 'Custom price per gram (empty = default)'}
                            />
                            <span className="unit">Kc/g</span>
                          </div>
                          <button
                            className="icon-btn"
                            onClick={() => deleteDialogColor(c.id)}
                            disabled={!canDeleteColor}
                            title={!canDeleteColor ? (cs ? 'Nelze smazat posledni barvu' : 'Cannot delete the last color') : (cs ? 'Smazat barvu' : 'Delete color')}
                          >
                            <Icon name="Trash2" size={16} />
                          </button>

                          {(cIssues.nameMissing || cIssues.hexInvalid) && (
                            <div className="color-row-errors">
                              {cIssues.nameMissing && <span>{cs ? 'Nazev povinny' : 'Name required'}</span>}
                              {cIssues.hexInvalid && <span>{cs ? 'Hex neplatny' : 'Invalid hex'}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <DialogAddColor
                      language={language}
                      onAdd={(name, hex) => addColorToDialog(name, hex)}
                    />
                  </div>
                </div>
              );
            })()}
          </ForgeDialog>
          </>)}

          {/* TAB: TIME */}
          {activeTab === 'time' && (<>
          <CollapsibleCard
            id="time_rate"
            title={language === 'cs' ? 'Cena času tisku' : 'Print time rate'}
            description={language === 'cs' ? 'Používá se čas z PrusaSliceru.' : 'Uses time reported by PrusaSlicer.'}
          >
            {/* Hour / Minute toggle */}
            <div className="time-unit-toggle">
              <button className={`toggle-unit-btn ${timeUnit === 'hour' ? 'active' : ''}`} onClick={() => setTimeUnit('hour')}>
                {t('admin.pricing.btnPerHour', 'Per hour')}
              </button>
              <button className={`toggle-unit-btn ${timeUnit === 'minute' ? 'active' : ''}`} onClick={() => setTimeUnit('minute')}>
                {t('admin.pricing.btnPerMinute', 'Per minute')}
              </button>
            </div>

            <div className="field">
              <label>{timeUnit === 'hour' ? (language === 'cs' ? 'Cena za hodinu tisku' : 'Hourly rate') : (language === 'cs' ? 'Cena za minutu tisku' : 'Per-minute rate')} <ForgeHelpIcon text={getHelpText('pricing_rate_per_hour', language)} size={14} /></label>
              <div className="input-with-unit">
                <NumberStepper
                  value={timeUnit === 'hour' ? rules.rate_per_hour : +(rules.rate_per_hour / 60).toFixed(4)}
                  onChange={(v) => setRule('rate_per_hour', timeUnit === 'hour' ? v : v * 60)}
                  min={0}
                  step={timeUnit === 'hour' ? 10 : 1}
                  error={rules.rate_per_hour < 0}
                />
                <span className="unit">{timeUnit === 'hour' ? 'Kč/h' : 'Kč/min'}</span>
              </div>
              <FieldError show={rules.rate_per_hour < 0} />
              <p className="help-text">{language === 'cs' ? 'Tato sazba se aplikuje na čas tisku (minuty → hodiny).' : 'Applied to print time (minutes → hours).'}</p>
            </div>

            <div className="divider" />

            <ToggleRow
              checked={rules.min_billed_minutes_enabled}
              onChange={(v) => setRule('min_billed_minutes_enabled', v)}
              label={language === 'cs' ? 'Minimální účtovaný čas' : 'Minimum billed time'}
              hint={language === 'cs'
                ? 'Použije se jen pro výpočet ceny času, materiál zůstává reálný.'
                : 'Applied only to time cost calculation; material stays real.'}
            />

            {rules.min_billed_minutes_enabled ? (
              <div className="field nested">
                <label>{language === 'cs' ? 'Minimálně účtovat (min)' : 'Minimum billed (min)'}</label>
                <div className="input-with-unit">
                  <NumberStepper
                    value={rules.min_billed_minutes_value}
                    onChange={(v) => setRule('min_billed_minutes_value', v)}
                    min={0} step={5}
                    error={rules.min_billed_minutes_value < 0}
                  />
                  <span className="unit">min</span>
                </div>
                <FieldError show={rules.min_billed_minutes_value < 0} />
              </div>
            ) : null}
          </CollapsibleCard>
          </>)}

          {/* TAB: RULES */}
          {activeTab === 'rules' && (<>
          {/* Card 2: Minimum prices */}
          <CollapsibleCard
            id="rules_minimums"
            title={language === 'cs' ? 'Minimální ceny' : 'Minimum prices'}
            description={language === 'cs'
              ? 'Nastav minima, aby se vyplatily malé zakázky.'
              : 'Set minimums to keep small jobs profitable.'}
            headerRight={
              <div className="mini-preview">
                <div className="mini-preview-title">{language === 'cs' ? 'Ukázka' : 'Example'}</div>
                <div className="mini-preview-row">
                  <span>{language === 'cs' ? 'Vypočteno' : 'Calculated'}</span>
                  <strong>52 Kč</strong>
                </div>
                <div className="mini-preview-row">
                  <span>{language === 'cs' ? 'Účtováno' : 'Charged'}</span>
                  <strong>99 Kč</strong>
                </div>
              </div>
            }
          >
            <ToggleRow
              checked={rules.min_price_per_model_enabled}
              onChange={(v) => setRule('min_price_per_model_enabled', v)}
              label={language === 'cs' ? 'Minimální cena za model' : 'Minimum price per model'}
              hint={language === 'cs'
                ? 'Pokud je vypočtená cena modelu nižší, zvedne se na minimum.'
                : 'If calculated model price is lower, it is bumped to this minimum.'}
            />

            {rules.min_price_per_model_enabled ? (
              <div className="field nested">
                <label>{language === 'cs' ? 'Minimálně účtovat za 1 model (Kč)' : 'Minimum per model (CZK)'}</label>
                <div className="input-with-unit">
                  <NumberStepper
                    value={rules.min_price_per_model_value}
                    onChange={(v) => setRule('min_price_per_model_value', v)}
                    min={0} step={10}
                    error={rules.min_price_per_model_value < 0}
                  />
                  <span className="unit">Kč</span>
                </div>
                <FieldError show={rules.min_price_per_model_value < 0} />
              </div>
            ) : null}

            <div className="divider" />

            <ToggleRow
              checked={rules.min_order_total_enabled}
              onChange={(v) => setRule('min_order_total_enabled', v)}
              label={language === 'cs' ? 'Minimální cena objednávky' : 'Minimum order total'}
              hint={language === 'cs'
                ? 'Aplikuje se po sečtení všech modelů a jednorázových poplatků.'
                : 'Applied after summing all models and one-time fees.'}
            />

            {rules.min_order_total_enabled ? (
              <div className="field nested">
                <label>{language === 'cs' ? 'Minimálně účtovat za objednávku (Kč)' : 'Minimum order total (CZK)'}</label>
                <div className="input-with-unit">
                  <NumberStepper
                    value={rules.min_order_total_value}
                    onChange={(v) => setRule('min_order_total_value', v)}
                    min={0} step={10}
                    error={rules.min_order_total_value < 0}
                  />
                  <span className="unit">Kč</span>
                </div>
                <FieldError show={rules.min_order_total_value < 0} />
              </div>
            ) : null}
          </CollapsibleCard>

          {/* Card 3: Rounding */}
          <CollapsibleCard
            id="rules_rounding"
            title={language === 'cs' ? 'Zaokrouhlování' : 'Rounding'}
            description={language === 'cs'
              ? 'Aby výsledná cena byla „hezčí" (např. 483,27 → 485).'
              : 'Make the final price look nicer (e.g., 483.27 → 485).'}
            headerRight={
              <div className="mini-preview">
                <div className="mini-preview-title">{language === 'cs' ? 'Ukázka' : 'Example'}</div>
                <div className="mini-preview-row">
                  <span>483</span>
                  <span className="arrow">→</span>
                  <strong>485</strong>
                </div>
                <div className="mini-preview-note">
                  {language === 'cs' ? 'krok 5, nejbližší' : 'step 5, nearest'}
                </div>
              </div>
            }
          >
            <ToggleRow
              checked={rules.rounding_enabled}
              onChange={(v) => setRule('rounding_enabled', v)}
              label={language === 'cs' ? 'Zaokrouhlovat cenu' : 'Enable rounding'}
              hint={language === 'cs'
                ? 'Zaokrouhlení se aplikuje až po minimách (a podle volby i na model).'
                : 'Rounding is applied after minimums (and optionally per model).'}
            />

            {rules.rounding_enabled ? (
              <div className="grid-2 nested">
                <div className="field">
                  <label>{language === 'cs' ? 'Zaokrouhlit na' : 'Round to'}</label>
                  <select
                    className="select"
                    value={rules.rounding_step}
                    onChange={(e) => setRule('rounding_step', safeNum(e.target.value, 5))}
                  >
                    {[1, 5, 10, 50].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>{language === 'cs' ? 'Směr' : 'Mode'}</label>
                  <select
                    className="select"
                    value={rules.rounding_mode}
                    onChange={(e) => setRule('rounding_mode', e.target.value)}
                  >
                    <option value="nearest">{language === 'cs' ? 'Nejbližší' : 'Nearest'}</option>
                    <option value="up">{language === 'cs' ? 'Vždy nahoru' : 'Always up'}</option>
                  </select>
                </div>

                <div className="field full">
                  <ToggleRow
                    checked={rules.smart_rounding_enabled}
                    onChange={(v) => setRule('smart_rounding_enabled', v)}
                    label={language === 'cs' ? 'Zaokrouhlovat jen finální částku' : 'Round only the final total'}
                    hint={language === 'cs'
                      ? 'Zapnuto = round až na konci. Vypnuto = round i na úrovni modelu.'
                      : 'On = round at the end only. Off = also round per model.'}
                  />
                </div>
              </div>
            ) : null}
          </CollapsibleCard>

          {/* Card 4: Markup */}
          <CollapsibleCard
            id="rules_markup"
            title={language === 'cs' ? 'Automatická přirážka (markup)' : 'Automatic markup'}
            description={language === 'cs'
              ? 'Pricing-level přirážka (není to Fee). Aplikuje se: base → fees → markup → minima → rounding.'
              : 'Pricing-level markup (not a Fee). Applied: base → fees → markup → minima → rounding.'}
            headerRight={
              <div className="mini-preview">
                <div className="mini-preview-title">{language === 'cs' ? 'Ukázka' : 'Example'}</div>
                <div className="mini-preview-row">
                  <span>120</span>
                  <span className="arrow">+</span>
                  <span>20</span>
                  <span className="arrow">=</span>
                  <strong>140</strong>
                </div>
              </div>
            }
          >
            <ToggleRow
              checked={rules.markup_enabled}
              onChange={(v) => setRule('markup_enabled', v)}
              label={language === 'cs' ? 'Automatická přirážka' : 'Enable markup'}
              hint={language === 'cs'
                ? 'Přirážka se aplikuje po přičtení poplatků (fees) a před minimy/zaokrouhlováním.'
                : 'Markup is applied after fees and before minimums/rounding.'}
            />

            {rules.markup_enabled ? (
              <div className="grid-2 nested">
                <div className="field">
                  <label>{language === 'cs' ? 'Režim' : 'Mode'} <ForgeHelpIcon text={getHelpText('pricing_markup', language)} size={14} /></label>
                  <div className="radio-group">
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'flat'}
                        onChange={() => setRule('markup_mode', 'flat')}
                      />
                      <span>{language === 'cs' ? 'Fixní (Kč)' : 'Flat (CZK)'}</span>
                      <ForgeHelpIcon text={getHelpText('pricing_markup_flat', language)} size={14} />
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'percent'}
                        onChange={() => setRule('markup_mode', 'percent')}
                      />
                      <span>{language === 'cs' ? 'Procentní (%)' : 'Percent (%)'}</span>
                      <ForgeHelpIcon text={getHelpText('pricing_markup_percent', language)} size={14} />
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'min_flat'}
                        onChange={() => setRule('markup_mode', 'min_flat')}
                      />
                      <span>{language === 'cs' ? 'Minimální cena (Kč)' : 'Minimum price (CZK)'}</span>
                      <ForgeHelpIcon text={getHelpText('pricing_markup_min_flat', language)} size={14} />
                    </label>
                  </div>
                </div>

                <div className="field">
                  <label>{language === 'cs' ? 'Hodnota' : 'Value'}</label>
                  <div className="input-with-unit">
                    <NumberStepper
                      value={rules.markup_value}
                      onChange={(v) => setRule('markup_value', v)}
                      min={0}
                      step={rules.markup_mode === 'percent' ? 1 : 10}
                      error={rules.markup_value < 0}
                    />
                    <span className="unit">{rules.markup_mode === 'percent' ? '%' : 'Kč'}</span>
                  </div>
                  <FieldError show={rules.markup_value < 0} />
                </div>
              </div>
            ) : null}
          </CollapsibleCard>
          </>)}

          {/* TAB: DISCOUNTS */}
          {activeTab === 'discounts' && (<>
          {/* Volume Discounts card */}
          <CollapsibleCard
            id="discounts_volume"
            title={<>{language === 'cs' ? 'Množstevní slevy' : 'Volume Discounts'} <ForgeHelpIcon text={getHelpText('pricing_volume_discount', language)} size={14} /></>}
            description={language === 'cs'
              ? 'Nastavte slevy na základě objednaného množství.'
              : 'Configure discounts based on ordered quantity.'}
            headerRight={
              <ForgeCheckbox
                checked={volumeDiscounts.enabled}
                onChange={(e) => {
                  setVolumeDiscounts(prev => ({ ...prev, enabled: e.target.checked }));
                  setTouched(true);
                }}
                label={volumeDiscounts.enabled
                  ? (language === 'cs' ? 'Zapnuto' : 'Enabled')
                  : (language === 'cs' ? 'Vypnuto' : 'Disabled')}
              />
            }
          >

            {volumeDiscounts.enabled && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--forge-font-tech, Share Tech Mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-text-secondary, #a0a0a0)' }}>
                      {language === 'cs' ? 'Typ slevy' : 'Discount mode'}
                    </label>
                    <select
                      value={volumeDiscounts.mode}
                      onChange={(e) => {
                        setVolumeDiscounts(prev => ({ ...prev, mode: e.target.value }));
                        setTouched(true);
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--forge-border-default, #1a1a2e)', fontSize: '14px', background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-primary, #e0e0e0)' }}
                    >
                      <option value="percent">{language === 'cs' ? 'Procentní sleva' : 'Percentage discount'}</option>
                      <option value="fixed_price">{language === 'cs' ? 'Fixní cena za kus' : 'Fixed price per piece'}</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--forge-font-tech, Share Tech Mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-text-secondary, #a0a0a0)' }}>
                      {language === 'cs' ? 'Rozsah' : 'Scope'}
                    </label>
                    <select
                      value={volumeDiscounts.scope}
                      onChange={(e) => {
                        setVolumeDiscounts(prev => ({ ...prev, scope: e.target.value }));
                        setTouched(true);
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--forge-border-default, #1a1a2e)', fontSize: '14px', background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-primary, #e0e0e0)' }}
                    >
                      <option value="per_model">{language === 'cs' ? 'Za model (ks jednoho modelu)' : 'Per model (qty of single model)'}</option>
                      <option value="per_order">{language === 'cs' ? 'Za objednávku (celkový ks)' : 'Per order (total qty)'}</option>
                    </select>
                  </div>
                </div>

                {/* Tiers table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--forge-border-default, #1a1a2e)' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--forge-font-tech, Share Tech Mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-text-muted, #666680)', background: 'var(--forge-bg-elevated, #1a1a2e)' }}>
                        {language === 'cs' ? 'Od (ks)' : 'Min qty'}
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--forge-font-tech, Share Tech Mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-text-muted, #666680)', background: 'var(--forge-bg-elevated, #1a1a2e)' }}>
                        {volumeDiscounts.mode === 'percent'
                          ? (language === 'cs' ? 'Sleva (%)' : 'Discount (%)')
                          : (language === 'cs' ? 'Cena/ks (Kč)' : 'Price/pc (CZK)')}
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--forge-font-tech, Share Tech Mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-text-muted, #666680)', background: 'var(--forge-bg-elevated, #1a1a2e)' }}>
                        {language === 'cs' ? 'Popis' : 'Label'}
                      </th>
                      <th style={{ width: '60px', background: 'var(--forge-bg-elevated, #1a1a2e)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumeDiscounts.tiers.map((tier, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--forge-border-default, #1a1a2e)', background: idx % 2 === 0 ? 'var(--forge-bg-surface, #12121a)' : 'var(--forge-bg-void, #0a0a0f)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="1"
                            value={tier.min_qty}
                            onChange={(e) => {
                              const newTiers = [...volumeDiscounts.tiers];
                              newTiers[idx] = { ...newTiers[idx], min_qty: Math.max(1, parseInt(e.target.value) || 1) };
                              newTiers.sort((a, b) => a.min_qty - b.min_qty);
                              setVolumeDiscounts(prev => ({ ...prev, tiers: newTiers }));
                              setTouched(true);
                            }}
                            style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--forge-border-default, #1a1a2e)', background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-primary, #e0e0e0)', fontFamily: 'var(--forge-font-mono, JetBrains Mono, monospace)' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step={volumeDiscounts.mode === 'percent' ? '1' : '0.01'}
                            value={tier.value}
                            onChange={(e) => {
                              const newTiers = [...volumeDiscounts.tiers];
                              newTiers[idx] = { ...newTiers[idx], value: parseFloat(e.target.value) || 0 };
                              setVolumeDiscounts(prev => ({ ...prev, tiers: newTiers }));
                              setTouched(true);
                            }}
                            style={{ width: '100px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--forge-border-default, #1a1a2e)', background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-primary, #e0e0e0)', fontFamily: 'var(--forge-font-mono, JetBrains Mono, monospace)' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            value={tier.label || ''}
                            placeholder={language === 'cs' ? 'Nepovinný popis' : 'Optional label'}
                            onChange={(e) => {
                              const newTiers = [...volumeDiscounts.tiers];
                              newTiers[idx] = { ...newTiers[idx], label: e.target.value };
                              setVolumeDiscounts(prev => ({ ...prev, tiers: newTiers }));
                              setTouched(true);
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--forge-border-default, #1a1a2e)', background: 'var(--forge-bg-elevated, #1a1a2e)', color: 'var(--forge-text-primary, #e0e0e0)' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              const newTiers = volumeDiscounts.tiers.filter((_, i) => i !== idx);
                              setVolumeDiscounts(prev => ({ ...prev, tiers: newTiers }));
                              setTouched(true);
                            }}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    const lastQty = volumeDiscounts.tiers.length > 0
                      ? volumeDiscounts.tiers[volumeDiscounts.tiers.length - 1].min_qty + 5
                      : 5;
                    const newTier = { min_qty: lastQty, value: volumeDiscounts.mode === 'percent' ? 5 : 0, label: '' };
                    const newTiers = [...volumeDiscounts.tiers, newTier].sort((a, b) => a.min_qty - b.min_qty);
                    setVolumeDiscounts(prev => ({ ...prev, tiers: newTiers }));
                    setTouched(true);
                  }}
                  style={{ marginTop: '12px' }}
                >
                  <Icon name="Plus" size={16} />
                  {language === 'cs' ? 'Přidat tier' : 'Add tier'}
                </button>

                {volumeDiscounts.tiers.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'var(--forge-bg-void, #0a0a0f)', border: '1px solid var(--forge-border-default, #1a1a2e)', fontSize: '13px', color: 'var(--forge-text-muted, #666680)', fontFamily: 'var(--forge-font-mono, JetBrains Mono, monospace)' }}>
                    <strong>{language === 'cs' ? 'Příklad:' : 'Example:'}</strong>{' '}
                    {volumeDiscounts.tiers.map((t, i) => (
                      <span key={i}>
                        {t.min_qty}+ ks = {volumeDiscounts.mode === 'percent' ? `-${t.value}%` : `${t.value} Kč/ks`}
                        {i < volumeDiscounts.tiers.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CollapsibleCard>

          {/* Future pricing profiles stub */}
          <div className="admin-card future" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div>
                <h2>
                  {language === 'cs' ? 'Více pricing profilů (budoucí)' : 'Multiple pricing profiles (future)'}
                </h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Architektura je připravená – přidáme v další fázi.'
                    : 'UI architecture ready – planned for a later phase.'}
                </p>
              </div>
              <span className="tag">later</span>
            </div>

            <ForgeCheckbox
              disabled
              checked={false}
              onChange={() => {}}
              label={language === 'cs' ? 'Používat více pricing profilů' : 'Enable pricing profiles'}
            />

            <p className="help-text">
              {language === 'cs'
                ? 'V další fázi půjde vytvořit více sad pravidel (Standard / Engineering / Bulk) a vybírat je ve widgetu.'
                : 'Later you will create multiple rule sets (Standard / Engineering / Bulk) and select them in the widget.'}
            </p>
          </div>
          </>)}

          {/* TAB: PREVIEW */}
          {activeTab === 'preview' && (<>
          <div className="admin-card">
            <div className="preview-header">
              <h3>{ui.preview}</h3>
              <ForgeCheckbox
                checked={previewEnabled}
                onChange={(e) => setPreviewEnabled(e.target.checked)}
                label={ui.previewToggle}
                size={16}
              />
            </div>

            {previewEnabled ? (
              <>
                <div className="field">
                  <label>{language === 'cs' ? 'Materiál (rychlé nastavení ceny Kč/g)' : 'Material (quick price per g)'}</label>
                  <select
                    className="select"
                    onChange={(e) => setPreviewFromMaterial(safeNum(e.target.value, -1))}
                    value={-1}
                  >
                    <option value={-1}>
                      {enabledMaterials.length > 0
                        ? language === 'cs'
                          ? '— vyber materiál —'
                          : '— select material —'
                        : language === 'cs'
                          ? '— žádné materiály —'
                          : '— no materials —'}
                    </option>
                    {enabledMaterials.map((m, idx) => (
                      <option key={m.id} value={idx}>
                        {m.name} ({clampMin0(m.price)} Kč/g)
                      </option>
                    ))}
                  </select>
                  <p className="help-text">
                    {language === 'cs'
                      ? 'Nebo zadej cenu ručně níže.'
                      : 'Or enter the price manually below.'}
                  </p>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>{language === 'cs' ? 'Cena materiálu (Kč/g)' : 'Material price (CZK/g)'}</label>
                    <div className="input-with-unit">
                      <NumberStepper
                        value={preview.material_price_per_g}
                        onChange={(v) => setPreviewField('material_price_per_g', v)}
                        min={0} step={0.1}
                      />
                      <span className="unit">Kč/g</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Hmotnost (g)' : 'Weight (g)'}</label>
                    <div className="input-with-unit">
                      <NumberStepper
                        value={preview.weight_g}
                        onChange={(v) => setPreviewField('weight_g', v)}
                        min={0} step={10}
                      />
                      <span className="unit">g</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Čas (min)' : 'Time (min)'}</label>
                    <div className="input-with-unit">
                      <NumberStepper
                        value={preview.time_min}
                        onChange={(v) => setPreviewField('time_min', v)}
                        min={0} step={5}
                      />
                      <span className="unit">min</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Množství (ks)' : 'Quantity'}</label>
                    <div className="input-with-unit">
                      <NumberStepper
                        value={preview.quantity}
                        onChange={(v) => setPreviewField('quantity', v)}
                        min={1} step={1}
                      />
                      <span className="unit">ks</span>
                    </div>
                  </div>

                  <div className="field full">
                    <label>{language === 'cs' ? 'Poplatky (Fees) – simulace / model (Kč)' : 'Fees (simulated) / model (CZK)'}</label>
                    <div className="input-with-unit">
                      <NumberStepper
                        value={preview.fees_total}
                        onChange={(v) => setPreviewField('fees_total', v)}
                        min={0} step={10}
                      />
                      <span className="unit">Kč</span>
                    </div>
                    <p className="help-text">
                      {language === 'cs'
                        ? 'Tento input je jen pro sandbox (např. lakování apod.).'
                        : 'This input is sandbox-only (e.g., post-processing).' }
                    </p>
                  </div>
                </div>

                <div className="breakdown">
                  <div className="breakdown-row">
                    <span>{language === 'cs' ? 'Materiál' : 'Material'}</span>
                    <strong>{formatCzk(previewResult.material)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>
                      {language === 'cs' ? 'Čas' : 'Time'}
                      <span className="muted">
                        {' '}
                        ({previewResult.billedMinutes.toFixed(0)} min)
                      </span>
                    </span>
                    <strong>{formatCzk(previewResult.time)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>{language === 'cs' ? 'Poplatky (Fees)' : 'Fees'}</span>
                    <strong>{formatCzk(previewResult.fees)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>{language === 'cs' ? 'Markup' : 'Markup'}</span>
                    <strong>{formatCzk(previewResult.markup)}</strong>
                  </div>

                  <div className="divider" />

                  <div className="breakdown-row">
                    <span>{language === 'cs' ? 'Cena / model' : 'Per model'}</span>
                    <strong>{formatCzk(previewResult.perModel)}</strong>
                  </div>

                  {rules.rounding_enabled && !rules.smart_rounding_enabled ? (
                    <div className="breakdown-row">
                      <span className="muted">{language === 'cs' ? 'Zaokrouhleno / model' : 'Rounded / model'}</span>
                      <strong>{formatCzk(previewResult.perModelRounded)}</strong>
                    </div>
                  ) : null}

                  <div className="breakdown-row">
                    <span>{language === 'cs' ? 'Množství' : 'Quantity'}</span>
                    <strong>{previewResult.qty}×</strong>
                  </div>

                  <div className="divider" />

                  <div className="breakdown-row total">
                    <span>{language === 'cs' ? 'Celkem' : 'Total'}</span>
                    <strong>{formatCzk(previewResult.total)}</strong>
                  </div>

                  <div className="flags">
                    {previewResult.flags.min_price_per_model_applied ? (
                      <span className="flag warn">
                        {language === 'cs' ? 'min cena / model aplikována' : 'min per model applied'}
                      </span>
                    ) : null}
                    {previewResult.flags.min_order_total_applied ? (
                      <span className="flag warn">
                        {language === 'cs' ? 'min cena objednávky aplikována' : 'min order applied'}
                      </span>
                    ) : null}
                    {previewResult.flags.rounding_final_applied ? (
                      <span className="flag info">
                        {language === 'cs' ? 'zaokrouhlení aplikováno' : 'rounding applied'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <p className="help-text">{language === 'cs' ? 'Preview je vypnuté.' : 'Preview is disabled.'}</p>
            )}
          </div>

          {!isValid ? (
            <div className="validation-box">
              <Icon name="AlertTriangle" size={18} />
              <span>{ui.invalid}</span>
            </div>
          ) : null}
          </>)}
      </div>

      {/* QUICK TEST FAB + FLOATING PANEL */}
      {activeTab !== 'preview' && (
        <>
          <button
            className="quick-test-fab"
            onClick={() => setQuickTestOpen(prev => !prev)}
            title={t('admin.pricing.quickTestTitle', 'Quick price test')}
            aria-label={t('admin.pricing.quickTestTitle', 'Quick price test')}
          >
            <Icon name="Calculator" size={20} />
          </button>

          {quickTestOpen && (
            <div className="quick-test-overlay" onClick={() => setQuickTestOpen(false)}>
              <div className="quick-test-panel" onClick={e => e.stopPropagation()}>
                <div className="qt-header">
                  <h4>{t('admin.pricing.quickTest', 'Quick Test')}</h4>
                  <button className="icon-btn" onClick={() => setQuickTestOpen(false)} aria-label="Close">
                    <Icon name="X" size={16} />
                  </button>
                </div>

                <div className="qt-fields">
                  <div className="qt-field">
                    <label>{t('admin.pricing.fieldMaterial', 'Material')}</label>
                    <select
                      className="select"
                      onChange={(e) => {
                        const idx = safeNum(e.target.value, -1);
                        const mat = enabledMaterials[idx];
                        if (mat) setPreviewField('material_price_per_g', clampMin0(mat.price_per_gram));
                      }}
                      defaultValue={-1}
                    >
                      <option value={-1}>{t('admin.pricing.selectOption', '-- select --')}</option>
                      {enabledMaterials.map((m, idx) => (
                        <option key={m.id} value={idx}>{m.name} ({clampMin0(m.price_per_gram)} Kč/g)</option>
                      ))}
                    </select>
                  </div>
                  <div className="qt-row">
                    <div className="qt-field">
                      <label>{t('admin.pricing.fieldWeight', 'Weight')}</label>
                      <NumberStepper value={preview.weight_g} onChange={v => setPreviewField('weight_g', v)} min={0} step={10} />
                      <span className="qt-unit">g</span>
                    </div>
                    <div className="qt-field">
                      <label>{t('admin.pricing.fieldTime', 'Time')}</label>
                      <NumberStepper value={preview.time_min} onChange={v => setPreviewField('time_min', v)} min={0} step={5} />
                      <span className="qt-unit">min</span>
                    </div>
                  </div>
                  <div className="qt-row">
                    <div className="qt-field">
                      <label>{t('admin.pricing.fieldQty', 'Qty')}</label>
                      <NumberStepper value={preview.quantity} onChange={v => setPreviewField('quantity', v)} min={1} step={1} />
                      <span className="qt-unit">ks</span>
                    </div>
                    <div className="qt-field">
                      <label>{t('admin.pricing.fieldCzkPerG', 'CZK/g')}</label>
                      <NumberStepper value={preview.material_price_per_g} onChange={v => setPreviewField('material_price_per_g', v)} min={0} step={0.1} />
                    </div>
                  </div>
                </div>

                <div className="qt-result">
                  <div className="qt-result-row">
                    <span>{t('admin.pricing.fieldMaterial', 'Material')}</span>
                    <strong>{formatCzk(previewResult.material)}</strong>
                  </div>
                  <div className="qt-result-row">
                    <span>{t('admin.pricing.fieldTime', 'Time')}</span>
                    <strong>{formatCzk(previewResult.time)}</strong>
                  </div>
                  {previewResult.markup > 0 && (
                    <div className="qt-result-row">
                      <span>Markup</span>
                      <strong>{formatCzk(previewResult.markup)}</strong>
                    </div>
                  )}
                  <div className="qt-divider" />
                  <div className="qt-result-row qt-total">
                    <span>{t('admin.pricing.total', 'Total')}</span>
                    <strong>{formatCzk(previewResult.total)}</strong>
                  </div>
                  {previewResult.flags.min_price_per_model_applied && (
                    <span className="flag warn" style={{ fontSize: 10, marginTop: 4 }}>{t('admin.pricing.flagMinModel', 'min/model')}</span>
                  )}
                  {previewResult.flags.rounding_final_applied && (
                    <span className="flag info" style={{ fontSize: 10, marginTop: 4 }}>{t('admin.pricing.flagRounded', 'rounded')}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .admin-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          background: var(--forge-bg-void, #0a0a0f);
          min-height: 100vh;
          color: var(--forge-text-primary, #e0e0e0);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
        }

        .subtitle {
          margin: 4px 0 0 0;
          color: var(--forge-text-secondary, #a0a0a0);
          font-size: 14px;
          max-width: 740px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-surface, #12121a);
          color: var(--forge-text-muted, #666680);
        }

        .status-pill.clean {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.08);
          color: var(--forge-accent-primary, #00D4AA);
        }

        .status-pill.dirty {
          border-color: rgba(255, 170, 0, 0.3);
          background: rgba(255, 170, 0, 0.08);
          color: var(--forge-warning, #FFB547);
        }

        .banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--forge-radius-md, 8px);
          margin: 10px 0 16px 0;
          font-size: 14px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-surface, #12121a);
          color: var(--forge-text-secondary, #a0a0a0);
        }

        .banner.info {
          border-color: rgba(0, 150, 255, 0.3);
          background: rgba(0, 150, 255, 0.06);
        }

        .banner.success {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.06);
        }

        .banner.error {
          border-color: rgba(255, 60, 60, 0.3);
          background: rgba(255, 60, 60, 0.06);
        }

        /* Tab bar */
        .tab-bar {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--forge-bg-surface, #12121a);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--forge-text-muted, #666680);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          letter-spacing: 0.04em;
        }

        .tab-btn:hover {
          background: var(--forge-bg-elevated, #1a1a2e);
          color: var(--forge-text-secondary, #a0a0a0);
        }

        .tab-btn.active {
          background: var(--forge-accent-primary, #00D4AA);
          color: #0a0a0f;
          font-weight: 600;
        }

        .tab-content-area {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Time unit toggle */
        .time-unit-toggle {
          display: inline-flex;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .toggle-unit-btn {
          padding: 6px 14px;
          border: none;
          background: transparent;
          color: var(--forge-text-muted, #666680);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .toggle-unit-btn:hover {
          color: var(--forge-text-secondary, #a0a0a0);
        }

        .toggle-unit-btn.active {
          background: var(--forge-accent-primary, #00D4AA);
          color: #0a0a0f;
          font-weight: 600;
        }

        .admin-card {
          background: var(--forge-bg-surface, #12121a);
          border-radius: var(--forge-radius-md, 8px);
          padding: 18px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
        }

        .admin-card.future {
          border-style: dashed;
          opacity: 0.7;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
        }

        .card-description {
          margin: 4px 0 0 0;
          color: var(--forge-text-muted, #666680);
          font-size: 13px;
        }

        .tag {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.25);
          padding: 4px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .mini-preview {
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-void, #0a0a0f);
          border-radius: 10px;
          padding: 10px 12px;
          min-width: 170px;
        }

        .mini-preview-title {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-muted, #666680);
          margin-bottom: 6px;
        }

        .mini-preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--forge-text-secondary, #a0a0a0);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }

        .mini-preview-row strong {
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
        }

        .mini-preview-note {
          margin-top: 4px;
          font-size: 12px;
          color: var(--forge-text-muted, #666680);
        }

        .arrow {
          color: var(--forge-text-muted, #666680);
          font-weight: 600;
          margin: 0 6px;
        }

        .btn-primary,
        .btn-secondary {
          border: none;
          border-radius: var(--forge-radius-md, 8px);
          padding: 10px 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-primary {
          background: var(--forge-accent-primary, #00D4AA);
          color: #0a0a0f;
        }

        .btn-primary:hover:not(:disabled) {
          background: #00e6b8;
          box-shadow: 0 0 12px rgba(0, 212, 170, 0.3);
        }

        .btn-secondary {
          background: var(--forge-bg-elevated, #1a1a2e);
          color: var(--forge-text-secondary, #a0a0a0);
          border: 1px solid var(--forge-border-default, #1a1a2e);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--forge-bg-overlay, #22223a);
          color: var(--forge-text-primary, #e0e0e0);
          border-color: var(--forge-accent-primary, #00D4AA);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        /* Compact material overview grid */
        .materials-compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 900px) {
          .materials-compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 560px) {
          .materials-compact-grid {
            grid-template-columns: 1fr;
          }
        }

        .material-compact-card {
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          padding: 12px;
          background: var(--forge-bg-void, #0a0a0f);
          cursor: pointer;
          transition: border-color 120ms ease-out, background-color 120ms ease-out, box-shadow 120ms ease-out;
          position: relative;
        }

        .material-compact-card:hover {
          border-color: rgba(0, 212, 170, 0.3);
          background: var(--forge-bg-elevated, #1a1a2e);
          box-shadow: 0 0 12px rgba(0, 212, 170, 0.08);
        }

        .material-compact-card.has-issue {
          border-color: rgba(255, 68, 68, 0.3);
        }

        .mcc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .mcc-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mcc-edit-icon {
          color: var(--forge-text-muted, #666680);
          opacity: 0;
          transition: opacity 120ms;
          flex-shrink: 0;
        }

        .material-compact-card:hover .mcc-edit-icon {
          opacity: 1;
        }

        .mcc-key {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          color: var(--forge-text-muted, #666680);
          margin-bottom: 6px;
        }

        .mcc-badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .mcc-badge {
          font-size: 10px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
        }

        .mcc-badge.default {
          background: rgba(0, 212, 170, 0.1);
          color: var(--forge-accent-primary, #00D4AA);
          border-color: rgba(0, 212, 170, 0.3);
        }

        .mcc-badge.active {
          background: rgba(0, 212, 170, 0.06);
          color: var(--forge-accent-primary, #00D4AA);
          border-color: rgba(0, 212, 170, 0.2);
        }

        .mcc-badge.inactive {
          background: rgba(255, 170, 0, 0.06);
          color: var(--forge-warning, #FFB547);
          border-color: rgba(255, 170, 0, 0.2);
        }

        .mcc-badge.error {
          background: rgba(255, 68, 68, 0.06);
          color: var(--forge-error, #FF4757);
          border-color: rgba(255, 68, 68, 0.2);
        }

        .mcc-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 8px;
        }

        .mcc-price-value {
          font-size: 18px;
          font-weight: 800;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }

        .mcc-price-unit {
          font-size: 11px;
          color: var(--forge-text-muted, #666680);
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
        }

        .mcc-colors {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .mcc-color-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--forge-bg-surface, #12121a);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          font-size: 11px;
          color: var(--forge-text-secondary, #a0a0a0);
        }

        .mcc-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .mcc-color-name {
          max-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mcc-color-price {
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          font-size: 10px;
          color: var(--forge-accent-primary, #00D4AA);
        }

        .mcc-color-more {
          font-size: 11px;
          color: var(--forge-text-muted, #666680);
          padding: 2px 6px;
        }

        /* Dialog material form */
        .dialog-material-form .field {
          margin-top: 14px;
        }

        .dialog-material-form .field:first-child {
          margin-top: 0;
        }

        .dialog-row-2 {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-top: 14px;
        }

        .dialog-colors-section {
          margin-top: 4px;
        }

        .dialog-color-row {
          display: grid;
          grid-template-columns: 1fr 44px 100px 1fr auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .dialog-color-price-field {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dialog-color-price-field .input {
          width: 80px;
        }

        .dialog-color-add-row {
          display: grid;
          grid-template-columns: 1fr 44px 100px auto;
          gap: 8px;
          align-items: center;
        }

        .material-card {
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          padding: 12px;
          background: var(--forge-bg-void, #0a0a0f);
        }

        .material-header {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .material-name {
          flex: 1;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 14px;
          background: var(--forge-bg-elevated, #1a1a2e);
          color: var(--forge-text-primary, #e0e0e0);
        }

        .material-name:focus {
          outline: none;
          border-color: var(--forge-accent-primary, #00D4AA);
          box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.15);
        }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: var(--forge-text-muted, #666680);
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--forge-text-primary, #e0e0e0);
        }

        .icon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }

        .icon-btn:disabled:hover {
          background: none;
          color: var(--forge-text-muted, #666680);
        }

        .material-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .default-radio {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 999px;
          padding: 6px 10px;
          background: var(--forge-bg-surface, #12121a);
          color: var(--forge-text-muted, #666680);
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .default-radio input {
          margin: 0;
        }

        .default-radio.is-default {
          border-color: rgba(0, 212, 170, 0.4);
          background: rgba(0, 212, 170, 0.08);
          color: var(--forge-accent-primary, #00D4AA);
        }

        .default-radio input:disabled {
          cursor: not-allowed;
        }

        .default-radio input:disabled + span {
          opacity: 0.5;
        }

        .mono {
          font-family: var(--forge-font-mono, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
        }

        .colors-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--forge-border-default, #1a1a2e);
        }

        .colors-title {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          color: var(--forge-text-secondary, #a0a0a0);
          margin-bottom: 8px;
        }

        .color-row {
          display: grid;
          grid-template-columns: 1fr 44px 120px auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .color-add {
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          background: var(--forge-bg-surface, #12121a);
          padding: 10px;
          margin-top: 10px;
        }

        .color-add-row {
          display: grid;
          grid-template-columns: 1fr 44px 120px auto;
          gap: 8px;
          align-items: center;
        }

        .color-picker {
          width: 44px;
          height: 36px;
          padding: 0;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 8px;
          background: var(--forge-bg-elevated, #1a1a2e);
          cursor: pointer;
        }

        .color-row-errors {
          margin-top: -6px;
          margin-bottom: 8px;
        }

        .field {
          margin-top: 10px;
        }

        .field label {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-secondary, #a0a0a0);
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .nested {
          margin-left: 6px;
          padding-left: 10px;
          border-left: 3px solid var(--forge-border-default, #1a1a2e);
          margin-top: 10px;
        }

        .input-with-unit {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .input {
          width: 100%;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          background: var(--forge-bg-elevated, #1a1a2e);
          color: var(--forge-text-primary, #e0e0e0);
        }

        .input:focus {
          outline: none;
          border-color: var(--forge-accent-primary, #00D4AA);
          box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.15);
        }

        .input-error {
          border-color: var(--forge-error, #FF4757) !important;
          box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.15);
        }

        .unit {
          font-size: 13px;
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          color: var(--forge-text-muted, #666680);
          white-space: nowrap;
          min-width: 46px;
          text-align: right;
        }

        .select {
          width: 100%;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          background: var(--forge-bg-elevated, #1a1a2e);
          color: var(--forge-text-primary, #e0e0e0);
        }

        .select:focus {
          outline: none;
          border-color: var(--forge-accent-primary, #00D4AA);
        }

        .help-text {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: var(--forge-text-muted, #666680);
        }

        .divider {
          height: 1px;
          background: var(--forge-border-default, #1a1a2e);
          margin: 12px 0;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
          color: var(--forge-text-secondary, #a0a0a0);
          margin-top: 8px;
        }

        .toggle.mini {
          font-size: 13px;
          color: var(--forge-text-muted, #666680);
          margin-top: 0;
        }

        .toggle input {
          width: 16px;
          height: 16px;
          accent-color: var(--forge-accent-primary, #00D4AA);
        }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          margin-top: 4px;
        }

        .toggle-row input {
          width: 16px;
          height: 16px;
          accent-color: var(--forge-accent-primary, #00D4AA);
        }

        .toggle-label {
          font-weight: 600;
          color: var(--forge-text-primary, #e0e0e0);
          font-size: 14px;
        }

        .hint {
          display: inline-flex;
          align-items: center;
          color: var(--forge-text-muted, #666680);
        }

        .hint:hover {
          color: var(--forge-text-secondary, #a0a0a0);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 10px;
        }

        .grid-2 .full {
          grid-column: 1 / -1;
        }

        @media (max-width: 680px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }

        .radio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--forge-text-secondary, #a0a0a0);
          cursor: pointer;
        }

        .radio input {
          width: 16px;
          height: 16px;
          accent-color: var(--forge-accent-primary, #00D4AA);
        }

        .empty-state {
          text-align: center;
          padding: 26px 12px;
          color: var(--forge-text-muted, #666680);
          border: 1px dashed var(--forge-border-default, #1a1a2e);
          border-radius: 10px;
          background: var(--forge-bg-void, #0a0a0f);
        }

        .empty-state h3 {
          margin: 10px 0 6px;
          font-size: 16px;
          color: var(--forge-text-secondary, #a0a0a0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
        }

        .field-error {
          margin-top: 6px;
          font-size: 12px;
          color: var(--forge-error, #FF4757);
        }

        .preview {
          position: relative;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
        }

        .breakdown {
          margin-top: 12px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-void, #0a0a0f);
          border-radius: 10px;
          padding: 12px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          font-size: 13px;
          color: var(--forge-text-secondary, #a0a0a0);
          padding: 6px 0;
        }

        .breakdown-row strong {
          font-weight: 800;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }

        .breakdown-row.total {
          font-size: 14px;
        }

        .breakdown-row.total strong {
          color: var(--forge-accent-primary, #00D4AA);
        }

        .muted {
          color: var(--forge-text-muted, #666680);
          font-weight: 500;
          font-size: 12px;
        }

        .flags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .flag {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-surface, #12121a);
          color: var(--forge-text-muted, #666680);
        }

        .flag.warn {
          border-color: rgba(255, 170, 0, 0.3);
          background: rgba(255, 170, 0, 0.06);
          color: var(--forge-warning, #FFB547);
        }

        .flag.info {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.06);
          color: var(--forge-accent-primary, #00D4AA);
        }

        .validation-box {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: var(--forge-radius-md, 8px);
          border: 1px solid rgba(255, 170, 0, 0.3);
          background: rgba(255, 170, 0, 0.06);
          color: var(--forge-warning, #FFB547);
          font-size: 13px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--forge-text-muted, #666680);
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
        }

        /* === PRICING SUMMARY BAR === */
        .pricing-summary-bar {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 8px 14px;
          background: var(--forge-bg-surface, #12121a);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          margin-bottom: 12px;
          overflow-x: auto;
        }
        .psb-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          white-space: nowrap;
        }
        .psb-label {
          font-size: 10px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-muted, #666680);
          font-weight: 600;
        }
        .psb-value {
          font-size: 13px;
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          color: var(--forge-text-primary, #e0e0e0);
          font-weight: 700;
        }
        .psb-sep {
          width: 1px;
          height: 20px;
          background: var(--forge-border-default, #1a1a2e);
          flex-shrink: 0;
        }

        /* === COLLAPSIBLE CARD === */
        .card-header--collapsible {
          cursor: pointer;
          user-select: none;
          transition: background-color 120ms;
          border-radius: var(--forge-radius-md, 8px);
          margin: -4px -4px 12px -4px;
          padding: 4px;
        }
        .card-header--collapsible:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .collapse-chevron {
          color: var(--forge-text-muted, #666680);
          transition: transform 200ms ease;
          flex-shrink: 0;
        }
        .collapse-chevron.expanded {
          transform: rotate(90deg);
        }

        /* === NUMBER STEPPER === */
        .number-stepper-wrap input[type="number"]::-webkit-inner-spin-button,
        .number-stepper-wrap input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* === QUICK TEST FAB === */
        .quick-test-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--forge-accent-primary, #00D4AA);
          color: #0a0a0f;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 212, 170, 0.3);
          transition: transform 120ms, box-shadow 120ms;
          z-index: 900;
        }
        .quick-test-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(0, 212, 170, 0.45);
        }

        /* === QUICK TEST PANEL === */
        .quick-test-overlay {
          position: fixed;
          inset: 0;
          z-index: 950;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 24px;
          background: rgba(0,0,0,0.3);
        }
        .quick-test-panel {
          background: var(--forge-bg-surface, #12121a);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          width: 320px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 16px;
        }
        .qt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .qt-header h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
        }
        .qt-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .qt-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .qt-field label {
          font-size: 10px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-muted, #666680);
          font-weight: 600;
        }
        .qt-field .select {
          padding: 6px 8px;
          font-size: 13px;
        }
        .qt-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .qt-unit {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          color: var(--forge-text-muted, #666680);
          margin-top: -2px;
          text-align: right;
        }
        .qt-result {
          border-top: 1px solid var(--forge-border-default, #1a1a2e);
          padding-top: 10px;
        }
        .qt-result-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 12px;
          color: var(--forge-text-secondary, #a0a0a0);
          padding: 3px 0;
        }
        .qt-result-row strong {
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
        }
        .qt-result-row.qt-total {
          font-size: 14px;
          font-weight: 600;
        }
        .qt-result-row.qt-total strong {
          color: var(--forge-accent-primary, #00D4AA);
          font-size: 16px;
        }
        .qt-divider {
          height: 1px;
          background: var(--forge-border-default, #1a1a2e);
          margin: 6px 0;
        }

        /* === MATERIAL SORT BAR === */
        .mat-sort-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .mat-sort-label {
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--forge-text-muted, #666680);
          margin-right: 4px;
        }
        .mat-sort-btn {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--forge-border-default, #1a1a2e);
          background: var(--forge-bg-surface, #12121a);
          color: var(--forge-text-secondary, #a0a0a0);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 120ms;
        }
        .mat-sort-btn:hover {
          border-color: var(--forge-accent-primary, #00D4AA);
          color: var(--forge-text-primary, #e0e0e0);
        }
        .mat-sort-btn.active {
          background: rgba(0, 212, 170, 0.08);
          border-color: rgba(0, 212, 170, 0.3);
          color: var(--forge-accent-primary, #00D4AA);
        }

        /* === ENHANCED MATERIAL CARD === */
        .material-compact-card {
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .material-compact-card.comparing {
          border-color: rgba(0, 212, 170, 0.5);
          box-shadow: 0 0 0 1px rgba(0, 212, 170, 0.2);
        }
        .mcc-compare-check {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 2;
          cursor: pointer;
        }
        .mcc-compare-check input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: var(--forge-accent-primary, #00D4AA);
          cursor: pointer;
        }
        .mcc-body {
          cursor: pointer;
          flex: 1;
        }
        .mcc-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .mcc-swatch {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .mcc-card-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 120ms;
        }
        .material-compact-card:hover .mcc-card-actions {
          opacity: 1;
        }
        .icon-btn-sm {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: var(--forge-text-muted, #666680);
          transition: all 120ms;
        }
        .icon-btn-sm:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--forge-text-primary, #e0e0e0);
        }
        .icon-btn-sm:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .mcc-badge.type {
          background: rgba(100, 120, 255, 0.08);
          color: #8090ff;
          border-color: rgba(100, 120, 255, 0.2);
        }
        .mcc-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 4px;
        }
        .mcc-price-secondary {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .mcc-price-value-sm {
          font-size: 13px;
          font-weight: 600;
          color: var(--forge-text-secondary, #a0a0a0);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }
        .mcc-density {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--forge-text-muted, #666680);
          margin-bottom: 6px;
        }
        .mcc-expand-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          border-top: 1px solid var(--forge-border-default, #1a1a2e);
          cursor: pointer;
          padding: 6px 0 2px;
          margin-top: 6px;
          font-size: 11px;
          color: var(--forge-text-muted, #666680);
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 120ms;
        }
        .mcc-expand-btn:hover {
          color: var(--forge-text-secondary, #a0a0a0);
        }
        .mcc-props-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 12px;
          padding: 6px 0 2px;
        }
        .mcc-prop {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
          color: var(--forge-text-muted, #666680);
          padding: 2px 0;
        }
        .mcc-prop strong {
          font-weight: 600;
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          color: var(--forge-text-secondary, #a0a0a0);
          font-size: 11px;
        }

        /* === COST CALCULATOR === */
        .cost-calc-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .cost-calc-result {
          padding: 10px 16px;
          border: 1px solid rgba(0, 212, 170, 0.2);
          border-radius: var(--forge-radius-md, 8px);
          background: rgba(0, 212, 170, 0.04);
          min-width: 140px;
          text-align: center;
        }
        .cost-calc-result-label {
          font-size: 10px;
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-muted, #666680);
          margin-bottom: 4px;
        }
        .cost-calc-result-value {
          font-size: 20px;
          font-weight: 800;
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          color: var(--forge-accent-primary, #00D4AA);
        }
        .cost-calc-result-secondary {
          font-size: 12px;
          color: var(--forge-text-muted, #666680);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          margin-top: 2px;
        }

        /* === MATERIAL COMPARISON TABLE === */
        .mat-compare-table-wrap {
          overflow-x: auto;
        }
        .mat-compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .mat-compare-table th,
        .mat-compare-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--forge-border-default, #1a1a2e);
        }
        .mat-compare-table th {
          font-size: 13px;
          font-weight: 700;
          color: var(--forge-text-primary, #e0e0e0);
          font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
          background: var(--forge-bg-surface, #12121a);
          white-space: nowrap;
        }
        .mat-compare-table td {
          color: var(--forge-text-secondary, #a0a0a0);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }
        .mat-compare-label {
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace) !important;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 11px !important;
          color: var(--forge-text-muted, #666680) !important;
          white-space: nowrap;
        }
        .mat-compare-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        /* === DIALOG PROPS GRID === */
        .dialog-props-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
        }
        @media (max-width: 680px) {
          .dialog-props-grid {
            grid-template-columns: 1fr;
          }
          .cost-calc-row {
            flex-direction: column;
          }
        }
      `}</style>
      {ConfirmDialogPortal}
    </div>
  );
};

export default AdminPricing;
