import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { readTenantJson, writeTenantJson } from '@/utils/adminTenantStorage';
import {
  RevenueTrendChart,
  OrdersByStatusChart,
  TopMaterialsBarChart,
  AOVChart,
  PrintTimeChart,
  ConversionFunnelChart,
  OrdersOverTimeChart,
  TopCustomersChart,
  RevenueByMaterialChart,
  TopModelsChart,
} from './AnalyticsCharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

/* ── Chart catalog ──────────────────────────────────────────────────── */

const CHART_CATALOG = [
  { id: 'revenue-trend', name: { cs: 'Trzby v case', en: 'Revenue Over Time' }, category: 'revenue', defaultSize: { w: 6, h: 2 } },
  { id: 'orders-by-status', name: { cs: 'Objednavky podle stavu', en: 'Orders by Status' }, category: 'orders', defaultSize: { w: 6, h: 2 } },
  { id: 'top-materials', name: { cs: 'Nejpouzivanejsi materialy', en: 'Most Popular Materials' }, category: 'materials', defaultSize: { w: 6, h: 2 } },
  { id: 'aov-trend', name: { cs: 'Prumerna hodnota objednavky', en: 'Avg Order Value' }, category: 'revenue', defaultSize: { w: 6, h: 2 } },
  { id: 'print-time-dist', name: { cs: 'Rozlozeni casu tisku', en: 'Print Time Distribution' }, category: 'production', defaultSize: { w: 6, h: 2 } },
  { id: 'conversion-funnel', name: { cs: 'Konverzni trychtyr', en: 'Conversion Funnel' }, category: 'conversion', defaultSize: { w: 6, h: 2 } },
  { id: 'orders-over-time', name: { cs: 'Objednavky v case', en: 'Orders Over Time' }, category: 'orders', defaultSize: { w: 6, h: 2 } },
  { id: 'top-customers', name: { cs: 'Top zakaznici', en: 'Top Customers' }, category: 'customers', defaultSize: { w: 6, h: 2 } },
  { id: 'revenue-by-material', name: { cs: 'Trzby podle materialu', en: 'Revenue by Material' }, category: 'materials', defaultSize: { w: 6, h: 2 } },
  { id: 'top-models', name: { cs: 'Top modely', en: 'Top Models' }, category: 'models', defaultSize: { w: 6, h: 2 } },
];

const CHART_MAP = Object.fromEntries(CHART_CATALOG.map((c) => [c.id, c]));

/* ── Defaults ───────────────────────────────────────────────────────── */

const DEFAULT_ACTIVE = [
  'revenue-trend',
  'orders-by-status',
  'top-materials',
  'aov-trend',
  'conversion-funnel',
  'orders-over-time',
];

const LAYOUT_NS = 'analytics:dashboard-layout';
const LAYOUT_VERSION = 1;

/* ── Layout builder ─────────────────────────────────────────────────── */

function buildDefaultLayouts(chartIds) {
  const lg = [];
  const md = [];
  const sm = [];

  chartIds.forEach((id, idx) => {
    const meta = CHART_MAP[id];
    if (!meta) return;
    const col = idx % 2;
    const row = Math.floor(idx / 2);

    lg.push({ i: id, x: col * 6, y: row * 2, w: meta.defaultSize.w, h: meta.defaultSize.h });
    md.push({ i: id, x: (idx % 2) * 4, y: Math.floor(idx / 2) * 2, w: 4, h: 2 });
    sm.push({ i: id, x: 0, y: idx * 2, w: 4, h: 2 });
  });

  return { lg, md, sm };
}

/* ── Persistence ────────────────────────────────────────────────────── */

