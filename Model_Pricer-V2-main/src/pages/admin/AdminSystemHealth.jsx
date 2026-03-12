/**
 * AdminSystemHealth — System health & status monitoring page.
 *
 * Features:
 * - Backend API health ping with response time measurement
 * - Slicer availability check via /api/health
 * - Server memory usage visualization with color-coded thresholds
 * - Uptime display
 * - Auto-refresh every 30s with visual countdown
 * - Status indicators: green (healthy), yellow (warning), red (error)
 * - Configuration summary: which features are configured vs missing
 * - localStorage analytics: total, per namespace, top 5 biggest keys
 * - Clear cache button with confirmation dialog
 * - Export all config as backup
 * - Browser & environment info (screen, viewport, online status, version)
 * - Feature flags management
 * - Config backup & restore (export/import JSON, auto-backup to IndexedDB)
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import ForgeToggle from '../../components/ui/forge/ForgeToggle';
import { ForgeConfirmDialog, useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import Icon from '../../components/AppIcon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useApp } from '../../contexts/AppContext';
import { getTenantId, readTenantJson } from '../../utils/adminTenantStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import { loadFeesConfigV3 } from '../../utils/adminFeesStorage';
import { getBranding, getWidgets } from '../../utils/adminBrandingWidgetStorage';
import { loadEmailConfigV1 } from '../../utils/adminEmailStorage';
import ConfigBackupRestore from './components/ConfigBackupRestore';
import SecurityAuditPanel from './components/SecurityAuditPanel';

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

/** Section label in uppercase tech font */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--forge-font-tech)',
      fontSize: '10px',
      color: 'var(--forge-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

/** Configuration check row with icon */
function ConfigCheckRow({ label, configured, detail }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '7px 0',
      borderBottom: '1px solid var(--forge-border-default)',
    }}>
      <span style={{
        fontFamily: 'var(--forge-font-body)',
        fontSize: '13px',
        color: 'var(--forge-text-secondary)',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {detail && (
          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '11px',
            color: 'var(--forge-text-muted)',
          }}>
            {detail}
          </span>
        )}
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '13px',
          fontWeight: 600,
          color: configured
            ? 'var(--forge-success, #10B981)'
            : 'var(--forge-text-muted, #7A8291)',
        }}>
          {configured ? '\u2713' : '\u2717'}
        </span>
      </div>
    </div>
  );
}

/** Memory usage circular visualization */
function MemoryGauge({ usedMB, totalMB }) {
  if (!totalMB || totalMB <= 0) return null;
  const pct = Math.min((usedMB / totalMB) * 100, 100);
  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct > 85
    ? 'var(--forge-error, #EF4444)'
    : pct > 70
      ? 'var(--forge-warning, #F59E0B)'
      : 'var(--forge-accent-primary, #00D4AA)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke="var(--forge-bg-elevated)"
          strokeWidth={stroke}
        />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
        <text
          x="44" y="40"
          textAnchor="middle"
          style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '14px',
            fontWeight: 700,
            fill: 'var(--forge-text-primary)',
          }}
        >
          {Math.round(pct)}%
        </text>
        <text
          x="44" y="54"
          textAnchor="middle"
          style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '9px',
            fill: 'var(--forge-text-muted)',
          }}
        >
          heap
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        <DataRow label="Pouzito" value={`${usedMB} MB`} mono />
        <DataRow label="Celkem" value={`${totalMB} MB`} mono />
        <DataRow label="Volne" value={`${Math.max(0, totalMB - usedMB).toFixed(1)} MB`} mono />
      </div>
    </div>
  );
}

/** Tab definitions for System Health page */
const SYSTEM_HEALTH_TABS = [
  { key: 'health', label: 'Stav systemu', icon: 'Activity' },
  { key: 'security', label: 'Bezpecnost', icon: 'Shield' },
];

