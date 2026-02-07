import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useLanguage } from '../../../contexts/LanguageContext';

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

export default function OrderConfirmation({ order, onStartNew }) {
  const { language } = useLanguage();
  const t = (cs, en) => (language === 'en' ? en : cs);

  if (!order) return null;

  const total = order.totals_snapshot?.total ?? 0;
  const models = order.models || [];
  const customer = order.customer_snapshot || {};

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8 text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircle" size={32} className="text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('Objednavka odeslana!', 'Order submitted!')}
        </h2>
        <p className="text-muted-foreground mb-4">
          {t(
            'Dekujeme za vasi objednavku. Brzy vas budeme kontaktovat.',
            'Thank you for your order. We will contact you soon.'
          )}
        </p>

        <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">{t('Cislo objednavky:', 'Order number:')}</span>
          <span className="text-sm font-bold text-foreground">{order.id}</span>
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t('Souhrn objednavky', 'Order Summary')}
        </h3>

        <div className="space-y-3 mb-4">
          {models.map((m, idx) => (
            <div key={m.id || idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{m.file_snapshot?.filename || `Model ${idx + 1}`}</p>
                <p className="text-xs text-muted-foreground">
                  {m.quantity || 1}x &middot; {m.material_snapshot?.name || 'PLA'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="font-semibold">{t('Celkem', 'Total')}</span>
          <span className="text-xl font-bold text-primary">{formatCzk(total)}</span>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          {t('Kontaktni udaje', 'Contact Info')}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">{t('Jmeno', 'Name')}:</span>
            <p className="font-medium">{customer.name || '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>
            <p className="font-medium">{customer.email || '—'}</p>
          </div>
          {customer.phone && (
            <div>
              <span className="text-muted-foreground">{t('Telefon', 'Phone')}:</span>
              <p className="font-medium">{customer.phone}</p>
            </div>
          )}
          {customer.company && (
            <div>
              <span className="text-muted-foreground">{t('Firma', 'Company')}:</span>
              <p className="font-medium">{customer.company}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="text-center">
        <Button variant="default" onClick={onStartNew} iconName="Plus" iconPosition="left">
          {t('Nova objednavka', 'New Order')}
        </Button>
      </div>
    </div>
  );
}
