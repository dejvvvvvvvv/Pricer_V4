import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import { readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import { deletePreset, listPresets, patchPreset, setDefaultPreset, uploadPreset, duplicatePreset, fetchPresetContent } from '../../services/presetsApi';
import { calculateOrderQuote } from '../../lib/pricing/pricingEngineV3';
import { downloadFile } from '../../utils/exportData';
import { safeJsonParse } from '../../utils/sanitizeJson';
import PresetComparison from './components/PresetComparison';
import PresetTemplates from './components/PresetTemplates';
import PresetInlineEditor from './components/PresetInlineEditor';
import { addNotification } from '../../utils/adminNotificationStorage';
import { finalizeDecimal, parseIntInput } from '@/utils/formatters';

// =============================================================
// Admin / Presets — Card-based UI with grouping, reorder,
// duplicate, import/export, share, pricing preview
// =============================================================

const LOCAL_FALLBACK_NAMESPACE = 'presets:v1';

const PRINT_OVERRIDE_FIELDS = [
  { key: 'layer_height', type: 'number', step: 0.01, label_cs: 'V\u00fd\u0161ka vrstvy (mm)', label_en: 'Layer height (mm)' },
  { key: 'perimeters', type: 'number', step: 1, label_cs: 'Po\u010det perimetr\u016f', label_en: 'Perimeters' },
  { key: 'infill_sparse_density', type: 'number', step: 1, label_cs: 'Infill (%)', label_en: 'Infill (%)' },
  { key: 'fill_pattern', type: 'select', options: ['rectilinear', 'grid', 'triangles', 'stars', 'cubic', 'gyroid', 'honeycomb', 'line', 'concentric', 'hilbertcurve', 'archimedeanchords', 'octagramspiral'], label_cs: 'Vzor v\u00fdpln\u011b', label_en: 'Fill pattern' },
  { key: 'support_material', type: 'boolean', label_cs: 'Supporty', label_en: 'Supports' },
  { key: 'support_material_threshold', type: 'number', step: 1, label_cs: '\u00dahel pro supporty (\u00b0)', label_en: 'Support threshold (\u00b0)' },
  { key: 'first_layer_height', type: 'number', step: 0.01, label_cs: 'Prvn\u00ed vrstva (mm)', label_en: 'First layer height (mm)' },
  { key: 'temperature', type: 'number', step: 1, label_cs: 'Teplota trysky (\u00b0C)', label_en: 'Nozzle temperature (\u00b0C)' },
  { key: 'bed_temperature', type: 'number', step: 1, label_cs: 'Teplota podlo\u017eky (\u00b0C)', label_en: 'Bed temperature (\u00b0C)' },
  { key: 'max_print_speed', type: 'number', step: 1, label_cs: 'Max rychlost (mm/s)', label_en: 'Max print speed (mm/s)' },
];

const MATERIAL_COLORS = {
  PLA: { bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.3)', accent: 'var(--forge-accent-primary)' },
  PETG: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', accent: '#3B82F6' },
  ABS: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', accent: '#F59E0B' },
  TPU: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.3)', accent: '#A855F7' },
  ASA: { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.3)', accent: '#EC4899' },
  PA: { bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.3)', accent: '#0EA5E9' },
  PC: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)', accent: '#8B5CF6' },
};

const MATERIAL_ICONS = {
  PLA: 'Layers', PETG: 'Shield', ABS: 'Flame', TPU: 'Move',
  ASA: 'Sun', PA: 'Droplets', PC: 'Eye',
};

function getMaterialVisual(matKey) {
  const upper = String(matKey || '').toUpperCase();
  for (const [key, colors] of Object.entries(MATERIAL_COLORS)) {
    if (upper.includes(key)) return { colors, icon: MATERIAL_ICONS[key] || 'Layers', label: key };
  }
  return { colors: MATERIAL_COLORS.PLA, icon: 'Layers', label: matKey || '' };
}

function pickLang(language, cs, en) {
  return String(language || '').toLowerCase().startsWith('en') ? en : cs;
}

function normalizePreset(raw) {
  const id = String(raw?.id || '').trim();
  const name = String(raw?.name || raw?.title || id || '').trim();
  const orderRaw = raw?.order ?? raw?.priority ?? raw?.sort;
  const orderNum = Number(orderRaw);
  const order = Number.isFinite(orderNum) ? orderNum : 0;
  const visibleInWidgetRaw = raw?.visibleInWidget ?? raw?.visible_in_widget ?? raw?.widgetVisible ?? raw?.visible;
  const visibleInWidget = Boolean(visibleInWidgetRaw);
  const createdAt = raw?.createdAt ? String(raw.createdAt) : '';
  const updatedAt = raw?.updatedAt ? String(raw.updatedAt) : '';
  const sizeBytes = Number.isFinite(Number(raw?.sizeBytes)) ? Number(raw.sizeBytes) : null;
  const materialKey = raw?.material_key ?? raw?.materialKey ?? null;
  const printOverrides = (raw?.print_overrides && typeof raw.print_overrides === 'object' && !Array.isArray(raw.print_overrides)) ? raw.print_overrides : {};
  return { id, name, order, visibleInWidget, createdAt, updatedAt, sizeBytes, material_key: materialKey ? String(materialKey) : null, print_overrides: printOverrides };
}

function readLocalFallback() {
  const raw = readTenantJson(LOCAL_FALLBACK_NAMESPACE, []);
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.presets) ? raw.presets : Array.isArray(raw?.items) ? raw.items : [];
  const presets = list.map(normalizePreset).filter((p) => p.id);
  let defaultPresetId = null;
  if (raw && !Array.isArray(raw) && typeof raw?.defaultPresetId === 'string' && raw.defaultPresetId) {
    defaultPresetId = raw.defaultPresetId;
  } else {
    const selected = list.find((p) => p?.is_default_selected);
    if (selected?.id) defaultPresetId = String(selected.id);
  }
  return { presets, defaultPresetId: defaultPresetId || null };
}

function writeLocalFallback({ presets, defaultPresetId }) {
  try {
    writeTenantJson(LOCAL_FALLBACK_NAMESPACE, {
      presets: Array.isArray(presets) ? presets : [],
      defaultPresetId: defaultPresetId || null,
    });
  } catch { /* ignore */ }
}

// ============ Pricing preview ============

function estimatePresetPrice(preset, pricingConfig, materialKey) {
  try {
    const pc = pricingConfig || {};
    const materials = Array.isArray(pc.materials) ? pc.materials : [];
    const mat = materialKey
      ? materials.find(m => m.key === materialKey) || materials[0]
      : materials[0];
    if (!mat) return null;

    const overrides = preset.print_overrides || {};
    const layerHeight = overrides.layer_height || 0.2;
    const infill = overrides.infill_sparse_density || 20;
    const speed = overrides.max_print_speed || 60;

    // Rough time/material adjustment relative to baseline (0.2mm layer, 20% infill, 60mm/s)
    const baseTime = 3600; // 1h for sample model
    const timeMultiplier = (0.2 / Math.max(layerHeight, 0.04)) * (60 / Math.max(speed, 5));
    const adjustedTime = baseTime * timeMultiplier;
    const infillMultiplier = Math.max(infill, 1) / 20;
    const adjustedWeight = 100 * infillMultiplier; // 100g base

    const file = {
      id: 'sample-preview', name: 'Sample', volumeCm3: 50,
      weightGrams: adjustedWeight, printTimeSeconds: adjustedTime, surfaceCm2: 200,
    };
    const result = calculateOrderQuote({
      uploadedFiles: [file],
      printConfigs: { 'sample-preview': { materialKey: mat.key, quantity: 1 } },
      pricingConfig: pc,
      feesConfig: { fees: [] },
      feeSelections: { selectedFeeIds: new Set(), feeTargetsById: {} },
    });
    return result?.orderTotal ?? null;
  } catch {
    return null;
  }
}

// ============ Export / Import / Share ============

