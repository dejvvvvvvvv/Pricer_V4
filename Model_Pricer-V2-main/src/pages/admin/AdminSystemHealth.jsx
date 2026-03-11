/**
 * AdminSystemHealth — System health & status monitoring page.
 *
 * Features:
 * - Backend health ping with response time measurement
 * - localStorage usage breakdown per namespace
 * - Browser environment info
 * - PrusaSlicer reachability via /api/health slicer data
 * - Auto-refresh every 30s with visual countdown
 * - Config backup & restore (export/import JSON, auto-backup to IndexedDB)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import ForgeToggle from '../../components/ui/forge/ForgeToggle';
import Icon from '../../components/AppIcon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useApp } from '../../contexts/AppContext';
import { getTenantId } from '../../utils/adminTenantStorage';
import ConfigBackupRestore from './components/ConfigBackupRestore';

const POLL_INTERVAL = 30; // seconds

// Storage namespaces to scan
const STORAGE_NAMESPACES = [
  { key: 'pricing:v3', label: 'Pricing', icon: 'Calculator', color: '#8B5CF6' },
  { key: 'fees:v3', label: 'Fees', icon: 'Receipt', color: '#F59E0B' },
  { key: 'branding', label: 'Branding', icon: 'Palette', color: '#EC4899' },
  { key: 'widgets', label: 'Widgets', icon: 'Code2', color: '#06B6D4' },
  { key: 'orders', label: 'Orders', icon: 'ShoppingCart', color: '#3B82F6' },
  { key: 'presets', label: 'Presets', icon: 'Sliders', color: '#10B981' },
  { key: 'parameters', label: 'Parameters', icon: 'Settings2', color: '#7A8291' },
  { key: 'team', label: 'Team', icon: 'Users', color: '#EF4444' },
  { key: 'express', label: 'Express', icon: 'Zap', color: '#F97316' },
  { key: 'shipping', label: 'Shipping', icon: 'Truck', color: '#14B8A6' },
  { key: 'coupons', label: 'Coupons', icon: 'Tag', color: '#A855F7' },
  { key: 'ecommerce', label: 'E-commerce', icon: 'Plug', color: '#6366F1' },
  { key: 'emails', label: 'Emails', icon: 'Mail', color: '#0EA5E9' },
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', color: '#22C55E' },
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', color: '#D946EF' },
  { key: 'activity', label: 'Activity', icon: 'ClipboardList', color: '#78716C' },
];

// Feature flags definitions
const FEATURE_FLAGS_CONFIG = [
  { key: 'betaFeatures', label: 'Beta funkce', description: 'Povolit experimentalni funkce', icon: 'FlaskConical' },
  { key: 'newPricingUI', label: 'Nove cenove rozhrani', description: 'Pouzit novy design ceniku', icon: 'Palette' },
  { key: 'debugMode', label: 'Debug rezim', description: 'Zobrazit technicke informace', icon: 'Bug' },
  { key: 'maintenanceMode', label: 'Udrzba', description: 'Zobrazit oznameni o udrzbe', icon: 'Wrench' },
  { key: 'advancedAnalytics', label: 'Pokrocila analytika', description: 'Rozsirene statistiky', icon: 'BarChart3' },
];

/** Format uptime seconds to human-readable string */
function formatUptime(seconds) {
  if (seconds == null) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/** Estimate byte size of a string */
function byteSize(str) {
  if (!str) return 0;
  // Rough estimate: each char = 2 bytes in JS (UTF-16)
  return str.length * 2;
}

/** Format bytes to human-readable */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Get status color based on status level */
function statusColor(status) {
  switch (status) {
    case 'healthy': return 'var(--forge-success, #10B981)';
    case 'degraded': return 'var(--forge-warning, #F59E0B)';
    case 'down': return 'var(--forge-error, #EF4444)';
    default: return 'var(--forge-text-muted)';
  }
}

/** Status dot indicator component */
function StatusDot({ status, size = 10 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: statusColor(status),
        boxShadow: `0 0 6px ${statusColor(status)}40`,
        flexShrink: 0,
      }}
      aria-label={`Status: ${status}`}
    />
  );
}

