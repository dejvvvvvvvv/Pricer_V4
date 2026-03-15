/**
 * ConfigBackupRestore — Full configuration backup & restore for tenant settings.
 *
 * Features:
 * - Export ALL tenant config as JSON (selective via checkboxes)
 * - Import config from JSON file with validation, preview, and selective restore
 * - Auto-backup to IndexedDB every 24h (opt-in, keeps last 5)
 * - Manual backup history stored in IndexedDB with quick restore
 * - Pre-change auto-backup option
 * - Two-column layout: Backup left, Restore/History right
 *
 * Uses storage helpers for reading/writing — direct localStorage access is limited
 * to legacy-format keys (branding, widgets, etc.) that writeTenantJson cannot produce.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import ForgeDialog from '../../../components/ui/forge/ForgeDialog';
import { ForgeConfirmDialog } from '../../../components/ui/forge/ForgeConfirmDialog';
import { getTenantId, readTenantJson, writeTenantJson } from '../../../utils/adminTenantStorage';
import { downloadFile } from '../../../utils/exportData';
import { safeJsonParse, stripDangerousKeys } from '../../../utils/sanitizeJson';

// ---------------------------------------------------------------------------
// Config namespace registry — all config namespaces to backup/restore
// ---------------------------------------------------------------------------

const CONFIG_NAMESPACES = [
  // Standard tenant-scoped (modelpricer:${tenantId}:${namespace})
  { key: 'pricing:v3',          label: 'Cenova konfigurace',    icon: 'Calculator',      color: '#8B5CF6', type: 'tenant',  group: 'pricing' },
  { key: 'fees:v3',             label: 'Poplatky',              icon: 'Receipt',         color: '#F59E0B', type: 'tenant',  group: 'pricing' },
  { key: 'shipping:v1',         label: 'Doprava',               icon: 'Truck',           color: '#14B8A6', type: 'tenant',  group: 'pricing' },
  { key: 'express:v1',          label: 'Expresni doruceni',     icon: 'Zap',             color: '#F97316', type: 'tenant',  group: 'pricing' },
  { key: 'coupons:v1',          label: 'Kupony a akce',         icon: 'Tag',             color: '#A855F7', type: 'tenant',  group: 'pricing' },
  { key: 'email:v1',            label: 'Email konfigurace',     icon: 'Mail',            color: '#0EA5E9', type: 'tenant',  group: 'communication' },
  { key: 'email-templates:v1',  label: 'Email sablony',         icon: 'FileText',        color: '#0EA5E9', type: 'tenant',  group: 'communication' },
  { key: 'form:v1',             label: 'Formular objednavky',   icon: 'ClipboardList',   color: '#6366F1', type: 'tenant',  group: 'orders' },
  { key: 'kanban:v1',           label: 'Kanban nastaveni',      icon: 'Columns',         color: '#78716C', type: 'tenant',  group: 'orders' },
  { key: 'payment:v1',          label: 'Platby',                icon: 'CreditCard',      color: '#22C55E', type: 'tenant',  group: 'pricing' },
  { key: 'dashboard:v2',        label: 'Dashboard layout',      icon: 'LayoutDashboard', color: '#22C55E', type: 'tenant',  group: 'ui' },
  { key: 'company:v1',          label: 'Firemni udaje',         icon: 'Building2',       color: '#3B82F6', type: 'tenant',  group: 'branding' },
  { key: 'notifications',       label: 'Notifikace',            icon: 'Bell',            color: '#EF4444', type: 'tenant',  group: 'communication' },
  { key: 'webhooks:v1',         label: 'Webhooky',              icon: 'Webhook',         color: '#8B5CF6', type: 'tenant',  group: 'communication' },
  { key: 'team:v1',             label: 'Tym a pristupy',        icon: 'Users',           color: '#0EA5E9', type: 'tenant',  group: 'branding' },

  // Legacy-keyed (modelpricer_branding__${tenantId}, etc.)
  { key: 'branding',            label: 'Branding',              icon: 'Palette',         color: '#EC4899', type: 'legacy',  group: 'branding', legacyKey: (tid) => `modelpricer_branding__${tid}` },
  { key: 'widgets',             label: 'Widget instance',       icon: 'Code2',           color: '#06B6D4', type: 'legacy',  group: 'branding', legacyKey: (tid) => `modelpricer_widgets__${tid}` },
  { key: 'plan_features',       label: 'Plan / funkce',         icon: 'Crown',           color: '#D946EF', type: 'legacy',  group: 'branding', legacyKey: (tid) => `modelpricer_plan_features__${tid}` },
  { key: 'ecommerce',           label: 'E-commerce',            icon: 'Plug',            color: '#6366F1', type: 'legacy',  group: 'orders',   legacyKey: (tid) => `modelpricer_ecommerce__${tid}` },
];

const NAMESPACE_GROUPS = {
  pricing: { label: 'Ceny a poplatky', icon: 'Calculator' },
  branding: { label: 'Branding a nastaveni', icon: 'Palette' },
  orders: { label: 'Objednavky a e-commerce', icon: 'ShoppingCart' },
  communication: { label: 'Komunikace', icon: 'Mail' },
  ui: { label: 'Rozhrani', icon: 'LayoutDashboard' },
};

const BACKUP_FORMAT_VERSION = 2;
const IDB_DB_NAME = 'modelpricer_autobackup';
const IDB_STORE_NAME = 'backups';
const IDB_VERSION = 1;
const MAX_AUTO_BACKUPS = 5;
const MAX_MANUAL_BACKUPS = 10;
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
function getAutoBackupKey() {
  return `modelpricer:${getTenantId()}:auto_backup`;
}

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
        // Sanitize URL fields before writing to prevent stored XSS via javascript:/data: schemes.
        const nsData = backupData[ns.key];
        if (nsData && typeof nsData === 'object' && nsData.logoUrl &&
            /^\s*(javascript|data|vbscript)\s*:/i.test(String(nsData.logoUrl).trim())) {
          nsData.logoUrl = '';
        }
        writeTenantJson(ns.key, nsData);
      } else if (ns.type === 'legacy' && ns.legacyKey) {
        // Legacy keys use a different format (modelpricer_<ns>__<tid>) that writeTenantJson
        // cannot produce. Direct localStorage write is required for backwards compatibility
        // with code that reads these old-format keys (branding, widgets, plan_features, ecommerce).
        const sanitized = stripDangerousKeys(backupData[ns.key]);
        window.localStorage.setItem(ns.legacyKey(tenantId), JSON.stringify(sanitized));
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
    if (Array.isArray(data.fees)) return data.fees.length;
    if (Array.isArray(data.materials)) return data.materials.length;
    if (Array.isArray(data.methods)) return data.methods.length;
    if (Array.isArray(data.tiers)) return data.tiers.length;
    if (Array.isArray(data.coupons)) return data.coupons.length;
    if (Array.isArray(data.columns)) return data.columns.length;
    if (Array.isArray(data.members)) return data.members.length;
    if (Array.isArray(data.templates)) return data.templates.length;
    if (Array.isArray(data.hooks)) return data.hooks.length;
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

function formatRelativeTime(isoDate) {
  try {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Prave ted';
    if (diffMin < 60) return `Pred ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Pred ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    return `Pred ${diffDay} dny`;
  } catch {
    return '';
  }
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
        padding: '6px 10px',
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
      <Icon name={icon} size={14} style={{ color: color || 'var(--forge-text-muted)', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--forge-font-body)',
        fontSize: '12.5px',
        color: 'var(--forge-text-primary)',
        flex: 1,
      }}>
        {label}
      </span>
      {detail && (
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
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
    <div style={{ marginTop: '8px' }}>
      {label && (
        <div style={{
          fontFamily: 'var(--forge-font-body)',
          fontSize: '11px',
          color: 'var(--forge-text-secondary)',
          marginBottom: '4px',
        }}>
          {label}
        </div>
      )}
      <div style={{
        width: '100%',
        height: '5px',
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
      padding: '8px 12px',
      borderRadius: 'var(--forge-radius-sm, 6px)',
      backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontFamily: 'var(--forge-font-body)',
      fontSize: '12px',
      color: s.color,
      lineHeight: 1.5,
    }}>
      <Icon name={s.icon} size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, color, disabled, variant = 'default', size = 'default', style: extraStyle }) {
  const isGreen = variant === 'green';
  const isBlue = variant === 'blue';
  const isRed = variant === 'red';
  const isOutline = variant === 'outline';
  const isSmall = size === 'small';

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
        gap: isSmall ? '6px' : '8px',
        padding: isSmall ? '6px 12px' : '9px 16px',
        borderRadius: 'var(--forge-radius-md, 8px)',
        border: `1px solid ${borderColor}`,
        backgroundColor: bg,
        color: fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--forge-font-heading)',
        fontSize: isSmall ? '11px' : '12.5px',
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms ease-out',
        ...extraStyle,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = disabled ? '0.5' : '1'; }}
    >
      <Icon name={icon} size={isSmall ? 13 : 15} />
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--forge-font-tech)',
      fontSize: '10px',
      color: 'var(--forge-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '6px',
      marginTop: '4px',
    }}>
      {children}
    </div>
  );
}

function BackupHistoryItem({ backup, onRestore, onDelete, onDownload }) {
  const isAuto = backup.type === 'auto';
  const sizeBytes = backup.data ? JSON.stringify(backup.data).length : 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      borderRadius: 'var(--forge-radius-sm, 6px)',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid var(--forge-border-default)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <Icon
          name={isAuto ? 'Clock' : 'Save'}
          size={13}
          style={{ color: isAuto ? 'var(--forge-text-muted)' : 'var(--forge-accent-primary)', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '12px',
              color: 'var(--forge-text-primary)',
              whiteSpace: 'nowrap',
            }}>
              {formatDate(backup.created_at)}
            </span>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '9px',
              fontWeight: 600,
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: isAuto ? 'rgba(122, 130, 145, 0.12)' : 'rgba(0, 212, 170, 0.12)',
              color: isAuto ? 'var(--forge-text-muted)' : 'var(--forge-accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              flexShrink: 0,
            }}>
              {isAuto ? 'AUTO' : 'MANUALNI'}
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '10px',
            color: 'var(--forge-text-muted)',
          }}>
            {backup.configCount || '?'} sekci
            {sizeBytes > 0 ? ` | ${formatFileSize(sizeBytes)}` : ''}
            {backup.created_at ? ` | ${formatRelativeTime(backup.created_at)}` : ''}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {onDownload && (
          <IconButton
            icon="Download"
            title="Stahnout jako soubor"
            color="#10B981"
            hoverBg="rgba(16, 185, 129, 0.1)"
            onClick={() => onDownload(backup)}
          />
        )}
        <IconButton
          icon="RotateCcw"
          title="Obnovit z teto zalohy"
          color="#3B82F6"
          hoverBg="rgba(59, 130, 246, 0.1)"
          onClick={() => onRestore(backup)}
        />
        <IconButton
          icon="Trash2"
          title="Smazat zalohu"
          color="var(--forge-text-muted)"
          hoverBg="rgba(239, 68, 68, 0.1)"
          hoverColor="#EF4444"
          onClick={() => onDelete(backup.id)}
        />
      </div>
    </div>
  );
}

function IconButton({ icon, title, color, hoverBg, hoverColor, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        borderRadius: 'var(--forge-radius-sm, 6px)',
        border: '1px solid var(--forge-border-default)',
        backgroundColor: 'transparent',
        color: color,
        cursor: 'pointer',
        transition: 'all 100ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg || 'var(--forge-bg-elevated)';
        if (hoverColor) e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = color;
      }}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

function CardWrapper({ children, style: extraStyle }) {
  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-lg, 12px)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, label, iconColor, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name={icon} size={17} style={{ color: iconColor || 'var(--forge-accent-primary)' }} />
        <span style={{
          fontFamily: 'var(--forge-font-heading)',
          fontWeight: 600,
          fontSize: '15px',
          color: 'var(--forge-text-primary)',
        }}>
          {label}
        </span>
      </div>
      {badge}
    </div>
  );
}

function CardDesc({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--forge-font-body)',
      fontSize: '12px',
      color: 'var(--forge-text-secondary)',
      lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported helper: trigger auto-backup before major changes (import from other pages)
// ---------------------------------------------------------------------------

export async function triggerPreChangeBackup() {
  try {
    const raw = window.localStorage.getItem(getAutoBackupKey());
    if (!raw) return false;
    const settings = JSON.parse(raw);
    if (!settings.preChangeBackup) return false;

    const allKeys = CONFIG_NAMESPACES.map(n => n.key);
    const { data, count } = collectConfigData(allKeys);
    if (count === 0) return false;

    const backup = {
      id: `prechange_${Date.now()}`,
      format: 'modelpricer-config-backup',
      version: BACKUP_FORMAT_VERSION,
      tenantId: getTenantId(),
      created_at: new Date().toISOString(),
      type: 'auto',
      trigger: 'pre-change',
      configCount: count,
      data,
    };

    await idbPut(backup);

    // Prune old auto-backups
    const all = await idbGetAll();
    const autoBackups = all
      .filter(b => b.tenantId === getTenantId() && b.type === 'auto')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    for (let i = MAX_AUTO_BACKUPS; i < autoBackups.length; i++) {
      await idbDelete(autoBackups[i].id);
    }

    return true;
  } catch {
    return false;
  }
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
  const [exportResult, setExportResult] = useState(null);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [importValidation, setImportValidation] = useState(null);
  const [importSelected, setImportSelected] = useState([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dryRun, setDryRun] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  // Backup history state (IndexedDB — both auto and manual)
  const [allBackups, setAllBackups] = useState([]);
  const [historyTab, setHistoryTab] = useState('all'); // 'all' | 'manual' | 'auto'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Auto-backup state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [preChangeBackup, setPreChangeBackup] = useState(false);
  const [autoBackupLoading, setAutoBackupLoading] = useState(false);
  const autoBackupTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load settings + history on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getAutoBackupKey());
      if (raw) {
        const settings = JSON.parse(raw);
        setAutoBackupEnabled(settings.enabled === true);
        setPreChangeBackup(settings.preChangeBackup === true);
      }
    } catch {
      // ignore
    }
    loadAllBackups();
  }, []);

  // Auto-backup timer
  useEffect(() => {
    if (autoBackupTimerRef.current) {
      clearInterval(autoBackupTimerRef.current);
      autoBackupTimerRef.current = null;
    }

    if (autoBackupEnabled) {
      runAutoBackup();
      autoBackupTimerRef.current = setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL_MS);
    }

    return () => {
      if (autoBackupTimerRef.current) clearInterval(autoBackupTimerRef.current);
    };
  }, [autoBackupEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllBackups = useCallback(async () => {
    try {
      const all = await idbGetAll();
      const sorted = all
        .filter(b => b.tenantId === getTenantId())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllBackups(sorted);
    } catch {
      setAllBackups([]);
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

      // Prune old auto-backups (keep MAX_AUTO_BACKUPS)
      const all = await idbGetAll();
      const mine = all
        .filter(b => b.tenantId === getTenantId() && b.type === 'auto')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      for (let i = MAX_AUTO_BACKUPS; i < mine.length; i++) {
        await idbDelete(mine[i].id);
      }

      await loadAllBackups();
    } catch (err) {
      console.warn('[ConfigBackupRestore] Auto-backup failed:', err.message);
    }
  }, [loadAllBackups]);

  // ---- EXPORT ----

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      setExportProgress(15);
      await new Promise(r => setTimeout(r, 80));

      const { data, count, tenantId: tid } = collectConfigData(exportSelected);
      setExportProgress(60);

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

      setExportProgress(80);

      // Save manual backup to history in IndexedDB
      const historyRecord = {
        ...backup,
        id: `manual_${Date.now()}`,
        type: 'manual',
      };
      await idbPut(historyRecord);

      // Prune old manual backups
      const all = await idbGetAll();
      const manuals = all
        .filter(b => b.tenantId === getTenantId() && b.type === 'manual')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      for (let i = MAX_MANUAL_BACKUPS; i < manuals.length; i++) {
        await idbDelete(manuals[i].id);
      }

      await loadAllBackups();

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
  }, [exportSelected, loadAllBackups]);

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
        const parsed = safeJsonParse(ev.target.result);
        const validation = validateBackupFile(parsed);
        setImportFile(parsed);
        setImportValidation(validation);

        if (validation.valid && parsed.data) {
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
    e.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(async () => {
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

    // Auto-backup before restore if enabled
    if (preChangeBackup) {
      try {
        await triggerPreChangeBackup();
      } catch {
        // continue even if pre-change backup fails
      }
    }

    setTimeout(async () => {
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
        await loadAllBackups();
      }
    }, 150);
  }, [importFile, importSelected, dryRun, preChangeBackup, loadAllBackups]);

  const toggleImportKey = useCallback((key, checked) => {
    setImportSelected(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key)
    );
  }, []);

  // ---- AUTO-BACKUP SETTINGS ----

  const saveAutoBackupSettings = useCallback((settings) => {
    try {
      window.localStorage.setItem(getAutoBackupKey(), JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, []);

  const toggleAutoBackup = useCallback((enabled) => {
    setAutoBackupEnabled(enabled);
    saveAutoBackupSettings({ enabled, preChangeBackup });
  }, [preChangeBackup, saveAutoBackupSettings]);

  const togglePreChangeBackup = useCallback((enabled) => {
    setPreChangeBackup(enabled);
    saveAutoBackupSettings({ enabled: autoBackupEnabled, preChangeBackup: enabled });
  }, [autoBackupEnabled, saveAutoBackupSettings]);

  // ---- BACKUP HISTORY ----

  const handleRestoreFromHistory = useCallback((backup) => {
    setImportFile(backup);
    setImportFileName(backup.type === 'auto'
      ? `Auto-zaloha z ${formatDate(backup.created_at)}`
      : `Manualni zaloha z ${formatDate(backup.created_at)}`
    );
    setImportValidation({ valid: true, issues: [] });

    const available = CONFIG_NAMESPACES
      .filter(ns => backup.data?.[ns.key] != null)
      .map(ns => ns.key);
    setImportSelected(available);
    setImportPreviewOpen(true);
  }, []);

  const handleDeleteBackup = useCallback(async (id) => {
    try {
      await idbDelete(id);
      await loadAllBackups();
      setDeleteConfirmId(null);
    } catch {
      // ignore
    }
  }, [loadAllBackups]);

  const handleDownloadFromHistory = useCallback((backup) => {
    const exportData = {
      format: backup.format || 'modelpricer-config-backup',
      version: backup.version || BACKUP_FORMAT_VERSION,
      tenantId: backup.tenantId,
      created_at: backup.created_at,
      configCount: backup.configCount,
      configs: Object.keys(backup.data || {}),
      data: backup.data,
    };
    const json = JSON.stringify(exportData, null, 2);
    const dateStr = new Date(backup.created_at).toISOString().slice(0, 10);
    const filename = `modelpricer-backup-${backup.tenantId}-${dateStr}.json`;
    downloadFile(json, filename, 'application/json');
  }, []);

  const handleRunAutoBackupNow = useCallback(async () => {
    setAutoBackupLoading(true);
    await runAutoBackup();
    setAutoBackupLoading(false);
  }, [runAutoBackup]);

  // Filtered backup list
  const filteredBackups = useMemo(() => {
    if (historyTab === 'manual') return allBackups.filter(b => b.type === 'manual');
    if (historyTab === 'auto') return allBackups.filter(b => b.type === 'auto');
    return allBackups;
  }, [allBackups, historyTab]);

  const autoCount = useMemo(() => allBackups.filter(b => b.type === 'auto').length, [allBackups]);
  const manualCount = useMemo(() => allBackups.filter(b => b.type === 'manual').length, [allBackups]);

  // ---- Grouped namespaces for export ----
  const groupedNamespaces = useMemo(() => {
    const groups = {};
    for (const ns of CONFIG_NAMESPACES) {
      const g = ns.group || 'other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(ns);
    }
    return groups;
  }, []);

  const allExportSelected = exportSelected.length === CONFIG_NAMESPACES.length;

  // ---- RENDER ----

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
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

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '16px',
        alignItems: 'start',
      }}>
        {/* ===== LEFT COLUMN: Backup options ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* EXPORT CARD */}
          <CardWrapper>
            <CardHeader icon="Download" label="Exportovat" iconColor="#10B981" />
            <CardDesc>
              Stahnete vsechna nastaveni jako jeden JSON soubor. Zvolte ktere konfigurace zahrnout.
            </CardDesc>

            {/* Select all */}
            <div style={{ borderBottom: '1px solid var(--forge-border-default)', paddingBottom: '2px' }}>
              <CheckboxRow
                checked={allExportSelected}
                onChange={toggleExportAll}
                label={allExportSelected ? 'Odznacit vse' : 'Vybrat vse'}
                icon="CheckSquare"
                color="var(--forge-accent-primary)"
                detail={`${exportSelected.length}/${CONFIG_NAMESPACES.length}`}
              />
            </div>

            {/* Grouped namespace checkboxes */}
            <div style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {Object.entries(groupedNamespaces).map(([groupKey, namespaces]) => {
                const groupMeta = NAMESPACE_GROUPS[groupKey] || { label: groupKey, icon: 'Folder' };
                return (
                  <div key={groupKey}>
                    <div style={{
                      fontFamily: 'var(--forge-font-tech)',
                      fontSize: '9px',
                      fontWeight: 600,
                      color: 'var(--forge-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '6px 10px 2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <Icon name={groupMeta.icon} size={10} style={{ color: 'var(--forge-text-muted)' }} />
                      {groupMeta.label}
                    </div>
                    {namespaces.map(ns => (
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
                );
              })}
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
          </CardWrapper>

          {/* AUTO-BACKUP SETTINGS CARD */}
          <CardWrapper>
            <CardHeader
              icon="Clock"
              label="Automaticka zaloha"
              iconColor="var(--forge-accent-primary)"
              badge={
                <span style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: autoBackupEnabled ? 'rgba(0, 212, 170, 0.12)' : 'rgba(122, 130, 145, 0.12)',
                  color: autoBackupEnabled ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {autoBackupEnabled ? 'AKTIVNI' : 'NEAKTIVNI'}
                </span>
              }
            />
            <CardDesc>
              Automaticky uklada zalohu do IndexedDB kazdych 24 hodin. Uchovava poslednich {MAX_AUTO_BACKUPS} zaloh.
            </CardDesc>

            {/* Toggle auto-backup */}
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
                fontSize: '12.5px',
                color: 'var(--forge-text-primary)',
              }}>
                Povolit automatickou zalohu (24h)
              </span>
            </label>

            {/* Toggle pre-change backup */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={preChangeBackup}
                onChange={(e) => togglePreChangeBackup(e.target.checked)}
                style={{ accentColor: 'var(--forge-accent-primary)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12.5px',
                color: 'var(--forge-text-primary)',
              }}>
                Zalohovat pred importem (ochrana proti prepisu)
              </span>
            </label>

            {/* Manual backup button */}
            <ActionButton
              onClick={handleRunAutoBackupNow}
              icon="Save"
              label={autoBackupLoading ? 'Ukladam...' : 'Zalohovat nyni'}
              variant="outline"
              disabled={autoBackupLoading}
              size="small"
            />
          </CardWrapper>
        </div>

        {/* ===== RIGHT COLUMN: Restore & History ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* IMPORT CARD */}
          <CardWrapper>
            <CardHeader icon="Upload" label="Importovat" iconColor="#3B82F6" />
            <CardDesc>
              Nahrajte JSON soubor ze zalohy. Pred aplikovanim muzete zkontrolovat obsah a vybrat ktere sekce obnovit.
            </CardDesc>

            <StatusBanner type="warning">
              Import prepise stavajici konfiguraci. Doporucujeme nejprve vytvorit zalohu.
            </StatusBanner>

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label="Vybrat soubor zalohy pro import"
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
          </CardWrapper>

          {/* BACKUP HISTORY CARD */}
          <CardWrapper>
            <CardHeader
              icon="History"
              label="Historie zaloh"
              iconColor="var(--forge-accent-primary)"
              badge={
                allBackups.length > 0 && (
                  <span style={{
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '10px',
                    color: 'var(--forge-text-muted)',
                  }}>
                    {allBackups.length} celkem
                  </span>
                )
              }
            />

            {/* Tab filters */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { key: 'all', label: `Vse (${allBackups.length})` },
                { key: 'manual', label: `Manualni (${manualCount})` },
                { key: 'auto', label: `Auto (${autoCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setHistoryTab(tab.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--forge-radius-sm, 6px)',
                    border: '1px solid',
                    borderColor: historyTab === tab.key ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
                    backgroundColor: historyTab === tab.key ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                    color: historyTab === tab.key ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 100ms',
                    letterSpacing: '0.02em',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Backup list */}
            {filteredBackups.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                maxHeight: '340px',
                overflowY: 'auto',
              }}>
                {filteredBackups.map(backup => (
                  <BackupHistoryItem
                    key={backup.id}
                    backup={backup}
                    onRestore={handleRestoreFromHistory}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onDownload={handleDownloadFromHistory}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12.5px',
                color: 'var(--forge-text-muted)',
                textAlign: 'center',
                padding: '20px 0',
              }}>
                {historyTab === 'manual' ? 'Zadne manualni zalohy' :
                 historyTab === 'auto' ? 'Zadne automaticke zalohy' :
                 'Zadne zalohy v historii'}
              </div>
            )}
          </CardWrapper>
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
                fontSize: '12.5px',
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
                    fontSize: '12.5px',
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
                    fontSize: '12.5px',
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
                fontSize: '12.5px',
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
                fontSize: '12.5px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* File meta */}
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--forge-radius-sm, 6px)',
              backgroundColor: 'var(--forge-bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}>
              {[
                { label: 'Soubor', value: importFileName },
                { label: 'Datum zalohy', value: formatDate(importFile.created_at) },
                { label: 'Tenant ID', value: importFile.tenantId },
                { label: 'Verze formatu', value: `v${importFile.version || 1}` },
                { label: 'Pocet sekci', value: `${importFile.configCount || Object.keys(importFile.data || {}).length}` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--forge-font-body)', fontSize: '12px', color: 'var(--forge-text-muted)' }}>
                    {row.label}
                  </span>
                  <span style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-text-primary)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
              {importFile.tenantId !== tenantId && (
                <StatusBanner type="warning">
                  Tenant ID v zaloze ({importFile.tenantId}) se lisi od aktualniho ({tenantId}). Data budou importovana do aktualniho tenanta.
                </StatusBanner>
              )}
            </div>

            {/* Config selection */}
            <div>
              <SectionLabel>OBSAH ZALOHY — VYBERTE SEKCE K OBNOVENI</SectionLabel>

              {/* Select all for import */}
              <div style={{ borderBottom: '1px solid var(--forge-border-default)', paddingBottom: '2px', marginBottom: '2px' }}>
                <CheckboxRow
                  checked={importSelected.length === CONFIG_NAMESPACES.filter(ns => importFile.data?.[ns.key] != null).length}
                  onChange={(checked) => {
                    if (checked) {
                      const available = CONFIG_NAMESPACES
                        .filter(ns => importFile.data?.[ns.key] != null)
                        .map(ns => ns.key);
                      setImportSelected(available);
                    } else {
                      setImportSelected([]);
                    }
                  }}
                  label={importSelected.length === CONFIG_NAMESPACES.filter(ns => importFile.data?.[ns.key] != null).length ? 'Odznacit vse' : 'Vybrat vse dostupne'}
                  icon="CheckSquare"
                  color="var(--forge-accent-primary)"
                  detail={`${importSelected.length}/${CONFIG_NAMESPACES.filter(ns => importFile.data?.[ns.key] != null).length}`}
                />
              </div>

              <div style={{
                maxHeight: '260px',
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
            : `Tato akce prepise ${importSelected.length} konfiguracnich sekci. Stavajici data budou nahrazena daty ze zalohy.${preChangeBackup ? ' Pred importem bude automaticky vytvorena zaloha.' : ' Tuto akci nelze vzit zpet.'}`
        }
        confirmLabel={dryRun ? 'Spustit' : 'Importovat'}
        cancelLabel="Zrusit"
        destructive={!dryRun}
        loading={importing}
        onConfirm={handleImportConfirm}
        onCancel={() => setConfirmImportOpen(false)}
      />

      {/* ===== DELETE BACKUP CONFIRMATION ===== */}
      <ForgeConfirmDialog
        open={deleteConfirmId != null}
        title="Smazat zalohu?"
        message="Tato zaloha bude trvale smazana z historie. Tuto akci nelze vzit zpet."
        confirmLabel="Smazat"
        cancelLabel="Zrusit"
        destructive
        onConfirm={() => handleDeleteBackup(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
