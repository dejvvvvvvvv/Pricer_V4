import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
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

function MiniRow({ label, value, emphasize = false, negative = false, theme }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '12px',
      padding: '4px 0',
    }}>
      <span style={{
        fontSize: emphasize ? '0.875rem' : '0.8125rem',
        color: 'var(--widget-muted, #6B7280)',
        fontWeight: emphasize ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <span style={{
        fontSize: emphasize ? '0.9375rem' : '0.8125rem',
        fontWeight: emphasize ? 700 : 500,
        color: negative ? '#10B981' : 'var(--widget-text, #374151)',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        whiteSpace: 'nowrap',
      }}>
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
      style={{
        padding: '16px',
        backgroundColor: 'var(--widget-card, #F9FAFB)',
        border: '1px solid var(--widget-border, #E5E7EB)',
        borderRadius,
      }}
    >
      <div style={{ paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid var(--widget-border, #E5E7EB)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: 0 }}>
              Cena a souhrn
            </h3>
            <p style={{ fontSize: '0.75rem', marginTop: '4px', marginBottom: 0, color: 'var(--widget-muted, #6B7280)' }}>
              Kalkulace ceny dle konfigurace
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
            style={{
              padding: '12px',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--widget-card, #F9FAFB)30',
              border: '1px solid var(--widget-border, #E5E7EB)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Icon name="Info" size={16} style={{ marginTop: '2px', color: 'var(--widget-btn-primary, #2563EB)' }} />
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--widget-header, #1F2937)', margin: 0 }}>
                  Cekam na dokonceni slicovani
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px', marginBottom: 0, color: 'var(--widget-muted, #6B7280)' }}>
                  Hotovo: {readyModels.length} / {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels}
                </p>
              </div>
            </div>
          </div>
        ) : quoteState.error ? (
          <div style={{ padding: '12px', borderRadius: '0.5rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0 }}>Chyba vypoctu ceny</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px', marginBottom: 0, wordBreak: 'break-word' }}>{quoteState.error}</p>
          </div>
        ) : null}

        {/* Inline slicing progress */}
        {!quote && <SlicingProgressInline uploadedFiles={uploadedFiles} />}

        {/* Main totals */}
        {quote && (() => {
          const displayTotal = Number.isFinite(quote?.grandTotal) ? quote.grandTotal : quote.total;
          const totalQty = readyModels.reduce((sum, f) => {
            const q = printConfigs?.[f.id]?.quantity;
            return sum + (Number.isFinite(Number(q)) ? Math.max(1, Number(q)) : 1);
          }, 0);
          const showPerUnit = totalQty > 1 && Number.isFinite(displayTotal) && displayTotal > 0;
          const perUnitPrice = showPerUnit ? displayTotal / totalQty : null;

          return (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--widget-summary-bg, #F3F4F6)',
              border: '1px solid var(--widget-border, #E5E7EB)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '24px',
            }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--widget-muted, #6B7280)',
                  margin: '0 0 4px 0',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>Celkem</p>
                <p style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'var(--forge-font-heading, var(--widget-font, inherit))',
                  letterSpacing: '-0.03em',
                  color: 'var(--widget-header, #1F2937)',
                  lineHeight: 1.2,
                  margin: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatCzk(displayTotal)}
                </p>
                {showPerUnit && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--widget-muted, #6B7280)',
                    margin: '6px 0 0 0',
                  }}>
                    {formatCzk(perUnitPrice)} / kus ({totalQty} ks)
                  </p>
                )}
              </div>

              <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <MiniRow label="Material" value={formatCzk(quote.simple.material)} theme={theme} />
                <MiniRow label="Cas tisku" value={formatCzk(quote.simple.time)} theme={theme} />
                <MiniRow label="Sluzby" value={quote.simple.services !== 0 ? formatSignedCzk(quote.simple.services) : formatCzk(0)} theme={theme} />
                <MiniRow label="Sleva" value={quote.simple.discount < 0 ? `- ${formatCzk(Math.abs(quote.simple.discount))}` : formatCzk(0)} negative={quote.simple.discount < 0} theme={theme} />
                {quote.flags?.volume_discount_applied && quote.volumeDiscount && (
                  <div style={{ padding: '6px 8px', borderRadius: '0.375rem', backgroundColor: '#10B98110', border: '1px solid #10B98130' }}>
                    <MiniRow
                      label={`Mnozstevni sleva (${quote.volumeDiscount.mode === 'percent' ? '%' : 'fixni'})`}
                      value={`- ${formatCzk(quote.volumeDiscount.totalSavings)}`}
                      negative
                      theme={theme}
                    />
                    {quote.volumeDiscount.details
                      .filter((d) => d.applied && d.tier)
                      .slice(0, 3)
                      .map((d) => (
                        <p key={d.modelId} style={{ fontSize: '11px', marginTop: '2px', marginBottom: 0, color: '#10B981' }}>
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
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '8px', padding: '6px 8px', borderRadius: '0.375rem',
                    backgroundColor: '#10B98110', border: '1px solid #10B98130',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <Icon name="Check" size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Sleva ({quote.coupon.code})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
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
                        style={{
                          flex: 1,
                          fontSize: '0.8125rem',
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
                      <p style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', margin: 0 }}>
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
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '8px', padding: '4px 8px',
                    borderRadius: '0.375rem',
                    background: quote.shipping.freeShippingApplied ? '#10B98110' : 'transparent',
                    border: quote.shipping.freeShippingApplied ? '1px solid #10B98130' : 'none',
                  }}>
                    <span style={{ fontSize: '0.8125rem', color: quote.shipping.freeShippingApplied ? '#10B981' : 'var(--widget-muted, #6B7280)' }}>
                      {quote.shipping.name || 'Doprava'}
                    </span>
                    <span style={{
                      fontSize: '0.8125rem', fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                      color: quote.shipping.freeShippingApplied ? '#10B981' : 'var(--widget-text, #374151)',
                    }}>
                      {quote.shipping.freeShippingApplied ? 'Zdarma' : `+ ${formatCzk(quote.shipping.cost)}`}
                    </span>
                  </div>
                )}

                {/* Shipping/Express selectors */}
                {shippingConfig?.enabled && Array.isArray(shippingConfig.methods) && shippingConfig.methods.filter(m => m.active !== false).length > 0 && onShippingMethodChange && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: 0 }}>Doprava</p>
                    {shippingConfig.methods
                      .filter(m => m.active !== false)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map(method => {
                        const isSelected = method.id === selectedShippingMethodId;
                        const isFree = method.type === 'PICKUP';
                        const price = isFree ? 0 : (method.price || 0);
                        return (
                          <button key={method.id} onClick={() => onShippingMethodChange(method.id)} type="button"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                              border: isSelected ? '2px solid var(--mp-primary, var(--widget-btn-primary, #2563EB))' : '1px solid var(--widget-border, #E5E7EB)',
                              borderRadius: '0.5rem',
                              background: isSelected ? 'color-mix(in srgb, var(--widget-btn-primary, #2563EB) 5%, transparent)' : 'var(--widget-card, #F9FAFB)',
                              cursor: 'pointer', textAlign: 'left', width: '100%',
                            }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '2px solid var(--widget-btn-primary, #2563EB)' : '2px solid var(--widget-border, #d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--widget-btn-primary, #2563EB)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--widget-text, #374151)' }}>{method.name}</div>
                              {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                                <div style={{ fontSize: '10px', color: 'var(--widget-muted, #6B7280)' }}>{method.delivery_days_min}-{method.delivery_days_max} dni</div>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                              color: price === 0 ? '#16a34a' : 'var(--widget-text, #374151)',
                              textAlign: 'right',
                            }}>
                              {price === 0 ? 'Zdarma' : formatCzk(price)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                {expressConfig?.enabled && Array.isArray(expressConfig.tiers) && expressConfig.tiers.filter(t => t.active !== false).length > 0 && onExpressTierChange && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: 0 }}>Rychlost</p>
                    {expressConfig.tiers
                      .filter(t => t.active !== false)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map(tier => {
                        const isSelected = tier.id === selectedExpressTierId;
                        const surchargeLabel = tier.surcharge_value > 0
                          ? (tier.surcharge_type === 'percent' ? `+${tier.surcharge_value}%` : `+${formatCzk(tier.surcharge_value)}`)
                          : 'V cene';
                        return (
                          <button key={tier.id} onClick={() => onExpressTierChange(tier.id)} type="button"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: isSelected ? '2px solid var(--mp-primary, var(--widget-btn-primary, #2563EB))' : '1px solid var(--widget-border, #E5E7EB)', borderRadius: '0.5rem', background: isSelected ? 'color-mix(in srgb, var(--widget-btn-primary, #2563EB) 5%, transparent)' : 'var(--widget-card, #F9FAFB)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: isSelected ? '2px solid var(--widget-btn-primary, #2563EB)' : '2px solid var(--widget-border, #d1d5db)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--widget-btn-primary, #2563EB)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--widget-text, #374151)' }}>{tier.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--widget-muted, #6B7280)' }}>{tier.delivery_days > 0 ? `${tier.delivery_days} prac. dni` : 'Standardni'}</div>
                            </div>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                              color: tier.surcharge_value > 0 ? '#d97706' : '#16a34a',
                              textAlign: 'right',
                            }}>
                              {surchargeLabel}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--widget-border, #E5E7EB)' }} />
                <MiniRow label="Celkem" value={formatCzk(displayTotal)} emphasize theme={theme} />
              </div>
            </div>
          </div>
          );
        })()}

        {/* Model breakdown */}
        {quote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: 0 }}>
                Rozpis objednavky
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--widget-muted, #6B7280)' }}>
                {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelu
              </span>
            </div>

            {quote.models.map((m) => (
              <div
                key={m.id}
                style={{ padding: '12px', borderRadius: '0.5rem', border: '1px solid var(--widget-border, #E5E7EB)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--widget-header, #1F2937)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--widget-muted, #6B7280)', margin: '2px 0 0 0' }}>
                      {m.quantity}x • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCzk(m.totals.subtotalAfterPerModelRounding)}
                    </p>
                    {m.quantity > 1 && Number.isFinite(m.totals.subtotalAfterPerModelRounding) && (
                      <p style={{ fontSize: '11px', color: 'var(--widget-muted, #6B7280)', margin: '2px 0 0 0', fontVariantNumeric: 'tabular-nums' }}>
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
          <div style={{ padding: '12px', borderRadius: '0.5rem', border: '1px solid var(--widget-border, #E5E7EB)' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--widget-header, #1F2937)', margin: '0 0 8px 0' }}>
              Poplatky (objednavka)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {quote.orderFees
                .filter((f) => f.applied && (f.amount !== 0 || f.required))
                .map((f) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--widget-text, #374151)' }}>{f.name}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--widget-header, #1F2937)' }}>
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
