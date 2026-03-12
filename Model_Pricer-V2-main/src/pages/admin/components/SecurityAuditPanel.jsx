/**
 * SecurityAuditPanel — Security audit log viewer panel.
 *
 * Features:
 * - Table with: timestamp, event icon, severity badge, actor, description
 * - Filter by severity (info / warning / critical)
 * - Filter by event type
 * - Date range filter (from / to)
 * - Export as CSV
 * - Pagination
 *
 * Designed for embedding inside AdminSystemHealth as a "Bezpecnost" tab.
 */

import React, { useState, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import {
  getSecurityEvents,
  getSecurityEventCount,
  VALID_SEVERITIES,
  VALID_EVENT_TYPES,
} from '../../../utils/securityAuditLog';
import { exportCSV } from '../../../utils/exportData';

const PAGE_SIZE = 25;

/** Human-readable labels for event types */
const EVENT_TYPE_LABELS = {
  login: 'Prihlaseni',
  logout: 'Odhlaseni',
  login_failed: 'Neuspesne prihlaseni',
  password_change: 'Zmena hesla',
  permission_change: 'Zmena opravneni',
  config_change: 'Zmena konfigurace',
  data_export: 'Export dat',
  api_key_usage: 'Pouziti API klice',
};

/** Icons for event types */
const EVENT_TYPE_ICONS = {
  login: 'LogIn',
  logout: 'LogOut',
  login_failed: 'ShieldAlert',
  password_change: 'KeyRound',
  permission_change: 'UserCog',
  config_change: 'Settings',
  data_export: 'Download',
  api_key_usage: 'Key',
};

/** Severity config */
const SEVERITY_CONFIG = {
  info: {
    label: 'Info',
    color: 'var(--forge-accent-primary, #00D4AA)',
    bg: 'rgba(0, 212, 170, 0.1)',
    border: 'rgba(0, 212, 170, 0.25)',
  },
  warning: {
    label: 'Varovani',
    color: 'var(--forge-warning, #F59E0B)',
    bg: 'rgba(249, 158, 11, 0.1)',
    border: 'rgba(249, 158, 11, 0.25)',
  },
  critical: {
    label: 'Kriticke',
    color: 'var(--forge-error, #EF4444)',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
};

/** Format timestamp for display */
function formatTimestamp(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Format date for date input value */
function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

/** Severity badge component */
function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        fontFamily: 'var(--forge-font-tech)',
        fontSize: '10px',
        fontWeight: 600,
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}

/** Filter select component */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--forge-radius-sm, 6px)',
          border: '1px solid var(--forge-border-default)',
          backgroundColor: 'var(--forge-bg-elevated)',
          color: 'var(--forge-text-primary)',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '13px',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '140px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Date input component */
function DateInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--forge-radius-sm, 6px)',
          border: '1px solid var(--forge-border-default)',
          backgroundColor: 'var(--forge-bg-elevated)',
          color: 'var(--forge-text-primary)',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '13px',
          outline: 'none',
        }}
      />
    </div>
  );
}

