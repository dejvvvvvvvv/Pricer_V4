import React, { useEffect, useMemo, useState } from 'react';
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

function MiniSeriesTable({ title, series }) {
  const safeSeries = Array.isArray(series) ? series : [];
  return (
    <div className="mp-card">
      <div className="mp-card-title">{title}</div>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th style={{ textAlign: 'right' }}>Počet</th>
            </tr>
          </thead>
          <tbody>
            {safeSeries.length === 0 ? (
              <tr><td colSpan={2} className="mp-muted">Žádná data</td></tr>
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
  const { t } = useLanguage();
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
    if (!window.confirm('Opravdu chceš smazat všechna analytics demo data?')) return;
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
          <h1 className="mp-title">Analytics</h1>
          <p className="mp-subtitle">Přehled toho, co se děje ve widgetu (Varianta A – demo).</p>
        </div>

        <div className="mp-actions">
          <div className="mp-range">
            <label className="mp-label">Období</label>
            <select className="mp-select" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">Posledních 7 dní</option>
              <option value="30">Posledních 30 dní</option>
              <option value="90">Posledních 90 dní</option>
              <option value="custom">Vlastní</option>
            </select>
          </div>

          {range === 'custom' ? (
            <div className="mp-custom-range">
              <div>
                <label className="mp-label">Od</label>
                <input
                  className="mp-input"
                  type="date"
                  value={fromISO.slice(0, 10)}
                  onChange={(e) => setFromISO(`${e.target.value}T00:00:00.000Z`)}
                />
              </div>
              <div>
                <label className="mp-label">Do</label>
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
            Reset demo dat
          </button>
          <button type="button" className="mp-btn" onClick={forceRefresh}>
            Obnovit
          </button>
        </div>
      </div>

      <div className="mp-tabs">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabButton>
        <TabButton active={tab === 'calculations'} onClick={() => setTab('calculations')}>Calculations</TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>Orders analytics</TabButton>
        <TabButton active={tab === 'lost'} onClick={() => setTab('lost')}>Lost calculations</TabButton>
        <TabButton active={tab === 'exports'} onClick={() => setTab('exports')}>Exports</TabButton>
      </div>

      {tab === 'overview' ? (
        <div className="mp-section">
          <div className="mp-grid">
            <StatCard title="Kalkulace" value={formatNumber(overview.metrics.calculations)} sub="PRICE_SHOWN" />
            <StatCard title="Objednávky" value={formatNumber(overview.metrics.orders)} sub="ORDER_CREATED / ADD_TO_CART" />
            <StatCard
              title="Konverze"
              value={`${formatNumber(overview.metrics.conversion_rate * 100, 1)} %`}
              sub="objednávky / kalkulace"
            />
            <StatCard title="Průměrná cena" value={`${formatNumber(overview.metrics.avg_price, 0)} Kč`} />
            <StatCard title="Průměrný čas" value={`${formatNumber(overview.metrics.avg_time_min, 1)} min`} />
            <StatCard title="Průměrná hmotnost" value={`${formatNumber(overview.metrics.avg_weight_g, 1)} g`} />
          </div>

          <div className="mp-two">
            <MiniSeriesTable title="Kalkulace / den" series={overview.series.calculations_per_day} />
            <MiniSeriesTable title="Objednávky / den" series={overview.series.orders_per_day} />
          </div>

          <div className="mp-three">
            <div className="mp-card">
              <div className="mp-card-title">Top materiály</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Materiál</th><th style={{ textAlign: 'right' }}>Počet</th></tr></thead>
                  <tbody>
                    {overview.top.materials.length === 0 ? (
                      <tr><td colSpan={2} className="mp-muted">Žádná data</td></tr>
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
              <div className="mp-card-title">Top presety</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Preset</th><th style={{ textAlign: 'right' }}>Počet</th><th style={{ textAlign: 'right' }}>Konverze</th></tr></thead>
                  <tbody>
                    {overview.top.presets.length === 0 ? (
                      <tr><td colSpan={3} className="mp-muted">Žádná data</td></tr>
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
              <div className="mp-card-title">Top poplatky (fees)</div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Fee</th><th style={{ textAlign: 'right' }}>Zvoleno</th></tr></thead>
                  <tbody>
                    {overview.top.fees.length === 0 ? (
                      <tr><td colSpan={2} className="mp-muted">Žádná data</td></tr>
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
            Tip: Pro demo data se použije simulace (localStorage). Později se dá napojit widget.js → /api/public/analytics/event.
          </div>
        </div>
      ) : null}

      {tab === 'calculations' ? (
        <div className="mp-section">
          <div className="mp-filterbar">
            <input
              className="mp-input"
              placeholder="Hledej session / soubor / materiál / preset"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <label className="mp-check">
              <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
              Jen failed
            </label>
          </div>

          <div className="mp-card">
            <div className="mp-card-title">Calculation sessions</div>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Čas</th>
                    <th>Soubor</th>
                    <th>Materiál</th>
                    <th>Preset</th>
                    <th style={{ textAlign: 'right' }}>Čas</th>
                    <th style={{ textAlign: 'right' }}>Hmotnost</th>
                    <th style={{ textAlign: 'right' }}>Cena</th>
                    <th style={{ textAlign: 'center' }}>Converted</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.length === 0 ? (
                    <tr><td colSpan={10} className="mp-muted">Žádné kalkulace v tomto období</td></tr>
                  ) : (
                    calculations.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.file_name || 'unknown'}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kč</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`mp-pill ${s.converted ? 'ok' : ''}`}>{s.converted ? 'YES' : 'NO'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`mp-pill ${s.status === 'success' ? 'ok' : 'warn'}`}>{s.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="mp-link" onClick={() => setSelectedSessionId(s.session_id)}>Detail</button>
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
            <StatCard title="Revenue (estimate)" value={`${formatNumber(overview.metrics.revenue_estimate, 0)} Kč`} />
            <StatCard title="Orders" value={formatNumber(overview.metrics.orders)} />
            <StatCard title="Avg order value" value={`${formatNumber(overview.metrics.avg_order_value, 0)} Kč`} />
          </div>
          <div className="mp-card">
            <div className="mp-card-title">Poznámka</div>
            <p className="mp-muted" style={{ margin: 0 }}>
              Ve Variantě A je „order“ odvozený z eventu ORDER_CREATED nebo ADD_TO_CART_CLICKED. Později (Varianta B)
              se to propojí s reálnými objednávkami (Orders modul) a webhooky z e-shopu.
            </p>
          </div>
        </div>
      ) : null}

      {tab === 'lost' ? (
        <div className="mp-section">
          <div className="mp-card">
            <div className="mp-card-title">Lost calculations (PRICE_SHOWN bez konverze, &gt; 30 min)</div>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Poslední aktivita</th>
                    <th>Materiál</th>
                    <th>Preset</th>
                    <th style={{ textAlign: 'right' }}>Cena</th>
                    <th style={{ textAlign: 'right' }}>Čas</th>
                    <th style={{ textAlign: 'right' }}>Hmotnost</th>
                    <th>Drop-off</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lost.length === 0 ? (
                    <tr><td colSpan={8} className="mp-muted">Žádné ztracené kalkulace v tomto období</td></tr>
                  ) : (
                    lost.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kč</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td>{s.drop_off_step || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="mp-link" onClick={() => setSelectedSessionId(s.session_id)}>Detail</button>
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
            <div className="mp-card-title">CSV export</div>
            <div className="mp-export">
              <div>
                <label className="mp-label">Typ exportu</label>
                <select className="mp-select" value={exportType} onChange={(e) => setExportType(e.target.value)}>
                  <option value="calculations">Calculations</option>
                  <option value="lost">Lost calculations</option>
                  <option value="overview">Overview summary</option>
                </select>
              </div>
              <button type="button" className="mp-btn" onClick={handleExport}>Generate & Download CSV</button>
            </div>
            <p className="mp-muted" style={{ marginTop: 10 }}>
              Export se v demo režimu generuje synchronně z localStorage. Vytvoření exportu se zapisuje do Audit logu (G).
            </p>
          </div>
        </div>
      ) : null}

      {selectedSession ? (
        <div className="mp-modal" role="dialog" aria-modal="true">
          <div className="mp-modal-backdrop" onClick={() => setSelectedSessionId(null)} />
          <div className="mp-modal-card">
            <div className="mp-modal-head">
              <div>
                <div className="mp-modal-title">Session detail</div>
                <div className="mp-muted" style={{ marginTop: 2 }}>
                  {selectedSession.session_id}
                </div>
              </div>
              <button className="mp-btn mp-btn-ghost" onClick={() => setSelectedSessionId(null)}>Zavřít</button>
            </div>

            <div className="mp-modal-body">
              <div className="mp-detail-grid">
                <div className="mp-card">
                  <div className="mp-card-title">Summary</div>
                  <div className="mp-kv">
                    <div className="mp-k">Last event</div><div className="mp-v">{formatDateTime(selectedSession.last_event_at)}</div>
                    <div className="mp-k">Material</div><div className="mp-v">{selectedSession.summary?.material || '-'}</div>
                    <div className="mp-k">Preset</div><div className="mp-v">{selectedSession.summary?.preset || '-'}</div>
                    <div className="mp-k">Price</div><div className="mp-v">{formatNumber(selectedSession.summary?.price_total, 0)} Kč</div>
                    <div className="mp-k">Print time</div><div className="mp-v">{formatNumber((selectedSession.summary?.print_time_seconds || 0) / 60, 1)} min</div>
                    <div className="mp-k">Weight</div><div className="mp-v">{formatNumber(selectedSession.summary?.weight_g, 1)} g</div>
                    <div className="mp-k">Converted</div><div className="mp-v">{selectedSession.converted ? 'YES' : 'NO'}</div>
                    <div className="mp-k">Status</div><div className="mp-v">{selectedSession.status}</div>
                  </div>
                </div>

                <div className="mp-card">
                  <div className="mp-card-title">Timeline</div>
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
                            <div className="mp-muted">(bez metadat)</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

        /* Modal */
        .mp-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;}
        .mp-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.7);}
        .mp-modal-card{position:relative;max-width:1000px;width:calc(100% - 24px);max-height:calc(100% - 24px);overflow:hidden;border-radius:var(--forge-radius-xl);border:1px solid var(--forge-border-default);background:var(--forge-bg-surface);box-shadow:var(--forge-shadow-lg);}
        .mp-modal-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid var(--forge-border-default);background:var(--forge-bg-elevated);}
        .mp-modal-title{font-size:16px;font-weight:600;color:var(--forge-text-primary);font-family:var(--forge-font-heading);}
        .mp-modal-body{padding:16px;overflow:auto;max-height:calc(100% - 60px);}
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