function exportPresetAsJson(preset) {
  const data = {
    _format: 'modelpricer_preset_v1',
    _exportedAt: new Date().toISOString(),
    preset: {
      name: preset.name, order: preset.order, visibleInWidget: preset.visibleInWidget,
      material_key: preset.material_key, print_overrides: preset.print_overrides || {},
    },
  };
  const filename = `${(preset.name || 'preset').replace(/[^a-z0-9_-]/gi, '_')}.json`;
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

function exportAllPresetsAsJson(presets) {
  const data = {
    _format: 'modelpricer_presets_v1',
    _exportedAt: new Date().toISOString(),
    _count: presets.length,
    presets: presets.map(p => ({
      name: p.name, order: p.order, visibleInWidget: p.visibleInWidget,
      material_key: p.material_key, print_overrides: p.print_overrides || {},
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), `presets_export_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}

function presetToShareString(preset) {
  try {
    const data = { n: preset.name, o: preset.order, v: preset.visibleInWidget, m: preset.material_key, p: preset.print_overrides || {} };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  } catch { return null; }
}

const SAFE_PRINT_OVERRIDE_KEYS = new Set([
  // Keys actually used by the app (must match PRINT_OVERRIDE_FIELDS and PresetInlineEditor)
  'layer_height', 'first_layer_height', 'infill_sparse_density', 'perimeters',
  'fill_pattern', 'support_material', 'support_material_threshold',
  'temperature', 'bed_temperature', 'max_print_speed',
]);

function sanitizePrintOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const key of Object.keys(raw)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (!SAFE_PRINT_OVERRIDE_KEYS.has(key)) continue;
    out[key] = raw[key];
  }
  return out;
}

function parseShareString(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.trim())));
    const data = safeJsonParse(json);
    if (!data || typeof data !== 'object') return null;
    return { name: data.n || 'Imported', order: data.o || 0, visibleInWidget: !!data.v, material_key: data.m || null, print_overrides: sanitizePrintOverrides(data.p) };
  } catch { return null; }
}

function parseImportFile(text) {
  try {
    const data = safeJsonParse(text);
    if (data._format === 'modelpricer_preset_v1' && data.preset) return [data.preset];
    if (data._format === 'modelpricer_presets_v1' && Array.isArray(data.presets)) return data.presets;
    if (data.name && typeof data.print_overrides === 'object') return [data];
    return null;
  } catch { return null; }
}


// ============ MAIN COMPONENT ============

export default function AdminPresets() {
  const { language, t } = useLanguage();

  const str = useMemo(() => ({
    title: t('admin.presets.title', 'Presets'),
    subtitle: t('admin.presets.subtitle', 'Manage presets (.ini) — print parameters for calculator and widget.'),
    refresh: t('admin.presets.refresh', 'Refresh'),
    uploadPreset: t('admin.presets.uploadPreset', 'Upload preset'),
    setAsDefault: t('admin.presets.setAsDefault', 'Default'),
    delete: t('admin.presets.delete', 'Delete'),
    duplicate: t('admin.presets.duplicate', 'Duplicate'),
    edit: t('admin.presets.edit', 'Edit'),
    active: t('admin.presets.active', 'Active'),
    inactive: t('admin.presets.inactive', 'Inactive'),
    namePlaceholder: t('admin.presets.namePlaceholder', 'Preset name'),
    orderLabel: t('admin.presets.orderLabel', 'Order'),
    fileLabel: t('admin.presets.fileLabel', 'File (.ini)'),
    offlineBanner: t('admin.presets.offlineBanner', 'Offline mode: Backend unreachable.'),
    backendErrorLabel: t('admin.presets.backendErrorLabel', 'Error:'),
    emptyTitle: t('admin.presets.emptyTitle', 'No presets yet.'),
    emptyHint: t('admin.presets.emptyHint', 'Add presets by uploading .ini or from templates.'),
    badgeDefault: t('admin.presets.badgeDefault', 'Default'),
    toastFail: t('admin.presets.toastFail', 'Error:'),
    toastSaved: t('admin.presets.toastSaved', 'Saved.'),
    toastDefaultSet: t('admin.presets.toastDefaultSet', 'Default preset set.'),
    toastDeleted: t('admin.presets.toastDeleted', 'Deleted.'),
    toastDuplicated: t('admin.presets.toastDuplicated', 'Duplicated.'),
    toastCopied: t('admin.presets.toastCopied', 'Copied to clipboard.'),
    toastImported: t('admin.presets.toastImported', 'Imported.'),
    toastImportFail: t('admin.presets.toastImportFail', 'Invalid format.'),
    deleteTitle: t('admin.presets.deleteTitle', 'Delete preset?'),
    deleteBody: t('admin.presets.deleteBody', 'This action cannot be undone.'),
    deleteDefaultTitle: t('admin.presets.deleteDefaultTitle', 'Delete default preset?'),
    deleteDefaultBody: t('admin.presets.deleteDefaultBody', 'Default will switch to highest-priority preset.'),
    confirmYes: t('admin.presets.confirmYes', 'Yes, delete'),
    confirmCancel: t('admin.presets.confirmCancel', 'Cancel'),
    hintMax5mb: t('admin.presets.hintMax5mb', 'Max 5 MB. .ini only.'),
    materialLabel: t('admin.presets.materialLabel', 'Material'),
    allMaterials: t('admin.presets.allMaterials', '-- All --'),
    searchPlaceholder: t('admin.presets.searchPlaceholder', 'Search presets...'),
    noResults: t('admin.presets.noResults', 'No presets found'),
    exportAll: t('admin.presets.exportAll', 'Export all'),
    importPresets: t('admin.presets.importPresets', 'Import'),
    share: t('admin.presets.share', 'Share'),
    compare: t('admin.presets.compare', 'Compare'),
    layerHeight: t('admin.presets.layerHeight', 'Layer'),
    infill: 'Infill',
    speed: t('admin.presets.speed', 'Speed'),
    supports: t('admin.presets.supports', 'Supports'),
    estPrice: t('admin.presets.estPrice', 'Est. price'),
    sampleModel: t('admin.presets.sampleModel', '50 cm\u00b3 model'),
    groupAll: t('admin.presets.groupAll', 'All'),
    groupOther: t('admin.presets.groupOther', 'Other'),
    filterMat: t('admin.presets.filterMat', 'Material:'),
    dialogTitle: t('admin.presets.dialogTitle', 'Edit preset'),
    dialogCancel: t('admin.presets.dialogCancel', 'Cancel'),
    dialogSave: t('admin.presets.dialogSave', 'Save'),
    sectionMeta: t('admin.presets.sectionMeta', 'Metadata'),
    sectionOverrides: t('admin.presets.sectionOverrides', 'Print parameters'),
    overrideHint: t('admin.presets.overrideHint', '-- default --'),
    overrideYes: t('admin.presets.overrideYes', 'Yes'),
    overrideNo: t('admin.presets.overrideNo', 'No'),
    colName: t('admin.presets.colName', 'Name'),
    visibleInWidget: t('admin.presets.visibleInWidget', 'Visible in widget'),
    statusOffline: t('admin.presets.statusOffline', 'Offline'),
    statusOnline: t('admin.presets.statusOnline', 'Online'),
    moveUp: t('admin.presets.moveUp', 'Up'),
    moveDown: t('admin.presets.moveDown', 'Down'),
    bulkSelected: t('admin.presets.bulkSelected', 'selected'),
    bulkDeleteAll: t('admin.presets.bulkDeleteAll', 'Delete selected'),
    bulkExport: t('admin.presets.bulkExport', 'Export selected'),
    bulkDuplicate: t('admin.presets.bulkDuplicate', 'Duplicate selected'),
    bulkEnable: t('admin.presets.bulkEnable', 'Enable'),
    bulkDisable: t('admin.presets.bulkDisable', 'Disable'),
    selectAll: t('admin.presets.selectAll', 'All'),
    clearSelection: t('admin.presets.clearSelection', 'Clear'),
    bulkDeleteConfirm: t('admin.presets.bulkDeleteConfirm', 'Delete selected presets?'),
    bulkDeleteBody: t('admin.presets.bulkDeleteBody', 'This action cannot be undone.'),
    viewIni: t('admin.presets.viewIni', 'View INI'),
    iniModalTitle: t('admin.presets.iniModalTitle', 'INI File Content'),
    iniLoading: t('admin.presets.iniLoading', 'Loading INI content...'),
    iniEmpty: t('admin.presets.iniEmpty', 'No INI content available for this preset.'),
    iniLoadError: t('admin.presets.iniLoadError', 'Failed to load INI content.'),
    iniClose: t('admin.presets.iniClose', 'Close'),
  }), [t]);

  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [presets, setPresets] = useState([]);
  const [defaultPresetId, setDefaultPresetId] = useState(null);

  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadOrder, setUploadOrder] = useState(0);
  const [uploadVisibleInWidget, setUploadVisibleInWidget] = useState(true);
  const [uploadMaterialKey, setUploadMaterialKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [savingById, setSavingById] = useState({});
  const [defaultingById, setDefaultingById] = useState({});
  const [deletingById, setDeletingById] = useState({});
  const [duplicatingById, setDuplicatingById] = useState({});

  const [deleteModal, setDeleteModal] = useState({ open: false, presetId: null });
  const deleteOverlayRef = useRef(null);

  // INI viewer modal
  const [iniModal, setIniModal] = useState({ open: false, presetId: null, presetName: '' });
  const [iniContent, setIniContent] = useState('');
  const [iniLoading, setIniLoading] = useState(false);
  const [iniError, setIniError] = useState(null);
  const iniOverlayRef = useRef(null);

  const [showComparison, setShowComparison] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const [inlineEditId, setInlineEditId] = useState(null);

  // Bulk selection
  const [selectedPresetIds, setSelectedPresetIds] = useState(new Set());
  const selectedPresetSet = selectedPresetIds;

  // Drag-and-drop
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Quick inline field editing (click-to-edit name/order)
  const [quickEditField, setQuickEditField] = useState(null); // { id, field, value }

  const [editingPresetId, setEditingPresetId] = useState(null);
  const [presetDraft, setPresetDraft] = useState(null);

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');

  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [previewPresetId, setPreviewPresetId] = useState(null);

  const fileInputRef = useRef(null);
  const iniInputRef = useRef(null);
  const toastTimer = useRef(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((kind, msg) => {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const showError = useCallback((msg) => showToast('err', `${str.toastFail} ${msg || '?'}`), [showToast, str.toastFail]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const filteredPresets = useMemo(() => {
    let list = presets;
    if (materialFilter) list = list.filter(p => (p.material_key || '') === materialFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.material_key || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q));
    }
    return list;
  }, [presets, search, materialFilter]);

  const sortedPresets = useMemo(() =>
    filteredPresets.slice().sort((a, b) => {
      const d = (b.order || 0) - (a.order || 0);
      return d !== 0 ? d : String(a.name).localeCompare(String(b.name));
    }), [filteredPresets]);

  const groupedPresets = useMemo(() => {
    const groups = {};
    for (const p of sortedPresets) {
      const key = p.material_key || '__other__';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [sortedPresets]);

  const materialKeys = useMemo(() => {
    const keys = new Set();
    for (const p of presets) { if (p.material_key) keys.add(p.material_key); }
    return Array.from(keys).sort();
  }, [presets]);

  // ---- Data loading ----

  const load = useCallback(async () => {
    setLoading(true);
    setBackendError('');
    try {
      const pc = loadPricingConfigV3();
      setPricingConfig(pc);
      setAvailableMaterials(Array.isArray(pc?.materials) ? pc.materials.filter(m => m?.enabled && m?.key && m?.name) : []);
    } catch { /* ignore */ }

    const res = await listPresets();
    if (res.ok) {
      const payload = res.data || {};
      const list = Array.isArray(payload.presets) ? payload.presets : Array.isArray(payload.items) ? payload.items : [];
      const mapped = list.map(normalizePreset).filter(p => p.id);
      const def = payload.defaultPresetId || payload.defaultPreset || payload.default || null;
      setPresets(mapped);
      setDefaultPresetId(def ? String(def) : null);
      setOfflineMode(false);
      writeLocalFallback({ presets: mapped, defaultPresetId: def ? String(def) : null });
    } else {
      const local = readLocalFallback();
      setPresets(local.presets);
      setDefaultPresetId(local.defaultPresetId);
      setOfflineMode(true);
      setBackendError(res.message || 'Backend unreachable');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!offlineMode || loading) return;
    writeLocalFallback({ presets, defaultPresetId });
  }, [offlineMode, loading, presets, defaultPresetId]);

  useEffect(() => {
    if (!deleteModal.open) return;
    document.body.style.overflow = 'hidden';
    const h = (e) => { if (e.key === 'Escape') setDeleteModal({ open: false, presetId: null }); };
    document.addEventListener('keydown', h);
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [deleteModal.open]);

  // INI modal: body scroll lock + Escape close
  useEffect(() => {
    if (!iniModal.open) return;
    document.body.style.overflow = 'hidden';
    const h = (e) => { if (e.key === 'Escape') { setIniModal({ open: false, presetId: null, presetName: '' }); setIniContent(''); setIniError(null); } };
    document.addEventListener('keydown', h);
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [iniModal.open]);

  const openIniModal = useCallback(async (presetId, presetName) => {
    setIniModal({ open: true, presetId, presetName: presetName || presetId });
    setIniContent('');
    setIniError(null);
    setIniLoading(true);
    try {
      const res = await fetchPresetContent(presetId);
      if (res.ok) {
        const content = typeof res.data === 'string' ? res.data : (res.data?.content || res.data?.ini || JSON.stringify(res.data, null, 2));
        setIniContent(content || '');
      } else {
        setIniError(res.message || 'Failed to load INI content.');
      }
    } catch (e) {
      setIniError(String(e?.message || 'Network error'));
    }
    setIniLoading(false);
  }, []);

  const closeIniModal = useCallback(() => {
    setIniModal({ open: false, presetId: null, presetName: '' });
    setIniContent('');
    setIniError(null);
  }, []);

  const actionsDisabled = loading;

  // ---- CRUD ----

  const onUpload = async () => {
    if (actionsDisabled || !uploadFile) { if (!uploadFile) showError(t('admin.presets.selectIniFile', 'Select .ini file.')); return; }
    setUploading(true);
    const meta = { name: uploadName?.trim() || undefined, order: Number.isFinite(Number(uploadOrder)) ? Number(uploadOrder) : 0, visibleInWidget: !!uploadVisibleInWidget, material_key: uploadMaterialKey || null };
    if (offlineMode) {
      const id = `local-${crypto.randomUUID()}`;
      const base = uploadFile?.name ? String(uploadFile.name).replace(/\.ini$/i, '') : '';
      setPresets(prev => [...prev, normalizePreset({ id, name: meta.name || base || id, order: meta.order ?? 0, visibleInWidget: meta.visibleInWidget ?? true, material_key: meta.material_key, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sizeBytes: uploadFile?.size ?? null })]);
      showToast('ok', str.toastSaved);
    } else {
      const res = await uploadPreset(uploadFile, meta);
      if (!res.ok) { showError(res.message); setUploading(false); return; }
      showToast('ok', str.toastSaved);
      await load();
    }
    addNotification({
      type: 'config',
      title: 'Novy preset nahran',
      description: meta.name || uploadFile?.name || 'Preset',
    });
    setUploadFile(null); setUploadName(''); setUploadOrder(0); setUploadVisibleInWidget(true); setUploadMaterialKey(null); setUploading(false); setShowUploadForm(false);
  };

  const onSetDefault = async (id) => {
    if (actionsDisabled) return;
    setDefaultingById(p => ({ ...p, [id]: true }));
    if (offlineMode) { setDefaultPresetId(String(id)); showToast('ok', str.toastDefaultSet); }
    else { const res = await setDefaultPreset(id); if (!res.ok) { showError(res.message); setDefaultingById(p => ({ ...p, [id]: false })); return; } showToast('ok', str.toastDefaultSet); await load(); }
    setDefaultingById(p => ({ ...p, [id]: false }));
  };

  const runDelete = async (id) => {
    if (actionsDisabled) return;
    setDeletingById(p => ({ ...p, [id]: true }));
    if (offlineMode) {
      const next = presets.filter(p => String(p.id) !== String(id));
      let nextDef = defaultPresetId ? String(defaultPresetId) : null;
      if (nextDef === String(id)) { const s2 = next.slice().sort((a, b) => (b.order || 0) - (a.order || 0)); nextDef = s2[0]?.id ? String(s2[0].id) : null; }
      setPresets(next); setDefaultPresetId(nextDef); showToast('ok', str.toastDeleted);
    } else {
      const res = await deletePreset(id); if (!res.ok) { showError(res.message); setDeletingById(p => ({ ...p, [id]: false })); return; }
      showToast('ok', str.toastDeleted); await load();
    }
    const deleted = presets.find(p => String(p.id) === String(id));
    addNotification({ type: 'config', title: 'Preset smazan', description: deleted?.name || String(id) });
    setDeletingById(p => ({ ...p, [id]: false }));
  };

  const onDelete = async (id) => {
    if (!id) return;
    // Always show confirmation dialog — extra important for the default preset
    setDeleteModal({ open: true, presetId: id });
  };

  const onDuplicate = async (id) => {
    if (actionsDisabled) return;
    setDuplicatingById(p => ({ ...p, [id]: true }));
    const source = presets.find(p => p.id === id);
    if (offlineMode) {
      if (!source) { setDuplicatingById(p => ({ ...p, [id]: false })); return; }
      const newId = `dup-${crypto.randomUUID()}`;
      setPresets(prev => [...prev, normalizePreset({ ...source, id: newId, name: `${source.name} (kopie)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })]);
      showToast('ok', str.toastDuplicated);
    } else {
      const res = await duplicatePreset(id, { name: source ? `${source.name} (kopie)` : undefined });
      if (!res.ok) { showError(res.message); setDuplicatingById(p => ({ ...p, [id]: false })); return; }
      showToast('ok', str.toastDuplicated); await load();
    }
    setDuplicatingById(p => ({ ...p, [id]: false }));
  };

  const onToggleActive = async (id) => {
    if (actionsDisabled) return;
    const p = presets.find(x => x.id === id);
    if (!p) return;
    const nv = !p.visibleInWidget;
    setSavingById(prev => ({ ...prev, [id]: true }));
    if (offlineMode) { setPresets(prev => prev.map(x => x.id === id ? { ...x, visibleInWidget: nv, updatedAt: new Date().toISOString() } : x)); showToast('ok', str.toastSaved); }
    else { const res = await patchPreset(id, { visibleInWidget: nv }); if (!res.ok) { showError(res.message); setSavingById(prev => ({ ...prev, [id]: false })); return; } showToast('ok', str.toastSaved); await load(); }
    setSavingById(prev => ({ ...prev, [id]: false }));
  };

  const onMovePreset = async (id, direction) => {
    if (actionsDisabled) return;
    const idx = sortedPresets.findIndex(p => p.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedPresets.length) return;
    const cur = sortedPresets[idx];
    const tgt = sortedPresets[targetIdx];
    let co = tgt.order, to = cur.order;
    if (co === to) { co = direction === 'up' ? co + 1 : co - 1; to = direction === 'up' ? to - 1 : to + 1; }
    if (offlineMode) {
      setPresets(prev => prev.map(p => { if (p.id === cur.id) return { ...p, order: co }; if (p.id === tgt.id) return { ...p, order: to }; return p; }));
    } else {
      await Promise.all([patchPreset(cur.id, { order: co }), patchPreset(tgt.id, { order: to })]);
      await load();
    }
  };

  const onInlineSave = async (presetId, draftData) => {
    if (offlineMode) {
      setPresets(prev => prev.map(p => p.id === presetId ? { ...p, name: draftData.name, order: draftData.order, visibleInWidget: draftData.visibleInWidget, material_key: draftData.material_key, print_overrides: draftData.print_overrides || {}, updatedAt: new Date().toISOString() } : p));
      showToast('ok', str.toastSaved); setInlineEditId(null); return;
    }
    const res = await patchPreset(presetId, { name: String(draftData.name || '').trim(), order: Number.parseInt(String(draftData.order ?? 0), 10) || 0, visibleInWidget: !!draftData.visibleInWidget, material_key: draftData.material_key || null, print_overrides: draftData.print_overrides || {} });
    if (!res.ok) throw new Error(res.message || 'Save failed');
    showToast('ok', str.toastSaved); await load(); setInlineEditId(null);
  };

  // ForgeDialog edit
  const openPresetDialog = (presetId) => {
    const p = presets.find(x => x.id === presetId);
    if (!p) return;
    setPresetDraft({ name: p.name, order: p.order, visibleInWidget: p.visibleInWidget, material_key: p.material_key, print_overrides: p.print_overrides ? { ...p.print_overrides } : {} });
    setEditingPresetId(presetId);
  };
  const closePresetDialog = () => { setEditingPresetId(null); setPresetDraft(null); };

  const savePresetDialog = async () => {
    if (!editingPresetId || !presetDraft) return;
    const e = { name: String(presetDraft.name || '').trim(), order: Number.parseInt(String(presetDraft.order ?? 0), 10) || 0, visibleInWidget: !!presetDraft.visibleInWidget, material_key: presetDraft.material_key || null, print_overrides: presetDraft.print_overrides || {} };
    if (offlineMode) { setPresets(prev => prev.map(p => p.id === editingPresetId ? { ...p, ...e, updatedAt: new Date().toISOString() } : p)); showToast('ok', str.toastSaved); }
    else { const res = await patchPreset(editingPresetId, e); if (!res.ok) { showError(res.message); return; } showToast('ok', str.toastSaved); await load(); }
    closePresetDialog();
  };

  const updatePresetDraft = (f, v) => setPresetDraft(prev => prev ? { ...prev, [f]: v } : prev);

  // Template create
  const onCreateFromTemplate = async (template) => {
    if (offlineMode) {
      const id = `tpl-${crypto.randomUUID()}`;
      setPresets(prev => [...prev, normalizePreset({ id, name: template.name || 'Template', order: 0, visibleInWidget: true, material_key: template.material || null, print_overrides: { layer_height: template.layerHeight, infill_sparse_density: template.infillDensity, max_print_speed: template.printSpeed, temperature: template.temperature, bed_temperature: template.bedTemperature, support_material: template.supports || false }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })]);
      showToast('ok', str.toastSaved); return;
    }
    const iniLines = [`# template: ${template.name}`, `layer_height = ${template.layerHeight}`, `fill_density = ${template.infillDensity}%`, `perimeter_speed = ${template.printSpeed}`, `temperature = ${template.temperature}`, `bed_temperature = ${template.bedTemperature}`, `support_material = ${template.supports ? '1' : '0'}`, `brim_width = ${template.brim ? '5' : '0'}`, ''].join('\n');
    const blob = new Blob([iniLines], { type: 'text/plain' });
    const file = new File([blob], `${(template.name || 'tpl').replace(/[^a-z0-9_-]/gi, '_')}.ini`, { type: 'text/plain' });
    const res = await uploadPreset(file, { name: template.name, order: 0, visibleInWidget: true, material_key: template.material || null });
    if (!res.ok) { showError(res.message); return; }
    showToast('ok', str.toastSaved); await load();
  };

  // Import
  const importPresetsLocal = useCallback(async (presetList) => {
    let count = 0;
    for (const p of presetList) {
      const id = `imp-${crypto.randomUUID()}-${count}`;
      const np = normalizePreset({ id, name: p.name || 'Imported', order: p.order || 0, visibleInWidget: p.visibleInWidget ?? true, material_key: p.material_key || null, print_overrides: p.print_overrides || {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      if (offlineMode) { setPresets(prev => [...prev, np]); }
      else {
        const overrides = np.print_overrides || {};
        const lines = [`# imported: ${np.name}`, overrides.layer_height != null ? `layer_height = ${overrides.layer_height}` : null, overrides.infill_sparse_density != null ? `fill_density = ${overrides.infill_sparse_density}%` : null, overrides.max_print_speed != null ? `perimeter_speed = ${overrides.max_print_speed}` : null, overrides.temperature != null ? `temperature = ${overrides.temperature}` : null, overrides.bed_temperature != null ? `bed_temperature = ${overrides.bed_temperature}` : null, overrides.support_material != null ? `support_material = ${overrides.support_material ? '1' : '0'}` : null, ''].filter(Boolean).join('\n');
        const blob = new Blob([lines], { type: 'text/plain' });
        const file = new File([blob], `${(np.name || 'import').replace(/[^a-z0-9_-]/gi, '_')}.ini`, { type: 'text/plain' });
        await uploadPreset(file, { name: np.name, order: np.order, visibleInWidget: np.visibleInWidget, material_key: np.material_key });
      }
      count++;
    }
    if (!offlineMode) await load();
    showToast('ok', `${str.toastImported} (${count})`);
  }, [offlineMode, load, showToast, str.toastImported]);

  const onImportFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImportFile(reader.result);
      if (!parsed || parsed.length === 0) { showError(str.toastImportFail); return; }
      importPresetsLocal(parsed);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [importPresetsLocal, showError, str.toastImportFail]);

  const onImportFromClipboard = async () => {
    if (!importText.trim()) return;
    const shared = parseShareString(importText.trim());
    if (shared) { await importPresetsLocal([shared]); setShowImportDialog(false); setImportText(''); return; }
    const parsed = parseImportFile(importText.trim());
    if (parsed && parsed.length > 0) { await importPresetsLocal(parsed); setShowImportDialog(false); setImportText(''); return; }
    showError(str.toastImportFail);
  };

  const onSharePreset = async (id) => {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    const s2 = presetToShareString(p);
    if (!s2) { showError('Share failed'); return; }
    try { await navigator.clipboard.writeText(s2); showToast('ok', str.toastCopied); }
    catch { showError('Clipboard unavailable'); }
  };

  // ---- Bulk actions ----

  const togglePresetSelect = useCallback((id) => {
    setSelectedPresetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllPresets = useCallback(() => {
    setSelectedPresetIds(new Set(sortedPresets.map(p => p.id)));
  }, [sortedPresets]);

  const clearPresetSelection = useCallback(() => {
    setSelectedPresetIds(new Set());
  }, []);

  const bulkDeletePresets = useCallback(async () => {
    if (selectedPresetSet.size === 0) return;
    // Show confirm modal for bulk delete
    setDeleteModal({ open: true, presetId: '__bulk__' });
  }, [selectedPresetSet]);

  const runBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedPresetSet);
    for (const id of ids) {
      if (offlineMode) {
        setPresets(prev => prev.filter(p => String(p.id) !== String(id)));
      } else {
        await deletePreset(id);
      }
    }
    if (!offlineMode) await load();
    setSelectedPresetIds(new Set());
    showToast('ok', str.toastDeleted);
  }, [selectedPresetSet, offlineMode, load, showToast, str.toastDeleted]);

  const bulkExportPresets = useCallback(() => {
    const selected = presets.filter(p => selectedPresetSet.has(p.id));
    if (selected.length === 0) return;
    exportAllPresetsAsJson(selected);
  }, [presets, selectedPresetSet]);

  const bulkDuplicatePresets = useCallback(async () => {
    const selected = presets.filter(p => selectedPresetSet.has(p.id));
    if (selected.length === 0) return;
    for (const p of selected) {
      await onDuplicate(p.id);
    }
    setSelectedPresetIds(new Set());
  }, [presets, selectedPresetSet, onDuplicate]);

  const bulkToggleActive = useCallback(async (enable) => {
    const ids = Array.from(selectedPresetSet);
    for (const id of ids) {
      const p = presets.find(x => x.id === id);
      if (!p || p.visibleInWidget === enable) continue;
      if (offlineMode) {
        setPresets(prev => prev.map(x => x.id === id ? { ...x, visibleInWidget: enable, updatedAt: new Date().toISOString() } : x));
      } else {
        await patchPreset(id, { visibleInWidget: enable });
      }
    }
    if (!offlineMode) await load();
    showToast('ok', str.toastSaved);
  }, [selectedPresetSet, presets, offlineMode, load, showToast, str.toastSaved]);

  // ---- Drag and drop ----

  const handleDragStart = useCallback((e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  }, [dragOverId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    // Reorder: swap order values
    const sourceIdx = sortedPresets.findIndex(p => p.id === dragId);
    const targetIdx = sortedPresets.findIndex(p => p.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) { setDragId(null); return; }

    // Build new order assignments based on position swap
    const newOrder = sortedPresets.map(p => p.id);
    newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, dragId);

    // Assign descending order values
    const updates = {};
    newOrder.forEach((id, idx) => { updates[id] = newOrder.length - idx; });

    if (offlineMode) {
      setPresets(prev => prev.map(p => updates[p.id] !== undefined ? { ...p, order: updates[p.id] } : p));
    } else {
      const promises = Object.entries(updates).map(([id, order]) => patchPreset(id, { order }));
      await Promise.all(promises);
      await load();
    }
    setDragId(null);
    showToast('ok', str.toastSaved);
  }, [dragId, sortedPresets, offlineMode, load, showToast, str.toastSaved]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);

  // ---- Quick inline field editing ----

  const startQuickEdit = useCallback((id, field, currentValue) => {
    setQuickEditField({ id, field, value: currentValue });
  }, []);

  const saveQuickEdit = useCallback(async () => {
    if (!quickEditField) return;
    const { id, field, value } = quickEditField;
    const patch = {};
    if (field === 'name') patch.name = String(value || '').trim();
    else if (field === 'order') patch.order = Number.parseInt(String(value ?? 0), 10) || 0;
    if (offlineMode) {
      setPresets(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
    } else {
      const res = await patchPreset(id, patch);
      if (!res.ok) { showError(res.message); setQuickEditField(null); return; }
      await load();
    }
    showToast('ok', str.toastSaved);
    setQuickEditField(null);
  }, [quickEditField, offlineMode, load, showToast, str.toastSaved, showError]);

  const cancelQuickEdit = useCallback(() => {
    setQuickEditField(null);
  }, []);

  const handleQuickEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveQuickEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelQuickEdit(); }
  }, [saveQuickEdit, cancelQuickEdit]);

  // ---- Render helpers ----

  const renderCard = (p) => {
    const isDefault = defaultPresetId && p.id === defaultPresetId;
    const saving = !!savingById[p.id];
    const defaulting = !!defaultingById[p.id];
    const deleting = !!deletingById[p.id];
    const duplicating = !!duplicatingById[p.id];
    const matVis = getMaterialVisual(p.material_key);
    const ov = p.print_overrides || {};
    const isEditing = inlineEditId === p.id;
    const showPreview = previewPresetId === p.id;
    const estimated = showPreview ? estimatePresetPrice(p, pricingConfig, p.material_key) : null;
    const idx = sortedPresets.findIndex(x => x.id === p.id);
    const isSelected = selectedPresetSet.has(p.id);
    const isDragging = dragId === p.id;
    const isDragOver = dragOverId === p.id;
    const isQuickEditingName = quickEditField?.id === p.id && quickEditField?.field === 'name';
    const isQuickEditingOrder = quickEditField?.id === p.id && quickEditField?.field === 'order';

    return (
      <div key={p.id}
        draggable
        onDragStart={(e) => handleDragStart(e, p.id)}
        onDragOver={(e) => handleDragOver(e, p.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, p.id)}
        onDragEnd={handleDragEnd}
        style={{
          marginBottom: isEditing ? 0 : 12,
          opacity: isDragging ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}>
        <div style={{
          border: `1px solid ${isDragOver ? 'var(--forge-accent-primary)' : isSelected ? 'rgba(0,212,170,0.6)' : isDefault ? 'rgba(0,212,170,0.5)' : p.visibleInWidget ? matVis.colors.border : 'var(--forge-border-default)'}`,
          borderRadius: isEditing ? '8px 8px 0 0' : 'var(--forge-radius-md, 8px)',
          opacity: p.visibleInWidget ? 1 : 0.6,
          background: isDragOver ? 'rgba(0,212,170,0.04)' : isSelected ? 'rgba(0,212,170,0.03)' : isEditing ? 'var(--forge-bg-elevated)' : 'var(--forge-bg-surface)',
          overflow: 'hidden', transition: 'border-color 0.15s, opacity 0.15s, background 0.15s',
          boxShadow: isDragOver ? '0 0 0 2px rgba(0,212,170,0.2)' : 'none',
        }}>
          {/* Header */}
          <div style={cs.cardHeader}>
            <div style={cs.cardHeaderLeft}>
              <div onClick={(e) => { e.stopPropagation(); togglePresetSelect(p.id); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ForgeCheckbox checked={isSelected} onChange={() => {}} size={16} />
              </div>
              <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--forge-text-muted)', padding: '0 2px' }} title="Drag to reorder">
                <Icon name="GripVertical" size={14} />
              </div>
              {p.material_key && (
                <span style={{ ...cs.matBadge, background: matVis.colors.bg, borderColor: matVis.colors.border, color: matVis.colors.accent }}>
                  <Icon name={matVis.icon} size={12} />
                  {availableMaterials.find(m => m.key === p.material_key)?.name || p.material_key}
                </span>
              )}
              {isDefault && <span style={cs.defBadge}><Icon name="Star" size={10} />{str.badgeDefault}</span>}
              <button onClick={() => onToggleActive(p.id)} disabled={actionsDisabled || saving}
                style={{ ...cs.statusBtn, ...(p.visibleInWidget ? cs.statusActive : cs.statusInactive) }}
                title={p.visibleInWidget ? str.active : str.inactive}>
                <Icon name={p.visibleInWidget ? 'Eye' : 'EyeOff'} size={10} />
                {p.visibleInWidget ? str.active : str.inactive}
              </button>
            </div>
            <div style={cs.reorderWrap}>
              <button onClick={() => onMovePreset(p.id, 'up')} disabled={actionsDisabled || idx <= 0} style={cs.arrowBtn} title={str.moveUp} aria-label={str.moveUp}><Icon name="ChevronUp" size={14} /></button>
              <button onClick={() => onMovePreset(p.id, 'down')} disabled={actionsDisabled || idx >= sortedPresets.length - 1} style={cs.arrowBtn} title={str.moveDown} aria-label={str.moveDown}><Icon name="ChevronDown" size={14} /></button>
            </div>
          </div>

          {/* Body */}
          <div style={cs.cardBody}>
            {isQuickEditingName ? (
              <input
                autoFocus
                type="text"
                value={quickEditField.value}
                onChange={(e) => setQuickEditField(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={handleQuickEditKeyDown}
                onBlur={saveQuickEdit}
                style={{ ...cs.pName, border: '1px solid var(--forge-accent-primary)', borderRadius: 4, padding: '2px 6px', background: 'var(--forge-bg-elevated)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            ) : (
              <div style={{ ...cs.pName, cursor: 'pointer' }} onDoubleClick={() => startQuickEdit(p.id, 'name', p.name || p.id)} title="Double-click to edit">{p.name || p.id}</div>
            )}
            <div style={cs.pId}>ID: {p.id}</div>
            <div style={cs.paramsGrid}>
              <div style={cs.paramItem}><span style={cs.paramLabel}>{str.layerHeight}</span><span style={cs.paramVal}>{ov.layer_height != null ? `${ov.layer_height} mm` : '--'}</span></div>
              <div style={cs.paramItem}><span style={cs.paramLabel}>{str.infill}</span><span style={cs.paramVal}>{ov.infill_sparse_density != null ? `${ov.infill_sparse_density}%` : '--'}</span></div>
              <div style={cs.paramItem}><span style={cs.paramLabel}>{str.speed}</span><span style={cs.paramVal}>{ov.max_print_speed != null ? `${ov.max_print_speed} mm/s` : '--'}</span></div>
              <div style={cs.paramItem}><span style={cs.paramLabel}>{str.supports}</span><span style={cs.paramVal}>{ov.support_material != null ? (ov.support_material ? t('admin.presets.yes', 'Yes') : t('admin.presets.no', 'No')) : '--'}</span></div>
            </div>
            {showPreview && (
              <div style={cs.previewBox}>
                <div style={cs.previewLabel}><Icon name="Calculator" size={12} />{str.estPrice} ({str.sampleModel})</div>
                <div style={cs.previewVal}>{estimated != null ? `${estimated.toFixed(2)} CZK` : t('admin.presets.estPriceNA', 'N/A')}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={cs.cardActions}>
            <button onClick={() => setInlineEditId(isEditing ? null : p.id)} disabled={actionsDisabled} style={cs.actBtn} title={str.edit}>
              <Icon name={isEditing ? 'ChevronUp' : 'Pencil'} size={14} />{str.edit}
            </button>
            <button onClick={() => onDuplicate(p.id)} disabled={actionsDisabled || duplicating} style={cs.actBtn} title={str.duplicate}>
              {duplicating ? <Icon name="Loader2" size={14} className="spin" /> : <Icon name="Copy" size={14} />}{str.duplicate}
            </button>
            <button onClick={() => onSetDefault(p.id)} disabled={actionsDisabled || isDefault || defaulting} style={cs.actBtn} title={str.setAsDefault}>
              {defaulting ? <Icon name="Loader2" size={14} className="spin" /> : <Icon name="Star" size={14} />}{str.setAsDefault}
            </button>
            <button onClick={() => setPreviewPresetId(showPreview ? null : p.id)} style={cs.actBtn} title={str.estPrice}>
              <Icon name="Calculator" size={14} />
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => openIniModal(p.id, p.name)} style={cs.actBtn} title={str.viewIni}><Icon name="FileText" size={14} />{str.viewIni}</button>
            <button onClick={() => exportPresetAsJson(p)} style={cs.actBtn} title="Export"><Icon name="Download" size={14} /></button>
            <button onClick={() => onSharePreset(p.id)} style={cs.actBtn} title={str.share}><Icon name="Share2" size={14} /></button>
            <button onClick={() => onDelete(p.id)} disabled={actionsDisabled || deleting || saving} style={cs.actBtnDanger} title={str.delete}>
              {deleting ? <Icon name="Loader2" size={14} className="spin" /> : <Icon name="Trash2" size={14} />}
            </button>
          </div>
        </div>

        {isEditing && (
          <div style={{ border: '1px solid var(--forge-border-default)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            <PresetInlineEditor preset={p} onSave={onInlineSave} onCancel={() => setInlineEditId(null)} language={language} availableMaterials={availableMaterials} />
          </div>
        )}
      </div>
    );
  };

  const hasGroups = Object.keys(groupedPresets).length > 1 || (Object.keys(groupedPresets).length === 1 && !groupedPresets['__other__']);

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-header">
        <div>
          <div className="ap-titleRow">
            <h1 className="ap-title">{str.title}</h1>
            <span className={`ap-dot ${offlineMode ? 'off' : 'on'}`} />
            <span className={`ap-status ${offlineMode ? 'off' : 'on'}`}>{offlineMode ? str.statusOffline : str.statusOnline}</span>
          </div>
          <p className="ap-sub">{str.subtitle}</p>
        </div>
        <div className="ap-hdrActs">
          {presets.length >= 2 && <button className={`ap-btn ${showComparison ? 'primary' : ''}`} onClick={() => setShowComparison(!showComparison)} disabled={loading}><Icon name="Columns" size={16} />{str.compare}</button>}
          {presets.length > 0 && <button className="ap-btn" onClick={() => exportAllPresetsAsJson(presets)} disabled={loading}><Icon name="Download" size={16} />{str.exportAll}</button>}
          <button className="ap-btn" onClick={() => setShowImportDialog(true)}><Icon name="Upload" size={16} />{str.importPresets}</button>
          <button className="ap-btn" onClick={load} disabled={loading}><Icon name="RefreshCcw" size={16} />{str.refresh}</button>
        </div>
      </div>

      {offlineMode && (
        <div className="ap-banner">
          <Icon name="WifiOff" size={16} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--forge-error)' }}>{str.offlineBanner}</div>
            {backendError && <div style={{ marginTop: 4, fontSize: 12 }}><span className="ap-muted">{str.backendErrorLabel}</span> {backendError}</div>}
          </div>
        </div>
      )}

      {/* Upload toggle */}
      <div style={{ marginTop: 12 }}>
        <button className={`ap-btn ${showUploadForm ? 'primary' : ''}`} onClick={() => setShowUploadForm(!showUploadForm)}>
          <Icon name={showUploadForm ? 'ChevronUp' : 'Plus'} size={16} />{str.uploadPreset}
        </button>
      </div>

      {showUploadForm && (
        <div className="ap-card ap-pad" style={{ marginTop: 8 }}>
          <div className="ap-upGrid">
            <div className="ap-field">
              <div className="ap-label">{str.fileLabel}</div>
              <input
                ref={iniInputRef}
                type="file"
                accept=".ini"
                disabled={actionsDisabled || uploading}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setUploadFile(f);
                  if (f && !uploadName) setUploadName(String(f.name || '').replace(/\.ini$/i, ''));
                }}
              />
              <div
                className={`ap-dropzone${uploadFile ? ' has-file' : ''}`}
                onClick={() => { if (!actionsDisabled && !uploading && iniInputRef.current) iniInputRef.current.click(); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('drag-over'); }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  e.currentTarget.classList.remove('drag-over');
                  const f = e.dataTransfer.files?.[0] || null;
                  if (f && f.name.toLowerCase().endsWith('.ini')) {
                    setUploadFile(f);
                    if (!uploadName) setUploadName(String(f.name || '').replace(/\.ini$/i, ''));
                  }
                }}
                style={{ cursor: actionsDisabled || uploading ? 'not-allowed' : 'pointer', opacity: actionsDisabled || uploading ? 0.5 : 1 }}
              >
                {uploadFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="FileCheck" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forge-text-primary)' }}>{uploadFile.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--forge-text-muted)' }}>{(uploadFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      type="button"
                      className="ap-iconBtn"
                      style={{ width: 24, height: 24, marginLeft: 'auto', flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (iniInputRef.current) iniInputRef.current.value = ''; }}
                      title="Remove"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Icon name="UploadCloud" size={28} style={{ color: 'var(--forge-text-muted)' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forge-text-secondary)' }}>{pickLang(language, 'Nahrat .INI soubor', 'Upload .INI file')}</div>
                    <div style={{ fontSize: 11, color: 'var(--forge-text-muted)' }}>{pickLang(language, 'Klikni nebo pretahni sem', 'Click or drag & drop')}</div>
                  </div>
                )}
              </div>
              <div className="ap-hint">{str.hintMax5mb}</div>
            </div>
            <div className="ap-field"><div className="ap-label">{str.colName}</div><input className="ap-input" type="text" placeholder={str.namePlaceholder} value={uploadName} disabled={actionsDisabled || uploading} onChange={(e) => setUploadName(e.target.value)} /></div>
            <div className="ap-field"><div className="ap-label">{str.orderLabel}</div><input className="ap-input" type="text" inputMode="numeric" value={uploadOrder ?? ''} disabled={actionsDisabled || uploading} onChange={(e) => setUploadOrder(parseIntInput(e.target.value))} onBlur={() => setUploadOrder(finalizeDecimal(uploadOrder, 0))} /></div>
            <div className="ap-field"><div className="ap-label">{str.materialLabel}</div><select className="ap-input" value={uploadMaterialKey || ''} disabled={actionsDisabled || uploading} onChange={(e) => setUploadMaterialKey(e.target.value || null)}><option value="">{str.allMaterials}</option>{availableMaterials.map(m => <option key={m.key} value={m.key}>{m.name} ({m.key})</option>)}</select></div>
            <div className="ap-field" style={{ alignSelf: 'end' }}><ForgeCheckbox checked={uploadVisibleInWidget} disabled={actionsDisabled || uploading} onChange={(e) => setUploadVisibleInWidget(e.target.checked)} label={str.visibleInWidget} /></div>
            <div className="ap-field" style={{ alignSelf: 'end', justifySelf: 'end' }}><button className="ap-btn primary" onClick={onUpload} disabled={actionsDisabled || uploading}>{uploading ? <Icon name="Loader2" size={16} className="spin" /> : <Icon name="Upload" size={16} />}{str.uploadPreset}</button></div>
          </div>
        </div>
      )}

      <PresetTemplates onCreateFromTemplate={onCreateFromTemplate} language={language} disabled={actionsDisabled} />

      {showComparison && <PresetComparison allPresets={presets} selectedIds={compareIds} onChangeSelection={setCompareIds} onClose={() => { setShowComparison(false); setCompareIds([]); }} language={language} />}

      {/* Bulk actions toolbar */}
      {!loading && presets.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <div onClick={(e) => { e.stopPropagation(); selectedPresetSet.size === sortedPresets.length ? clearPresetSelection() : selectAllPresets(); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ForgeCheckbox checked={selectedPresetSet.size > 0 && selectedPresetSet.size === sortedPresets.length} onChange={() => {}} size={16} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--forge-text-secondary)' }}>{str.selectAll}</span>
          </div>
          {selectedPresetSet.size > 0 && (
            <div className="ap-bulk-bar">
              <span className="ap-bulk-count">{selectedPresetSet.size} {str.bulkSelected}</span>
              <button className="ap-btn" onClick={() => bulkToggleActive(true)} title={str.bulkEnable}><Icon name="Eye" size={14} />{str.bulkEnable}</button>
              <button className="ap-btn" onClick={() => bulkToggleActive(false)} title={str.bulkDisable}><Icon name="EyeOff" size={14} />{str.bulkDisable}</button>
              <button className="ap-btn" onClick={bulkDuplicatePresets} title={str.bulkDuplicate}><Icon name="Copy" size={14} />{str.bulkDuplicate}</button>
              <button className="ap-btn" onClick={bulkExportPresets} title={str.bulkExport}><Icon name="Download" size={14} />{str.bulkExport}</button>
              <button className="ap-btn danger" onClick={bulkDeletePresets} title={str.bulkDeleteAll}><Icon name="Trash2" size={14} />{str.bulkDeleteAll}</button>
              <button className="ap-btn" onClick={clearPresetSelection} style={{ marginLeft: 4 }}><Icon name="X" size={14} />{str.clearSelection}</button>
            </div>
          )}
        </div>
      )}

      {/* Search + filter */}
      {!loading && presets.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '0 1 280px', minWidth: 180 }}>
            <Icon name="Search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--forge-text-muted)' }} />
            <input type="text" placeholder={str.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-primary)', fontSize: 13 }} />
          </div>
          {materialKeys.length > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)' }}>{str.filterMat}</span>
              <button onClick={() => setMaterialFilter('')} style={{ ...cs.filterChip, ...(materialFilter === '' ? cs.filterChipActive : {}) }}>{str.groupAll}</button>
              {materialKeys.map(key => {
                const vis = getMaterialVisual(key);
                return <button key={key} onClick={() => setMaterialFilter(key === materialFilter ? '' : key)} style={{ ...cs.filterChip, ...(materialFilter === key ? { background: vis.colors.bg, borderColor: vis.colors.border, color: vis.colors.accent } : {}) }}>{availableMaterials.find(m => m.key === key)?.name || key}</button>;
              })}
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)' }}>{filteredPresets.length}/{presets.length}</div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : presets.length === 0 ? (
        <div className="ap-empty"><Icon name="Package" size={32} style={{ color: 'var(--forge-text-muted)', marginBottom: 8 }} /><p>{str.emptyTitle}</p><p className="ap-muted">{str.emptyHint}</p></div>
      ) : filteredPresets.length === 0 && (search || materialFilter) ? (
        <p style={{ color: 'var(--forge-text-muted)', padding: 24, textAlign: 'center' }}>{str.noResults}</p>
      ) : hasGroups && !materialFilter ? (
        <div>
          {Object.entries(groupedPresets).map(([key, group]) => {
            const vis = getMaterialVisual(key === '__other__' ? null : key);
            const label = key === '__other__' ? str.groupOther : (availableMaterials.find(m => m.key === key)?.name || key);
            return (
              <div key={key} style={{ marginBottom: 20 }}>
                <div style={cs.groupHdr}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: vis.colors.accent }} />
                  <Icon name={vis.icon} size={16} style={{ color: vis.colors.accent }} />
                  <span style={cs.groupTitle}>{label}</span>
                  <span style={cs.groupCount}>{group.length}</span>
                </div>
                <div style={cs.cardsGrid}>{group.map(p => renderCard(p))}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={cs.cardsGrid}>{sortedPresets.map(p => renderCard(p))}</div>
      )}

      {/* Delete modal */}
      {deleteModal.open && (
        <div className="ap-overlay" role="dialog" aria-modal="true" ref={deleteOverlayRef}>
          <div className="ap-modal">
            <div className="ap-mHdr"><div className="ap-mTitle">{deleteModal.presetId === '__bulk__' ? str.bulkDeleteConfirm : (defaultPresetId && deleteModal.presetId === defaultPresetId ? str.deleteDefaultTitle : str.deleteTitle)}</div><button className="ap-iconBtn" onClick={() => setDeleteModal({ open: false, presetId: null })}><Icon name="X" size={16} /></button></div>
            <div className="ap-mBody"><pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', color: 'var(--forge-text-secondary)', lineHeight: 1.5 }}>{deleteModal.presetId === '__bulk__' ? str.bulkDeleteBody : (defaultPresetId && deleteModal.presetId === defaultPresetId ? str.deleteDefaultBody : str.deleteBody)}</pre></div>
            <div className="ap-mFoot"><button className="ap-btn" onClick={() => setDeleteModal({ open: false, presetId: null })}>{str.confirmCancel}</button><button className="ap-btn danger" onClick={async () => { const id = deleteModal.presetId; setDeleteModal({ open: false, presetId: null }); if (id === '__bulk__') await runBulkDelete(); else if (id) await runDelete(id); }}><Icon name="Trash2" size={16} />{str.confirmYes}</button></div>
          </div>
        </div>
      )}

      {/* INI viewer modal */}
      {iniModal.open && (
        <div className="ap-overlay" role="dialog" aria-modal="true" ref={iniOverlayRef} onClick={(e) => { if (e.target === iniOverlayRef.current) closeIniModal(); }}>
          <div className="ap-modal ap-ini-modal">
            <div className="ap-mHdr">
              <div className="ap-mTitle"><Icon name="FileText" size={14} style={{ marginRight: 6 }} />{iniModal.presetName} — {str.iniModalTitle}</div>
              <button className="ap-iconBtn" onClick={closeIniModal} aria-label={str.iniClose}><Icon name="X" size={16} /></button>
            </div>
            <div className="ap-mBody ap-ini-body">
              {iniLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center', color: 'var(--forge-text-muted)' }}>
                  <Icon name="Loader2" size={18} className="spin" />{str.iniLoading}
                </div>
              )}
              {iniError && !iniLoading && (
                <div style={{ padding: 20, color: 'var(--forge-error)', textAlign: 'center' }}>
                  <Icon name="AlertTriangle" size={18} style={{ marginRight: 6 }} />{str.iniLoadError} {iniError}
                </div>
              )}
              {!iniLoading && !iniError && !iniContent && (
                <div style={{ padding: 20, color: 'var(--forge-text-muted)', textAlign: 'center' }}>{str.iniEmpty}</div>
              )}
              {!iniLoading && !iniError && iniContent && (
                <pre className="ap-ini-content">{iniContent.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  const isSectionHeader = /^\[.+\]$/.test(trimmed);
                  const isComment = trimmed.startsWith('#') || trimmed.startsWith(';');
                  if (isSectionHeader) return <div key={i} className="ap-ini-section">{line}</div>;
                  if (isComment) return <div key={i} className="ap-ini-comment">{line}</div>;
                  return <div key={i}>{line}</div>;
                })}</pre>
              )}
            </div>
            <div className="ap-mFoot">
              <button className="ap-btn" onClick={closeIniModal}>{str.iniClose}</button>
            </div>
          </div>
        </div>
      )}

      {/* Import dialog */}
      <ForgeDialog open={showImportDialog} onClose={() => { setShowImportDialog(false); setImportText(''); }} title={str.importPresets} maxWidth="520px"
        footer={<><button className="ap-btn" onClick={() => { setShowImportDialog(false); setImportText(''); }}>{str.confirmCancel}</button><button className="ap-btn primary" onClick={onImportFromClipboard} disabled={!importText.trim()}><Icon name="Download" size={16} />{str.importPresets}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--forge-text-secondary)' }}>{t('admin.presets.importPasteLabel', 'Paste JSON data or share string (base64):')}</div>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder={t('admin.presets.importPastePlaceholder', 'Paste JSON or share string...')} style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-primary)', fontSize: 13, fontFamily: 'var(--forge-font-tech)', resize: 'vertical' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--forge-text-muted)' }}>{t('admin.presets.importOrFile', 'Or file:')}</span>
            <input type="file" accept=".json" ref={fileInputRef} onChange={onImportFile} style={{ fontSize: 12, color: 'var(--forge-text-secondary)' }} />
          </div>
        </div>
      </ForgeDialog>

      {/* Edit dialog — simplified to 4 editable fields only */}
      <ForgeDialog open={!!editingPresetId} onClose={closePresetDialog} title={presetDraft?.name || str.dialogTitle} maxWidth="480px"
        footer={<><button className="ap-btn" onClick={closePresetDialog}>{str.dialogCancel}</button><button className="ap-btn primary" onClick={savePresetDialog}><Icon name="Save" size={16} />{str.dialogSave}</button></>}>
        {presetDraft && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div className="ap-sectionLabel">{str.sectionMeta}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="ap-field"><div className="ap-label">{str.colName}</div><input className="ap-input" value={presetDraft.name} onChange={e => updatePresetDraft('name', e.target.value)} /></div>
                <div className="ap-field"><div className="ap-label">{str.orderLabel}</div><input className="ap-input" type="text" inputMode="numeric" value={presetDraft.order ?? ''} onChange={e => updatePresetDraft('order', parseIntInput(e.target.value))} onBlur={() => updatePresetDraft('order', finalizeDecimal(presetDraft.order, 0))} /></div>
                <div className="ap-field"><div className="ap-label">{str.materialLabel}</div><select className="ap-input" value={presetDraft.material_key || ''} onChange={e => updatePresetDraft('material_key', e.target.value || null)}><option value="">{str.allMaterials}</option>{availableMaterials.map(m => <option key={m.key} value={m.key}>{m.name} ({m.key})</option>)}</select></div>
                <div className="ap-field" style={{ display: 'flex', alignItems: 'flex-end' }}><ForgeCheckbox checked={!!presetDraft.visibleInWidget} onChange={e => updatePresetDraft('visibleInWidget', e.target.checked)} label={str.visibleInWidget} /></div>
              </div>
            </div>
          </div>
        )}
      </ForgeDialog>

      {toast && <div className={`ap-toast ${toast.kind === 'err' ? 'err' : 'ok'}`}>{toast.kind === 'err' ? <Icon name="XCircle" size={18} /> : <Icon name="CheckCircle" size={18} />}<span>{toast.msg}</span></div>}

      <style>{presetsCSS}</style>
    </div>
  );
}

