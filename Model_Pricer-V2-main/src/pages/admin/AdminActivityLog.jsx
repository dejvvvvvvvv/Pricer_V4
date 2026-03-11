/**
 * AdminActivityLog — timeline-style activity log for admin panel.
 *
 * Features:
 * - Timeline view (newest first) with category badges
 * - Filter by category, date range, and search text
 * - Pagination (20 per page)
 * - Export as CSV
 * - Clear old entries (30+ days)
 */

import React, { useState, useMemo, useCallback } from 'react';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import Icon from '../../components/AppIcon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  getActivities,
  clearOldActivities,
  VALID_CATEGORIES,
} from '../../utils/adminActivityLog';
import { exportCSV } from '../../utils/exportData';

const PAGE_SIZE = 20;

/** Category config: label, color, icon */
const CATEGORY_META = {
  order:   { label: 'Objednavky',  color: '#3B82F6', icon: 'ShoppingCart' },
  pricing: { label: 'Ceny',        color: '#8B5CF6', icon: 'Calculator' },
  config:  { label: 'Konfigurace', color: '#F59E0B', icon: 'Settings2' },
  auth:    { label: 'Autentizace', color: '#EF4444', icon: 'Shield' },
  export:  { label: 'Export',      color: '#10B981', icon: 'Download' },
  slicing: { label: 'Slicing',     color: '#06B6D4', icon: 'Layers' },
  system:  { label: 'System',      color: '#7A8291', icon: 'Monitor' },
};

