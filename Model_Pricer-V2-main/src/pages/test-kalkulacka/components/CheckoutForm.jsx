import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getCheckoutSchema } from '../schemas/checkoutSchema';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';
import { loadOrders, saveOrders, nowIso } from '../../../utils/adminOrdersStorage';

/* ── FORGE style objects ─────────────────────────────────────────────────── */
const fg = {
  card: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
  },
  sectionTitle: {
    fontSize: 'var(--forge-text-lg)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '0.25rem',
  },
  textarea: {
    width: '100%',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    padding: '0.75rem',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    minHeight: '80px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textareaPlaceholder: {
    color: 'var(--forge-text-muted)',
  },
  error: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-error)',
    marginTop: '0.25rem',
    fontFamily: 'var(--forge-font-body)',
  },
  gdprBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  gdprCheckbox: {
    marginTop: '0.25rem',
    width: '1rem',
    height: '1rem',
    borderRadius: 'var(--forge-radius-sm)',
    accentColor: 'var(--forge-accent-primary)',
  },
  gdprLabel: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    cursor: 'pointer',
    lineHeight: 1.5,
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--forge-border-default)',
  },
  modelName: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modelMeta: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
  },
  summaryLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
  },
  summaryValue: {
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-text-primary)',
  },
  totalRow: {
    paddingTop: '0.5rem',
    borderTop: '2px solid var(--forge-accent-primary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  totalValue: {
    fontSize: 'var(--forge-text-xl)',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--forge-border-default)',
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
    return `${n.toFixed(2)} Kc`;
  }
}

function generateOrderNumber() {
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `ORD-${ts}-${rand}`;
}

