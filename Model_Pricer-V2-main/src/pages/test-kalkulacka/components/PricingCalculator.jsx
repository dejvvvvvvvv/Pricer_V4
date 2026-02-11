import React, { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';

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
      <span style={{ fontSize: 'var(--forge-text-sm)', color: emphasize ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{value}</span>
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
}) {
  const [showDeveloper, setShowDeveloper] = useState(false);

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

  return (
    <Card style={fg.card}>
      <CardHeader style={{ paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <CardTitle style={fg.sectionTitle}>CENA A SOUHRN</CardTitle>
            <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--forge-font-body)' }}>
              Výpočet používá Admin Pricing + Admin Fees (tenant) a pipeline base → fees → markup → minima → rounding.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeveloper((v) => !v)}
              iconName="Code2"
              iconPosition="left"
            >
              {showDeveloper ? 'Zákaznický' : 'Developer'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onSliceAll}
            loading={sliceAllLoading}
            disabled={sliceAllLoading || (Array.isArray(uploadedFiles) && uploadedFiles.some((f) => f.status === 'processing'))}
            iconName="Layers"
            iconPosition="left"
          >
            Přepočítat vše
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSlice}
            disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllLoading}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Přepočítat vybraný
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
                    ? `Průběžná cena (${readyModels.length}/${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelů)`
                    : 'Čekám na dokončení slicování'}
                </p>
                <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', marginTop: '0.25rem', fontFamily: 'var(--forge-font-mono)' }}>
                  Hotovo: {readyModels.length} / {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels}
                  {readyModels.length > 0 && ' — cena se aktualizuje s každým dalším modelem'}
                </p>
                {incompleteModels.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', listStyleType: 'disc', paddingLeft: '1.25rem', fontFamily: 'var(--forge-font-mono)' }}>
                    {incompleteModels.slice(0, 4).map((f) => (
                      <li key={f.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name} — {f.status === 'processing' ? 'vypočítávám…' : f.status === 'failed' ? 'chyba' : 'čeká'}
                      </li>
                    ))}
                    {incompleteModels.length > 4 && <li>…a další</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        {quoteState.error ? (
          <div style={fg.errorBox}>
            <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-error)' }}>Chyba výpočtu ceny</p>
            <p style={{ fontSize: 'var(--forge-text-xs)', marginTop: '0.25rem', color: 'var(--forge-error)', wordBreak: 'break-word', fontFamily: 'var(--forge-font-mono)' }}>{quoteState.error}</p>
          </div>
        ) : null}

        {/* Main totals */}
        {quote && (
          <div style={fg.summaryCard}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <p style={fg.totalLabel}>
                  {quoteState.isPartial ? `Průběžně (${readyModels.length} z ${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels})` : 'CELKEM'}
                </p>
                <p style={{ ...fg.totalValue, color: quoteState.isPartial ? 'var(--forge-text-muted)' : 'var(--forge-accent-primary)' }}>{formatCzk(quote.total)}</p>
                {(quote.flags?.min_order_total_applied || quote.flags?.clamped_to_zero) && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {quote.flags?.min_order_total_applied && (
                      <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>Aplikováno minimum objednávky</p>
                    )}
                    {quote.flags?.clamped_to_zero && (
                      <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>Sleva byla omezena, aby celkem nebylo záporné</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <MiniRow label="Materiál" value={formatCzk(quote.simple.material)} />
                <MiniRow label="Čas tisku" value={formatCzk(quote.simple.time)} />
                <MiniRow label="Služby" value={formatSignedCzk(quote.simple.services)} />
                <MiniRow label="Sleva" value={formatSignedCzk(quote.simple.discount)} />
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
                <MiniRow label="Markup" value={formatSignedCzk(quote.simple.markup)} />
                <div style={fg.totalRow} />
                <MiniRow label="Celkem" value={formatCzk(quote.total)} emphasize />
              </div>
            </div>
          </div>
        )}

        {/* Simple customer breakdown */}
        {quote && !showDeveloper && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rozpis objednávky</h4>
              <span style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>{Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelů</span>
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
                      {m.flags?.min_price_per_model_applied && (
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)' }}>min. za model</p>
                      )}
                    </div>
                  </div>

                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
                      Služby (model)
                    </summary>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {m.fees
                        .filter((f) => f.applied && (f.amount !== 0 || f.required))
                        .map((f) => (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              {f.required && (
                                <span style={fg.pill}>V ceně</span>
                              )}
                            </div>
                            <span style={{ fontSize: 'var(--forge-text-xs)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-mono)', whiteSpace: 'nowrap' }}>{formatSignedCzk(f.amount)}</span>
                          </div>
                        ))}
                      {m.fees.filter((f) => f.applied && (f.amount !== 0 || f.required)).length === 0 && (
                        <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)' }}>Žádné služby pro tento model.</p>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {quote.orderFees?.some((f) => f.applied && (f.amount !== 0 || f.required)) && (
              <div style={fg.modelCard}>
                <p style={{ fontSize: 'var(--forge-text-sm)', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Poplatky (objednávka)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {quote.orderFees
                    .filter((f) => f.applied && (f.amount !== 0 || f.required))
                    .map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {f.name}
                          {f.required && (
                            <span style={fg.pill}>V ceně</span>
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
    </Card>
  );
}
