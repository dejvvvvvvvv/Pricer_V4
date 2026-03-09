import React, { useState, useCallback } from 'react';
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

function formatDate(isoString, language) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString.slice(0, 10);
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

/* ── Bank transfer payment card styles ─────────────────────────────────── */
const paymentCardStyles = {
  wrapper: {
    background: 'var(--forge-bg-surface)',
    border: '2px solid var(--forge-warning, #F59E0B)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  headerIcon: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(245, 158, 11, 0.12)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 'var(--forge-text-lg)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  fieldLabel: {
    fontSize: '11px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
  },
  fieldValue: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    wordBreak: 'break-all',
  },
  vsBox: {
    background: 'rgba(245, 158, 11, 0.08)',
    border: '2px dashed rgba(245, 158, 11, 0.4)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1rem',
  },
  vsLabel: {
    fontSize: '11px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 600,
    color: 'var(--forge-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.125rem',
  },
  vsValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-mono)',
    letterSpacing: '0.12em',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    background: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-secondary)',
    transition: 'border-color 0.15s, background 0.15s',
    flexShrink: 0,
  },
  amountBox: {
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '0.75rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  amountLabel: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 600,
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  amountValue: {
    fontSize: 'var(--forge-text-xl)',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
  instructions: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    lineHeight: 1.6,
    padding: '0.75rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    marginBottom: '0.75rem',
  },
  warningText: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-warning, #F59E0B)',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  qrPlaceholder: {
    background: 'var(--forge-bg-elevated)',
    border: '1px dashed var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '1.5rem',
    textAlign: 'center',
    color: 'var(--forge-text-muted)',
    fontSize: 'var(--forge-text-sm)',
    fontFamily: 'var(--forge-font-body)',
  },
};

/* ── Card payment placeholder styles ──────────────────────────────────── */
const cardPaymentStyles = {
  wrapper: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  icon: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.75rem auto',
    background: 'rgba(0, 212, 170, 0.12)',
  },
  text: {
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    lineHeight: 1.6,
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

/* ── Copy to clipboard helper ──────────────────────────────────────────── */
function CopyButton({ text, t }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* noop */ }
      document.body.removeChild(textarea);
    }
  }, [text]);

  return (
    <button
      type="button"
      style={paymentCardStyles.copyBtn}
      onClick={handleCopy}
      aria-label={t('Kopirovat do schranky', 'Copy to clipboard')}
    >
      <Icon
        name={copied ? 'Check' : 'Copy'}
        size={14}
        style={{ color: copied ? 'var(--forge-success)' : 'currentColor' }}
      />
      {copied ? t('Zkopirovano', 'Copied') : t('Kopirovat', 'Copy')}
    </button>
  );
}

