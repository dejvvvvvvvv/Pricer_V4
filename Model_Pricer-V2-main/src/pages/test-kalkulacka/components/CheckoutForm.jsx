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
      });
    } catch {
      return null;
    }
  }, [uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections]);

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
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Contact form */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Icon name="User" size={20} className="mr-2" />
                {t('Kontaktni udaje', 'Contact Information')}
              </h3>

              <div className="space-y-4">
                <div>
                  <Input
                    label={t('Jmeno a prijmeni *', 'Full name *')}
                    placeholder={t('Jan Novak', 'John Doe')}
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('Email *', 'Email *')}
                    type="email"
                    placeholder="jan@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('Telefon', 'Phone')}
                    type="tel"
                    placeholder="+420 777 123 456"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>

                <div>
                  <Input
                    label={t('Firma', 'Company')}
                    placeholder={t('Nazev firmy (nepovinne)', 'Company name (optional)')}
                    {...register('company')}
                    error={errors.company?.message}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">
                    {t('Poznamka k objednavce', 'Order note')}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-y"
                    placeholder={t('Specialni pozadavky...', 'Special requirements...')}
                    {...register('note')}
                  />
                  {errors.note?.message && (
                    <p className="text-xs text-red-500 mt-1">{errors.note.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* GDPR consent */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  className="mt-1 h-4 w-4 rounded border-border"
                  {...register('gdprConsent')}
                />
                <label htmlFor="gdpr-consent" className="text-sm text-foreground cursor-pointer">
                  {t(
                    'Souhlasim se zpracovanim svych osobnich udaju za ucelem vyrizeni objednavky. Detaily o zpracovani osobnich udaju naleznete v nasich zasadach ochrany soukromi.',
                    'I consent to the processing of my personal data for the purpose of fulfilling this order. Details about data processing can be found in our privacy policy.'
                  )}
                </label>
              </div>
              {errors.gdprConsent?.message && (
                <p className="text-xs text-red-500 mt-2 ml-7">{errors.gdprConsent.message}</p>
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Icon name="ShoppingCart" size={20} className="mr-2" />
                {t('Souhrn objednavky', 'Order Summary')}
              </h3>

              <div className="space-y-3">
                {(uploadedFiles || [])
                  .filter(f => f?.status === 'completed')
                  .map(f => {
                    const cfg = printConfigs?.[f.id] || {};
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cfg.quantity || 1}x &middot; {(cfg.material || 'pla').toUpperCase()}
                          </p>
                        </div>
                        <Icon name="CheckCircle" size={16} className="text-green-500 flex-shrink-0" />
                      </div>
                    );
                  })}
              </div>

              {quote && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{t('Material', 'Material')}</span>
                      <span>{formatCzk(quote.simple?.material ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{t('Cas tisku', 'Print time')}</span>
                      <span>{formatCzk(quote.simple?.time ?? 0)}</span>
                    </div>
                    {(quote.simple?.services ?? 0) !== 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('Sluzby', 'Services')}</span>
                        <span>{formatCzk(quote.simple.services)}</span>
                      </div>
                    )}
                    {(quote.simple?.markup ?? 0) !== 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('Prirazka', 'Markup')}</span>
                        <span>{formatCzk(quote.simple.markup)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-sm font-semibold">{t('Celkem', 'Total')}</span>
                      <span className="text-xl font-bold text-primary">{formatCzk(quote.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" type="button" onClick={onBack} iconName="ChevronLeft" iconPosition="left">
            {t('Zpet', 'Back')}
          </Button>
          <Button
            variant="default"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            iconName="Send"
            iconPosition="right"
          >
            {isSubmitting ? t('Odesilam...', 'Submitting...') : t('Odeslat objednavku', 'Submit Order')}
          </Button>
        </div>
      </form>
    </div>
  );
}