function loadSavedConfig() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = readTenantJson(LAYOUT_NS, null);
    if (saved && saved.version === LAYOUT_VERSION && Array.isArray(saved.activeCharts)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveConfig(activeCharts, layouts) {
  if (typeof window === 'undefined') return;
  writeTenantJson(LAYOUT_NS, {
    version: LAYOUT_VERSION,
    activeCharts,
    layouts,
  });
}

/* ── Category labels ────────────────────────────────────────────────── */

const CATEGORY_LABELS = {
  revenue: { cs: 'Trzby', en: 'Revenue' },
  orders: { cs: 'Objednavky', en: 'Orders' },
  materials: { cs: 'Materialy', en: 'Materials' },
  production: { cs: 'Produkce', en: 'Production' },
  conversion: { cs: 'Konverze', en: 'Conversion' },
  customers: { cs: 'Zakaznici', en: 'Customers' },
  models: { cs: 'Modely', en: 'Models' },
};

/* ── Main component ─────────────────────────────────────────────────── */

export default function AnalyticsDashboardGrid({ orderMetrics, sessions, cs, hasOrders }) {
  // ── State ──
  const [editMode, setEditMode] = useState(false);
  const [activeCharts, setActiveCharts] = useState(() => {
    const saved = loadSavedConfig();
    return saved ? saved.activeCharts : DEFAULT_ACTIVE;
  });
  const [layouts, setLayouts] = useState(() => {
    const saved = loadSavedConfig();
    return saved?.layouts || buildDefaultLayouts(DEFAULT_ACTIVE);
  });
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [granularity, setGranularity] = useState('day');
  const addDropdownRef = useRef(null);

  // ── Escape key handler ──
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && editMode) {
        handleDone();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editMode, activeCharts, layouts]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setShowAddDropdown(false);
      }
    }
    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddDropdown]);

  // ── Revenue data aggregated by granularity ──
  const processedRevenueData = useMemo(() => {
    const raw = orderMetrics?.revenueOverTime || [];
    if (granularity === 'day' || raw.length === 0) return raw;

    const buckets = new Map();
    for (const item of raw) {
      const d = new Date(item.date + 'T00:00:00');
      let key;
      if (granularity === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // week — bucket by Monday
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      }
      buckets.set(key, (buckets.get(key) || 0) + (item.revenue || 0));
    }

    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({
        date,
        label: granularity === 'month'
          ? date
          : `${new Date(date + 'T00:00:00').getDate()}.${new Date(date + 'T00:00:00').getMonth() + 1}.`,
        revenue: Math.round(revenue),
      }));
  }, [orderMetrics, granularity]);

  // ── Data preparation ──
  const funnelData = useMemo(() => {
    const allEvents = [];
    for (const s of (sessions || [])) {
      for (const e of s.events || []) allEvents.push(e.eventType);
    }
    const uploaded = allEvents.filter((e) => e === 'MODEL_UPLOAD_COMPLETED').length;
    const sliced = allEvents.filter((e) => e === 'SLICING_COMPLETED').length;
    const quoted = allEvents.filter((e) => e === 'PRICE_SHOWN').length;
    const ordered = allEvents.filter((e) => e === 'ORDER_CREATED' || e === 'ADD_TO_CART_CLICKED').length;
    if (!uploaded && !sliced && !quoted && !ordered) return [];
    return [
      { step: cs ? 'Nahrano modelu' : 'Models uploaded', value: uploaded },
      { step: cs ? 'Slicovano' : 'Sliced', value: sliced },
      { step: cs ? 'Oceneno' : 'Quoted', value: quoted },
      { step: cs ? 'Objednano' : 'Ordered', value: ordered },
    ];
  }, [sessions, cs]);

  const getChartData = useCallback((chartId) => {
    switch (chartId) {
      case 'revenue-trend': return { data: processedRevenueData };
      case 'orders-by-status': return { data: orderMetrics?.ordersByStatus || [] };
      case 'top-materials': return { data: orderMetrics?.topMaterials || [] };
      case 'aov-trend': return { data: orderMetrics?.aovOverTime || [] };
      case 'print-time-dist': return { data: orderMetrics?.printTimeDistribution || [] };
      case 'conversion-funnel': return { data: funnelData };
      case 'orders-over-time': return { data: orderMetrics?.ordersOverTime || [] };
      case 'top-customers': return { data: orderMetrics?.topCustomers || [] };
      case 'revenue-by-material': return { data: orderMetrics?.revenueByMaterial || [] };
      case 'top-models': return { data: orderMetrics?.topModels || [] };
      default: return { data: [] };
    }
  }, [orderMetrics, funnelData, processedRevenueData]);

  // ── Available (non-active) charts grouped by category ──
  const availableCharts = useMemo(() => {
    const activeSet = new Set(activeCharts);
    return CHART_CATALOG.filter((c) => !activeSet.has(c.id));
  }, [activeCharts]);

  const availableByCategory = useMemo(() => {
    const grouped = {};
    for (const chart of availableCharts) {
      if (!grouped[chart.category]) grouped[chart.category] = [];
      grouped[chart.category].push(chart);
    }
    return grouped;
  }, [availableCharts]);

  // ── Handlers ──
  function handleDone() {
    setEditMode(false);
    setShowAddDropdown(false);
    saveConfig(activeCharts, layouts);
  }

  function handleRemoveChart(chartId) {
    const nextActive = activeCharts.filter((id) => id !== chartId);
    setActiveCharts(nextActive);
    // Remove from all layout breakpoints
    const nextLayouts = {};
    for (const [bp, items] of Object.entries(layouts)) {
      nextLayouts[bp] = items.filter((item) => item.i !== chartId);
    }
    setLayouts(nextLayouts);
  }

  function handleAddChart(chartId) {
    const meta = CHART_MAP[chartId];
    if (!meta) return;

    const nextActive = [...activeCharts, chartId];
    setActiveCharts(nextActive);

    // Add to layouts at the bottom
    const nextLayouts = { ...layouts };
    const breakpointConfigs = {
      lg: { cols: 12, w: meta.defaultSize.w },
      md: { cols: 8, w: 4 },
      sm: { cols: 4, w: 4 },
    };

    for (const [bp, config] of Object.entries(breakpointConfigs)) {
      const existing = nextLayouts[bp] || [];
      const maxY = existing.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      nextLayouts[bp] = [
        ...existing,
        { i: chartId, x: 0, y: maxY, w: config.w, h: meta.defaultSize.h },
      ];
    }

    setLayouts(nextLayouts);
    setShowAddDropdown(false);
  }

  function handleResetToDefault() {
    setActiveCharts(DEFAULT_ACTIVE);
    setLayouts(buildDefaultLayouts(DEFAULT_ACTIVE));
  }

  function handleLayoutChange(_current, allLayouts) {
    if (editMode) {
      setLayouts(allLayouts);
    }
  }

  // ── Chart renderer ──
  function renderChart(chartId) {
    const chartData = getChartData(chartId);
    const commonProps = { data: chartData.data, cs };

    switch (chartId) {
      case 'revenue-trend':
        return (
          <RevenueTrendChart
            data={chartData.data}
            granularity={granularity}
            setGranularity={setGranularity}
            cs={cs}
          />
        );
      case 'orders-by-status':
        return <OrdersByStatusChart {...commonProps} />;
      case 'top-materials':
        return <TopMaterialsBarChart {...commonProps} />;
      case 'aov-trend':
        return <AOVChart {...commonProps} />;
      case 'print-time-dist':
        return <PrintTimeChart {...commonProps} />;
      case 'conversion-funnel':
        return <ConversionFunnelChart {...commonProps} />;
      case 'orders-over-time':
        return <OrdersOverTimeChart {...commonProps} />;
      case 'top-customers':
        return <TopCustomersChart {...commonProps} />;
      case 'revenue-by-material':
        return <RevenueByMaterialChart {...commonProps} />;
      case 'top-models':
        return <TopModelsChart {...commonProps} />;
      default:
        return (
          <div style={{ padding: 20, color: 'var(--forge-text-muted)' }}>
            {cs ? 'Neznamy graf' : 'Unknown chart'}
          </div>
        );
    }
  }

  // ── Empty state ──
  if (activeCharts.length === 0 && !editMode) {
    return (
      <div className="adg-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--forge-text-muted)' }}>
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            {cs ? 'Dashboard je prazdny.' : 'Dashboard is empty.'}
          </p>
          <button className="adg-btn" onClick={() => setEditMode(true)}>
            {cs ? 'Pridat graf' : 'Add chart'}
          </button>
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  return (
    <div className="adg-wrapper">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="adg-toolbar">
        {editMode ? (
          <>
            <div className="adg-toolbar-left">
              <span className="adg-toolbar-label">
                {cs ? 'Rezim uprav' : 'Edit mode'}
              </span>
              <span className="adg-toolbar-hint">
                {cs ? 'Pretahujte a menite velikost grafu' : 'Drag and resize charts'}
              </span>
            </div>
            <div className="adg-toolbar-actions">
              <div className="adg-add-wrapper" ref={addDropdownRef}>
                <button
                  className="adg-btn adg-btn-secondary"
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  disabled={availableCharts.length === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M7 2v10M2 7h10" />
                  </svg>
                  {cs ? 'Pridat graf' : 'Add chart'}
                </button>
                {showAddDropdown && availableCharts.length > 0 && (
                  <div className="adg-add-dropdown">
                    {Object.entries(availableByCategory).map(([cat, charts]) => (
                      <div key={cat} className="adg-dropdown-group">
                        <div className="adg-dropdown-category">
                          {CATEGORY_LABELS[cat]?.[cs ? 'cs' : 'en'] || cat}
                        </div>
                        {charts.map((chart) => (
                          <button
                            key={chart.id}
                            className="adg-dropdown-item"
                            onClick={() => handleAddChart(chart.id)}
                          >
                            {chart.name[cs ? 'cs' : 'en']}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="adg-btn adg-btn-secondary" onClick={handleResetToDefault}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 1v4h4M13 13V9H9" />
                  <path d="M2.5 9A5.5 5.5 0 0 1 7 1.5a5.5 5.5 0 0 1 4.5 2.3M11.5 5A5.5 5.5 0 0 1 7 12.5a5.5 5.5 0 0 1-4.5-2.3" />
                </svg>
                {cs ? 'Obnovit vychozi' : 'Reset to default'}
              </button>
              <button className="adg-btn adg-btn-primary" onClick={handleDone}>
                {cs ? 'Hotovo' : 'Done'}
              </button>
            </div>
          </>
        ) : (
          <div className="adg-toolbar-actions" style={{ marginLeft: 'auto' }}>
            <button className="adg-btn adg-btn-secondary" onClick={() => setEditMode(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" />
              </svg>
              {cs ? 'Upravit dashboard' : 'Edit dashboard'}
            </button>
          </div>
        )}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <ResponsiveGridLayout
        className="adg-grid"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 900, sm: 600 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={150}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".adg-drag-handle"
        margin={[14, 14]}
      >
        {activeCharts.map((chartId) => (
          <div key={chartId} className={`adg-card ${editMode ? 'editing' : ''}`}>
            <div className={`adg-card-header ${editMode ? 'adg-drag-handle' : ''}`}>
              {editMode && (
                <span className="adg-drag-icon" title={cs ? 'Pretahnout' : 'Drag to move'}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" opacity="0.5">
                    <circle cx="4" cy="3" r="1.2" />
                    <circle cx="10" cy="3" r="1.2" />
                    <circle cx="4" cy="7" r="1.2" />
                    <circle cx="10" cy="7" r="1.2" />
                    <circle cx="4" cy="11" r="1.2" />
                    <circle cx="10" cy="11" r="1.2" />
                  </svg>
                </span>
              )}
              <span className="adg-card-name">
                {CHART_MAP[chartId]?.name[cs ? 'cs' : 'en'] || chartId}
              </span>
              {editMode && (
                <button
                  className="adg-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveChart(chartId);
                  }}
                  title={cs ? 'Odebrat graf' : 'Remove chart'}
                  aria-label={cs ? 'Odebrat graf' : 'Remove chart'}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              )}
            </div>
            <div className="adg-card-body">
              {renderChart(chartId)}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      <style>{STYLES}</style>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────── */

const STYLES = `
  .adg-wrapper {
    position: relative;
  }

  /* ── Toolbar ──────────────────────────────────────────────────────── */
  .adg-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    min-height: 40px;
  }
  .adg-toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .adg-toolbar-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--forge-accent-primary, #00D4AA);
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .adg-toolbar-hint {
    font-size: 12px;
    color: var(--forge-text-muted, #7A8291);
  }
  .adg-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── Buttons ──────────────────────────────────────────────────────── */
  .adg-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--forge-radius-md, 6px);
    font-size: 12px;
    font-weight: 600;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .adg-btn-primary {
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #08090C);
    border-color: var(--forge-accent-primary, #00D4AA);
  }
  .adg-btn-primary:hover {
    filter: brightness(1.1);
  }
  .adg-btn-secondary {
    background: transparent;
    color: var(--forge-text-secondary, #9BA3B0);
    border-color: var(--forge-border-default, #1E2230);
  }
  .adg-btn-secondary:hover {
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-accent-primary, #00D4AA);
  }
  .adg-btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .adg-btn-secondary:disabled:hover {
    border-color: var(--forge-border-default, #1E2230);
    color: var(--forge-text-secondary, #9BA3B0);
  }

  /* ── Add chart dropdown ───────────────────────────────────────────── */
  .adg-add-wrapper {
    position: relative;
  }
  .adg-add-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 100;
    min-width: 240px;
    max-height: 340px;
    overflow-y: auto;
    background: var(--forge-bg-elevated, #1A1D24);
    border: 1px solid var(--forge-border-default, #1E2230);
    border-radius: var(--forge-radius-lg, 10px);
    padding: 6px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  .adg-dropdown-group {
    margin-bottom: 4px;
  }
  .adg-dropdown-group:last-child {
    margin-bottom: 0;
  }
  .adg-dropdown-category {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--forge-text-muted, #7A8291);
    padding: 6px 10px 3px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
  }
  .adg-dropdown-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 7px 10px;
    font-size: 13px;
    color: var(--forge-text-primary, #E8EAED);
    background: transparent;
    border: none;
    border-radius: var(--forge-radius-sm, 4px);
    cursor: pointer;
    transition: background 0.1s ease;
  }
  .adg-dropdown-item:hover {
    background: var(--forge-bg-surface, #0E1015);
    color: var(--forge-accent-primary, #00D4AA);
  }

  /* ── Grid card ────────────────────────────────────────────────────── */
  .adg-card {
    display: flex;
    flex-direction: column;
    background: var(--forge-bg-surface, #0E1015);
    border: 1px solid var(--forge-border-default, #1E2230);
    border-radius: var(--forge-radius-xl, 12px);
    overflow: hidden;
    transition: border-color 0.2s ease;
  }
  .adg-card.editing {
    border-color: var(--forge-accent-primary, #00D4AA);
    border-style: dashed;
    box-shadow: 0 0 0 1px rgba(0, 212, 170, 0.15);
  }

  .adg-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 4px;
    flex-shrink: 0;
    min-height: 0;
  }
  .adg-card-header.adg-drag-handle {
    cursor: grab;
  }
  .adg-card-header.adg-drag-handle:active {
    cursor: grabbing;
  }

  .adg-drag-icon {
    display: flex;
    align-items: center;
    color: var(--forge-text-muted, #7A8291);
    flex-shrink: 0;
  }
  .adg-card-name {
    flex: 1;
    font-size: 11px;
    font-weight: 600;
    color: var(--forge-text-muted, #7A8291);
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
  }
  .adg-card.editing .adg-card-name {
    opacity: 1;
  }

  .adg-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--forge-radius-sm, 4px);
    border: 1px solid transparent;
    background: transparent;
    color: var(--forge-text-muted, #7A8291);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }
  .adg-remove-btn:hover {
    border-color: #FF4757;
    color: #FF4757;
    background: rgba(255, 71, 87, 0.1);
  }

  .adg-card-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  /* Make inner chart components fill the card body */
  .adg-card-body > * {
    height: 100%;
  }
  .adg-card-body .ac-card {
    height: 100%;
    border: none;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  .adg-card-body .ac-card-header {
    flex-shrink: 0;
  }
  /* The chart/content area inside .ac-card fills the rest */
  .adg-card-body .ac-card > :last-child:not(.ac-card-header) {
    flex: 1;
    min-height: 0;
  }
  .adg-card-body .recharts-responsive-container {
    min-height: 0;
  }

  /* ── react-grid-layout overrides ──────────────────────────────────── */
  .adg-grid {
    margin: 0 -7px;
  }
  .adg-grid .react-grid-item {
    transition: all 200ms ease;
  }
  .adg-grid .react-grid-item.react-grid-placeholder {
    background: var(--forge-accent-primary, #00D4AA) !important;
    opacity: 0.12 !important;
    border-radius: var(--forge-radius-xl, 12px);
  }
  .adg-grid .react-resizable-handle {
    background: none;
  }
  .adg-grid .react-resizable-handle::after {
    border-right-color: var(--forge-text-muted, #7A8291) !important;
    border-bottom-color: var(--forge-text-muted, #7A8291) !important;
  }

  /* ── Scrollbar inside dropdown ────────────────────────────────────── */
  .adg-add-dropdown::-webkit-scrollbar {
    width: 6px;
  }
  .adg-add-dropdown::-webkit-scrollbar-track {
    background: transparent;
  }
  .adg-add-dropdown::-webkit-scrollbar-thumb {
    background: var(--forge-border-default, #1E2230);
    border-radius: 3px;
  }
`;
