import React, { useState, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';
import { useLanguage } from '../../../contexts/LanguageContext';

/* ── Forge styles ──────────────────────────────────────────────────────── */
const styles = {
  wrapper: {
    borderRadius: 'var(--forge-radius-xl)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-surface)',
    overflow: 'hidden',
  },
  toggleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    fontSize: 'var(--forge-text-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  content: (open) => ({
    maxHeight: open ? '2000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.35s ease',
  }),
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 1rem 1rem 1rem',
  },
  row: (isSelected, isCheapest) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: isSelected
      ? '1.5px solid var(--forge-accent-primary)'
      : '1px solid var(--forge-border-default)',
    background: isSelected
      ? 'rgba(0, 212, 170, 0.06)'
      : 'var(--forge-bg-elevated)',
    cursor: isSelected ? 'default' : 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    minHeight: '44px',
  }),
  materialName: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    flex: '0 0 auto',
    minWidth: '60px',
  },
  barContainer: {
    flex: '1 1 auto',
    height: '6px',
    borderRadius: '3px',
    background: 'var(--forge-bg-surface)',
    overflow: 'hidden',
    position: 'relative',
  },
  bar: (widthPct, isCheapest) => ({
    height: '100%',
    borderRadius: '3px',
    background: isCheapest
      ? 'var(--forge-accent-primary)'
      : 'var(--forge-text-muted)',
    opacity: isCheapest ? 1 : 0.4,
    width: `${Math.max(4, widthPct)}%`,
    transition: 'width 0.3s ease',
  }),
  priceArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: '0 0 auto',
    minWidth: '80px',
  },
  price: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-text-primary)',
    whiteSpace: 'nowrap',
  },
  diff: (isPositive) => ({
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono)',
    color: isPositive ? 'var(--forge-error)' : 'var(--forge-accent-primary)',
    whiteSpace: 'nowrap',
  }),
  badge: (type) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '10px',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 600,
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    ...(type === 'cheapest'
      ? {
          background: 'rgba(0, 212, 170, 0.12)',
          color: 'var(--forge-accent-primary)',
          border: '1px solid rgba(0, 212, 170, 0.25)',
        }
      : {
          background: 'rgba(0, 212, 170, 0.06)',
          color: 'var(--forge-accent-primary)',
          border: '1px solid rgba(0, 212, 170, 0.15)',
        }),
  }),
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    gap: '0.5rem',
    color: 'var(--forge-text-muted)',
    fontSize: 'var(--forge-text-sm)',
    fontFamily: 'var(--forge-font-body)',
  },
  noData: {
    padding: '1rem',
    textAlign: 'center',
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
  },
};

/**
 * MaterialComparison — shows a compact comparison of prices for all available
 * materials, sorted cheapest-first. Collapsed by default, expands as a toggle
 * section below PrintConfiguration's material selector.
 *
 * Only visible when slicing results are available (we need weight/time data
 * to produce meaningful prices).
 */
