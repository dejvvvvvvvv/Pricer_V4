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
  row: (isSelected) => ({
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
    flexWrap: 'wrap',
  }),
  presetName: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    flex: '0 0 auto',
    minWidth: '55px',
  },
  presetDesc: {
    fontSize: '11px',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    flex: '1 1 auto',
    minWidth: '80px',
  },
  metricsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: '0 0 auto',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-text-secondary)',
    whiteSpace: 'nowrap',
  },
  priceArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: '0 0 auto',
    minWidth: '80px',
    marginLeft: 'auto',
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
  badge: (type) => {
    const colorMap = {
      cheapest: {
        background: 'rgba(0, 212, 170, 0.12)',
        color: 'var(--forge-accent-primary)',
        border: '1px solid rgba(0, 212, 170, 0.25)',
      },
      fastest: {
        background: 'rgba(59, 130, 246, 0.12)',
        color: '#3B82F6',
        border: '1px solid rgba(59, 130, 246, 0.25)',
      },
      bestQuality: {
        background: 'rgba(168, 85, 247, 0.12)',
        color: '#A855F7',
        border: '1px solid rgba(168, 85, 247, 0.25)',
      },
      selected: {
        background: 'rgba(0, 212, 170, 0.06)',
        color: 'var(--forge-accent-primary)',
        border: '1px solid rgba(0, 212, 170, 0.15)',
      },
    };
    return {
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
      ...(colorMap[type] || colorMap.selected),
    };
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
 * Time multiplier estimates relative to "standard" (0.2mm) quality.
 * These are rough proportional estimates used when real per-preset
 * slicing data is not available.
 */
const TIME_MULTIPLIERS = {
  nozzle_06: 0.55,
  standard: 1.0,
  fine: 1.6,
};

/**
 * Quality rank — higher = better surface detail.
 * Used to determine the "best quality" badge.
 */
const QUALITY_RANK = {
  nozzle_06: 1,
  standard: 2,
  fine: 3,
};

/**
 * QualityComparison — shows a compact comparison of prices for the 3
 * quality presets (Basic / Middle / Pro), sorted by price.
 * Badges mark cheapest, fastest and best quality.
 * Click a row to apply that preset configuration.
 *
 * Only visible when slicing results are available.
 */
const QualityComparison = ({
  pricingConfig,
  feesConfig,
  feeSelections,
  selectedFile,
  printConfigs,
  currentConfig,
  onApplyPreset,
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
    title: language === 'en' ? 'Quality comparison' : 'Porovnani kvalit',
    cheapest: language === 'en' ? 'Cheapest' : 'Nejlevnejsi',
    fastest: language === 'en' ? 'Fastest' : 'Nejrychlejsi',
    bestQuality: language === 'en' ? 'Best quality' : 'Nejlepsi kvalita',
    selected: language === 'en' ? 'Selected' : 'Vybrany',
    noResults: language === 'en'
      ? 'Slice the model first to see quality comparison.'
      : 'Nejprve zpracujte model pro zobrazeni porovnani.',
    currency: language === 'en' ? 'CZK' : 'Kc',
    timeLabel: language === 'en' ? 'est.' : 'odhad',
  }), [language]);

  // The 3 quality presets (same as PrintConfiguration)
  const qualityPresets = useMemo(() => [
    {
      key: 'basic',
      name: 'Basic',
      description: language === 'en' ? 'Fast print, lower quality' : 'Rychly tisk, nizsi kvalita',
      settings: { quality: 'nozzle_06', infill: 15, supports: false },
    },
    {
      key: 'middle',
      name: 'Middle',
      description: language === 'en' ? 'Balanced quality and speed' : 'Vyvazena kvalita a rychlost',
      settings: { quality: 'standard', infill: 20, supports: true },
    },
    {
      key: 'pro',
      name: 'Pro',
      description: language === 'en' ? 'Highest quality, slower print' : 'Nejvyssi kvalita, pomalejsi tisk',
      settings: { quality: 'fine', infill: 30, supports: true },
    },
  ], [language]);

  const hasSlicingResults = selectedFile?.status === 'completed' && selectedFile?.result;

  // Determine which preset matches current config (if any)
  const currentPresetKey = useMemo(() => {
    if (!currentConfig) return null;
    for (const preset of qualityPresets) {
      const s = preset.settings;
      if (
        currentConfig.quality === s.quality &&
        currentConfig.infill === s.infill &&
        currentConfig.supports === s.supports
      ) {
        return preset.key;
      }
    }
    return null;
  }, [currentConfig, qualityPresets]);

  // Base estimated time from slicing result (seconds)
  const baseTimeSeconds = useMemo(() => {
    if (!hasSlicingResults) return null;
    const metrics = selectedFile?.result?.metrics || selectedFile?.result;
    return metrics?.estimatedTimeSeconds || metrics?.printTimeSeconds || null;
  }, [hasSlicingResults, selectedFile]);

  // Current quality key for time ratio baseline
  const currentQualityKey = currentConfig?.quality || 'standard';

  const comparisonData = useMemo(() => {
    if (!hasSlicingResults) return null;

    const fileId = selectedFile?.id;
    if (!fileId) return null;

    const results = [];

    for (const preset of qualityPresets) {
      try {
        const currentFileConfig = printConfigs?.[fileId] || {};
        const modifiedConfigs = {
          ...printConfigs,
          [fileId]: {
            ...currentFileConfig,
            ...preset.settings,
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

        // Estimate time proportionally
        let estimatedTime = null;
        if (baseTimeSeconds && baseTimeSeconds > 0) {
          const baseMultiplier = TIME_MULTIPLIERS[currentQualityKey] || 1;
          const presetMultiplier = TIME_MULTIPLIERS[preset.settings.quality] || 1;
          estimatedTime = Math.round(baseTimeSeconds * (presetMultiplier / baseMultiplier));
        }

        results.push({
          key: preset.key,
          name: preset.name,
          description: preset.description,
          qualityKey: preset.settings.quality,
          settings: preset.settings,
          totalPrice,
          estimatedTime,
          qualityRank: QUALITY_RANK[preset.settings.quality] || 0,
          isSelected: preset.key === currentPresetKey,
        });
      } catch {
        results.push({
          key: preset.key,
          name: preset.name,
          description: preset.description,
          qualityKey: preset.settings.quality,
          settings: preset.settings,
          totalPrice: null,
          estimatedTime: null,
          qualityRank: QUALITY_RANK[preset.settings.quality] || 0,
          isSelected: preset.key === currentPresetKey,
          error: true,
        });
      }
    }

    // Sort by price (cheapest first)
    results.sort((a, b) => {
      if (a.totalPrice === null && b.totalPrice === null) return 0;
      if (a.totalPrice === null) return 1;
      if (b.totalPrice === null) return -1;
      return a.totalPrice - b.totalPrice;
    });

    // Determine badges
    const validResults = results.filter((r) => r.totalPrice !== null);
    if (validResults.length > 0) {
      // Cheapest
      const cheapestPrice = validResults[0].totalPrice;
      for (const r of results) {
        r.isCheapest = r.totalPrice !== null && r.totalPrice === cheapestPrice;
      }

      // Fastest (lowest estimated time)
      const withTime = validResults.filter((r) => r.estimatedTime !== null && r.estimatedTime > 0);
      if (withTime.length > 0) {
        const fastestTime = Math.min(...withTime.map((r) => r.estimatedTime));
        for (const r of results) {
          r.isFastest = r.estimatedTime !== null && r.estimatedTime === fastestTime;
        }
      }

      // Best quality (highest quality rank)
      const maxRank = Math.max(...validResults.map((r) => r.qualityRank));
      for (const r of results) {
        r.isBestQuality = r.qualityRank === maxRank && r.totalPrice !== null;
      }
    }

    // Price diff relative to current selection
    const currentPrice = results.find((r) => r.isSelected)?.totalPrice ?? null;
    for (const r of results) {
      if (r.totalPrice !== null && currentPrice !== null) {
        r.diff = r.totalPrice - currentPrice;
      } else {
        r.diff = null;
      }
    }

    return results;
  }, [
    hasSlicingResults,
    selectedFile,
    qualityPresets,
    printConfigs,
    pricingConfig,
    feesConfig,
    feeSelections,
    expressConfig,
    selectedExpressTierId,
    couponsConfig,
    appliedCouponCode,
    shippingConfig,
    selectedShippingMethodId,
    baseTimeSeconds,
    currentQualityKey,
    currentPresetKey,
  ]);

  const handleClick = useCallback(
    (presetKey) => {
      if (presetKey === currentPresetKey) return;
      const preset = qualityPresets.find((p) => p.key === presetKey);
      if (preset) {
        onApplyPreset?.(preset.settings);
      }
    },
    [currentPresetKey, onApplyPreset, qualityPresets],
  );

  // Don't render if no slicing results
  if (!hasSlicingResults) return null;

  const formatPrice = (v) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '--';
    return `${Math.round(v)} ${t.currency}`;
  };

  const formatDiff = (v) => {
    if (v === null || v === undefined || !Number.isFinite(v) || v === 0) return null;
    const sign = v > 0 ? '+' : '';
    return `${sign}${Math.round(v)} ${t.currency}`;
  };

  const formatTime = (seconds) => {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0) return `~${h}h ${m}m`;
    return `~${m}m`;
  };

  return (
    <div style={styles.wrapper}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={styles.toggleBtn}
        aria-expanded={open}
        aria-controls="quality-comparison-panel"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="Layers" size={15} style={{ color: 'var(--forge-accent-primary)' }} />
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

      <div id="quality-comparison-panel" style={styles.content(open)}>
        {comparisonData === null ? (
          <div style={styles.noData}>{t.noResults}</div>
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
                style={styles.row(item.isSelected)}
                aria-label={`${item.name}: ${formatPrice(item.totalPrice)}${item.estimatedTime ? `, ${formatTime(item.estimatedTime)}` : ''}`}
                aria-current={item.isSelected ? 'true' : undefined}
              >
                {/* Preset name */}
                <span style={styles.presetName}>{item.name}</span>

                {/* Description */}
                <span style={styles.presetDesc}>{item.description}</span>

                {/* Badges */}
                {item.isCheapest && (
                  <span style={styles.badge('cheapest')}>
                    {t.cheapest}
                  </span>
                )}
                {item.isFastest && !item.isCheapest && (
                  <span style={styles.badge('fastest')}>
                    {t.fastest}
                  </span>
                )}
                {item.isBestQuality && (
                  <span style={styles.badge('bestQuality')}>
                    {t.bestQuality}
                  </span>
                )}
                {item.isSelected && (
                  <span style={styles.badge('selected')}>
                    {t.selected}
                  </span>
                )}

                {/* Metrics: estimated time */}
                {formatTime(item.estimatedTime) && (
                  <div style={styles.metricsRow}>
                    <span style={styles.metric}>
                      <Icon name="Clock" size={12} />
                      {formatTime(item.estimatedTime)}
                    </span>
                  </div>
                )}

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

export default QualityComparison;
