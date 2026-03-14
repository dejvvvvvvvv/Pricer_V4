/**
 * OrderTracking — Public order tracking page (enhanced).
 *
 * Accessible at /track?id=ORDER_ID&tenant=TENANT_ID
 * Customer enters order ID + email for verification.
 * Shows order status timeline, summary, estimated delivery,
 * model thumbnails, customer notes, print summary and share URL.
 *
 * Data source: localStorage via adminOrdersStorage (simulated — production would use API).
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { readTenantJson, writeTenantJson } from '@/utils/adminTenantStorage';
import { CopyButton } from '@/components/ui/forge/CopyButton';
import ModelThumbnail from '@/components/ModelThumbnail';
import Icon from '@/components/AppIcon';

/* ── Helpers ─────────────────────────────────────────────────── */

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
  if (!isoString) return '\u2014';
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

function formatDateTime(isoString, language) {
  if (!isoString) return '\u2014';
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString.slice(0, 16);
  }
}

/* ── Status mapping (admin -> public-friendly) ───────────────── */

const TRACKING_STEPS = [
  { key: 'placed',     icon: 'ShoppingCart',  adminStatuses: ['NEW', 'REVIEW'] },
  { key: 'confirmed',  icon: 'CheckCircle',   adminStatuses: ['APPROVED'] },
  { key: 'production', icon: 'Printer',       adminStatuses: ['PRINTING', 'POSTPROCESS'] },
  { key: 'quality',    icon: 'ShieldCheck',   adminStatuses: ['READY'] },
  { key: 'shipped',    icon: 'Truck',         adminStatuses: ['SHIPPED'] },
  { key: 'delivered',  icon: 'PackageCheck',  adminStatuses: ['DONE'] },
];

const STEP_LABELS = {
  cs: {
    placed: 'Objednavka prijata',
    confirmed: 'Potvrzeno',
    production: 'Ve vyrobe',
    quality: 'Kontrola kvality',
    shipped: 'Odeslano',
    delivered: 'Doruceno',
  },
  en: {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    production: 'In Production',
    quality: 'Quality Check',
    shipped: 'Shipped',
    delivered: 'Delivered',
  },
};

const STEP_DESCRIPTIONS = {
  cs: {
    placed: 'Vase objednavka byla uspesne prijata a ceka na zpracovani.',
    confirmed: 'Objednavka byla potvrzena a pripravena k vyrobe.',
    production: 'Vas model se prave tiskne.',
    quality: 'Vyrobek prosel kontrolou a je pripraven k odeslani.',
    shipped: 'Zasilka byla odeslana.',
    delivered: 'Zasilka byla uspesne dorucena.',
  },
  en: {
    placed: 'Your order has been received and is awaiting processing.',
    confirmed: 'Order has been confirmed and prepared for production.',
    production: 'Your model is currently being printed.',
    quality: 'Product passed quality check and is ready for shipping.',
    shipped: 'Package has been shipped.',
    delivered: 'Package has been successfully delivered.',
  },
};

/** Status message for the live indicator */
const STATUS_MESSAGES = {
  cs: {
    placed: 'Vase objednavka ceka na zpracovani',
    confirmed: 'Objednavka byla potvrzena',
    production: 'Vas model se prave tiskne',
    quality: 'Probiha kontrola kvality',
    shipped: 'Zasilka je na ceste k vam',
    delivered: 'Zasilka byla dorucena',
  },
  en: {
    placed: 'Your order is awaiting processing',
    confirmed: 'Your order has been confirmed',
    production: 'Your model is being printed',
    quality: 'Quality check in progress',
    shipped: 'Your package is on its way',
    delivered: 'Your package has been delivered',
  },
};

/** Status dot colors */
const STATUS_COLORS = {
  placed: '#F59E0B',     // amber
  confirmed: '#3B82F6',  // blue
  production: '#8B5CF6', // purple
  quality: '#06B6D4',    // cyan
  shipped: '#F97316',    // orange
  delivered: '#00D4AA',  // teal/forge accent
};

/** Shipping method lead times in days */
const SHIPPING_LEAD_TIMES = {
  'standard': 10,
  'express': 5,
  'priority': 3,
  'economy': 14,
  'default': 10,
};

/** Map admin status to step index (0-based). Returns -1 for CANCELED. */
function getStepIndex(adminStatus) {
  if (adminStatus === 'CANCELED') return -1;
  for (let i = 0; i < TRACKING_STEPS.length; i++) {
    if (TRACKING_STEPS[i].adminStatuses.includes(adminStatus)) return i;
  }
  return 0;
}

/** Get the current step key from admin status */
function getCurrentStepKey(adminStatus) {
  const idx = getStepIndex(adminStatus);
  if (idx < 0 || idx >= TRACKING_STEPS.length) return 'placed';
  return TRACKING_STEPS[idx].key;
}

