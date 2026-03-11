import React, { useMemo, useState } from 'react';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';
import Icon from '../../../components/ui/Icon';

/* ── Constants ─────────────────────────────────────────────────────────── */
const QUANTITY_TIERS = [1, 2, 5, 10, 25, 50, 100];

const COLORS = {
  line: '#00D4AA',       // teal
  dot: '#00D4AA',        // teal for regular dots
  dotActive: '#FF6B35',  // orange for current quantity
  dotDiscount: '#FF6B35',// orange for discount threshold dots
  grid: 'rgba(122, 130, 145, 0.15)',
  bestValue: 'rgba(0, 212, 170, 0.12)',
  bestValueBorder: 'rgba(0, 212, 170, 0.4)',
};

/* ── Forge style objects ───────────────────────────────────────────────── */
const fg = {
  wrapper: {
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 600,
    fontFamily: 'var(--forge-font-heading)',
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  content: {
    padding: '0 1rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  savingsBox: {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    background: 'rgba(0, 212, 170, 0.06)',
    border: '1px solid rgba(0, 212, 170, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  savingsText: {
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-accent-primary)',
    fontWeight: 500,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-mono)',
  },
  th: {
    padding: '0.5rem 0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--forge-border-default)',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.5rem 0.75rem',
    color: 'var(--forge-text-primary)',
    borderBottom: '1px solid var(--forge-border-default)',
    whiteSpace: 'nowrap',
  },
  noDiscounts: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    textAlign: 'center',
    padding: '1rem 0',
  },
};

/* ── Helpers ───────────────────────────────────────────────────────────── */
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

/**
 * Calculate the unit price for a given quantity by running the pricing engine.
 * We clone the first model's config with the target quantity and run calculateOrderQuote.
 */
function calcUnitPriceForQty(quantity, firstFile, firstFileId, printConfigs, pricingConfig, feesConfig, feeSelections) {
  if (!firstFile || !pricingConfig) return null;

  const originalCfg = printConfigs?.[firstFileId] || {};
  const modifiedConfigs = {
    ...printConfigs,
    [firstFileId]: { ...originalCfg, quantity },
  };

  try {
    const quote = calculateOrderQuote({
      uploadedFiles: [firstFile],
      printConfigs: modifiedConfigs,
      pricingConfig,
      feesConfig,
      feeSelections,
    });

    if (!quote || !Number.isFinite(quote.total)) return null;

    const unitPrice = quote.total / quantity;
    return {
      quantity,
      unitPrice,
      totalPrice: quote.total,
      volumeDiscountApplied: !!quote.flags?.volume_discount_applied,
      savings: quote.volumeDiscount?.totalSavings || 0,
    };
  } catch {
    return null;
  }
}