/** Reusable status card wrapper */
function StatusCard({ title, icon, status, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-lg, 12px)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Icon name={icon} size={18} style={{ color: 'var(--forge-accent-primary)' }} />
          <span style={{
            fontFamily: 'var(--forge-font-heading)',
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--forge-text-primary)',
          }}>
            {title}
          </span>
        </div>
        {status && <StatusDot status={status} />}
      </div>
      {children}
    </div>
  );
}

/** Key-value row for technical data */
function DataRow({ label, value, mono = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid var(--forge-border-default)',
    }}>
      <span style={{
        fontFamily: 'var(--forge-font-body)',
        fontSize: '13px',
        color: 'var(--forge-text-secondary)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? 'var(--forge-font-tech)' : 'var(--forge-font-body)',
        fontSize: '13px',
        color: 'var(--forge-text-primary)',
        fontWeight: 500,
        textAlign: 'right',
        maxWidth: '60%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

/** Progress bar for storage usage */
function StorageBar({ label, icon, bytes, maxBytes, color }) {
  const pct = maxBytes > 0 ? Math.min((bytes / maxBytes) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name={icon} size={13} style={{ color: color || 'var(--forge-text-muted)' }} />
          <span style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            color: 'var(--forge-text-secondary)',
          }}>
            {label}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
        }}>
          {formatBytes(bytes)}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color || 'var(--forge-accent-primary)',
          borderRadius: '3px',
          transition: 'width 300ms ease-out',
        }} />
      </div>
    </div>
  );
}

