import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';
import PriceBreakdownChart from '../../../components/charts/PriceBreakdownChart';
import PrintTimeVisualization from './PrintTimeVisualization';
import FilamentUsageVisualization from './FilamentUsageVisualization';
import PricingHistory from './PricingHistory';
import VolumeDiscountChart from './VolumeDiscountChart';
import PricingShareMenu from './PricingShareMenu';
import { usePricingHistory } from '../../../hooks/usePricingHistory';
import { useLanguage } from '../../../contexts/LanguageContext';
import '../../../styles/animations.css';

/* ── FORGE style objects ─────────────────────────────────────────────────── */
const fg = {
  card: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
  },
  sectionTitle: {
    fontSize: 'var(--forge-text-lg)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  mono: {
    fontFamily: 'var(--forge-font-mono)',
  },
  totalLabel: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  totalValue: {
    fontSize: 'var(--forge-text-2xl)',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-mono)',
    letterSpacing: '-0.02em',
  },
  totalRow: {
    paddingTop: '0.5rem',
    borderTop: '2px solid var(--forge-accent-primary)',
  },
  infoBox: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
  },
  errorBox: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid rgba(255, 71, 87, 0.3)',
    background: 'rgba(255, 71, 87, 0.06)',
  },
  summaryCard: {
    padding: '1rem',
    borderRadius: 'var(--forge-radius-xl)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
  },
  modelCard: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-surface)',
  },
  devCard: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
  },
  devInnerCard: {
    padding: '0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'rgba(14, 16, 21, 0.4)',
  },
  volumeDiscountBox: {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    background: 'rgba(0, 212, 170, 0.06)',
    border: '1px solid rgba(0, 212, 170, 0.2)',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10px',
    fontFamily: 'var(--forge-font-mono)',
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    border: '1px solid var(--forge-border-default)',
    color: 'var(--forge-text-muted)',
    background: 'var(--forge-bg-surface)',
  },
  leader: {
    flex: 1,
    borderBottom: '1px dotted var(--forge-border-active)',
    margin: '0 0.5rem',
    minWidth: '1rem',
    alignSelf: 'flex-end',
    marginBottom: '0.25rem',
  },
};

function formatCzk(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} Kč`;
  }
}

function formatSignedCzk(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  const s = formatCzk(Math.abs(n));
  return n < 0 ? `- ${s}` : `+ ${s}`;
}

function formatPct(value) {
  const n = Number.isFinite(value) ? value : 0;
  const sign = n < 0 ? '-' : '+';
  return `${sign} ${Math.abs(n)} %`;
}

function formatFeeLabel(fee) {
  if (!fee) return '';
  const v = Number(fee.value);
  const type = String(fee.type || '');
  if (type === 'percent') return formatPct(v);

  const signed = (x) => (Number.isFinite(x) ? (x < 0 ? '-' : '+') : '+');
  const s = signed(v);
  const abs = Math.abs(Number.isFinite(v) ? v : 0);

  if (type === 'flat') return `${s} ${formatCzk(abs)}`;
  if (type === 'per_gram') return `${s} ${abs} Kč/g`;
  if (type === 'per_minute') return `${s} ${abs} Kč/min`;
  if (type === 'per_cm3') return `${s} ${abs} Kč/cm³`;
  if (type === 'per_cm2') return `${s} ${abs} Kč/cm²`;
  if (type === 'per_piece') return `${s} ${formatCzk(abs)} / kus`;
  return `${s} ${abs}`;
}

function MiniRow({ label, value, emphasize = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontWeight: emphasize ? 600 : 400 }}>
      <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-body)' }}>{label}</span>
      <div style={fg.leader} />
      <span style={{ fontSize: emphasize ? 'var(--forge-text-base)' : 'var(--forge-text-sm)', color: emphasize ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap', fontWeight: emphasize ? 700 : 400 }}>{value}</span>
    </div>
  );
}

/* ── Inline slicing progress indicator ─────────────────────────────────── */
const SLICING_STEPS = [
  { key: 'upload', labelKey: 'calc.pricing.processingStepUpload', icon: 'Upload' },
  { key: 'analyze', labelKey: 'calc.pricing.processingStepAnalyze', icon: 'Search' },
  { key: 'calculate', labelKey: 'calc.pricing.processingStepCalculate', icon: 'Calculator' },
];

const shimmerCSS = `
@keyframes tk-pricing-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.tk-shimmer {
  position: relative;
  overflow: hidden;
}
.tk-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
  animation: tk-shimmer-sweep 1.5s ease-in-out infinite;
}
@keyframes tk-shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;