export default function CheckoutForm({
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
  onComplete,
  onBack,
}) {
  const { language } = useLanguage();
  const t = (cs, en) => (language === 'en' ? en : cs);

  const schema = useMemo(() => getCheckoutSchema(language), [language]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      note: '',
      gdprConsent: false,
    },
  });

  const quote = useMemo(() => {
    if (!pricingConfig || !uploadedFiles?.length) return null;
    const ready = uploadedFiles.filter(f => f?.status === 'completed' && f?.result);
    if (ready.length === 0) return null;
    try {
      return calculateOrderQuote({
        uploadedFiles: ready,
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
    } catch {
      return null;
    }
  }, [uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections, expressConfig, selectedExpressTierId, shippingConfig, selectedShippingMethodId, couponsConfig, appliedCouponCode]);

  const onSubmit = async (data) => {
    const orderNumber = generateOrderNumber();
    const now = nowIso();

    const order = {
      id: orderNumber,
      tenant_id: 'demo-tenant',
      created_at: now,
      status: 'NEW',
      customer_snapshot: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        note: data.note || null,
        gdpr_consent: true,
        gdpr_consent_at: now,
      },
      models: (uploadedFiles || [])
        .filter(f => f?.status === 'completed' && f?.result)
        .map((f, idx) => {
          const cfg = printConfigs?.[f.id] || {};
          return {
            id: `M-${idx + 1}`,
            file_snapshot: {
              filename: f.name,
              size: f.size,
              uploaded_at: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : now,
            },
            quantity: cfg.quantity || 1,
            material_snapshot: {
              material_id: cfg.material || 'pla',
              name: (cfg.material || 'pla').toUpperCase(),
            },
            config_snapshot: cfg,
            slicer_snapshot: f.result?.metrics || {},
          };
        }),
      totals_snapshot: quote
        ? { total: quote.total, currency: quote.currency, simple: quote.simple }
        : { total: 0, currency: 'CZK' },
      flags: [],
      notes: data.note ? [{ text: data.note, created_at: now }] : [],
      activity: [{ timestamp: now, user_id: 'customer', type: 'CREATED', payload: { status: 'NEW' } }],
      updated_at: now,
    };

    // Save to localStorage orders
    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);

    onComplete?.(order);
  };

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left: Contact form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={fg.card}>
              <h3 style={fg.sectionTitle}>
                <Icon name="User" size={20} style={{ marginRight: '0.5rem' }} />
                {t('KONTAKTNÍ ÚDAJE', 'CONTACT INFORMATION')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <Input
                    label={t('JMÉNO A PŘÍJMENÍ *', 'FULL NAME *')}
                    placeholder={t('Jan Novak', 'John Doe')}
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('EMAIL *', 'EMAIL *')}
                    type="email"
                    placeholder="jan@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('TELEFON', 'PHONE')}
                    type="tel"
                    placeholder="+420 777 123 456"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('FIRMA', 'COMPANY')}
                    placeholder={t('Nazev firmy (nepovinne)', 'Company name (optional)')}
                    {...register('company')}
                    error={errors.company?.message}
                  />
                </div>

                <div>
                  <label style={fg.label}>
                    {t('POZNÁMKA K OBJEDNÁVCE', 'ORDER NOTE')}
                  </label>
                  <textarea
                    style={fg.textarea}
                    placeholder={t('Specialni pozadavky...', 'Special requirements...')}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--forge-accent-primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--forge-border-default)'; }}
                    {...register('note')}
                  />
                  {errors.note?.message && (
                    <p style={fg.error}>{errors.note.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* GDPR consent */}
            <div style={fg.card}>
              <div style={fg.gdprBox}>
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  style={fg.gdprCheckbox}
                  {...register('gdprConsent')}
                />
                <label htmlFor="gdpr-consent" style={fg.gdprLabel}>
                  {t(
                    'Souhlasim se zpracovanim svych osobnich udaju za ucelem vyrizeni objednavky. Detaily o zpracovani osobnich udaju naleznete v nasich zasadach ochrany soukromi.',
                    'I consent to the processing of my personal data for the purpose of fulfilling this order. Details about data processing can be found in our privacy policy.'
                  )}
                </label>
              </div>
              {errors.gdprConsent?.message && (
                <p style={{ ...fg.error, marginLeft: '1.75rem' }}>{errors.gdprConsent.message}</p>
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={fg.card}>
              <h3 style={fg.sectionTitle}>
                <Icon name="ShoppingCart" size={20} style={{ marginRight: '0.5rem' }} />
                {t('SOUHRN OBJEDNÁVKY', 'ORDER SUMMARY')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(uploadedFiles || [])
                  .filter(f => f?.status === 'completed')
                  .map((f, idx, arr) => {
                    const cfg = printConfigs?.[f.id] || {};
                    return (
                      <div key={f.id} style={{ ...fg.modelRow, ...(idx === arr.length - 1 ? { borderBottom: 'none' } : {}) }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={fg.modelName}>{f.name}</p>
                          <p style={fg.modelMeta}>
                            {cfg.quantity || 1}x &middot; {(cfg.material || 'pla').toUpperCase()}
                          </p>
                        </div>
                        <Icon name="CheckCircle" size={16} style={{ color: 'var(--forge-success)', flexShrink: 0 }} />
                      </div>
                    );
                  })}
              </div>

              {quote && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--forge-border-default)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={fg.summaryLine}>
                      <span>{t('Materiál', 'Material')}</span>
                      <span style={fg.summaryValue}>{formatCzk(quote.simple?.material ?? 0)}</span>
                    </div>
                    <div style={fg.summaryLine}>
                      <span>{t('Čas tisku', 'Print time')}</span>
                      <span style={fg.summaryValue}>{formatCzk(quote.simple?.time ?? 0)}</span>
                    </div>
                    {(quote.simple?.services ?? 0) !== 0 && (
                      <div style={fg.summaryLine}>
                        <span>{t('Služby', 'Services')}</span>
                        <span style={fg.summaryValue}>{formatCzk(quote.simple.services)}</span>
                      </div>
                    )}
                    {(quote.simple?.markup ?? 0) !== 0 && (
                      <div style={fg.summaryLine}>
                        <span>{t('Přirážka', 'Markup')}</span>
                        <span style={fg.summaryValue}>{formatCzk(quote.simple.markup)}</span>
                      </div>
                    )}
                    <div style={fg.totalRow}>
                      <span style={fg.totalLabel}>{t('Celkem', 'Total')}</span>
                      <span style={fg.totalValue}>{formatCzk(quote.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={fg.actions}>
          <Button variant="outline" type="button" onClick={onBack} iconName="ChevronLeft" iconPosition="left">
            {t('Zpět', 'Back')}
          </Button>
          <Button
            variant="default"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            iconName="Send"
            iconPosition="right"
          >
            {isSubmitting ? t('Odesílám...', 'Submitting...') : t('Odeslat objednávku', 'Submit Order')}
          </Button>
        </div>
      </form>
    </div>
  );
}
