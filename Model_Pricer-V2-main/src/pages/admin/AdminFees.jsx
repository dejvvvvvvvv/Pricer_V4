// Admin Fees Configuration Page — V3
// ------------------------------------------------------------
// Scope of this page (Chat C): /admin/fees only
// - Single source of truth: tenant-scoped V3 storage (namespace: fees:v3)
// - UX redesign: 2-column layout (List + Editor)
// - Fee model supports: negative discounts, scope MODEL|ORDER, charge_basis PER_PIECE|PER_FILE,
//   typed conditions, apply-to-selected-models toggle (stored; calculator will use later)

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadFeesConfigV3, saveFeesConfigV3, normalizeFeesConfigV3 } from '../../utils/adminFeesStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';

const QUALITY_PRESETS = [
  { value: 'draft', label_cs: 'Draft', label_en: 'Draft' },
  { value: 'standard', label_cs: 'Standard', label_en: 'Standard' },
  { value: 'fine', label_cs: 'Fine', label_en: 'Fine' },
  { value: 'ultra', label_cs: 'Ultra', label_en: 'Ultra' },
];

const FEE_TYPES = [
  { value: 'flat', label_cs: 'Fixní částka', label_en: 'Flat' },
  { value: 'per_gram', label_cs: 'Podle hmotnosti (Kč/g)', label_en: 'Per gram (CZK/g)' },
  { value: 'per_minute', label_cs: 'Podle času (Kč/min)', label_en: 'Per minute (CZK/min)' },
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'per_cm3', label_cs: 'Podle objemu (Kč/cm³)', label_en: 'Per volume (CZK/cm³)' },
  { value: 'per_cm2', label_cs: 'Podle povrchu (Kč/cm²)', label_en: 'Per surface (CZK/cm²)' },
  { value: 'per_piece', label_cs: 'Za kus (Kč/kus)', label_en: 'Per piece (CZK/pc)' },
];

const SCOPE_OPTIONS = [
  { value: 'MODEL', label_cs: 'MODEL (za model)', label_en: 'MODEL (per model)' },
  { value: 'ORDER', label_cs: 'ORDER (objednávka)', label_en: 'ORDER (order one-time)' },
];

const CHARGE_BASIS_OPTIONS = [
  { value: 'PER_PIECE', label_cs: 'PER_PIECE (násobí quantity)', label_en: 'PER_PIECE (multiplies quantity)' },
  { value: 'PER_FILE', label_cs: 'PER_FILE (1× za soubor)', label_en: 'PER_FILE (once per file)' },
];

const NUMERIC_KEYS = new Set([
  'infill_percent',
  'filamentGrams',
  'estimatedTimeSeconds',
  'volumeCm3',
  'surfaceCm2',
]);

const BOOL_KEYS = new Set(['supports_enabled']);
const ENUM_KEYS = new Set(['material', 'quality_preset']);

const CONDITION_KEYS = [
  { key: 'material', label_cs: 'Materiál', label_en: 'Material' },
  { key: 'supports_enabled', label_cs: 'Supporty', label_en: 'Supports' },
  { key: 'infill_percent', label_cs: 'Infill (%)', label_en: 'Infill (%)' },
  { key: 'quality_preset', label_cs: 'Preset kvality', label_en: 'Quality preset' },
  { key: 'filamentGrams', label_cs: 'Filament (g)', label_en: 'Filament (g)' },
  { key: 'estimatedTimeSeconds', label_cs: 'Čas (s)', label_en: 'Time (s)' },
  { key: 'volumeCm3', label_cs: 'Objem (cm³)', label_en: 'Volume (cm³)' },
  { key: 'surfaceCm2', label_cs: 'Povrch (cm²)', label_en: 'Surface (cm²)' },
];

const NUM_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'eq', label: '=' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
];

const TEXT_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
];

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  // normalize types (UI list is the source)
  const allowedTypes = new Set(FEE_TYPES.map((x) => x.value));
  if (!allowedTypes.has(out.type)) out.type = 'flat';

  // Scope rules
  if (out.scope === 'ORDER') out.charge_basis = 'PER_FILE';
  if (out.type === 'percent') out.charge_basis = 'PER_FILE';

  // defaults (helpful UX)
  if (out.type === 'per_piece' && !f.charge_basis) out.charge_basis = 'PER_PIECE';

  // Required rules
  if (out.required) {
    out.selectable = false;
    out.selected_by_default = true;
  } else {
    if (!out.selectable) out.selected_by_default = false;
  }

  // Conditions
  out.conditions = out.conditions
    .map((c) => {
      const cc = c && typeof c === 'object' ? c : {};
      const keyRaw = String(cc.key || '').trim();
      const opRaw = String(cc.op || cc.operator || '').trim();
      const value = cc.value;

      // map a few legacy keys/ops
      const key = keyRaw === 'support_enabled' ? 'supports_enabled' : keyRaw;
      const op = mapLegacyOp(opRaw);

      if (!key) return null;
      if (BOOL_KEYS.has(key)) {
        return { key, op: 'eq', value: value === true || value === 'true' || value === 1 || value === '1' };
      }
      if (NUMERIC_KEYS.has(key)) {
        return { key, op: op || 'gte', value: value === '' ? '' : safeNum(value, 0) };
      }
      // enums / strings
      return { key, op: op || 'eq', value: value ?? '' };
    })
    .filter(Boolean);

  return out;
}

function mapLegacyOp(opRaw) {
  const o = String(opRaw || '').trim().toLowerCase();
  if (!o) return '';
  const map = {
    equals: 'eq',
    '=': 'eq',
    eq: 'eq',

    not_equals: 'neq',
    '!=': 'neq',
    neq: 'neq',

    gt: 'gt',
    '>': 'gt',
    lt: 'lt',
    '<': 'lt',

    gte: 'gte',
    '>=': 'gte',
    lte: 'lte',
    '<=': 'lte',

    contains: 'contains',
  };
  return map[o] || o;
}

function formatMoneyCzk(n) {
  const v = safeNum(n, 0);
  return `${v.toFixed(2)} Kč`;
}

