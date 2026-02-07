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
      <span className="text-sm" style={{ color: 'var(--widget-text, #374151)' }}>{value}</span>
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
  theme,
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
      });
      return { quote, error: null };
    } catch (e) {
      return { quote: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [pricingConfig, uploadedFiles, printConfigs, feesConfig, feeSelections, incompleteModels.length]);

  const quote = quoteState.quote;
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

        {/* Main totals */}
        {quote && (
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
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--widget-header, #1F2937)' }}>
                  {formatCzk(quote.total)}
                </p>
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
                <div className="pt-2 border-t" style={{ borderColor: 'var(--widget-border, #E5E7EB)' }} />
                <MiniRow label="Celkem" value={formatCzk(quote.total)} emphasize theme={theme} />
              </div>
            </div>
          </div>
        )}

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
