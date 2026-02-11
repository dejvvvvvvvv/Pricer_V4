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

const forgeStyles = {
  wrapper: {
    maxWidth: '42rem',
    margin: '0 auto',
  },
  heroCard: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '2rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  checkCircle: {
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
    background: 'rgba(0, 212, 170, 0.12)',
    animation: 'forgeCheckPulse 0.6s var(--forge-ease-out-expo)',
  },
  title: {
    fontSize: 'var(--forge-text-2xl)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    marginBottom: '1rem',
  },
  orderNumberBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '0.5rem 1rem',
    border: '1px solid var(--forge-border-default)',
  },
  orderNumberLabel: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
  },
  orderNumberValue: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
  card: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: 'var(--forge-text-lg)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '1rem',
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--forge-border-default)',
  },
  modelRowLast: {
    borderBottom: 'none',
  },
  modelName: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  modelMeta: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '2px solid var(--forge-accent-primary)',
    marginTop: '0.5rem',
  },
  totalLabel: {
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
  contactLabel: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-muted)',
  },
  contactValue: {
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
  },
  actionCenter: {
    textAlign: 'center',
  },
};

// Keyframe for animated checkmark pulse
const animStyle = `
@keyframes forgeCheckPulse {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;

export default function OrderConfirmation({ order, onStartNew }) {
  const { language } = useLanguage();
  const t = (cs, en) => (language === 'en' ? en : cs);

  if (!order) return null;

  const total = order.totals_snapshot?.total ?? 0;
  const models = order.models || [];
  const customer = order.customer_snapshot || {};

  return (
    <div style={forgeStyles.wrapper}>
      <style>{animStyle}</style>

      <div style={forgeStyles.heroCard}>
        <div style={forgeStyles.checkCircle}>
          <Icon name="CheckCircle" size={32} style={{ color: 'var(--forge-accent-primary)' }} />
        </div>

        <h2 style={forgeStyles.title}>
          {t('Objednavka odeslana!', 'Order submitted!')}
        </h2>
        <p style={forgeStyles.subtitle}>
          {t(
            'Dekujeme za vasi objednavku. Brzy vas budeme kontaktovat.',
            'Thank you for your order. We will contact you soon.'
          )}
        </p>

        <div style={forgeStyles.orderNumberBox}>
          <span style={forgeStyles.orderNumberLabel}>{t('Cislo objednavky:', 'Order number:')}</span>
          <span style={forgeStyles.orderNumberValue}>{order.id}</span>
        </div>
      </div>

      {/* Order summary */}
      <div style={forgeStyles.card}>
        <h3 style={forgeStyles.sectionTitle}>
          {t('Souhrn objednavky', 'Order Summary')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '0.5rem' }}>
          {models.map((m, idx) => (
            <div
              key={m.id || idx}
              style={{
                ...forgeStyles.modelRow,
                ...(idx === models.length - 1 ? forgeStyles.modelRowLast : {}),
              }}
            >
              <div>
                <p style={forgeStyles.modelName}>{m.file_snapshot?.filename || `Model ${idx + 1}`}</p>
                <p style={forgeStyles.modelMeta}>
                  {m.quantity || 1}x &middot; {m.material_snapshot?.name || 'PLA'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={forgeStyles.totalRow}>
          <span style={forgeStyles.totalLabel}>{t('Celkem', 'Total')}</span>
          <span style={forgeStyles.totalValue}>{formatCzk(total)}</span>
        </div>
      </div>

      {/* Contact info */}
      <div style={forgeStyles.card}>
        <h3 style={forgeStyles.sectionTitle}>
          {t('Kontaktni udaje', 'Contact Info')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <span style={forgeStyles.contactLabel}>{t('Jmeno', 'Name')}:</span>
            <p style={forgeStyles.contactValue}>{customer.name || '—'}</p>
          </div>
          <div>
            <span style={forgeStyles.contactLabel}>Email:</span>
            <p style={forgeStyles.contactValue}>{customer.email || '—'}</p>
          </div>
          {customer.phone && (
            <div>
              <span style={forgeStyles.contactLabel}>{t('Telefon', 'Phone')}:</span>
              <p style={forgeStyles.contactValue}>{customer.phone}</p>
            </div>
          )}
          {customer.company && (
            <div>
              <span style={forgeStyles.contactLabel}>{t('Firma', 'Company')}:</span>
              <p style={forgeStyles.contactValue}>{customer.company}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div style={forgeStyles.actionCenter}>
        <Button variant="default" onClick={onStartNew} iconName="Plus" iconPosition="left">
          {t('Nova objednavka', 'New Order')}
        </Button>
      </div>
    </div>
  );
}
