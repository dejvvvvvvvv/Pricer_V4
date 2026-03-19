// Admin Fees Configuration Page — V3 (Enhanced UI/UX)
// ------------------------------------------------------------
// Features: Category groups, fee templates, summary dashboard,
// improved cards, live preview in modal, collapsible groups.
// Storage: tenant-scoped V3 (namespace: fees:v3) via adminFeesStorage helpers.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { debug } from '@/lib/debug';
import Icon from '../../components/AppIcon';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { SkeletonCard, SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadFeesConfigV3, saveFeesConfigV3, normalizeFeesConfigV3 } from '../../utils/adminFeesStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import ForgeHelpIcon from '../../components/ui/forge/ForgeHelpIcon';
import { getHelpText } from './helpTexts';
import { safeNum, parseDecimal, finalizeDecimal, parseIntInput } from '@/utils/formatters';

/* ================================================================== */
/* Constants                                                           */
/* ================================================================== */

const QUALITY_PRESETS = [
  { value: 'draft', label_cs: 'Draft', label_en: 'Draft' },
  { value: 'standard', label_cs: 'Standard', label_en: 'Standard' },
  { value: 'fine', label_cs: 'Fine', label_en: 'Fine' },
  { value: 'ultra', label_cs: 'Ultra', label_en: 'Ultra' },
];

const FEE_TYPES = [
  { value: 'flat', label_cs: 'Fixni castka', label_en: 'Flat' },
  { value: 'per_gram', label_cs: 'Podle hmotnosti (Kc/g)', label_en: 'Per gram (CZK/g)' },
  { value: 'per_minute', label_cs: 'Podle casu (Kc/min)', label_en: 'Per minute (CZK/min)' },
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'per_cm3', label_cs: 'Podle objemu (Kc/cm3)', label_en: 'Per volume (CZK/cm3)' },
  { value: 'per_cm2', label_cs: 'Podle povrchu (Kc/cm2)', label_en: 'Per surface (CZK/cm2)' },
  { value: 'per_piece', label_cs: 'Za kus (Kc/kus)', label_en: 'Per piece (CZK/pc)' },
];

const SCOPE_OPTIONS = [
  { value: 'MODEL', label_cs: 'MODEL (za model)', label_en: 'MODEL (per model)' },
  { value: 'ORDER', label_cs: 'ORDER (objednavka)', label_en: 'ORDER (order one-time)' },
];

const CHARGE_BASIS_OPTIONS = [
  { value: 'PER_PIECE', label_cs: 'PER_PIECE (nasobi quantity)', label_en: 'PER_PIECE (multiplies quantity)' },
  { value: 'PER_FILE', label_cs: 'PER_FILE (1x za soubor)', label_en: 'PER_FILE (once per file)' },
];

const NUMERIC_KEYS = new Set(['infill_percent', 'filamentGrams', 'estimatedTimeSeconds', 'volumeCm3', 'surfaceCm2']);
const BOOL_KEYS = new Set(['supports_enabled']);
const ENUM_KEYS = new Set(['material', 'quality_preset']);

const CONDITION_KEYS = [
  { key: 'material', label_cs: 'Material', label_en: 'Material' },
  { key: 'supports_enabled', label_cs: 'Supporty', label_en: 'Supports' },
  { key: 'infill_percent', label_cs: 'Infill (%)', label_en: 'Infill (%)' },
  { key: 'quality_preset', label_cs: 'Preset kvality', label_en: 'Quality preset' },
  { key: 'filamentGrams', label_cs: 'Filament (g)', label_en: 'Filament (g)' },
  { key: 'estimatedTimeSeconds', label_cs: 'Cas (s)', label_en: 'Time (s)' },
  { key: 'volumeCm3', label_cs: 'Objem (cm3)', label_en: 'Volume (cm3)' },
  { key: 'surfaceCm2', label_cs: 'Povrch (cm2)', label_en: 'Surface (cm2)' },
];

const NUM_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'eq', label: '=' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
];

const TEXT_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
];

/* ------------------------------------------------------------------ */
/* Fee category system                                                 */
/* ------------------------------------------------------------------ */