/* ── SVG Line Chart ────────────────────────────────────────────────────── */
function MiniLineChart({ dataPoints, currentQty }) {
  if (!dataPoints || dataPoints.length < 2) return null;

  const W = 360;
  const H = 140;
  const padL = 55;
  const padR = 15;
  const padT = 15;
  const padB = 30;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxQty = Math.max(...dataPoints.map((d) => d.quantity));
  const minQty = Math.min(...dataPoints.map((d) => d.quantity));
  const maxPrice = Math.max(...dataPoints.map((d) => d.unitPrice));
  const minPrice = Math.min(...dataPoints.map((d) => d.unitPrice));

  const priceRange = maxPrice - minPrice || 1;
  const pricepadding = priceRange * 0.1;

  const scaleX = (qty) => {
    // Use log scale for better distribution
    const logMin = Math.log(Math.max(1, minQty));
    const logMax = Math.log(Math.max(1, maxQty));
    const logRange = logMax - logMin || 1;
    const logQty = Math.log(Math.max(1, qty));
    return padL + ((logQty - logMin) / logRange) * chartW;
  };

  const scaleY = (price) => {
    const adjMax = maxPrice + pricepadding;
    const adjMin = minPrice - pricepadding;
    const range = adjMax - adjMin || 1;
    return padT + chartH - ((price - adjMin) / range) * chartH;
  };

  // Build polyline path
  const points = dataPoints.map((d) => `${scaleX(d.quantity).toFixed(1)},${scaleY(d.unitPrice).toFixed(1)}`).join(' ');

  // Grid lines (3 horizontal)
  const gridPrices = [
    minPrice,
    minPrice + priceRange * 0.5,
    maxPrice,
  ];

  // Find current quantity point
  const currentPoint = dataPoints.find((d) => d.quantity === currentQty);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }}
      role="img"
      aria-label="Graf ceny za kus v zavislosti na mnozstvi"
    >
      {/* Grid lines */}
      {gridPrices.map((p, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={scaleY(p)}
            x2={W - padR}
            y2={scaleY(p)}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={padL - 6}
            y={scaleY(p) + 3}
            textAnchor="end"
            fill="var(--forge-text-muted)"
            fontSize="9"
            fontFamily="var(--forge-font-mono)"
          >
            {formatCzk(p)}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {dataPoints.map((d) => (
        <text
          key={d.quantity}
          x={scaleX(d.quantity)}
          y={H - 4}
          textAnchor="middle"
          fill="var(--forge-text-muted)"
          fontSize="9"
          fontFamily="var(--forge-font-mono)"
        >
          {d.quantity}
        </text>
      ))}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={COLORS.line}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Area fill (subtle) */}
      <polygon
        points={`${scaleX(dataPoints[0].quantity).toFixed(1)},${scaleY(dataPoints[0].unitPrice).toFixed(1)} ${points} ${scaleX(dataPoints[dataPoints.length - 1].quantity).toFixed(1)},${(padT + chartH).toFixed(1)} ${scaleX(dataPoints[0].quantity).toFixed(1)},${(padT + chartH).toFixed(1)}`}
        fill={COLORS.line}
        fillOpacity={0.06}
      />

      {/* Dots */}
      {dataPoints.map((d) => {
        const isCurrent = currentPoint && d.quantity === currentQty;
        const isDiscountThreshold = d.volumeDiscountApplied && !dataPoints.find(
          (prev) => prev.quantity < d.quantity && prev.volumeDiscountApplied && Math.abs(prev.unitPrice - d.unitPrice) < 0.01
        );

        const dotColor = isCurrent
          ? COLORS.dotActive
          : (d.volumeDiscountApplied ? COLORS.dotDiscount : COLORS.dot);
        const dotR = isCurrent ? 5 : (d.volumeDiscountApplied ? 4 : 3);

        return (
          <g key={d.quantity}>
            <circle
              cx={scaleX(d.quantity)}
              cy={scaleY(d.unitPrice)}
              r={dotR}
              fill={dotColor}
              stroke="var(--forge-bg-elevated)"
              strokeWidth={isCurrent ? 2 : 1}
            />
            {isCurrent && (
              <circle
                cx={scaleX(d.quantity)}
                cy={scaleY(d.unitPrice)}
                r={8}
                fill="none"
                stroke={COLORS.dotActive}
                strokeWidth={1}
                strokeOpacity={0.4}
              />
            )}
          </g>
        );
      })}

      {/* Axis labels */}
      <text
        x={W / 2}
        y={H}
        textAnchor="middle"
        fill="var(--forge-text-muted)"
        fontSize="9"
        fontFamily="var(--forge-font-body)"
      >
        Mnozstvi (ks)
      </text>
      <text
        x={6}
        y={padT + chartH / 2}
        textAnchor="middle"
        fill="var(--forge-text-muted)"
        fontSize="9"
        fontFamily="var(--forge-font-body)"
        transform={`rotate(-90, 6, ${padT + chartH / 2})`}
      >
        Cena/ks
      </text>
    </svg>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function VolumeDiscountChart({
  uploadedFiles,
  printConfigs,
  pricingConfig,
  feesConfig,
  feeSelections,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Get the first completed file for simulation
  const firstFile = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    return files.find((f) => f?.status === 'completed' && f?.result) || null;
  }, [uploadedFiles]);

  const firstFileId = useMemo(() => {
    if (!firstFile) return null;
    return String(firstFile?.id || firstFile?.fileId || firstFile?.key || 'file-0');
  }, [firstFile]);

  const currentQty = useMemo(() => {
    if (!firstFileId || !printConfigs) return 1;
    return Math.max(1, Math.floor(Number(printConfigs[firstFileId]?.quantity) || 1));
  }, [firstFileId, printConfigs]);

  // Check if volume discounts are configured
  const hasVolumeDiscounts = useMemo(() => {
    if (!pricingConfig) return false;
    const vc = pricingConfig.volume_discounts || pricingConfig.tenant_pricing?.volume_discounts;
    return vc?.enabled && Array.isArray(vc?.tiers) && vc.tiers.length > 0;
  }, [pricingConfig]);

  // Calculate prices for each quantity tier
  const dataPoints = useMemo(() => {
    if (!firstFile || !pricingConfig) return [];

    // Build tier list: include standard tiers + current qty if not already there
    const tiers = new Set(QUANTITY_TIERS);
    tiers.add(currentQty);

    // Also add volume discount thresholds
    const vc = pricingConfig.volume_discounts || pricingConfig.tenant_pricing?.volume_discounts;
    if (vc?.enabled && Array.isArray(vc?.tiers)) {
      for (const t of vc.tiers) {
        const minQty = Number(t?.min_qty);
        if (Number.isFinite(minQty) && minQty > 0 && minQty <= 200) {
          tiers.add(minQty);
        }
      }
    }

    const sortedTiers = [...tiers].sort((a, b) => a - b);

    const results = [];
    for (const qty of sortedTiers) {
      const result = calcUnitPriceForQty(
        qty,
        firstFile,
        firstFileId,
        printConfigs,
        pricingConfig,
        feesConfig,
        feeSelections,
      );
      if (result) results.push(result);
    }

    return results;
  }, [firstFile, firstFileId, printConfigs, pricingConfig, feesConfig, feeSelections, currentQty]);

  // Find best value tier (lowest unit price)
  const bestValueTier = useMemo(() => {
    if (dataPoints.length === 0) return null;
    return dataPoints.reduce((best, d) => (d.unitPrice < best.unitPrice ? d : best), dataPoints[0]);
  }, [dataPoints]);

  // Find the next savings opportunity
  const nextSavings = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const currentData = dataPoints.find((d) => d.quantity === currentQty);
    if (!currentData) return null;

    // Find the next tier that has a lower unit price
    const nextTier = dataPoints.find(
      (d) => d.quantity > currentQty && d.unitPrice < currentData.unitPrice - 0.01,
    );

    if (!nextTier) return null;

    const savingsPerUnit = currentData.unitPrice - nextTier.unitPrice;
    const totalSavingsAtTier = savingsPerUnit * nextTier.quantity;

    return {
      quantity: nextTier.quantity,
      savingsPerUnit,
      totalSavings: totalSavingsAtTier,
    };
  }, [dataPoints, currentQty]);

  // Don't render if no slicing results
  if (!firstFile || dataPoints.length < 2) return null;

  return (
    <div style={fg.wrapper}>
      {/* Collapsible header */}
      <div
        style={fg.header}
        onClick={() => setIsOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls="volume-discount-content"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((v) => !v);
          }
        }}
      >
        <span style={fg.headerTitle}>
          <Icon name="TrendingDown" size={16} style={{ color: 'var(--forge-accent-primary)' }} />
          Mnozstevni slevy
          {hasVolumeDiscounts && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--forge-font-mono)',
                padding: '0.125rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(0, 212, 170, 0.1)',
                color: 'var(--forge-accent-primary)',
                border: '1px solid rgba(0, 212, 170, 0.2)',
              }}
            >
              Aktivni
            </span>
          )}
        </span>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          style={{ color: 'var(--forge-text-muted)' }}
        />
      </div>

      {/* Content */}
      {isOpen && (
        <div id="volume-discount-content" style={fg.content}>
          {/* Savings suggestion */}
          {nextSavings && (
            <div style={fg.savingsBox}>
              <Icon name="Sparkles" size={14} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
              <span style={fg.savingsText}>
                Usetrite {formatCzk(nextSavings.savingsPerUnit)}/ks pri objednavce {nextSavings.quantity}+ ks
              </span>
            </div>
          )}

          {/* SVG chart */}
          <MiniLineChart dataPoints={dataPoints} currentQty={currentQty} />

          {/* Table */}
          <div style={fg.tableWrapper}>
            <table style={fg.table}>
              <thead>
                <tr>
                  <th style={fg.th}>Mnozstvi</th>
                  <th style={{ ...fg.th, textAlign: 'right' }}>Cena za kus</th>
                  <th style={{ ...fg.th, textAlign: 'right' }}>Celkem</th>
                  <th style={{ ...fg.th, textAlign: 'right' }}>Uspora</th>
                </tr>
              </thead>
              <tbody>
                {dataPoints.map((d) => {
                  const isCurrent = d.quantity === currentQty;
                  const isBest = bestValueTier && d.quantity === bestValueTier.quantity && dataPoints.length > 2;
                  const baseUnitPrice = dataPoints[0]?.unitPrice || d.unitPrice;
                  const savingsVsBase = (baseUnitPrice - d.unitPrice) * d.quantity;

                  const rowStyle = isBest
                    ? {
                        background: COLORS.bestValue,
                        borderLeft: `2px solid ${COLORS.bestValueBorder}`,
                      }
                    : isCurrent
                      ? { background: 'rgba(255, 107, 53, 0.06)' }
                      : {};

                  return (
                    <tr key={d.quantity} style={rowStyle}>
                      <td style={fg.td}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {d.quantity} ks
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'var(--forge-font-mono)',
                                padding: '0.0625rem 0.375rem',
                                borderRadius: '999px',
                                background: 'rgba(255, 107, 53, 0.15)',
                                color: '#FF6B35',
                                border: '1px solid rgba(255, 107, 53, 0.3)',
                              }}
                            >
                              nyni
                            </span>
                          )}
                          {isBest && !isCurrent && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'var(--forge-font-mono)',
                                padding: '0.0625rem 0.375rem',
                                borderRadius: '999px',
                                background: 'rgba(0, 212, 170, 0.15)',
                                color: 'var(--forge-accent-primary)',
                                border: '1px solid rgba(0, 212, 170, 0.3)',
                              }}
                            >
                              best value
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        style={{
                          ...fg.td,
                          textAlign: 'right',
                          color: d.volumeDiscountApplied ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)',
                          fontWeight: d.volumeDiscountApplied ? 600 : 400,
                        }}
                      >
                        {formatCzk(d.unitPrice)}
                      </td>
                      <td style={{ ...fg.td, textAlign: 'right' }}>
                        {formatCzk(d.totalPrice)}
                      </td>
                      <td
                        style={{
                          ...fg.td,
                          textAlign: 'right',
                          color: savingsVsBase > 0.01 ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                        }}
                      >
                        {savingsVsBase > 0.01 ? `- ${formatCzk(savingsVsBase)}` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* No volume discounts note */}
          {!hasVolumeDiscounts && (
            <p style={fg.noDiscounts}>
              Mnozstevni slevy nejsou nakonfigurovany. Cena za kus se meni pouze diky fixnim poplatkum rozlozenym na vice kusu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