export default function AdminSystemHealth() {
  useDocumentTitle('Admin - Stav systemu');
  const isOnline = useOnlineStatus();
  const { featureFlags, setFeatureFlag } = useApp();

  // Health data
  const [health, setHealth] = useState(null);
  const [healthStatus, setHealthStatus] = useState('down'); // healthy | degraded | down
  const [responseTime, setResponseTime] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);

  // Storage data
  const [storageData, setStorageData] = useState([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);

  // Countdown
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const countdownRef = useRef(null);
  const pollRef = useRef(null);

  /** Measure localStorage usage per namespace */
  const measureStorage = useCallback(() => {
    try {
      const tenantId = getTenantId();
      const prefix = `modelpricer:${tenantId}:`;
      let totalBytes = 0;
      const nsMap = {};

      // Initialize all known namespaces
      for (const ns of STORAGE_NAMESPACES) {
        nsMap[ns.key] = 0;
      }

      // Scan all localStorage keys
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith('modelpricer:')) continue;

        const val = window.localStorage.getItem(key);
        const size = byteSize(key) + byteSize(val);
        totalBytes += size;

        // Match to namespace
        if (key.startsWith(prefix)) {
          const rest = key.slice(prefix.length);
          let matched = false;
          for (const ns of STORAGE_NAMESPACES) {
            if (rest.startsWith(ns.key)) {
              nsMap[ns.key] += size;
              matched = true;
              break;
            }
          }
          if (!matched) {
            // Count under first matching part or skip
          }
        }
      }

      const result = STORAGE_NAMESPACES.map(ns => ({
        ...ns,
        bytes: nsMap[ns.key] || 0,
      })).filter(ns => ns.bytes > 0).sort((a, b) => b.bytes - a.bytes);

      setStorageData(result);
      setTotalStorageBytes(totalBytes);
    } catch {
      setStorageData([]);
      setTotalStorageBytes(0);
    }
  }, []);

  /** Ping backend health endpoint */
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const resp = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setLastCheck(new Date());

      if (!resp.ok) {
        setHealthStatus('degraded');
        setHealth(null);
        setError(`HTTP ${resp.status}`);
        return;
      }

      const data = await resp.json();
      setHealth(data);
      setError(null);

      // Determine status
      if (data.status === 'ok') {
        setHealthStatus(elapsed > 2000 ? 'degraded' : 'healthy');
      } else {
        setHealthStatus('degraded');
      }

      // Track latency history (keep last 10)
      setLatencyHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString('cs-CZ'), ms: elapsed }];
        return next.slice(-10);
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setLastCheck(new Date());
      setHealthStatus('down');
      setHealth(null);
      setError(err.name === 'TimeoutError' ? 'Timeout (10s)' : err.message);
    }
  }, []);

  /** Run all checks */
  const runChecks = useCallback(() => {
    checkHealth();
    measureStorage();
    setCountdown(POLL_INTERVAL);
  }, [checkHealth, measureStorage]);

  // Initial check
  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return POLL_INTERVAL;
        return prev - 1;
      });
    }, 1000);

    pollRef.current = setInterval(() => {
      runChecks();
    }, POLL_INTERVAL * 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, runChecks]);

  // Browser info
  const browserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenSize: `${window.screen.width} x ${window.screen.height}`,
    viewportSize: `${window.innerWidth} x ${window.innerHeight}`,
    colorDepth: `${window.screen.colorDepth}-bit`,
    pixelRatio: window.devicePixelRatio?.toFixed(1) || '1.0',
    cookiesEnabled: navigator.cookieEnabled ? 'Ano' : 'Ne',
    platform: navigator.platform || '--',
  };

  // Avg latency
  const avgLatency = latencyHistory.length > 0
    ? Math.round(latencyHistory.reduce((s, l) => s + l.ms, 0) / latencyHistory.length)
    : null;

  // Max storage for bar chart scale (5MB localStorage limit)
  const maxStorageForBar = Math.max(totalStorageBytes * 1.5, 1024);

  return (
    <div>
      <ForgePageHeader
        title="Stav systemu"
        breadcrumb="ADMIN / SYSTEM HEALTH"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--forge-radius-md, 8px)',
                border: '1px solid var(--forge-border-default)',
                backgroundColor: autoRefresh ? 'rgba(0, 212, 170, 0.1)' : 'var(--forge-bg-elevated)',
                color: autoRefresh ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon name={autoRefresh ? 'RotateCw' : 'Pause'} size={14} />
              {autoRefresh ? `Auto (${countdown}s)` : 'Pozastaveno'}
            </button>

            {/* Manual refresh */}
            <button
              onClick={runChecks}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--forge-radius-md, 8px)',
                border: '1px solid var(--forge-border-default)',
                backgroundColor: 'var(--forge-bg-elevated)',
                color: 'var(--forge-text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon name="RefreshCw" size={14} />
              Obnovit
            </button>
          </div>
        }
      />

      {/* Last check timestamp */}
      {lastCheck && (
        <div style={{
          marginTop: '8px',
          marginBottom: '24px',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Posledni kontrola: {lastCheck.toLocaleString('cs-CZ')}
        </div>
      )}

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        marginTop: lastCheck ? 0 : '24px',
      }}>

        {/* ===== BACKEND STATUS ===== */}
        <StatusCard title="Backend" icon="Server" status={healthStatus}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--forge-radius-sm, 6px)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '12px',
              color: 'var(--forge-error, #EF4444)',
            }}>
              {error}
            </div>
          )}
          <div>
            <DataRow label="Status" value={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={healthStatus} size={8} />
                {healthStatus === 'healthy' ? 'OK' : healthStatus === 'degraded' ? 'Degradovany' : 'Nedostupny'}
              </span>
            } />
            <DataRow label="Odezva" value={responseTime != null ? `${responseTime} ms` : '--'} mono />
            <DataRow label="Uptime" value={health ? formatUptime(health.uptime) : '--'} mono />
            <DataRow label="Verze" value={health?.version || '--'} mono />
            <DataRow label="Node.js" value={health?.node || '--'} mono />
            <DataRow label="Service" value={health?.service || '--'} mono />
          </div>
          {health?.memory && (
            <div>
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                PAMET SERVERU
              </div>
              <DataRow
                label="Heap (pouzito / celkem)"
                value={`${health.memory.heapUsedMB} / ${health.memory.heapTotalMB} MB`}
                mono
              />
              {/* Memory usage bar */}
              <div style={{
                marginTop: '8px',
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--forge-bg-elevated)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${health.memory.heapTotalMB > 0
                    ? Math.min((health.memory.heapUsedMB / health.memory.heapTotalMB) * 100, 100)
                    : 0}%`,
                  height: '100%',
                  backgroundColor: health.memory.heapUsedMB / health.memory.heapTotalMB > 0.85
                    ? 'var(--forge-error)'
                    : health.memory.heapUsedMB / health.memory.heapTotalMB > 0.7
                      ? 'var(--forge-warning)'
                      : 'var(--forge-accent-primary)',
                  borderRadius: '3px',
                  transition: 'width 300ms ease-out',
                }} />
              </div>
            </div>
          )}
        </StatusCard>

        {/* ===== API LATENCY ===== */}
        <StatusCard
          title="Latence API"
          icon="Activity"
          status={avgLatency == null ? null : avgLatency < 500 ? 'healthy' : avgLatency < 2000 ? 'degraded' : 'down'}
        >
          <div>
            <DataRow label="Aktualni" value={responseTime != null ? `${responseTime} ms` : '--'} mono />
            <DataRow label="Prumer (poslednich 10)" value={avgLatency != null ? `${avgLatency} ms` : '--'} mono />
            <DataRow label="Mereni" value={`${latencyHistory.length} / 10`} mono />
          </div>

          {/* Mini latency chart */}
          {latencyHistory.length > 1 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                HISTORIE LATENCE
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3px',
                height: '48px',
              }}>
                {latencyHistory.map((entry, i) => {
                  const maxMs = Math.max(...latencyHistory.map(e => e.ms), 100);
                  const heightPct = Math.max((entry.ms / maxMs) * 100, 4);
                  const barColor = entry.ms < 500
                    ? 'var(--forge-accent-primary)'
                    : entry.ms < 2000
                      ? 'var(--forge-warning)'
                      : 'var(--forge-error)';
                  return (
                    <div
                      key={i}
                      title={`${entry.time}: ${entry.ms}ms`}
                      style={{
                        flex: 1,
                        height: `${heightPct}%`,
                        backgroundColor: barColor,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 300ms ease-out',
                        cursor: 'default',
                        minWidth: '8px',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </StatusCard>

        {/* ===== STORAGE USAGE ===== */}
        <StatusCard title="Uloziste (localStorage)" icon="HardDrive" status={null}>
          <div>
            <DataRow label="Celkem (modelpricer)" value={formatBytes(totalStorageBytes)} mono />
            <DataRow label="Tenant ID" value={getTenantId()} mono />
            <DataRow label="Limit prohlizece" value="~5 MB" mono />
          </div>

          {storageData.length > 0 ? (
            <div style={{ marginTop: '4px' }}>
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                POUZITI DLE NAMESPACE
              </div>
              {storageData.map(ns => (
                <StorageBar
                  key={ns.key}
                  label={ns.label}
                  icon={ns.icon}
                  bytes={ns.bytes}
                  maxBytes={maxStorageForBar}
                  color={ns.color}
                />
              ))}
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              color: 'var(--forge-text-muted)',
              textAlign: 'center',
              padding: '12px 0',
            }}>
              Zadna data v localStorage
            </div>
          )}
        </StatusCard>

        {/* ===== BROWSER INFO ===== */}
        <StatusCard
          title="Prohlizec"
          icon="Monitor"
          status={isOnline ? 'healthy' : 'down'}
        >
          <div>
            <DataRow label="Online" value={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={isOnline ? 'healthy' : 'down'} size={8} />
                {isOnline ? 'Ano' : 'Ne'}
              </span>
            } />
            <DataRow label="Jazyk" value={browserInfo.language} mono />
            <DataRow label="Obrazovka" value={browserInfo.screenSize} mono />
            <DataRow label="Viewport" value={browserInfo.viewportSize} mono />
            <DataRow label="Barevna hloubka" value={browserInfo.colorDepth} mono />
            <DataRow label="Pixel ratio" value={`${browserInfo.pixelRatio}x`} mono />
            <DataRow label="Cookies" value={browserInfo.cookiesEnabled} />
            <DataRow label="Platforma" value={browserInfo.platform} mono />
          </div>
          <div style={{
            marginTop: '4px',
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '10px',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}>
            USER AGENT
          </div>
          <div style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '11px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.5,
            wordBreak: 'break-all',
            padding: '8px 10px',
            backgroundColor: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm, 6px)',
          }}>
            {browserInfo.userAgent}
          </div>
        </StatusCard>

        {/* ===== SLICER STATUS ===== */}
        <StatusCard
          title="PrusaSlicer"
          icon="Layers"
          status={health ? (health.status === 'ok' ? 'healthy' : 'degraded') : 'down'}
        >
          <div>
            <DataRow label="Backend dostupny" value={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={health ? 'healthy' : 'down'} size={8} />
                {health ? 'Ano' : 'Ne'}
              </span>
            } />
            <DataRow
              label="Slicer endpoint"
              value="/api/slice"
              mono
            />
            <DataRow
              label="Status"
              value={health ? 'Pripraveny (via backend)' : 'Nelze overit — backend nedostupny'}
            />
          </div>
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--forge-radius-sm, 6px)',
            backgroundColor: 'var(--forge-bg-elevated)',
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            color: 'var(--forge-text-muted)',
            lineHeight: 1.5,
          }}>
            PrusaSlicer je dostupny pres backend API. Stav nelze overit nezavisle —
            pokud je backend online, slicer je pripraveny ke zpracovani modelu.
          </div>
        </StatusCard>

        {/* ===== FEATURE FLAGS ===== */}
        <StatusCard title="Feature Flags" icon="ToggleLeft" status={null}>
          {/* Maintenance mode warning */}
          {featureFlags.maintenanceMode && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--forge-radius-sm, 6px)',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              color: 'var(--forge-warning, #F97316)',
            }}>
              <Icon name="AlertTriangle" size={16} />
              Rezim udrzby je aktivni — uzivatele uvidí oznameni o udrzbe.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FEATURE_FLAGS_CONFIG.map((flag) => {
              const isActive = Boolean(featureFlags[flag.key]);
              return (
                <div
                  key={flag.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--forge-border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <Icon
                      name={flag.icon}
                      size={15}
                      style={{ color: isActive ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--forge-font-body)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--forge-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        {flag.label}
                        <span style={{
                          fontFamily: 'var(--forge-font-tech)',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: isActive ? 'rgba(0, 212, 170, 0.12)' : 'rgba(122, 130, 145, 0.12)',
                          color: isActive ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {isActive ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--forge-font-body)',
                        fontSize: '12px',
                        color: 'var(--forge-text-muted)',
                        marginTop: '2px',
                      }}>
                        {flag.description}
                      </div>
                    </div>
                  </div>
                  <ForgeToggle
                    checked={isActive}
                    onChange={(val) => setFeatureFlag(flag.key, val)}
                    label=""
                  />
                </div>
              );
            })}
          </div>
        </StatusCard>

        {/* ===== ENVIRONMENT ===== */}
        <StatusCard title="Prostredi" icon="Settings" status={null}>
          <div>
            <DataRow label="Rezim" value={import.meta.env.MODE || 'development'} mono />
            <DataRow label="Base URL" value={import.meta.env.BASE_URL || '/'} mono />
            <DataRow label="DEV" value={import.meta.env.DEV ? 'Ano' : 'Ne'} mono />
            <DataRow label="PROD" value={import.meta.env.PROD ? 'Ano' : 'Ne'} mono />
            <DataRow label="Timestamp buildu" value={
              new Date().toLocaleDateString('cs-CZ', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })
            } mono />
          </div>
        </StatusCard>
      </div>

      {/* ===== CONFIG BACKUP & RESTORE ===== */}
      <ConfigBackupRestore />
    </div>
  );
}
