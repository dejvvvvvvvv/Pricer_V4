import React, { useEffect, useMemo, useState } from 'react';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import {
  clearAnalyticsAll,
  computeOverview,
  ensureDemoAnalyticsSeeded,
  filterSessionsByRange,
  findLostSessions,
  generateCsv,
  getAnalyticsSessions,
  logExportToAudit,
} from '../../utils/adminAnalyticsStorage';
import { useLanguage } from '../../contexts/LanguageContext';

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

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function formatNumber(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function downloadTextFile({ filename, content, mime = 'text/plain;charset=utf-8' }) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`mp-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div className="mp-card mp-stat">
      <div className="mp-stat-title">{title}</div>
      <div className="mp-stat-value">{value}</div>
      {sub ? <div className="mp-stat-sub">{sub}</div> : null}
    </div>
  );
}

function MiniSeriesTable({ title, series, headerDate, headerCount, noDataText }) {
  const safeSeries = Array.isArray(series) ? series : [];
  return (
    <div className="mp-card">
      <div className="mp-card-title">{title}</div>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th>{headerDate || 'Datum'}</th>
              <th style={{ textAlign: 'right' }}>{headerCount || 'Pocet'}</th>
            </tr>
          </thead>
          <tbody>
            {safeSeries.length === 0 ? (
              <tr><td colSpan={2} className="mp-muted">{noDataText || 'No data'}</td></tr>
            ) : (
              safeSeries.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(row.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { language } = useLanguage();
  const cs = language === 'cs';

  const ui = useMemo(() => ({
    title: cs ? 'Analytika' : 'Analytics',
    subtitle: cs ? 'Prehled toho, co se deje ve widgetu.' : 'Overview of widget activity.',
    refresh: cs ? 'Obnovit' : 'Refresh',
    resetDemo: cs ? 'Reset demo dat' : 'Reset demo data',
    period: cs ? 'Obdobi' : 'Period',
    last7: cs ? 'Poslednich 7 dni' : 'Last 7 days',
    last30: cs ? 'Poslednich 30 dni' : 'Last 30 days',
    last90: cs ? 'Poslednich 90 dni' : 'Last 90 days',
    custom: cs ? 'Vlastni' : 'Custom',
    from: cs ? 'Od' : 'From',
    to: cs ? 'Do' : 'To',
    // Tab labels
    tabOverview: cs ? 'Prehled' : 'Overview',
    tabCalculations: cs ? 'Kalkulace' : 'Calculations',
    tabOrders: cs ? 'Objednavky' : 'Orders',
    tabLost: cs ? 'Ztracene' : 'Lost',
    tabExports: cs ? 'Exporty' : 'Exports',
    // StatCard labels
    calculations: cs ? 'Kalkulace' : 'Calculations',
    orders: cs ? 'Objednavky' : 'Orders',
    conversion: cs ? 'Konverze' : 'Conversion',
    conversionSub: cs ? 'objednavky / kalkulace' : 'orders / calculations',
    avgPrice: cs ? 'Prumerna cena' : 'Average price',
    avgTime: cs ? 'Prumerny cas' : 'Average time',
    avgWeight: cs ? 'Prumerna hmotnost' : 'Average weight',
    noData: cs ? 'Zadna data' : 'No data',
    // Tables
    date: cs ? 'Datum' : 'Date',
    count: cs ? 'Pocet' : 'Count',
    calcsPerDay: cs ? 'Kalkulace / den' : 'Calculations / day',
    ordersPerDay: cs ? 'Objednavky / den' : 'Orders / day',
    topMaterials: cs ? 'Top materialy' : 'Top materials',
    topPresets: cs ? 'Top presety' : 'Top presets',
    topFees: cs ? 'Top poplatky (fees)' : 'Top fees',
    chosen: cs ? 'Zvoleno' : 'Chosen',
    // Calculations tab
    searchPlaceholder: cs ? 'Hledej session / soubor / material / preset' : 'Search session / file / material / preset',
    onlyFailed: cs ? 'Jen neuspesne' : 'Only failed',
    calcSessions: cs ? 'Kalkulacni sessions' : 'Calculation sessions',
    file: cs ? 'Soubor' : 'File',
    material: cs ? 'Material' : 'Material',
    preset: 'Preset',
    time: cs ? 'Cas' : 'Time',
    weight: cs ? 'Hmotnost' : 'Weight',
    price: cs ? 'Cena' : 'Price',
    converted: cs ? 'Konvertovano' : 'Converted',
    status: 'Status',
    detail: cs ? 'Detail' : 'Detail',
    noCalcs: cs ? 'Zadne kalkulace v tomto obdobi' : 'No calculations in this period',
    // Orders tab
    revenue: cs ? 'Odhadovane trzby' : 'Est. revenue',
    avgOrderValue: cs ? 'Prumerna objednavka' : 'Avg order value',
    note: cs ? 'Poznamka' : 'Note',
    ordersNote: cs
      ? 'Ve Variante A je objednavka odvozena z eventu ORDER_CREATED nebo ADD_TO_CART_CLICKED. Pozdeji (Varianta B) se to propoji s realnymi objednavkami (Orders modul) a webhooky z e-shopu.'
      : 'In Variant A, an order is derived from ORDER_CREATED or ADD_TO_CART_CLICKED events. Later (Variant B) this will connect to real orders (Orders module) and e-shop webhooks.',
    // Lost tab
    lostTitle: cs
      ? 'Ztracene kalkulace (PRICE_SHOWN bez konverze, > 30 min)'
      : 'Lost calculations (PRICE_SHOWN without conversion, > 30 min)',
    lastActivity: cs ? 'Posledni aktivita' : 'Last activity',
    dropOff: cs ? 'Misto opusteni' : 'Drop-off',
    noLost: cs ? 'Zadne ztracene kalkulace' : 'No lost calculations',
    // Exports
    csvExport: 'CSV export',
    exportType: cs ? 'Typ exportu' : 'Export type',
    exportCalcs: cs ? 'Kalkulace' : 'Calculations',
    exportLost: cs ? 'Ztracene kalkulace' : 'Lost calculations',
    exportOverview: cs ? 'Shrnuti prehledu' : 'Overview summary',
    generate: cs ? 'Generovat & Stahnout CSV' : 'Generate & Download CSV',
    exportNote: cs
      ? 'Export se v demo rezimu generuje synchronne z localStorage. Vytvoreni exportu se zapisuje do Audit logu (G).'
      : 'Export is generated synchronously from localStorage in demo mode. Export creation is logged to Audit log (G).',
    // Session detail (ForgeDialog)
    sessionDetail: cs ? 'Detail session' : 'Session detail',
    summary: cs ? 'Shrnuti' : 'Summary',
    timeline: cs ? 'Casova osa' : 'Timeline',
    lastEvent: cs ? 'Posledni event' : 'Last event',
    printTime: cs ? 'Cas tisku' : 'Print time',
    noMetadata: cs ? '(bez metadat)' : '(no metadata)',
    hint: cs
      ? 'Tip: Pro demo data se pouziva simulace (localStorage).'
      : 'Tip: Demo data uses localStorage simulation.',
    confirmClear: cs
      ? 'Opravdu chces smazat vsechna analytics demo data?'
      : 'Really delete all analytics demo data?',
  }), [cs]);

  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState('30');
  const [fromISO, setFromISO] = useState(isoDaysAgo(30));
  const [toISO, setToISO] = useState(isoNowEnd());
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [q, setQ] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [exportType, setExportType] = useState('calculations');

  useEffect(() => {
    ensureDemoAnalyticsSeeded();
  }, []);

  useEffect(() => {
    if (range === '7') {
      setFromISO(isoDaysAgo(7));
      setToISO(isoNowEnd());
    } else if (range === '30') {
      setFromISO(isoDaysAgo(30));
      setToISO(isoNowEnd());
    } else if (range === '90') {
      setFromISO(isoDaysAgo(90));
      setToISO(isoNowEnd());
    }
  }, [range]);

  const sessions = useMemo(() => {
    const all = getAnalyticsSessions();
    const ranged = filterSessionsByRange(all, { fromISO, toISO });
    // keep most recent first
    return [...ranged].sort((a, b) => (b.last_event_at || '').localeCompare(a.last_event_at || ''));
  }, [fromISO, toISO, refreshKey]);

  const overview = useMemo(() => computeOverview({ fromISO, toISO }), [fromISO, toISO, refreshKey]);

  const calculations = useMemo(() => {
    const base = sessions.filter((s) => s.has_price_shown);
    const filtered = onlyFailed ? base.filter((s) => s.status === 'failed') : base;
    const qLower = q.trim().toLowerCase();
    if (!qLower) return filtered;
    return filtered.filter((s) =>
      [s.session_id, s.summary?.file_name, s.summary?.material, s.summary?.preset]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(qLower))
    );
  }, [sessions, onlyFailed, q]);

  const lost = useMemo(() => {
    return findLostSessions({ fromISO, toISO, olderThanMinutes: 30 })
      .sort((a, b) => (b.last_event_at || '').localeCompare(a.last_event_at || ''));
  }, [fromISO, toISO, refreshKey]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((s) => s.session_id === selectedSessionId) || null;
  }, [selectedSessionId, sessions]);

  function forceRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleClear() {
    if (!window.confirm(ui.confirmClear)) return;
    clearAnalyticsAll();
    setSelectedSessionId(null);
    forceRefresh();
  }

  function handleExport() {
    const { filename, csv } = generateCsv({ type: exportType, fromISO, toISO });
    logExportToAudit({
      actor: { email: 'demo@modelpricer.local', role: 'admin' },
      type: exportType,
      fromISO,
      toISO,
    });
    downloadTextFile({ filename, content: csv, mime: 'text/csv;charset=utf-8' });
    forceRefresh();
  }

  return (
    <div className="mp-admin-analytics">
      <div className="mp-head">
        <div>
          <h1 className="mp-title">{ui.title}</h1>
          <p className="mp-subtitle">{ui.subtitle}</p>
        </div>

        <div className="mp-actions">
          <div className="mp-range">
            <label className="mp-label">{ui.period}</label>
            <select className="mp-select" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">{ui.last7}</option>
              <option value="30">{ui.last30}</option>
              <option value="90">{ui.last90}</option>
              <option value="custom">{ui.custom}</option>
            </select>
          </div>

          {range === 'custom' ? (
            <div className="mp-custom-range">
              <div>
                <label className="mp-label">{ui.from}</label>
                <input
                  className="mp-input"
                  type="date"
                  value={fromISO.slice(0, 10)}
                  onChange={(e) => setFromISO(`${e.target.value}T00:00:00.000Z`)}
                />
              </div>
              <div>
                <label className="mp-label">{ui.to}</label>
                <input
                  className="mp-input"
                  type="date"
                  value={toISO.slice(0, 10)}
                  onChange={(e) => setToISO(`${e.target.value}T23:59:59.999Z`)}
                />
              </div>
            </div>
          ) : null}

          <button type="button" className="mp-btn mp-btn-ghost" onClick={handleClear}>
            {ui.resetDemo}
          </button>
          <button type="button" className="mp-btn" onClick={forceRefresh}>
            {ui.refresh}
          </button>
        </div>
      </div>

      <div className="mp-tabs">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>{ui.tabOverview}</TabButton>
        <TabButton active={tab === 'calculations'} onClick={() => setTab('calculations')}>{ui.tabCalculations}</TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>{ui.tabOrders}</TabButton>
        <TabButton active={tab === 'lost'} onClick={() => setTab('lost')}>{ui.tabLost}</TabButton>
        <TabButton active={tab === 'exports'} onClick={() => setTab('exports')}>{ui.tabExports}</TabButton>
      </div>

      {tab === 'overview' ? (
        <div className="mp-section">
          <div className="mp-grid">
            <StatCard title={ui.calculations} value={formatNumber(overview.metrics.calculations)} sub="PRICE_SHOWN" />
            <StatCard title={ui.orders} value={formatNumber(overview.metrics.orders)} sub="ORDER_CREATED / ADD_TO_CART" />
            <StatCard
              title={ui.conversion}
              value={`${formatNumber(overview.metrics.conversion_rate * 100, 1)} %`}
              sub={ui.conversionSub}
            />
            <StatCard title={ui.avgPrice} value={`${formatNumber(overview.metrics.avg_price, 0)} Kc`} />
            <StatCard title={ui.avgTime} value={`${formatNumber(overview.metrics.avg_time_min, 1)} min`} />
            <StatCard title={ui.avgWeight} value={`${formatNumber(overview.metrics.avg_weight_g, 1)} g`} />
          </div>

          <div className="mp-two">
            <MiniSeriesTable
              title={ui.calcsPerDay}
              series={overview.series.calculations_per_day}
              headerDate={ui.date}
              headerCount={ui.count}
              noDataText={ui.noData}
            />
            <MiniSeriesTable
              title={ui.ordersPerDay}
              series={overview.series.orders_per_day}
              headerDate={ui.date}
              headerCount={ui.count}
              noDataText={ui.noData}
            />
          </div>

          <div className="mp-three">
            <div className="mp-card">
              <div className="mp-card-title">{ui.topMaterials}</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>{ui.material}</th><th style={{ textAlign: 'right' }}>{ui.count}</th></tr></thead>
                  <tbody>
                    {overview.top.materials.length === 0 ? (
                      <tr><td colSpan={2} className="mp-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.materials.map((r) => (
                        <tr key={r.key}><td>{r.key}</td><td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mp-card">
              <div className="mp-card-title">{ui.topPresets}</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>{ui.preset}</th><th style={{ textAlign: 'right' }}>{ui.count}</th><th style={{ textAlign: 'right' }}>{ui.conversion}</th></tr></thead>
                  <tbody>
                    {overview.top.presets.length === 0 ? (
                      <tr><td colSpan={3} className="mp-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.presets.map((r) => (
                        <tr key={r.key}>
                          <td>{r.key}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(r.conversion_rate * 100, 1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mp-card">
              <div className="mp-card-title">{ui.topFees}</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Fee</th><th style={{ textAlign: 'right' }}>{ui.chosen}</th></tr></thead>
                  <tbody>
                    {overview.top.fees.length === 0 ? (
                      <tr><td colSpan={2} className="mp-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.fees.map((r) => (
                        <tr key={r.key}><td>{r.key}</td><td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mp-hint">
            {ui.hint}
          </div>
        </div>
      ) : null}

      {tab === 'calculations' ? (
        <div className="mp-section">
          <div className="mp-filterbar">
            <input
              className="mp-input"
              placeholder={ui.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ForgeCheckbox
              checked={onlyFailed}
              onChange={(e) => setOnlyFailed(e.target.checked)}
              label={ui.onlyFailed}
            />
          </div>

          <div className="mp-card">
            <div className="mp-card-title">{ui.calcSessions}</div>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>{ui.time}</th>
                    <th>{ui.file}</th>
                    <th>{ui.material}</th>
                    <th>{ui.preset}</th>
                    <th style={{ textAlign: 'right' }}>{ui.time}</th>
                    <th style={{ textAlign: 'right' }}>{ui.weight}</th>
                    <th style={{ textAlign: 'right' }}>{ui.price}</th>
                    <th style={{ textAlign: 'center' }}>{ui.converted}</th>
                    <th style={{ textAlign: 'center' }}>{ui.status}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.length === 0 ? (
                    <tr><td colSpan={10} className="mp-muted">{ui.noCalcs}</td></tr>
                  ) : (
                    calculations.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.file_name || 'unknown'}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kc</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`mp-pill ${s.converted ? 'ok' : ''}`}>{s.converted ? 'YES' : 'NO'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`mp-pill ${s.status === 'success' ? 'ok' : 'warn'}`}>{s.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="mp-link" onClick={() => setSelectedSessionId(s.session_id)}>{ui.detail}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'orders' ? (
        <div className="mp-section">
          <div className="mp-grid mp-grid-3">
            <StatCard title={ui.revenue} value={`${formatNumber(overview.metrics.revenue_estimate, 0)} Kc`} />
            <StatCard title={ui.orders} value={formatNumber(overview.metrics.orders)} />
            <StatCard title={ui.avgOrderValue} value={`${formatNumber(overview.metrics.avg_order_value, 0)} Kc`} />
          </div>
          <div className="mp-card">
            <div className="mp-card-title">{ui.note}</div>
            <p className="mp-muted" style={{ margin: 0 }}>
              {ui.ordersNote}
            </p>
          </div>
        </div>
      ) : null}

      {tab === 'lost' ? (
        <div className="mp-section">
          <div className="mp-card">
            <div className="mp-card-title">{ui.lostTitle}</div>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>{ui.lastActivity}</th>
                    <th>{ui.material}</th>
                    <th>{ui.preset}</th>
                    <th style={{ textAlign: 'right' }}>{ui.price}</th>
                    <th style={{ textAlign: 'right' }}>{ui.time}</th>
                    <th style={{ textAlign: 'right' }}>{ui.weight}</th>
                    <th>{ui.dropOff}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lost.length === 0 ? (
                    <tr><td colSpan={8} className="mp-muted">{ui.noLost}</td></tr>
                  ) : (
                    lost.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kc</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td>{s.drop_off_step || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="mp-link" onClick={() => setSelectedSessionId(s.session_id)}>{ui.detail}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'exports' ? (
        <div className="mp-section">
          <div className="mp-card">
            <div className="mp-card-title">{ui.csvExport}</div>
            <div className="mp-export">
              <div>
                <label className="mp-label">{ui.exportType}</label>
                <select className="mp-select" value={exportType} onChange={(e) => setExportType(e.target.value)}>
                  <option value="calculations">{ui.exportCalcs}</option>
                  <option value="lost">{ui.exportLost}</option>
                  <option value="overview">{ui.exportOverview}</option>
                </select>
              </div>
              <button type="button" className="mp-btn" onClick={handleExport}>{ui.generate}</button>
            </div>
            <p className="mp-muted" style={{ marginTop: 10 }}>
              {ui.exportNote}
            </p>
          </div>
        </div>
      ) : null}

      <ForgeDialog
        open={!!selectedSession}
        onClose={() => setSelectedSessionId(null)}
        title={ui.sessionDetail}
        maxWidth="1000px"
      >
        {selectedSession && (
          <>
            <div className="mp-muted" style={{ marginBottom: 12, fontSize: 13 }}>
              {selectedSession.session_id}
            </div>
            <div className="mp-detail-grid">
              <div className="mp-card">
                <div className="mp-card-title">{ui.summary}</div>
                <div className="mp-kv">
                  <div className="mp-k">{ui.lastEvent}</div><div className="mp-v">{formatDateTime(selectedSession.last_event_at)}</div>
                  <div className="mp-k">{ui.material}</div><div className="mp-v">{selectedSession.summary?.material || '-'}</div>
                  <div className="mp-k">{ui.preset}</div><div className="mp-v">{selectedSession.summary?.preset || '-'}</div>
                  <div className="mp-k">{ui.price}</div><div className="mp-v">{formatNumber(selectedSession.summary?.price_total, 0)} Kc</div>
                  <div className="mp-k">{ui.printTime}</div><div className="mp-v">{formatNumber((selectedSession.summary?.print_time_seconds || 0) / 60, 1)} min</div>
                  <div className="mp-k">{ui.weight}</div><div className="mp-v">{formatNumber(selectedSession.summary?.weight_g, 1)} g</div>
                  <div className="mp-k">{ui.converted}</div><div className="mp-v">{selectedSession.converted ? 'YES' : 'NO'}</div>
                  <div className="mp-k">{ui.status}</div><div className="mp-v">{selectedSession.status}</div>
                </div>
              </div>

              <div className="mp-card">
                <div className="mp-card-title">{ui.timeline}</div>
                <div className="mp-timeline">
                  {selectedSession.events.map((e) => (
                    <div key={e.id} className="mp-timeline-item">
                      <div className="mp-tl-dot" />
                      <div className="mp-tl-content">
                        <div className="mp-tl-top">
                          <span className="mp-tl-type">{e.event_type}</span>
                          <span className="mp-muted">{formatDateTime(e.timestamp)}</span>
                        </div>
                        {e.metadata && Object.keys(e.metadata).length ? (
                          <pre className="mp-json">{JSON.stringify(e.metadata, null, 2)}</pre>
                        ) : (
                          <div className="mp-muted">{ui.noMetadata}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </ForgeDialog>

      <style>{`
        .mp-admin-analytics{padding:24px;background:var(--forge-bg-void);min-height:100vh;}
        .mp-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;}
        .mp-title{font-size:26px;margin:0 0 4px 0;color:var(--forge-text-primary);font-family:var(--forge-font-heading);}
        .mp-subtitle{margin:0;color:var(--forge-text-secondary);}
        .mp-actions{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;}
        .mp-range{min-width:180px;}
        .mp-custom-range{display:flex;gap:10px;align-items:flex-end;}
        .mp-label{display:block;font-size:11px;color:var(--forge-text-secondary);margin-bottom:6px;font-family:var(--forge-font-tech);text-transform:uppercase;letter-spacing:0.08em;}
        .mp-input,.mp-select{width:100%;padding:10px 12px;border-radius:var(--forge-radius-md);border:1px solid var(--forge-border-default);background:var(--forge-bg-elevated);color:var(--forge-text-primary);outline:none;}
        .mp-input:focus,.mp-select:focus{border-color:var(--forge-accent-primary);}
        .mp-btn{padding:10px 14px;border-radius:var(--forge-radius-md);border:1px solid var(--forge-border-default);background:var(--forge-bg-elevated);color:var(--forge-text-primary);cursor:pointer;font-weight:600;}
        .mp-btn:hover{background:var(--forge-bg-overlay);border-color:var(--forge-border-active);}
        .mp-btn-ghost{background:transparent;}
        .mp-tabs{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;}
        .mp-tab{padding:10px 12px;border-radius:999px;border:1px solid var(--forge-border-default);background:var(--forge-bg-elevated);color:var(--forge-text-muted);cursor:pointer;font-weight:500;font-family:var(--forge-font-tech);letter-spacing:0.04em;font-size:13px;}
        .mp-tab.active{background:var(--forge-accent-primary);border-color:var(--forge-accent-primary);color:var(--forge-bg-void);}
        .mp-section{margin-top:18px;}
        .mp-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;}
        .mp-grid-3{grid-template-columns:repeat(3,minmax(0,1fr));}
        @media (max-width:1100px){.mp-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
        .mp-card{border:1px solid var(--forge-border-default);background:var(--forge-bg-surface);border-radius:var(--forge-radius-xl);padding:14px;box-shadow:var(--forge-shadow-sm);}
        .mp-stat-title{font-size:11px;color:var(--forge-text-muted);font-family:var(--forge-font-tech);text-transform:uppercase;letter-spacing:0.08em;}
        .mp-stat-value{font-size:22px;margin-top:6px;color:var(--forge-text-primary);font-weight:700;font-family:var(--forge-font-mono);}
        .mp-stat-sub{font-size:12px;color:var(--forge-text-muted);margin-top:6px;font-family:var(--forge-font-tech);}
        .mp-card-title{font-size:11px;margin-bottom:10px;color:var(--forge-text-secondary);font-weight:600;font-family:var(--forge-font-tech);text-transform:uppercase;letter-spacing:0.08em;}
        .mp-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}
        .mp-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px;}
        @media (max-width:1100px){.mp-two,.mp-three{grid-template-columns:1fr;}}
        .mp-table-wrap{overflow:auto;}
        .mp-table{width:100%;border-collapse:collapse;font-size:13px;}
        .mp-table th,.mp-table td{padding:10px;border-bottom:1px solid var(--forge-border-default);}
        .mp-table th{text-align:left;font-weight:600;color:var(--forge-text-muted);font-family:var(--forge-font-tech);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;}
        .mp-table td{color:var(--forge-text-secondary);}
        .mp-muted{color:var(--forge-text-muted);}
        .mp-hint{margin-top:12px;color:var(--forge-text-muted);font-size:13px;}
        .mp-filterbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
        .mp-check{display:flex;gap:8px;align-items:center;color:var(--forge-text-secondary);font-size:13px;}
        .mp-link{background:transparent;border:none;color:var(--forge-accent-primary);cursor:pointer;padding:6px 8px;border-radius:var(--forge-radius-md);font-weight:500;}
        .mp-link:hover{background:rgba(0,212,170,0.08);}
        .mp-pill{display:inline-block;padding:4px 8px;border-radius:999px;border:1px solid var(--forge-border-default);font-size:12px;color:var(--forge-text-secondary);font-weight:500;font-family:var(--forge-font-tech);}
        .mp-pill.ok{border-color:rgba(0,212,170,0.3);background:rgba(0,212,170,0.08);color:var(--forge-success);}
        .mp-pill.warn{border-color:rgba(255,181,71,0.3);background:rgba(255,181,71,0.08);color:var(--forge-warning);}
        .mp-export{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;}
        .mp-detail-grid{display:grid;grid-template-columns:380px 1fr;gap:12px;}
        @media (max-width:900px){.mp-detail-grid{grid-template-columns:1fr;}}
        .mp-kv{display:grid;grid-template-columns:140px 1fr;gap:8px 12px;font-size:13px;}
        .mp-k{color:var(--forge-text-muted);font-family:var(--forge-font-tech);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;}
        .mp-v{color:var(--forge-text-primary);}
        .mp-timeline{display:flex;flex-direction:column;gap:10px;}
        .mp-timeline-item{display:flex;gap:10px;}
        .mp-tl-dot{width:10px;height:10px;border-radius:50%;margin-top:6px;background:var(--forge-accent-primary);box-shadow:0 0 0 4px rgba(0,212,170,0.15);}
        .mp-tl-content{flex:1;}
        .mp-tl-top{display:flex;justify-content:space-between;gap:10px;align-items:center;}
        .mp-tl-type{font-weight:600;color:var(--forge-text-primary);font-family:var(--forge-font-tech);}
        .mp-json{margin:8px 0 0 0;padding:10px;border-radius:var(--forge-radius-lg);background:var(--forge-bg-elevated);border:1px solid var(--forge-border-default);font-size:12px;overflow:auto;color:var(--forge-text-secondary);font-family:var(--forge-font-mono);}
      `}</style>
    </div>
  );
}