function formatTimestamp(ts) {
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

function formatDateForInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
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

/** Relative time label for timeline grouping */
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

export default function AdminActivityLog() {
  useDocumentTitle('Admin - Activity Log');

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearResult, setClearResult] = useState(null);

  // Force re-render after clearing
  const [refreshKey, setRefreshKey] = useState(0);

  const filters = useMemo(() => ({
    category: category !== 'all' ? category : undefined,
    search: search.trim() || undefined,
    dateFrom: parseDateInput(dateFrom),
    dateTo: parseDateInput(dateTo, true),
  }), [category, search, dateFrom, dateTo]);

  const activities = useMemo(() => {
    return getActivities(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageActivities = activities.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Group activities on current page by date
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

  const handleClearOld = useCallback(() => {
    const removed = clearOldActivities(30);
    setClearResult(removed);
    setShowClearConfirm(false);
    setRefreshKey((k) => k + 1);
    setPage(0);
    setTimeout(() => setClearResult(null), 4000);
  }, []);

  const handleExportCSV = useCallback(() => {
    const data = getActivities(filters);
    const columns = [
      { key: 'timestamp', label: 'Cas' },
      { key: 'action', label: 'Akce' },
      { key: 'category', label: 'Kategorie' },
      { key: 'details', label: 'Detail' },
      { key: 'user', label: 'Uzivatel' },
    ];
    const mapped = data.map((a) => ({
      ...a,
      timestamp: formatTimestamp(a.timestamp),
      category: CATEGORY_META[a.category]?.label || a.category,
    }));
    exportCSV(mapped, `activity-log-${new Date().toISOString().slice(0, 10)}.csv`, columns);
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setCategory('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }, []);

  const hasActiveFilters = category !== 'all' || search.trim() || dateFrom || dateTo;

  // ---- Styles ----
  const filterBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    marginTop: '24px',
    marginBottom: '24px',
  };

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

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    paddingRight: '32px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%237A8291' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
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
    backgroundColor: variant === 'danger'
      ? 'rgba(239, 68, 68, 0.12)'
      : variant === 'primary'
        ? 'var(--forge-accent-primary)'
        : 'transparent',
    color: variant === 'danger'
      ? '#EF4444'
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
    fontWeight: 500,
    backgroundColor: `${color}18`,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      <ForgePageHeader
        title="Activity Log"
        breadcrumb="ADMIN / ACTIVITY LOG"
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={btnStyle('ghost')}
              onClick={handleExportCSV}
              disabled={activities.length === 0}
              title="Exportovat jako CSV"
            >
              <Icon name="Download" size={15} />
              Export CSV
            </button>
            <button
              type="button"
              style={btnStyle('danger')}
              onClick={() => setShowClearConfirm(true)}
              title="Vymazat aktivity starsi nez 30 dni"
            >
              <Icon name="Trash2" size={15} />
              Vymazat starsi nez 30 dni
            </button>
          </div>
        }
      />

      {/* Success message */}
      {clearResult !== null && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: 'var(--forge-radius-sm)',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#10B981',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Icon name="CheckCircle2" size={16} />
          {clearResult === 0
            ? 'Zadne stare zaznamy k vymazani.'
            : `Vymazano ${clearResult} zaznamu.`}
        </div>
      )}

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
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
              Potvrdit vymazani
            </h3>
            <p style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: '14px',
              color: 'var(--forge-text-secondary)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}>
              Opravdu chcete vymazat vsechny zaznamy starsi nez 30 dni? Tuto akci nelze vratit zpet.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={btnStyle('ghost')}
                onClick={() => setShowClearConfirm(false)}
              >
                Zrusit
              </button>
              <button
                type="button"
                style={btnStyle('danger')}
                onClick={handleClearOld}
              >
                <Icon name="Trash2" size={14} />
                Vymazat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={filterBarStyle}>
        {/* Category select */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0); }}
          style={{ ...selectStyle, minWidth: '150px' }}
        >
          <option value="all">Vsechny kategorie</option>
          {VALID_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_META[cat]?.label || cat}
            </option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
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
            placeholder="Hledat v aktivitach..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
          />
        </div>

        {/* Date range */}
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

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            type="button"
            style={{ ...btnStyle('ghost'), padding: '8px' }}
            onClick={handleResetFilters}
            title="Resetovat filtry"
          >
            <Icon name="X" size={15} />
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{
        fontSize: '13px',
        fontFamily: 'var(--forge-font-body)',
        color: 'var(--forge-text-muted)',
        marginBottom: '16px',
      }}>
        {activities.length === 0
          ? ''
          : `${activities.length} zaznam${activities.length === 1 ? '' : activities.length < 5 ? 'y' : 'u'}`}
      </div>

      {/* Timeline */}
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
                const meta = CATEGORY_META[act.category] || CATEGORY_META.system;
                return (
                  <div
                    key={act.id}
                    style={{
                      position: 'relative',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      borderRadius: 'var(--forge-radius-sm)',
                      transition: 'background-color 150ms ease-out',
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
                      backgroundColor: meta.color,
                      border: '2px solid var(--forge-bg-void)',
                      boxShadow: `0 0 0 2px ${meta.color}40`,
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
                        backgroundColor: `${meta.color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: meta.color,
                      }}>
                        <Icon name={meta.icon} size={16} />
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
                          <span style={badgeStyle(meta.color)}>
                            {meta.label}
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
                          <span style={{
                            fontFamily: 'var(--forge-font-tech)',
                            fontSize: '11px',
                            color: 'var(--forge-text-muted)',
                          }}>
                            {formatTimestamp(act.timestamp)}
                          </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px',
          padding: '16px 0',
        }}>
          <button
            type="button"
            style={{
              ...btnStyle('ghost'),
              opacity: currentPage === 0 ? 0.4 : 1,
              pointerEvents: currentPage === 0 ? 'none' : 'auto',
            }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <Icon name="ChevronLeft" size={15} />
            Predchozi
          </button>

          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '12px',
            color: 'var(--forge-text-muted)',
            padding: '0 8px',
          }}>
            {currentPage + 1} / {totalPages}
          </span>

          <button
            type="button"
            style={{
              ...btnStyle('ghost'),
              opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              pointerEvents: currentPage >= totalPages - 1 ? 'none' : 'auto',
            }}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Dalsi
            <Icon name="ChevronRight" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