const FEE_CATEGORIES = [
  { key: 'setup', label_cs: 'Nastaveni', label_en: 'Setup fees', icon: 'Settings', color: 'rgba(0, 212, 170, 0.12)', border: 'rgba(0, 212, 170, 0.3)' },
  { key: 'material', label_cs: 'Materialove', label_en: 'Material fees', icon: 'Box', color: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
  { key: 'processing', label_cs: 'Zpracovani', label_en: 'Processing fees', icon: 'Cpu', color: 'rgba(255, 181, 71, 0.12)', border: 'rgba(255, 181, 71, 0.3)' },
  { key: 'shipping', label_cs: 'Doprava', label_en: 'Shipping fees', icon: 'Truck', color: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  { key: 'custom', label_cs: 'Vlastni', label_en: 'Custom fees', icon: 'Tag', color: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
];

const CATEGORY_KEYS = new Set(FEE_CATEGORIES.map(c => c.key));

function mapToCategory(rawCategory) {
  const c = String(rawCategory || '').trim().toLowerCase();
  if (CATEGORY_KEYS.has(c)) return c;
  // fuzzy map common values
  if (c.includes('setup') || c.includes('nastav')) return 'setup';
  if (c.includes('material') || c.includes('filament')) return 'material';
  if (c.includes('process') || c.includes('finish') || c.includes('zprac') || c.includes('postprocess')) return 'processing';
  if (c.includes('ship') || c.includes('doprav') || c.includes('deliver') || c.includes('balen')) return 'shipping';
  return 'custom';
}

/* ------------------------------------------------------------------ */
/* Fee templates                                                       */
/* ------------------------------------------------------------------ */

const FEE_TEMPLATES = [
  {
    key: 'basic',
    label_cs: 'Zakladni',
    label_en: 'Basic',
    desc_cs: 'Nastaveni + doprava',
    desc_en: 'Setup + shipping',
    icon: 'Zap',
    fees: [
      { name: 'Setup fee', type: 'flat', value: 50, scope: 'ORDER', category: 'setup', active: true, required: true, charge_basis: 'PER_FILE' },
      { name: 'Doprava', type: 'flat', value: 89, scope: 'ORDER', category: 'shipping', active: true, required: true, charge_basis: 'PER_FILE' },
    ],
  },
  {
    key: 'standard',
    label_cs: 'Standardni',
    label_en: 'Standard',
    desc_cs: 'Nastaveni + materialovy priplatek + doprava',
    desc_en: 'Setup + material markup + shipping',
    icon: 'Layers',
    fees: [
      { name: 'Setup fee', type: 'flat', value: 50, scope: 'ORDER', category: 'setup', active: true, required: true, charge_basis: 'PER_FILE' },
      { name: 'Materialovy priplatek', type: 'per_gram', value: 0.5, scope: 'MODEL', category: 'material', active: true, required: true, charge_basis: 'PER_PIECE' },
      { name: 'Doprava', type: 'flat', value: 89, scope: 'ORDER', category: 'shipping', active: true, required: true, charge_basis: 'PER_FILE' },
    ],
  },
  {
    key: 'premium',
    label_cs: 'Premium',
    label_en: 'Premium',
    desc_cs: 'Vsechny poplatky (nastaveni, material, zpracovani, doprava)',
    desc_en: 'All fees (setup, material, processing, shipping)',
    icon: 'Crown',
    fees: [
      { name: 'Setup fee', type: 'flat', value: 75, scope: 'ORDER', category: 'setup', active: true, required: true, charge_basis: 'PER_FILE' },
      { name: 'Materialovy priplatek', type: 'per_gram', value: 0.5, scope: 'MODEL', category: 'material', active: true, required: true, charge_basis: 'PER_PIECE' },
      { name: 'Zpracovani povrchu', type: 'flat', value: 30, scope: 'MODEL', category: 'processing', active: true, selectable: true, selected_by_default: false, charge_basis: 'PER_FILE' },
      { name: 'Expresni zpracovani', type: 'percent', value: 25, scope: 'ORDER', category: 'processing', active: true, selectable: true, selected_by_default: false, charge_basis: 'PER_FILE' },
      { name: 'Doprava', type: 'flat', value: 89, scope: 'ORDER', category: 'shipping', active: true, required: true, charge_basis: 'PER_FILE' },
      { name: 'Pojisteni zasilky', type: 'percent', value: 3, scope: 'ORDER', category: 'shipping', active: true, selectable: true, selected_by_default: true, charge_basis: 'PER_FILE' },
    ],
  },
];

/* ================================================================== */
/* Helpers                                                             */
/* ================================================================== */

function clampMin1(v) {
  const n = Math.floor(safeNum(v, 1));
  return n < 1 ? 1 : n;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createId(prefix = 'fee') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch { /* fallback */ }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeFeeUi(fee, idx = 0) {
  const f = fee && typeof fee === 'object' ? deepClone(fee) : {};
  const out = {
    id: String(f.id || '').trim() || createId('fee'),
    name: String(f.name || '').trim() || `Fee ${idx + 1}`,
    active: f.active !== false,
    type: String(f.type || 'flat'),
    value: safeNum(f.value, 0),
    scope: String(f.scope || 'MODEL').toUpperCase() === 'ORDER' ? 'ORDER' : 'MODEL',
    charge_basis: String(f.charge_basis || 'PER_FILE').toUpperCase() === 'PER_PIECE' ? 'PER_PIECE' : 'PER_FILE',
    required: !!f.required,
    selectable: f.selectable !== false,
    selected_by_default: !!f.selected_by_default,
    apply_to_selected_models_enabled: !!f.apply_to_selected_models_enabled,
    category: String(f.category || '').trim(),
    description: String(f.description || '').trim(),
    conditions: Array.isArray(f.conditions) ? f.conditions.map((c) => ({ ...c })) : [],
  };

  const allowedTypes = new Set(FEE_TYPES.map((x) => x.value));
  if (!allowedTypes.has(out.type)) out.type = 'flat';
  if (out.scope === 'ORDER') out.charge_basis = 'PER_FILE';
  if (out.type === 'percent') out.charge_basis = 'PER_FILE';
  if (out.type === 'per_piece' && !f.charge_basis) out.charge_basis = 'PER_PIECE';
  if (out.required) { out.selectable = false; out.selected_by_default = true; }
  else if (!out.selectable) { out.selected_by_default = false; }

  out.conditions = out.conditions
    .map((c) => {
      const cc = c && typeof c === 'object' ? c : {};
      const keyRaw = String(cc.key || '').trim();
      const opRaw = String(cc.op || cc.operator || '').trim();
      const value = cc.value;
      const key = keyRaw === 'support_enabled' ? 'supports_enabled' : keyRaw;
      const op = mapLegacyOp(opRaw);
      if (!key) return null;
      if (BOOL_KEYS.has(key)) return { key, op: 'eq', value: value === true || value === 'true' || value === 1 || value === '1' };
      if (NUMERIC_KEYS.has(key)) return { key, op: op || 'gte', value: value === '' ? '' : safeNum(value, 0) };
      return { key, op: op || 'eq', value: value ?? '' };
    })
    .filter(Boolean);

  return out;
}

function mapLegacyOp(opRaw) {
  const o = String(opRaw || '').trim().toLowerCase();
  if (!o) return '';
  const map = { equals: 'eq', '=': 'eq', eq: 'eq', not_equals: 'neq', '!=': 'neq', neq: 'neq', gt: 'gt', '>': 'gt', lt: 'lt', '<': 'lt', gte: 'gte', '>=': 'gte', lte: 'lte', '<=': 'lte', contains: 'contains' };
  return map[o] || o;
}

function formatMoneyCzk(n) {
  const v = safeNum(n, 0);
  return `${v.toFixed(2)} Kc`;
}

function formatFeeValueShort(fee) {
  const v = safeNum(fee?.value, 0);
  if (fee?.type === 'percent') return `${v.toFixed(1)} %`;
  if (fee?.type === 'per_gram') return `${v.toFixed(2)} Kc/g`;
  if (fee?.type === 'per_minute') return `${v.toFixed(2)} Kc/min`;
  if (fee?.type === 'per_cm3') return `${v.toFixed(2)} Kc/cm3`;
  if (fee?.type === 'per_cm2') return `${v.toFixed(2)} Kc/cm2`;
  if (fee?.type === 'per_piece') return `${v.toFixed(2)} Kc/ks`;
  return `${v.toFixed(2)} Kc`;
}

function labelFor(list, value, cs) {
  const hit = (list || []).find((x) => x.value === value);
  if (!hit) return String(value || '');
  return cs ? hit.label_cs : hit.label_en;
}

function evaluateCondition(cond, ctx) {
  const key = String(cond?.key || '').trim();
  const op = mapLegacyOp(cond?.op || cond?.operator);
  const rawVal = cond?.value;
  const canonicalKey = key === 'support_enabled' ? 'supports_enabled' : key;
  const valueFromCtx = ctx?.[canonicalKey];

  if (BOOL_KEYS.has(canonicalKey)) {
    const want = rawVal === true || rawVal === 'true' || rawVal === 1 || rawVal === '1';
    const got = valueFromCtx === true;
    return { ok: got === want, details: `${got} = ${want}` };
  }
  if (NUMERIC_KEYS.has(canonicalKey)) {
    const got = safeNum(valueFromCtx, NaN);
    const want = safeNum(rawVal, NaN);
    if (!Number.isFinite(got) || !Number.isFinite(want)) return { ok: false, details: 'missing value' };
    if (op === 'gt') return { ok: got > want, details: `${got} > ${want}` };
    if (op === 'lt') return { ok: got < want, details: `${got} < ${want}` };
    if (op === 'eq') return { ok: got === want, details: `${got} = ${want}` };
    if (op === 'gte') return { ok: got >= want, details: `${got} >= ${want}` };
    if (op === 'lte') return { ok: got <= want, details: `${got} <= ${want}` };
    return { ok: false, details: `unknown op (${op})` };
  }
  const got = String(valueFromCtx ?? '').trim().toLowerCase();
  const want = String(rawVal ?? '').trim().toLowerCase();
  if (op === 'neq') return { ok: got !== want, details: `${got} != ${want}` };
  if (op === 'contains') return { ok: got.includes(want), details: `${got} contains ${want}` };
  return { ok: got === want, details: `${got} = ${want}` };
}

function simulateFeeAmount(fee, ctx) {
  const f = normalizeFeeUi(fee);
  if (f.scope === 'MODEL' && f.apply_to_selected_models_enabled && !ctx?.modelSelected) {
    return { amount: 0, note: 'model not selected' };
  }
  if (f.type === 'percent') {
    const base = safeNum(ctx?.percentBase, 0);
    return { amount: base * (safeNum(f.value, 0) / 100), note: `base=${base}` };
  }
  const quantity = clampMin1(ctx?.quantity);
  const multiplier = f.scope === 'MODEL' && f.charge_basis === 'PER_PIECE' ? quantity : 1;
  let units = 1;
  if (f.type === 'per_gram') units = safeNum(ctx?.filamentGrams, 0);
  if (f.type === 'per_minute') units = safeNum(ctx?.estimatedTimeSeconds, 0) / 60;
  if (f.type === 'per_cm3') units = safeNum(ctx?.volumeCm3, 0);
  if (f.type === 'per_cm2') units = safeNum(ctx?.surfaceCm2, 0);
  return { amount: safeNum(f.value, 0) * units * multiplier, note: `units=${units} x mult=${multiplier}` };
}

/* Sample order context for summary calculations */
const SAMPLE_CTX = {
  material: 'pla', supports_enabled: false, infill_percent: 20,
  quality_preset: 'standard', filamentGrams: 50, estimatedTimeSeconds: 3600,
  volumeCm3: 15, surfaceCm2: 80, quantity: 1, percentBase: 1000, modelSelected: true,
};

/* ------------------------------------------------------------------ */
/* Tab definitions for the dialog                                      */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'basics', icon: 'Settings', label_cs: 'Zaklad', label_en: 'Basics' },
  { id: 'calc', icon: 'Calculator', label_cs: 'Vypocet', label_en: 'Calculation' },
  { id: 'widget', icon: 'Eye', label_cs: 'Widget', label_en: 'Widget' },
  { id: 'conditions', icon: 'Filter', label_cs: 'Podminky', label_en: 'Conditions' },
  { id: 'preview', icon: 'Play', label_cs: 'Preview', label_en: 'Preview' },
];

/* ================================================================== */
/* Component                                                           */
/* ================================================================== */

const AdminFees = () => {
  const { t, language } = useLanguage();
  const cs = language === 'cs';
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('ALL');
  const [filterActive, setFilterActive] = useState('ALL');
  const [filterRequired, setFilterRequired] = useState('ALL');
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  /* Dialog states */
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [feeDraft, setFeeDraft] = useState(null);
  const [activeTab, setActiveTab] = useState('basics');
  const [materials, setMaterials] = useState([]);

  const [sim, setSim] = useState({
    material: '', supports_enabled: false, infill_percent: 20,
    quality_preset: 'standard', filamentGrams: 50, estimatedTimeSeconds: 3600,
    volumeCm3: 0, surfaceCm2: 0, quantity: 1, percentBase: 1000, modelSelected: true,
  });

  /* ---------------------------------------------------------------- */
  /* Init                                                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    try {
      const cfg = loadFeesConfigV3();
      const normalized = normalizeFeesConfigV3(cfg);
      setFees(normalized.fees || []);
      setSavedSnapshot(JSON.stringify((normalized.fees || []).map((f, idx) => normalizeFeeUi(f, idx))));
      const pricing = loadPricingConfigV3();
      const mats = Array.isArray(pricing?.materials) ? pricing.materials.filter((m) => m?.enabled !== false) : [];
      setMaterials(mats);
      const firstKey = mats?.[0]?.key || '';
      setSim((prev) => ({ ...prev, material: prev.material || firstKey }));
      setLoading(false);
    } catch (e) {
      debug('[AdminFees] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: t('admin.fees.loadError', 'Failed to load fees config.') });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /* Derived / memos                                                   */
  /* ---------------------------------------------------------------- */

  const dirty = useMemo(() => {
    return savedSnapshot !== JSON.stringify((fees || []).map((f, idx) => normalizeFeeUi(f, idx)));
  }, [fees, savedSnapshot]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const normalizedFees = useMemo(() => {
    return (fees || []).map((f, idx) => normalizeFeeUi(f, idx));
  }, [fees]);

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedFees.filter((f) => {
      if (filterScope !== 'ALL' && f.scope !== filterScope) return false;
      if (filterActive === 'ACTIVE' && !f.active) return false;
      if (filterActive === 'INACTIVE' && f.active) return false;
      if (filterRequired === 'REQUIRED' && !f.required) return false;
      if (filterRequired === 'OPTIONAL' && f.required) return false;
      if (!q) return true;
      const hay = `${f.name} ${f.category} ${f.description} ${f.type} ${f.scope}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedFees, search, filterScope, filterActive, filterRequired]);

  /* Group fees by category */
  const groupedFees = useMemo(() => {
    const groups = {};
    FEE_CATEGORIES.forEach(cat => { groups[cat.key] = []; });
    filteredFees.forEach(f => {
      const catKey = mapToCategory(f.category);
      if (!groups[catKey]) groups[catKey] = [];
      groups[catKey].push(f);
    });
    return groups;
  }, [filteredFees]);

  /* Summary stats */
  const summary = useMemo(() => {
    const all = normalizedFees;
    const active = all.filter(f => f.active);
    const modelFees = active.filter(f => f.scope === 'MODEL');
    const orderFees = active.filter(f => f.scope === 'ORDER');

    let totalImpact = 0;
    active.forEach(f => {
      const conds = f.conditions || [];
      const condResults = conds.map(c => evaluateCondition(c, SAMPLE_CTX));
      const match = condResults.every(r => r.ok);
      if (match) {
        const r = simulateFeeAmount(f, SAMPLE_CTX);
        totalImpact += r.amount;
      }
    });

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      model: modelFees.length,
      order: orderFees.length,
      sampleImpact: totalImpact,
    };
  }, [normalizedFees]);

  const validation = useMemo(() => {
    const errors = [];
    (fees || []).forEach((raw, idx) => {
      const f = normalizeFeeUi(raw, idx);
      if (!String(f.name || '').trim()) errors.push({ id: f.id, field: 'name' });
      if (!Number.isFinite(Number(f.value))) errors.push({ id: f.id, field: 'value' });
      (f.conditions || []).forEach((c, cIdx) => {
        const key = String(c?.key || '').trim();
        if (!key) errors.push({ id: f.id, field: `cond_${cIdx}` });
        if (BOOL_KEYS.has(key)) return;
        const op = mapLegacyOp(c?.op || c?.operator);
        if (!op) errors.push({ id: f.id, field: `cond_${cIdx}` });
        const v = c?.value;
        if (v === null || v === undefined || v === '') errors.push({ id: f.id, field: `cond_${cIdx}` });
      });
    });
    return { isValid: errors.length === 0, errors };
  }, [fees]);

  const materialOptions = useMemo(() => {
    return (materials || []).filter((m) => m?.enabled !== false).map((m) => ({ value: m.key, label: `${m.name} (${m.key})` }));
  }, [materials]);

  const draftValid = useMemo(() => {
    if (!feeDraft) return false;
    if (!String(feeDraft.name || '').trim()) return false;
    if (!Number.isFinite(Number(feeDraft.value))) return false;
    for (const c of (feeDraft.conditions || [])) {
      const key = String(c?.key || '').trim();
      if (!key) return false;
      if (BOOL_KEYS.has(key)) continue;
      const op = mapLegacyOp(c?.op || c?.operator);
      if (!op) return false;
      const v = c?.value;
      if (v === null || v === undefined || v === '') return false;
    }
    return true;
  }, [feeDraft]);

  const simResult = useMemo(() => {
    if (!feeDraft) return null;
    const ctx = {
      material: sim.material, supports_enabled: !!sim.supports_enabled,
      infill_percent: safeNum(sim.infill_percent, 0), quality_preset: sim.quality_preset,
      filamentGrams: safeNum(sim.filamentGrams, 0), estimatedTimeSeconds: safeNum(sim.estimatedTimeSeconds, 0),
      volumeCm3: safeNum(sim.volumeCm3, 0), surfaceCm2: safeNum(sim.surfaceCm2, 0),
      quantity: clampMin1(sim.quantity), percentBase: safeNum(sim.percentBase, 0), modelSelected: !!sim.modelSelected,
    };
    const conds = feeDraft.conditions || [];
    const results = conds.map((c) => { const r = evaluateCondition(c, ctx); return { cond: c, ok: r.ok, details: r.details }; });
    const match = results.every((r) => r.ok);
    const amt = match ? simulateFeeAmount(feeDraft, ctx) : { amount: 0, note: 'NO MATCH' };
    return { match, results, amount: amt.amount, note: amt.note };
  }, [feeDraft, sim]);

  /* Live preview amount in dialog */
  const livePreviewAmount = useMemo(() => {
    if (!feeDraft) return null;
    const r = simulateFeeAmount(feeDraft, SAMPLE_CTX);
    return r.amount;
  }, [feeDraft]);

  const conditionUi = (cond, idx) => {
    const key = String(cond?.key || '').trim();
    const op = mapLegacyOp(cond?.op || cond?.operator);
    const isBool = BOOL_KEYS.has(key);
    const isNum = NUMERIC_KEYS.has(key);
    const ops = isNum ? NUM_OPERATORS : isBool ? [{ value: 'eq', label: '=' }] : TEXT_OPERATORS;
    return { key, op: op || (isNum ? 'gte' : 'eq'), ops, isBool, isNum, isEnum: ENUM_KEYS.has(key), value: cond?.value, idx };
  };

  /* ---------------------------------------------------------------- */
  /* Fee CRUD handlers                                                 */
  /* ---------------------------------------------------------------- */

  const addFee = useCallback((overrides) => {
    const id = createId('fee');
    const next = normalizeFeeUi({
      id, name: t('admin.fees.newFee', 'New fee'), active: true,
      type: 'flat', value: 0, scope: 'MODEL', charge_basis: 'PER_FILE',
      required: false, selectable: true, selected_by_default: false,
      apply_to_selected_models_enabled: false, category: 'custom', description: '', conditions: [],
      ...(overrides || {}),
    });
    setFees((prev) => [next, ...(prev || [])]);
    setFeeDraft(deepClone(next));
    setEditingFeeId(id);
    setActiveTab('basics');
    setBanner(null);
  }, [cs]);

  const duplicateFee = (fee) => {
    const src = normalizeFeeUi(fee);
    return normalizeFeeUi({ ...deepClone(src), id: createId('fee'), name: `${src.name} (copy)`, active: src.active });
  };

  const removeFee = async (id) => {
    const ok = await confirm({ title: t('admin.fees.deleteTitle', 'Delete fee'), message: t('admin.fees.deleteMsg', 'Delete this fee?'), confirmLabel: t('admin.fees.deleteConfirm', 'Delete'), destructive: true });
    if (!ok) return;
    setFees((prev) => (prev || []).filter((f) => f?.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    if (editingFeeId === id) { setEditingFeeId(null); setFeeDraft(null); }
  };

  /* ---------------------------------------------------------------- */
  /* Dialog                                                            */
  /* ---------------------------------------------------------------- */

  const openFeeDialog = (feeId) => {
    const raw = (fees || []).find(f => f?.id === feeId);
    if (!raw) return;
    setFeeDraft(normalizeFeeUi(deepClone(raw)));
    setEditingFeeId(feeId);
    setActiveTab('basics');
  };

  const closeFeeDialog = () => { setEditingFeeId(null); setFeeDraft(null); };

  const saveFeeDialog = () => {
    if (!feeDraft || !editingFeeId) return;
    setFees(prev => (prev || []).map((raw, idx) => {
      const f = normalizeFeeUi(raw, idx);
      if (f.id !== editingFeeId) return raw;
      return normalizeFeeUi(feeDraft, idx);
    }));
    closeFeeDialog();
  };

  const updateFeeDraft = (patch) => {
    setFeeDraft(prev => { if (!prev) return prev; return normalizeFeeUi({ ...prev, ...(patch || {}) }); });
  };

  /* Draft condition handlers */
  const addDraftCondition = () => {
    if (!feeDraft) return;
    const fallbackKey = materialOptions?.[0]?.value ? 'material' : 'quality_preset';
    const next = { key: fallbackKey, op: 'eq', value: fallbackKey === 'quality_preset' ? 'standard' : materialOptions?.[0]?.value || '' };
    updateFeeDraft({ conditions: [...(feeDraft.conditions || []), next] });
  };

  const updateDraftCondition = (idx, patch) => {
    if (!feeDraft) return;
    const list = [...(feeDraft.conditions || [])];
    const cur = list[idx] || {};
    const next = { ...cur, ...(patch || {}) };
    const key = String(next.key || '').trim();
    if (BOOL_KEYS.has(key)) { next.op = 'eq'; if (next.value !== true && next.value !== false) next.value = false; }
    if (NUMERIC_KEYS.has(key)) { next.op = mapLegacyOp(next.op) || 'gte'; next.value = safeNum(next.value, 0); }
    if (key === 'material') { next.op = mapLegacyOp(next.op) || 'eq'; if (next.value === undefined || next.value === null) next.value = ''; }
    if (key === 'quality_preset') { next.op = 'eq'; if (!next.value) next.value = 'standard'; }
    list[idx] = next;
    updateFeeDraft({ conditions: list });
  };

  const removeDraftCondition = (idx) => {
    if (!feeDraft) return;
    const list = [...(feeDraft.conditions || [])];
    list.splice(idx, 1);
    updateFeeDraft({ conditions: list });
  };

  /* ---------------------------------------------------------------- */
  /* Bulk & group actions                                              */
  /* ---------------------------------------------------------------- */

  const toggleSelect = (feeId) => {
    setSelectedIds((prev) => { const s = new Set(prev); if (s.has(feeId)) s.delete(feeId); else s.add(feeId); return Array.from(s); });
  };
  const selectAllFiltered = () => setSelectedIds(filteredFees.map(f => f.id));
  const clearSelection = () => setSelectedIds([]);

  const bulkEnableDisable = (enabled) => {
    if (!selectedIds.length) return;
    setFees(prev => (prev || []).map((raw, idx) => { const f = normalizeFeeUi(raw, idx); if (!selectedSet.has(f.id)) return raw; return { ...f, active: !!enabled }; }));
    setBanner({ type: 'success', text: enabled ? t('admin.fees.enabled', 'Enabled.') : t('admin.fees.disabled', 'Disabled.') });
  };

  const bulkDuplicate = () => {
    if (!selectedIds.length) return;
    const sourceIds = new Set(selectedIds);
    const copies = filteredFees.filter(f => sourceIds.has(f.id)).map(f => duplicateFee(f));
    if (!copies.length) return;
    // Insert each copy directly after its original to keep them in the same category
    setFees(prev => {
      const arr = [...(prev || [])];
      // Insert in reverse order so indices stay valid
      const originals = filteredFees.filter(f => sourceIds.has(f.id));
      for (let i = originals.length - 1; i >= 0; i--) {
        const origIdx = arr.findIndex(f => f?.id === originals[i].id);
        if (origIdx >= 0) {
          arr.splice(origIdx + 1, 0, copies[i]);
        }
      }
      return arr;
    });
    setBanner({ type: 'success', text: t('admin.fees.duplicated', 'Duplicated.') });
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = await confirm({ title: t('admin.fees.deleteSelectedTitle', 'Delete selected'), message: t('admin.fees.deleteSelectedMsg', 'Delete selected items?'), confirmLabel: t('admin.fees.deleteConfirm', 'Delete'), destructive: true });
    if (!ok) return;
    setFees(prev => (prev || []).filter(f => !selectedSet.has(f?.id)));
    if (selectedSet.has(editingFeeId)) { setEditingFeeId(null); setFeeDraft(null); }
    clearSelection();
    setBanner({ type: 'success', text: t('admin.fees.deleted', 'Deleted.') });
  };

  const toggleGroup = (catKey) => {
    setCollapsedGroups(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // Bulk category change
  const bulkChangeCategory = (newCategory) => {
    if (!selectedIds.length || !newCategory) return;
    setFees(prev => (prev || []).map((raw, idx) => {
      const f = normalizeFeeUi(raw, idx);
      if (!selectedSet.has(f.id)) return raw;
      return { ...f, category: newCategory };
    }));
    setBanner({ type: 'success', text: t('admin.fees.categoryChanged', 'Category changed.') });
  };

  // Drag-and-drop within categories
  const [feeDragId, setFeeDragId] = useState(null);
  const [feeDragOverId, setFeeDragOverId] = useState(null);

  const handleFeeDragStart = (e, id) => {
    setFeeDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleFeeDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== feeDragOverId) setFeeDragOverId(id);
  };

  const handleFeeDragLeave = () => {
    setFeeDragOverId(null);
  };

  const handleFeeDrop = (e, targetId) => {
    e.preventDefault();
    setFeeDragOverId(null);
    if (!feeDragId || feeDragId === targetId) { setFeeDragId(null); return; }
    // Reorder within the fees array
    setFees(prev => {
      const arr = [...(prev || [])];
      const srcIdx = arr.findIndex(f => (f?.id || '') === feeDragId);
      const tgtIdx = arr.findIndex(f => (f?.id || '') === targetId);
      if (srcIdx < 0 || tgtIdx < 0) return arr;
      const [moved] = arr.splice(srcIdx, 1);
      arr.splice(tgtIdx, 0, moved);
      return arr;
    });
    setFeeDragId(null);
  };

  const handleFeeDragEnd = () => {
    setFeeDragId(null);
    setFeeDragOverId(null);
  };

  /* ---------------------------------------------------------------- */
  /* Fee Templates                                                     */
  /* ---------------------------------------------------------------- */

  const applyTemplate = async (template) => {
    const tplLabel = cs ? template.label_cs : template.label_en;
    const ok = await confirm({
      title: t('admin.fees.applyTemplateTitle', 'Apply template'),
      message: cs
        ? `Sablona "${tplLabel}" nahradi vsechny stavajici poplatky. Pokracovat?`
        : `Template "${tplLabel}" will replace all existing fees. Continue?`,
      confirmLabel: t('admin.fees.applyTemplateConfirm', 'Replace'),
      destructive: true,
    });
    if (!ok) return;
    const newFees = template.fees.map((tpl, idx) => normalizeFeeUi({ ...tpl, id: createId('fee') }, idx));
    setFees(newFees);
    setShowTemplates(false);
    setSelectedIds([]);
    setEditingFeeId(null);
    setFeeDraft(null);
    setBanner({ type: 'success', text: `${tplLabel} applied.` });
  };

  /* ---------------------------------------------------------------- */
  /* Save                                                              */
  /* ---------------------------------------------------------------- */

  const handleSave = () => {
    setBanner(null);
    if (!validation.isValid) { setBanner({ type: 'error', text: t('admin.fees.formErrors', 'Fix form errors.') }); return; }
    try {
      setSaving(true);
      const normalized = normalizeFeesConfigV3({ schema_version: 3, fees });
      const saved = saveFeesConfigV3(normalized);
      setFees(saved.fees || []);
      setSavedSnapshot(JSON.stringify((saved.fees || []).map((f, idx) => normalizeFeeUi(f, idx))));
      setSaving(false);
      setBanner({ type: 'success', text: t('admin.fees.savedOk', 'Saved') });
    } catch (e) {
      debug('[AdminFees] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: t('admin.fees.saveFailed', 'Save failed.') });
    }
  };

  /* ================================================================ */
  /* Render: loading                                                   */
  /* ================================================================ */

  if (loading) {
    return (
      <div className="af-page">
        <div style={{ display: 'grid', gap: '16px' }}>
          <SkeletonCard textLines={2} />
          <SkeletonTable rows={6} cols={5} />
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /* Render: main                                                      */
  /* ================================================================ */

  return (
    <div className="af-page">
      {/* ---- HEADER ---- */}
      <div className="af-header">
        <div>
          <h1>{t('admin.fees.pageTitle', 'Fees & Discounts')}</h1>
          <p className="af-subtitle">
            {t('admin.fees.pageSubtitle', 'Manage fees, discounts and surcharges organized by category.')}
          </p>
        </div>
        <div className="af-header-actions">
          <div className={`af-status-pill ${dirty ? 'dirty' : 'clean'}`}>
            <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={14} />
            <span>{dirty ? t('admin.fees.unsaved', 'Unsaved') : t('admin.fees.saved', 'Saved')}</span>
          </div>
          <button className="af-btn af-btn-ghost" onClick={() => setShowTemplates(true)}>
            <Icon name="FileText" size={16} />
            {t('admin.fees.templates', 'Templates')}
          </button>
          <button className="af-btn af-btn-secondary" onClick={() => addFee()}>
            <Icon name="Plus" size={16} />
            {t('admin.fees.newFee', 'New fee')}
          </button>
          <button className="af-btn af-btn-primary" onClick={handleSave} disabled={!dirty || saving || !validation.isValid}>
            <Icon name="Save" size={16} />
            {saving ? t('admin.fees.saving', 'Saving...') : t('admin.fees.save', 'Save')}
          </button>
        </div>
      </div>

      {/* ---- BANNER ---- */}
      {banner && (
        <div className={`af-banner af-banner-${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={16} />
          <span>{banner.text}</span>
          <button className="af-banner-close" onClick={() => setBanner(null)}><Icon name="X" size={14} /></button>
        </div>
      )}

      {/* ---- SUMMARY CARDS ---- */}
      <div className="af-summary">
        <div className="af-stat-card">
          <div className="af-stat-icon"><Icon name="Hash" size={18} /></div>
          <div>
            <div className="af-stat-value">{summary.active} <span className="af-stat-sub">/ {summary.total}</span></div>
            <div className="af-stat-label">{t('admin.fees.activeFees', 'Active fees')}</div>
          </div>
        </div>
        <div className="af-stat-card">
          <div className="af-stat-icon af-stat-icon-model"><Icon name="Cube" size={18} /></div>
          <div>
            <div className="af-stat-value">{summary.model}</div>
            <div className="af-stat-label">MODEL fees <ForgeHelpIcon text={getHelpText('fees_scope_model', language)} position="bottom" size={14} /></div>
          </div>
        </div>
        <div className="af-stat-card">
          <div className="af-stat-icon af-stat-icon-order"><Icon name="ShoppingCart" size={18} /></div>
          <div>
            <div className="af-stat-value">{summary.order}</div>
            <div className="af-stat-label">ORDER fees <ForgeHelpIcon text={getHelpText('fees_scope_order', language)} position="bottom" size={14} /></div>
          </div>
        </div>
        <div className="af-stat-card">
          <div className="af-stat-icon af-stat-icon-impact"><Icon name="TrendingUp" size={18} /></div>
          <div>
            <div className="af-stat-value">{formatMoneyCzk(summary.sampleImpact)}</div>
            <div className="af-stat-label">{t('admin.fees.sampleImpact', 'Sample order impact')}</div>
          </div>
        </div>
      </div>

      {/* ---- TOOLBAR ---- */}
      <div className="af-toolbar">
        <div className="af-toolbar-left">
          <div className="af-search">
            <Icon name="Search" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.fees.searchPlaceholder', 'Search fee...')} />
          </div>
          <select className="af-filter-select" value={filterScope} onChange={e => setFilterScope(e.target.value)}>
            <option value="ALL">{t('admin.fees.filterAll', 'All')}</option>
            <option value="MODEL">MODEL</option>
            <option value="ORDER">ORDER</option>
          </select>
          <select className="af-filter-select" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
            <option value="ALL">{t('admin.fees.filterAll', 'All')}</option>
            <option value="ACTIVE">{t('admin.fees.filterActive', 'Active')}</option>
            <option value="INACTIVE">{t('admin.fees.filterInactive', 'Inactive')}</option>
          </select>
          <select className="af-filter-select" value={filterRequired} onChange={e => setFilterRequired(e.target.value)}>
            <option value="ALL">{t('admin.fees.filterRequired', 'Required')}</option>
            <option value="REQUIRED">{t('admin.fees.filterRequiredOnly', 'Required only')}</option>
            <option value="OPTIONAL">{t('admin.fees.filterOptionalOnly', 'Optional only')}</option>
          </select>
        </div>
        <div className="af-toolbar-right">
          {selectedIds.length > 0 && (
            <div className="af-bulk">
              <span className="af-bulk-count">{selectedIds.length} {t('admin.fees.selected', 'selected')}</span>
              <button className="af-btn af-btn-xs" onClick={() => bulkEnableDisable(true)} title={t('admin.fees.enabled', 'Enable')}><Icon name="ToggleRight" size={14} /></button>
              <button className="af-btn af-btn-xs" onClick={() => bulkEnableDisable(false)} title={t('admin.fees.disabled', 'Disable')}><Icon name="ToggleLeft" size={14} /></button>
              <button className="af-btn af-btn-xs" onClick={bulkDuplicate} title={t('admin.fees.duplicated', 'Duplicate')}><Icon name="Copy" size={14} /></button>
              <select className="af-filter-select" style={{ fontSize: 11, padding: '3px 6px' }} value="" onChange={(e) => { if (e.target.value) bulkChangeCategory(e.target.value); e.target.value = ''; }} title={t('admin.fees.fieldCategory', 'Change category')}>
                <option value="">{t('admin.fees.category', 'Category...')}</option>
                {FEE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{cs ? c.label_cs : c.label_en}</option>)}
              </select>
              <button className="af-btn af-btn-xs af-btn-danger-xs" onClick={bulkDelete} title={t('admin.fees.delete', 'Delete')}><Icon name="Trash2" size={14} /></button>
            </div>
          )}
          <ForgeCheckbox
            checked={selectedIds.length > 0 && selectedIds.length === filteredFees.length}
            onChange={e => (e.target.checked ? selectAllFiltered() : clearSelection())}
            label={t('admin.fees.filterAll', 'All')}
          />
        </div>
      </div>

      {/* ---- CATEGORY GROUPS ---- */}
      {filteredFees.length === 0 ? (
        <div className="af-empty">
          <Icon name="Tag" size={44} />
          <h3>{t('admin.fees.emptyTitle', 'No fees yet')}</h3>
          <p>{t('admin.fees.emptyHint', 'Add a new fee or use a template.')}</p>
        </div>
      ) : (
        <div className="af-groups">
          {FEE_CATEGORIES.map(cat => {
            const catFees = groupedFees[cat.key] || [];
            if (catFees.length === 0) return null;
            const isCollapsed = !!collapsedGroups[cat.key];

            return (
              <div key={cat.key} className="af-group" style={{ '--cat-bg': cat.color, '--cat-border': cat.border }}>
                <button className="af-group-header" onClick={() => toggleGroup(cat.key)} type="button">
                  <div className="af-group-left">
                    <div className="af-group-icon"><Icon name={cat.icon} size={16} /></div>
                    <span className="af-group-title">{cs ? cat.label_cs : cat.label_en}</span>
                    <span className="af-group-count">{catFees.length}</span>
                  </div>
                  <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronDown'} size={16} />
                </button>

                {!isCollapsed && (
                  <div className="af-group-body">
                    {catFees.map(f => {
                      const isSelected = selectedSet.has(f.id);
                      const isDiscount = safeNum(f.value, 0) < 0;
                      const isDraggingFee = feeDragId === f.id;
                      const isDragOverFee = feeDragOverId === f.id;

                      return (
                        <div key={f.id}
                          draggable
                          onDragStart={(e) => handleFeeDragStart(e, f.id)}
                          onDragOver={(e) => handleFeeDragOver(e, f.id)}
                          onDragLeave={handleFeeDragLeave}
                          onDrop={(e) => handleFeeDrop(e, f.id)}
                          onDragEnd={handleFeeDragEnd}
                          className={`af-fee-card ${!f.active ? 'af-fee-inactive' : ''}`}
                          style={{
                            opacity: isDraggingFee ? 0.4 : undefined,
                            borderColor: isDragOverFee ? 'var(--forge-accent-primary)' : undefined,
                            background: isDragOverFee ? 'rgba(0,212,170,0.04)' : undefined,
                            boxShadow: isDragOverFee ? '0 0 0 2px rgba(0,212,170,0.15)' : undefined,
                          }}
                          onClick={() => openFeeDialog(f.id)}>
                          <div className="af-fee-check" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => { e.stopPropagation(); toggleSelect(f.id); }}>
                            <span style={{ cursor: 'grab', color: 'var(--forge-text-muted)', display: 'flex', alignItems: 'center' }} onClick={e => e.stopPropagation()} title="Drag to reorder"><Icon name="GripVertical" size={12} /></span>
                            <ForgeCheckbox checked={isSelected} onChange={() => {}} />
                          </div>
                          <div className="af-fee-body">
                            <div className="af-fee-top">
                              <div className="af-fee-name">
                                <span className={`af-dot ${f.active ? 'on' : 'off'}`} />
                                <span className="af-fee-name-text">{f.name}</span>
                                {isDiscount && <span className="af-chip af-chip-discount">{t('admin.fees.discount', 'Discount')}</span>}
                              </div>
                              <div className={`af-fee-amount ${isDiscount ? 'discount' : ''}`}>
                                {formatFeeValueShort(f)}
                              </div>
                            </div>
                            <div className="af-fee-meta">
                              <span className="af-chip">{f.scope}</span>
                              <span className="af-chip">{labelFor(FEE_TYPES, f.type, cs)}</span>
                              {f.scope === 'MODEL' && <span className="af-chip">{f.charge_basis}</span>}
                              <span className="af-chip">{f.required ? t('admin.fees.required', 'Required') : t('admin.fees.optional', 'Optional')}</span>
                              {f.conditions?.length > 0 && <span className="af-chip af-chip-cond"><Icon name="Filter" size={10} /> {f.conditions.length}</span>}
                            </div>
                          </div>
                          <button className="af-fee-del" title={t('admin.fees.delete', 'Delete')} onClick={e => { e.stopPropagation(); removeFee(f.id); }}>
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* Fee Editor Dialog                                             */}
      {/* ============================================================ */}
      <ForgeDialog
        open={!!editingFeeId}
        onClose={closeFeeDialog}
        title={feeDraft?.name || t('admin.fees.editFee', 'Edit fee')}
        maxWidth="800px"
        footer={
          <>
            {livePreviewAmount !== null && (
              <div className="af-dialog-preview">
                <span className="af-dialog-preview-label">{t('admin.fees.samplePrefix', 'Sample:')}</span>
                <span className={`af-dialog-preview-value ${livePreviewAmount < 0 ? 'discount' : ''}`}>{formatMoneyCzk(livePreviewAmount)}</span>
              </div>
            )}
            <div style={{ flex: 1 }} />
            <button className="af-btn af-btn-secondary" onClick={closeFeeDialog}>
              <Icon name="X" size={14} /> {t('admin.fees.cancel', 'Cancel')}
            </button>
            <button className="af-btn af-btn-primary" onClick={saveFeeDialog} disabled={!draftValid}>
              <Icon name="Save" size={14} /> {t('admin.fees.saveChanges', 'Save changes')}
            </button>
          </>
        }
      >
        {feeDraft && (
          <>
            <div className="tab-bar">
              {TABS.map(tab => (
                <button key={tab.id} type="button" className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <Icon name={tab.icon} size={14} /> {cs ? tab.label_cs : tab.label_en}
                </button>
              ))}
            </div>

            {/* ---- TAB: BASICS ---- */}
            {activeTab === 'basics' && (
              <div className="tab-content">
                <div className="af-grid2">
                  <div className="af-field">
                    <label>{t('admin.fees.fieldName', 'Name')}</label>
                    <input className={`af-input ${!String(feeDraft.name || '').trim() ? 'af-input-error' : ''}`} value={feeDraft.name} onChange={e => updateFeeDraft({ name: e.target.value })} placeholder={t('admin.fees.namePlaceholder', 'e.g. Postprocessing')} />
                    {!String(feeDraft.name || '').trim() && <div className="af-field-error">{t('admin.fees.nameRequired', 'Name is required')}</div>}
                  </div>
                  <div className="af-field">
                    <label>{t('admin.fees.fieldCategory', 'Category')}</label>
                    <select className="af-input" value={mapToCategory(feeDraft.category)} onChange={e => updateFeeDraft({ category: e.target.value })}>
                      {FEE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{cs ? c.label_cs : c.label_en}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="af-field">
                    <label>{t('admin.fees.fieldDescription', 'Description')}</label>
                    <textarea className="af-input" rows={2} value={feeDraft.description} onChange={e => updateFeeDraft({ description: e.target.value })} placeholder={t('admin.fees.descPlaceholder', 'Short description...')} />
                  </div>
                </div>
                <div className="af-toggles" style={{ marginTop: 12 }}>
                  <ForgeCheckbox checked={feeDraft.active} onChange={e => updateFeeDraft({ active: e.target.checked })} label={t('admin.fees.fieldActive', 'Active')} />
                </div>
              </div>
            )}

            {/* ---- TAB: CALCULATION ---- */}
            {activeTab === 'calc' && (
              <div className="tab-content">
                <div className="af-grid2">
                  <div className="af-field">
                    <label>scope <ForgeHelpIcon text={feeDraft.scope === 'ORDER' ? getHelpText('fees_scope_order', language) : getHelpText('fees_scope_model', language)} size={14} /></label>
                    <select className="af-input" value={feeDraft.scope} onChange={e => updateFeeDraft({ scope: e.target.value })}>
                      {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>)}
                    </select>
                  </div>
                  <div className="af-field">
                    <label>type <ForgeHelpIcon text={feeDraft.type === 'percent' ? getHelpText('fees_type_percent', language) : feeDraft.type === 'per_gram' ? getHelpText('fees_type_per_gram', language) : getHelpText('fees_type_flat', language)} size={14} /></label>
                    <select className="af-input" value={feeDraft.type} onChange={e => updateFeeDraft({ type: e.target.value })}>
                      {FEE_TYPES.map(o => <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>)}
                    </select>
                  </div>
                </div>
                <div className="af-grid2" style={{ marginTop: 12 }}>
                  <div className="af-field">
                    <label>{t('admin.fees.fieldValue', 'Value')}</label>
                    <input className={`af-input ${!Number.isFinite(Number(feeDraft.value)) ? 'af-input-error' : ''}`} type="text" inputMode="decimal" value={feeDraft.value ?? ''} onChange={e => updateFeeDraft({ value: parseDecimal(e.target.value) })} onBlur={() => updateFeeDraft({ value: finalizeDecimal(feeDraft.value, 0) })} />
                    <div className="af-help">{feeDraft.type === 'percent' ? (cs ? 'Procenta (zaporne = sleva).' : 'Percent (negative = discount).') : (cs ? 'Zaporne = sleva.' : 'Negative = discount.')}</div>
                    {!Number.isFinite(Number(feeDraft.value)) && <div className="af-field-error">{t('admin.fees.validNumber', 'Enter a valid number')}</div>}
                  </div>
                  <div className="af-field">
                    <label>charge_basis <ForgeHelpIcon text={feeDraft.charge_basis === 'PER_PIECE' ? getHelpText('fees_charge_basis_per_piece', language) : getHelpText('fees_charge_basis_per_file', language)} size={14} /></label>
                    {feeDraft.scope === 'MODEL' && feeDraft.type !== 'percent' ? (
                      <select className="af-input" value={feeDraft.charge_basis} onChange={e => updateFeeDraft({ charge_basis: e.target.value })}>
                        {CHARGE_BASIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>)}
                      </select>
                    ) : (
                      <div className="af-readonly">PER_FILE</div>
                    )}
                    <div className="af-help">{feeDraft.scope === 'ORDER' ? (cs ? '1x za objednavku.' : 'Once per order.') : feeDraft.type === 'percent' ? (cs ? 'Procenta z base castky.' : 'Percent of base amount.') : (cs ? 'PER_PIECE = x qty, PER_FILE = 1x.' : 'PER_PIECE = x qty, PER_FILE = once.')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- TAB: WIDGET ---- */}
            {activeTab === 'widget' && (
              <div className="tab-content">
                <div className="af-toggles">
                  <ForgeCheckbox checked={feeDraft.required} onChange={e => updateFeeDraft({ required: e.target.checked })} label={t('admin.fees.fieldRequired', 'Required (always included)')} />
                  <ForgeCheckbox disabled={feeDraft.required} checked={feeDraft.selectable} onChange={e => updateFeeDraft({ selectable: e.target.checked })} label={t('admin.fees.fieldSelectable', 'Optional (checkbox in widget)')} />
                  <ForgeCheckbox disabled={feeDraft.required || !feeDraft.selectable} checked={feeDraft.selected_by_default} onChange={e => updateFeeDraft({ selected_by_default: e.target.checked })} label={t('admin.fees.fieldSelectedDefault', 'Selected by default')} />
                  <ForgeCheckbox disabled={feeDraft.scope !== 'MODEL'} checked={feeDraft.apply_to_selected_models_enabled} onChange={e => updateFeeDraft({ apply_to_selected_models_enabled: e.target.checked })} label={t('admin.fees.fieldApplySelected', 'Apply to selected models')} />
                </div>
                {feeDraft.scope !== 'MODEL' && <div className="af-help" style={{ marginTop: 8 }}>{t('admin.fees.applyModelOnly', 'Apply-to-selected applies to MODEL scope only.')}</div>}
              </div>
            )}

            {/* ---- TAB: CONDITIONS ---- */}
            {activeTab === 'conditions' && (
              <div className="tab-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="af-help" style={{ margin: 0 }}>{t('admin.fees.condAll', 'All conditions must match (AND).')} <ForgeHelpIcon text={getHelpText('fees_conditions', language)} size={14} /></div>
                  <button className="af-btn af-btn-secondary" onClick={addDraftCondition}><Icon name="Plus" size={14} /> {t('admin.fees.condAdd', 'Add')}</button>
                </div>
                {(feeDraft.conditions || []).length === 0 ? (
                  <div className="af-help">{t('admin.fees.condNone', 'No conditions = fee always matches.')}</div>
                ) : (
                  <div className="af-conditions">
                    {(feeDraft.conditions || []).map((c, idx) => {
                      const cu = conditionUi(c, idx);
                      return (
                        <div key={`${feeDraft.id}_cond_${idx}`} className="af-cond-row">
                          <div className="af-cond-and">{idx === 0 ? '' : 'AND'}</div>
                          <div className="af-cond-grid">
                            <div className="af-field">
                              <label>{t('admin.fees.fieldKey', 'Key')}</label>
                              <select className="af-input" value={cu.key} onChange={e => {
                                const nk = e.target.value;
                                if (nk === 'supports_enabled') updateDraftCondition(idx, { key: nk, op: 'eq', value: false });
                                else if (nk === 'material') updateDraftCondition(idx, { key: nk, op: 'eq', value: materialOptions?.[0]?.value || '' });
                                else if (nk === 'quality_preset') updateDraftCondition(idx, { key: nk, op: 'eq', value: 'standard' });
                                else updateDraftCondition(idx, { key: nk, op: 'gte', value: 0 });
                              }}>
                                {CONDITION_KEYS.map(k => <option key={k.key} value={k.key}>{cs ? k.label_cs : k.label_en}</option>)}
                              </select>
                            </div>
                            <div className="af-field">
                              <label>Op</label>
                              {cu.isBool || cu.key === 'quality_preset' ? (
                                <div className="af-readonly" style={{ textAlign: 'center' }}>=</div>
                              ) : (
                                <select className="af-input" style={{ textAlign: 'center' }} value={cu.op} onChange={e => updateDraftCondition(idx, { op: e.target.value })}>
                                  {cu.ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              )}
                            </div>
                            <div className="af-field">
                              <label>{t('admin.fees.fieldValue', 'Value')}</label>
                              {cu.key === 'material' ? (
                                <select className="af-input" value={String(cu.value ?? '')} onChange={e => updateDraftCondition(idx, { value: e.target.value })}>
                                  <option value="">{cs ? '-- vyber --' : '-- select --'}</option>{/* TODO: t() */}
                                  {materialOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              ) : cu.key === 'quality_preset' ? (
                                <select className="af-input" value={String(cu.value ?? 'standard')} onChange={e => updateDraftCondition(idx, { value: e.target.value })}>
                                  {QUALITY_PRESETS.map(o => <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>)}
                                </select>
                              ) : cu.isBool ? (
                                <select className="af-input" value={cu.value === true ? 'true' : 'false'} onChange={e => updateDraftCondition(idx, { value: e.target.value === 'true' })}>
                                  <option value="false">false</option>
                                  <option value="true">true</option>
                                </select>
                              ) : (
                                <input className="af-input" type="text" inputMode="decimal" value={cu.value ?? ''} onChange={e => updateDraftCondition(idx, { value: parseDecimal(e.target.value) })} onBlur={() => updateDraftCondition(idx, { value: finalizeDecimal(cu.value, 0) })} />
                              )}
                            </div>
                          </div>
                          <button className="af-cond-del" title={t('admin.fees.condRemove', 'Remove')} onClick={() => removeDraftCondition(idx)}><Icon name="X" size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---- TAB: PREVIEW ---- */}
            {activeTab === 'preview' && (
              <div className="tab-content">
                <div className="af-help" style={{ marginBottom: 12 }}>{cs ? 'Simulator pocita hodnotu jednoho fee.' : 'Simulator computes this fee only.'}</div>
                {/* Simulator labels remain as-is (technical/data labels, not translated) */}
                <div className="af-sim-grid">
                  <div className="af-field"><label>Material</label><select className="af-input" value={sim.material} onChange={e => setSim(p => ({ ...p, material: e.target.value }))}>{materialOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div className="af-field"><label>Quality</label><select className="af-input" value={sim.quality_preset} onChange={e => setSim(p => ({ ...p, quality_preset: e.target.value }))}>{QUALITY_PRESETS.map(o => <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>)}</select></div>
                  <div className="af-field"><label>Supports</label><select className="af-input" value={sim.supports_enabled ? 'true' : 'false'} onChange={e => setSim(p => ({ ...p, supports_enabled: e.target.value === 'true' }))}><option value="false">false</option><option value="true">true</option></select></div>
                  <div className="af-field"><label>Infill %</label><input className="af-input" type="text" inputMode="numeric" value={sim.infill_percent ?? ''} onChange={e => setSim(p => ({ ...p, infill_percent: parseIntInput(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, infill_percent: finalizeDecimal(p.infill_percent, 0) }))} /></div>
                  <div className="af-field"><label>Filament (g)</label><input className="af-input" type="text" inputMode="decimal" value={sim.filamentGrams ?? ''} onChange={e => setSim(p => ({ ...p, filamentGrams: parseDecimal(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, filamentGrams: finalizeDecimal(p.filamentGrams, 0) }))} /></div>
                  <div className="af-field"><label>Time (s)</label><input className="af-input" type="text" inputMode="numeric" value={sim.estimatedTimeSeconds ?? ''} onChange={e => setSim(p => ({ ...p, estimatedTimeSeconds: parseIntInput(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, estimatedTimeSeconds: finalizeDecimal(p.estimatedTimeSeconds, 0) }))} /></div>
                  <div className="af-field"><label>Volume (cm3)</label><input className="af-input" type="text" inputMode="decimal" value={sim.volumeCm3 ?? ''} onChange={e => setSim(p => ({ ...p, volumeCm3: parseDecimal(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, volumeCm3: finalizeDecimal(p.volumeCm3, 0) }))} /></div>
                  <div className="af-field"><label>Surface (cm2)</label><input className="af-input" type="text" inputMode="decimal" value={sim.surfaceCm2 ?? ''} onChange={e => setSim(p => ({ ...p, surfaceCm2: parseDecimal(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, surfaceCm2: finalizeDecimal(p.surfaceCm2, 0) }))} /></div>
                  <div className="af-field"><label>Quantity</label><input className="af-input" type="text" inputMode="numeric" value={sim.quantity ?? ''} onChange={e => setSim(p => ({ ...p, quantity: parseIntInput(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, quantity: clampMin1(p.quantity) }))} /></div>
                  <div className="af-field"><label>Percent base (CZK)</label><input className="af-input" type="text" inputMode="decimal" value={sim.percentBase ?? ''} onChange={e => setSim(p => ({ ...p, percentBase: parseDecimal(e.target.value) }))} onBlur={() => setSim(p => ({ ...p, percentBase: finalizeDecimal(p.percentBase, 0) }))} /></div>
                  <div className="af-field"><label>Model selected</label><select className="af-input" value={sim.modelSelected ? 'true' : 'false'} onChange={e => setSim(p => ({ ...p, modelSelected: e.target.value === 'true' }))}><option value="true">true</option><option value="false">false</option></select></div>
                </div>

                {simResult && (
                  <div className="af-sim-result">
                    <div className={`af-sim-pill ${simResult.match ? 'match' : 'nomatch'}`}>
                      <Icon name={simResult.match ? 'CheckCircle2' : 'XCircle'} size={16} />
                      <span>{simResult.match ? 'MATCH' : 'NO MATCH'}</span>
                    </div>
                    <div className="af-sim-amount">
                      <div className="af-help">{cs ? 'Odhad' : 'Estimate'}</div>
                      <div className={`af-sim-amount-value ${simResult.amount < 0 ? 'discount' : ''}`}>{formatMoneyCzk(simResult.amount)}</div>
                      <div className="af-help">{simResult.note}</div>
                    </div>
                    {simResult.results.length > 0 && (
                      <div className="af-sim-why">
                        {simResult.results.map((r, idx) => (
                          <div key={`why_${idx}`} className={`af-why-row ${r.ok ? 'ok' : 'bad'}`}>
                            <span className="af-why-dot" />
                            <span className="af-why-text"><strong>{r.cond.key}</strong> {mapLegacyOp(r.cond.op)} {String(r.cond.value)}</span>
                            <span className="af-why-details">{r.details}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ForgeDialog>

      {/* ============================================================ */}
      {/* Templates Dialog                                              */}
      {/* ============================================================ */}
      <ForgeDialog
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        title={t('admin.fees.templatesTitle', 'Fee Templates')}
        maxWidth="600px"
      >
        <div className="af-templates">
          <div className="af-help" style={{ marginBottom: 16 }}>{t('admin.fees.templatesHint', 'Pick a template — replaces all existing fees.')}</div>
          {FEE_TEMPLATES.map(tpl => (
            <div key={tpl.key} className="af-tpl-card" onClick={() => applyTemplate(tpl)}>
              <div className="af-tpl-icon"><Icon name={tpl.icon} size={22} /></div>
              <div className="af-tpl-body">
                <div className="af-tpl-name">{cs ? tpl.label_cs : tpl.label_en}</div>
                <div className="af-tpl-desc">{cs ? tpl.desc_cs : tpl.desc_en}</div>
                <div className="af-tpl-fees">{tpl.fees.length} {t('admin.fees.tplFees', 'fees')}</div>
              </div>
              <Icon name="ChevronRight" size={18} />
            </div>
          ))}
        </div>
      </ForgeDialog>

      {/* ---- STYLES ---- */}
      <style>{ADMIN_FEES_STYLES}</style>
      <ConfirmDialog />
    </div>
  );
};

/* ================================================================== */
/* Styles                                                              */
/* ================================================================== */

const ADMIN_FEES_STYLES = `
  .af-page {
    padding: 24px;
    max-width: 1320px;
    margin: 0 auto;
    background: var(--forge-bg-void);
    min-height: 100vh;
  }

  /* ---- Header ---- */
  .af-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .af-header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-heading);
  }
  .af-subtitle {
    margin: 4px 0 0 0;
    color: var(--forge-text-secondary);
    font-size: 14px;
    font-family: var(--forge-font-body);
  }
  .af-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  /* ---- Status pill ---- */
  .af-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 11px;
    font-family: var(--forge-font-tech);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-surface);
    color: var(--forge-text-secondary);
  }
  .af-status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
  .af-status-pill.dirty { border-color: rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); color: var(--forge-warning); }

  /* ---- Buttons ---- */
  .af-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: var(--forge-radius-md);
    padding: 8px 14px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid var(--forge-border-default);
    transition: background 100ms ease-out, border-color 100ms ease-out;
    font-family: var(--forge-font-body);
  }
  .af-btn-primary {
    background: var(--forge-accent-primary);
    color: var(--forge-bg-void);
    border-color: var(--forge-accent-primary);
    font-family: var(--forge-font-tech);
    letter-spacing: 0.04em;
  }
  .af-btn-primary:hover { background: var(--forge-accent-primary-h); }
  .af-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .af-btn-secondary {
    background: var(--forge-bg-elevated);
    color: var(--forge-text-primary);
  }
  .af-btn-secondary:hover { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); }
  .af-btn-ghost {
    background: transparent;
    color: var(--forge-text-secondary);
    border-color: transparent;
  }
  .af-btn-ghost:hover { background: var(--forge-bg-elevated); color: var(--forge-text-primary); border-color: var(--forge-border-default); }
  .af-btn-xs {
    padding: 4px 8px;
    font-size: 12px;
    background: var(--forge-bg-elevated);
    color: var(--forge-text-secondary);
  }
  .af-btn-xs:hover { background: var(--forge-bg-overlay); color: var(--forge-text-primary); }
  .af-btn-danger-xs { color: var(--forge-error); }
  .af-btn-danger-xs:hover { background: rgba(255,71,87,0.12); }

  /* ---- Banner ---- */
  .af-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--forge-radius-md);
    margin-bottom: 16px;
    font-size: 13px;
    font-family: var(--forge-font-body);
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-surface);
    color: var(--forge-text-secondary);
  }
  .af-banner-success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.06); color: var(--forge-success); }
  .af-banner-error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.06); color: var(--forge-error); }
  .af-banner-close { background: none; border: none; cursor: pointer; margin-left: auto; color: inherit; padding: 2px; display: flex; }

  /* ---- Summary cards ---- */
  .af-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  @media (max-width: 900px) { .af-summary { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .af-summary { grid-template-columns: 1fr; } }
  .af-stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
  }
  .af-stat-icon {
    width: 36px; height: 36px;
    border-radius: var(--forge-radius-md);
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,212,170,0.1);
    color: var(--forge-accent-primary);
    flex-shrink: 0;
  }
  .af-stat-icon-model { background: rgba(99,102,241,0.1); color: #818cf8; }
  .af-stat-icon-order { background: rgba(59,130,246,0.1); color: #60a5fa; }
  .af-stat-icon-impact { background: rgba(255,181,71,0.1); color: var(--forge-warning); }
  .af-stat-value {
    font-size: 20px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-mono);
    line-height: 1.1;
  }
  .af-stat-sub { font-size: 14px; color: var(--forge-text-muted); font-weight: 600; }
  .af-stat-label { font-size: 11px; color: var(--forge-text-muted); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  /* ---- Toolbar ---- */
  .af-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .af-toolbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .af-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .af-search {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    padding: 7px 10px;
    background: var(--forge-bg-surface);
    color: var(--forge-text-primary);
    transition: border-color 100ms ease-out;
  }
  .af-search:focus-within { border-color: var(--forge-accent-primary); }
  .af-search input { border: none; outline: none; width: 160px; font-size: 13px; background: transparent; color: var(--forge-text-primary); font-family: var(--forge-font-body); }
  .af-search input::placeholder { color: var(--forge-text-muted); }
  .af-filter-select {
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    padding: 7px 10px;
    background: var(--forge-bg-surface);
    color: var(--forge-text-primary);
    font-size: 12px;
    font-family: var(--forge-font-body);
    cursor: pointer;
  }
  .af-bulk {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    background: var(--forge-bg-elevated);
  }
  .af-bulk-count { font-size: 11px; color: var(--forge-text-muted); font-family: var(--forge-font-tech); margin-right: 4px; }

  /* ---- Category groups ---- */
  .af-groups { display: grid; gap: 12px; }
  .af-group {
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
    overflow: hidden;
  }
  .af-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--cat-bg, var(--forge-bg-elevated));
    border: none;
    width: 100%;
    cursor: pointer;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-body);
    font-size: 14px;
    border-bottom: 1px solid var(--cat-border, var(--forge-border-default));
  }
  .af-group-header:hover { filter: brightness(1.05); }
  .af-group-left { display: flex; align-items: center; gap: 10px; }
  .af-group-icon {
    width: 30px; height: 30px;
    border-radius: var(--forge-radius-md);
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.08);
    color: var(--forge-text-primary);
  }
  .af-group-title { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--forge-font-tech); }
  .af-group-count {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    color: var(--forge-text-muted);
    font-family: var(--forge-font-mono);
  }
  .af-group-body { padding: 6px; display: grid; gap: 4px; }

  /* ---- Fee card ---- */
  .af-fee-card {
    display: grid;
    grid-template-columns: 48px 1fr 32px;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--forge-radius-md);
    cursor: pointer;
    background: var(--forge-bg-surface);
    border: 1px solid transparent;
    transition: background 80ms ease-out, border-color 80ms ease-out;
    align-items: center;
  }
  .af-fee-card:hover { background: var(--forge-bg-elevated); border-color: var(--forge-border-default); }
  .af-fee-inactive { opacity: 0.5; }
  .af-fee-check { display: flex; align-items: center; justify-content: center; }
  .af-fee-body { min-width: 0; }
  .af-fee-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .af-fee-name { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .af-dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
  .af-dot.on { background: var(--forge-success); }
  .af-dot.off { background: var(--forge-text-muted); }
  .af-fee-name-text { font-weight: 600; color: var(--forge-text-primary); font-family: var(--forge-font-body); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .af-fee-amount { font-weight: 800; font-family: var(--forge-font-mono); font-size: 14px; color: var(--forge-text-primary); white-space: nowrap; }
  .af-fee-amount.discount { color: var(--forge-accent-secondary); }
  .af-fee-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .af-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    border: 1px solid var(--forge-border-default);
    border-radius: 999px;
    padding: 2px 7px;
    font-size: 10px;
    font-family: var(--forge-font-tech);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--forge-text-muted);
    background: var(--forge-bg-elevated);
  }
  .af-chip-discount { border-color: rgba(255,107,53,0.3); background: rgba(255,107,53,0.08); color: var(--forge-accent-secondary); }
  .af-chip-cond { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); color: #818cf8; }
  .af-fee-del {
    border: none; background: transparent; cursor: pointer;
    color: var(--forge-text-muted);
    padding: 4px;
    border-radius: var(--forge-radius-md);
    display: flex; align-items: center; justify-content: center;
    transition: color 80ms ease-out, background 80ms ease-out;
  }
  .af-fee-del:hover { color: var(--forge-error); background: rgba(255,71,87,0.08); }

  /* ---- Empty state ---- */
  .af-empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--forge-text-muted);
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
  }
  .af-empty h3 { margin: 12px 0 4px 0; color: var(--forge-text-primary); font-family: var(--forge-font-heading); font-size: 16px; }
  .af-empty p { margin: 0; font-size: 13px; font-family: var(--forge-font-body); }

  /* ---- Dialog elements ---- */
  .af-dialog-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--forge-radius-md);
    background: var(--forge-bg-elevated);
    border: 1px solid var(--forge-border-default);
    font-size: 12px;
    font-family: var(--forge-font-tech);
  }
  .af-dialog-preview-label { color: var(--forge-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .af-dialog-preview-value { font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-mono); }
  .af-dialog-preview-value.discount { color: var(--forge-accent-secondary); }

  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--forge-border-default);
    margin: -24px -24px 20px -24px;
    padding: 0 24px;
  }
  .tab-btn {
    padding: 12px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--forge-text-muted);
    font-family: var(--forge-font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 120ms ease-out, border-color 120ms ease-out;
  }
  .tab-btn:hover { color: var(--forge-text-primary); }
  .tab-btn.active { color: var(--forge-accent-primary); border-bottom-color: var(--forge-accent-primary); }
  .tab-content { min-height: 200px; }

  /* ---- Form fields ---- */
  .af-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) { .af-grid2 { grid-template-columns: 1fr; } }
  .af-field label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-text-muted); margin-bottom: 5px; font-family: var(--forge-font-tech); }
  .af-input {
    width: 100%;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    padding: 9px 11px;
    font-size: 14px;
    outline: none;
    background: var(--forge-bg-elevated);
    color: var(--forge-text-primary);
    font-family: var(--forge-font-body);
    transition: border-color 100ms ease-out;
    box-sizing: border-box;
  }
  .af-input:focus { border-color: var(--forge-accent-primary); }
  .af-input-error { border-color: var(--forge-error); background: rgba(255,71,87,0.06); }
  textarea.af-input { resize: vertical; }
  select.af-input, .af-filter-select { cursor: pointer; }
  option { background: var(--forge-bg-elevated); color: var(--forge-text-primary); }
  .af-readonly {
    width: 100%;
    border: 1px dashed var(--forge-border-active);
    border-radius: var(--forge-radius-md);
    padding: 9px 11px;
    font-size: 14px;
    background: var(--forge-bg-void);
    color: var(--forge-text-muted);
    font-family: var(--forge-font-mono);
    box-sizing: border-box;
  }
  .af-help { font-size: 12px; color: var(--forge-text-muted); margin-top: 5px; font-family: var(--forge-font-body); }
  .af-field-error { font-size: 11px; color: var(--forge-error); margin-top: 4px; font-family: var(--forge-font-body); }
  .af-toggles { display: grid; gap: 10px; }

  /* ---- Conditions ---- */
  .af-conditions { display: grid; gap: 8px; }
  .af-cond-row {
    display: grid;
    grid-template-columns: 44px 1fr 32px;
    gap: 8px;
    align-items: end;
    padding: 10px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
    background: var(--forge-bg-void);
  }
  .af-cond-and { font-size: 11px; color: var(--forge-accent-primary); font-weight: 800; letter-spacing: 0.08em; padding-bottom: 10px; font-family: var(--forge-font-tech); }
  .af-cond-grid { display: grid; grid-template-columns: 1fr 100px 1fr; gap: 8px; }
  @media (max-width: 640px) { .af-cond-row { grid-template-columns: 1fr; } .af-cond-and { display: none; } .af-cond-grid { grid-template-columns: 1fr; } }
  .af-cond-del { border: none; background: transparent; cursor: pointer; color: var(--forge-text-muted); padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: var(--forge-radius-md); }
  .af-cond-del:hover { color: var(--forge-error); background: rgba(255,71,87,0.08); }

  /* ---- Simulator ---- */
  .af-sim-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  @media (max-width: 900px) { .af-sim-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .af-sim-grid { grid-template-columns: 1fr; } }
  .af-sim-result {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--forge-border-default);
    display: grid;
    grid-template-columns: 120px 160px 1fr;
    gap: 14px;
    align-items: start;
  }
  @media (max-width: 900px) { .af-sim-result { grid-template-columns: 1fr; } }
  .af-sim-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 6px 10px;
    font-weight: 800;
    font-family: var(--forge-font-tech);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid var(--forge-border-default);
    width: fit-content;
  }
  .af-sim-pill.match { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
  .af-sim-pill.nomatch { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }
  .af-sim-amount-value { font-size: 20px; font-weight: 900; color: var(--forge-text-primary); margin-top: 4px; font-family: var(--forge-font-mono); }
  .af-sim-amount-value.discount { color: var(--forge-accent-secondary); }
  .af-sim-why { display: grid; gap: 6px; }
  .af-why-row {
    display: grid;
    grid-template-columns: 8px 1fr 1fr;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    background: var(--forge-bg-void);
    align-items: center;
    font-size: 12px;
  }
  .af-why-row.ok { border-color: rgba(0,212,170,0.25); background: rgba(0,212,170,0.04); }
  .af-why-row.bad { border-color: rgba(255,71,87,0.25); background: rgba(255,71,87,0.04); }
  .af-why-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--forge-text-muted); }
  .af-why-row.ok .af-why-dot { background: var(--forge-success); }
  .af-why-row.bad .af-why-dot { background: var(--forge-error); }
  .af-why-text { color: var(--forge-text-primary); font-family: var(--forge-font-body); }
  .af-why-details { color: var(--forge-text-muted); text-align: right; font-family: var(--forge-font-mono); }

  /* ---- Templates dialog ---- */
  .af-templates { display: grid; gap: 10px; }
  .af-tpl-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
    background: var(--forge-bg-surface);
    cursor: pointer;
    transition: background 80ms ease-out, border-color 80ms ease-out;
    color: var(--forge-text-secondary);
  }
  .af-tpl-card:hover { background: var(--forge-bg-elevated); border-color: var(--forge-accent-primary); }
  .af-tpl-icon {
    width: 44px; height: 44px;
    border-radius: var(--forge-radius-md);
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,212,170,0.1);
    color: var(--forge-accent-primary);
    flex-shrink: 0;
  }
  .af-tpl-body { flex: 1; min-width: 0; }
  .af-tpl-name { font-weight: 700; color: var(--forge-text-primary); font-family: var(--forge-font-heading); font-size: 15px; }
  .af-tpl-desc { font-size: 13px; color: var(--forge-text-secondary); font-family: var(--forge-font-body); margin-top: 2px; }
  .af-tpl-fees { font-size: 11px; color: var(--forge-text-muted); font-family: var(--forge-font-tech); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* ---- Scrollbar ---- */
  .af-page::-webkit-scrollbar { width: 6px; }
  .af-page::-webkit-scrollbar-track { background: var(--forge-bg-void); }
  .af-page::-webkit-scrollbar-thumb { background: var(--forge-border-active); border-radius: 3px; }
`;

export default AdminFees;