/* ── Bank Transfer Payment Details ─────────────────────────────────────── */
function BankTransferPaymentCard({ paymentInfo, total, language, t }) {
  if (!paymentInfo) return null;

  const bank = paymentInfo.bank_account || {};
  const hasAccountDetails = bank.account_number || bank.iban;

  return (
    <div style={paymentCardStyles.wrapper}>
      {/* Header */}
      <div style={paymentCardStyles.header}>
        <div style={paymentCardStyles.headerIcon}>
          <Icon name="Building2" size={22} style={{ color: 'var(--forge-warning, #F59E0B)' }} />
        </div>
        <h3 style={paymentCardStyles.headerTitle}>
          {t('Platebni udaje', 'Payment Instructions')}
        </h3>
      </div>

      {/* Variable Symbol — most prominent */}
      {paymentInfo.variable_symbol && (
        <div style={paymentCardStyles.vsBox}>
          <div>
            <div style={paymentCardStyles.vsLabel}>
              {t('Variabilni symbol', 'Variable Symbol')}
            </div>
            <div style={paymentCardStyles.vsValue}>
              {paymentInfo.variable_symbol}
            </div>
          </div>
          <CopyButton text={paymentInfo.variable_symbol} t={t} />
        </div>
      )}

      {/* Amount to pay */}
      <div style={paymentCardStyles.amountBox}>
        <span style={paymentCardStyles.amountLabel}>
          {t('Castka k uhrade', 'Amount to pay')}
        </span>
        <span style={paymentCardStyles.amountValue}>
          {formatCzk(total)}
        </span>
      </div>

      {/* Bank account details grid */}
      {hasAccountDetails && (
        <div style={paymentCardStyles.grid}>
          {bank.account_number && (
            <div>
              <div style={paymentCardStyles.fieldLabel}>
                {t('Cislo uctu', 'Account Number')}
              </div>
              <div style={paymentCardStyles.fieldValue}>
                {bank.account_number}
              </div>
            </div>
          )}

          {bank.iban && (
            <div>
              <div style={paymentCardStyles.fieldLabel}>IBAN</div>
              <div style={paymentCardStyles.fieldValue}>{bank.iban}</div>
            </div>
          )}

          {bank.swift && (
            <div>
              <div style={paymentCardStyles.fieldLabel}>SWIFT/BIC</div>
              <div style={paymentCardStyles.fieldValue}>{bank.swift}</div>
            </div>
          )}

          {bank.bank_name && (
            <div>
              <div style={paymentCardStyles.fieldLabel}>
                {t('Banka', 'Bank')}
              </div>
              <div style={paymentCardStyles.fieldValue}>{bank.bank_name}</div>
            </div>
          )}
        </div>
      )}

      {/* Due date */}
      {paymentInfo.due_date && (
        <div style={{ ...paymentCardStyles.grid, marginBottom: '1rem' }}>
          <div>
            <div style={paymentCardStyles.fieldLabel}>
              {t('Splatnost', 'Due Date')}
            </div>
            <div style={paymentCardStyles.fieldValue}>
              {formatDate(paymentInfo.due_date, language)}
            </div>
          </div>
        </div>
      )}

      {/* Custom payment instructions */}
      {paymentInfo.payment_instructions && (
        <div style={paymentCardStyles.instructions}>
          {paymentInfo.payment_instructions}
        </div>
      )}

      {/* QR code placeholder */}
      <div style={paymentCardStyles.qrPlaceholder}>
        <Icon
          name="QrCode"
          size={32}
          style={{ color: 'var(--forge-text-muted)', margin: '0 auto 0.5rem auto', display: 'block' }}
        />
        {t('QR platebni kod', 'QR payment code')}
      </div>

      {/* Warning about variable symbol */}
      <div style={paymentCardStyles.warningText}>
        <Icon name="AlertTriangle" size={16} />
        {t(
          'Pouzijte prosim presny variabilni symbol pri platbe.',
          'Please use the exact variable symbol when making the payment.'
        )}
      </div>
    </div>
  );
}

/* ── Card Payment Placeholder ──────────────────────────────────────────── */
function CardPaymentCard({ t }) {
  return (
    <div style={cardPaymentStyles.wrapper}>
      <div style={cardPaymentStyles.icon}>
        <Icon name="CreditCard" size={24} style={{ color: 'var(--forge-accent-primary)' }} />
      </div>
      <p style={cardPaymentStyles.text}>
        {t(
          'Platba kartou bude zpracovana. Potvrzeni obdrzite emailem.',
          'Card payment will be processed. You will receive confirmation by email.'
        )}
      </p>
    </div>
  );
}

export default function OrderConfirmation({ order, onStartNew }) {
  const { language } = useLanguage();
  const t = (cs, en) => (language === 'en' ? en : cs);

  if (!order) return null;

  const total = order.totals_snapshot?.total ?? 0;
  const models = order.models || [];
  const customer = order.customer_snapshot || {};
  const paymentMethod = order.payment_method || null;
  const paymentInfo = order.payment_info || null;

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

      {/* Payment details — shown FIRST, before order summary */}
      {paymentMethod === 'bank_transfer' && paymentInfo && (
        <BankTransferPaymentCard
          paymentInfo={paymentInfo}
          total={total}
          language={language}
          t={t}
        />
      )}

      {paymentMethod === 'card' && (
        <CardPaymentCard t={t} />
      )}

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
