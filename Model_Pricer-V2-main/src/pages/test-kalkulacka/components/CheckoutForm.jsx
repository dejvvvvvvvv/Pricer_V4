import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getCheckoutSchema } from '../schemas/checkoutSchema';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';
import { loadOrders, saveOrders, nowIso } from '../../../utils/adminOrdersStorage';
import { saveOrderFiles } from '../../../services/storageApi';
import { getTenantId } from '../../../utils/adminTenantStorage';
import {
  getEnabledPaymentMethods,
  getBankTransferConfig,
  getNextVariableSymbol,
  getPaymentConfig,
} from '../../../utils/adminPaymentStorage';

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

/* ── Payment method radio styles ──────────────────────────────────────── */
const pmStyles = {
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1rem',
    border: '2px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    background: 'var(--forge-bg-elevated)',
  },
  optionSelected: {
    borderColor: 'var(--forge-accent-primary)',
    background: 'rgba(0, 212, 170, 0.06)',
  },
  radio: {
    marginTop: '0.15rem',
    width: '1.125rem',
    height: '1.125rem',
    accentColor: 'var(--forge-accent-primary)',
    flexShrink: 0,
  },
  iconWrap: {
    width: '2rem',
    height: '2rem',
    borderRadius: 'var(--forge-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 212, 170, 0.10)',
    flexShrink: 0,
  },
  label: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  description: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    marginTop: '0.125rem',
    lineHeight: 1.4,
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

