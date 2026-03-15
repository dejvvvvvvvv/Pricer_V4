/**
 * AdminActivityLog — timeline-style activity log for admin panel.
 *
 * Features:
 * - Statistics cards (today count, most active user, most common action, trend)
 * - Timeline view (newest first) with action-type badges (CREATE/UPDATE/DELETE/LOGIN/EXPORT)
 * - Relative timestamps with full date on hover
 * - Filter by action type (checkboxes), date range, actor, search text
 * - Pagination (25 per page) with page numbers
 * - Export as CSV and JSON
 * - Auto-refresh toggle (30s interval)
 * - New entries highlighted with animation
 * - Clear old entries (30+ days)
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import Icon from '../../components/AppIcon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getActivities,
  clearOldActivities,
  VALID_CATEGORIES,
} from '../../utils/adminActivityLog';
import { exportCSV, exportJSON } from '../../utils/exportData';
import { formatRelativeTime } from '../../utils/formatters';

const PAGE_SIZE = 25;
const AUTO_REFRESH_INTERVAL = 30000;

/* ───────────────────────── Action type config ───────────────────────── */

const ACTION_TYPE_META = {
  CREATE: { label: 'CREATE', color: '#10B981', icon: 'Plus' },
  UPDATE: { label: 'UPDATE', color: '#3B82F6', icon: 'Pencil' },
  DELETE: { label: 'DELETE', color: '#EF4444', icon: 'Trash2' },
  LOGIN:  { label: 'LOGIN',  color: '#7A8291', icon: 'LogIn' },
  EXPORT: { label: 'EXPORT', color: '#8B5CF6', icon: 'Download' },
};

/** Category config (from storage) mapped to visual */
const CATEGORY_META = {
  order:   { label: 'Objednavky',  color: '#3B82F6', icon: 'ShoppingCart' },
  pricing: { label: 'Ceny',        color: '#8B5CF6', icon: 'Calculator' },
  config:  { label: 'Konfigurace', color: '#F59E0B', icon: 'Settings2' },
  auth:    { label: 'Autentizace', color: '#EF4444', icon: 'Shield' },
  export:  { label: 'Export',      color: '#10B981', icon: 'Download' },
  slicing: { label: 'Slicing',     color: '#06B6D4', icon: 'Layers' },
  system:  { label: 'System',      color: '#7A8291', icon: 'Monitor' },
};

/* ───────────────────────── Helpers ───────────────────────── */

/**
 * Infer action type from activity entry.
 * Looks at the action string for keywords.
 */
function inferActionType(act) {
  const a = (act.action || '').toLowerCase();
  const cat = act.category || '';
  if (cat === 'auth') return 'LOGIN';
  if (cat === 'export') return 'EXPORT';
  if (a.includes('vytvor') || a.includes('create') || a.includes('pridat') || a.includes('novy') || a.includes('add')) return 'CREATE';
  if (a.includes('smaz') || a.includes('delete') || a.includes('odstran') || a.includes('remove') || a.includes('vymaz')) return 'DELETE';
  return 'UPDATE';
}

function formatFullTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}


function parseDateInput(val, endOfDay = false) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function getDateGroup(ts) {
  const now = new Date();
  const d = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (entryDay.getTime() === today.getTime()) return 'Dnes';
  if (entryDay.getTime() === yesterday.getTime()) return 'Vcera';
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ───────────────────────── Statistics ───────────────────────── */

function computeStats(allActivities) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const todayActivities = allActivities.filter((a) => a.timestamp >= todayStart);
  const yesterdayActivities = allActivities.filter(
    (a) => a.timestamp >= yesterdayStart && a.timestamp < todayStart
  );

  // Most active user
  const userCounts = {};
  for (const a of allActivities) {
    const u = a.user || 'Neznamy';
    userCounts[u] = (userCounts[u] || 0) + 1;
  }
  let mostActiveUser = '—';
  let maxUserCount = 0;
  for (const [user, count] of Object.entries(userCounts)) {
    if (count > maxUserCount) {
      mostActiveUser = user;
      maxUserCount = count;
    }
  }

  // Most common action type
  const typeCounts = {};
  for (const a of allActivities) {
    const t = inferActionType(a);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
  let mostCommonType = '—';
  let maxTypeCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxTypeCount) {
      mostCommonType = type;
      maxTypeCount = count;
    }
  }

  // Trend
  const todayCount = todayActivities.length;
  const yesterdayCount = yesterdayActivities.length;
  let trendDirection = 'same';
  let trendPercent = 0;
  if (yesterdayCount > 0) {
    const diff = todayCount - yesterdayCount;
    trendPercent = Math.abs(Math.round((diff / yesterdayCount) * 100));
    trendDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
  } else if (todayCount > 0) {
    trendDirection = 'up';
    trendPercent = 100;
  }

  return {
    todayCount,
    mostActiveUser,
    mostActiveUserCount: maxUserCount,
    mostCommonType,
    mostCommonTypeCount: maxTypeCount,
    trendDirection,
    trendPercent,
  };
}

