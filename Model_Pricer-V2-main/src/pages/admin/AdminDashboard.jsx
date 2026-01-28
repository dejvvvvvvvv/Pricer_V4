import React, { useMemo, useState } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

import { computeOverview } from '../../utils/adminAnalyticsStorage';
import { getTeamSummary, getSeatLimit } from '../../utils/adminTeamAccessStorage';
import { loadOrders } from '../../utils/adminOrdersStorage';
import { getAuditEntries } from '../../utils/adminAuditLogStorage';
import { readTenantJson } from '../../utils/adminTenantStorage';

import { loadDashboardConfig, saveDashboardConfig, resetDashboardConfig } from '../../utils/adminDashboardStorage';
import { DASHBOARD_CATEGORIES, DASHBOARD_METRICS, getMetricByKey } from '../../utils/dashboardMetricRegistry';

import {
  getBranding,
  getDefaultBranding,
  getPlanFeatures,
  getWidgets,
  getWidgetDomains,
} from '../../utils/adminBrandingWidgetStorage';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoNowEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function uid(prefix = 'card') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function formatValue({ value, valueType, language }) {
  if (valueType === 'text') return String(value ?? '—');

  if (valueType === 'percent') {
    const n = Number(value || 0);
    return `${(n * 100).toFixed(1)}%`;
  }

  if (valueType === 'currency') {
    const n = Number(value || 0);
    const fmt = new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', { maximumFractionDigits: 0 });
    return `${fmt.format(n)} Kč`;
  }

  if (valueType === 'minutes') {
    const n = Number(value || 0);
    return `${n.toFixed(1)} min`;
  }

  if (valueType === 'grams') {
    const n = Number(value || 0);
    const fmt = new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', { maximumFractionDigits: 0 });
    return `${fmt.format(n)} g`;
  }

  // default: number
  const n = Number(value || 0);
  const fmt = new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', { maximumFractionDigits: 0 });
  return fmt.format(n);
}

