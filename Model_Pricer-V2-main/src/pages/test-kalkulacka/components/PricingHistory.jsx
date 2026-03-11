import React, { useState, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';

/* ── Forge style tokens ──────────────────────────────────────────────── */
const fg = {
  panel: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 1rem',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'var(--forge-bg-elevated)',
    borderBottom: '1px solid var(--forge-border-default)',
  },
  headerTitle: {
    fontSize: 'var(--forge-text-sm)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 700,
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '999px',
    background: 'var(--forge-accent-primary)',
    color: 'var(--forge-bg-base)',
  },
  body: {
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '420px',
    overflowY: 'auto',
  },
  entry: {
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  entrySelected: {
    borderColor: 'var(--forge-accent-primary)',
    background: 'rgba(0, 212, 170, 0.04)',
  },
  entryTime: {
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-text-muted)',
  },
  entryConfig: {
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  entryPrice: {
    fontSize: 'var(--forge-text-sm)',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 600,
    color: 'var(--forge-accent-primary)',
  },
  compareBox: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
  },
  diffPositive: { color: '#ff4757' }, // red = more expensive
  diffNegative: { color: '#00d4aa' }, // green = cheaper
  diffZero: { color: 'var(--forge-text-muted)' },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    flexWrap: 'wrap',
  },
  smallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    padding: '0.1875rem 0.5rem',
    borderRadius: 'var(--forge-radius-sm)',
    border: '1px solid var(--forge-border-default)',
    background: 'transparent',
    color: 'var(--forge-text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  emptyState: {
    padding: '1.25rem 1rem',
    textAlign: 'center',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-muted)',
  },
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatCzk(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} Kc`;
  }
}

function formatTime(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function configSummary(cfg) {
  const parts = [];
  if (cfg.material) parts.push(cfg.material.toUpperCase());
  if (cfg.quality) parts.push(cfg.quality);
  parts.push(`${cfg.infill ?? 0}%`);
  if (cfg.supports) parts.push('podp.');
  parts.push(`${cfg.quantity ?? 1}x`);
  if (cfg.modelCount > 1) parts.push(`${cfg.modelCount} mod.`);
  return parts.join(' / ');
}

function diffColor(value) {
  if (value > 0.005) return fg.diffPositive;
  if (value < -0.005) return fg.diffNegative;
  return fg.diffZero;
}

function formatDiff(value) {
  if (Math.abs(value) < 0.005) return '0 Kc';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCzk(value)}`;
}

/* ── SVG Mini Sparkline ──────────────────────────────────────────────── */

function Sparkline({ values }) {
  if (!values || values.length < 2) return null;

  const w = 200;
  const h = 32;
  const padY = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Gradient fill area
  const areaPoints = [
    `0,${h}`,
    ...points,
    `${w},${h}`,
  ].join(' ');

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: 'block', borderRadius: 'var(--forge-radius-sm)' }}
      aria-label="Cenovy trend"
      role="img"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--forge-accent-primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--forge-accent-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFill)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--forge-accent-primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current value dot */}
      {(() => {
        const last = points[points.length - 1].split(',');
        return (
          <circle
            cx={last[0]}
            cy={last[1]}
            r="2.5"
            fill="var(--forge-accent-primary)"
          />
        );
      })()}
    </svg>
  );
}

/* ── Comparison Row ──────────────────────────────────────────────────── */

function DiffRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-mono)', fontWeight: 600, ...diffColor(value) }}>
        {formatDiff(value)}
      </span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function PricingHistory({
  history,
  onApplyConfig,
  onClearHistory,
  compareEntries,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Sparkline data — prices in chronological order (history is newest-first)
  const sparkValues = useMemo(() => {
    if (history.length < 2) return [];
    return [...history].reverse().map((e) => e.result.total);
  }, [history]);

  // Comparison result
  const comparison = useMemo(() => {
    if (selectedIds.length !== 2 || !compareEntries) return null;
    return compareEntries(selectedIds[0], selectedIds[1]);
  }, [selectedIds, compareEntries]);

  const handleEntryClick = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // shift window
      return [...prev, id];
    });
  };

  const handleApply = (entry) => {
    if (onApplyConfig) {
      onApplyConfig(entry.config);
    }
  };

  const handleClear = () => {
    setSelectedIds([]);
    if (onClearHistory) onClearHistory();
  };

  if (history.length === 0 && !isOpen) return null;

  return (
    <div style={fg.panel} data-no-print>
      {/* Header toggle */}
      <div
        style={fg.header}
        onClick={() => setIsOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`Historie cen, ${history.length} zaznam${history.length === 1 ? '' : history.length < 5 ? 'y' : 'u'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((v) => !v);
          }
        }}
      >
        <div style={fg.headerTitle}>
          <Icon name="History" size={14} />
          <span>Historie cen</span>
          {history.length > 0 && <span style={fg.badge}>{history.length}</span>}
        </div>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={14}
          style={{ color: 'var(--forge-text-muted)' }}
        />
      </div>

      {/* Body */}
      {isOpen && (
        <div style={fg.body}>
          {history.length === 0 ? (
            <div style={fg.emptyState}>
              Zatim zadny vypocet. Ceny se zaznamenaji automaticky pri prepoctu.
            </div>
          ) : (
            <>
              {/* Sparkline chart */}
              {sparkValues.length >= 2 && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-muted)', marginBottom: '0.25rem' }}>
                    Cenovy trend ({history.length} vypoctu)
                  </p>
                  <Sparkline values={sparkValues} />
                </div>
              )}

              {/* Actions bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={fg.actions}>
                  {selectedIds.length === 2 && (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-accent-primary)' }}>
                      Porovnani aktivni
                    </span>
                  )}
                  {selectedIds.length > 0 && selectedIds.length < 2 && (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-muted)' }}>
                      Vyberte dalsi pro porovnani
                    </span>
                  )}
                </div>
                <button
                  style={fg.smallBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  title="Vymazat historii"
                >
                  <Icon name="Trash2" size={11} />
                  Smazat
                </button>
              </div>

              {/* Comparison panel */}
              {comparison && (
                <div style={fg.compareBox}>
                  <p style={{ fontSize: '11px', fontFamily: 'var(--forge-font-heading)', fontWeight: 600, color: 'var(--forge-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                    Porovnani
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-mono)', color: 'var(--forge-text-muted)' }}>
                      {formatTime(comparison.entry1.timestamp)}
                    </span>
                    <Icon name="ArrowRight" size={12} style={{ color: 'var(--forge-text-muted)' }} />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-mono)', color: 'var(--forge-text-muted)' }}>
                      {formatTime(comparison.entry2.timestamp)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    <DiffRow label="Celkem" value={comparison.diff.total} />
                    <DiffRow label="Material" value={comparison.diff.material} />
                    <DiffRow label="Cas tisku" value={comparison.diff.time} />
                    <DiffRow label="Sluzby" value={comparison.diff.services} />
                    <DiffRow label="Sleva" value={comparison.diff.discount} />
                    <DiffRow label="Markup" value={comparison.diff.markup} />
                  </div>
                </div>
              )}

              {/* Entry list */}
              {history.map((entry) => {
                const isSelected = selectedIds.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    style={{ ...fg.entry, ...(isSelected ? fg.entrySelected : {}) }}
                    onClick={() => handleEntryClick(entry.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Vypocet v ${formatTime(entry.timestamp)}, cena ${formatCzk(entry.result.total)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEntryClick(entry.id);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={fg.entryTime}>{formatTime(entry.timestamp)}</span>
                          {isSelected && (
                            <span style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: 'var(--forge-accent-primary)',
                            }} />
                          )}
                        </div>
                        <p style={fg.entryConfig}>{configSummary(entry.config)}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={fg.entryPrice}>{formatCzk(entry.result.total)}</p>
                      </div>
                    </div>
                    {/* Apply button */}
                    {onApplyConfig && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          style={fg.smallBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(entry);
                          }}
                          title="Pouzit nastaveni"
                        >
                          <Icon name="RotateCcw" size={11} />
                          Pouzit nastaveni
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