/** Estimate delivery date: order created + shipping method lead time. */
function estimateDelivery(createdAt, shippingMethod) {
  if (!createdAt) return null;
  try {
    const d = new Date(createdAt);
    const method = (shippingMethod || '').toLowerCase();
    const days = SHIPPING_LEAD_TIMES[method] || SHIPPING_LEAD_TIMES.default;
    // Add business days (skip weekends)
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return d.toISOString();
  } catch {
    return null;
  }
}

const NS_ORDERS = 'orders:v1';

function findOrderById(orderId, tenantId) {
  if (!orderId) return null;
  const data = readTenantJson(NS_ORDERS, { orders: [] }, tenantId || undefined);
  const orders = data.orders || [];
  return orders.find((o) => o.id === orderId) || null;
}

function saveCustomerNote(orderId, tenantId, note) {
  if (!orderId) return;
  const data = readTenantJson(NS_ORDERS, { orders: [] }, tenantId || undefined);
  const orders = data.orders || [];
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;

  if (!orders[idx].customer_notes) {
    orders[idx].customer_notes = [];
  }
  orders[idx].customer_notes.push({
    text: note,
    created_at: new Date().toISOString(),
  });
  writeTenantJson(NS_ORDERS, data, tenantId || undefined);
  return orders[idx];
}

/* ── Print Styles (injected once) ────────────────────────────── */

let printStylesInjected = false;
function injectPrintStyles() {
  if (printStylesInjected || typeof document === 'undefined') return;
  printStylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-order-tracking-print', 'true');
  style.textContent = `
    @media print {
      /* Hide everything except tracking content */
      body > *:not(#root) { display: none !important; }
      header, footer, nav, .site-header, .site-footer,
      .order-tracking__no-print { display: none !important; }

      .order-tracking__page {
        background: #fff !important;
        color: #111 !important;
        padding: 20px !important;
        min-height: auto !important;
      }
      .order-tracking__card {
        background: #fff !important;
        border: 1px solid #ddd !important;
        color: #111 !important;
        break-inside: avoid;
      }
      .order-tracking__heading,
      .order-tracking__section-title {
        color: #111 !important;
      }
      .order-tracking__info-value,
      .order-tracking__model-name {
        color: #222 !important;
      }
      .order-tracking__info-label,
      .order-tracking__model-meta,
      .order-tracking__timeline-desc {
        color: #555 !important;
      }
      .order-tracking__timeline-dot {
        border: 2px solid #333 !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .order-tracking__timeline-dot--completed {
        background: #00D4AA !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .order-tracking__timeline-line--completed {
        background: #00D4AA !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .order-tracking__status-indicator {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .order-tracking__total-value {
        color: #00D4AA !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ── Responsive Styles (injected once) ───────────────────────── */

let responsiveStylesInjected = false;
function injectResponsiveStyles() {
  if (responsiveStylesInjected || typeof document === 'undefined') return;
  responsiveStylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-order-tracking-responsive', 'true');
  style.textContent = `
    @keyframes order-tracking-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    @keyframes order-tracking-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .order-tracking__page {
      animation: order-tracking-fade-in 0.3s ease-out;
    }

    .order-tracking__card {
      animation: order-tracking-fade-in 0.3s ease-out;
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
      .order-tracking__page {
        padding: 24px 12px 60px !important;
      }
      .order-tracking__container {
        max-width: 100% !important;
      }
      .order-tracking__heading {
        font-size: 1.25rem !important;
      }
      .order-tracking__info-grid {
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
      }
      .order-tracking__card {
        padding: 1rem !important;
        border-radius: 12px !important;
      }
      .order-tracking__model-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0.25rem !important;
      }
      .order-tracking__share-bar {
        flex-direction: column !important;
        align-items: stretch !important;
      }
      .order-tracking__share-url {
        font-size: 0.75rem !important;
        text-align: center !important;
      }
      .order-tracking__share-actions {
        display: flex !important;
        gap: 0.5rem !important;
        justify-content: center !important;
      }
      .order-tracking__status-indicator {
        flex-direction: column !important;
        text-align: center !important;
      }
      .order-tracking__notes-list {
        max-height: 200px !important;
      }
      .order-tracking__actions-row {
        flex-direction: column !important;
      }
    }

    /* Tablet */
    @media (min-width: 641px) and (max-width: 900px) {
      .order-tracking__info-grid {
        grid-template-columns: 1fr 1fr !important;
      }
    }

    /* Focus visible for keyboard nav */
    .order-tracking__btn:focus-visible,
    .order-tracking__input:focus-visible {
      outline: 2px solid var(--forge-accent-primary, #00D4AA);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

/* ── Components ──────────────────────────────────────────────── */

/** Pulsing status dot indicator */
function StatusIndicator({ adminStatus, lang }) {
  const stepKey = getCurrentStepKey(adminStatus);
  const isCanceled = adminStatus === 'CANCELED';
  const color = isCanceled ? '#ef4444' : (STATUS_COLORS[stepKey] || '#00D4AA');
  const message = isCanceled
    ? (lang === 'en' ? 'This order has been canceled' : 'Tato objednavka byla zrusena')
    : (STATUS_MESSAGES[lang]?.[stepKey] || STATUS_MESSAGES.cs[stepKey]);

  return (
    <div
      className="order-tracking__status-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 'var(--forge-radius-lg, 12px)',
        marginBottom: '1.5rem',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          animation: isCanceled ? 'none' : 'order-tracking-pulse 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <span style={{
        fontSize: 'var(--forge-text-base, 1rem)',
        fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
        fontWeight: 600,
        color: color,
      }}>
        {message}
      </span>
    </div>
  );
}

