import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';

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

function formatSignedCzk(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  const s = formatCzk(Math.abs(n));
  return n < 0 ? `- ${s}` : `+ ${s}`;
}

function MiniRow({ label, value, emphasize = false, theme }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${emphasize ? 'font-semibold' : ''}`}>
      <span className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>{label}</span>
      <span
        className="text-sm"
        style={{
          color: 'var(--widget-text, #374151)',
          fontSize: emphasize ? '0.9375rem' : undefined,
          fontWeight: emphasize ? 700 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- Inline slicing progress (widget version) ---------- */
const SLICING_STEPS = [
  { key: 'upload', label: 'Nahravani', icon: 'Upload' },
  { key: 'analyze', label: 'Analyza', icon: 'Search' },
  { key: 'calculate', label: 'Vypocet ceny', icon: 'Calculator' },
];

function SlicingProgressInline({ uploadedFiles }) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  if (files.length === 0) return null;
  const anyProcessing = files.some((f) => f?.status === 'processing');
  const allDone = files.length > 0 && files.every((f) => f?.status === 'completed');
  if (!anyProcessing && !allDone) return null;
  if (allDone) return null;

  const activeIdx = 1; // analyzing while processing

  return (
    <div style={{ padding: '1rem 0' }}>
      <style>{`
        @keyframes wk-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
        {SLICING_STEPS.map((step, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: '2px',
                  backgroundColor: done ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-border, #E5E7EB)',
                }} />
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                opacity: done || active ? 1 : 0.4,
              }}>
                <div style={{
                  width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: done ? 'var(--widget-btn-primary, #2563EB)' : active ? 'var(--widget-btn-primary, #2563EB)30' : 'var(--widget-border, #E5E7EB)',
                  color: done ? '#fff' : 'var(--widget-muted, #6B7280)',
                  fontSize: '0.625rem', fontWeight: 700,
                }}>
                  {done ? '\u2713' : i + 1}
                </div>
                <span style={{ fontSize: '0.6875rem', color: active ? 'var(--widget-header, #1F2937)' : 'var(--widget-muted, #6B7280)', fontWeight: active ? 600 : 400 }}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {/* Shimmer skeleton for price area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 0.7, 0.5].map((w, i) => (
          <div key={i} style={{
            height: '0.75rem', borderRadius: '0.25rem', width: `${w * 100}%`,
            background: 'linear-gradient(90deg, var(--widget-border, #E5E7EB) 25%, var(--widget-card, #F9FAFB) 50%, var(--widget-border, #E5E7EB) 75%)',
            backgroundSize: '200% 100%',
            animation: 'wk-shimmer 1.5s infinite',
          }} />
        ))}
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
  onExpressTierChange,
  shippingConfig,
  selectedShippingMethodId,
  onShippingMethodChange,
  couponsConfig,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  theme,
}) {
  const [showDeveloper, setShowDeveloper] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const readyModels = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    return files.filter((f) => f?.status === 'completed' && f?.result);
  }, [uploadedFiles]);

  const incompleteModels = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    return files.filter((f) => !(f?.status === 'completed' && f?.result));
  }, [uploadedFiles]);

  const quoteState = useMemo(() => {
    if (!pricingConfig) return { quote: null, error: null };
    if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) return { quote: null, error: null };
    if (incompleteModels.length > 0) return { quote: null, error: null };

    try {
      const quote = calculateOrderQuote({
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
      });
      return { quote, error: null };
    } catch (e) {
      return { quote: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [pricingConfig, uploadedFiles, printConfigs, feesConfig, feeSelections, incompleteModels.length, expressConfig, selectedExpressTierId, shippingConfig, selectedShippingMethodId, couponsConfig, appliedCouponCode]);

  const quote = quoteState.quote;

  // Detect invalid coupon
  const prevAppliedRef = useRef('');
  useEffect(() => {
    if (!appliedCouponCode) { setCouponError(''); return; }
    if (prevAppliedRef.current === appliedCouponCode) return;
    prevAppliedRef.current = appliedCouponCode;
    if (quote && !quote.coupon) {
      setCouponError('Neplatny kod');
      onRemoveCoupon?.();
    } else if (quote && quote.coupon) {
      setCouponError('');
      setCouponInput('');
    }
  }, [appliedCouponCode, quote, onRemoveCoupon]);

  const borderRadius = theme?.cornerRadius ? `${theme.cornerRadius}px` : '12px';

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--widget-card, #F9FAFB)',
        border: '1px solid var(--widget-border, #E5E7EB)',
        borderRadius,
      }}
    >
      <div className="pb-3 mb-3 border-b" style={{ borderColor: 'var(--widget-border, #E5E7EB)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
              Cena a souhrn
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              Kalkulace ceny dle konfigurace
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSliceAll}
            loading={sliceAllLoading}
            disabled={sliceAllLoading || (Array.isArray(uploadedFiles) && uploadedFiles.some((f) => f.status === 'processing'))}
            iconName="Layers"
            iconPosition="left"
          >
            Prepocitat vse
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSlice}
            disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllLoading}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Prepocitat vybrany
          </Button>
        </div>

        {/* Readiness */}
        {incompleteModels.length > 0 ? (
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--widget-card, #F9FAFB)30',
              border: '1px solid var(--widget-border, #E5E7EB)',
            }}
          >
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="mt-0.5" style={{ color: 'var(--widget-btn-primary, #2563EB)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                  Cekam na dokonceni slicovani
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                  Hotovo: {readyModels.length} / {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels}
                </p>
              </div>
            </div>
          </div>
        ) : quoteState.error ? (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-600">
            <p className="text-sm font-semibold">Chyba vypoctu ceny</p>
            <p className="text-xs mt-1 break-words">{quoteState.error}</p>
          </div>
        ) : null}

        {/* Inline slicing progress */}
        {!quote && <SlicingProgressInline uploadedFiles={uploadedFiles} />}

        {/* Main totals */}
        {quote && (() => {
          const displayTotal = Number.isFinite(quote.simple?.grandTotal) ? quote.simple.grandTotal : quote.total;
          const totalQty = readyModels.reduce((sum, f) => {
            const q = printConfigs?.[f.id]?.quantity;
            return sum + (Number.isFinite(Number(q)) ? Math.max(1, Number(q)) : 1);
          }, 0);
          const showPerUnit = totalQty > 1 && Number.isFinite(displayTotal) && displayTotal > 0;
          const perUnitPrice = showPerUnit ? displayTotal / totalQty : null;

          return (
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--widget-summary-bg, #F3F4F6)',
              border: '1px solid var(--widget-border, #E5E7EB)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>Celkem</p>
                <p style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--widget-header, #1F2937)',
                  lineHeight: 1.2,
                }}>
                  {formatCzk(displayTotal)}
                </p>
                {showPerUnit && (
                  <p className="text-xs mt-1" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                    {formatCzk(perUnitPrice)} / kus ({totalQty} ks)
                  </p>
                )}
              </div>

              <div className="min-w-[180px] space-y-1">
                <MiniRow label="Material" value={formatCzk(quote.simple.material)} theme={theme} />
                <MiniRow label="Cas tisku" value={formatCzk(quote.simple.time)} theme={theme} />
                <MiniRow label="Sluzby" value={formatSignedCzk(quote.simple.services)} theme={theme} />
                <MiniRow label="Sleva" value={formatSignedCzk(quote.simple.discount)} theme={theme} />
                {quote.flags?.volume_discount_applied && quote.volumeDiscount && (
                  <div className="px-2 py-1.5 rounded-md" style={{ backgroundColor: '#10B98110', border: '1px solid #10B98130' }}>
                    <MiniRow
                      label={`Mnozstevni sleva (${quote.volumeDiscount.mode === 'percent' ? '%' : 'fixni'})`}
                      value={`- ${formatCzk(quote.volumeDiscount.totalSavings)}`}
                      theme={theme}
                    />
                    {quote.volumeDiscount.details
                      .filter((d) => d.applied && d.tier)
                      .slice(0, 3)
                      .map((d) => (
                        <p key={d.modelId} className="text-[11px] mt-0.5" style={{ color: '#10B981' }}>
                          {d.tier.min_qty}+ ks: {quote.volumeDiscount.mode === 'percent'
                            ? `−${d.tier.value}%`
                            : `${formatCzk(d.tier.value)}/ks`}
                          {d.tier.label ? ` (${d.tier.label})` : ''}
                        </p>
                      ))}
                  </div>
                )}
                {/* Coupon discount line */}
                {quote.coupon && (
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md" style={{ backgroundColor: '#10B98110', border: '1px solid #10B98130' }}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon name="Check" size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span className="text-sm truncate" style={{ color: '#10B981', fontWeight: 500 }}>
                        Sleva ({quote.coupon.code})
                      </span>
                    </div>
                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                        - {formatCzk(quote.coupon.discount)}
                      </span>
                      {onRemoveCoupon && (
                        <button
                          type="button"
                          onClick={onRemoveCoupon}
                          aria-label="Odebrat kupon"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'var(--widget-muted, #6B7280)' }}
                        >
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Coupon input */}
                {!quote.coupon && couponsConfig?.enabled && onApplyCoupon && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
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
                        placeholder="Slevovy kod"
                        aria-label="Slevovy kod"
                        className="flex-1 text-sm"
                        style={{
                          padding: '0.375rem 0.625rem',
                          color: 'var(--widget-text, #374151)',
                          background: 'var(--widget-card, #F9FAFB)',
                          border: couponError ? '1px solid #EF4444' : '1px solid var(--widget-border, #E5E7EB)',
                          borderRadius: '0.375rem',
                          outline: 'none',
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
                        Uplatnit
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#EF4444', margin: 0 }}>
                        <Icon name="X" size={12} />
                        {couponError}
                      </p>
                    )}
                  </div>
                )}

                {/* Express surcharge line */}
                {quote.flags?.express_applied && quote.express && (
                  <MiniRow
                    label={`Express (${quote.express.tierId || ''})`}
                    value={`+ ${formatCzk(quote.express.surchargeTotal)}`}
                    theme={theme}
                  />
                )}

                {/* Shipping cost line */}
                {quote.shipping && (
                  <div className="flex items-center justify-between gap-2 px-2 py-1" style={{
                    borderRadius: '0.375rem',
                    background: quote.shipping.freeShippingApplied ? '#10B98110' : 'transparent',
                    border: quote.shipping.freeShippingApplied ? '1px solid #10B98130' : 'none',
                  }}>
                    <span className="text-sm" style={{ color: quote.shipping.freeShippingApplied ? '#10B981' : 'var(--widget-muted, #6B7280)' }}>
                      {quote.shipping.name || 'Doprava'}
                    </span>
                    <span className="text-sm font-medium" style={{ color: quote.shipping.freeShippingApplied ? '#10B981' : 'var(--widget-text, #374151)' }}>
                      {quote.shipping.freeShippingApplied ? 'Zdarma' : `+ ${formatCzk(quote.shipping.cost)}`}
                    </span>
                  </div>
                )}

                {/* Shipping/Express selectors */}
                {shippingConfig?.enabled && Array.isArray(shippingConfig.methods) && shippingConfig.methods.filter(m => m.active !== false).length > 0 && onShippingMethodChange && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>Doprava</p>
                    {shippingConfig.methods
                      .filter(m => m.active !== false)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map(method => {
                        const isSelected = method.id === selectedShippingMethodId;
                        const isFree = method.type === 'PICKUP';
                        const price = isFree ? 0 : (method.price || 0);
                        return (
                          <button key={method.id} onClick={() => onShippingMethodChange(method.id)} type="button"
                            className={`mp-widget-express-card ${isSelected ? 'mp-widget-express-card--selected' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: isSelected ? '2px solid var(--mp-primary, var(--widget-btn-primary, #2563EB))' : '1px solid var(--widget-border, #E5E7EB)', borderRadius: '0.5rem', background: isSelected ? 'color-mix(in srgb, var(--widget-btn-primary, #2563EB) 5%, transparent)' : 'var(--widget-card, #F9FAFB)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '2px solid var(--widget-btn-primary, #2563EB)' : '2px solid var(--widget-border, #d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--widget-btn-primary, #2563EB)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="text-xs font-medium" style={{ color: 'var(--widget-text, #374151)' }}>{method.name}</div>
                              {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                                <div className="text-[10px]" style={{ color: 'var(--widget-muted, #6B7280)' }}>{method.delivery_days_min}-{method.delivery_days_max} dni</div>
                              )}
                            </div>
                            <span className="text-xs font-medium" style={{ color: price === 0 ? '#16a34a' : 'var(--widget-text, #374151)' }}>
                              {price === 0 ? 'Zdarma' : `${price} Kc`}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                {expressConfig?.enabled && Array.isArray(expressConfig.tiers) && expressConfig.tiers.filter(t => t.active !== false).length > 0 && onExpressTierChange && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>Rychlost</p>
                    {expressConfig.tiers
                      .filter(t => t.active !== false)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map(tier => {
                        const isSelected = tier.id === selectedExpressTierId;
                        const surchargeLabel = tier.surcharge_value > 0
                          ? (tier.surcharge_type === 'percent' ? `+${tier.surcharge_value}%` : `+${tier.surcharge_value} Kc`)
                          : 'V cene';
                        return (
                          <button key={tier.id} onClick={() => onExpressTierChange(tier.id)} type="button"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: isSelected ? '2px solid var(--mp-primary, var(--widget-btn-primary, #2563EB))' : '1px solid var(--widget-border, #E5E7EB)', borderRadius: '0.5rem', background: isSelected ? 'color-mix(in srgb, var(--widget-btn-primary, #2563EB) 5%, transparent)' : 'var(--widget-card, #F9FAFB)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '2px solid var(--widget-btn-primary, #2563EB)' : '2px solid var(--widget-border, #d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--widget-btn-primary, #2563EB)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="text-xs font-medium" style={{ color: 'var(--widget-text, #374151)' }}>{tier.name}</div>
                              <div className="text-[10px]" style={{ color: 'var(--widget-muted, #6B7280)' }}>{tier.delivery_days > 0 ? `${tier.delivery_days} prac. dni` : 'Standardni'}</div>
                            </div>
                            <span className="text-xs font-medium" style={{ color: tier.surcharge_value > 0 ? '#d97706' : '#16a34a' }}>
                              {surchargeLabel}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                <div className="pt-2 border-t" style={{ borderColor: 'var(--widget-border, #E5E7EB)' }} />
                <MiniRow label="Celkem" value={formatCzk(displayTotal)} emphasize theme={theme} />
              </div>
            </div>
          </div>
          );
        })()}

        {/* Model breakdown */}
        {quote && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
                Rozpis objednavky
              </h4>
              <span className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelu
              </span>
            </div>

            {quote.models.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg"
                style={{ border: '1px solid var(--widget-border, #E5E7EB)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      {m.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                      {m.quantity}x • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      {formatCzk(m.totals.subtotalAfterPerModelRounding)}
                    </p>
                    {m.quantity > 1 && Number.isFinite(m.totals.subtotalAfterPerModelRounding) && (
                      <p className="text-[11px]" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                        {formatCzk(m.totals.subtotalAfterPerModelRounding / m.quantity)} / kus
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order fees */}
        {quote && quote.orderFees?.some((f) => f.applied && (f.amount !== 0 || f.required)) && (
          <div
            className="p-3 rounded-lg"
            style={{ border: '1px solid var(--widget-border, #E5E7EB)' }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--widget-header, #1F2937)' }}>
              Poplatky (objednavka)
            </p>
            <div className="space-y-1">
              {quote.orderFees
                .filter((f) => f.applied && (f.amount !== 0 || f.required))
                .map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm" style={{ color: 'var(--widget-text, #374151)' }}>{f.name}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      {formatSignedCzk(f.amount)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