const AdminDashboard = () => {
  const RGL = useMemo(() => WidthProvider(GridLayout), []);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Dashboard layout (persistent, tenant-scoped)
  const [dashboardConfig, setDashboardConfig] = useState(() => loadDashboardConfig());
  const [draftConfig, setDraftConfig] = useState(null);

  const editing = !!draftConfig;
  const activeConfig = editing ? draftConfig : dashboardConfig;

  // Add / Settings modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addCategory, setAddCategory] = useState('all');

  const [settingsCardId, setSettingsCardId] = useState(null);

  // Branding tips banner (per project conventions, Branding/Widget pages use test-customer-1)
  const BRANDING_TENANT_ID = 'test-customer-1';

  // -----------------------
  // Live Data (computed once)
  // -----------------------

  const analyticsByDays = useMemo(() => {
    // Precompute common ranges so changing a card's days doesn't require extra storage hits.
    const ranges = [7, 30, 90];
    const map = {};
    const toISO = isoNowEnd();
    for (const days of ranges) {
      const fromISO = isoDaysAgo(days);
      map[days] = computeOverview({ fromISO, toISO });
    }
    return map;
  }, [refreshKey]);

  const teamSummary = useMemo(() => getTeamSummary(), [refreshKey]);
  const seatLimit = useMemo(() => getSeatLimit(), [refreshKey]);

  const ordersSummary = useMemo(() => {
    const allOrders = loadOrders();
    const newOrders = allOrders.filter(o => o.status === 'NEW' || o.status === 'REVIEW').length;
    const totalOrders = allOrders.length;
    return { newOrders, totalOrders };
  }, [refreshKey]);

  const parametersSummary = useMemo(() => {
    const config = readTenantJson('parameters:v1', null);
    if (!config?.parameters) return { activeCount: 0, changedCount: 0, widgetVisibleCount: 0 };
    const params = Object.values(config.parameters);
    const activeCount = params.filter(p => p?.active_for_slicing).length;
    const changedCount = params.filter(p => p?.default_value_override !== null && p?.default_value_override !== undefined).length;
    const widgetVisibleCount = params.filter(p => p?.widget_visible || p?.widget?.visible).length;
    return { activeCount, changedCount, widgetVisibleCount };
  }, [refreshKey]);

  const presetsList = useMemo(() => {
    const list = readTenantJson('presets:v1', []);
    return Array.isArray(list) ? list : [];
  }, [refreshKey]);

    const pricingData = useMemo(() => {
    // NOTE:
    // AdminPricing saves config to localStorage under keys like:
    // - modelpricer_pricing_config__test-customer-1
    // and stores MATERIALS primarily as an object: { materialPrices: { pla: 0.6, petg: 0.7, ... } }
    // (not as an array "materials"). Dashboard must support both shapes.
    const tryParse = (raw) => {
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    };

    const tenantId = localStorage.getItem('modelpricer:tenant_id') || 'test-customer-1';
    const keys = [
      `modelpricer_pricing_config__${tenantId}`,
      'modelpricer_pricing_config__test-customer-1',
      'modelpricer_pricing_config__demo-tenant',
    ];

    let config = null;
    for (const k of keys) {
      const parsed = tryParse(localStorage.getItem(k));
      if (parsed) { config = parsed; break; }
    }
    if (!config) return { hourlyRate: 300, materialCount: 0, totalMaterials: 0 };

    const hourlyRate =
      config?.tenant_pricing?.rate_per_hour ??
      config?.rate_per_hour ??
      config?.timeRate ??
      config?.tenant_pricing?.timeRate ??
      300;

    // Preferred shape (AdminPricing V3): materialPrices object
    const materialPrices =
      (config?.materialPrices && typeof config.materialPrices === 'object' ? config.materialPrices : null) ||
      (config?.config?.materialPrices && typeof config.config.materialPrices === 'object' ? config.config.materialPrices : null) ||
      null;

    if (materialPrices) {
      const total = Object.keys(materialPrices).filter((k) => k && materialPrices[k] !== null && materialPrices[k] !== undefined).length;
      return {
        hourlyRate,
        // In materialPrices shape we only store enabled materials, so "enabled" == "total"
        materialCount: total,
        totalMaterials: total,
      };
    }

    // Fallback legacy shape: materials array
    const materials = Array.isArray(config?.materials) ? config.materials : [];
    const totalMaterials = materials.length;
    const enabledMaterials = materials.filter((m) => m && m.enabled !== false);
    return {
      hourlyRate,
      materialCount: enabledMaterials.length,
      totalMaterials,
    };
  }, [refreshKey]);

    const feesData = useMemo(() => {
    const tryParse = (raw) => {
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    };

    const tenantId = localStorage.getItem('modelpricer:tenant_id') || 'test-customer-1';
    const keys = [
      `modelpricer_fees_config__${tenantId}`,
      'modelpricer_fees_config__test-customer-1',
      'modelpricer_fees_config__demo-tenant',
    ];

    let config = null;
    for (const k of keys) {
      const parsed = tryParse(localStorage.getItem(k));
      if (parsed) { config = parsed; break; }
    }

    // Fee storage can be:
    // - an array (legacy)
    // - an object { fees: [...] } (AdminFees V3)
    const fees = Array.isArray(config) ? config : (Array.isArray(config?.fees) ? config.fees : []);
    const isActive = (f) => {
      if (!f) return false;
      // explicit off
      if (f.active === false) return false;
      if (f.enabled === false || f.enabled === 0) return false;
      // explicit on
      if (f.active === true) return true;
      if (f.enabled === true || f.enabled === 1) return true;
      // default: treat missing flags as active (safer for demo)
      return true;
    };

    const normalizeType = (f) => {
      const raw =
        f?.type ??
        f?.calculationType ??
        f?.calculation_type ??
        'flat';
      let t = String(raw || 'flat').toLowerCase();
      if (t === 'fixed') t = 'flat';
      if (t === 'per_hour') t = 'per_minute'; // legacy compatibility
      return t;
    };

    const activeFees = fees.filter(isActive);
    const breakdown = activeFees.reduce((acc, f) => {
      const type = normalizeType(f);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return { totalActive: activeFees.length, breakdown };
  }, [refreshKey]);

  const widgetsList = useMemo(() => getWidgets(BRANDING_TENANT_ID), [refreshKey]);
  const widgetDomains = useMemo(() => getWidgetDomains(BRANDING_TENANT_ID), [refreshKey]);
  const planFeatures = useMemo(() => getPlanFeatures(BRANDING_TENANT_ID), [refreshKey]);

  const brandingTips = useMemo(() => {
    const current = getBranding(BRANDING_TENANT_ID);
    const defaults = getDefaultBranding();
    const tips = [];
    if (!current?.logo) tips.push(language === 'cs' ? 'Přidej logo (zlepší důvěryhodnost widgetu).' : 'Add a logo (improves trust).');
    if (!current?.businessName || current.businessName === defaults.businessName) tips.push(language === 'cs' ? 'Nastav název firmy v Brandingu.' : 'Set your business name in Branding.');
    if (!current?.tagline || current.tagline === defaults.tagline) tips.push(language === 'cs' ? 'Doplň tagline (krátký popis).' : 'Add a tagline (short description).');
    return tips.slice(0, 3);
  }, [refreshKey, language]);

  // Recent activity from Audit Log
  const recentActivity = useMemo(() => {
    const entries = getAuditEntries();
    return entries.slice(0, 5).map(e => ({
      id: e.id,
      text: e.summary || e.action,
      actor: e.actor_email || 'System',
      type: e.action.includes('CREATE') || e.action.includes('ADD') ? 'add' : 'update',
      time: formatTime(e.timestamp),
    }));
  }, [refreshKey]);

  // -----------------------
  // Actions
  // -----------------------

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const formatFeeType = (type) => {
    const map = {
      flat: 'fix',
      per_gram: 'Kč/g',
      per_minute: 'Kč/min',
      percent: '%',
      per_cm3: 'Kč/cm³',
      per_cm2: 'Kč/cm²',
      per_model: 'Kč/ks',
      per_layer: 'Kč/vr.',
      per_mm_height: 'Kč/mm'
    };
    return map[type] || type;
  };

  const startEdit = () => setDraftConfig(deepClone(dashboardConfig));
  const cancelEdit = () => setDraftConfig(null);

  const saveEdit = () => {
    const saved = saveDashboardConfig(draftConfig);
    setDashboardConfig(saved);
    setDraftConfig(null);
  };

  const resetToDefault = () => {
    const base = resetDashboardConfig();
    setDashboardConfig(base);
    setDraftConfig(editing ? deepClone(base) : null);
  };

  const updateDraft = (next) => setDraftConfig(next);

  const moveCard = (index, delta) => {
    if (!editing) return;
    const cards = [...activeConfig.cards];
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    const [item] = cards.splice(index, 1);
    cards.splice(nextIndex, 0, item);
    updateDraft({ ...activeConfig, cards });
  };

  
  const toggleLockCard = (id) => {
    if (!editing) return;
    const cards = activeConfig.cards.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c));
    updateDraft({ ...activeConfig, cards });
  };

  const removeCard = (id) => {
    if (!editing) return;
    const cards = activeConfig.cards.filter(c => c.id !== id);
    updateDraft({ ...activeConfig, cards });
  };

  const addMetricCard = (metricKey) => {
    if (!editing) startEdit();
    const metric = getMetricByKey(metricKey);
    if (!metric) return;

    const cfg = editing ? activeConfig : deepClone(dashboardConfig);
    const cols = cfg?.grid?.cols || 3;
    const occ = buildOccupancy(cfg.cards || [], cols);
    const pos = occ.findFirstFree();

    const card = {
      id: uid('card'),
      metricKey,
      days: metric.supportsDays ? 30 : undefined,
      color: metric.defaultColor || '#2563EB',
      titleOverride: '',
      layout: { x: pos.x, y: pos.y, w: 1, h: 1 },
    };

    const nextCfg = { ...cfg, cards: [...cfg.cards, card] };
    setDraftConfig(nextCfg);
    setShowAddModal(false);
    setSettingsCardId(card.id);
  };

  const openSettings = (id) => {
    if (!editing) startEdit();
    setSettingsCardId(id);
  };

  const closeSettings = () => setSettingsCardId(null);

  const updateCard = (id, patch) => {
    if (!editing) return;
    const cards = activeConfig.cards.map(c => c.id === id ? { ...c, ...patch } : c);
    updateDraft({ ...activeConfig, cards });
  };

  const dismissBrandingBanner = () => {
    // Persist immediately
    const next = saveDashboardConfig({
      ...dashboardConfig,
      ui: { ...dashboardConfig.ui, brandingBannerDismissed: true },
    });
    setDashboardConfig(next);
    if (editing) {
      setDraftConfig({ ...activeConfig, ui: { ...activeConfig.ui, brandingBannerDismissed: true } });
    }
  };

  const toggleSection = (key) => {
    if (!editing) return;
    updateDraft({
      ...activeConfig,
      sections: { ...activeConfig.sections, [key]: !activeConfig.sections?.[key] },
    });
  };

  // -----------------------
  // Grid helpers (react-grid-layout)
  // -----------------------

  const gridCols = activeConfig?.grid?.cols || 3;
  const gridRowHeight = activeConfig?.grid?.rowHeight || 128;
  const gridMargin = activeConfig?.grid?.margin || [16, 16];

  const sortByLayout = (cards) => {
    return [...cards].sort((a, b) => {
      const ay = a?.layout?.y ?? 0;
      const by = b?.layout?.y ?? 0;
      if (ay !== by) return ay - by;
      const ax = a?.layout?.x ?? 0;
      const bx = b?.layout?.x ?? 0;
      return ax - bx;
    });
  };

  const repackCardsForCols = (cards, cols) => {
    const sorted = sortByLayout(cards);
    return sorted.map((c, idx) => {
      const w = Math.min(Math.max(c?.layout?.w ?? 1, 1), cols);
      const h = Math.min(Math.max(c?.layout?.h ?? 1, 1), 50);
      return {
        ...c,
        layout: {
          x: idx % cols,
          y: Math.floor(idx / cols),
          w,
          h,
        },
      };
    });
  };

  const setDashboardCols = (cols) => {
    if (!editing) return;
    const nextCols = Math.min(Math.max(Number(cols) || 3, 2), 6);
    const nextCards = repackCardsForCols(activeConfig.cards, nextCols);
    updateDraft({
      ...activeConfig,
      grid: { ...(activeConfig.grid || {}), cols: nextCols },
      cards: nextCards,
    });
  };

  const buildOccupancy = (cards, cols) => {
    const taken = new Set();
    const mark = (x, y, w, h) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          taken.add(`${xx},${yy}`);
        }
      }
    };
    for (const c of cards) {
      const l = c?.layout;
      if (!l) continue;
      mark(l.x ?? 0, l.y ?? 0, l.w ?? 1, l.h ?? 1);
    }
    const isFree = (x, y) => !taken.has(`${x},${y}`);
    const findFirstFree = () => {
      for (let y = 0; y < 500; y++) {
        for (let x = 0; x < cols; x++) {
          if (isFree(x, y)) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    };
    return { taken, mark, findFirstFree };
  };

  const commitRglLayout = (layoutArr) => {
    if (!editing) return;
    const map = new Map(layoutArr.map((l) => [l.i, l]));
    const cards = activeConfig.cards.map((c) => {
      const l = map.get(c.id);
      if (!l) return c;
      return { ...c, layout: { x: l.x, y: l.y, w: l.w, h: l.h } };
    });
    updateDraft({ ...activeConfig, cards });
  };

  const setGridCols = (nextCols) => {
    if (!editing) return;
    const cols = Math.min(Math.max(Number(nextCols) || 3, 2), 6);
    const cards = repackCardsForCols(activeConfig.cards, cols);
    updateDraft({
      ...activeConfig,
      grid: { ...activeConfig.grid, cols },
      cards,
    });
  };

  // -----------------------
  // Metric rendering
  // -----------------------

  const metricContext = useMemo(() => ({
    language,
    analyticsByDays,
    teamSummary,
    seatLimit,
    ordersSummary,
    parametersSummary,
    presetsList,
    pricingData,
    feesData,
    widgetsList,
    widgetDomains,
    planFeatures,
    formatFeeType,
  }), [
    language,
    analyticsByDays,
    teamSummary,
    seatLimit,
    ordersSummary,
    parametersSummary,
    presetsList,
    pricingData,
    feesData,
    widgetsList,
    widgetDomains,
    planFeatures,
  ]);

  const filteredMetrics = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    return DASHBOARD_METRICS
      .filter(m => addCategory === 'all' ? true : m.category === addCategory)
      .filter(m => {
        if (!q) return true;
        const label = m.getLabel?.({ language, days: m.supportsDays ? 30 : undefined }) || m.key;
        return String(label).toLowerCase().includes(q) || String(m.key).toLowerCase().includes(q);
      });
  }, [addSearch, addCategory, language]);

  const getCardMetricResult = (card) => {
    const metric = getMetricByKey(card.metricKey);
    if (!metric) {
      return {
        metric: null,
        label: card.metricKey,
        icon: 'AlertTriangle',
        color: card.color || '#EF4444',
        valueText: language === 'cs' ? 'Neznámé' : 'Unknown',
        change: '',
        subtextNode: null,
      };
    }

    const days = metric.supportsDays ? (card.days || 30) : undefined;
    const label = (card.titleOverride && card.titleOverride.trim())
      ? card.titleOverride
      : metric.getLabel?.({ language, days }) || card.metricKey;

    const res = metric.compute ? metric.compute(metricContext, { days, language }) : { value: 0 };
    const valueText = formatValue({ value: res.value, valueType: metric.valueType, language });

    // Special subtext types (keep registry pure JSON-friendly)
    let subtextNode = null;
    if (res.subtext && res.subtext.type === 'feeBreakdown') {
      const breakdown = res.subtext.breakdown || {};
      subtextNode = (
        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
          {Object.entries(breakdown).map(([type, count]) => (
            <span key={type} className="bg-gray-100 px-1 rounded">
              {count}x {formatFeeType(type)}
            </span>
          ))}
        </div>
      );
    }

    return {
      metric,
      label,
      icon: metric.icon || 'BarChart3',
      color: card.color || metric.defaultColor || '#2563EB',
      valueText,
      change: res.change || '',
      subtextNode,
      supportsDays: !!metric.supportsDays,
      days,
    };
  };

  // -----------------------
  // Render
  // -----------------------

  return (
    <div className={`admin-dashboard ${editing ? "editing" : ""}`} data-kpi-cols={gridCols}>
      <div className="dashboard-header">
        <div>
          <h1>{language === 'cs' ? 'Dashboard' : 'Dashboard'}</h1>
          <p>{language === 'cs' ? 'Přehled a rychlé statistiky' : 'Overview and quick stats'}</p>
        </div>

        <div className="dashboard-actions">
          {!editing ? (
            <>
              <button className="btn-secondary" onClick={startEdit}>
                <Icon name="Pencil" size={16} />
                {language === 'cs' ? 'Upravit dashboard' : 'Edit dashboard'}
              </button>
              <button className="btn-primary" onClick={handleRefresh}>
                <Icon name="RefreshCw" size={16} />
                {language === 'cs' ? 'Obnovit' : 'Refresh'}
              </button>
            </>
          ) : (
            <>
              <div className="cols-control">
                <span className="cols-label">{language === 'cs' ? 'Sloupce' : 'Columns'}</span>
                <select
                  className="cols-select"
                  value={gridCols}
                  onChange={(e) => setDashboardCols(e.target.value)}
                >
                  {[2,3,4,5,6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <button className="btn-secondary" onClick={() => setShowAddModal(true)}>
                <Icon name="Plus" size={16} />
                {language === 'cs' ? 'Přidat ukazatel' : 'Add KPI'}
              </button>
              <button className="btn-secondary" onClick={resetToDefault}>
                <Icon name="RotateCcw" size={16} />
                {language === 'cs' ? 'Reset' : 'Reset'}
              </button>
              <button className="btn-secondary" onClick={cancelEdit}>
                {language === 'cs' ? 'Zrušit' : 'Cancel'}
              </button>
              <button className="btn-primary" onClick={saveEdit}>
                <Icon name="Save" size={16} />
                {language === 'cs' ? 'Uložit' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Branding Tips Banner */}
      {activeConfig?.sections?.brandingTips && !activeConfig?.ui?.brandingBannerDismissed && brandingTips.length > 0 && (
        <div className="branding-banner">
          <div className="branding-banner-left">
            <div className="branding-banner-icon">
              <Icon name="Sparkles" size={18} />
            </div>
            <div className="branding-banner-text">
              <div className="branding-banner-title">
                {language === 'cs' ? 'Doporučení: dokonči Branding' : 'Tip: finish Branding'}
              </div>
              <ul className="branding-banner-list">
                {brandingTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
          <div className="branding-banner-actions">
            <button className="btn-secondary" onClick={() => navigate('/admin/branding')}>
              {language === 'cs' ? 'Otevřít Branding' : 'Open Branding'}
            </button>
            <button className="banner-close" onClick={dismissBrandingBanner} aria-label="Dismiss">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Sections toggles (edit mode) */}
      {editing && (
        <div className="dashboard-edit-toggles">
          <label className="toggle">
            <input type="checkbox" checked={!!activeConfig.sections?.activity} onChange={() => toggleSection('activity')} />
            <span>{language === 'cs' ? 'Sekce aktivita' : 'Activity section'}</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={!!activeConfig.sections?.quickStats} onChange={() => toggleSection('quickStats')} />
            <span>{language === 'cs' ? 'Rychlé statistiky' : 'Quick stats'}</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={!!activeConfig.sections?.brandingTips} onChange={() => toggleSection('brandingTips')} />
            <span>{language === 'cs' ? 'Branding doporučení' : 'Branding tips'}</span>
          </label>
        </div>
      )}

      {/* Main KPI Cards (Drag & Drop + Resize) */}
      <RGL
        className="stats-grid"
        layout={activeConfig.cards.map((c) => ({
          i: c.id,
          x: c?.layout?.x ?? 0,
          y: c?.layout?.y ?? 0,
          w: c?.layout?.w ?? 1,
          h: c?.layout?.h ?? 1,
          static: !!c.locked,
          isDraggable: editing && !c.locked,
          isResizable: editing && !c.locked,
        }))}
        cols={gridCols}
        rowHeight={gridRowHeight}
        margin={gridMargin}
        isDraggable={editing}
        isResizable={editing}
        compactType={null}
        preventCollision={true}
        resizeHandles={['se']}
        draggableHandle=".kpi-drag-handle"
        onDragStop={(layout) => commitRglLayout(layout)}
        onResizeStop={(layout) => commitRglLayout(layout)}
      >
        {activeConfig.cards.map((card) => {
          const r = getCardMetricResult(card);
          return (
            <div key={card.id} className="rgl-item">
              <div className="stat-card" style={{ borderColor: `${r.color}30`, background: card.bgColor || 'white' }}>
                {editing && (
                  <div className="card-edit-controls">
                    <button className="icon-btn kpi-drag-handle" title={language === 'cs' ? 'Přetáhnout' : 'Drag'}>
                      <Icon name="GripVertical" size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => toggleLockCard(card.id)}
                      title={card.locked ? (language === 'cs' ? 'Odemknout' : 'Unlock') : (language === 'cs' ? 'Zamknout' : 'Lock')}
                    >
                      <Icon name={card.locked ? 'Lock' : 'Unlock'} size={14} />
                    </button>

                    <button className="icon-btn" onClick={() => openSettings(card.id)} title={language === 'cs' ? 'Nastavení' : 'Settings'}>
                      <Icon name="Settings" size={14} />
                    </button>
                    <button className="icon-btn danger" onClick={() => removeCard(card.id)} title={language === 'cs' ? 'Odebrat' : 'Remove'}>
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                )}

                <div className="stat-icon" style={{ background: `${r.color}20` }}>
                  <Icon name={r.icon} size={24} color={r.color} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{r.label}</p>
                  <h2 className="stat-value">{r.valueText}</h2>
                  {r.change ? <p className="stat-change">{r.change}</p> : <p className="stat-change empty"> </p>}
                  {r.subtextNode}
                </div>
              </div>
            </div>
          );
        })}
      </RGL>

      {/* Recent Activity */}
      {activeConfig.sections?.activity && (
        <div className="dashboard-section">
          <h3>{language === 'cs' ? 'Poslední aktivita' : 'Recent Activity'}</h3>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p className="empty-state">{language === 'cs' ? 'Žádná aktivita' : 'No activity'}</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-dot ${activity.type}`}></div>
                  <div className="activity-content">
                    <p>{activity.text}</p>
                    <span className="activity-time">
                      {activity.actor} • {activity.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {activeConfig.sections?.quickStats && (
        <div className="dashboard-section">
          <h3>{language === 'cs' ? 'Rychlé statistiky' : 'Quick Stats'}</h3>
          <div className="quick-stats-grid">
            <div className="quick-stat">
              <span className="quick-stat-label">{language === 'cs' ? 'Průměrná cena (30d)' : 'Avg Price (30d)'}</span>
              <span className="quick-stat-value">{analyticsByDays?.[30]?.metrics?.avg_price?.toFixed?.(0) || 0} Kč</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">{language === 'cs' ? 'Průměrný čas (30d)' : 'Avg Time (30d)'}</span>
              <span className="quick-stat-value">{analyticsByDays?.[30]?.metrics?.avg_time_min?.toFixed?.(1) || 0} min</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">{language === 'cs' ? 'Pending pozvánek' : 'Pending Invites'}</span>
              <span className="quick-stat-value">{teamSummary.pendingInvites}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">{language === 'cs' ? 'Nové objednávky' : 'New Orders'}</span>
              <span className="quick-stat-value">{ordersSummary.newOrders}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Metric Modal */}
      {editing && showAddModal && (
        <div className="modal-overlay" onMouseDown={() => setShowAddModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{language === 'cs' ? 'Přidat ukazatel' : 'Add KPI'}</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}><Icon name="X" size={16} /></button>
            </div>

            <div className="modal-body">
              <div className="modal-controls">
                <input
                  className="modal-input"
                  placeholder={language === 'cs' ? 'Hledat...' : 'Search...'}
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                />
                <select className="modal-select" value={addCategory} onChange={(e) => setAddCategory(e.target.value)}>
                  <option value="all">{language === 'cs' ? 'Vše' : 'All'}</option>
                  {DASHBOARD_CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{labelByLang(c.label, language)}</option>
                  ))}
                </select>
              </div>

              <div className="metric-list">
                {filteredMetrics.map((m) => {
                  const supportsDays = !!m.supportsDays;
                  const label = m.getLabel?.({ language, days: supportsDays ? 30 : undefined }) || m.key;
                  return (
                    <button key={m.key} className="metric-row" onClick={() => addMetricCard(m.key)}>
                      <div className="metric-row-left">
                        <div className="metric-row-icon" style={{ background: `${(m.defaultColor || '#2563EB')}20` }}>
                          <Icon name={m.icon || 'BarChart3'} size={16} color={m.defaultColor || '#2563EB'} />
                        </div>
                        <div className="metric-row-text">
                          <div className="metric-row-title">{label}</div>
                          <div className="metric-row-sub">{m.key}</div>
                        </div>
                      </div>
                      <div className="metric-row-right">
                        {supportsDays && <span className="pill">{language === 'cs' ? '7/30/90' : '7/30/90'}</span>}
                        <Icon name="Plus" size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {editing && settingsCardId && (
        <SettingsModal
          language={language}
          gridCols={gridCols}
          card={activeConfig.cards.find(c => c.id === settingsCardId)}
          metric={getMetricByKey(activeConfig.cards.find(c => c.id === settingsCardId)?.metricKey)}
          onClose={closeSettings}
          onChange={(patch) => updateCard(settingsCardId, patch)}
        />
      )}

      <style>{`
        .admin-dashboard {
          max-width: 1400px;
          padding: 24px;
          background: #F9FAFB;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .dashboard-header h1 {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        .dashboard-header p {
          margin: 0;
          color: #6B7280;
          font-size: 14px;
        }

        .dashboard-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cols-control {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #E5E7EB;
          padding: 8px 10px;
          border-radius: 10px;
        }

        .cols-label {
          font-size: 12px;
          color: #6B7280;
          font-weight: 600;
        }

        .cols-select {
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 13px;
          color: #111827;
          outline: none;
        }

        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563EB;
          color: white;
        }

        .btn-primary:hover {
          background: #1D4ED8;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border-color: #E5E7EB;
        }

        .btn-secondary:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }

        /* Branding banner */
        .branding-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 18px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }

        .branding-banner-left {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .branding-banner-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EEF2FF;
          color: #4F46E5;
          flex-shrink: 0;
        }

        .branding-banner-title {
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .branding-banner-list {
          margin: 0;
          padding-left: 18px;
          color: #4B5563;
          font-size: 13px;
        }

        .branding-banner-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .banner-close {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          background: #FFF;
          cursor: pointer;
        }

        .banner-close:hover {
          background: #F9FAFB;
        }

        /* Edit toggles */
        .dashboard-edit-toggles {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          background: white;
          border: 1px solid #E5E7EB;
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 18px;
        }
        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 13px;
          user-select: none;
        }

        .stats-grid {
          position: relative;
          margin-bottom: 32px;
        }

        .stat-card {
          height: 100%;
        }

        .kpi-drag-handle {
          cursor: grab;
        }

        .kpi-drag-handle:active {
          cursor: grabbing;
        }

        .stat-card {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #E5E7EB;
          display: flex;
          gap: 16px;
          transition: all 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .card-edit-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
          background: rgba(255,255,255,0.9);
          border: 1px solid #E5E7EB;
          padding: 6px;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          background: white;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #374151;
        }

        .icon-btn:hover {
          background: #F9FAFB;
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon-btn.danger {
          color: #DC2626;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }

        .stat-value {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        .stat-change {
          margin: 0;
          font-size: 13px;
          color: #6B7280;
        }

        .stat-change.empty {
          visibility: hidden;
        }

        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #E5E7EB;
          margin-bottom: 24px;
        }

        .dashboard-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .activity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .activity-dot.add { background: #10B981; }
        .activity-dot.update { background: #3B82F6; }

        .activity-content p {
          margin: 0 0 2px 0;
          font-size: 14px;
          color: #111827;
        }

        .activity-time {
          font-size: 12px;
          color: #6B7280;
        }

        .empty-state {
          margin: 0;
          color: #6B7280;
          font-size: 14px;
        }

        .quick-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .quick-stat {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
        }

        .quick-stat-label {
          display: block;
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 6px;
        }

        .quick-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 50;
        }

        .modal {
          width: min(860px, 100%);
          max-height: min(80vh, 900px);
          overflow: hidden;
          background: white;
          border-radius: 14px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 20px 45px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .modal-body {
          padding: 14px 16px 16px 16px;
          overflow: auto;
        }

        .modal-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .modal-input, .modal-select {
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: white;
        }

        .modal-input {
          flex: 1;
          min-width: 220px;
        }

        .metric-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-row {
          width: 100%;
          text-align: left;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          background: white;
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s;
        }

        .metric-row:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }

        .metric-row-left {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }

        .metric-row-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-row-text {
          min-width: 0;
        }

        .metric-row-title {
          font-weight: 700;
          color: #111827;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metric-row-sub {
          color: #6B7280;
          font-size: 12px;
        }

        .metric-row-right {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #374151;
        }

        .pill {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          color: #374151;
        }

        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      
        /* --- KPI grid readability (handles many columns) --- */
        .stat-card {
          height: 100%;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .stat-content {
          min-width: 0;
        }
        .stat-label {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stat-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: clamp(20px, 2.2vw, 34px);
          line-height: 1.05;
        }
        .admin-dashboard[data-kpi-cols="6"] .stat-value {
          font-size: clamp(18px, 1.8vw, 28px);
        }
        .admin-dashboard[data-kpi-cols="6"] .stat-icon {
          width: 42px;
          height: 42px;
        }
        .admin-dashboard.editing .react-resizable-handle {
          z-index: 30;
          opacity: 0.85;
          width: 18px;
          height: 18px;
        }
        .admin-dashboard.editing .react-resizable-handle::after {
          border-right: 2px solid rgba(17,24,39,0.35);
          border-bottom: 2px solid rgba(17,24,39,0.35);
        }
        .admin-dashboard.editing .rgl-item {
          overflow: visible;
        }

`}</style>
    </div>
  );
};

function SettingsModal({ language, gridCols = 3, card, metric, onClose, onChange }) {
  if (!card) return null;
  const supportsDays = !!metric?.supportsDays;
  const days = supportsDays ? (card.days || 30) : undefined;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{language === 'cs' ? 'Nastavení ukazatele' : 'KPI Settings'}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                {language === 'cs' ? 'Vlastní název (volitelné)' : 'Custom title (optional)'}
              </div>
              <input
                className="modal-input"
                value={card.titleOverride || ''}
                onChange={(e) => onChange({ titleOverride: e.target.value })}
                placeholder={language === 'cs' ? 'Nechat automaticky' : 'Leave automatic'}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                {language === 'cs' ? 'Barva' : 'Color'}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={card.color || metric?.defaultColor || '#2563EB'}
                  onChange={(e) => onChange({ color: e.target.value })}
                  style={{ width: 48, height: 38, border: '1px solid #E5E7EB', borderRadius: 10, padding: 4, background: 'white' }}
                />
                <input
                  className="modal-input"
                  value={card.color || ''}
                  onChange={(e) => onChange({ color: e.target.value })}
                  placeholder="#2563EB"
                  style={{ maxWidth: 220 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                {language === 'cs' ? 'Pozadí karty' : 'Card background'}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={(card.bgColor && card.bgColor.startsWith('#')) ? card.bgColor : '#FFFFFF'}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  style={{ width: 48, height: 38, border: '1px solid #E5E7EB', borderRadius: 10, padding: 4, background: 'white' }}
                />
                <input
                  className="modal-input"
                  value={card.bgColor || ''}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  placeholder={language === 'cs' ? 'např. #ffffff nebo prázdné' : 'e.g. #ffffff or empty'}
                  style={{ maxWidth: 220 }}
                />
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => onChange({ bgColor: '' })}
                  style={{ padding: '8px 12px' }}
                >
                  {language === 'cs' ? 'Vyčistit' : 'Clear'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#111827' }}>
                <input
                  type="checkbox"
                  checked={!!card.locked}
                  onChange={() => onChange({ locked: !card.locked })}
                />
                {language === 'cs' ? 'Zamknout kartu (nelze přesouvat ani měnit velikost)' : 'Lock card (disable move/resize)'}
              </label>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                {language === 'cs' ? 'Velikost karty' : 'Card size'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn-secondary" type="button" onClick={() => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), w: 1, h: 1 } })}>
                  1×1
                </button>
                <button className="btn-secondary" type="button" onClick={() => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), w: Math.min(2, gridCols), h: 1 } })}>
                  2×1
                </button>
                <button className="btn-secondary" type="button" onClick={() => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), w: 1, h: 2 } })}>
                  1×2
                </button>
                <button className="btn-secondary" type="button" onClick={() => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), w: Math.min(2, gridCols), h: 2 } })}>
                  2×2
                </button>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 6 }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{language === 'cs' ? 'Šířka' : 'W'}</div>
                  <select
                    className="modal-select"
                    value={card.layout?.w || 1}
                    onChange={(e) => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), w: Number(e.target.value) } })}
                    style={{ width: 90 }}
                  >
                    {Array.from({ length: Math.max(1, gridCols) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>

                  <div style={{ fontSize: 12, color: '#6B7280' }}>{language === 'cs' ? 'Výška' : 'H'}</div>
                  <select
                    className="modal-select"
                    value={card.layout?.h || 1}
                    onChange={(e) => onChange({ layout: { ...(card.layout || { x: 0, y: 0, w: 1, h: 1 }), h: Number(e.target.value) } })}
                    style={{ width: 90 }}
                  >
                    {[1,2,3,4].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
                {language === 'cs'
                  ? 'Tip: velikost můžeš změnit i tažením za roh karty (v režimu úprav).'
                  : 'Tip: you can also resize by dragging the card corner (in edit mode).'}
              </div>
            </div>

            {supportsDays && (

              <div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  {language === 'cs' ? 'Časový rozsah' : 'Time range'}
                </div>
                <select
                  className="modal-select"
                  value={days}
                  onChange={(e) => onChange({ days: Number(e.target.value) })}
                >
                  <option value={7}>{language === 'cs' ? '7 dní' : '7 days'}</option>
                  <option value={30}>{language === 'cs' ? '30 dní' : '30 days'}</option>
                  <option value={90}>{language === 'cs' ? '90 dní' : '90 days'}</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button className="btn-secondary" onClick={onClose}>{language === 'cs' ? 'Hotovo' : 'Done'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function labelByLang(obj, lang) {
  return (obj && (obj[lang] || obj.cs || obj.en)) || '';
}

export default AdminDashboard;