/** Lookup form — enter order ID + email */
function TrackingForm({ onFound, t, lang }) {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [tenantId, setTenantId] = useState(searchParams.get('tenant') || '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');

    const trimmedId = orderId.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedTenant = tenantId.trim();

    if (!trimmedId) {
      setError(t('tracking.error.noId', lang));
      return;
    }
    if (!trimmedEmail) {
      setError(t('tracking.error.noEmail', lang));
      return;
    }

    setIsSubmitting(true);

    // Simulate small delay for UX
    setTimeout(() => {
      const order = findOrderById(trimmedId, trimmedTenant || undefined);

      if (!order) {
        setError(t('tracking.error.notFound', lang));
        setIsSubmitting(false);
        return;
      }

      // Verify email matches
      const orderEmail = (order.customer_snapshot?.email || '').toLowerCase();
      if (orderEmail !== trimmedEmail) {
        setError(t('tracking.error.emailMismatch', lang));
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onFound(order, trimmedTenant);
    }, 300);
  }, [orderId, email, tenantId, onFound, t, lang]);

  return (
    <div className="order-tracking__page" style={{
      minHeight: 'calc(100vh - 180px)',
      padding: '48px 16px 80px',
      background: 'var(--forge-bg-primary, #13151A)',
    }}>
      <div className="order-tracking__container" style={{ maxWidth: '540px', margin: '0 auto' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 212, 170, 0.1)',
            border: '2px solid rgba(0, 212, 170, 0.2)',
          }}>
            <Icon name="PackageSearch" size={28} color="var(--forge-accent-primary, #00D4AA)" />
          </div>
        </div>

        <h1
          className="order-tracking__heading"
          style={{
            fontSize: 'var(--forge-text-2xl, 1.5rem)',
            fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
            fontWeight: 700,
            color: 'var(--forge-text-primary, #E8ECF1)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}
        >
          {t('tracking.title', lang)}
        </h1>
        <p style={{
          fontSize: 'var(--forge-text-base, 1rem)',
          fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
          color: 'var(--forge-text-secondary, #9BA3B0)',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          {t('tracking.subtitle', lang)}
        </p>

        <div className="order-tracking__card" style={{
          background: 'var(--forge-bg-surface, #0E1015)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-xl, 16px)',
          padding: '1.5rem',
        }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="track-order-id" style={{
                display: 'block',
                fontSize: '12px',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}>
                {t('tracking.field.orderId', lang)}
              </label>
              <input
                id="track-order-id"
                className="order-tracking__input"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onFocus={() => setFocusedField('orderId')}
                onBlur={() => setFocusedField(null)}
                placeholder={t('tracking.placeholder.orderId', lang)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 'var(--forge-text-base, 1rem)',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  color: 'var(--forge-text-primary, #E8ECF1)',
                  background: 'var(--forge-bg-elevated, #181B22)',
                  border: `1px solid ${focusedField === 'orderId' ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
                  borderRadius: 'var(--forge-radius-md, 8px)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                autoComplete="off"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="track-email" style={{
                display: 'block',
                fontSize: '12px',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}>
                {t('tracking.field.email', lang)}
              </label>
              <input
                id="track-email"
                className="order-tracking__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder={t('tracking.placeholder.email', lang)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 'var(--forge-text-base, 1rem)',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  color: 'var(--forge-text-primary, #E8ECF1)',
                  background: 'var(--forge-bg-elevated, #181B22)',
                  border: `1px solid ${focusedField === 'email' ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
                  borderRadius: 'var(--forge-radius-md, 8px)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                autoComplete="email"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            {/* tenantId is stored in component state — no hidden input needed */}

            <button
              type="submit"
              className="order-tracking__btn"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: 'var(--forge-text-base, 1rem)',
                fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--forge-bg-primary, #13151A)',
                background: isSubmitting ? 'var(--forge-text-muted, #7A8291)' : 'var(--forge-accent-primary, #00D4AA)',
                border: 'none',
                borderRadius: 'var(--forge-radius-md, 8px)',
                cursor: isSubmitting ? 'wait' : 'pointer',
                transition: 'opacity 0.15s, background 0.15s',
                marginTop: '0.5rem',
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = isSubmitting ? '0.7' : '1'; }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {isSubmitting ? (
                  <Icon name="Loader2" size={18} style={{ animation: 'order-tracking-pulse 1s linear infinite' }} />
                ) : (
                  <Icon name="Search" size={18} />
                )}
                {isSubmitting
                  ? (lang === 'en' ? 'Searching...' : 'Hledam...')
                  : t('tracking.submit', lang)
                }
              </span>
            </button>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--forge-radius-md, 8px)',
                color: '#ef4444',
                fontSize: 'var(--forge-text-sm, 0.875rem)',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                marginTop: '0.75rem',
              }} role="alert">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/** Status timeline component — enhanced with colored nodes and connecting lines */
function StatusTimeline({ adminStatus, lang, t }) {
  const currentStepIdx = getStepIndex(adminStatus);
  const isCanceled = adminStatus === 'CANCELED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }} role="list" aria-label={t('tracking.timeline.label', lang)}>
      {TRACKING_STEPS.map((step, idx) => {
        const isCompleted = !isCanceled && idx < currentStepIdx;
        const isCurrent = !isCanceled && idx === currentStepIdx;
        const isLast = idx === TRACKING_STEPS.length - 1;
        const stepColor = STATUS_COLORS[step.key] || '#00D4AA';

        const dotBg = isCompleted
          ? stepColor
          : isCurrent
            ? `${stepColor}20`
            : 'var(--forge-bg-elevated, #181B22)';

        const dotBorder = isCurrent
          ? `2px solid ${stepColor}`
          : isCompleted
            ? 'none'
            : '1px solid var(--forge-border-default, #1E2230)';

        const iconColor = isCompleted
          ? '#fff'
          : isCurrent
            ? stepColor
            : 'var(--forge-text-muted, #7A8291)';

        const labelColor = isCompleted || isCurrent
          ? 'var(--forge-text-primary, #E8ECF1)'
          : 'var(--forge-text-muted, #7A8291)';

        const lineBg = isCompleted
          ? stepColor
          : 'var(--forge-border-default, #1E2230)';

        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              position: 'relative',
              paddingBottom: isLast ? '0' : '1.5rem',
            }}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Connecting line */}
            {!isLast && (
              <div
                className={isCompleted ? 'order-tracking__timeline-line--completed' : ''}
                style={{
                  position: 'absolute',
                  left: '19px',
                  top: '40px',
                  width: '2px',
                  bottom: '0',
                  zIndex: 1,
                  background: lineBg,
                  transition: 'background 0.3s',
                }}
                aria-hidden="true"
              />
            )}

            {/* Dot / icon */}
            <div
              className={`order-tracking__timeline-dot ${isCompleted ? 'order-tracking__timeline-dot--completed' : ''}`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
                transition: 'all 0.3s',
                background: dotBg,
                border: dotBorder,
                boxShadow: isCurrent ? `0 0 12px ${stepColor}40` : 'none',
              }}
              aria-hidden="true"
            >
              {isCompleted ? (
                <Icon name="Check" size={18} color={iconColor} />
              ) : (
                <Icon name={step.icon} size={18} color={iconColor} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: '8px', flex: 1 }}>
              <div style={{
                fontSize: 'var(--forge-text-base, 1rem)',
                fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                marginBottom: '2px',
                color: labelColor,
              }}>
                {STEP_LABELS[lang]?.[step.key] || STEP_LABELS.cs[step.key]}
                {isCurrent && (
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                    color: stepColor,
                    background: `${stepColor}15`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    verticalAlign: 'middle',
                  }}>
                    {lang === 'en' ? 'Current' : 'Aktualni'}
                  </span>
                )}
              </div>
              {(isCompleted || isCurrent) && (
                <div className="order-tracking__timeline-desc" style={{
                  fontSize: 'var(--forge-text-sm, 0.875rem)',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  color: 'var(--forge-text-muted, #7A8291)',
                  lineHeight: 1.5,
                }}>
                  {STEP_DESCRIPTIONS[lang]?.[step.key] || STEP_DESCRIPTIONS.cs[step.key]}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Customer notes section */
function CustomerNotes({ order, tenantId, lang, onOrderUpdate }) {
  const [noteText, setNoteText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [focusedNote, setFocusedNote] = useState(false);
  const notes = order.customer_notes || [];

  const handleSend = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    // Simulate brief delay
    setTimeout(() => {
      const updated = saveCustomerNote(order.id, tenantId, trimmed);
      if (updated && onOrderUpdate) {
        onOrderUpdate(updated);
      }
      setNoteText('');
      setIsSending(false);
    }, 200);
  }, [noteText, isSending, order.id, tenantId, onOrderUpdate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div>
      <h2 className="order-tracking__section-title" style={{
        fontSize: 'var(--forge-text-lg, 1.125rem)',
        fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
        fontWeight: 600,
        color: 'var(--forge-text-primary, #E8ECF1)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '1rem',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="MessageSquare" size={18} />
          {lang === 'en' ? 'Messages' : 'Zpravy'}
        </span>
      </h2>

      {/* Existing notes */}
      {notes.length > 0 && (
        <div
          className="order-tracking__notes-list"
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {notes.map((note, idx) => (
            <div key={idx} style={{
              padding: '10px 14px',
              background: 'var(--forge-bg-elevated, #181B22)',
              borderRadius: 'var(--forge-radius-md, 8px)',
              border: '1px solid var(--forge-border-default, #1E2230)',
            }}>
              <div style={{
                fontSize: 'var(--forge-text-sm, 0.875rem)',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                color: 'var(--forge-text-primary, #E8ECF1)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {note.text}
              </div>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                color: 'var(--forge-text-muted, #7A8291)',
                marginTop: '4px',
              }}>
                {formatDateTime(note.created_at, lang)}
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && (
        <p style={{
          fontSize: 'var(--forge-text-sm, 0.875rem)',
          color: 'var(--forge-text-muted, #7A8291)',
          fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
          marginBottom: '1rem',
          fontStyle: 'italic',
        }}>
          {lang === 'en' ? 'No messages yet. Send a note to the seller.' : 'Zatim zadne zpravy. Poslete zpravu prodejci.'}
        </p>
      )}

      {/* New note input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          className="order-tracking__input"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocusedNote(true)}
          onBlur={() => setFocusedNote(false)}
          placeholder={lang === 'en' ? 'Write a message...' : 'Napiste zpravu...'}
          rows={2}
          disabled={isSending}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 'var(--forge-text-sm, 0.875rem)',
            fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
            color: 'var(--forge-text-primary, #E8ECF1)',
            background: 'var(--forge-bg-elevated, #181B22)',
            border: `1px solid ${focusedNote ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
            borderRadius: 'var(--forge-radius-md, 8px)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '48px',
            maxHeight: '120px',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          aria-label={lang === 'en' ? 'Write a message to the seller' : 'Napiste zpravu prodejci'}
        />
        <button
          className="order-tracking__btn"
          onClick={handleSend}
          disabled={!noteText.trim() || isSending}
          style={{
            padding: '10px 16px',
            fontSize: 'var(--forge-text-sm, 0.875rem)',
            fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
            fontWeight: 600,
            color: (!noteText.trim() || isSending) ? 'var(--forge-text-muted, #7A8291)' : 'var(--forge-bg-primary, #13151A)',
            background: (!noteText.trim() || isSending) ? 'var(--forge-bg-elevated, #181B22)' : 'var(--forge-accent-primary, #00D4AA)',
            border: '1px solid var(--forge-border-default, #1E2230)',
            borderRadius: 'var(--forge-radius-md, 8px)',
            cursor: (!noteText.trim() || isSending) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            alignSelf: 'flex-end',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
          aria-label={lang === 'en' ? 'Send message' : 'Odeslat zpravu'}
        >
          <Icon name="Send" size={14} />
          {lang === 'en' ? 'Send' : 'Odeslat'}
        </button>
      </div>
    </div>
  );
}

/** Order detail view — shown after successful lookup */
function OrderDetail({ order: initialOrder, tenantId, onBack, t, lang }) {
  const [order, setOrder] = useState(initialOrder);
  const total = order.totals_snapshot?.total ?? 0;
  const models = order.models || [];
  const adminStatus = order.status || 'NEW';
  const isCanceled = adminStatus === 'CANCELED';
  const estimatedDelivery = estimateDelivery(order.created_at, order.shipping_method);

  useEffect(() => {
    injectPrintStyles();
    injectResponsiveStyles();
  }, []);

  // Build share URL
  const shareUrl = useMemo(() => {
    const base = window.location.origin + '/track';
    const params = new URLSearchParams({ id: order.id });
    if (tenantId) params.set('tenant', tenantId);
    return `${base}?${params.toString()}`;
  }, [order.id, tenantId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrder({ ...updatedOrder });
  }, []);

  return (
    <div className="order-tracking__page" style={{
      minHeight: 'calc(100vh - 180px)',
      padding: '48px 16px 80px',
      background: 'var(--forge-bg-primary, #13151A)',
    }}>
      <div className="order-tracking__container" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1
          className="order-tracking__heading"
          style={{
            fontSize: 'var(--forge-text-2xl, 1.5rem)',
            fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
            fontWeight: 700,
            color: 'var(--forge-text-primary, #E8ECF1)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          {t('tracking.detail.title', lang)}
        </h1>

        {/* Real-time status indicator */}
        <StatusIndicator adminStatus={adminStatus} lang={lang} />

        {/* Canceled order explanation card */}
        {isCanceled && (
          <div className="order-tracking__card" style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--forge-radius-xl, 16px)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(239, 68, 68, 0.12)',
            }}>
              <Icon name="XCircle" size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{
                fontSize: 'var(--forge-text-base, 1rem)',
                fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
                fontWeight: 600,
                color: '#ef4444',
                marginBottom: '0.25rem',
              }}>
                {lang === 'en' ? 'Order Canceled' : 'Objednavka zrusena'}
              </div>
              <div style={{
                fontSize: 'var(--forge-text-sm, 0.875rem)',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                color: 'var(--forge-text-secondary, #9BA3B0)',
                lineHeight: 1.5,
              }}>
                {lang === 'en'
                  ? 'This order has been canceled. If you have questions, please contact us using the message box below.'
                  : 'Tato objednavka byla zrusena. Pokud mate dotazy, kontaktujte nas pres pole zprav nize.'}
              </div>
            </div>
          </div>
        )}

        {/* Order info card */}
        <div className="order-tracking__card" style={{
          background: 'var(--forge-bg-surface, #0E1015)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-xl, 16px)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 className="order-tracking__section-title" style={{
            fontSize: 'var(--forge-text-lg, 1.125rem)',
            fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
            fontWeight: 600,
            color: 'var(--forge-text-primary, #E8ECF1)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            {t('tracking.detail.info', lang)}
          </h2>
          <div className="order-tracking__info-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            <div>
              <div className="order-tracking__info-label" style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '2px',
              }}>
                {t('tracking.detail.orderId', lang)}
              </div>
              <div className="order-tracking__info-value" style={{
                fontSize: 'var(--forge-text-base, 1rem)',
                fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                fontWeight: 500,
                color: 'var(--forge-accent-primary, #00D4AA)',
              }}>
                {order.id}
              </div>
            </div>
            <div>
              <div className="order-tracking__info-label" style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '2px',
              }}>
                {t('tracking.detail.date', lang)}
              </div>
              <div className="order-tracking__info-value" style={{
                fontSize: 'var(--forge-text-base, 1rem)',
                fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                fontWeight: 500,
                color: 'var(--forge-text-primary, #E8ECF1)',
              }}>
                {formatDate(order.created_at, lang)}
              </div>
            </div>
            {!isCanceled && estimatedDelivery && adminStatus !== 'DONE' && (
              <div>
                <div className="order-tracking__info-label" style={{
                  fontSize: '11px',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  fontWeight: 500,
                  color: 'var(--forge-text-muted, #7A8291)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}>
                  {t('tracking.detail.estimated', lang)}
                </div>
                <div className="order-tracking__info-value" style={{
                  fontSize: 'var(--forge-text-base, 1rem)',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  fontWeight: 500,
                  color: 'var(--forge-text-primary, #E8ECF1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}>
                  <Icon name="Calendar" size={14} color="var(--forge-text-muted, #7A8291)" />
                  {formatDate(estimatedDelivery, lang)}
                </div>
              </div>
            )}
            {order.shipping_method && (
              <div>
                <div className="order-tracking__info-label" style={{
                  fontSize: '11px',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  fontWeight: 500,
                  color: 'var(--forge-text-muted, #7A8291)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}>
                  {t('tracking.detail.shipping', lang)}
                </div>
                <div className="order-tracking__info-value" style={{
                  fontSize: 'var(--forge-text-base, 1rem)',
                  fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                  fontWeight: 500,
                  color: 'var(--forge-text-primary, #E8ECF1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}>
                  <Icon name="Truck" size={14} color="var(--forge-text-muted, #7A8291)" />
                  {order.shipping_method.charAt(0).toUpperCase() + order.shipping_method.slice(1)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline card */}
        {!isCanceled && (
          <div className="order-tracking__card" style={{
            background: 'var(--forge-bg-surface, #0E1015)',
            border: '1px solid var(--forge-border-default, #1E2230)',
            borderRadius: 'var(--forge-radius-xl, 16px)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 className="order-tracking__section-title" style={{
              fontSize: 'var(--forge-text-lg, 1.125rem)',
              fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
              fontWeight: 600,
              color: 'var(--forge-text-primary, #E8ECF1)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}>
              {t('tracking.detail.status', lang)}
            </h2>
            <StatusTimeline adminStatus={adminStatus} lang={lang} t={t} />
          </div>
        )}

        {/* Items card with model thumbnails */}
        <div className="order-tracking__card" style={{
          background: 'var(--forge-bg-surface, #0E1015)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-xl, 16px)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 className="order-tracking__section-title" style={{
            fontSize: 'var(--forge-text-lg, 1.125rem)',
            fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
            fontWeight: 600,
            color: 'var(--forge-text-primary, #E8ECF1)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            {t('tracking.detail.items', lang)}
            {models.length > 0 && (
              <span style={{
                marginLeft: '8px',
                fontSize: '12px',
                fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                color: 'var(--forge-text-muted, #7A8291)',
                fontWeight: 400,
              }}>
                ({models.length})
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {models.map((m, idx) => (
              <div
                key={m.id || idx}
                className="order-tracking__model-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 0',
                  borderBottom: idx === models.length - 1
                    ? 'none'
                    : '1px solid var(--forge-border-default, #1E2230)',
                }}
              >
                {/* Model thumbnail */}
                <ModelThumbnail
                  file={m.file_snapshot?.file || null}
                  size={48}
                />

                {/* Model info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="order-tracking__model-name" style={{
                    fontSize: 'var(--forge-text-base, 1rem)',
                    fontWeight: 500,
                    color: 'var(--forge-text-primary, #E8ECF1)',
                    fontFamily: 'var(--forge-font-body, "IBM Plex Sans", system-ui, sans-serif)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {m.file_snapshot?.filename || `Model ${idx + 1}`}
                  </div>
                  <div className="order-tracking__model-meta" style={{
                    fontSize: 'var(--forge-text-xs, 0.75rem)',
                    color: 'var(--forge-text-muted, #7A8291)',
                    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}>
                    <span>{m.quantity || 1}x</span>
                    <span style={{ color: 'var(--forge-border-default, #1E2230)' }}>&bull;</span>
                    <span>{m.material_snapshot?.name || 'PLA'}</span>
                    {m.material_snapshot?.color && (
                      <>
                        <span style={{ color: 'var(--forge-border-default, #1E2230)' }}>&bull;</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: m.material_snapshot.color,
                            border: '1px solid var(--forge-border-default, #1E2230)',
                            flexShrink: 0,
                          }} />
                          {m.material_snapshot.colorName || ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Per-item price if available */}
                {m.price_snapshot?.total != null && (
                  <div style={{
                    fontSize: 'var(--forge-text-sm, 0.875rem)',
                    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                    color: 'var(--forge-text-secondary, #9BA3B0)',
                    flexShrink: 0,
                  }}>
                    {formatCzk(m.price_snapshot.total)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '2px solid var(--forge-accent-primary, #00D4AA)',
            marginTop: '0.5rem',
          }}>
            <span style={{
              fontWeight: 600,
              color: 'var(--forge-text-primary, #E8ECF1)',
              fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {lang === 'en' ? 'Total' : 'Celkem'}
            </span>
            <span className="order-tracking__total-value" style={{
              fontSize: 'var(--forge-text-xl, 1.25rem)',
              fontWeight: 700,
              color: 'var(--forge-accent-primary, #00D4AA)',
              fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
            }}>
              {formatCzk(total)}
            </span>
          </div>
        </div>

        {/* Customer notes card */}
        <div className="order-tracking__card" style={{
          background: 'var(--forge-bg-surface, #0E1015)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-xl, 16px)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <CustomerNotes
            order={order}
            tenantId={tenantId}
            lang={lang}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>

        {/* Action buttons row */}
        <div
          className="order-tracking__actions-row order-tracking__no-print"
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Print button */}
          <button
            className="order-tracking__btn"
            onClick={handlePrint}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '10px 16px',
              fontSize: 'var(--forge-text-sm, 0.875rem)',
              fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--forge-text-primary, #E8ECF1)',
              background: 'var(--forge-bg-surface, #0E1015)',
              border: '1px solid var(--forge-border-default, #1E2230)',
              borderRadius: 'var(--forge-radius-md, 8px)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-border-default, #1E2230)';
            }}
            aria-label={lang === 'en' ? 'Print order summary' : 'Vytisknout prehled objednavky'}
          >
            <Icon name="Printer" size={16} />
            {lang === 'en' ? 'Print Summary' : 'Vytisknout'}
          </button>

          {/* Back / track another */}
          <button
            className="order-tracking__btn"
            onClick={onBack}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '10px 16px',
              fontSize: 'var(--forge-text-sm, 0.875rem)',
              fontFamily: 'var(--forge-font-heading, "Space Grotesk", system-ui, sans-serif)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--forge-text-secondary, #9BA3B0)',
              background: 'transparent',
              border: '1px solid var(--forge-border-default, #1E2230)',
              borderRadius: 'var(--forge-radius-md, 8px)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
              e.currentTarget.style.color = 'var(--forge-text-primary, #E8ECF1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-border-default, #1E2230)';
              e.currentTarget.style.color = 'var(--forge-text-secondary, #9BA3B0)';
            }}
          >
            <Icon name="ArrowLeft" size={16} />
            {lang === 'en' ? 'Track Another' : 'Dalsi objednavka'}
          </button>
        </div>

        {/* Share link bar */}
        <div
          className="order-tracking__share-bar order-tracking__no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--forge-bg-elevated, #181B22)',
            borderRadius: 'var(--forge-radius-md, 8px)',
          }}
        >
          <Icon name="Link" size={16} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
          <span className="order-tracking__share-url" style={{
            flex: 1,
            fontSize: 'var(--forge-text-sm, 0.875rem)',
            fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
            color: 'var(--forge-text-secondary, #9BA3B0)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {shareUrl}
          </span>
          <div className="order-tracking__share-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <CopyButton
              text={shareUrl}
              label={lang === 'en' ? 'Copy Link' : 'Kopirovat'}
              copiedLabel={lang === 'en' ? 'Copied!' : 'Zkopirovano!'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Translations ────────────────────────────────────────────── */

const TR = {
  cs: {
    'tracking.title': 'Sledovani objednavky',
    'tracking.subtitle': 'Zadejte cislo objednavky a email pro zobrazeni stavu.',
    'tracking.field.orderId': 'Cislo objednavky',
    'tracking.field.email': 'Email',
    'tracking.placeholder.orderId': 'napr. ORD-1710000000000',
    'tracking.placeholder.email': 'vas@email.cz',
    'tracking.submit': 'Sledovat objednavku',
    'tracking.error.noId': 'Zadejte cislo objednavky.',
    'tracking.error.noEmail': 'Zadejte email.',
    'tracking.error.notFound': 'Objednavka nebyla nalezena. Zkontrolujte cislo objednavky.',
    'tracking.error.emailMismatch': 'Email neodpovida objednavce. Zkontrolujte zadane udaje.',
    'tracking.detail.title': 'Stav objednavky',
    'tracking.detail.info': 'Informace',
    'tracking.detail.orderId': 'Cislo objednavky',
    'tracking.detail.date': 'Datum',
    'tracking.detail.estimated': 'Odhadovane doruceni',
    'tracking.detail.shipping': 'Doprava',
    'tracking.detail.status': 'Prubeh objednavky',
    'tracking.detail.items': 'Polozky',
    'tracking.timeline.label': 'Prubeh objednavky',
  },
  en: {
    'tracking.title': 'Order Tracking',
    'tracking.subtitle': 'Enter your order number and email to view the status.',
    'tracking.field.orderId': 'Order ID',
    'tracking.field.email': 'Email',
    'tracking.placeholder.orderId': 'e.g. ORD-1710000000000',
    'tracking.placeholder.email': 'your@email.com',
    'tracking.submit': 'Track Order',
    'tracking.error.noId': 'Please enter an order ID.',
    'tracking.error.noEmail': 'Please enter your email.',
    'tracking.error.notFound': 'Order not found. Please check the order ID.',
    'tracking.error.emailMismatch': 'Email does not match the order. Please check your details.',
    'tracking.detail.title': 'Order Status',
    'tracking.detail.info': 'Information',
    'tracking.detail.orderId': 'Order ID',
    'tracking.detail.date': 'Date',
    'tracking.detail.estimated': 'Estimated Delivery',
    'tracking.detail.shipping': 'Shipping',
    'tracking.detail.status': 'Order Progress',
    'tracking.detail.items': 'Items',
    'tracking.timeline.label': 'Order progress',
  },
};

function translate(key, lang) {
  return TR[lang]?.[key] || TR.cs[key] || key;
}

/* ── Main Page ───────────────────────────────────────────────── */

export default function OrderTracking() {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'cs';
  const [foundOrder, setFoundOrder] = useState(null);
  const [usedTenant, setUsedTenant] = useState('');

  useEffect(() => {
    injectResponsiveStyles();
  }, []);

  const handleFound = useCallback((order, tenant) => {
    setFoundOrder(order);
    setUsedTenant(tenant || '');
  }, []);

  const handleBack = useCallback(() => {
    setFoundOrder(null);
    setUsedTenant('');
  }, []);

  if (foundOrder) {
    return (
      <OrderDetail
        order={foundOrder}
        tenantId={usedTenant}
        onBack={handleBack}
        t={translate}
        lang={lang}
      />
    );
  }

  return (
    <TrackingForm
      onFound={handleFound}
      t={translate}
      lang={lang}
    />
  );
}