/* ───────────────────────── Pagination helper ───────────────────────── */

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages = new Set([0, total - 1]);
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }
  return result;
}

/* ───────────────────────── Component ───────────────────────── */

export default function AdminActivityLog() {
  useDocumentTitle('Admin - Activity Log');
  const { t } = useLanguage();

  // Filters
  const [activeActionTypes, setActiveActionTypes] = useState(
    () => new Set(Object.keys(ACTION_TYPE_META))
  );
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);

  // UI state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearResult, setClearResult] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showActionTypeFilter, setShowActionTypeFilter] = useState(false);
  const prevIdsRef = useRef(new Set());
  const [newIds, setNewIds] = useState(new Set());

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Build storage filters
  const storageFilters = useMemo(() => ({
    search: search.trim() || undefined,
    dateFrom: parseDateInput(dateFrom),
    dateTo: parseDateInput(dateTo, true),
  }), [search, dateFrom, dateTo]);

  // Get all activities (category filter is handled below after action type inference)
  const allActivities = useMemo(() => {
    return getActivities(storageFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageFilters, refreshKey]);

  // Apply action type and actor filters
  const activities = useMemo(() => {
    let result = allActivities;

    // Action type filter
    if (activeActionTypes.size < Object.keys(ACTION_TYPE_META).length) {
      result = result.filter((a) => activeActionTypes.has(inferActionType(a)));
    }

    // Actor filter
    if (actorFilter.trim()) {
      const q = actorFilter.trim().toLowerCase();
      result = result.filter((a) => (a.user || '').toLowerCase().includes(q));
    }

    return result;
  }, [allActivities, activeActionTypes, actorFilter]);

  // Track new entries for highlight animation
  const newIdsTimerRef = useRef(null);
  useEffect(() => {
    return () => clearTimeout(newIdsTimerRef.current);
  }, []);

  useEffect(() => {
    const currentIds = new Set(activities.map((a) => a.id));
    if (prevIdsRef.current.size > 0) {
      const fresh = new Set();
      for (const id of currentIds) {
        if (!prevIdsRef.current.has(id)) {
          fresh.add(id);
        }
      }
      if (fresh.size > 0) {
        setNewIds(fresh);
        clearTimeout(newIdsTimerRef.current);
        newIdsTimerRef.current = setTimeout(() => setNewIds(new Set()), 3000);
      }
    }
    // Limit prevIdsRef size to prevent unbounded growth
    if (currentIds.size > 1000) {
      const ids = [...currentIds];
      prevIdsRef.current = new Set(ids.slice(ids.length - 1000));
    } else {
      prevIdsRef.current = currentIds;
    }
  }, [activities]);

  // Statistics
  const stats = useMemo(() => computeStats(allActivities), [allActivities]);

  // Unique actors for filter hint
  const uniqueActors = useMemo(() => {
    const actors = new Set();
    for (const a of allActivities) {
      if (a.user) actors.add(a.user);
    }
    return [...actors].sort();
  }, [allActivities]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageActivities = activities.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups = [];
    let currentGroup = null;
    for (const act of pageActivities) {
      const group = getDateGroup(act.timestamp);
      if (!currentGroup || currentGroup.label !== group) {
        currentGroup = { label: group, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(act);
    }
    return groups;
  }, [pageActivities]);

  // Handlers
  const clearResultTimerRef = useRef(null);
  useEffect(() => {
    return () => clearTimeout(clearResultTimerRef.current);
  }, []);

  const handleClearOld = useCallback(() => {
    const removed = clearOldActivities(30);
    setClearResult(removed);
    setShowClearConfirm(false);
    setRefreshKey((k) => k + 1);
    setPage(0);
    clearTimeout(clearResultTimerRef.current);
    clearResultTimerRef.current = setTimeout(() => setClearResult(null), 4000);
  }, []);

  const handleExportCSV = useCallback(() => {
    const data = activities;
    const columns = [
      { key: 'timestamp', label: 'Cas' },
      { key: 'actionType', label: 'Typ akce' },
      { key: 'action', label: 'Akce' },
      { key: 'category', label: 'Kategorie' },
      { key: 'details', label: 'Detail' },
      { key: 'user', label: 'Uzivatel' },
    ];
    const mapped = data.map((a) => ({
      ...a,
      timestamp: formatFullTimestamp(a.timestamp),
      actionType: inferActionType(a),
      category: CATEGORY_META[a.category]?.label || a.category,
    }));
    exportCSV(mapped, `activity-log-${new Date().toISOString().slice(0, 10)}.csv`, columns);
    setShowExportMenu(false);
  }, [activities]);

  const handleExportJSON = useCallback(() => {
    const data = activities.map((a) => ({
      ...a,
      actionType: inferActionType(a),
      categoryLabel: CATEGORY_META[a.category]?.label || a.category,
      timestampFormatted: formatFullTimestamp(a.timestamp),
    }));
    exportJSON(data, `activity-log-${new Date().toISOString().slice(0, 10)}.json`);
    setShowExportMenu(false);
  }, [activities]);

  const handleResetFilters = useCallback(() => {
    setActiveActionTypes(new Set(Object.keys(ACTION_TYPE_META)));
    setSearch('');
    setActorFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }, []);

  const toggleActionType = useCallback((type) => {
    setActiveActionTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    setPage(0);
  }, []);

  const hasActiveFilters =
    activeActionTypes.size < Object.keys(ACTION_TYPE_META).length ||
    search.trim() ||
    actorFilter.trim() ||
    dateFrom ||
    dateTo;

  /* ───────────────────────── Styles ───────────────────────── */

  const inputStyle = {
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    color: 'var(--forge-text-primary)',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    outline: 'none',
    transition: 'border-color 150ms ease-out',
    minWidth: 0,
  };

  const btnStyle = (variant = 'ghost') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    border: variant === 'ghost' ? '1px solid var(--forge-border-default)' : 'none',
    borderRadius: 'var(--forge-radius-sm)',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
    backgroundColor:
      variant === 'danger'
        ? 'rgba(239, 68, 68, 0.12)'
        : variant === 'primary'
          ? 'var(--forge-accent-primary)'
          : 'transparent',
    color:
      variant === 'danger'
        ? 'var(--forge-error)'
        : variant === 'primary'
          ? 'var(--forge-bg-void)'
          : 'var(--forge-text-secondary)',
  });

  const badgeStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 600,
    backgroundColor: `${color}18`,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
  });

  const statCardStyle = {
    flex: '1 1 200px',
    padding: '16px 20px',
    borderRadius: 'var(--forge-radius-md)',
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
  };

  return (
    <div>
      <ForgePageHeader
        title="Activity Log"
        breadcrumb="ADMIN / ACTIVITY LOG"
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Auto-refresh toggle */}
            <button
              type="button"
              style={{
                ...btnStyle('ghost'),
                backgroundColor: autoRefresh ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: autoRefresh ? 'var(--forge-success)' : 'var(--forge-text-secondary)',
                borderColor: autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'var(--forge-border-default)',
              }}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <Icon name="RefreshCw" size={15} style={autoRefresh ? { animation: 'spin 2s linear infinite' } : undefined} />
              {autoRefresh ? t('admin.activity.autoOn') : t('admin.activity.autoOff')}
            </button>

            {/* Export dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                style={btnStyle('ghost')}
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={activities.length === 0}
              >
                <Icon name="Download" size={15} />
                {t('admin.activity.export')}
                <Icon name="ChevronDown" size={12} />
              </button>
              {showExportMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--forge-bg-surface)',
                    border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-sm)',
                    boxShadow: 'var(--forge-shadow-md)',
                    zIndex: 50,
                    minWidth: '160px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--forge-text-primary)',
                      fontSize: '13px',
                      fontFamily: 'var(--forge-font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Icon name="FileText" size={14} />
                    {t('admin.activity.exportCsv')}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--forge-text-primary)',
                      fontSize: '13px',
                      fontFamily: 'var(--forge-font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Icon name="Braces" size={14} />
                    {t('admin.activity.exportJson')}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              style={btnStyle('danger')}
              onClick={() => setShowClearConfirm(true)}
            >
              <Icon name="Trash2" size={15} />
              {t('admin.activity.clearOld')}
            </button>
          </div>
        }
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes activityHighlight {
          0% { background-color: rgba(16, 185, 129, 0.15); }
          100% { background-color: transparent; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Success message */}
      {clearResult !== null && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: 'var(--forge-radius-sm)',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--forge-success)',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Icon name="CheckCircle2" size={16} />
          {clearResult === 0
            ? t('admin.activity.clearedNone')
            : `Vymazano ${clearResult} zaznamu.`}
        </div>
      )}

      {/* Clear confirmation dialog */}
      {showClearConfirm && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(8, 9, 12, 0.6)',
            }}
            onClick={() => setShowClearConfirm(false)}
          />
          <div style={{
            position: 'relative',
            backgroundColor: 'var(--forge-bg-surface)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-md)',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--forge-shadow-lg)',
          }}>
            <h3 style={{
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--forge-text-primary)',
              margin: '0 0 12px',
            }}>
              {t('admin.activity.confirmTitle')}
            </h3>
            <p style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '14px',
              color: 'var(--forge-text-secondary)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}>
              {t('admin.activity.confirmDesc')}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={btnStyle('ghost')}
                onClick={() => setShowClearConfirm(false)}
              >
                {t('admin.activity.confirmCancel')}
              </button>
              <button
                type="button"
                style={btnStyle('danger')}
                onClick={handleClearOld}
              >
                <Icon name="Trash2" size={14} />
                {t('admin.activity.confirmDelete')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Statistics Cards ─── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '24px',
        marginBottom: '24px',
      }}>
        {/* Today's count */}
        <div style={statCardStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--forge-info)',
            }}>
              <Icon name="Activity" size={14} />
            </div>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {t('admin.activity.todayActivity')}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--forge-text-primary)',
          }}>
            {stats.todayCount}
          </div>
        </div>

        {/* Most active user */}
        <div style={statCardStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--forge-text-secondary)',
            }}>
              <Icon name="User" size={14} />
            </div>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {t('admin.activity.mostActiveUser')}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {stats.mostActiveUser}
          </div>
          {stats.mostActiveUserCount > 0 && (
            <div style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              marginTop: '2px',
            }}>
              {stats.mostActiveUserCount} akci
            </div>
          )}
        </div>

        {/* Most common action type */}
        <div style={statCardStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--forge-warning)',
            }}>
              <Icon name="BarChart3" size={14} />
            </div>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {t('admin.activity.mostCommonType')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {stats.mostCommonType !== '—' && ACTION_TYPE_META[stats.mostCommonType] && (
              <span style={badgeStyle(ACTION_TYPE_META[stats.mostCommonType].color)}>
                {stats.mostCommonType}
              </span>
            )}
            {stats.mostCommonType === '—' && (
              <span style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--forge-text-primary)',
              }}>
                —
              </span>
            )}
          </div>
          {stats.mostCommonTypeCount > 0 && (
            <div style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              marginTop: '4px',
            }}>
              {stats.mostCommonTypeCount}x
            </div>
          )}
        </div>

        {/* Trend */}
        <div style={statCardStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: stats.trendDirection === 'up'
                ? 'rgba(16, 185, 129, 0.12)'
                : stats.trendDirection === 'down'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(122, 130, 145, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stats.trendDirection === 'up'
                ? 'var(--forge-success)'
                : stats.trendDirection === 'down'
                  ? 'var(--forge-error)'
                  : 'var(--forge-text-muted)',
            }}>
              <Icon
                name={stats.trendDirection === 'up' ? 'TrendingUp' : stats.trendDirection === 'down' ? 'TrendingDown' : 'Minus'}
                size={14}
              />
            </div>
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {t('admin.activity.trendVsYesterday')}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            fontWeight: 600,
            color: stats.trendDirection === 'up'
              ? 'var(--forge-success)'
              : stats.trendDirection === 'down'
                ? 'var(--forge-error)'
                : 'var(--forge-text-primary)',
          }}>
            {stats.trendDirection === 'up' && `+${stats.trendPercent}%`}
            {stats.trendDirection === 'down' && `-${stats.trendPercent}%`}
            {stats.trendDirection === 'same' && t('admin.activity.trendSame')}
          </div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        borderRadius: 'var(--forge-radius-md)',
        backgroundColor: 'var(--forge-bg-surface)',
        border: '1px solid var(--forge-border-default)',
      }}>
        {/* Action type checkboxes dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={{
              ...btnStyle('ghost'),
              borderColor: activeActionTypes.size < Object.keys(ACTION_TYPE_META).length
                ? 'var(--forge-accent-primary)'
                : 'var(--forge-border-default)',
            }}
            onClick={() => setShowActionTypeFilter((v) => !v)}
          >
            <Icon name="Filter" size={14} />
            {t('admin.activity.actionTypeFilter')}
            {activeActionTypes.size < Object.keys(ACTION_TYPE_META).length && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--forge-accent-primary)',
                color: 'var(--forge-bg-void)',
                fontSize: '10px',
                fontWeight: 700,
              }}>
                {activeActionTypes.size}
              </span>
            )}
            <Icon name="ChevronDown" size={12} />
          </button>
          {showActionTypeFilter && (
            <>
              {createPortal(
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setShowActionTypeFilter(false)}
                />,
                document.body
              )}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'var(--forge-bg-surface)',
                border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-sm)',
                boxShadow: 'var(--forge-shadow-md)',
                zIndex: 50,
                minWidth: '180px',
                padding: '8px 0',
              }}>
                {Object.entries(ACTION_TYPE_META).map(([type, meta]) => (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: 'var(--forge-font-body)',
                      color: 'var(--forge-text-primary)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <input
                      type="checkbox"
                      checked={activeActionTypes.has(type)}
                      onChange={() => toggleActionType(type)}
                      style={{ accentColor: meta.color }}
                    />
                    <span style={badgeStyle(meta.color)}>
                      {meta.label}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
          <Icon
            name="Search"
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--forge-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder={t('admin.activity.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
          />
        </div>

        {/* Actor filter */}
        <div style={{ position: 'relative', flex: '0 1 180px' }}>
          <Icon
            name="User"
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--forge-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder={t('admin.activity.userPlaceholder')}
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setPage(0); }}
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
            list="actor-suggestions"
          />
          {uniqueActors.length > 0 && (
            <datalist id="actor-suggestions">
              {uniqueActors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          )}
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            style={inputStyle}
            title="Od data"
          />
          <span style={{ color: 'var(--forge-text-muted)', fontSize: '13px' }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            style={inputStyle}
            title="Do data"
          />
        </div>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            type="button"
            style={{ ...btnStyle('ghost'), padding: '8px 12px' }}
            onClick={handleResetFilters}
          >
            <Icon name="X" size={14} />
            {t('admin.activity.resetFilters')}
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-muted)',
        }}>
          {activities.length === 0
            ? ''
            : `${activities.length} zaznam${activities.length === 1 ? '' : activities.length < 5 ? 'y' : 'u'}`}
          {hasActiveFilters && activities.length > 0 && (
            <span> (filtrovano z {allActivities.length})</span>
          )}
        </div>
        {autoRefresh && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-success)',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--forge-success)',
              animation: 'pulse 2s infinite',
            }} />
            Auto-refresh aktivni
          </div>
        )}
      </div>

      {/* ─── Timeline ─── */}
      {activities.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: '16px',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--forge-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--forge-text-muted)',
          }}>
            <Icon name="ClipboardList" size={24} />
          </div>
          <p style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '15px',
            color: 'var(--forge-text-muted)',
            margin: 0,
          }}>
            Zadne aktivity
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              style={btnStyle('ghost')}
              onClick={handleResetFilters}
            >
              Resetovat filtry
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute',
            left: '11px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: 'var(--forge-border-default)',
            borderRadius: '1px',
          }} />

          {groupedActivities.map((group) => (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              {/* Date group header */}
              <div style={{
                position: 'relative',
                padding: '8px 0',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--forge-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {group.label}
                </span>
              </div>

              {group.items.map((act) => {
                const catMeta = CATEGORY_META[act.category] || CATEGORY_META.system;
                const actionType = inferActionType(act);
                const typeMeta = ACTION_TYPE_META[actionType];
                const isNew = newIds.has(act.id);

                return (
                  <div
                    key={act.id}
                    style={{
                      position: 'relative',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      borderRadius: 'var(--forge-radius-sm)',
                      transition: 'background-color 150ms ease-out',
                      animation: isNew ? 'activityHighlight 3s ease-out' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-26px',
                      top: '18px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: typeMeta.color,
                      border: '2px solid var(--forge-bg-void)',
                      boxShadow: `0 0 0 2px ${typeMeta.color}40`,
                    }} />

                    {/* Content */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--forge-radius-sm)',
                        backgroundColor: `${typeMeta.color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: typeMeta.color,
                      }}>
                        <Icon name={typeMeta.icon} size={16} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '4px',
                        }}>
                          <span style={{
                            fontFamily: 'var(--forge-font-body)',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--forge-text-primary)',
                          }}>
                            {act.action}
                          </span>
                          {/* Action type badge */}
                          <span style={badgeStyle(typeMeta.color)}>
                            {typeMeta.label}
                          </span>
                          {/* Category badge */}
                          <span style={{
                            ...badgeStyle(catMeta.color),
                            fontWeight: 400,
                            fontSize: '10px',
                          }}>
                            {catMeta.label}
                          </span>
                        </div>

                        {act.details && (
                          <p style={{
                            fontFamily: 'var(--forge-font-body)',
                            fontSize: '13px',
                            color: 'var(--forge-text-secondary)',
                            margin: '0 0 4px',
                            lineHeight: 1.4,
                          }}>
                            {act.details}
                          </p>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}>
                          {/* Relative timestamp with full date on hover */}
                          <span
                            style={{
                              fontFamily: 'var(--forge-font-tech)',
                              fontSize: '11px',
                              color: 'var(--forge-text-muted)',
                              cursor: 'default',
                            }}
                            title={formatFullTimestamp(act.timestamp)}
                          >
                            {formatRelativeTime(act.timestamp)}
                          </span>
                          {/* Actor */}
                          {act.user && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'var(--forge-font-tech)',
                              fontSize: '11px',
                              color: 'var(--forge-text-muted)',
                            }}>
                              <Icon name="User" size={11} />
                              {act.user}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          marginTop: '24px',
          padding: '16px 0',
        }}>
          {/* Prev */}
          <button
            type="button"
            style={{
              ...btnStyle('ghost'),
              opacity: currentPage === 0 ? 0.4 : 1,
              pointerEvents: currentPage === 0 ? 'none' : 'auto',
              padding: '8px 12px',
            }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <Icon name="ChevronLeft" size={15} />
            Predchozi
          </button>

          {/* Page numbers */}
          {getPageNumbers(currentPage, totalPages).map((item, idx) =>
            item === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  padding: '0 6px',
                  color: 'var(--forge-text-muted)',
                  fontSize: '13px',
                  fontFamily: 'var(--forge-font-body)',
                }}
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--forge-radius-sm)',
                  border: item === currentPage
                    ? '1px solid var(--forge-accent-primary)'
                    : '1px solid transparent',
                  backgroundColor: item === currentPage
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'transparent',
                  color: item === currentPage
                    ? 'var(--forge-accent-primary)'
                    : 'var(--forge-text-secondary)',
                  fontSize: '13px',
                  fontFamily: 'var(--forge-font-body)',
                  fontWeight: item === currentPage ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onClick={() => setPage(item)}
                onMouseEnter={(e) => {
                  if (item !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (item !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item + 1}
              </button>
            )
          )}

          {/* Next */}
          <button
            type="button"
            style={{
              ...btnStyle('ghost'),
              opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              pointerEvents: currentPage >= totalPages - 1 ? 'none' : 'auto',
              padding: '8px 12px',
            }}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Dalsi
            <Icon name="ChevronRight" size={15} />
          </button>

          {/* Total display */}
          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '11px',
            color: 'var(--forge-text-muted)',
            marginLeft: '12px',
          }}>
            {currentPage + 1} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