const MaterialComparison = ({
  pricingConfig,
  feesConfig,
  feeSelections,
  selectedFile,
  uploadedFiles,
  printConfigs,
  currentMaterialKey,
  onMaterialChange,
  expressConfig,
  selectedExpressTierId,
  couponsConfig,
  appliedCouponCode,
  shippingConfig,
  selectedShippingMethodId,
}) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const t = useMemo(() => ({
    title: language === 'en' ? 'Material comparison' : 'Porovnani materialu',
    cheapest: language === 'en' ? 'Cheapest' : 'Nejlevnejsi',
    selected: language === 'en' ? 'Selected' : 'Vybrany',
    noMaterials: language === 'en'
      ? 'No materials configured for comparison.'
      : 'Zadne materialy pro porovnani.',
    noResults: language === 'en'
      ? 'Slice the model first to see price comparison.'
      : 'Nejprve zpracujte model pro zobrazeni porovnani cen.',
    currency: language === 'en' ? 'CZK' : 'Kc',
  }), [language]);

  // Enabled materials from pricing config
  const enabledMaterials = useMemo(() => {
    const mats = Array.isArray(pricingConfig?.materials) ? pricingConfig.materials : [];
    return mats.filter((m) => !!m?.enabled);
  }, [pricingConfig]);

  // Check if slicing results are available for the selected file
  const hasSlicingResults = selectedFile?.status === 'completed' && selectedFile?.result;

  // Calculate prices for each material using the pricing engine (memoized)
  const comparisonData = useMemo(() => {
    if (!hasSlicingResults || enabledMaterials.length < 2) return null;

    const fileId = selectedFile?.id;
    if (!fileId) return null;

    const results = [];

    for (const mat of enabledMaterials) {
      try {
        // Build a modified printConfigs with this material
        const currentFileConfig = printConfigs?.[fileId] || {};
        const modifiedConfigs = {
          ...printConfigs,
          [fileId]: {
            ...currentFileConfig,
            material: mat.key,
          },
        };

        const quote = calculateOrderQuote({
          uploadedFiles: [selectedFile],
          printConfigs: modifiedConfigs,
          pricingConfig,
          feesConfig,
          feeSelections,
          expressConfig,
          selectedExpressTierId,
          couponsConfig,
          appliedCouponCode,
          shippingConfig,
          selectedShippingMethodId,
        });

        const modelResult = quote?.models?.[0];
        const totalPrice = modelResult?.totals?.subtotalAfterPerModelRounding ?? quote?.total ?? 0;

        results.push({
          key: mat.key,
          name: mat.name || mat.key,
          pricePerGram: mat.price_per_gram ?? null,
          totalPrice,
          isSelected: mat.key === currentMaterialKey,
        });
      } catch {
        // Skip materials that cause pricing errors
        results.push({
          key: mat.key,
          name: mat.name || mat.key,
          pricePerGram: mat.price_per_gram ?? null,
          totalPrice: null,
          isSelected: mat.key === currentMaterialKey,
          error: true,
        });
      }
    }

    // Sort by price (cheapest first), errors at the end
    results.sort((a, b) => {
      if (a.totalPrice === null && b.totalPrice === null) return 0;
      if (a.totalPrice === null) return 1;
      if (b.totalPrice === null) return -1;
      return a.totalPrice - b.totalPrice;
    });

    // Mark cheapest
    const cheapestPrice = results.find((r) => r.totalPrice !== null)?.totalPrice ?? null;
    for (const r of results) {
      r.isCheapest = r.totalPrice !== null && r.totalPrice === cheapestPrice;
    }

    // Get current selection price for diff calculation
    const currentPrice = results.find((r) => r.isSelected)?.totalPrice ?? null;
    for (const r of results) {
      if (r.totalPrice !== null && currentPrice !== null) {
        r.diff = r.totalPrice - currentPrice;
      } else {
        r.diff = null;
      }
    }

    // Max price for relative bar width
    const maxPrice = Math.max(...results.filter((r) => r.totalPrice !== null).map((r) => r.totalPrice), 1);
    for (const r of results) {
      r.barPct = r.totalPrice !== null ? (r.totalPrice / maxPrice) * 100 : 0;
    }

    return results;
  }, [
    hasSlicingResults,
    enabledMaterials,
    selectedFile,
    printConfigs,
    pricingConfig,
    feesConfig,
    feeSelections,
    currentMaterialKey,
    expressConfig,
    selectedExpressTierId,
    couponsConfig,
    appliedCouponCode,
    shippingConfig,
    selectedShippingMethodId,
  ]);

  const handleClick = useCallback(
    (materialKey) => {
      if (materialKey === currentMaterialKey) return;
      onMaterialChange?.(materialKey);
    },
    [currentMaterialKey, onMaterialChange],
  );

  // Don't render at all if no slicing results or fewer than 2 materials
  if (!hasSlicingResults || enabledMaterials.length < 2) return null;

  const formatPrice = (v) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '--';
    return `${Math.round(v)} ${t.currency}`;
  };

  const formatDiff = (v) => {
    if (v === null || v === undefined || !Number.isFinite(v) || v === 0) return null;
    const sign = v > 0 ? '+' : '';
    return `${sign}${Math.round(v)} ${t.currency}`;
  };

  return (
    <div style={styles.wrapper}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={styles.toggleBtn}
        aria-expanded={open}
        aria-controls="material-comparison-panel"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="BarChart3" size={15} style={{ color: 'var(--forge-accent-primary)' }} />
          {t.title}
        </span>
        <Icon
          name="ChevronDown"
          size={16}
          style={{
            color: 'var(--forge-text-muted)',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div id="material-comparison-panel" style={styles.content(open)}>
        {comparisonData === null ? (
          <div style={styles.noData}>{t.noMaterials}</div>
        ) : (
          <div style={styles.grid}>
            {comparisonData.map((item) => (
              <div
                key={item.key}
                role="button"
                tabIndex={item.isSelected ? -1 : 0}
                onClick={() => handleClick(item.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(item.key);
                  }
                }}
                style={styles.row(item.isSelected, item.isCheapest)}
                aria-label={`${item.name}: ${formatPrice(item.totalPrice)}`}
                aria-current={item.isSelected ? 'true' : undefined}
              >
                {/* Material name */}
                <span style={styles.materialName}>{item.name}</span>

                {/* Badges */}
                {item.isCheapest && (
                  <span style={styles.badge('cheapest')}>
                    {t.cheapest}
                  </span>
                )}
                {item.isSelected && (
                  <span style={styles.badge('selected')}>
                    {t.selected}
                  </span>
                )}

                {/* Price bar */}
                <div style={styles.barContainer}>
                  <div style={styles.bar(item.barPct, item.isCheapest)} />
                </div>

                {/* Price + diff */}
                <div style={styles.priceArea}>
                  <span style={styles.price}>
                    {item.error ? '--' : formatPrice(item.totalPrice)}
                  </span>
                  {!item.error && !item.isSelected && formatDiff(item.diff) && (
                    <span style={styles.diff(item.diff > 0)}>
                      {formatDiff(item.diff)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialComparison;