export default function AdminSystemHealth() {
  useDocumentTitle('Admin - Stav systemu');
  const isOnline = useOnlineStatus();
  const { featureFlags, setFeatureFlag, appVersion } = useApp();

  // Active tab
  const [activeTab, setActiveTab] = useState('health');

  // Health data
  const [health, setHealth] = useState(null);
  const [healthStatus, setHealthStatus] = useState('down');
  const [responseTime, setResponseTime] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);

  // Storage data
  const [storageData, setStorageData] = useState([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [topKeys, setTopKeys] = useState([]);

  // Config summary
  const [configSummary, setConfigSummary] = useState(null);

  // Countdown
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const countdownRef = useRef(null);
  const pollRef = useRef(null);

  // Confirm dialog for cache clear
  const clearCacheDialog = useConfirmDialog();

  /** Check configuration status of various features */
  const checkConfigSummary = useCallback(() => {
    try {
      const tenantId = getTenantId();

      // Pricing
      const pricing = loadPricingConfigV3(tenantId);
      const hasPricing = Boolean(pricing && pricing.materials && Object.keys(pricing.materials).length > 0);
      const materialCount = pricing?.materials ? Object.keys(pricing.materials).length : 0;

      // Fees
      const fees = loadFeesConfigV3(tenantId);
      const feesList = fees?.fees || [];
      const activeFees = feesList.filter(f => f.enabled !== false);

      // Branding
      const branding = getBranding(tenantId);
      const hasLogo = Boolean(branding?.logoUrl || branding?.logo);

      // Widgets
      const widgets = getWidgets(tenantId);
      const publishedWidgets = (widgets || []).filter(w => w.published || w.isPublished);

      // Email
      const emailConfig = loadEmailConfigV1();
      const hasEmailProvider = Boolean(emailConfig?.provider && emailConfig.provider !== 'none');

      // Presets
      const presets = readTenantJson('presets', []);
      const presetsCount = Array.isArray(presets) ? presets.length : 0;

      setConfigSummary({
        hasPricing,
        materialCount,
        feesTotal: feesList.length,
        feesActive: activeFees.length,
        hasLogo,
        brandingName: branding?.companyName || null,
        widgetTotal: (widgets || []).length,
        widgetPublished: publishedWidgets.length,
        hasEmailProvider,
        emailProvider: emailConfig?.provider || null,
        presetsCount,
      });
    } catch {
      setConfigSummary(null);
    }
  }, []);

  /** Measure localStorage usage per namespace + collect top 5 keys */
  const measureStorage = useCallback(() => {
    try {
      const tenantId = getTenantId();
      const prefix = `modelpricer:${tenantId}:`;
      let totalBytes = 0;
      const nsMap = {};
      const allKeys = [];

      for (const ns of STORAGE_NAMESPACES) {
        nsMap[ns.key] = 0;
      }

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith('modelpricer:')) continue;

        const val = window.localStorage.getItem(key);
        const size = byteSize(key) + byteSize(val);
        totalBytes += size;
        allKeys.push({ key, size });

        if (key.startsWith(prefix)) {
          const rest = key.slice(prefix.length);
          for (const ns of STORAGE_NAMESPACES) {
            if (rest.startsWith(ns.key)) {
              nsMap[ns.key] += size;
              break;
            }
          }
        }
      }

      const result = STORAGE_NAMESPACES.map(ns => ({
        ...ns,
        bytes: nsMap[ns.key] || 0,
      })).filter(ns => ns.bytes > 0).sort((a, b) => b.bytes - a.bytes);

      // Top 5 biggest keys
      allKeys.sort((a, b) => b.size - a.size);
      setTopKeys(allKeys.slice(0, 5));

      setStorageData(result);
      setTotalStorageBytes(totalBytes);
    } catch {
      setStorageData([]);
      setTotalStorageBytes(0);
      setTopKeys([]);
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

      if (data.status === 'ok') {
        setHealthStatus(elapsed > 2000 ? 'degraded' : 'healthy');
      } else {
        setHealthStatus('degraded');
      }

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
    checkConfigSummary();
    setCountdown(POLL_INTERVAL);
  }, [checkHealth, measureStorage, checkConfigSummary]);

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

  /** Clear all modelpricer cache from localStorage */
  const handleClearCache = useCallback(() => {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('modelpricer:') && key !== 'modelpricer:tenant_id') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => window.localStorage.removeItem(k));
    measureStorage();
    checkConfigSummary();
  }, [measureStorage, checkConfigSummary]);

  /** Export all modelpricer config as JSON backup */
  const handleExportConfig = useCallback(() => {
    const data = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('modelpricer:')) {
        const raw = window.localStorage.getItem(key);
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelpricer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Browser info
  const browserInfo = useMemo(() => ({
    language: navigator.language,
    screenSize: `${window.screen.width} x ${window.screen.height}`,
    viewportSize: `${window.innerWidth} x ${window.innerHeight}`,
    colorDepth: `${window.screen.colorDepth}-bit`,
    pixelRatio: window.devicePixelRatio?.toFixed(1) || '1.0',
    cookiesEnabled: navigator.cookieEnabled ? 'Ano' : 'Ne',
    platform: navigator.platform || '--',
  }), []);

  // Avg latency
  const avgLatency = latencyHistory.length > 0
    ? Math.round(latencyHistory.reduce((s, l) => s + l.ms, 0) / latencyHistory.length)
    : null;

  // Max storage for bar chart scale
  const maxStorageForBar = Math.max(totalStorageBytes * 1.5, 1024);

  // Estimated localStorage usage percentage (browser limit ~5MB)
  const storageLimitBytes = 5 * 1024 * 1024;
  const storageUsagePct = Math.min((totalStorageBytes / storageLimitBytes) * 100, 100);
  const storageStatus = storageUsagePct > 80 ? 'down' : storageUsagePct > 50 ? 'degraded' : 'healthy';

  // Shorten a localStorage key for display
  const shortenKey = (key) => {
    if (key.length <= 48) return key;
    return key.slice(0, 22) + '...' + key.slice(-22);
  };

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

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        marginTop: '16px',
        marginBottom: '24px',
        borderBottom: '2px solid var(--forge-border-default)',
      }}>
        {SYSTEM_HEALTH_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--forge-accent-primary, #00D4AA)'
                  : '2px solid transparent',
                marginBottom: '-2px',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon name={tab.icon} size={16} style={{
                color: isActive ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
              }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Security tab content */}
      {activeTab === 'security' && <SecurityAuditPanel />}

      {/* Health tab content */}
      {activeTab === 'health' && <>

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
        <StatusCard title="Backend API" icon="Server" status={healthStatus}>
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
              <SectionLabel>PAMET SERVERU</SectionLabel>
              <MemoryGauge
                usedMB={health.memory.heapUsedMB}
                totalMB={health.memory.heapTotalMB}
              />
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

          {latencyHistory.length > 1 && (
            <div style={{ marginTop: '4px' }}>
              <SectionLabel>HISTORIE LATENCE</SectionLabel>
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
            <DataRow label="Slicer endpoint" value="/api/slice" mono />
            <DataRow
              label="Status"
              value={health ? 'Pripraveny (via backend)' : 'Nelze overit -- backend nedostupny'}
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
            PrusaSlicer je dostupny pres backend API. Stav nelze overit nezavisle --
            pokud je backend online, slicer je pripraveny ke zpracovani modelu.
          </div>
        </StatusCard>

        {/* ===== CONFIGURATION SUMMARY ===== */}
        <StatusCard title="Konfigurace" icon="ClipboardCheck" status={null}>
          {configSummary ? (
            <div>
              <ConfigCheckRow
                label="Pricing (cenova konfigurace)"
                configured={configSummary.hasPricing}
                detail={configSummary.materialCount > 0 ? `${configSummary.materialCount} materialu` : null}
              />
              <ConfigCheckRow
                label="Materialy"
                configured={configSummary.materialCount > 0}
                detail={configSummary.materialCount > 0 ? `${configSummary.materialCount} nastaveno` : null}
              />
              <ConfigCheckRow
                label="Poplatky (fees)"
                configured={configSummary.feesActive > 0}
                detail={configSummary.feesTotal > 0
                  ? `${configSummary.feesActive} aktivnich / ${configSummary.feesTotal} celkem`
                  : null}
              />
              <ConfigCheckRow
                label="Email provider"
                configured={configSummary.hasEmailProvider}
                detail={configSummary.emailProvider && configSummary.emailProvider !== 'none'
                  ? configSummary.emailProvider
                  : null}
              />
              <ConfigCheckRow
                label="Branding (logo)"
                configured={configSummary.hasLogo}
                detail={configSummary.brandingName || null}
              />
              <ConfigCheckRow
                label="Widget (publikovany)"
                configured={configSummary.widgetPublished > 0}
                detail={configSummary.widgetTotal > 0
                  ? `${configSummary.widgetPublished} publikovanych / ${configSummary.widgetTotal} celkem`
                  : null}
              />
              <ConfigCheckRow
                label="Presety"
                configured={configSummary.presetsCount > 0}
                detail={configSummary.presetsCount > 0 ? `${configSummary.presetsCount} presetu` : null}
              />
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              color: 'var(--forge-text-muted)',
              textAlign: 'center',
              padding: '12px 0',
            }}>
              Nacitani konfigurace...
            </div>
          )}
        </StatusCard>

        {/* ===== STORAGE ANALYTICS ===== */}
        <StatusCard title="Uloziste (localStorage)" icon="HardDrive" status={storageStatus}>
          <div>
            <DataRow label="Celkem (modelpricer)" value={formatBytes(totalStorageBytes)} mono />
            <DataRow label="Tenant ID" value={getTenantId()} mono />
            <DataRow label="Vyuziti limitu" value={`${storageUsagePct.toFixed(1)}% z ~5 MB`} mono />
          </div>

          {/* Overall usage bar */}
          <div>
            <SectionLabel>CELKOVE VYUZITI</SectionLabel>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--forge-bg-elevated)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${storageUsagePct}%`,
                height: '100%',
                backgroundColor: storageUsagePct > 80
                  ? 'var(--forge-error)'
                  : storageUsagePct > 50
                    ? 'var(--forge-warning)'
                    : 'var(--forge-accent-primary)',
                borderRadius: '4px',
                transition: 'width 300ms ease-out',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '10px',
              color: 'var(--forge-text-muted)',
            }}>
              <span>{formatBytes(totalStorageBytes)}</span>
              <span>~5 MB</span>
            </div>
          </div>

          {/* Per-namespace breakdown */}
          {storageData.length > 0 && (
            <div>
              <SectionLabel>POUZITI DLE NAMESPACE</SectionLabel>
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
          )}

          {/* Top 5 biggest keys */}
          {topKeys.length > 0 && (
            <div>
              <SectionLabel>TOP 5 NEJVETSI KLICE</SectionLabel>
              {topKeys.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: i < topKeys.length - 1 ? '1px solid var(--forge-border-default)' : 'none',
                }}>
                  <span
                    title={entry.key}
                    style={{
                      fontFamily: 'var(--forge-font-tech)',
                      fontSize: '11px',
                      color: 'var(--forge-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%',
                    }}
                  >
                    {shortenKey(entry.key)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '11px',
                    color: 'var(--forge-text-muted)',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}>
                    {formatBytes(entry.size)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions: Clear cache + Export */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => clearCacheDialog.open()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--forge-radius-md, 8px)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--forge-error, #EF4444)',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon name="Trash2" size={13} />
              Vymazat cache
            </button>
            <button
              onClick={handleExportConfig}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--forge-radius-md, 8px)',
                border: '1px solid var(--forge-border-default)',
                backgroundColor: 'var(--forge-bg-elevated)',
                color: 'var(--forge-text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon name="Download" size={13} />
              Exportovat konfiguraci
            </button>
          </div>

          {storageData.length === 0 && totalStorageBytes === 0 && (
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

        {/* ===== BROWSER & ENVIRONMENT INFO ===== */}
        <StatusCard
          title="Prostredi a prohlizec"
          icon="Monitor"
          status={isOnline ? 'healthy' : 'down'}
        >
          <div>
            <SectionLabel>PRIPOJENI</SectionLabel>
            <DataRow label="Online" value={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={isOnline ? 'healthy' : 'down'} size={8} />
                {isOnline ? 'Ano' : 'Ne'}
              </span>
            } />
          </div>

          <div>
            <SectionLabel>PROSTREDI</SectionLabel>
            <DataRow label="Verze frontendu" value={appVersion || '--'} mono />
            <DataRow label="API endpoint" value={import.meta.env.VITE_API_URL || '/api'} mono />
            <DataRow label="Rezim" value={import.meta.env.MODE || 'development'} mono />
            <DataRow label="Base URL" value={import.meta.env.BASE_URL || '/'} mono />
            <DataRow label="DEV" value={import.meta.env.DEV ? 'Ano' : 'Ne'} mono />
            <DataRow label="PROD" value={import.meta.env.PROD ? 'Ano' : 'Ne'} mono />
          </div>

          <div>
            <SectionLabel>PROHLIZEC</SectionLabel>
            <DataRow label="Jazyk" value={browserInfo.language} mono />
            <DataRow label="Obrazovka" value={browserInfo.screenSize} mono />
            <DataRow label="Viewport" value={browserInfo.viewportSize} mono />
            <DataRow label="Barevna hloubka" value={browserInfo.colorDepth} mono />
            <DataRow label="Pixel ratio" value={`${browserInfo.pixelRatio}x`} mono />
            <DataRow label="Cookies" value={browserInfo.cookiesEnabled} />
            <DataRow label="Platforma" value={browserInfo.platform} mono />
          </div>

          <div>
            <SectionLabel>USER AGENT</SectionLabel>
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
              {navigator.userAgent}
            </div>
          </div>
        </StatusCard>

        {/* ===== FEATURE FLAGS ===== */}
        <StatusCard title="Feature Flags" icon="ToggleLeft" status={null}>
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
              Rezim udrzby je aktivni -- uzivatele uvidi oznameni o udrzbe.
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
      </div>

      {/* ===== CONFIG BACKUP & RESTORE ===== */}
      <ConfigBackupRestore />

      </>}

      {/* Confirm dialog for cache clear */}
      <ForgeConfirmDialog
        {...clearCacheDialog.props}
        title="Vymazat cache"
        description="Opravdu chcete smazat vsechna ulozena data v localStorage (krome tenant ID)? Tato akce je nevratna. Konfigurace pricing, fees, branding a dalsich bude ztracena."
        confirmLabel="Smazat cache"
        variant="danger"
        onConfirm={handleClearCache}
      />
    </div>
  );
}
