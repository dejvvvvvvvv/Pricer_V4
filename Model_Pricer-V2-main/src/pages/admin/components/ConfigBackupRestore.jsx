/**
 * ConfigBackupRestore — Full configuration backup & restore for tenant settings.
 *
 * Features:
 * - Export all tenant config as JSON (selective via checkboxes)
 * - Import config from JSON file with validation, preview, and selective restore
 * - Auto-backup to IndexedDB every 24h (opt-in, keeps last 5)
 *
 * Uses storage helpers for reading/writing — never touches localStorage directly
 * except for collecting raw data during export (read-only scan).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import ForgeDialog from '../../../components/ui/forge/ForgeDialog';
import { ForgeConfirmDialog } from '../../../components/ui/forge/ForgeConfirmDialog';
import { getTenantId, readTenantJson, writeTenantJson } from '../../../utils/adminTenantStorage';
import { downloadFile } from '../../../utils/exportData';

// ---------------------------------------------------------------------------
// Config namespace registry — all config namespaces to backup/restore
// ---------------------------------------------------------------------------

const CONFIG_NAMESPACES = [
  // Standard tenant-scoped (modelpricer:${tenantId}:${namespace})
  { key: 'pricing:v3',          label: 'Cenova konfigurace',    icon: 'Calculator',      color: '#8B5CF6', type: 'tenant' },
  { key: 'fees:v3',             label: 'Poplatky',              icon: 'Receipt',         color: '#F59E0B', type: 'tenant' },
  { key: 'shipping:v1',         label: 'Doprava',               icon: 'Truck',           color: '#14B8A6', type: 'tenant' },
  { key: 'express:v1',          label: 'Expresni doruceni',     icon: 'Zap',             color: '#F97316', type: 'tenant' },
  { key: 'coupons:v1',          label: 'Kupony a akce',         icon: 'Tag',             color: '#A855F7', type: 'tenant' },
  { key: 'email:v1',            label: 'Email konfigurace',     icon: 'Mail',            color: '#0EA5E9', type: 'tenant' },
  { key: 'email-templates:v1',  label: 'Email sablony',         icon: 'FileText',        color: '#0EA5E9', type: 'tenant' },
  { key: 'form:v1',             label: 'Formular objednavky',   icon: 'ClipboardList',   color: '#6366F1', type: 'tenant' },
  { key: 'kanban:v1',           label: 'Kanban nastaveni',      icon: 'Columns',         color: '#78716C', type: 'tenant' },
  { key: 'payment:v1',          label: 'Platby',                icon: 'CreditCard',      color: '#22C55E', type: 'tenant' },
  { key: 'dashboard:v2',        label: 'Dashboard layout',      icon: 'LayoutDashboard', color: '#22C55E', type: 'tenant' },
  { key: 'company:v1',          label: 'Firemni udaje',         icon: 'Building2',       color: '#3B82F6', type: 'tenant' },
  { key: 'notifications',       label: 'Notifikace',            icon: 'Bell',            color: '#EF4444', type: 'tenant' },

  // Legacy-keyed (modelpricer_branding__${tenantId}, etc.)
  { key: 'branding',            label: 'Branding',              icon: 'Palette',         color: '#EC4899', type: 'legacy', legacyKey: (tid) => `modelpricer_branding__${tid}` },
  { key: 'widgets',             label: 'Widget instance',       icon: 'Code2',           color: '#06B6D4', type: 'legacy', legacyKey: (tid) => `modelpricer_widgets__${tid}` },
  { key: 'plan_features',       label: 'Plan / funkce',         icon: 'Crown',           color: '#D946EF', type: 'legacy', legacyKey: (tid) => `modelpricer_plan_features__${tid}` },
  { key: 'ecommerce',           label: 'E-commerce',            icon: 'Plug',            color: '#6366F1', type: 'legacy', legacyKey: (tid) => `modelpricer_ecommerce__${tid}` },
];

const BACKUP_FORMAT_VERSION = 1;
const IDB_DB_NAME = 'modelpricer_autobackup';
const IDB_STORE_NAME = 'backups';
const IDB_VERSION = 1;
const MAX_AUTO_BACKUPS = 5;
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const AUTO_BACKUP_LS_KEY = 'modelpricer:autobackup:settings';

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(record) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Data collection helpers
// ---------------------------------------------------------------------------

function collectConfigData(selectedKeys) {
  const tenantId = getTenantId();
  const data = {};
  let count = 0;

  for (const ns of CONFIG_NAMESPACES) {
    if (!selectedKeys.includes(ns.key)) continue;

    let value = null;
    if (ns.type === 'tenant') {
      value = readTenantJson(ns.key, null);
    } else if (ns.type === 'legacy' && ns.legacyKey) {
      try {
        const raw = window.localStorage.getItem(ns.legacyKey(tenantId));
        if (raw) value = JSON.parse(raw);
      } catch {
        // skip corrupt data
      }
    }

    if (value != null) {
      data[ns.key] = value;
      count++;
    }
  }

  return { data, count, tenantId };
}

function restoreConfigData(backupData, selectedKeys) {
  const tenantId = getTenantId();
  let restored = 0;
  const errors = [];

  for (const ns of CONFIG_NAMESPACES) {
    if (!selectedKeys.includes(ns.key)) continue;
    if (backupData[ns.key] == null) continue;

    try {
      if (ns.type === 'tenant') {
        writeTenantJson(ns.key, backupData[ns.key]);
      } else if (ns.type === 'legacy' && ns.legacyKey) {
        window.localStorage.setItem(ns.legacyKey(tenantId), JSON.stringify(backupData[ns.key]));
      }
      restored++;
    } catch (err) {
      errors.push({ key: ns.key, error: err.message });
    }
  }

  return { restored, errors };
}

function validateBackupFile(parsed) {
  const issues = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, issues: ['Soubor neobsahuje platny JSON objekt.'] };
  }

  if (parsed.format !== 'modelpricer-config-backup') {
    issues.push('Chybejici nebo neplatny format identifikator.');
  }

  if (typeof parsed.version !== 'number' || parsed.version < 1) {
    issues.push('Chybejici nebo neplatna verze formatu.');
  }

  if (parsed.version > BACKUP_FORMAT_VERSION) {
    issues.push(`Verze zalohy (${parsed.version}) je novejsi nez podporovana (${BACKUP_FORMAT_VERSION}). Aktualizujte aplikaci.`);
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    issues.push('Chybejici datovy objekt "data".');
  }

  if (!parsed.tenantId || typeof parsed.tenantId !== 'string') {
    issues.push('Chybejici tenant ID v zaloze.');
  }

  return { valid: issues.length === 0, issues };
}

function getItemCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    // For config objects with known array fields
    if (Array.isArray(data.fees)) return data.fees.length;
    if (Array.isArray(data.materials)) return data.materials.length;
    if (Array.isArray(data.methods)) return data.methods.length;
    if (Array.isArray(data.tiers)) return data.tiers.length;
    if (Array.isArray(data.coupons)) return data.coupons.length;
    if (Array.isArray(data.columns)) return data.columns.length;
    return Object.keys(data).length;
  }
  return 0;
}

function formatDate(isoOrTimestamp) {
  try {
    const d = new Date(isoOrTimestamp);
    return d.toLocaleString('cs-CZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(isoOrTimestamp);
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CheckboxRow({ checked, onChange, label, icon, color, detail, disabled }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: 'var(--forge-radius-sm, 6px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 100ms',
        backgroundColor: checked ? 'rgba(0, 212, 170, 0.06)' : 'transparent',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = checked ? 'rgba(0, 212, 170, 0.1)' : 'var(--forge-bg-elevated)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = checked ? 'rgba(0, 212, 170, 0.06)' : 'transparent'; }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ accentColor: 'var(--forge-accent-primary)', width: 16, height: 16, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <Icon name={icon} size={15} style={{ color: color || 'var(--forge-text-muted)', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--forge-font-body)',
        fontSize: '13px',
        color: 'var(--forge-text-primary)',
        flex: 1,
      }}>
        {label}
      </span>
      {detail && (
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
        }}>
          {detail}
        </span>
      )}
    </label>
  );
}

function ProgressBar({ progress, label }) {
  return (
    <div style={{ marginTop: '12px' }}>
      {label && (
        <div style={{
          fontFamily: 'var(--forge-font-body)',
          fontSize: '12px',
          color: 'var(--forge-text-secondary)',
          marginBottom: '6px',
        }}>
          {label}
        </div>
      )}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: '100%',
          backgroundColor: 'var(--forge-accent-primary)',
          borderRadius: '3px',
          transition: 'width 200ms ease-out',
        }} />
      </div>
    </div>
  );
}

function StatusBanner({ type, children }) {
  const styles = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', color: 'var(--forge-success, #10B981)', icon: 'CheckCircle2' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', color: 'var(--forge-error, #EF4444)', icon: 'XCircle' },
    warning: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.25)', color: 'var(--forge-warning, #F97316)', icon: 'AlertTriangle' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', icon: 'Info' },
  };
  const s = styles[type] || styles.info;

  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 'var(--forge-radius-sm, 6px)',
      backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontFamily: 'var(--forge-font-body)',
      fontSize: '13px',
      color: s.color,
      lineHeight: 1.5,
    }}>
      <Icon name={s.icon} size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, color, disabled, variant = 'default' }) {
  const isGreen = variant === 'green';
  const isBlue = variant === 'blue';
  const isRed = variant === 'red';
  const isOutline = variant === 'outline';

  let bg = 'var(--forge-bg-elevated)';
  let fg = 'var(--forge-text-primary)';
  let borderColor = 'var(--forge-border-default)';

  if (isGreen) { bg = 'rgba(16, 185, 129, 0.15)'; fg = '#10B981'; borderColor = 'rgba(16, 185, 129, 0.3)'; }
  if (isBlue) { bg = 'rgba(59, 130, 246, 0.15)'; fg = '#3B82F6'; borderColor = 'rgba(59, 130, 246, 0.3)'; }
  if (isRed) { bg = 'rgba(239, 68, 68, 0.15)'; fg = '#EF4444'; borderColor = 'rgba(239, 68, 68, 0.3)'; }
  if (isOutline) { bg = 'transparent'; }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: 'var(--forge-radius-md, 8px)',
        border: `1px solid ${borderColor}`,
        backgroundColor: bg,
        color: fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--forge-font-heading)',
        fontSize: '13px',
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms ease-out',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = disabled ? '0.5' : '1'; }}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConfigBackupRestore() {
  const tenantId = getTenantId();

  // Export state
  const [exportSelected, setExportSelected] = useState(() => CONFIG_NAMESPACES.map(n => n.key));
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState(null); // { success, message }

  // Import state
  const [importFile, setImportFile] = useState(null); // parsed JSON
  const [importFileName, setImportFileName] = useState('');
  const [importValidation, setImportValidation] = useState(null); // { valid, issues }
  const [importSelected, setImportSelected] = useState([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dryRun, setDryRun] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  // Auto-backup state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackups, setAutoBackups] = useState([]);
  const [autoBackupLoading, setAutoBackupLoading] = useState(false);
  const autoBackupTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load auto-backup settings
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTO_BACKUP_LS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        setAutoBackupEnabled(settings.enabled === true);
      }
    } catch {
      // ignore
    }
    loadAutoBackups();
  }, []);

  // Auto-backup timer
  useEffect(() => {
    if (autoBackupTimerRef.current) {
      clearInterval(autoBackupTimerRef.current);
      autoBackupTimerRef.current = null;
    }

    if (autoBackupEnabled) {
      // Run immediately on enable, then every 24h
      runAutoBackup();
      autoBackupTimerRef.current = setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL_MS);
    }

    return () => {
      if (autoBackupTimerRef.current) clearInterval(autoBackupTimerRef.current);
    };
  }, [autoBackupEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAutoBackups = useCallback(async () => {
    try {
      const all = await idbGetAll();
      const sorted = all
        .filter(b => b.tenantId === getTenantId())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAutoBackups(sorted);
    } catch {
      setAutoBackups([]);
    }
  }, []);

  const runAutoBackup = useCallback(async () => {
    try {
      const allKeys = CONFIG_NAMESPACES.map(n => n.key);
      const { data, count } = collectConfigData(allKeys);
      if (count === 0) return;

      const backup = {
        id: `autobackup_${Date.now()}`,
        format: 'modelpricer-config-backup',
        version: BACKUP_FORMAT_VERSION,
        tenantId: getTenantId(),
        created_at: new Date().toISOString(),
        type: 'auto',
        configCount: count,
        data,
      };

      await idbPut(backup);

      // Prune old backups (keep MAX_AUTO_BACKUPS)
      const all = await idbGetAll();
      const mine = all
        .filter(b => b.tenantId === getTenantId() && b.type === 'auto')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      for (let i = MAX_AUTO_BACKUPS; i < mine.length; i++) {
        await idbDelete(mine[i].id);
      }

      await loadAutoBackups();
    } catch (err) {
      console.warn('[ConfigBackupRestore] Auto-backup failed:', err.message);
    }
  }, [loadAutoBackups]);

  // ---- EXPORT ----

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      // Simulate progress for UX
      setExportProgress(20);
      await new Promise(r => setTimeout(r, 100));

      const { data, count, tenantId: tid } = collectConfigData(exportSelected);
      setExportProgress(70);

      if (count === 0) {
        setExportResult({ success: false, message: 'Zadna data k exportu. Zkontrolujte vybrane konfigurace.' });
        setExporting(false);
        return;
      }

      const backup = {
        format: 'modelpricer-config-backup',
        version: BACKUP_FORMAT_VERSION,
        tenantId: tid,
        created_at: new Date().toISOString(),
        configCount: count,
        configs: exportSelected.filter(k => data[k] != null),
        data,
      };

      const json = JSON.stringify(backup, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `modelpricer-backup-${tid}-${dateStr}.json`;

      setExportProgress(90);
      downloadFile(json, filename, 'application/json');

      setExportProgress(100);
      setExportResult({
        success: true,
        message: `Exportovano ${count} konfiguracnich sekci (${formatFileSize(json.length)}).`,
      });
    } catch (err) {
      setExportResult({ success: false, message: `Chyba pri exportu: ${err.message}` });
    } finally {
      setExporting(false);
    }
  }, [exportSelected]);

  const toggleExportAll = useCallback((checked) => {
    setExportSelected(checked ? CONFIG_NAMESPACES.map(n => n.key) : []);
  }, []);

  const toggleExportKey = useCallback((key, checked) => {
    setExportSelected(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key)
    );
  }, []);

  // ---- IMPORT ----

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const validation = validateBackupFile(parsed);
        setImportFile(parsed);
        setImportValidation(validation);

        if (validation.valid && parsed.data) {
          // Pre-select all available configs
          const available = CONFIG_NAMESPACES
            .filter(ns => parsed.data[ns.key] != null)
            .map(ns => ns.key);
          setImportSelected(available);
        } else {
          setImportSelected([]);
        }

        setImportPreviewOpen(true);
      } catch {
        setImportFile(null);
        setImportValidation({ valid: false, issues: ['Soubor neobsahuje platny JSON.'] });
        setImportPreviewOpen(true);
      }
    };
    reader.readAsText(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(() => {
    if (dryRun) {
      setImportResult({
        success: true,
        message: `Suchy beh: ${importSelected.length} sekci by bylo obnoveno. Zadna data nebyla zmenena.`,
        dryRun: true,
      });
      setConfirmImportOpen(false);
      return;
    }
    setConfirmImportOpen(false);
    setImporting(true);

    // Small delay for UI
    setTimeout(() => {
      try {
        const { restored, errors } = restoreConfigData(importFile.data, importSelected);

        if (errors.length > 0) {
          setImportResult({
            success: false,
            message: `Obnoveno ${restored} sekci, ${errors.length} chyb: ${errors.map(e => e.key).join(', ')}`,
          });
        } else {
          setImportResult({
            success: true,
            message: `Uspesne obnoveno ${restored} konfiguracnich sekci. Obnovte stranku pro nacteni novych dat.`,
          });
        }
      } catch (err) {
        setImportResult({ success: false, message: `Chyba pri importu: ${err.message}` });
      } finally {
        setImporting(false);
        setImportPreviewOpen(false);
      }
    }, 200);
  }, [importFile, importSelected, dryRun]);

  const toggleImportKey = useCallback((key, checked) => {
    setImportSelected(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key)
    );
  }, []);

  // ---- AUTO-BACKUP ----

  const toggleAutoBackup = useCallback((enabled) => {
    setAutoBackupEnabled(enabled);
    try {
      window.localStorage.setItem(AUTO_BACKUP_LS_KEY, JSON.stringify({ enabled }));
    } catch {
      // ignore
    }
  }, []);

  const handleRestoreAutoBackup = useCallback((backup) => {
    setImportFile(backup);
    setImportFileName(`Auto-zaloha z ${formatDate(backup.created_at)}`);
    setImportValidation({ valid: true, issues: [] });

    const available = CONFIG_NAMESPACES
      .filter(ns => backup.data?.[ns.key] != null)
      .map(ns => ns.key);
    setImportSelected(available);
    setImportPreviewOpen(true);
  }, []);

  const handleDeleteAutoBackup = useCallback(async (id) => {
    try {
      await idbDelete(id);
      await loadAutoBackups();
    } catch {
      // ignore
    }
  }, [loadAutoBackups]);

  const handleRunAutoBackupNow = useCallback(async () => {
    setAutoBackupLoading(true);
    await runAutoBackup();
    setAutoBackupLoading(false);
  }, [runAutoBackup]);

  // ---- RENDER ----

  const allExportSelected = exportSelected.length === CONFIG_NAMESPACES.length;
  const someExportSelected = exportSelected.length > 0 && exportSelected.length < CONFIG_NAMESPACES.length;

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <Icon name="DatabaseBackup" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
        <h2 style={{
          fontFamily: 'var(--forge-font-heading)',
          fontWeight: 600,
          fontSize: '18px',
          color: 'var(--forge-text-primary)',
          margin: 0,
        }}>
          Zaloha konfigurace
        </h2>
      </div>

      {/* Info banner */}
      <StatusBanner type="info">
        Exportujte a importujte veskerou konfiguraci tenanta jako JSON soubor.
        Presety nejsou soucasti zalohy (ulozeny na serveru).
      </StatusBanner>

      {/* Main grid: Export | Import | Auto-backup */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '20px',
      }}>

        {/* ===== EXPORT CARD ===== */}
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="Download" size={18} style={{ color: '#10B981' }} />
            <span style={{
              fontFamily: 'var(--forge-font-heading)',
              fontWeight: 600,
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
            }}>
              Exportovat
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.5,
          }}>
            Stahnete vsechna nastaveni jako jeden JSON soubor. Zvolte ktere konfigurace zahrnout.
          </div>

          {/* Select all */}
          <div style={{ borderBottom: '1px solid var(--forge-border-default)', paddingBottom: '4px' }}>
            <CheckboxRow
              checked={allExportSelected}
              onChange={toggleExportAll}
              label={allExportSelected ? 'Odznacit vse' : 'Vybrat vse'}
              icon="CheckSquare"
              color="var(--forge-accent-primary)"
              detail={`${exportSelected.length}/${CONFIG_NAMESPACES.length}`}
            />
          </div>

          {/* Namespace checkboxes */}
          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {CONFIG_NAMESPACES.map(ns => (
              <CheckboxRow
                key={ns.key}
                checked={exportSelected.includes(ns.key)}
                onChange={(checked) => toggleExportKey(ns.key, checked)}
                label={ns.label}
                icon={ns.icon}
                color={ns.color}
              />
            ))}
          </div>

          {/* Export button */}
          <ActionButton
            onClick={handleExport}
            icon="Download"
            label={exporting ? 'Exportuji...' : 'Exportovat konfiguraci'}
            variant="green"
            disabled={exporting || exportSelected.length === 0}
          />

          {exporting && <ProgressBar progress={exportProgress} label="Pripravuji export..." />}

          {exportResult && (
            <StatusBanner type={exportResult.success ? 'success' : 'error'}>
              {exportResult.message}
            </StatusBanner>
          )}
        </div>

        {/* ===== IMPORT CARD ===== */}
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="Upload" size={18} style={{ color: '#3B82F6' }} />
            <span style={{
              fontFamily: 'var(--forge-font-heading)',
              fontWeight: 600,
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
            }}>
              Importovat
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.5,
          }}>
            Nahrajte JSON soubor ze zalohy. Pred aplikovanim muzete zkontrolovat obsah a vybrat ktere sekce obnovit.
          </div>

          <StatusBanner type="warning">
            Import prepise stavajici konfiguraci. Doporucujeme nejprve vytvorit zalohu aktualnich dat.
          </StatusBanner>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <ActionButton
            onClick={() => fileInputRef.current?.click()}
            icon="Upload"
            label="Vybrat soubor zalohy"
            variant="blue"
          />

          {importResult && (
            <StatusBanner type={importResult.success ? (importResult.dryRun ? 'info' : 'success') : 'error'}>
              {importResult.message}
            </StatusBanner>
          )}
        </div>

        {/* ===== AUTO-BACKUP CARD ===== */}
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="Clock" size={18} style={{ color: 'var(--forge-accent-primary)' }} />
              <span style={{
                fontFamily: 'var(--forge-font-heading)',
                fontWeight: 600,
                fontSize: '16px',
                color: 'var(--forge-text-primary)',
              }}>
                Auto-zaloha
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: autoBackupEnabled ? 'rgba(0, 212, 170, 0.12)' : 'rgba(122, 130, 145, 0.12)',
              color: autoBackupEnabled ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {autoBackupEnabled ? 'AKTIVNI' : 'NEAKTIVNI'}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.5,
          }}>
            Automaticky uklada zalohu do IndexedDB kazdych 24 hodin. Uchovava poslednich {MAX_AUTO_BACKUPS} zaloh.
          </div>

          {/* Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => toggleAutoBackup(e.target.checked)}
              style={{ accentColor: 'var(--forge-accent-primary)', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              color: 'var(--forge-text-primary)',
            }}>
              Povolit automatickou zalohu
            </span>
          </label>

          {/* Manual backup button */}
          <ActionButton
            onClick={handleRunAutoBackupNow}
            icon="Save"
            label={autoBackupLoading ? 'Ukladam...' : 'Zalohovat nyni'}
            variant="outline"
            disabled={autoBackupLoading}
          />

          {/* Auto-backup list */}
          {autoBackups.length > 0 ? (
            <div>
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                DOSTUPNE ZALOHY ({autoBackups.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {autoBackups.map(backup => (
                  <div
                    key={backup.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--forge-radius-sm, 6px)',
                      backgroundColor: 'var(--forge-bg-elevated)',
                      border: '1px solid var(--forge-border-default)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{
                        fontFamily: 'var(--forge-font-body)',
                        fontSize: '12px',
                        color: 'var(--forge-text-primary)',
                      }}>
                        {formatDate(backup.created_at)}
                      </span>
                      <span style={{
                        fontFamily: 'var(--forge-font-tech)',
                        fontSize: '10px',
                        color: 'var(--forge-text-muted)',
                      }}>
                        {backup.configCount || '?'} sekci
                        {backup.data ? ` | ${formatFileSize(JSON.stringify(backup.data).length)}` : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleRestoreAutoBackup(backup)}
                        title="Obnovit z teto zalohy"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--forge-radius-sm, 6px)',
                          border: '1px solid var(--forge-border-default)',
                          backgroundColor: 'transparent',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          transition: 'all 100ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Icon name="RotateCcw" size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAutoBackup(backup.id)}
                        title="Smazat zalohu"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--forge-radius-sm, 6px)',
                          border: '1px solid var(--forge-border-default)',
                          backgroundColor: 'transparent',
                          color: 'var(--forge-text-muted)',
                          cursor: 'pointer',
                          transition: 'all 100ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              color: 'var(--forge-text-muted)',
              textAlign: 'center',
              padding: '12px 0',
            }}>
              Zadne automaticke zalohy
            </div>
          )}
        </div>
      </div>

      {/* ===== IMPORT PREVIEW DIALOG ===== */}
      <ForgeDialog
        open={importPreviewOpen}
        onClose={() => setImportPreviewOpen(false)}
        title="Nahled importu"
        maxWidth="600px"
        footer={
          importValidation?.valid ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
                color: 'var(--forge-text-secondary)',
              }}>
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  style={{ accentColor: 'var(--forge-accent-primary)', cursor: 'pointer' }}
                />
                Suchy beh (bez zmen)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setImportPreviewOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--forge-radius-sm)',
                    border: '1px solid var(--forge-border-active)',
                    backgroundColor: 'transparent',
                    color: 'var(--forge-text-secondary)',
                    fontFamily: 'var(--forge-font-heading)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Zrusit
                </button>
                <button
                  onClick={() => setConfirmImportOpen(true)}
                  disabled={importSelected.length === 0 || importing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--forge-radius-sm)',
                    border: 'none',
                    backgroundColor: dryRun ? '#3B82F6' : 'var(--forge-accent-primary)',
                    color: dryRun ? '#fff' : '#08090C',
                    fontFamily: 'var(--forge-font-heading)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: importSelected.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: importSelected.length === 0 ? 0.5 : 1,
                    transition: 'all 150ms ease-out',
                  }}
                >
                  {importing ? 'Importuji...' : dryRun ? 'Spustit suchy beh' : `Importovat (${importSelected.length})`}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setImportPreviewOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--forge-radius-sm)',
                border: '1px solid var(--forge-border-active)',
                backgroundColor: 'transparent',
                color: 'var(--forge-text-secondary)',
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Zavrit
            </button>
          )
        }
      >
        {/* Validation errors */}
        {importValidation && !importValidation.valid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatusBanner type="error">
              Soubor neni platna zaloha ModelPricer.
            </StatusBanner>
            {importValidation.issues.map((issue, i) => (
              <div key={i} style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
                color: 'var(--forge-text-secondary)',
                padding: '4px 0',
                paddingLeft: '24px',
              }}>
                - {issue}
              </div>
            ))}
          </div>
        )}

        {/* Valid file preview */}
        {importValidation?.valid && importFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* File meta */}
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--forge-radius-sm, 6px)',
              backgroundColor: 'var(--forge-bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--forge-font-body)', fontSize: '12px', color: 'var(--forge-text-muted)' }}>
                  Soubor
                </span>
                <span style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-text-primary)' }}>
                  {importFileName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--forge-font-body)', fontSize: '12px', color: 'var(--forge-text-muted)' }}>
                  Datum zalohy
                </span>
                <span style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-text-primary)' }}>
                  {formatDate(importFile.created_at)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--forge-font-body)', fontSize: '12px', color: 'var(--forge-text-muted)' }}>
                  Tenant ID
                </span>
                <span style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-text-primary)' }}>
                  {importFile.tenantId}
                </span>
              </div>
              {importFile.tenantId !== tenantId && (
                <StatusBanner type="warning">
                  Tenant ID v zaloze ({importFile.tenantId}) se lisi od aktualniho ({tenantId}). Data budou importovana do aktualniho tenanta.
                </StatusBanner>
              )}
            </div>

            {/* Config selection */}
            <div>
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                OBSAH ZALOHY — VYBERTE SEKCE K OBNOVENI
              </div>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {CONFIG_NAMESPACES.map(ns => {
                  const hasData = importFile.data?.[ns.key] != null;
                  const itemCount = hasData ? getItemCount(importFile.data[ns.key]) : 0;
                  return (
                    <CheckboxRow
                      key={ns.key}
                      checked={importSelected.includes(ns.key)}
                      onChange={(checked) => toggleImportKey(ns.key, checked)}
                      label={ns.label}
                      icon={ns.icon}
                      color={ns.color}
                      disabled={!hasData}
                      detail={hasData ? `${itemCount} polozek` : 'Neni v zaloze'}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ForgeDialog>

      {/* ===== IMPORT CONFIRMATION DIALOG ===== */}
      <ForgeConfirmDialog
        open={confirmImportOpen}
        title={dryRun ? 'Spustit suchy beh?' : 'Importovat konfiguraci?'}
        message={
          dryRun
            ? `Suchy beh zkontroluje ${importSelected.length} konfiguracnich sekci bez provedeni zmen.`
            : `Tato akce prepise ${importSelected.length} konfiguracnich sekci. Stavajici data budou nahrazena daty ze zalohy. Tuto akci nelze vzit zpet.`
        }
        confirmLabel={dryRun ? 'Spustit' : 'Importovat'}
        cancelLabel="Zrusit"
        destructive={!dryRun}
        loading={importing}
        onConfirm={handleImportConfirm}
        onCancel={() => setConfirmImportOpen(false)}
      />
    </div>
  );
}