function formatFeeValueForList(fee) {
  const v = safeNum(fee?.value, 0);
  if (fee?.type === 'percent') return `${v.toFixed(2)} %`;
  return formatMoneyCzk(v);
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

  // Normalize known keys
  const canonicalKey = key === 'support_enabled' ? 'supports_enabled' : key;

  const valueFromCtx = ctx?.[canonicalKey];

  if (BOOL_KEYS.has(canonicalKey)) {
    const want = rawVal === true || rawVal === 'true' || rawVal === 1 || rawVal === '1';
    const got = valueFromCtx === true;
    return { ok: got === want, details: `${got ? 'true' : 'false'} = ${want ? 'true' : 'false'}` };
  }

  if (NUMERIC_KEYS.has(canonicalKey)) {
    const got = safeNum(valueFromCtx, NaN);
    const want = safeNum(rawVal, NaN);
    if (!Number.isFinite(got) || !Number.isFinite(want)) return { ok: false, details: 'missing value' };

    if (op === 'gt') return { ok: got > want, details: `${got} > ${want}` };
    if (op === 'lt') return { ok: got < want, details: `${got} < ${want}` };
    if (op === 'eq') return { ok: got === want, details: `${got} = ${want}` };
    if (op === 'gte') return { ok: got >= want, details: `${got} ≥ ${want}` };
    if (op === 'lte') return { ok: got <= want, details: `${got} ≤ ${want}` };

    return { ok: false, details: `unknown op (${op})` };
  }

  // Enums / strings
  const got = String(valueFromCtx ?? '').trim().toLowerCase();
  const want = String(rawVal ?? '').trim().toLowerCase();

  if (op === 'neq') return { ok: got !== want, details: `${got} ≠ ${want}` };
  if (op === 'contains') return { ok: got.includes(want), details: `${got} contains ${want}` };

  return { ok: got === want, details: `${got} = ${want}` };
}

function simulateFeeAmount(fee, ctx) {
  const f = normalizeFeeUi(fee);

  // apply-to-selected-models (admin only sets the flag; calculator will use it later)
  if (f.scope === 'MODEL' && f.apply_to_selected_models_enabled && !ctx?.modelSelected) {
    return { amount: 0, note: 'apply_to_selected_models_enabled: model is not selected' };
  }

  // Percent: needs base amount
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
  if (f.type === 'per_piece') units = 1;
  if (f.type === 'flat') units = 1;

  return { amount: safeNum(f.value, 0) * units * multiplier, note: `units=${units} × mult=${multiplier}` };
}