function SlicingProgressInline({ uploadedFiles: files }) {
  const { t } = useLanguage();
  const allFiles = Array.isArray(files) ? files : [];
  const processing = allFiles.filter((f) => f?.status === 'processing');
  const pending = allFiles.filter((f) => f?.status === 'pending');

  // Animate through steps while processing is active
  const [animStep, setAnimStep] = useState(0);
  const isProcessing = processing.length > 0;

  useEffect(() => {
    if (!isProcessing) {
      setAnimStep(0);
      return;
    }
    // Advance through the 3 steps with varying delays
    const delays = [0, 700, 1500];
    const timers = delays.map((delay, idx) =>
      setTimeout(() => setAnimStep(idx), delay)
    );
    // After reaching last step, cycle back to step 1 (keep it feeling alive)
    const cycle = setInterval(() => {
      setAnimStep((prev) => (prev >= SLICING_STEPS.length - 1 ? 1 : prev + 1));
    }, 2200);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cycle);
    };
  }, [isProcessing]);

  if (processing.length === 0 && pending.length === 0) return null;

  const activeStep = isProcessing ? animStep : 0;

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--forge-radius-xl)',
        border: '1px solid var(--forge-border-default)',
        background: 'var(--forge-bg-elevated)',
      }}
      role="status"
      aria-label={`${t('calc.pricing.processingAriaLabel')}: ${processing.length} ${t('calc.pricing.processing').toLowerCase()}, ${pending.length}`}
      aria-live="polite"
    >
      <style>{shimmerCSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: 'var(--forge-accent-primary)',
            animation: 'tk-pricing-pulse 1.5s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <span style={{
          fontSize: 'var(--forge-text-sm)',
          fontWeight: 600,
          color: 'var(--forge-text-primary)',
          fontFamily: 'var(--forge-font-heading)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {t('calc.pricing.processing')}{processing.length > 0 ? ` (${processing.length})` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }} role="group" aria-label={t('calc.pricing.processingProgress')}>
        {SLICING_STEPS.map((step, idx) => (
          <div key={step.key} aria-label={`${t(step.labelKey)}: ${idx < activeStep ? 'ok' : idx === activeStep ? 'active' : 'waiting'}`} style={{
            flex: 1,
            height: '3px',
            borderRadius: '2px',
            background: idx < activeStep
              ? 'var(--forge-accent-primary)'
              : idx === activeStep
                ? 'linear-gradient(90deg, var(--forge-accent-primary) 0%, rgba(0, 212, 170, 0.3) 100%)'
                : 'var(--forge-bg-surface)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {SLICING_STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          const isFuture = idx > activeStep;

          return (
            <div key={step.key} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: isFuture ? 0.35 : 1,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone
                  ? 'var(--forge-accent-primary)'
                  : isActive
                    ? 'rgba(0, 212, 170, 0.15)'
                    : 'var(--forge-bg-surface)',
                color: isDone
                  ? 'var(--forge-bg-void)'
                  : isActive
                    ? 'var(--forge-accent-primary)'
                    : 'var(--forge-text-muted)',
                border: isActive ? '1px solid var(--forge-accent-primary)' : '1px solid transparent',
              }}>
                {isDone ? <Icon name="Check" size={12} /> : <Icon name={step.icon} size={12} />}
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--forge-font-body)',
                color: isActive ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
                fontWeight: isActive ? 600 : 400,
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {t(step.labelKey)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Shimmer skeleton for pricing while loading */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 0.7, 0.85].map((w, i) => (
          <div key={i} className="tk-shimmer" style={{
            height: '0.75rem',
            borderRadius: 'var(--forge-radius-sm)',
            background: 'var(--forge-bg-surface)',
            width: `${w * 100}%`,
          }} />
        ))}
        <div style={{ paddingTop: '0.5rem', borderTop: '2px solid var(--forge-border-default)' }}>
          <div className="tk-shimmer" style={{
            height: '1.5rem',
            borderRadius: 'var(--forge-radius-sm)',
            background: 'var(--forge-bg-surface)',
            width: '50%',
            marginLeft: 'auto',
          }} />
        </div>
      </div>
    </div>
  );
}

export default function PricingCalculator({
  selectedFile,
  onSlice,
  totalModels,
  onSliceAll,
  sliceAllLoading,
  uploadedFiles,
  printConfigs,
  pricingConfig,
  feesConfig,
  feeSelections,
  expressConfig,
  selectedExpressTierId,
  shippingConfig,
  selectedShippingMethodId,
  couponsConfig,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onApplyHistoryConfig,
  getShareableUrl,
}) {
  const { t } = useLanguage();
  const [showDeveloper, setShowDeveloper] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const { history, addEntry, clearHistory, compareEntries } = usePricingHistory();

  const readyModels = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    return files.filter((f) => f?.status === 'completed' && f?.result);
  }, [uploadedFiles]);

  const incompleteModels = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    return files.filter((f) => !(f?.status === 'completed' && f?.result));
  }, [uploadedFiles]);

  const isPartial = incompleteModels.length > 0 && readyModels.length > 0;

  const quoteState = useMemo(() => {
    if (!pricingConfig) return { quote: null, error: null, isPartial: false };
    if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) return { quote: null, error: null, isPartial: false };

    // Calculate quote from completed models only (progressive pricing).
    // If some models are still pending/processing, show partial total.
    const modelsForQuote = readyModels.length > 0 ? readyModels : [];
    if (modelsForQuote.length === 0) return { quote: null, error: null, isPartial: false };

    try {
      const quote = calculateOrderQuote({
        uploadedFiles: modelsForQuote,
        printConfigs,
        pricingConfig,
        feesConfig,
        feeSelections,
        expressConfig,
        selectedExpressTierId,
        shippingConfig,
        selectedShippingMethodId,
        couponsConfig,
        appliedCouponCode,
      });
      return { quote, error: null, isPartial: incompleteModels.length > 0 };
    } catch (e) {
      return { quote: null, error: e instanceof Error ? e.message : String(e), isPartial: false };
    }
  }, [pricingConfig, uploadedFiles, readyModels, printConfigs, feesConfig, feeSelections, incompleteModels.length, expressConfig, selectedExpressTierId, shippingConfig, selectedShippingMethodId, couponsConfig, appliedCouponCode]);

  const quote = quoteState.quote;

  // Track pricing history — record each successful non-partial quote
  const lastRecordedTotal = useRef(null);
  useEffect(() => {
    if (!quote || quoteState.isPartial || quoteState.error) return;
    // Avoid recording the same total twice in a row (no config change)
    if (lastRecordedTotal.current === quote.total) return;
    lastRecordedTotal.current = quote.total;

    // Build a config summary from the first model's printConfig
    const firstModelId = readyModels[0]?.id;
    const cfg = firstModelId && printConfigs ? printConfigs[firstModelId] : {};

    addEntry(
      {
        material: cfg?.material,
        quality: cfg?.quality,
        infill: cfg?.infill,
        supports: cfg?.supports,
        quantity: cfg?.quantity,
        modelCount: readyModels.length,
      },
      {
        total: quote.total,
        breakdown: {
          material: quote.simple?.material,
          time: quote.simple?.time,
          services: quote.simple?.services,
          discount: quote.simple?.discount,
          markup: quote.simple?.markup,
        },
      },
    );
  }, [quote, quoteState.isPartial, quoteState.error, readyModels, printConfigs, addEntry]);

  // Detect invalid coupon: code was applied but engine did not produce a coupon discount
  const prevAppliedRef = useRef('');
  useEffect(() => {
    if (!appliedCouponCode) {
      setCouponError('');
      return;
    }
    // Only show error after a fresh apply (not on mount with stale code)
    if (prevAppliedRef.current === appliedCouponCode) return;
    prevAppliedRef.current = appliedCouponCode;

    if (quote && !quote.coupon) {
      setCouponError(t('calc.pricing.couponInvalid'));
      // Auto-remove the invalid code so the engine is not stuck with it
      onRemoveCoupon?.();
    } else if (quote && quote.coupon) {
      setCouponError('');
      setCouponInput('');
    }
  }, [appliedCouponCode, quote, onRemoveCoupon]);

  // Build print-only model list
  const printDate = new Date().toLocaleDateString('cs-CZ');
  const printTime = new Date().toLocaleTimeString('cs-CZ');

  return (
    <Card style={fg.card} role="region" aria-label={t('calc.pricing.title')}>
      {/* Print-only header — visible only when printing */}
      <div className="print-header" aria-hidden="true">
        <h1>{t('calc.pricing.printHeader')}</h1>
        <p>{t('calc.pricing.printGenerated')}: {printDate} v {printTime}</p>
      </div>

      <CardHeader style={{ paddingBottom: '0.75rem' }}>
        <div className="tk-pricing-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <CardTitle style={fg.sectionTitle}>{t('calc.pricing.title')}</CardTitle>
            <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--forge-font-body)' }}>
              Výpočet používá Admin Pricing + Admin Fees (tenant) a pipeline base → fees → markup → minima → rounding.
            </p>
          </div>
          <div className="tk-pricing-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PricingShareMenu
              getShareableUrl={getShareableUrl}
              quote={quote}
              uploadedFiles={uploadedFiles}
              printConfigs={printConfigs}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeveloper((v) => !v)}
              iconName="Code2"
              iconPosition="left"
              data-no-print
              aria-pressed={showDeveloper}
              aria-label={showDeveloper ? t('calc.pricing.ariaToggleCustomer') : t('calc.pricing.ariaToggleDeveloper')}
            >
              {showDeveloper ? t('calc.pricing.viewCustomer') : t('calc.pricing.viewDeveloper')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Actions */}
        <div className="tk-pricing-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} data-no-print>
          <Button
            variant="outline"
            size="sm"
            onClick={onSliceAll}
            loading={sliceAllLoading}
            disabled={sliceAllLoading || (Array.isArray(uploadedFiles) && uploadedFiles.some((f) => f.status === 'processing'))}
            iconName="Layers"
            iconPosition="left"
          >
            {t('calc.pricing.recalcAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSlice}
            disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllLoading}
            iconName="RefreshCw"
            iconPosition="left"
          >
            {t('calc.pricing.recalcSelected')}
          </Button>
        </div>

        {/* Readiness */}
        {incompleteModels.length > 0 && (
          <div style={fg.infoBox}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Icon name="Info" size={16} style={{ marginTop: '2px', color: 'var(--forge-text-muted)' }} />
              <div>
                <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>
                  {readyModels.length > 0
                    ? `${t('calc.pricing.progressLabel')} (${readyModels.length}/${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} ${t('calc.pricing.modelsCount')})`
                    : t('calc.pricing.waitingSlice')}
                </p>
                <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--forge-font-mono)' }}>
                  {t('calc.pricing.doneOf')}: {readyModels.length} / {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels}
                  {readyModels.length > 0 && ` ${t('calc.pricing.updatesPerModel')}`}
                </p>
                {incompleteModels.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', listStyleType: 'disc', paddingLeft: '1.25rem', fontFamily: 'var(--forge-font-mono)' }}>
                    {incompleteModels.slice(0, 4).map((f) => (
                      <li key={f.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name} — {f.status === 'processing' ? t('calc.recalc.running') : f.status === 'failed' ? t('calc.pricing.calcError') : '...'}
                      </li>
                    ))}
                    {incompleteModels.length > 4 && <li>…</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {quoteState.error ? (
          <div style={fg.errorBox} role="alert">
            <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-error)' }}>{t('calc.pricing.calcError')}</p>
            <p style={{ fontSize: 'var(--forge-text-xs)', marginTop: '0.25rem', color: 'var(--forge-error)', wordBreak: 'break-word', fontFamily: 'var(--forge-font-mono)' }}>{quoteState.error}</p>
          </div>
        ) : null}

        {/* Inline slicing progress — shown when models are being processed */}
        {!quote && <SlicingProgressInline uploadedFiles={uploadedFiles} />}

        {/* Main totals */}
        {quote && (() => {
          // Compute total quantity across all ready models for per-unit price display
          const displayTotal = Number.isFinite(quote?.grandTotal) ? quote.grandTotal : quote.total;
          const totalQty = readyModels.reduce((sum, f) => {
            const q = printConfigs?.[f.id]?.quantity;
            return sum + (Number.isFinite(Number(q)) ? Math.max(1, Number(q)) : 1);
          }, 0);
          const showPerUnit = totalQty > 1 && Number.isFinite(displayTotal) && displayTotal > 0;
          const perUnitPrice = showPerUnit ? displayTotal / totalQty : null;

          return (
          <div className="scale-fade-in" style={fg.summaryCard} aria-live="polite" aria-atomic="true">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={fg.totalLabel} id="tk-total-label">
                  {quoteState.isPartial ? `${t('calc.pricing.partialLabel')} (${readyModels.length} z ${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels})` : t('calc.pricing.totalLabel')}
                </p>
                <p
                  aria-labelledby="tk-total-label"
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    fontFamily: 'var(--forge-font-mono)',
                    letterSpacing: '-0.03em',
                    color: quoteState.isPartial ? 'var(--forge-text-muted)' : 'var(--forge-accent-primary)',
                    lineHeight: 1.1,
                    textShadow: quoteState.isPartial ? 'none' : '0 0 20px rgba(0, 212, 170, 0.15)',
                  }}
                >{formatCzk(displayTotal)}</p>
                {showPerUnit && (
                  <p style={{
                    fontSize: 'var(--forge-text-sm)',
                    color: 'var(--forge-text-secondary)',
                    fontFamily: 'var(--forge-font-mono)',
                    marginTop: '0.25rem',
                  }}>
                    {formatCzk(perUnitPrice)} / kus ({totalQty} ks)
                  </p>
                )}
                {(quote.flags?.min_order_total_applied || quote.flags?.clamped_to_zero) && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {quote.flags?.min_order_total_applied && (
                      <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>{t('calc.pricing.minOrderApplied')}</p>
                    )}
                    {quote.flags?.clamped_to_zero && (
                      <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>{t('calc.pricing.clampedToZero')}</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <MiniRow label={t('calc.pricing.material')} value={formatCzk(quote.simple.material)} />
                <MiniRow label={t('calc.pricing.printTime')} value={formatCzk(quote.simple.time)} />
                <MiniRow label={t('calc.pricing.services')} value={formatSignedCzk(quote.simple.services)} />
                <MiniRow label={t('calc.pricing.discount')} value={formatSignedCzk(quote.simple.discount)} />
                {quote.flags?.volume_discount_applied && quote.volumeDiscount && (
                  <div style={fg.volumeDiscountBox}>
                    <MiniRow
                      label={`Množstevní sleva (${quote.volumeDiscount.mode === 'percent' ? '%' : 'fixní'})`}
                      value={`- ${formatCzk(quote.volumeDiscount.totalSavings)}`}
                    />
                    {quote.volumeDiscount.details
                      .filter((d) => d.applied && d.tier)
                      .slice(0, 3)
                      .map((d) => (
                        <p key={d.modelId} style={{ fontSize: '11px', color: 'var(--forge-accent-primary)', marginTop: '0.125rem', fontFamily: 'var(--forge-font-mono)' }}>
                          {d.tier.min_qty}+ ks: {quote.volumeDiscount.mode === 'percent'
                            ? `−${d.tier.value}%`
                            : `${formatCzk(d.tier.value)}/ks`}
                          {d.tier.label ? ` (${d.tier.label})` : ''}
                        </p>
                      ))}
                  </div>
                )}
                <MiniRow label={t('calc.pricing.markup')} value={formatSignedCzk(quote.simple.markup)} />

                {/* Express surcharge line */}
                {quote.flags?.express_applied && quote.express && (
                  <MiniRow
                    label={`Express (${quote.express.tierId || ''})`}
                    value={`+ ${formatCzk(quote.express.surchargeTotal)}`}
                  />
                )}

                {/* Shipping cost line */}
                {quote.shipping && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--forge-radius-md)',
                    background: quote.shipping.freeShippingApplied ? 'rgba(0, 212, 170, 0.06)' : 'transparent',
                    border: quote.shipping.freeShippingApplied ? '1px solid rgba(0, 212, 170, 0.2)' : 'none',
                  }}>
                    <span style={{
                      fontSize: 'var(--forge-text-sm)',
                      color: quote.shipping.freeShippingApplied ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                      fontFamily: 'var(--forge-font-body)',
                    }}>
                      {quote.shipping.name || t('calc.pricing.shipping')}
                    </span>
                    <span style={{
                      fontSize: 'var(--forge-text-sm)',
                      fontFamily: 'var(--forge-font-mono)',
                      fontWeight: 500,
                      color: quote.shipping.freeShippingApplied ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)',
                    }}>
                      {quote.shipping.freeShippingApplied ? t('calc.pricing.shippingFree') : `+ ${formatCzk(quote.shipping.cost)}`}
                    </span>
                  </div>
                )}

                {/* Coupon discount line */}
                {quote.coupon && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--forge-radius-md)',
                    background: 'rgba(0, 212, 170, 0.06)',
                    border: '1px solid rgba(0, 212, 170, 0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                      <Icon name="Check" size={14} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
                      <span style={{
                        fontSize: 'var(--forge-text-sm)',
                        color: 'var(--forge-accent-primary)',
                        fontFamily: 'var(--forge-font-body)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {t('calc.pricing.couponDiscount')} ({quote.coupon.code})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{
                        fontSize: 'var(--forge-text-sm)',
                        color: 'var(--forge-accent-primary)',
                        fontFamily: 'var(--forge-font-mono)',
                        fontWeight: 600,
                      }}>
                        - {formatCzk(quote.coupon.discount)}
                      </span>
                      {onRemoveCoupon && (
                        <button
                          type="button"
                          onClick={onRemoveCoupon}
                          aria-label={t('calc.pricing.removeCoupon')}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.125rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--forge-text-muted)',
                          }}
                        >
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Coupon input field */}
                {!quote.coupon && couponsConfig?.enabled && onApplyCoupon && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }} data-no-print>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const code = couponInput.trim();
                            if (!code) return;
                            onApplyCoupon(code);
                            setCouponError('');
                          }
                        }}
                        placeholder={t('calc.pricing.couponPlaceholder')}
                        aria-label={t('calc.pricing.couponPlaceholder')}
                        style={{
                          flex: 1,
                          padding: '0.375rem 0.625rem',
                          fontSize: 'var(--forge-text-sm)',
                          fontFamily: 'var(--forge-font-mono)',
                          color: 'var(--forge-text-primary)',
                          background: 'var(--forge-bg-elevated)',
                          border: couponError
                            ? '1px solid var(--forge-error, #FF4757)'
                            : '1px solid var(--forge-border-default)',
                          borderRadius: 'var(--forge-radius-md)',
                          outline: 'none',
                          transition: 'border-color 0.15s',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          minWidth: 0,
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const code = couponInput.trim();
                          if (!code) return;
                          onApplyCoupon(code);
                          setCouponError('');
                        }}
                        disabled={!couponInput.trim()}
                        style={{ flexShrink: 0 }}
                      >
                        {t('calc.pricing.couponApply')}
                      </Button>
                    </div>
                    {couponError && (
                      <p
                        role="alert"
                        style={{
                          fontSize: 'var(--forge-text-xs)',
                          color: 'var(--forge-error, #FF4757)',
                          fontFamily: 'var(--forge-font-body)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Icon name="X" size={12} />
                        {couponError}
                      </p>
                    )}
                  </div>
                )}

                <div style={fg.totalRow} />
                <MiniRow label={t('calc.pricing.orderTotal')} value={formatCzk(displayTotal)} emphasize />
              </div>

              {/* Donut chart — price breakdown visualization */}
              <div className="tk-pricing-chart">
                <PriceBreakdownChart quote={quote} />
              </div>

              {/* Print time estimation */}
              <PrintTimeVisualization uploadedFiles={uploadedFiles} />

              {/* Filament usage visualization */}
              <FilamentUsageVisualization uploadedFiles={uploadedFiles} />

              {/* Volume discount chart */}
              <VolumeDiscountChart
                uploadedFiles={uploadedFiles}
                printConfigs={printConfigs}
                pricingConfig={pricingConfig}
                feesConfig={feesConfig}
                feeSelections={feeSelections}
              />
            </div>
          </div>
          );
        })()}

        {/* Pricing history panel */}
        <PricingHistory
          history={history}
          onApplyConfig={onApplyHistoryConfig || null}
          onClearHistory={clearHistory}
          compareEntries={compareEntries}
        />

        {/* Simple customer breakdown */}
        {quote && !showDeveloper && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('calc.pricing.orderBreakdown')}</h4>
              <span style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>{Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} {t('calc.pricing.modelsCount')}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quote.models.map((m) => (
                <div key={m.id} style={fg.modelCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                        {m.quantity}× • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-mono)' }}>{formatCzk(m.totals.subtotalAfterPerModelRounding)}</p>
                      {m.quantity > 1 && Number.isFinite(m.totals.subtotalAfterPerModelRounding) && (
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                          {formatCzk(m.totals.subtotalAfterPerModelRounding / m.quantity)} / {t('calc.pricing.perPiece')}
                        </p>
                      )}
                      {m.flags?.min_price_per_model_applied && (
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)' }}>{t('calc.pricing.minPerModel')}</p>
                      )}
                    </div>
                  </div>

                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
                      {t('calc.pricing.modelServices')}
                    </summary>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {m.fees
                        .filter((f) => f.applied && (f.amount !== 0 || f.required))
                        .map((f) => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              {f.required && (
                                <span style={fg.pill}>{t('calc.pricing.includedInPrice')}</span>
                              )}
                            </div>
                            <span style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{formatSignedCzk(f.amount)}</span>
                          </div>
                        ))}
                      {m.fees.filter((f) => f.applied && (f.amount !== 0 || f.required)).length === 0 && (
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)' }}>{t('calc.pricing.noServices')}</p>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {quote.orderFees?.some((f) => f.applied && (f.amount !== 0 || f.required)) && (
              <div style={fg.modelCard}>
                <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{t('calc.pricing.orderFees')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {quote.orderFees
                    .filter((f) => f.applied && (f.amount !== 0 || f.required))
                    .map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {f.name}
                          {f.required && (
                            <span style={fg.pill}>{t('calc.pricing.includedInPrice')}</span>
                          )}
                        </span>
                        <span style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{formatSignedCzk(f.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Developer breakdown */}
        {quote && showDeveloper && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={fg.devCard}>
              <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Developer breakdown</p>
              <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--forge-font-body)' }}>
                U každé fee uvidíš MATCH/NO MATCH a důvody včetně vyhodnocení conditions.
              </p>
            </div>

            <details style={fg.devCard} open>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase' }}>Order totals (raw)</summary>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: 'var(--forge-text-xs)' }}>
                <MiniRow label="modelsTotal" value={formatCzk(quote.totals.modelsTotal)} />
                {quote.totals.volumeDiscountTotal > 0 && (
                  <MiniRow label="volumeDiscountTotal" value={`- ${formatCzk(quote.totals.volumeDiscountTotal)}`} />
                )}
                <MiniRow label="orderFeesTotal" value={formatSignedCzk(quote.totals.orderFeesTotal)} />
                <MiniRow label="subtotalBeforeMarkup" value={formatCzk(quote.totals.subtotalBeforeMarkup)} />
                <MiniRow label="markupAmount" value={formatSignedCzk(quote.totals.markupAmount)} />
                <MiniRow label="totalAfterMarkup" value={formatCzk(quote.totals.totalAfterMarkup)} />
                <MiniRow label="totalRounded" value={formatCzk(quote.totals.totalRounded)} />
              </div>
            </details>

            <details style={fg.devCard} open>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase' }}>Model breakdown</summary>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quote.models.map((m) => (
                  <details key={m.id} style={fg.devCard} open={false}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                          {m.status} • {m.quantity}× • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 700, color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-mono)' }}>{formatCzk(m.totals.subtotalAfterPerModelRounding)}</p>
                      </div>
                    </summary>

                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      <div style={fg.devInnerCard}>
                        <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Base</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: 'var(--forge-text-xs)' }}>
                          <MiniRow label="filamentGrams" value={`${m.base.filamentGrams.toFixed(2)} g`} />
                          <MiniRow label="estimatedTimeSeconds" value={`${Math.round(m.base.estimatedTimeSeconds)} s`} />
                          <MiniRow label="billedMinutes" value={`${Math.round(m.base.billedMinutes)} min`} />
                          <MiniRow label="pricePerGram" value={`${m.base.pricePerGram} Kč/g`} />
                          <MiniRow label="ratePerHour" value={`${m.base.ratePerHour} Kč/h`} />
                          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--forge-border-default)' }} />
                          <MiniRow label="materialCostPerPiece" value={formatCzk(m.base.materialCostPerPiece)} />
                          <MiniRow label="timeCostPerPiece" value={formatCzk(m.base.timeCostPerPiece)} />
                          <MiniRow label="basePerPiece" value={formatCzk(m.base.basePerPiece)} />
                          <MiniRow label="baseTotal" value={formatCzk(m.base.baseTotal)} emphasize />
                        </div>
                      </div>

                      <div style={fg.devInnerCard}>
                        <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>MODEL fees</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {m.fees.map((f) => (
                            <details key={f.id} style={{ padding: '0.5rem', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-surface)' }} open={false}>
                              <summary style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                                    {(f.reason?.surface_unavailable ? 'SKIPPED' : (f.applied ? 'MATCH' : 'NO MATCH'))} • {f.scope} • {formatFeeLabel(f)}
                                  </p>
                                </div>
                                <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{formatSignedCzk(f.amount)}</p>
                              </summary>

                              <div style={{ marginTop: '0.5rem', fontSize: '11px', color: 'var(--forge-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                                  <MiniRow label="apply" value={String(!!f.reason?.apply)} />
                                  <MiniRow label="match" value={String(!!f.reason?.match)} />
                                  <MiniRow label="targetOk" value={String(!!f.reason?.targetOk)} />
                                  {f.reason?.surface_unavailable && <MiniRow label="surface" value="unavailable (fee skipped)" />}
                                  <MiniRow label="charge_basis" value={String(f.charge_basis || '')} />
                                  {Number.isFinite(f.unit_amount) && <MiniRow label="unit_amount" value={String(f.unit_amount)} />}
                                  {Number.isFinite(f.percent_base_per_piece) && (
                                    <MiniRow label="percent_base_per_piece" value={formatCzk(f.percent_base_per_piece)} />
                                  )}
                                </div>

                                {Array.isArray(f.reason?.conditions) && f.reason.conditions.length > 0 && (
                                  <div>
                                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase' }}>Conditions</p>
                                    <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      {f.reason.conditions.map((c, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--forge-font-mono)' }}>{c.field} {c.op} {String(c.value)}</span>
                                          <span style={{ color: c.ok ? 'var(--forge-success)' : 'var(--forge-error)', fontFamily: 'var(--forge-font-mono)', fontWeight: 600 }}>{c.ok ? 'OK' : 'FAIL'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </details>

            <details style={fg.devCard} open={false}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase' }}>ORDER fees</summary>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quote.orderFees.map((f) => (
                  <details key={f.id} style={{ padding: '0.5rem', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-surface)' }} open={false}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                          {(f.reason?.surface_unavailable ? 'SKIPPED' : (f.applied ? 'MATCH' : 'NO MATCH'))} • {f.scope} • {formatFeeLabel(f)}
                        </p>
                      </div>
                      <p style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{formatSignedCzk(f.amount)}</p>
                    </summary>

                    <div style={{ marginTop: '0.5rem', fontSize: '11px', color: 'var(--forge-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                        <MiniRow label="apply" value={String(!!f.reason?.apply)} />
                        <MiniRow label="hasSubset" value={String(!!f.reason?.hasSubset)} />
                        <MiniRow label="subset" value={Array.isArray(f.subset) ? f.subset.join(', ') : ''} />
                        {f.reason?.surface_unavailable && (
                          <MiniRow
                            label="surface"
                            value={`unavailable (fee skipped)${Array.isArray(f.reason?.surface_unavailable_models) ? `; missing: ${f.reason.surface_unavailable_models.join(', ')}` : ''}`}
                          />
                        )}
                        {Number.isFinite(f.percent_base) && <MiniRow label="percent_base" value={formatCzk(f.percent_base)} />}
                      </div>

                      {Array.isArray(f.reason?.models) && f.reason.models.length > 0 && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase' }}>Per-model matching</p>
                          <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {f.reason.models.map((m, idx) => (
                              <div key={idx} style={{ padding: '0.5rem', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)', background: 'rgba(14, 16, 21, 0.4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--forge-font-mono)' }}>{m.modelName}</span>
                                  <span style={{ color: (m.targetOk && m.match) ? 'var(--forge-success)' : 'var(--forge-error)', fontFamily: 'var(--forge-font-mono)', fontWeight: 600 }}>
                                    {(m.targetOk && m.match) ? 'IN' : 'OUT'}
                                  </span>
                                </div>
                                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--forge-font-mono)' }}>
                                  <span>targetOk: {String(!!m.targetOk)}</span>
                                  <span>match: {String(!!m.match)}</span>
                                </div>
                                {Array.isArray(m.conditions) && m.conditions.length > 0 && (
                                  <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {m.conditions.map((c, cidx) => (
                                      <div key={cidx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--forge-font-mono)' }}>{c.field} {c.op} {String(c.value)}</span>
                                        <span style={{ color: c.ok ? 'var(--forge-success)' : 'var(--forge-error)', fontFamily: 'var(--forge-font-mono)', fontWeight: 600 }}>{c.ok ? 'OK' : 'FAIL'}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          </div>
        )}
      </CardContent>

      {/* Print-only footer */}
      <div className="print-footer" aria-hidden="true">
        <p>{t('calc.pricing.printFooter')}</p>
        <p>{printDate} {printTime}</p>
      </div>
    </Card>
  );
}
