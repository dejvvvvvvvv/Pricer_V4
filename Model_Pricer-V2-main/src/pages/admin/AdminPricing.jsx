// Admin Pricing Configuration Page - Dynamic Materials + Advanced Pricing Rules (Demo-first)
// This file is meant to be a drop-in replacement for the original:
//   src/pages/admin/AdminPricing.jsx
//
// Notes (current phase):
// - Single source of truth: tenant-scoped V3 storage (namespace: pricing:v3)
// - No backend sync here (handled elsewhere). This page reads/writes only via loadPricingConfigV3/savePricingConfigV3.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadPricingConfigV3, savePricingConfigV3 } from '../../utils/adminPricingStorage';

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

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampMin0(n) {
  const x = safeNum(n, 0);
  return x < 0 ? 0 : x;
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
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  // UI state
  const [banner, setBanner] = useState(null); // { type: 'info'|'error'|'success', text: string }
  const [savedSnapshot, setSavedSnapshot] = useState(''); // JSON snapshot
  const [touched, setTouched] = useState(false);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState(null); // null = closed, number = index
  const [dialogDraft, setDialogDraft] = useState(null); // deep copy of material being edited

  const ui = useMemo(() => {
    const cs = language === 'cs';
    return {
      title: cs ? 'Pricing' : 'Pricing',
      subtitle: cs
        ? 'Nastav cenu času, minima, zaokrouhlování, přirážku a materiály (včetně barev). Ukládá se tenantově do V3 storage.'
        : 'Configure time rate, minimums, rounding, markup and materials (including colors). Saved per-tenant in V3 storage.',
      save: cs ? 'Uložit změny' : 'Save changes',
      saved: cs ? 'Uloženo' : 'Saved',
      unsaved: cs ? 'Neuložené změny' : 'Unsaved changes',
      reset: cs ? 'Reset na default' : 'Reset to defaults',
      export: cs ? 'Exportovat JSON' : 'Export JSON',
      import: cs ? 'Importovat JSON' : 'Import JSON',
      copyOk: cs ? 'Zkopírováno do schránky.' : 'Copied to clipboard.',
      copyFail: cs ? 'Nepodařilo se zkopírovat – zkopíruj ručně z dialogu.' : 'Copy failed – copy manually from the dialog.',
      loadOk: cs ? 'Konfigurace načtena.' : 'Configuration loaded.',
      saveOk: cs ? 'Uloženo.' : 'Saved.',
      saveError: cs ? 'Uložení se nepodařilo.' : 'Save failed.',
      exportOk: cs ? 'JSON zkopírován do schránky.' : 'JSON copied to clipboard.',
      importOk: cs ? 'Konfigurace importována (nezapomeň uložit).' : 'Configuration imported (don’t forget to save).',
      resetOk: cs ? 'Resetováno na default (nezapomeň uložit).' : 'Reset to defaults (don’t forget to save).',
      invalid: cs ? 'Oprav chyby ve formuláři (hodnoty musí být ≥ 0).' : 'Fix validation errors (values must be ≥ 0).',
      preview: cs ? 'Testovací kalkulace' : 'Pricing sandbox',
      previewToggle: cs ? 'Testovat na příkladu' : 'Test with example',
    };
  }, [language]);

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
    enabled: true,
    price_per_gram: 0.6,
    colors: [createDefaultWhiteColor()],
  });

  const ensureAtLeastOneMaterial = (list) => {
    const arr = Array.isArray(list) ? list.filter(Boolean) : [];
    return arr.length > 0 ? arr : [createDefaultMaterial()];
  };

  const [colorDrafts, setColorDrafts] = useState({}); // { [materialId]: { name, hex } }
  const colorHexRafRef = useRef(new Map()); // key => { raf, hex }

  const addMaterial = () => {
    const newMat = {
      id: createStableId('mat'),
      key: '',
      name: '',
      enabled: true,
      price_per_gram: 0,
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
    setMaterials(prev => prev.map((m, i) => i === editingMaterialIndex ? dialogDraft : m));
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
      if (field === 'price_per_gram') next.price_per_gram = safeNum(value, 0);
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
    try {
      const json = JSON.stringify(currentConfigFull, null, 2);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
        setBanner({ type: 'success', text: ui.copyOk });
      } else {
        // fallback
        window.prompt('Zkopíruj JSON:', json);
        setBanner({ type: 'info', text: ui.copyFail });
      }
    } catch (e) {
      const json = JSON.stringify(currentConfigFull, null, 2);
      window.prompt('Zkopíruj JSON:', json);
      setBanner({ type: 'error', text: ui.copyFail });
    }
  };

  const handleImport = () => {
    const cs = language === 'cs';
    const raw = window.prompt(cs ? 'Vlož JSON konfigurace:' : 'Paste JSON configuration:');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);

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
        return {
          id,
          key: key,
          name: String(m?.name || '').trim(),
          enabled: m?.enabled !== false,
          price_per_gram: clampMin0(m?.price_per_gram ?? m?.price ?? 0),
          colors: Array.isArray(m?.colors) && m.colors.length > 0
            ? m.colors.map((c) => ({
                id: c?.id || createStableId('clr'),
                name: String(c?.name || '').trim(),
                hex: normalizeHex(c?.hex),
                price_per_gram: c?.price_per_gram != null ? clampMin0(c.price_per_gram) : null,
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
      setRules({
        ...deepClone(DEFAULT_RULES),
        ...tenantPricing,
        rate_per_hour: clampMin0(tenantPricing.rate_per_hour ?? timeRate),
      });
      setTouched(true);
      setBanner({ type: 'success', text: cs ? 'Import dokončen.' : 'Import complete.' });
    } catch (e) {
      setBanner({ type: 'error', text: cs ? 'Neplatný JSON.' : 'Invalid JSON.' });
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
        return {
          id,
          key,
          name: String(m?.name || '').trim(),
          enabled: m?.enabled !== false,
          price_per_gram: clampMin0(m?.price_per_gram ?? m?.price ?? 0),
          colors: Array.isArray(m?.colors) && m.colors.length > 0
            ? m.colors.map((c) => ({
                id: c?.id || createStableId('clr'),
                name: String(c?.name || '').trim(),
                hex: normalizeHex(c?.hex),
                price_per_gram: c?.price_per_gram != null ? clampMin0(c.price_per_gram) : null,
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

      // Ensure config exists (default material if needed)
      savePricingConfigV3(normalized);
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

  const setPreviewFromMaterial = (materialIndex) => {
    const mat = enabledMaterials[materialIndex];
    if (!mat) return;
    setPreviewField('material_price_per_g', clampMin0(mat.price_per_gram));
  };

  const ToggleRow = ({ checked, onChange, label, hint }) => {
    return (
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-label">{label}</span>
        {hint ? (
          <span className="hint" title={hint}>
            <Icon name="Info" size={16} />
          </span>
        ) : null}
      </label>
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
        <div className="loading">{language === 'cs' ? 'Načítám...' : 'Loading...'}</div>
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

      <div className="pricing-layout">
        {/* LEFT: Cards */}
        <div className="cards">
          {/* Card: Materials */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{t('admin.pricing.materials')}</h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Nastav materiály, cenu za gram a barvy. Klikni na materiál pro úpravu.'
                    : 'Configure materials, price per gram and colors. Click a material to edit.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addMaterial}>
                <Icon name="Plus" size={18} />
                {t('admin.pricing.addMaterial')}
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="empty-state">
                <Icon name="Package" size={48} />
                <h3>{language === 'cs' ? 'Žádné materiály nenakonfigurovány' : 'No materials configured'}</h3>
                <p>{language === 'cs' ? 'Klikni na "Přidat materiál" a vytvoř první materiál.' : 'Click "Add Material" to create your first material.'}</p>
              </div>
            ) : (
              <div className="materials-compact-grid">
                {materials.map((material, index) => {
                  const matKeyLower = String(material.key || '').toLowerCase();
                  const isDefault = !!matKeyLower && matKeyLower === String(defaultMaterialKey || '').toLowerCase();
                  const issues = materialIssues.byMaterialId?.[material.id] || {};
                  const hasIssue = issues.nameMissing || issues.keyMissing || issues.keyInvalid || issues.keyDuplicate || issues.priceInvalid;
                  const colors = Array.isArray(material.colors) ? material.colors : [];

                  return (
                    <div
                      key={material.id}
                      className={`material-compact-card ${hasIssue ? 'has-issue' : ''}`}
                      onClick={() => openMaterialDialog(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openMaterialDialog(index); }}
                    >
                      <div className="mcc-header">
                        <div className="mcc-name">{material.name || (language === 'cs' ? '(bez názvu)' : '(unnamed)')}</div>
                        <Icon name="Pencil" size={14} className="mcc-edit-icon" />
                      </div>
                      <div className="mcc-key">{material.key || '\u2014'}</div>
                      <div className="mcc-badges">
                        {isDefault && <span className="mcc-badge default">{language === 'cs' ? 'Výchozí' : 'Default'}</span>}
                        <span className={`mcc-badge ${material.enabled ? 'active' : 'inactive'}`}>
                          {material.enabled ? (language === 'cs' ? 'Aktivní' : 'Active') : (language === 'cs' ? 'Neaktivní' : 'Inactive')}
                        </span>
                        {hasIssue && <span className="mcc-badge error">{language === 'cs' ? 'Chyba' : 'Error'}</span>}
                      </div>
                      <div className="mcc-price">
                        <span className="mcc-price-value">{clampMin0(material.price_per_gram)}</span>
                        <span className="mcc-price-unit">Kč/g</span>
                      </div>
                      <div className="mcc-colors">
                        {colors.slice(0, 6).map(c => (
                          <div key={c.id} className="mcc-color-chip">
                            <span className="mcc-color-dot" style={{ backgroundColor: isValidHex(c.hex) ? c.hex : '#888' }} />
                            <span className="mcc-color-name">{c.name || '?'}</span>
                            {c.price_per_gram != null && (
                              <span className="mcc-color-price">{c.price_per_gram} Kč</span>
                            )}
                          </div>
                        ))}
                        {colors.length > 6 && (
                          <span className="mcc-color-more">+{colors.length - 6}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Material Edit Dialog */}
          <ForgeDialog
            open={editingMaterialIndex != null && dialogDraft != null}
            onClose={closeMaterialDialog}
            title={dialogDraft?.name || (language === 'cs' ? 'Nový materiál' : 'New material')}
            maxWidth="50vw"
            footer={
              <>
                <button className="btn-secondary" onClick={closeMaterialDialog}>
                  {language === 'cs' ? 'Zrušit' : 'Cancel'}
                </button>
                <button className="btn-primary" onClick={saveMaterialDialog}>
                  <Icon name="Save" size={16} />
                  {language === 'cs' ? 'Uložit změny' : 'Save changes'}
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
                  <div className="field">
                    <label>{language === 'cs' ? 'Název materiálu' : 'Material name'}</label>
                    <input
                      className={`input ${nameError ? 'input-error' : ''}`}
                      placeholder={language === 'cs' ? 'Název materiálu (např. PLA, ABS)' : 'Material name (e.g. PLA, ABS)'}
                      value={mat.name || ''}
                      onChange={(e) => updateDialogDraft('name', e.target.value)}
                    />
                    {nameError && <div className="field-error">{language === 'cs' ? 'Název je povinný' : 'Name is required'}</div>}
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Klíč (slug)' : 'Key (slug)'}</label>
                    <input
                      className={`input ${keyError ? 'input-error' : ''}`}
                      placeholder={language === 'cs' ? 'např. pla, petg_carbon' : 'e.g. pla, petg_carbon'}
                      value={mat.key || ''}
                      onChange={(e) => updateDialogDraft('key', e.target.value)}
                    />
                    {draftIssues.keyMissing && <div className="field-error">{language === 'cs' ? 'Klíč je povinný' : 'Key is required'}</div>}
                    {draftIssues.keyInvalid && <div className="field-error">{language === 'cs' ? 'Klíč musí obsahovat jen a-z, 0-9 a podtržítka.' : 'Key may contain only a-z, 0-9 and underscores.'}</div>}
                    {draftIssues.keyDuplicate && <div className="field-error">{language === 'cs' ? 'Klíč musí být unikátní' : 'Key must be unique'}</div>}
                  </div>

                  <div className="dialog-row-2">
                    <label className="toggle">
                      <input type="checkbox" checked={mat.enabled} onChange={(e) => updateDialogDraft('enabled', e.target.checked)} />
                      <span>{language === 'cs' ? 'Aktivní' : 'Active'}</span>
                    </label>

                    <div className="field" style={{ flex: 1 }}>
                      <label>{language === 'cs' ? 'Výchozí cena za gram' : 'Default price per gram'}</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`input ${priceError ? 'input-error' : ''}`}
                          value={mat.price_per_gram}
                          onChange={(e) => updateDialogDraft('price_per_gram', safeNum(e.target.value, 0))}
                        />
                        <span className="unit">Kč/g</span>
                      </div>
                      <p className="help-text">{language === 'cs' ? 'Tato cena se použije pro všechny barvy, pokud nemají vlastní cenu.' : 'This price is used for all colors unless they have a custom override.'}</p>
                    </div>
                  </div>

                  <div className="divider" />

                  <div className="dialog-colors-section">
                    <div className="colors-title">{language === 'cs' ? 'Barvy materiálu' : 'Material colors'}</div>
                    <p className="help-text" style={{ marginTop: 0, marginBottom: 12 }}>
                      {language === 'cs'
                        ? 'Můžeš nastavit specifickou cenu pro každou barvu. Pokud cenu nezadáš, použije se výchozí cena materiálu.'
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
                            placeholder={language === 'cs' ? 'Název barvy' : 'Color name'}
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
                              type="number"
                              min="0"
                              step="0.01"
                              className="input"
                              placeholder={`${clampMin0(mat.price_per_gram)}`}
                              value={c.price_per_gram != null ? c.price_per_gram : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : safeNum(e.target.value, 0);
                                updateDialogColor(c.id, 'price_per_gram', val);
                              }}
                              title={language === 'cs' ? 'Vlastní cena za gram (prázdné = výchozí)' : 'Custom price per gram (empty = default)'}
                            />
                            <span className="unit">Kč/g</span>
                          </div>
                          <button
                            className="icon-btn"
                            onClick={() => deleteDialogColor(c.id)}
                            disabled={!canDeleteColor}
                            title={!canDeleteColor ? (language === 'cs' ? 'Nelze smazat poslední barvu' : 'Cannot delete the last color') : (language === 'cs' ? 'Smazat barvu' : 'Delete color')}
                          >
                            <Icon name="Trash2" size={16} />
                          </button>

                          {(cIssues.nameMissing || cIssues.hexInvalid) && (
                            <div className="color-row-errors">
                              {cIssues.nameMissing && <span>{language === 'cs' ? 'Název povinný' : 'Name required'}</span>}
                              {cIssues.hexInvalid && <span>{language === 'cs' ? 'Hex neplatný' : 'Invalid hex'}</span>}
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

          {/* Card 1: Time rate + min billed minutes */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{language === 'cs' ? 'Cena času tisku' : 'Print time rate'}</h2>
                <p className="card-description">
                  {language === 'cs' ? 'Používá se čas z PrusaSliceru.' : 'Uses time reported by PrusaSlicer.'}
                </p>
              </div>
            </div>

            <div className="field">
              <label>{language === 'cs' ? 'Cena za hodinu tisku' : 'Hourly rate'}</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  className={`input ${rules.rate_per_hour < 0 ? 'input-error' : ''}`}
                  value={rules.rate_per_hour}
                  onChange={(e) => setRule('rate_per_hour', safeNum(e.target.value, 0))}
                />
                <span className="unit">Kč/h</span>
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
                  <input
                    type="number"
                    min="0"
                    className={`input ${rules.min_billed_minutes_value < 0 ? 'input-error' : ''}`}
                    value={rules.min_billed_minutes_value}
                    onChange={(e) => setRule('min_billed_minutes_value', safeNum(e.target.value, 0))}
                  />
                  <span className="unit">min</span>
                </div>
                <FieldError show={rules.min_billed_minutes_value < 0} />
              </div>
            ) : null}
          </div>

          {/* Card 2: Minimum prices */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{language === 'cs' ? 'Minimální ceny' : 'Minimum prices'}</h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Nastav minima, aby se vyplatily malé zakázky.'
                    : 'Set minimums to keep small jobs profitable.'}
                </p>
              </div>

              {/* Mini preview box */}
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
            </div>

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
                  <input
                    type="number"
                    min="0"
                    className={`input ${rules.min_price_per_model_value < 0 ? 'input-error' : ''}`}
                    value={rules.min_price_per_model_value}
                    onChange={(e) => setRule('min_price_per_model_value', safeNum(e.target.value, 0))}
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
                  <input
                    type="number"
                    min="0"
                    className={`input ${rules.min_order_total_value < 0 ? 'input-error' : ''}`}
                    value={rules.min_order_total_value}
                    onChange={(e) => setRule('min_order_total_value', safeNum(e.target.value, 0))}
                  />
                  <span className="unit">Kč</span>
                </div>
                <FieldError show={rules.min_order_total_value < 0} />
              </div>
            ) : null}
          </div>

          {/* Card 3: Rounding */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{language === 'cs' ? 'Zaokrouhlování' : 'Rounding'}</h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Aby výsledná cena byla „hezčí“ (např. 483,27 → 485).'
                    : 'Make the final price look nicer (e.g., 483.27 → 485).'}
                </p>
              </div>

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
            </div>

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
          </div>

          {/* Card 4: Markup */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{language === 'cs' ? 'Automatická přirážka (markup)' : 'Automatic markup'}</h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Pricing-level přirážka (není to Fee). Aplikuje se: base → fees → markup → minima → rounding.'
                    : 'Pricing-level markup (not a Fee). Applied: base → fees → markup → minima → rounding.'}
                </p>
              </div>

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
            </div>

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
                  <label>{language === 'cs' ? 'Režim' : 'Mode'}</label>
                  <div className="radio-group">
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'flat'}
                        onChange={() => setRule('markup_mode', 'flat')}
                      />
                      <span>{language === 'cs' ? 'Fixní (Kč)' : 'Flat (CZK)'}</span>
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'percent'}
                        onChange={() => setRule('markup_mode', 'percent')}
                      />
                      <span>{language === 'cs' ? 'Procentní (%)' : 'Percent (%)'}</span>
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="markup_mode"
                        checked={rules.markup_mode === 'min_flat'}
                        onChange={() => setRule('markup_mode', 'min_flat')}
                      />
                      <span>{language === 'cs' ? 'Minimální cena (Kč)' : 'Minimum price (CZK)'}</span>
                    </label>
                  </div>
                </div>

                <div className="field">
                  <label>{language === 'cs' ? 'Hodnota' : 'Value'}</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      className={`input ${rules.markup_value < 0 ? 'input-error' : ''}`}
                      value={rules.markup_value}
                      onChange={(e) => setRule('markup_value', safeNum(e.target.value, 0))}
                    />
                    <span className="unit">{rules.markup_mode === 'percent' ? '%' : 'Kč'}</span>
                  </div>
                  <FieldError show={rules.markup_value < 0} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Optional future stub (UI-only) */}
          <div className="admin-card future">
            <div className="card-header">
              <div>
                <h2>
                  {language === 'cs' ? 'Více pricing profilů (budoucí)' : 'Multiple pricing profiles (future)'}
                </h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Architektura je připravená – přidáme v další fázi (🟪).'
                    : 'UI architecture ready – planned for a later phase (🟪).'}
                </p>
              </div>
              <span className="tag">🟪 later</span>
            </div>

            <label className="toggle">
              <input type="checkbox" disabled />
              <span>{language === 'cs' ? 'Používat více pricing profilů' : 'Enable pricing profiles'}</span>
            </label>

            <p className="help-text">
              {language === 'cs'
                ? 'V další fázi půjde vytvořit více sad pravidel (Standard / Engineering / Bulk) a vybírat je ve widgetu.'
                : 'Later you will create multiple rule sets (Standard / Engineering / Bulk) and select them in the widget.'}
            </p>
          </div>
        </div>

          {/* S05: Volume Discounts */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{language === 'cs' ? 'Množstevní slevy' : 'Volume Discounts'}</h2>
                <p className="card-description">
                  {language === 'cs'
                    ? 'Nastavte slevy na základě objednaného množství.'
                    : 'Configure discounts based on ordered quantity.'}
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={volumeDiscounts.enabled}
                  onChange={(e) => {
                    setVolumeDiscounts(prev => ({ ...prev, enabled: e.target.checked }));
                    setTouched(true);
                  }}
                />
                <span>{volumeDiscounts.enabled
                  ? (language === 'cs' ? 'Zapnuto' : 'Enabled')
                  : (language === 'cs' ? 'Vypnuto' : 'Disabled')}</span>
              </label>
            </div>

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
          </div>

        {/* RIGHT: Preview panel */}
        <div className="preview">
          <div className="preview-card">
            <div className="preview-header">
              <h3>{ui.preview}</h3>
              <label className="toggle mini">
                <input
                  type="checkbox"
                  checked={previewEnabled}
                  onChange={(e) => setPreviewEnabled(e.target.checked)}
                />
                <span>{ui.previewToggle}</span>
              </label>
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
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={preview.material_price_per_g}
                        onChange={(e) => setPreviewField('material_price_per_g', safeNum(e.target.value, 0))}
                      />
                      <span className="unit">Kč/g</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Hmotnost (g)' : 'Weight (g)'}</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={preview.weight_g}
                        onChange={(e) => setPreviewField('weight_g', safeNum(e.target.value, 0))}
                      />
                      <span className="unit">g</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Čas (min)' : 'Time (min)'}</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={preview.time_min}
                        onChange={(e) => setPreviewField('time_min', safeNum(e.target.value, 0))}
                      />
                      <span className="unit">min</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>{language === 'cs' ? 'Množství (ks)' : 'Quantity'}</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="input"
                        value={preview.quantity}
                        onChange={(e) => setPreviewField('quantity', safeNum(e.target.value, 1))}
                      />
                      <span className="unit">ks</span>
                    </div>
                  </div>

                  <div className="field full">
                    <label>{language === 'cs' ? 'Poplatky (Fees) – simulace / model (Kč)' : 'Fees (simulated) / model (CZK)'}</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={preview.fees_total}
                        onChange={(e) => setPreviewField('fees_total', safeNum(e.target.value, 0))}
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
        </div>
      </div>

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
          color: #ffaa00;
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

        .pricing-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .pricing-layout {
            grid-template-columns: 1fr;
          }
        }

        .cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          color: #ffaa00;
          border-color: rgba(255, 170, 0, 0.2);
        }

        .mcc-badge.error {
          background: rgba(255, 68, 68, 0.06);
          color: #ff4444;
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
          border-color: #ff4444 !important;
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
          color: #ff4444;
        }

        .preview {
          position: relative;
        }

        .preview-card {
          position: sticky;
          top: 16px;
          background: var(--forge-bg-surface, #12121a);
          border: 1px solid var(--forge-border-default, #1a1a2e);
          border-radius: var(--forge-radius-md, 8px);
          padding: 16px;
        }

        @media (max-width: 1024px) {
          .preview-card {
            position: static;
          }
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
          color: #ffaa00;
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
          color: #ffaa00;
          font-size: 13px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--forge-text-muted, #666680);
          font-family: var(--forge-font-tech, 'Share Tech Mono', monospace);
        }
      `}</style>
    </div>
  );
};

export default AdminPricing;
