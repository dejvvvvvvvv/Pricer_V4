import React, { useMemo, useState } from 'react';
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
    <div className={`flex items-center justify-between gap-3 ${emphasize ? 'font-semibold' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
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
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Cena a souhrn</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Výpočet používá Admin Pricing + Admin Fees (tenant) a pipeline base → fees → markup → minima → rounding.
            </p>
          </div>
          <div className="flex items-center gap-2">
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

      <CardContent className="space-y-4">
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
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {readyModels.length > 0
                    ? `Průběžná cena (${readyModels.length}/${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelů)`
                    : 'Čekám na dokončení slicování'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hotovo: {readyModels.length} / {Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels}
                  {readyModels.length > 0 && ' — cena se aktualizuje s každým dalším modelem'}
                </p>
                {incompleteModels.length > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5">
                    {incompleteModels.slice(0, 4).map((f) => (
                      <li key={f.id} className="truncate">
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
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
            <p className="text-sm font-semibold">Chyba výpočtu ceny</p>
            <p className="text-xs mt-1 break-words">{quoteState.error}</p>
          </div>
        ) : null}

        {/* Main totals */}
        {quote && (
          <div className="p-4 rounded-xl border border-border bg-background/40">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {quoteState.isPartial ? `Průběžně (${readyModels.length} z ${Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels})` : 'Celkem'}
                </p>
                <p className={`text-2xl font-bold tracking-tight ${quoteState.isPartial ? 'text-muted-foreground' : ''}`}>{formatCzk(quote.total)}</p>
                {(quote.flags?.min_order_total_applied || quote.flags?.clamped_to_zero) && (
                  <div className="mt-2 space-y-1">
                    {quote.flags?.min_order_total_applied && (
                      <p className="text-xs text-muted-foreground">Aplikováno minimum objednávky</p>
                    )}
                    {quote.flags?.clamped_to_zero && (
                      <p className="text-xs text-muted-foreground">Sleva byla omezena, aby celkem nebylo záporné</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <MiniRow label="Materiál" value={formatCzk(quote.simple.material)} />
                <MiniRow label="Čas tisku" value={formatCzk(quote.simple.time)} />
                <MiniRow label="Služby" value={formatSignedCzk(quote.simple.services)} />
                <MiniRow label="Sleva" value={formatSignedCzk(quote.simple.discount)} />
                {quote.flags?.volume_discount_applied && quote.volumeDiscount && (
                  <div className="px-2 py-1.5 rounded-md bg-green-50 border border-green-200">
                    <MiniRow
                      label={`Množstevní sleva (${quote.volumeDiscount.mode === 'percent' ? '%' : 'fixní'})`}
                      value={`- ${formatCzk(quote.volumeDiscount.totalSavings)}`}
                    />
                    {quote.volumeDiscount.details
                      .filter((d) => d.applied && d.tier)
                      .slice(0, 3)
                      .map((d) => (
                        <p key={d.modelId} className="text-[11px] text-green-700 mt-0.5">
                          {d.tier.min_qty}+ ks: {quote.volumeDiscount.mode === 'percent'
                            ? `−${d.tier.value}%`
                            : `${formatCzk(d.tier.value)}/ks`}
                          {d.tier.label ? ` (${d.tier.label})` : ''}
                        </p>
                      ))}
                  </div>
                )}
                <MiniRow label="Markup" value={formatSignedCzk(quote.simple.markup)} />
                <div className="pt-2 border-t border-border" />
                <MiniRow label="Celkem" value={formatCzk(quote.total)} emphasize />
              </div>
            </div>
          </div>
        )}

        {/* Simple customer breakdown */}
        {quote && !showDeveloper && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Rozpis objednávky</h4>
              <span className="text-xs text-muted-foreground">{Array.isArray(uploadedFiles) ? uploadedFiles.length : totalModels} modelů</span>
            </div>

            <div className="space-y-2">
              {quote.models.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.quantity}× • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCzk(m.totals.subtotalAfterPerModelRounding)}</p>
                      {m.flags?.min_price_per_model_applied && (
                        <p className="text-xs text-muted-foreground">min. za model</p>
                      )}
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer select-none text-xs text-muted-foreground">
                      Služby (model)
                    </summary>
                    <div className="mt-2 space-y-1">
                      {m.fees
                        .filter((f) => f.applied && (f.amount !== 0 || f.required))
                        .map((f) => (
                          <div key={f.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-xs font-medium truncate">{f.name}</span>
                              {f.required && (
                                <span className="ml-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                                  V ceně
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium">{formatSignedCzk(f.amount)}</span>
                          </div>
                        ))}
                      {m.fees.filter((f) => f.applied && (f.amount !== 0 || f.required)).length === 0 && (
                        <p className="text-xs text-muted-foreground">Žádné služby pro tento model.</p>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {quote.orderFees?.some((f) => f.applied && (f.amount !== 0 || f.required)) && (
              <div className="p-3 rounded-lg border border-border">
                <p className="text-sm font-semibold mb-2">Poplatky (objednávka)</p>
                <div className="space-y-1">
                  {quote.orderFees
                    .filter((f) => f.applied && (f.amount !== 0 || f.required))
                    .map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm">
                          {f.name}
                          {f.required && (
                            <span className="ml-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              V ceně
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-medium">{formatSignedCzk(f.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Developer breakdown */}
        {quote && showDeveloper && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-sm font-semibold">Developer breakdown</p>
              <p className="text-xs text-muted-foreground mt-1">
                U každé fee uvidíš MATCH/NO MATCH a důvody včetně vyhodnocení conditions.
              </p>
            </div>

            <details className="p-3 rounded-lg border border-border" open>
              <summary className="cursor-pointer select-none text-sm font-semibold">Order totals (raw)</summary>
              <div className="mt-3 space-y-1 text-xs">
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

            <details className="p-3 rounded-lg border border-border" open>
              <summary className="cursor-pointer select-none text-sm font-semibold">Model breakdown</summary>
              <div className="mt-3 space-y-3">
                {quote.models.map((m) => (
                  <details key={m.id} className="p-3 rounded-lg border border-border" open={false}>
                    <summary className="cursor-pointer select-none flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.status} • {m.quantity}× • {m.base.materialKey} • {Math.round(m.base.billedMinutes)} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCzk(m.totals.subtotalAfterPerModelRounding)}</p>
                      </div>
                    </summary>

                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <div className="p-3 rounded-lg border border-border bg-background/40">
                        <p className="text-xs font-semibold mb-2">Base</p>
                        <div className="space-y-1 text-xs">
                          <MiniRow label="filamentGrams" value={`${m.base.filamentGrams.toFixed(2)} g`} />
                          <MiniRow label="estimatedTimeSeconds" value={`${Math.round(m.base.estimatedTimeSeconds)} s`} />
                          <MiniRow label="billedMinutes" value={`${Math.round(m.base.billedMinutes)} min`} />
                          <MiniRow label="pricePerGram" value={`${m.base.pricePerGram} Kč/g`} />
                          <MiniRow label="ratePerHour" value={`${m.base.ratePerHour} Kč/h`} />
                          <div className="pt-2 border-t border-border" />
                          <MiniRow label="materialCostPerPiece" value={formatCzk(m.base.materialCostPerPiece)} />
                          <MiniRow label="timeCostPerPiece" value={formatCzk(m.base.timeCostPerPiece)} />
                          <MiniRow label="basePerPiece" value={formatCzk(m.base.basePerPiece)} />
                          <MiniRow label="baseTotal" value={formatCzk(m.base.baseTotal)} emphasize />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-border bg-background/40">
                        <p className="text-xs font-semibold mb-2">MODEL fees</p>
                        <div className="space-y-2">
                          {m.fees.map((f) => (
                            <details key={f.id} className="p-2 rounded border border-border" open={false}>
                              <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{f.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {(f.reason?.surface_unavailable ? 'SKIPPED' : (f.applied ? 'MATCH' : 'NO MATCH'))} • {f.scope} • {formatFeeLabel(f)}
                                  </p>
                                </div>
                                <p className="text-xs font-semibold">{formatSignedCzk(f.amount)}</p>
                              </summary>

                              <div className="mt-2 text-[11px] text-muted-foreground space-y-2">
                                <div className="grid grid-cols-1 gap-1">
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
                                    <p className="text-[11px] font-semibold text-foreground">Conditions</p>
                                    <div className="mt-1 space-y-1">
                                      {f.reason.conditions.map((c, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3">
                                          <span className="truncate">{c.field} {c.op} {String(c.value)}</span>
                                          <span className={c.ok ? 'text-green-600' : 'text-red-600'}>{c.ok ? 'OK' : 'FAIL'}</span>
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

            <details className="p-3 rounded-lg border border-border" open={false}>
              <summary className="cursor-pointer select-none text-sm font-semibold">ORDER fees</summary>
              <div className="mt-3 space-y-2">
                {quote.orderFees.map((f) => (
                  <details key={f.id} className="p-2 rounded border border-border" open={false}>
                    <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(f.reason?.surface_unavailable ? 'SKIPPED' : (f.applied ? 'MATCH' : 'NO MATCH'))} • {f.scope} • {formatFeeLabel(f)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold">{formatSignedCzk(f.amount)}</p>
                    </summary>

                    <div className="mt-2 text-[11px] text-muted-foreground space-y-2">
                      <div className="grid grid-cols-1 gap-1">
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
                          <p className="text-[11px] font-semibold text-foreground">Per-model matching</p>
                          <div className="mt-1 space-y-1">
                            {f.reason.models.map((m, idx) => (
                              <div key={idx} className="p-2 rounded border border-border bg-background/40">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="truncate">{m.modelName}</span>
                                  <span className={(m.targetOk && m.match) ? 'text-green-600' : 'text-red-600'}>
                                    {(m.targetOk && m.match) ? 'IN' : 'OUT'}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3">
                                  <span>targetOk: {String(!!m.targetOk)}</span>
                                  <span>match: {String(!!m.match)}</span>
                                </div>
                                {Array.isArray(m.conditions) && m.conditions.length > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {m.conditions.map((c, cidx) => (
                                      <div key={cidx} className="flex items-center justify-between gap-3">
                                        <span className="truncate">{c.field} {c.op} {String(c.value)}</span>
                                        <span className={c.ok ? 'text-green-600' : 'text-red-600'}>{c.ok ? 'OK' : 'FAIL'}</span>
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
