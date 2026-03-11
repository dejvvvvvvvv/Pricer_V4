import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/* ── Color palette (Forge dark theme compatible) ─────────────────────── */
const COLORS = {
  material: '#00D4AA',  // teal — base material
  time:     '#0EA5E9',  // sky blue — print time
  services: '#FF6B35',  // orange — fees/services
  markup:   '#4A9EFF',  // blue — markup
  discount: '#9B59B6',  // purple — discount (shown as absolute value)
};

const LABELS = {
  material: 'Material',
  time:     'Cas tisku',
  services: 'Sluzby',
  markup:   'Marze',
  discount: 'Sleva',
};

/* ── Forge-compatible inline styles ──────────────────────────────────── */
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 0',
  },
  chartContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '200px',
    height: '200px',
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  centerTotal: {
    fontSize: 'var(--forge-text-lg, 18px)',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-mono, monospace)',
    color: 'var(--forge-text-primary, #E8EAED)',
    lineHeight: 1.2,
  },
  centerCaption: {
    fontSize: 'var(--forge-text-xs, 11px)',
    fontFamily: 'var(--forge-font-body, sans-serif)',
    color: 'var(--forge-text-muted, #7A8291)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.5rem 1rem',
    padding: '0 0.5rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: 'var(--forge-text-xs, 11px)',
    fontFamily: 'var(--forge-font-body, sans-serif)',
    color: 'var(--forge-text-secondary, #9CA3AF)',
  },
  legendDot: (color) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  tooltip: {
    background: 'var(--forge-bg-elevated, #1A1D24)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    borderRadius: 'var(--forge-radius-md, 8px)',
    padding: '0.5rem 0.75rem',
    fontSize: 'var(--forge-text-xs, 11px)',
    fontFamily: 'var(--forge-font-mono, monospace)',
    color: 'var(--forge-text-primary, #E8EAED)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
};

function formatCzk(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${Math.round(n)} Kc`;
  }
}

function formatCzkDetailed(amount) {
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

/* ── Custom tooltip ──────────────────────────────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div style={styles.tooltip}>
      <span style={{ color: item.color, fontWeight: 600 }}>{name}</span>
      <br />
      {formatCzkDetailed(value)}
    </div>
  );
}

/**
 * PriceBreakdownChart — SVG donut chart via recharts.
 *
 * @param {{ quote: object }} props
 *   quote.simple.material  — material cost
 *   quote.simple.time      — print time cost
 *   quote.simple.services  — fees total (may be negative)
 *   quote.simple.markup    — markup amount
 *   quote.simple.discount  — discount amount (typically negative)
 *   quote.total            — grand total
 */
export default function PriceBreakdownChart({ quote }) {
  const chartData = useMemo(() => {
    if (!quote?.simple) return [];
    const s = quote.simple;

    // Build segments — only include positive amounts (or absolute value for display)
    const segments = [];

    if (s.material > 0) {
      segments.push({ name: LABELS.material, value: s.material, color: COLORS.material, key: 'material' });
    }
    if (s.time > 0) {
      segments.push({ name: LABELS.time, value: s.time, color: COLORS.time, key: 'time' });
    }
    if (s.services > 0) {
      segments.push({ name: LABELS.services, value: s.services, color: COLORS.services, key: 'services' });
    }
    if (s.markup > 0) {
      segments.push({ name: LABELS.markup, value: s.markup, color: COLORS.markup, key: 'markup' });
    }
    // Show discount as absolute value segment (it reduces total but visually shows proportion)
    if (s.discount < 0) {
      segments.push({ name: LABELS.discount, value: Math.abs(s.discount), color: COLORS.discount, key: 'discount' });
    }

    return segments;
  }, [quote]);

  if (!quote || chartData.length === 0) return null;

  return (
    <div style={styles.wrapper} role="figure" aria-label="Graf rozlozeni ceny objednavky">
      {/* Chart with center label */}
      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
              animationEasing="ease-out"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total overlay */}
        <div style={styles.centerLabel}>
          <div style={styles.centerCaption}>Celkem</div>
          <div style={styles.centerTotal}>{formatCzk(quote.total)}</div>
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {chartData.map((entry) => (
          <div key={entry.key} style={styles.legendItem}>
            <div style={styles.legendDot(entry.color)} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