// ============ Inline styles ============

const cs = {
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 0 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)', gap: 8 },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  matBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.06em', border: '1px solid' },
  defBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'var(--forge-font-tech)', background: 'rgba(0,212,170,0.12)', color: 'var(--forge-success)', border: '1px solid rgba(0,212,170,0.3)' },
  statusBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.06em', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s' },
  statusActive: { background: 'rgba(0,212,170,0.08)', borderColor: 'rgba(0,212,170,0.25)', color: 'var(--forge-accent-primary)' },
  statusInactive: { background: 'rgba(255,71,87,0.06)', borderColor: 'rgba(255,71,87,0.2)', color: 'var(--forge-text-muted)' },
  reorderWrap: { display: 'flex', gap: 2, flexShrink: 0 },
  arrowBtn: { width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-surface)', color: 'var(--forge-text-secondary)', cursor: 'pointer', padding: 0 },
  cardBody: { padding: '12px 14px' },
  pName: { fontSize: 15, fontWeight: 700, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', marginBottom: 2 },
  pId: { fontSize: 11, color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', marginBottom: 10 },
  paramsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 12px' },
  paramItem: { display: 'flex', flexDirection: 'column', gap: 1 },
  paramLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)' },
  paramVal: { fontSize: 13, fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-tech)' },
  previewBox: { marginTop: 10, padding: '8px 12px', borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid rgba(0,212,170,0.25)', background: 'rgba(0,212,170,0.04)' },
  previewLabel: { fontSize: 11, fontWeight: 700, color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  previewVal: { fontSize: 16, fontWeight: 800, color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-tech)' },
  cardActions: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderTop: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)', flexWrap: 'wrap' },
  actBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-surface)', color: 'var(--forge-text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' },
  actBtnDanger: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--forge-radius-md, 8px)', border: '1px solid rgba(255,71,87,0.25)', background: 'rgba(255,71,87,0.06)', color: 'var(--forge-error)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' },
  groupHdr: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', marginBottom: 4 },
  groupTitle: { fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' },
  groupCount: { fontSize: 11, fontWeight: 700, color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--forge-border-default)' },
  filterChip: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  filterChipActive: { background: 'rgba(0,212,170,0.12)', borderColor: 'rgba(0,212,170,0.4)', color: 'var(--forge-accent-primary)' },
};

const presetsCSS = `
  .ap-page { padding: 20px; }
  .ap-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
  .ap-titleRow { display: flex; align-items: center; gap: 10px; }
  .ap-title { font-size: 22px; font-weight: 700; line-height: 1.1; margin: 0; color: var(--forge-text-primary); }
  .ap-sub { margin: 6px 0 0; color: var(--forge-text-secondary); max-width: 620px; font-size: 14px; }
  .ap-hdrActs { display: flex; gap: 8px; flex-wrap: wrap; }

  .ap-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-top: 2px; }
  .ap-dot.on { background: var(--forge-success); }
  .ap-dot.off { background: var(--forge-error); }
  .ap-status { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--forge-border-default); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em; }
  .ap-status.on { background: rgba(0,212,170,0.1); color: var(--forge-success); }
  .ap-status.off { background: rgba(255,71,87,0.1); color: var(--forge-error); }

  .ap-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--forge-radius-md); border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); cursor: pointer; font-weight: 600; color: var(--forge-text-primary); font-size: 13px; transition: border-color 0.15s; }
  .ap-btn:hover { border-color: var(--forge-accent-primary); }
  .ap-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .ap-btn.primary { background: rgba(0,212,170,0.1); border-color: rgba(0,212,170,0.3); color: var(--forge-accent-primary); }
  .ap-btn.danger { background: rgba(255,71,87,0.08); border-color: rgba(255,71,87,0.25); color: var(--forge-error); }

  .ap-banner { display: flex; gap: 10px; align-items: flex-start; border: 1px solid rgba(255,71,87,0.35); background: rgba(255,71,87,0.08); padding: 10px 12px; border-radius: var(--forge-radius-md); margin: 12px 0; color: var(--forge-text-secondary); }
  .ap-empty { padding: 40px 18px; color: var(--forge-text-secondary); text-align: center; }
  .ap-muted { color: var(--forge-text-muted); }

  .ap-card { border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md); background: var(--forge-bg-surface); overflow: hidden; }
  .ap-pad { padding: 14px; overflow: visible; }

  .ap-upGrid { display: grid; grid-template-columns: 1.2fr 1.2fr 0.5fr 0.8fr 0.9fr auto; gap: 12px; align-items: start; }
  @media (max-width: 980px) { .ap-upGrid { grid-template-columns: 1fr; } }
  .ap-field { display: flex; flex-direction: column; gap: 6px; }
  .ap-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-text-muted); font-family: var(--forge-font-tech); }
  .ap-sectionLabel { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-text-muted); font-family: var(--forge-font-tech); margin-bottom: 12px; }
  .ap-hint { font-size: 12px; color: var(--forge-text-muted); }
  .ap-input { width: 100%; padding: 9px 10px; border-radius: var(--forge-radius-md); border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-primary); }
  .ap-input:focus { border-color: var(--forge-accent-primary); box-shadow: 0 0 0 2px rgba(0,212,170,0.15); outline: none; }
  .ap-input:disabled { background: var(--forge-bg-void); cursor: not-allowed; opacity: 0.5; }

  .ap-dropzone { border: 2px dashed var(--forge-border-default); border-radius: var(--forge-radius-md); padding: 20px 16px; text-align: center; transition: border-color 0.2s, background 0.2s; background: var(--forge-bg-elevated); }
  .ap-dropzone:hover { border-color: var(--forge-accent-primary); background: rgba(0,212,170,0.04); }
  .ap-dropzone.drag-over { border-color: var(--forge-accent-primary); background: rgba(0,212,170,0.08); }
  .ap-dropzone.has-file { border-style: solid; border-color: rgba(0,212,170,0.35); background: rgba(0,212,170,0.04); padding: 12px 16px; text-align: left; }

  .spin { animation: ap-spin 1s linear infinite; }
  @keyframes ap-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .ap-bulk-bar { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid rgba(0,212,170,0.3); border-radius: var(--forge-radius-md); background: rgba(0,212,170,0.04); flex-wrap: wrap; }
  .ap-bulk-count { font-size: 12px; font-weight: 700; color: var(--forge-accent-primary); font-family: var(--forge-font-tech); padding-right: 6px; border-right: 1px solid var(--forge-border-default); margin-right: 2px; }

  .ap-toast { position: fixed; right: 16px; bottom: 16px; z-index: 1000; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--forge-radius-md); background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); box-shadow: 0 10px 30px rgba(0,0,0,0.40); max-width: min(520px, calc(100vw - 32px)); color: var(--forge-text-primary); font-size: 13px; }
  .ap-toast.ok { border-color: rgba(0,212,170,0.4); }
  .ap-toast.err { border-color: rgba(255,71,87,0.4); }

  .ap-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 1100; }
  .ap-modal { width: min(600px, 100%); background: var(--forge-bg-surface); border-radius: var(--forge-radius-md); border: 1px solid var(--forge-border-default); box-shadow: 0 16px 50px rgba(0,0,0,0.50); overflow: hidden; }
  .ap-mHdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--forge-border-default); }
  .ap-mTitle { font-weight: 900; font-size: 14px; color: var(--forge-text-primary); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em; }
  .ap-iconBtn { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--forge-radius-md); border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); cursor: pointer; color: var(--forge-text-secondary); }
  .ap-iconBtn:hover { border-color: var(--forge-accent-primary); }
  .ap-mBody { padding: 14px 16px; }
  .ap-mFoot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); }

  /* INI viewer modal */
  .ap-ini-modal { width: min(780px, 100%); max-height: 85vh; display: flex; flex-direction: column; }
  .ap-ini-modal .ap-mHdr { flex-shrink: 0; }
  .ap-ini-modal .ap-mFoot { flex-shrink: 0; }
  .ap-ini-body { overflow-y: auto; max-height: 70vh; padding: 0 !important; }
  .ap-ini-content { margin: 0; padding: 16px 20px; font-family: var(--forge-font-tech, 'JetBrains Mono', 'Fira Code', monospace); font-size: 12px; line-height: 1.6; color: var(--forge-text-secondary); white-space: pre-wrap; word-break: break-all; background: var(--forge-bg-void, #181825); border: none; }
  .ap-ini-section { font-weight: 800; color: var(--forge-accent-primary, #00d4aa); font-size: 13px; margin-top: 12px; margin-bottom: 2px; padding: 2px 0; border-bottom: 1px solid rgba(0,212,170,0.15); }
  .ap-ini-section:first-child { margin-top: 0; }
  .ap-ini-comment { color: var(--forge-text-muted, #7A8291); font-style: italic; }
`;