const AdminFees = () => {
  const { t, language } = useLanguage();
  const cs = language === 'cs';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fees, setFees] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]); // bulk selection

  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('ALL'); // ALL|MODEL|ORDER
  const [filterActive, setFilterActive] = useState('ALL'); // ALL|ACTIVE|INACTIVE
  const [filterRequired, setFilterRequired] = useState('ALL'); // ALL|REQUIRED|OPTIONAL

  const [banner, setBanner] = useState(null); // { type, text }
  const [savedSnapshot, setSavedSnapshot] = useState('');

  const [materials, setMaterials] = useState([]);

  const [sim, setSim] = useState({
    material: '',
    supports_enabled: false,
    infill_percent: 20,
    quality_preset: 'standard',
    filamentGrams: 50,
    estimatedTimeSeconds: 3600,
    volumeCm3: 0,
    surfaceCm2: 0,
    quantity: 1,
    percentBase: 1000,
    modelSelected: true,
  });

  useEffect(() => {
    try {
      const cfg = loadFeesConfigV3();
      const normalized = normalizeFeesConfigV3(cfg);
      setFees(normalized.fees || []);
      setActiveId(normalized.fees?.[0]?.id || null);
      setSavedSnapshot(JSON.stringify(normalized.fees || []));

      const pricing = loadPricingConfigV3();
      const mats = Array.isArray(pricing?.materials) ? pricing.materials.filter((m) => m?.enabled !== false) : [];
      setMaterials(mats);

      // seed simulator material
      const firstKey = mats?.[0]?.key || '';
      setSim((prev) => ({ ...prev, material: prev.material || firstKey }));

      setLoading(false);
    } catch (e) {
      console.error('[AdminFees] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodařilo se načíst Fees konfiguraci.' : 'Failed to load fees config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    return savedSnapshot !== JSON.stringify((fees || []).map((f, idx) => normalizeFeeUi(f, idx)));
  }, [fees, savedSnapshot]);

  const activeFee = useMemo(() => {
    const hit = (fees || []).find((f) => f?.id === activeId);
    return hit ? normalizeFeeUi(hit) : null;
  }, [fees, activeId]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (fees || [])
      .map((f, idx) => normalizeFeeUi(f, idx))
      .filter((f) => {
        if (filterScope !== 'ALL' && f.scope !== filterScope) return false;
        if (filterActive === 'ACTIVE' && !f.active) return false;
        if (filterActive === 'INACTIVE' && f.active) return false;
        if (filterRequired === 'REQUIRED' && !f.required) return false;
        if (filterRequired === 'OPTIONAL' && f.required) return false;

        if (!q) return true;
        const hay = `${f.name} ${f.category} ${f.description} ${f.type} ${f.scope}`.toLowerCase();
        return hay.includes(q);
      });
  }, [fees, search, filterScope, filterActive, filterRequired]);

  const validation = useMemo(() => {
    const errors = [];
    (fees || []).forEach((raw, idx) => {
      const f = normalizeFeeUi(raw, idx);
      if (!String(f.name || '').trim()) errors.push({ id: f.id, field: 'name' });
      if (!Number.isFinite(Number(f.value))) errors.push({ id: f.id, field: 'value' });

      // conditions: allow empty list; validate rows
      (f.conditions || []).forEach((c, cIdx) => {
        const key = String(c?.key || '').trim();
        if (!key) errors.push({ id: f.id, field: `cond_${cIdx}` });
        if (BOOL_KEYS.has(key)) return;
        const op = mapLegacyOp(c?.op || c?.operator);
        if (!op) errors.push({ id: f.id, field: `cond_${cIdx}` });

        // value required except boolean
        const v = c?.value;
        const missing = v === null || v === undefined || v === '';
        if (missing) errors.push({ id: f.id, field: `cond_${cIdx}` });
      });
    });
    return { isValid: errors.length === 0, errors };
  }, [fees]);

  const ui = useMemo(() => {
    return {
      title: cs ? 'Fees (Poplatky)' : 'Fees',
      subtitle: cs
        ? 'Vytvoř poplatky/slevy, nastav scope (MODEL/ORDER), způsob výpočtu, charge basis (PER_PIECE/PER_FILE) a typed podmínky (AND).'
        : 'Create fees/discounts, configure scope (MODEL/ORDER), calculation, charge basis (PER_PIECE/PER_FILE) and typed AND conditions.',

      newFee: cs ? 'Nový poplatek' : 'New fee',
      save: cs ? 'Uložit' : 'Save',
      saving: cs ? 'Ukládám…' : 'Saving…',
      saved: cs ? 'Uloženo' : 'Saved',
      unsaved: cs ? 'Neuložené změny' : 'Unsaved changes',
      invalid: cs ? 'Oprav chyby ve formuláři (např. název / podmínky).' : 'Fix form errors (e.g. name / conditions).',

      search: cs ? 'Hledat…' : 'Search…',
      filters: cs ? 'Filtry' : 'Filters',

      bulk: cs ? 'Hromadné akce' : 'Bulk actions',
      enable: cs ? 'Zapnout' : 'Enable',
      disable: cs ? 'Vypnout' : 'Disable',
      duplicate: cs ? 'Duplikovat' : 'Duplicate',
      del: cs ? 'Smazat' : 'Delete',

      editorTitle: cs ? 'Editor poplatku' : 'Fee editor',
      emptyEditor: cs ? 'Vyber poplatek vlevo.' : 'Select a fee on the left.',

      sectionBasic: cs ? 'Základ' : 'Basics',
      sectionCalc: cs ? 'Výpočet' : 'Calculation',
      sectionWidget: cs ? 'Viditelnost ve widgetu' : 'Widget visibility',
      sectionConditions: cs ? 'Podmínky (AND)' : 'Conditions (AND)',
      sectionPreview: cs ? 'Preview / Simulator' : 'Preview / Simulator',

      required: cs ? 'Povinný (vždy zahrnutý)' : 'Required (always included)',
      selectable: cs ? 'Volitelný (checkbox ve widgetu)' : 'Optional (checkbox in widget)',
      selectedByDefault: cs ? 'Zaškrtnuto defaultně' : 'Selected by default',
      applyToSelected: cs ? 'Apply pouze na selected models' : 'Apply only to selected models',

      confirmDelete: cs ? 'Opravdu smazat vybrané položky?' : 'Delete selected items?',
      noFees: cs ? 'Zatím žádné fees' : 'No fees yet',
      noFeesHint: cs ? 'Klikni na „Nový poplatek“.' : 'Click “New fee”.',

      match: cs ? 'MATCH' : 'MATCH',
      noMatch: cs ? 'NO MATCH' : 'NO MATCH',
      discount: cs ? 'Sleva' : 'Discount',

      simHint: cs
        ? 'Simulator počítá pouze hodnotu jednoho fee (ne celý pricing). Pro percent zadej base částku (subtotal bez percent položek v daném scope).'
        : 'Simulator computes only this fee (not full pricing). For percent, provide base amount (subtotal without percent fees in the same scope).',
    };
  }, [cs]);

  const setFee = (feeId, patch) => {
    setFees((prev) => {
      return (prev || []).map((raw, idx) => {
        const f = normalizeFeeUi(raw, idx);
        if (f.id !== feeId) return raw;
        const next = normalizeFeeUi({ ...f, ...(patch || {}) }, idx);
        return next;
      });
    });
  };

  const addFee = () => {
    const id = createId('fee');
    const next = normalizeFeeUi({
      id,
      name: cs ? 'Nový poplatek' : 'New fee',
      active: true,
      type: 'flat',
      value: 0,
      scope: 'MODEL',
      charge_basis: 'PER_FILE',
      required: false,
      selectable: true,
      selected_by_default: false,
      apply_to_selected_models_enabled: false,
      category: '',
      description: '',
      conditions: [],
    });
    setFees((prev) => [next, ...(prev || [])]);
    setActiveId(id);
    setBanner(null);
  };

  const duplicateFee = (fee) => {
    const src = normalizeFeeUi(fee);
    return normalizeFeeUi({
      ...deepClone(src),
      id: createId('fee'),
      name: `${src.name} (copy)`,
      active: src.active,
    });
  };

  const toggleSelect = (feeId) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(feeId)) s.delete(feeId);
      else s.add(feeId);
      return Array.from(s);
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredFees.map((f) => f.id);
    setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds([]);

  const bulkEnableDisable = (enabled) => {
    if (selectedIds.length === 0) return;
    setFees((prev) =>
      (prev || []).map((raw, idx) => {
        const f = normalizeFeeUi(raw, idx);
        if (!selectedSet.has(f.id)) return raw;
        return { ...f, active: !!enabled };
      })
    );
    setBanner({ type: 'success', text: enabled ? (cs ? 'Zapnuto.' : 'Enabled.') : cs ? 'Vypnuto.' : 'Disabled.' });
  };

  // N5: quick tags (scope / required) in bulkbar
  const bulkSetScope = (nextScope) => {
    if (selectedIds.length === 0) return;
    const scope = String(nextScope || '').toUpperCase() === 'ORDER' ? 'ORDER' : 'MODEL';
    setFees((prev) =>
      (prev || []).map((raw, idx) => {
        const f = normalizeFeeUi(raw, idx);
        if (!selectedSet.has(f.id)) return raw;
        const next = { ...f, scope };
        if (scope === 'ORDER') next.charge_basis = 'PER_FILE';
        if (next.type === 'percent') next.charge_basis = 'PER_FILE';
        return next;
      })
    );
    setBanner({ type: 'success', text: cs ? `Scope nastaveno: ${scope}` : `Scope set: ${scope}` });
  };

  const bulkSetRequired = (nextRequired) => {
    if (selectedIds.length === 0) return;
    const required = !!nextRequired;
    setFees((prev) =>
      (prev || []).map((raw, idx) => {
        const f = normalizeFeeUi(raw, idx);
        if (!selectedSet.has(f.id)) return raw;
        if (required) {
          return { ...f, required: true, selectable: false, selected_by_default: true };
        }
        return { ...f, required: false, selectable: true, selected_by_default: false };
      })
    );
    setBanner({ type: 'success', text: required ? (cs ? 'Nastaveno: Povinné' : 'Set: Required') : cs ? 'Nastaveno: Volitelné' : 'Set: Optional' });
  };

  const bulkDuplicate = () => {
    if (selectedIds.length === 0) return;
    const copies = filteredFees
      .filter((f) => selectedSet.has(f.id))
      .map((f) => duplicateFee(f));
    if (!copies.length) return;
    setFees((prev) => [...copies, ...(prev || [])]);
    setBanner({ type: 'success', text: cs ? 'Duplikováno.' : 'Duplicated.' });
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(ui.confirmDelete);
    if (!ok) return;
    setFees((prev) => (prev || []).filter((f) => !selectedSet.has(f?.id)));
    if (selectedSet.has(activeId)) setActiveId(null);
    clearSelection();
    setBanner({ type: 'success', text: cs ? 'Smazáno.' : 'Deleted.' });
  };

  const handleSave = () => {
    setBanner(null);
    if (!validation.isValid) {
      setBanner({ type: 'error', text: ui.invalid });
      return;
    }

    try {
      setSaving(true);
      const normalized = normalizeFeesConfigV3({ schema_version: 3, fees });
      const saved = saveFeesConfigV3(normalized);
      setFees(saved.fees || []);
      setSavedSnapshot(JSON.stringify(saved.fees || []));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminFees] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Uložení selhalo.' : 'Save failed.' });
    }
  };

  const materialOptions = useMemo(() => {
    const enabled = (materials || []).filter((m) => m?.enabled !== false);
    return enabled.map((m) => ({ value: m.key, label: `${m.name} (${m.key})` }));
  }, [materials]);

  const simResult = useMemo(() => {
    if (!activeFee) return null;
    const ctx = {
      material: sim.material,
      supports_enabled: !!sim.supports_enabled,
      infill_percent: safeNum(sim.infill_percent, 0),
      quality_preset: sim.quality_preset,
      filamentGrams: safeNum(sim.filamentGrams, 0),
      estimatedTimeSeconds: safeNum(sim.estimatedTimeSeconds, 0),
      volumeCm3: safeNum(sim.volumeCm3, 0),
      surfaceCm2: safeNum(sim.surfaceCm2, 0),
      quantity: clampMin1(sim.quantity),
      percentBase: safeNum(sim.percentBase, 0),
      modelSelected: !!sim.modelSelected,
    };

    const conds = activeFee.conditions || [];
    const results = conds.map((c) => {
      const r = evaluateCondition(c, ctx);
      return { cond: c, ok: r.ok, details: r.details };
    });

    const match = results.every((r) => r.ok);
    const amt = match ? simulateFeeAmount(activeFee, ctx) : { amount: 0, note: 'NO MATCH' };

    return {
      match,
      results,
      amount: amt.amount,
      note: amt.note,
    };
  }, [activeFee, sim]);

  const conditionUi = (cond, idx) => {
    const key = String(cond?.key || '').trim();
    const op = mapLegacyOp(cond?.op || cond?.operator);

    const isBool = BOOL_KEYS.has(key);
    const isNum = NUMERIC_KEYS.has(key);
    const isEnum = ENUM_KEYS.has(key);

    const ops = isNum ? NUM_OPERATORS : isBool ? [{ value: 'eq', label: '=' }] : TEXT_OPERATORS;

    return {
      key,
      op: op || (isNum ? 'gte' : 'eq'),
      ops,
      isBool,
      isNum,
      isEnum,
      value: cond?.value,
      idx,
    };
  };

  const addCondition = () => {
    if (!activeFee) return;
    const fallbackKey = materialOptions?.[0]?.value ? 'material' : 'quality_preset';
    const next = { key: fallbackKey, op: 'eq', value: fallbackKey === 'quality_preset' ? 'standard' : materialOptions?.[0]?.value || '' };
    setFee(activeFee.id, { conditions: [...(activeFee.conditions || []), next] });
  };

  const updateCondition = (idx, patch) => {
    if (!activeFee) return;
    const list = [...(activeFee.conditions || [])];
    const cur = list[idx] || {};
    const next = { ...cur, ...(patch || {}) };

    // normalize key-specific defaults
    const key = String(next.key || '').trim();
    if (BOOL_KEYS.has(key)) {
      next.op = 'eq';
      if (next.value !== true && next.value !== false) next.value = false;
    }
    if (NUMERIC_KEYS.has(key)) {
      next.op = mapLegacyOp(next.op) || 'gte';
      next.value = safeNum(next.value, 0);
    }
    if (key === 'material') {
      next.op = mapLegacyOp(next.op) || 'eq';
      if (next.value === undefined || next.value === null) next.value = '';
    }
    if (key === 'quality_preset') {
      next.op = 'eq';
      if (!next.value) next.value = 'standard';
    }

    list[idx] = next;
    setFee(activeFee.id, { conditions: list });
  };

  const removeCondition = (idx) => {
    if (!activeFee) return;
    const list = [...(activeFee.conditions || [])];
    list.splice(idx, 1);
    setFee(activeFee.id, { conditions: list });
  };

  const removeFee = (id) => {
    const ok = window.confirm(cs ? 'Smazat tento poplatek?' : 'Delete this fee?');
    if (!ok) return;
    setFees((prev) => (prev || []).filter((f) => f?.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    if (activeId === id) setActiveId(null);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Loader2" size={18} />
              <span>{cs ? 'Načítám…' : 'Loading…'}</span>
            </div>
          </div>
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

          <button className="btn-secondary" onClick={addFee}>
            <Icon name="Plus" size={18} />
            {ui.newFee}
          </button>

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!dirty || saving || !validation.isValid}
            title={!validation.isValid ? ui.invalid : ''}
          >
            <Icon name="Save" size={18} />
            {saving ? ui.saving : ui.save}
          </button>
        </div>
      </div>

      {banner ? (
        <div className={`banner ${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : banner.type === 'success' ? 'CheckCircle2' : 'Info'} size={18} />
          <span>{banner.text}</span>
        </div>
      ) : null}

      <div className="fees-layout">
        {/* LEFT: LIST */}
        <div className="fees-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{cs ? 'Seznam fees' : 'Fees list'}</h2>
              <span className="muted">{filteredFees.length}</span>
            </div>

            <div className="panel-tools">
              <div className="search">
                <Icon name="Search" size={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ui.search} />
              </div>

              <div className="filters">
                <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)}>
                  <option value="ALL">{cs ? 'Scope: vše' : 'Scope: all'}</option>
                  <option value="MODEL">MODEL</option>
                  <option value="ORDER">ORDER</option>
                </select>

                <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
                  <option value="ALL">{cs ? 'Stav: vše' : 'Status: all'}</option>
                  <option value="ACTIVE">{cs ? 'Aktivní' : 'Active'}</option>
                  <option value="INACTIVE">{cs ? 'Neaktivní' : 'Inactive'}</option>
                </select>

                <select value={filterRequired} onChange={(e) => setFilterRequired(e.target.value)}>
                  <option value="ALL">{cs ? 'Widget: vše' : 'Widget: all'}</option>
                  <option value="REQUIRED">{cs ? 'Povinné' : 'Required'}</option>
                  <option value="OPTIONAL">{cs ? 'Volitelné' : 'Optional'}</option>
                </select>
              </div>
            </div>

            <div className="bulkbar">
              <div className="bulk-left">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredFees.length}
                    onChange={(e) => (e.target.checked ? selectAllFiltered() : clearSelection())}
                  />
                  <span>{cs ? 'Vybrat vše' : 'Select all'}</span>
                </label>

                {selectedIds.length ? <span className="muted">{cs ? `Vybráno: ${selectedIds.length}` : `Selected: ${selectedIds.length}`}</span> : null}
              </div>

              {selectedIds.length ? (
                <div className="bulk-actions">
                  <button className="btn-secondary" onClick={() => bulkEnableDisable(true)}>
                    <Icon name="ToggleRight" size={18} />
                    {ui.enable}
                  </button>
                  <button className="btn-secondary" onClick={() => bulkEnableDisable(false)}>
                    <Icon name="ToggleLeft" size={18} />
                    {ui.disable}
                  </button>
                  <button className="btn-secondary" onClick={bulkDuplicate}>
                    <Icon name="Copy" size={18} />
                    {ui.duplicate}
                  </button>
                  <button className="btn-danger" onClick={bulkDelete}>
                    <Icon name="Trash2" size={18} />
                    {ui.del}
                  </button>

                  {/* N5: quick tags */}
                  <div className="bulk-tags" onClick={(e) => e.stopPropagation()}>
                    <div className="segmented" title={cs ? 'Scope' : 'Scope'}>
                      <button type="button" onClick={() => bulkSetScope('MODEL')}>MODEL</button>
                      <button type="button" onClick={() => bulkSetScope('ORDER')}>ORDER</button>
                    </div>
                    <div className="segmented" title={cs ? 'Widget' : 'Widget'}>
                      <button type="button" onClick={() => bulkSetRequired(true)}>{cs ? 'Povinné' : 'Required'}</button>
                      <button type="button" onClick={() => bulkSetRequired(false)}>{cs ? 'Volitelné' : 'Optional'}</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel-body">
            {filteredFees.length === 0 ? (
              <div className="empty-state">
                <Icon name="Tag" size={44} />
                <h3>{ui.noFees}</h3>
                <p>{ui.noFeesHint}</p>
              </div>
            ) : (
              <div className="fee-list">
                {filteredFees.map((f) => {
                  const isActive = f.id === activeId;
                  const isSelected = selectedSet.has(f.id);
                  const isDiscount = safeNum(f.value, 0) < 0;
                  const typeLabel = labelFor(FEE_TYPES, f.type, cs);
                  const scopeLabel = labelFor(SCOPE_OPTIONS, f.scope, cs);

                  return (
                    <div key={f.id} className={`fee-row ${isActive ? 'active' : ''}`} onClick={() => setActiveId(f.id)}>
                      <div className="fee-row-left" onClick={(e) => e.stopPropagation()}>
                        <label className="checkbox">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(f.id)} />
                        </label>
                      </div>

                      <div className="fee-row-main">
                        <div className="fee-row-top">
                          <div className="fee-name">
                            <span className={`dot ${f.active ? 'on' : 'off'}`} />
                            <span className="name-text">{f.name}</span>
                          </div>
                          <div className="fee-actions">
                            <button className="icon-btn" title={cs ? 'Smazat' : 'Delete'} onClick={(e) => (e.stopPropagation(), removeFee(f.id))}>
                              <Icon name="Trash2" size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="fee-row-bottom">
                          <span className="chip">{scopeLabel}</span>
                          <span className="chip">{typeLabel}</span>
                          <span className="chip">{f.required ? (cs ? 'Povinné' : 'Required') : cs ? 'Volitelné' : 'Optional'}</span>
                          {f.scope === 'MODEL' ? <span className="chip">{f.charge_basis}</span> : null}
                          {f.apply_to_selected_models_enabled ? <span className="chip">apply-to-selected</span> : null}
                          <span className={`value ${isDiscount ? 'discount' : ''}`}>{formatFeeValueForList(f)}</span>
                          {isDiscount ? <span className="chip discount-chip">{ui.discount}</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="fees-editor">
          {!activeFee ? (
            <div className="admin-card">
              <div className="card-body" style={{ padding: 16 }}>
                <div className="empty-editor">
                  <Icon name="MousePointer2" size={44} />
                  <h3>{ui.editorTitle}</h3>
                  <p>{ui.emptyEditor}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION: BASIC */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{ui.sectionBasic}</h2>
                    <p className="card-description">{cs ? 'Název, popis, kategorie a aktivace.' : 'Name, description, category and active toggle.'}</p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Název' : 'Name'}</label>
                      <input
                        className={`input ${validation.errors.some((e) => e.id === activeFee.id && e.field === 'name') ? 'input-error' : ''}`}
                        value={activeFee.name}
                        onChange={(e) => setFee(activeFee.id, { name: e.target.value })}
                        placeholder={cs ? 'Např. Postprocessing' : 'e.g. Postprocessing'}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Kategorie' : 'Category'}</label>
                      <input
                        className="input"
                        value={activeFee.category}
                        onChange={(e) => setFee(activeFee.id, { category: e.target.value })}
                        placeholder={cs ? 'Např. finishing' : 'e.g. finishing'}
                      />
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>{cs ? 'Popis' : 'Description'}</label>
                      <textarea
                        className="input"
                        rows={3}
                        value={activeFee.description}
                        onChange={(e) => setFee(activeFee.id, { description: e.target.value })}
                        placeholder={cs ? 'Krátký popis co fee dělá…' : 'Short description…'}
                      />
                    </div>
                  </div>

                  <div className="toggles">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={activeFee.active}
                        onChange={(e) => setFee(activeFee.id, { active: e.target.checked })}
                      />
                      <span>{cs ? 'Aktivní' : 'Active'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION: CALC */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{ui.sectionCalc}</h2>
                    <p className="card-description">
                      {cs
                        ? 'Scope, typ a hodnota. Hodnota může být záporná (sleva).'
                        : 'Scope, type and value. Value can be negative (discount).'}
                    </p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="grid2">
                    <div className="field">
                      <label>scope</label>
                      <select
                        className="input"
                        value={activeFee.scope}
                        onChange={(e) => setFee(activeFee.id, { scope: e.target.value })}
                      >
                        {SCOPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {cs ? o.label_cs : o.label_en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>type</label>
                      <select
                        className="input"
                        value={activeFee.type}
                        onChange={(e) => setFee(activeFee.id, { type: e.target.value })}
                      >
                        {FEE_TYPES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {cs ? o.label_cs : o.label_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Hodnota' : 'Value'}</label>
                      <input
                        className={`input ${validation.errors.some((e) => e.id === activeFee.id && e.field === 'value') ? 'input-error' : ''}`}
                        type="number"
                        step="0.01"
                        value={activeFee.value}
                        onChange={(e) => setFee(activeFee.id, { value: safeNum(e.target.value, 0) })}
                      />
                      <div className="help">
                        {activeFee.type === 'percent'
                          ? cs
                            ? 'Hodnota v % (může být i záporná => sleva).'
                            : 'Value in % (can be negative => discount).'
                          : cs
                            ? 'Může být záporné číslo (sleva).'
                            : 'Can be negative (discount).'}
                      </div>
                    </div>

                    <div className="field">
                      <label>charge_basis</label>
                      {activeFee.scope === 'MODEL' && activeFee.type !== 'percent' ? (
                        <select
                          className="input"
                          value={activeFee.charge_basis}
                          onChange={(e) => setFee(activeFee.id, { charge_basis: e.target.value })}
                        >
                          {CHARGE_BASIS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {cs ? o.label_cs : o.label_en}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="readonly">PER_FILE</div>
                      )}
                      <div className="help">
                        {activeFee.scope === 'ORDER'
                          ? cs
                            ? 'ORDER scope je vždy 1× za objednávku.'
                            : 'ORDER scope is always once per order.'
                          : activeFee.type === 'percent'
                            ? cs
                              ? 'Percent fee se aplikuje na base částku, ne na quantity.'
                              : 'Percent fee applies to base amount, not quantity.'
                            : cs
                              ? 'PER_PIECE násobí quantity. PER_FILE je 1× za nahraný soubor.'
                              : 'PER_PIECE multiplies quantity. PER_FILE is once per uploaded file.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: WIDGET */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{ui.sectionWidget}</h2>
                    <p className="card-description">
                      {cs
                        ? 'Povinné/volitelné, default select a apply-to-selected-models flag.'
                        : 'Required/optional, default selection and apply-to-selected-models flag.'}
                    </p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="toggles">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={activeFee.required}
                        onChange={(e) => setFee(activeFee.id, { required: e.target.checked })}
                      />
                      <span>{ui.required}</span>
                    </label>

                    <label className={`toggle ${activeFee.required ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={activeFee.required}
                        checked={activeFee.selectable}
                        onChange={(e) => setFee(activeFee.id, { selectable: e.target.checked })}
                      />
                      <span>{ui.selectable}</span>
                    </label>

                    <label className={`toggle ${activeFee.required || !activeFee.selectable ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={activeFee.required || !activeFee.selectable}
                        checked={activeFee.selected_by_default}
                        onChange={(e) => setFee(activeFee.id, { selected_by_default: e.target.checked })}
                      />
                      <span>{ui.selectedByDefault}</span>
                    </label>

                    <label className={`toggle ${activeFee.scope !== 'MODEL' ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={activeFee.scope !== 'MODEL'}
                        checked={activeFee.apply_to_selected_models_enabled}
                        onChange={(e) => setFee(activeFee.id, { apply_to_selected_models_enabled: e.target.checked })}
                      />
                      <span>{ui.applyToSelected}</span>
                    </label>
                  </div>

                  {activeFee.scope !== 'MODEL' ? (
                    <div className="help" style={{ marginTop: 8 }}>
                      {cs ? 'apply-to-selected se týká pouze MODEL scope.' : 'apply-to-selected applies to MODEL scope only.'}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* SECTION: CONDITIONS */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{ui.sectionConditions}</h2>
                    <p className="card-description">
                      {cs
                        ? 'Všechny podmínky musí platit (AND). Podmínky jsou typed podle klíče.'
                        : 'All conditions must match (AND). Conditions are typed by key.'}
                    </p>
                  </div>
                  <button className="btn-secondary" onClick={addCondition}>
                    <Icon name="Plus" size={18} />
                    {cs ? 'Přidat podmínku' : 'Add condition'}
                  </button>
                </div>

                <div className="card-body">
                  {activeFee.conditions.length === 0 ? (
                    <div className="help">{cs ? 'Žádné podmínky → fee platí vždy.' : 'No conditions → fee matches always.'}</div>
                  ) : (
                    <div className="conditions">
                      {activeFee.conditions.map((c, idx) => {
                        const cu = conditionUi(c, idx);

                        return (
                          <div key={`${activeFee.id}_cond_${idx}`} className="cond-row">
                            <div className="cond-and">{idx === 0 ? '' : 'AND'}</div>

                            <div className="cond-grid">
                              <div className="field">
                                <label>{cs ? 'Klíč' : 'Key'}</label>
                                <select
                                  className="input"
                                  value={cu.key}
                                  onChange={(e) => {
                                    const nextKey = e.target.value;
                                    // key change => reset op/value defaults
                                    if (nextKey === 'supports_enabled') updateCondition(idx, { key: nextKey, op: 'eq', value: false });
                                    else if (nextKey === 'material') updateCondition(idx, { key: nextKey, op: 'eq', value: materialOptions?.[0]?.value || '' });
                                    else if (nextKey === 'quality_preset') updateCondition(idx, { key: nextKey, op: 'eq', value: 'standard' });
                                    else updateCondition(idx, { key: nextKey, op: 'gte', value: 0 });
                                  }}
                                >
                                  {CONDITION_KEYS.map((k) => (
                                    <option key={k.key} value={k.key}>
                                      {cs ? k.label_cs : k.label_en}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="field">
                                <label>{cs ? 'Operátor' : 'Operator'}</label>
                                {cu.isBool || cu.key === 'quality_preset' ? (
                                  <div className="readonly">=</div>
                                ) : (
                                  <select
                                    className="input"
                                    value={cu.op}
                                    onChange={(e) => updateCondition(idx, { op: e.target.value })}
                                  >
                                    {cu.ops.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div className="field">
                                <label>{cs ? 'Hodnota' : 'Value'}</label>
                                {cu.key === 'material' ? (
                                  <select
                                    className="input"
                                    value={String(cu.value ?? '')}
                                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  >
                                    <option value="">{cs ? '— vyber materiál —' : '— select material —'}</option>
                                    {materialOptions.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : cu.key === 'quality_preset' ? (
                                  <select
                                    className="input"
                                    value={String(cu.value ?? 'standard')}
                                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  >
                                    {QUALITY_PRESETS.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {cs ? o.label_cs : o.label_en}
                                      </option>
                                    ))}
                                  </select>
                                ) : cu.isBool ? (
                                  <select
                                    className="input"
                                    value={cu.value === true ? 'true' : 'false'}
                                    onChange={(e) => updateCondition(idx, { value: e.target.value === 'true' })}
                                  >
                                    <option value="false">false</option>
                                    <option value="true">true</option>
                                  </select>
                                ) : (
                                  <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    value={safeNum(cu.value, 0)}
                                    onChange={(e) => updateCondition(idx, { value: safeNum(e.target.value, 0) })}
                                  />
                                )}
                              </div>
                            </div>

                            <button className="icon-btn" title={cs ? 'Smazat podmínku' : 'Remove condition'} onClick={() => removeCondition(idx)}>
                              <Icon name="X" size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: PREVIEW */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{ui.sectionPreview}</h2>
                    <p className="card-description">{ui.simHint}</p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="sim-grid">
                    <div className="field">
                      <label>{cs ? 'Material' : 'Material'}</label>
                      <select className="input" value={sim.material} onChange={(e) => setSim((p) => ({ ...p, material: e.target.value }))}>
                        {materialOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>{cs ? 'Quality preset' : 'Quality preset'}</label>
                      <select
                        className="input"
                        value={sim.quality_preset}
                        onChange={(e) => setSim((p) => ({ ...p, quality_preset: e.target.value }))}
                      >
                        {QUALITY_PRESETS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {cs ? o.label_cs : o.label_en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>{cs ? 'Supports' : 'Supports'}</label>
                      <select
                        className="input"
                        value={sim.supports_enabled ? 'true' : 'false'}
                        onChange={(e) => setSim((p) => ({ ...p, supports_enabled: e.target.value === 'true' }))}
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>{cs ? 'Infill (%)' : 'Infill (%)'}</label>
                      <input
                        className="input"
                        type="number"
                        value={sim.infill_percent}
                        onChange={(e) => setSim((p) => ({ ...p, infill_percent: safeNum(e.target.value, 0) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Filament (g)' : 'Filament (g)'}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={sim.filamentGrams}
                        onChange={(e) => setSim((p) => ({ ...p, filamentGrams: safeNum(e.target.value, 0) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Time (s)' : 'Time (s)'}</label>
                      <input
                        className="input"
                        type="number"
                        value={sim.estimatedTimeSeconds}
                        onChange={(e) => setSim((p) => ({ ...p, estimatedTimeSeconds: safeNum(e.target.value, 0) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Volume (cm³)' : 'Volume (cm³)'}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={sim.volumeCm3}
                        onChange={(e) => setSim((p) => ({ ...p, volumeCm3: safeNum(e.target.value, 0) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Surface (cm²)' : 'Surface (cm²)'}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={sim.surfaceCm2}
                        onChange={(e) => setSim((p) => ({ ...p, surfaceCm2: safeNum(e.target.value, 0) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Quantity' : 'Quantity'}</label>
                      <input
                        className="input"
                        type="number"
                        value={sim.quantity}
                        onChange={(e) => setSim((p) => ({ ...p, quantity: clampMin1(e.target.value) }))}
                      />
                    </div>

                    <div className="field">
                      <label>{cs ? 'Percent base (CZK)' : 'Percent base (CZK)'}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={sim.percentBase}
                        onChange={(e) => setSim((p) => ({ ...p, percentBase: safeNum(e.target.value, 0) }))}
                      />
                      <div className="help">
                        {cs
                          ? 'Použije se jen pro type=percent. Zadej base částku (subtotal) bez percent položek ve stejném scope.'
                          : 'Used only for type=percent. Enter base subtotal (without percent items) in the same scope.'}
                      </div>
                    </div>

                    <div className="field">
                      <label>{cs ? 'Model is selected' : 'Model is selected'}</label>
                      <select
                        className="input"
                        value={sim.modelSelected ? 'true' : 'false'}
                        onChange={(e) => setSim((p) => ({ ...p, modelSelected: e.target.value === 'true' }))}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                      <div className="help">{cs ? 'Simuluje apply-to-selected.' : 'Simulates apply-to-selected.'}</div>
                    </div>
                  </div>

                  {simResult ? (
                    <div className="sim-result">
                      <div className={`sim-pill ${simResult.match ? 'match' : 'nomatch'}`}>
                        <Icon name={simResult.match ? 'CheckCircle2' : 'XCircle'} size={18} />
                        <span>{simResult.match ? ui.match : ui.noMatch}</span>
                      </div>

                      <div className="sim-amount">
                        <div className="muted">{cs ? 'Odhad fee částky' : 'Estimated fee amount'}</div>
                        <div className={`amount ${simResult.amount < 0 ? 'discount' : ''}`}>{formatMoneyCzk(simResult.amount)}</div>
                        <div className="help">{simResult.note}</div>
                      </div>

                      <div className="sim-why">
                        <div className="muted">{cs ? 'Proč' : 'Why'}</div>
                        {simResult.results.length === 0 ? (
                          <div className="help">{cs ? 'Bez podmínek → MATCH.' : 'No conditions → MATCH.'}</div>
                        ) : (
                          <div className="why-list">
                            {simResult.results.map((r, idx) => (
                              <div key={`why_${idx}`} className={`why-row ${r.ok ? 'ok' : 'bad'}`}>
                                <span className="why-dot" />
                                <span className="why-text">
                                  <strong>{r.cond.key}</strong> {mapLegacyOp(r.cond.op)} {String(r.cond.value)}
                                </span>
                                <span className="why-details">{r.details}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .admin-page {
          padding: 24px;
          max-width: 1320px;
          margin: 0 auto;
          background: var(--forge-bg-void);
          min-height: 100vh;
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
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }

        .subtitle {
          margin: 4px 0 0 0;
          color: var(--forge-text-secondary);
          font-size: 14px;
          max-width: 760px;
          font-family: var(--forge-font-body);
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
          font-size: 11px;
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          color: var(--forge-text-secondary);
        }

        .status-pill.clean {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.08);
          color: var(--forge-success);
        }

        .status-pill.dirty {
          border-color: rgba(255, 181, 71, 0.3);
          background: rgba(255, 181, 71, 0.08);
          color: var(--forge-warning);
        }

        .btn-primary {
          background: var(--forge-accent-primary);
          color: var(--forge-bg-void);
          border: 1px solid var(--forge-accent-primary);
          border-radius: var(--forge-radius-md);
          padding: 10px 14px;
          font-weight: 600;
          font-family: var(--forge-font-tech);
          font-size: 13px;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .btn-primary:hover {
          background: var(--forge-accent-primary-h);
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 10px 14px;
          font-weight: 600;
          font-family: var(--forge-font-body);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo),
                      border-color var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .btn-secondary:hover {
          background: var(--forge-bg-overlay);
          border-color: var(--forge-border-active);
        }

        .btn-danger {
          background: rgba(255, 71, 87, 0.08);
          color: var(--forge-error);
          border: 1px solid rgba(255, 71, 87, 0.25);
          border-radius: var(--forge-radius-md);
          padding: 10px 14px;
          font-weight: 600;
          font-family: var(--forge-font-body);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .btn-danger:hover {
          background: rgba(255, 71, 87, 0.15);
        }

        .banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--forge-radius-md);
          margin: 10px 0 16px 0;
          font-size: 14px;
          font-family: var(--forge-font-body);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          color: var(--forge-text-secondary);
        }

        .banner.success {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.06);
          color: var(--forge-success);
        }

        .banner.error {
          border-color: rgba(255, 71, 87, 0.3);
          background: rgba(255, 71, 87, 0.06);
          color: var(--forge-error);
        }

        .fees-layout {
          display: grid;
          grid-template-columns: 440px 1fr;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .fees-layout {
            grid-template-columns: 1fr;
          }
        }

        .fees-panel {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          overflow: hidden;
        }

        .panel-header {
          padding: 12px;
          border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
        }

        .panel-title {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .panel-title h2 {
          margin: 0;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-tech);
        }

        .muted {
          color: var(--forge-text-muted);
          font-size: 12px;
          font-family: var(--forge-font-mono);
        }

        .panel-tools {
          display: grid;
          gap: 10px;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 8px 10px;
          background: var(--forge-bg-surface);
          color: var(--forge-text-primary);
          transition: border-color var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .search:focus-within {
          border-color: var(--forge-accent-primary);
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          background: transparent;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
        }

        .search input::placeholder {
          color: var(--forge-text-muted);
        }

        .filters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .filters select {
          width: 100%;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 8px 10px;
          background: var(--forge-bg-surface);
          color: var(--forge-text-primary);
          font-size: 13px;
          font-family: var(--forge-font-body);
        }

        .bulkbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .bulk-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .bulk-tags {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 6px;
          padding-left: 6px;
          border-left: 1px solid var(--forge-border-default);
        }

        .segmented {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          overflow: hidden;
          background: var(--forge-bg-surface);
        }

        .segmented button {
          border: none;
          background: transparent;
          padding: 7px 10px;
          font-size: 11px;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--forge-text-secondary);
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo),
                      color var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .segmented button:hover {
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }

        .segmented button:active {
          background: var(--forge-bg-overlay);
        }

        @media (max-width: 1100px) {
          .bulk-tags {
            width: 100%;
            border-left: 0;
            padding-left: 0;
            margin-left: 0;
            justify-content: flex-end;
          }
        }

        .checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--forge-text-primary);
          user-select: none;
          font-family: var(--forge-font-body);
        }

        .checkbox input[type="checkbox"] {
          accent-color: var(--forge-accent-primary);
        }

        .panel-body {
          max-height: calc(100vh - 260px);
          overflow: auto;
        }

        @media (max-width: 1100px) {
          .panel-body {
            max-height: none;
          }
        }

        .fee-list {
          display: grid;
        }

        .fee-row {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 10px;
          padding: 12px;
          border-bottom: 1px solid var(--forge-border-default);
          cursor: pointer;
          background: var(--forge-bg-surface);
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .fee-row:nth-child(even) {
          background: var(--forge-bg-void);
        }

        .fee-row:hover {
          background: var(--forge-bg-elevated);
        }

        .fee-row.active {
          background: rgba(0, 212, 170, 0.06);
          border-left: 4px solid var(--forge-accent-primary);
          padding-left: 8px;
        }

        .fee-row-left {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 3px;
        }

        .fee-row-left input[type="checkbox"] {
          accent-color: var(--forge-accent-primary);
        }

        .fee-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .fee-name {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
          border: 2px solid var(--forge-border-default);
        }

        .dot.on {
          background: var(--forge-success);
          border-color: var(--forge-success);
        }

        .dot.off {
          background: var(--forge-text-muted);
          border-color: var(--forge-text-muted);
        }

        .name-text {
          font-weight: 700;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
        }

        .fee-row-bottom {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
          align-items: center;
        }

        .chip {
          border: 1px solid var(--forge-border-default);
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--forge-text-secondary);
          background: var(--forge-bg-elevated);
        }

        .discount-chip {
          border-color: rgba(255, 107, 53, 0.3);
          background: rgba(255, 107, 53, 0.08);
          color: var(--forge-accent-secondary);
        }

        .value {
          margin-left: auto;
          font-weight: 800;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-mono);
        }

        .value.discount {
          color: var(--forge-accent-secondary);
        }

        .icon-btn {
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          border-radius: var(--forge-radius-md);
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--forge-text-secondary);
          transition: background var(--forge-duration-micro) var(--forge-ease-out-expo),
                      color var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .icon-btn:hover {
          background: var(--forge-bg-overlay);
          color: var(--forge-text-primary);
        }

        .empty-state {
          padding: 18px;
          text-align: center;
          color: var(--forge-text-muted);
        }

        .empty-state h3 {
          margin: 10px 0 4px 0;
          color: var(--forge-text-primary);
          font-size: 16px;
          font-family: var(--forge-font-heading);
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
          font-family: var(--forge-font-body);
        }

        .fees-editor {
          display: grid;
          gap: 14px;
        }

        .admin-card {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 14px;
          border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
        }

        .card-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }

        .card-description {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: var(--forge-text-secondary);
          max-width: 760px;
          font-family: var(--forge-font-body);
        }

        .card-body {
          padding: 14px;
        }

        .empty-editor {
          text-align: center;
          color: var(--forge-text-muted);
        }

        .empty-editor h3 {
          margin: 10px 0 4px 0;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
        }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--forge-text-muted);
          margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
          transition: border-color var(--forge-duration-micro) var(--forge-ease-out-expo);
        }

        .input:focus {
          border-color: var(--forge-accent-primary);
        }

        .input-error {
          border-color: var(--forge-error);
          background: rgba(255, 71, 87, 0.06);
        }

        textarea.input {
          resize: vertical;
        }

        select.input,
        .filters select {
          cursor: pointer;
        }

        option {
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }

        .readonly {
          width: 100%;
          border: 1px dashed var(--forge-border-active);
          border-radius: var(--forge-radius-md);
          padding: 10px 12px;
          font-size: 14px;
          background: var(--forge-bg-void);
          color: var(--forge-text-muted);
          font-family: var(--forge-font-mono);
        }

        .help {
          font-size: 12px;
          color: var(--forge-text-muted);
          margin-top: 6px;
          font-family: var(--forge-font-body);
        }

        .toggles {
          display: grid;
          gap: 10px;
          margin-top: 6px;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
        }

        .toggle input[type="checkbox"] {
          accent-color: var(--forge-accent-primary);
        }

        .toggle.disabled {
          opacity: 0.4;
        }

        .conditions {
          display: grid;
          gap: 10px;
        }

        .cond-row {
          display: grid;
          grid-template-columns: 50px 1fr 40px;
          gap: 10px;
          align-items: end;
          padding: 10px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          background: var(--forge-bg-void);
        }

        .cond-and {
          font-size: 11px;
          color: var(--forge-accent-primary);
          font-weight: 800;
          letter-spacing: 0.08em;
          padding-bottom: 10px;
          font-family: var(--forge-font-tech);
        }

        .cond-grid {
          display: grid;
          grid-template-columns: 1fr 110px 1fr;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .cond-row {
            grid-template-columns: 1fr;
          }
          .cond-and {
            display: none;
          }
          .cond-grid {
            grid-template-columns: 1fr;
          }
        }

        .sim-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .sim-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .sim-grid {
            grid-template-columns: 1fr;
          }
        }

        .sim-result {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--forge-border-default);
          display: grid;
          grid-template-columns: 130px 180px 1fr;
          gap: 14px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .sim-result {
            grid-template-columns: 1fr;
          }
        }

        .sim-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 800;
          font-family: var(--forge-font-tech);
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid var(--forge-border-default);
          width: fit-content;
        }

        .sim-pill.match {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.08);
          color: var(--forge-success);
        }

        .sim-pill.nomatch {
          border-color: rgba(255, 71, 87, 0.3);
          background: rgba(255, 71, 87, 0.08);
          color: var(--forge-error);
        }

        .sim-amount .amount {
          font-size: 22px;
          font-weight: 900;
          color: var(--forge-text-primary);
          margin-top: 4px;
          font-family: var(--forge-font-mono);
        }

        .sim-amount .amount.discount {
          color: var(--forge-accent-secondary);
        }

        .why-list {
          display: grid;
          gap: 8px;
          margin-top: 8px;
        }

        .why-row {
          display: grid;
          grid-template-columns: 10px 1fr 1fr;
          gap: 10px;
          padding: 8px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          background: var(--forge-bg-void);
          align-items: center;
        }

        .why-row.ok {
          border-color: rgba(0, 212, 170, 0.25);
          background: rgba(0, 212, 170, 0.04);
        }

        .why-row.bad {
          border-color: rgba(255, 71, 87, 0.25);
          background: rgba(255, 71, 87, 0.04);
        }

        .why-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--forge-text-muted);
        }

        .why-row.ok .why-dot {
          background: var(--forge-success);
        }

        .why-row.bad .why-dot {
          background: var(--forge-error);
        }

        .why-text {
          font-size: 13px;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
        }

        .why-details {
          font-size: 12px;
          color: var(--forge-text-muted);
          text-align: right;
          font-family: var(--forge-font-mono);
        }

        /* Scrollbar styling for dark theme */
        .panel-body::-webkit-scrollbar {
          width: 6px;
        }
        .panel-body::-webkit-scrollbar-track {
          background: var(--forge-bg-void);
        }
        .panel-body::-webkit-scrollbar-thumb {
          background: var(--forge-border-active);
          border-radius: 3px;
        }
        .panel-body::-webkit-scrollbar-thumb:hover {
          background: var(--forge-text-muted);
        }
      `}</style>
    </div>
  );
};

export default AdminFees;