export default function SecurityAuditPanel() {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Build filters object
  const filters = useMemo(() => {
    const f = {};
    if (severityFilter !== 'all') f.severity = severityFilter;
    if (eventTypeFilter !== 'all') f.event_type = eventTypeFilter;
    if (dateFrom) {
      f.dateFrom = new Date(dateFrom).setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      f.dateTo = new Date(dateTo).setHours(23, 59, 59, 999);
    }
    return f;
  }, [severityFilter, eventTypeFilter, dateFrom, dateTo]);

  // Fetch filtered events (re-runs on filter change or refreshKey)
  const allEvents = useMemo(() => {
    // refreshKey dependency ensures re-fetch on manual refresh
    void refreshKey;
    return getSecurityEvents(filters);
  }, [filters, refreshKey]);

  const totalCount = useMemo(() => {
    void refreshKey;
    return getSecurityEventCount();
  }, [refreshKey]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allEvents.length / PAGE_SIZE));
  const pagedEvents = useMemo(
    () => allEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [allEvents, page]
  );

  // Reset page when filters change
  const handleFilterChange = useCallback((setter) => (val) => {
    setter(val);
    setPage(0);
  }, []);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const columns = [
      { key: 'timestamp_formatted', label: 'Cas' },
      { key: 'event_type_label', label: 'Typ udalosti' },
      { key: 'severity', label: 'Zavaznost' },
      { key: 'actor', label: 'Uzivatel' },
      { key: 'details', label: 'Popis' },
    ];
    const data = allEvents.map((e) => ({
      timestamp_formatted: formatTimestamp(e.timestamp),
      event_type_label: EVENT_TYPE_LABELS[e.event_type] || e.event_type,
      severity: (SEVERITY_CONFIG[e.severity] || SEVERITY_CONFIG.info).label,
      actor: e.actor,
      details: e.details,
    }));
    const dateStr = new Date().toISOString().slice(0, 10);
    exportCSV(data, `security-audit-${dateStr}.csv`, columns);
  }, [allEvents]);

  // Severity filter options
  const severityOptions = [
    { value: 'all', label: 'Vse' },
    ...VALID_SEVERITIES.map((s) => ({
      value: s,
      label: SEVERITY_CONFIG[s]?.label || s,
    })),
  ];

  // Event type filter options
  const eventTypeOptions = [
    { value: 'all', label: 'Vse' },
    ...VALID_EVENT_TYPES.map((t) => ({
      value: t,
      label: EVENT_TYPE_LABELS[t] || t,
    })),
  ];

  // Severity summary counts
  const severityCounts = useMemo(() => {
    const counts = { info: 0, warning: 0, critical: 0 };
    allEvents.forEach((e) => {
      if (counts[e.severity] !== undefined) counts[e.severity]++;
    });
    return counts;
  }, [allEvents]);

  return (
    <div>
      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Total events */}
        <div
          style={{
            backgroundColor: 'var(--forge-bg-surface)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-lg, 12px)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Icon name="Shield" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
          <div>
            <div
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Celkem udalosti
            </div>
            <div
              style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--forge-text-primary)',
              }}
            >
              {totalCount}
            </div>
          </div>
        </div>

        {/* Per-severity counts */}
        {VALID_SEVERITIES.map((sev) => {
          const config = SEVERITY_CONFIG[sev];
          return (
            <div
              key={sev}
              style={{
                backgroundColor: 'var(--forge-bg-surface)',
                border: `1px solid ${config.border}`,
                borderRadius: 'var(--forge-radius-lg, 12px)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: config.color,
                  boxShadow: `0 0 6px ${config.color}40`,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '10px',
                    color: 'var(--forge-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {config.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--forge-font-heading)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: config.color,
                  }}
                >
                  {severityCounts[sev]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: '12px',
          marginBottom: '16px',
          padding: '16px 20px',
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
        }}
      >
        <FilterSelect
          label="Zavaznost"
          value={severityFilter}
          onChange={handleFilterChange(setSeverityFilter)}
          options={severityOptions}
        />
        <FilterSelect
          label="Typ udalosti"
          value={eventTypeFilter}
          onChange={handleFilterChange(setEventTypeFilter)}
          options={eventTypeOptions}
        />
        <DateInput
          label="Od"
          value={dateFrom}
          onChange={handleFilterChange(setDateFrom)}
        />
        <DateInput
          label="Do"
          value={dateTo}
          onChange={handleFilterChange(setDateTo)}
        />

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Obnovit"
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
            <Icon name="RefreshCw" size={13} />
            Obnovit
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={allEvents.length === 0}
            title="Exportovat jako CSV"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--forge-radius-md, 8px)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: 'var(--forge-bg-elevated)',
              color: allEvents.length === 0 ? 'var(--forge-text-muted)' : 'var(--forge-text-primary)',
              cursor: allEvents.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '12px',
              fontWeight: 500,
              opacity: allEvents.length === 0 ? 0.5 : 1,
              transition: 'all 150ms ease-out',
            }}
          >
            <Icon name="Download" size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Results info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span>
          {allEvents.length === totalCount
            ? `${allEvents.length} zaznamu`
            : `${allEvents.length} z ${totalCount} zaznamu (filtrovano)`}
        </span>
        <span>
          Stranka {page + 1} / {totalPages}
        </span>
      </div>

      {/* Events table */}
      <div
        style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 40px 90px 140px 1fr',
            gap: '0',
            padding: '12px 20px',
            backgroundColor: 'var(--forge-bg-elevated)',
            borderBottom: '1px solid var(--forge-border-default)',
          }}
        >
          {['Cas', '', 'Zavaznost', 'Uzivatel', 'Popis'].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Table body */}
        {pagedEvents.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '14px',
              color: 'var(--forge-text-muted)',
            }}
          >
            <Icon
              name="ShieldCheck"
              size={32}
              style={{
                color: 'var(--forge-text-muted)',
                opacity: 0.4,
                marginBottom: '12px',
              }}
            />
            <div>Zadne bezpecnostni udalosti</div>
            <div
              style={{
                fontSize: '12px',
                marginTop: '4px',
                color: 'var(--forge-text-muted)',
              }}
            >
              {totalCount > 0
                ? 'Zkuste upravit filtry'
                : 'Udalosti se zaznamenavaji automaticky'}
            </div>
          </div>
        ) : (
          pagedEvents.map((event, idx) => {
            const iconName = EVENT_TYPE_ICONS[event.event_type] || 'Activity';
            const sevConfig = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
            const eventLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;

            return (
              <div
                key={event.id || idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 40px 90px 140px 1fr',
                  gap: '0',
                  padding: '10px 20px',
                  borderBottom:
                    idx < pagedEvents.length - 1
                      ? '1px solid var(--forge-border-default)'
                      : 'none',
                  alignItems: 'center',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Timestamp */}
                <span
                  style={{
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '11px',
                    color: 'var(--forge-text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatTimestamp(event.timestamp)}
                </span>

                {/* Event icon */}
                <span
                  title={eventLabel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={iconName}
                    size={15}
                    style={{ color: sevConfig.color }}
                  />
                </span>

                {/* Severity badge */}
                <SeverityBadge severity={event.severity} />

                {/* Actor */}
                <span
                  style={{
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: '13px',
                    color: 'var(--forge-text-primary)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={event.actor}
                >
                  {event.actor}
                </span>

                {/* Details (event label + details) */}
                <span
                  style={{
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: '13px',
                    color: 'var(--forge-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`${eventLabel}: ${event.details}`}
                >
                  <span style={{ fontWeight: 500, color: 'var(--forge-text-primary)' }}>
                    {eventLabel}
                  </span>
                  {event.details && (
                    <span style={{ marginLeft: '6px' }}>
                      — {event.details}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: 'var(--forge-radius-md, 8px)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: 'var(--forge-bg-elevated)',
              color: page === 0 ? 'var(--forge-text-muted)' : 'var(--forge-text-primary)',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '12px',
              opacity: page === 0 ? 0.5 : 1,
              transition: 'all 150ms ease-out',
            }}
          >
            <Icon name="ChevronLeft" size={14} />
            Predchozi
          </button>

          <span
            style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '12px',
              color: 'var(--forge-text-secondary)',
              padding: '0 8px',
            }}
          >
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: 'var(--forge-radius-md, 8px)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: 'var(--forge-bg-elevated)',
              color: page >= totalPages - 1 ? 'var(--forge-text-muted)' : 'var(--forge-text-primary)',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '12px',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              transition: 'all 150ms ease-out',
            }}
          >
            Dalsi
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