/* ── Payment method option descriptors ────────────────────────────────── */
function getPaymentMethodMeta(methodId, t) {
  switch (methodId) {
    case 'bank_transfer':
      return {
        icon: 'Building2',
        label: t('Platba na ucet', 'Bank Transfer'),
        description: t(
          'Platba prevodem na bankovni ucet. Platebni udaje obdrzite po odeslani objednavky.',
          'Payment to bank account. You will receive payment details after placing the order.'
        ),
      };
    case 'card':
      return {
        icon: 'CreditCard',
        label: t('Platba kartou', 'Card Payment'),
        description: t(
          'Zaplaceni kreditni nebo debetni kartou.',
          'Pay by credit/debit card.'
        ),
      };
    default:
      return {
        icon: 'Wallet',
        label: methodId,
        description: '',
      };
  }
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
  const [savingFiles, setSavingFiles] = useState(false);

  const tenantId = useMemo(() => getTenantId(), []);

  // Load enabled payment methods
  const enabledMethods = useMemo(() => {
    const methods = getEnabledPaymentMethods(tenantId);
    // If no methods enabled, fall back to bank_transfer only
    if (!methods || methods.length === 0) {
      return [{ id: 'bank_transfer', label: 'Bank Transfer' }];
    }
    return methods;
  }, [tenantId]);

  // Load bank transfer config for later use
  const bankTransferConfig = useMemo(
    () => getBankTransferConfig(tenantId),
    [tenantId]
  );

  // Determine default payment method
  const defaultMethod = useMemo(() => {
    const config = getPaymentConfig(tenantId);
    const preferred = config?.default_method || 'bank_transfer';
    // Check that preferred method is actually enabled
    if (enabledMethods.some((m) => m.id === preferred)) return preferred;
    // Otherwise use first enabled
    return enabledMethods[0]?.id || 'bank_transfer';
  }, [tenantId, enabledMethods]);

  const schema = useMemo(() => getCheckoutSchema(language), [language]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      street: '',
      city: '',
      zip: '',
      country: language === 'en' ? '' : 'CZ',
      note: '',
      gdprConsent: false,
      payment_method: defaultMethod,
    },
  });

  const selectedPaymentMethod = watch('payment_method');

  // If only 1 method, ensure it is always selected
  useEffect(() => {
    if (enabledMethods.length === 1 && selectedPaymentMethod !== enabledMethods[0].id) {
      setValue('payment_method', enabledMethods[0].id);
    }
  }, [enabledMethods, selectedPaymentMethod, setValue]);

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
    const orderFolderId = crypto.randomUUID();

    // Build payment_info based on selected method
    let paymentInfo;
    if (data.payment_method === 'bank_transfer') {
      const variableSymbol = getNextVariableSymbol(tenantId);
      const dueDays = bankTransferConfig?.due_days || 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      paymentInfo = {
        method: 'bank_transfer',
        variable_symbol: variableSymbol || orderNumber.replace(/\D/g, '').slice(-10),
        bank_account: {
          account_number: bankTransferConfig?.account_number || '',
          iban: bankTransferConfig?.iban || '',
          swift: bankTransferConfig?.swift || '',
          bank_name: bankTransferConfig?.bank_name || '',
        },
        payment_instructions: bankTransferConfig?.payment_instructions || '',
        due_date: dueDate.toISOString(),
        status: 'pending',
      };
    } else {
      // card or other future methods
      paymentInfo = {
        method: 'card',
        status: 'pending',
      };
    }

    const order = {
      id: orderNumber,
      tenant_id: tenantId,
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
      shipping_address: {
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: data.country,
      },
      payment_method: data.payment_method,
      payment_info: paymentInfo,
      models: (uploadedFiles || [])
        .filter(f => f?.status === 'completed' && f?.result)
        .map((f, idx) => {
          const cfg = printConfigs?.[f.id] || {};
          const metrics = f.result?.metrics || {};
          const modelResult = quote?.models?.find(m => String(m.id) === String(f.id)) || null;
          const qty = cfg.quantity || 1;
          const totalWithQty = modelResult?.totals?.subtotalAfterPerModelRounding
            ?? modelResult?.totals?.subtotalAfterMin
            ?? modelResult?.totals?.subtotalBeforeMin
            ?? 0;
          const perPieceTotal = qty > 0 ? totalWithQty / qty : 0;
          return {
            id: `M-${idx + 1}`,
            file_snapshot: {
              filename: f.name,
              size: f.size,
              uploaded_at: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : now,
            },
            quantity: qty,
            material_snapshot: {
              material_id: cfg.material || 'pla',
              name: (cfg.material || 'pla').toUpperCase(),
            },
            config_snapshot: cfg,
            slicer_snapshot: {
              ...metrics,
              dimensions_xyz: f.result?.modelInfo?.sizeMm || null,
            },
            price_breakdown_snapshot: {
              model_total: perPieceTotal,
              material_cost: modelResult?.base?.materialCostPerPiece ?? 0,
              time_cost: modelResult?.base?.timeCostPerPiece ?? 0,
              fees_total: modelResult?.totals?.feesTotal ?? 0,
            },
          };
        }),
      totals_snapshot: quote
        ? { total: quote.total, currency: quote.currency, simple: quote.simple }
        : { total: 0, currency: 'CZK' },
      flags: [],
      notes: data.note ? [{ text: data.note, created_at: now }] : [],
      activity: [{ timestamp: now, user_id: 'customer', type: 'CREATED', payload: { status: 'NEW' } }],
      updated_at: now,
      storage: {
        orderFolderId,
        storagePath: null,
        savedAt: null,
        fileManifest: null,
        status: 'pending',
      },
    };

    // Save to localStorage first (always works)
    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);

    // Try to save files to backend storage
    setSavingFiles(true);
    try {
      const modelFiles = (uploadedFiles || [])
        .filter(f => f?.status === 'completed' && f?.file)
        .map(f => f.file);

      const modelMapping = (uploadedFiles || [])
        .filter(f => f?.status === 'completed' && f?.result)
        .map(f => ({
          modelId: f.id,
          slicerJobId: f.result?.jobId || null,
          presetId: f.result?.usedPreset || null,
          originalFilename: f.name,
        }));

      const storageResult = await saveOrderFiles(
        { ...order, orderFolderId, modelMapping },
        modelFiles
      );

      order.storage = {
        orderFolderId: storageResult.orderFolderId,
        storagePath: storageResult.storagePath,
        savedAt: storageResult.timestamp,
        fileManifest: storageResult.files,
        status: 'complete',
      };
      order.activity.push({
        timestamp: nowIso(),
        user_id: 'system',
        type: 'FILES_SAVED',
        payload: { fileCount: storageResult.files.length },
      });

      const updatedOrders = loadOrders();
      const idx = updatedOrders.findIndex(o => o.id === order.id);
      if (idx >= 0) updatedOrders[idx] = order;
      saveOrders(updatedOrders);
    } catch (err) {
      console.warn('[CheckoutForm] File storage failed:', err);
      order.storage.status = 'failed';

      const updatedOrders = loadOrders();
      const idx = updatedOrders.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        updatedOrders[idx].storage = order.storage;
        saveOrders(updatedOrders);
      }
    } finally {
      setSavingFiles(false);
    }

    onComplete?.(order);
  };

  const isBusy = isSubmitting || savingFiles;

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left: Contact + Shipping + Payment form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={fg.card}>
              <h3 style={fg.sectionTitle}>
                <Icon name="User" size={20} style={{ marginRight: '0.5rem' }} />
                {t('KONTAKTNI UDAJE', 'CONTACT INFORMATION')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <Input
                    label={t('JMENO A PRIJMENI *', 'FULL NAME *')}
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
              </div>
            </div>

            {/* Shipping Address */}
            <div style={fg.card}>
              <h3 style={fg.sectionTitle}>
                <Icon name="MapPin" size={20} style={{ marginRight: '0.5rem' }} />
                {t('DODACI ADRESA', 'SHIPPING ADDRESS')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <Input
                    label={t('ULICE A CISLO POPISNE *', 'STREET ADDRESS *')}
                    placeholder={t('Hlavni 123', '123 Main St')}
                    {...register('street')}
                    error={errors.street?.message}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <Input
                      label={t('MESTO *', 'CITY *')}
                      placeholder={t('Praha', 'Prague')}
                      {...register('city')}
                      error={errors.city?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('PSC *', 'ZIP *')}
                      placeholder="110 00"
                      {...register('zip')}
                      error={errors.zip?.message}
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label={t('STAT *', 'COUNTRY *')}
                    placeholder={t('Ceska republika', 'Czech Republic')}
                    {...register('country')}
                    error={errors.country?.message}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div style={fg.card}>
              <h3 style={fg.sectionTitle}>
                <Icon name="Wallet" size={20} style={{ marginRight: '0.5rem' }} />
                {t('ZPUSOB PLATBY', 'PAYMENT METHOD')}
              </h3>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                role="radiogroup"
                aria-label={t('Vyber zpusobu platby', 'Select payment method')}
              >
                {enabledMethods.map((method) => {
                  const meta = getPaymentMethodMeta(method.id, t);
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      style={{
                        ...pmStyles.option,
                        ...(isSelected ? pmStyles.optionSelected : {}),
                      }}
                      htmlFor={`pm-${method.id}`}
                    >
                      <input
                        type="radio"
                        id={`pm-${method.id}`}
                        value={method.id}
                        style={pmStyles.radio}
                        {...register('payment_method')}
                        aria-describedby={`pm-desc-${method.id}`}
                      />
                      <div style={pmStyles.iconWrap}>
                        <Icon
                          name={meta.icon}
                          size={18}
                          style={{ color: 'var(--forge-accent-primary)' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={pmStyles.label}>{meta.label}</div>
                        <div id={`pm-desc-${method.id}`} style={pmStyles.description}>
                          {meta.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.payment_method?.message && (
                <p style={fg.error}>{errors.payment_method.message}</p>
              )}
            </div>

            {/* Note */}
            <div style={fg.card}>
              <label style={fg.label}>
                {t('POZNAMKA K OBJEDNAVCE', 'ORDER NOTE')}
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
                {t('SOUHRN OBJEDNAVKY', 'ORDER SUMMARY')}
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
                      <span>{t('Material', 'Material')}</span>
                      <span style={fg.summaryValue}>{formatCzk(quote.simple?.material ?? 0)}</span>
                    </div>
                    <div style={fg.summaryLine}>
                      <span>{t('Cas tisku', 'Print time')}</span>
                      <span style={fg.summaryValue}>{formatCzk(quote.simple?.time ?? 0)}</span>
                    </div>
                    {(quote.simple?.services ?? 0) !== 0 && (
                      <div style={fg.summaryLine}>
                        <span>{t('Sluzby', 'Services')}</span>
                        <span style={fg.summaryValue}>{formatCzk(quote.simple.services)}</span>
                      </div>
                    )}
                    {(quote.simple?.markup ?? 0) !== 0 && (
                      <div style={fg.summaryLine}>
                        <span>{t('Prirazka', 'Markup')}</span>
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
            {t('Zpet', 'Back')}
          </Button>
          <Button
            variant="default"
            type="submit"
            loading={isBusy}
            disabled={isBusy}
            iconName="Send"
            iconPosition="right"
          >
            {savingFiles
              ? t('Ukladam soubory...', 'Saving files...')
              : isSubmitting
                ? t('Odesilam...', 'Submitting...')
                : t('Odeslat objednavku', 'Submit Order')}
          </Button>
        </div>
      </form>
    </div>
  );
}
