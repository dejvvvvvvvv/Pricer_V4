// Admin Integrations Page — Integration marketplace + Shopify configuration
// Route: /admin/integrations
//
// Views:
// 1) Marketplace grid — all integration cards with status
// 2) Detail view — Shopify config (existing), placeholders for others
//
// Integrations:
// - Shopify (active, full config)
// - WooCommerce, Stripe, PayPal, Zasilkovna, PPL/DPD, Google Analytics (placeholder)
// - Custom API Webhook (link to /admin/webhooks)

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { debug } from '@/lib/debug';
import { writeTenantJson } from '../../utils/adminTenantStorage';
import {
  getEcommerceConfig,
  saveEcommerceConfig,
  addVariantMapping,
  updateVariantMapping,
  deleteVariantMapping,
  getDefaultEcommerceConfig,
  updateIntegrationsMeta,
} from '../../utils/adminEcommerceStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import { SkeletonCard } from '../../components/ui/forge/ForgeSkeleton';
import {
  testShopifyConnection,
  validateShopifyConfig,
  buildCartPermalinkUrl,
} from '../../lib/shopify/shopifyCartClient';

// ─── Shared Styles ──────────────────────────────────────────

const cardStyle = {
  backgroundColor: 'var(--forge-bg-surface)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-md, 12px)',
  padding: '24px',
  marginBottom: '20px',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--forge-text-secondary)',
  fontFamily: 'var(--forge-font-body)',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-sm, 8px)',
  color: 'var(--forge-text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--forge-font-body)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8291' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: 'var(--forge-accent-primary)',
  color: 'var(--forge-text-primary)',
  border: 'none',
  borderRadius: 'var(--forge-radius-sm, 8px)',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'var(--forge-font-body)',
  cursor: 'pointer',
  transition: 'opacity 150ms',
};

const btnOutline = {
  ...btnPrimary,
  backgroundColor: 'transparent',
  border: '1px solid var(--forge-border-default)',
  color: 'var(--forge-text-secondary)',
};

// ─── Integration Registry ───────────────────────────────────

const INTEGRATIONS = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'ShoppingBag',
    iconColor: '#96BF48',
    category: 'ecommerce',
    available: true,
    description_cs: 'Propojte kalkulacku s vasim Shopify obchodem. Zakaznici budou presmerovani na Shopify checkout.',
    description_en: 'Connect your calculator with your Shopify store. Customers will be redirected to Shopify checkout.',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'Store',
    iconColor: '#9B5C8F',
    category: 'ecommerce',
    available: false,
    description_cs: 'Integrace s WooCommerce obchodem na WordPressu. Automaticke vytvareni produktu a objednavek.',
    description_en: 'Integration with WooCommerce store on WordPress. Automatic product and order creation.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'CreditCard',
    iconColor: '#635BFF',
    category: 'payments',
    available: false,
    description_cs: 'Prijimejte platby kartou primo v kalkulacce. Bezpecne zpracovani pres Stripe.',
    description_en: 'Accept card payments directly in the calculator. Secure processing via Stripe.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'Wallet',
    iconColor: '#003087',
    category: 'payments',
    available: false,
    description_cs: 'Prijimejte platby pres PayPal. Snadna integrace s PayPal Checkout.',
    description_en: 'Accept payments via PayPal. Easy integration with PayPal Checkout.',
  },
  {
    id: 'zasilkovna',
    name: 'Zasilkovna',
    icon: 'Package',
    iconColor: '#BA1B02',
    category: 'shipping',
    available: false,
    description_cs: 'Zasilkovna (Packeta) — mapa vydejnich mist, sledovani zasilek, automaticke stitky.',
    description_en: 'Zasilkovna (Packeta) — pickup point map, shipment tracking, automatic labels.',
  },
  {
    id: 'ppl_dpd',
    name: 'PPL / DPD',
    icon: 'Truck',
    iconColor: '#1A6FB5',
    category: 'shipping',
    available: false,
    description_cs: 'Prepravni sluzby PPL a DPD. Automaticke vytvareni zasilek a tisk stitku.',
    description_en: 'PPL and DPD shipping services. Automatic shipment creation and label printing.',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    icon: 'BarChart3',
    iconColor: '#F9AB00',
    category: 'analytics',
    available: false,
    description_cs: 'Sledujte chovani uzivatelu v kalkulacce. Konverze, udalosti, e-commerce tracking.',
    description_en: 'Track user behavior in the calculator. Conversions, events, e-commerce tracking.',
  },
  {
    id: 'webhook',
    name: 'Custom API Webhook',
    icon: 'Webhook',
    iconColor: 'var(--forge-accent-primary)',
    category: 'developer',
    available: true,
    isLink: true,
    linkTo: '/admin/webhooks',
    description_cs: 'Vlastni webhooky pro napojeni na libovolny externi system. Plna kontrola nad udalostmi.',
    description_en: 'Custom webhooks for connecting to any external system. Full control over events.',
  },
];

const CATEGORY_LABELS = {
  ecommerce: { cs: 'E-commerce', en: 'E-commerce' },
  payments: { cs: 'Platby', en: 'Payments' },
  shipping: { cs: 'Doprava', en: 'Shipping' },
  analytics: { cs: 'Analytika', en: 'Analytics' },
  developer: { cs: 'Vyvojar', en: 'Developer' },
};

// ─── Toggle Component ────────────────────────────────────────

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        backgroundColor: checked ? 'var(--forge-accent-primary)' : 'var(--forge-bg-elevated)',
        border: `1px solid ${checked ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        position: 'relative',
        transition: 'all 200ms ease-out',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'var(--forge-text-primary)',
          position: 'absolute',
          top: '2px',
          left: checked ? '25px' : '2px',
          transition: 'left 200ms ease-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      {label && (
        <span style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--forge-text-primary)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {label}
        </span>
      )}
    </button>
  );
}

// ─── Setup Step Component ────────────────────────────────────

function SetupStep({ number, title, done, open, onToggle, children }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--forge-border-default)',
      padding: '16px 0',
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? 'var(--forge-accent-primary)' : 'var(--forge-bg-elevated)',
          color: done ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'var(--forge-font-tech)',
          flexShrink: 0,
        }}>
          {done ? <Icon name="Check" size={14} /> : number}
        </div>
        <span style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--forge-text-primary)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {title}
        </span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} style={{ color: 'var(--forge-text-muted)' }} />
      </button>
      {open && (
        <div style={{
          marginTop: '12px',
          marginLeft: '40px',
          fontSize: '13px',
          color: 'var(--forge-text-secondary)',
          fontFamily: 'var(--forge-font-body)',
          lineHeight: '1.6',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────

function StatusBadge({ status, cs, t }) {
  const safeT = t || ((key, fallback) => fallback || key);
  const styles = {
    connected: {
      bg: 'rgba(0, 212, 170, 0.1)',
      border: 'rgba(0, 212, 170, 0.25)',
      color: 'var(--forge-success)',
      label: safeT('admin.integrations.statusConnected', cs ? 'Pripojeno' : 'Connected'),
      icon: 'CheckCircle',
    },
    configuring: {
      bg: 'rgba(255, 181, 71, 0.1)',
      border: 'rgba(255, 181, 71, 0.25)',
      color: 'var(--forge-warning)',
      label: safeT('admin.integrations.statusConfiguring', cs ? 'Konfigurace' : 'Configuring'),
      icon: 'Settings',
    },
    disconnected: {
      bg: 'var(--forge-bg-elevated)',
      border: 'var(--forge-border-default)',
      color: 'var(--forge-text-muted)',
      label: safeT('admin.integrations.statusDisconnected', cs ? 'Odpojeno' : 'Disconnected'),
      icon: 'MinusCircle',
    },
    coming_soon: {
      bg: 'rgba(108, 99, 255, 0.08)',
      border: 'rgba(108, 99, 255, 0.2)',
      color: 'var(--forge-accent-tertiary)',
      label: safeT('admin.integrations.statusComingSoon', cs ? 'Pripravujeme' : 'Coming soon'),
      icon: 'Clock',
    },
    error: {
      bg: 'rgba(255, 71, 87, 0.08)',
      border: 'rgba(255, 71, 87, 0.2)',
      color: 'var(--forge-error)',
      label: safeT('admin.integrations.statusError', cs ? 'Chyba' : 'Error'),
      icon: 'AlertTriangle',
    },
  };

  const s = styles[status] || styles.disconnected;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
      backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-tech)',
      color: s.color,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      <Icon name={s.icon} size={11} />
      {s.label}
    </span>
  );
}

// ─── Integration Card (marketplace grid) ────────────────────

function IntegrationCard({ integration, status, lastSync, onOpen, cs, t }) {
  const safeT = t || ((key, fallback) => fallback || key);
  const desc = cs ? integration.description_cs : integration.description_en;
  const isComingSoon = !integration.available;
  const category = CATEGORY_LABELS[integration.category];
  const catLabel = cs ? category?.cs : category?.en;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
        backgroundColor: 'var(--forge-bg-surface)',
        border: `1px solid ${status === 'connected' ? 'rgba(0, 212, 170, 0.25)' : 'var(--forge-border-default)'}`,
        borderRadius: 'var(--forge-radius-md, 12px)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color 150ms, box-shadow 150ms',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '180px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isComingSoon
          ? 'rgba(108, 99, 255, 0.3)'
          : 'var(--forge-accent-primary)';
        e.currentTarget.style.boxShadow = isComingSoon
          ? '0 0 0 1px rgba(108, 99, 255, 0.1)'
          : '0 0 0 1px rgba(0, 212, 170, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = status === 'connected'
          ? 'rgba(0, 212, 170, 0.25)'
          : 'var(--forge-border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: 'var(--forge-bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={integration.icon} size={22} style={{ color: integration.iconColor }} />
        </div>
        <StatusBadge status={status} cs={cs} t={t} />
      </div>

      {/* Name + category */}
      <h3 style={{
        fontFamily: 'var(--forge-font-heading)',
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--forge-text-primary)',
        margin: '0 0 2px 0',
      }}>
        {integration.name}
      </h3>
      <span style={{
        fontSize: '11px',
        fontFamily: 'var(--forge-font-tech)',
        color: 'var(--forge-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '10px',
      }}>
        {catLabel}
      </span>

      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: 'var(--forge-text-secondary)',
        fontFamily: 'var(--forge-font-body)',
        lineHeight: '1.5',
        margin: '0 0 auto 0',
      }}>
        {desc}
      </p>

      {/* Last sync info */}
      {lastSync && (
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--forge-border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
        }}>
          <Icon name="RefreshCw" size={11} />
          {safeT('admin.integrations.lastSync', cs ? 'Posledni sync' : 'Last sync')}: {lastSync}
        </div>
      )}

      {/* Link arrow for webhook */}
      {integration.isLink && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--forge-accent-primary)',
        }}>
          {safeT('admin.integrations.openSettings', cs ? 'Otevrit nastaveni' : 'Open settings')}
          <Icon name="ArrowRight" size={14} />
        </div>
      )}
    </button>
  );
}

// ─── Coming Soon Detail ──────────────────────────────────────

function ComingSoonDetail({ integration, cs, t, onClose }) {
  const safeT = t || ((key, fallback) => fallback || key);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) return;
    // Store notification request via tenant storage helper
    try {
      writeTenantJson(`integration_notify:${integration.id}`, { email, date: new Date().toISOString() });
    } catch { /* ignore */ }
    setSubscribed(true);
  };

  const desc = cs ? integration.description_cs : integration.description_en;

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--forge-text-muted)',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          padding: '0',
          marginBottom: '20px',
        }}
      >
        <Icon name="ArrowLeft" size={16} />
        {safeT('admin.integrations.backToList', cs ? 'Zpet na integrace' : 'Back to integrations')}
      </button>

      {/* Header */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'var(--forge-bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name={integration.icon} size={28} style={{ color: integration.iconColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--forge-text-primary)',
            margin: 0,
          }}>
            {integration.name}
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            fontFamily: 'var(--forge-font-body)',
            margin: '4px 0 0 0',
          }}>
            {desc}
          </p>
        </div>
        <StatusBadge status="coming_soon" cs={cs} t={t} />
      </div>

      {/* Coming soon content */}
      <div style={cardStyle}>
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(108, 99, 255, 0.08)',
            border: '1px solid rgba(108, 99, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon name="Clock" size={28} style={{ color: 'var(--forge-accent-tertiary)' }} />
          </div>

          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '8px',
          }}>
            {safeT('admin.integrations.comingSoon', cs ? 'Integrace se pripravuje' : 'Integration coming soon')}
          </h3>

          <p style={{
            fontSize: '14px',
            color: 'var(--forge-text-secondary)',
            fontFamily: 'var(--forge-font-body)',
            maxWidth: '400px',
            margin: '0 auto 24px',
            lineHeight: '1.6',
          }}>
            {cs
              ? 'Pracujeme na teto integraci. Zadejte svuj e-mail a budeme vas informovat, jakmile bude k dispozici.'
              : 'We are working on this integration. Enter your email and we will notify you when it becomes available.'}
          </p>

          {subscribed ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: 'var(--forge-radius-sm, 8px)',
              backgroundColor: 'rgba(0, 212, 170, 0.08)',
              border: '1px solid rgba(0, 212, 170, 0.2)',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--forge-success)',
            }}>
              <Icon name="CheckCircle" size={16} />
              {safeT('admin.integrations.notifySubscribed', cs ? 'Odber nastaven! Budeme vas informovat.' : 'Subscribed! We will notify you.')}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              gap: '8px',
              maxWidth: '400px',
              margin: '0 auto',
            }}>
              <input
                type="email"
                placeholder={safeT('admin.integrations.notifyEmailPlaceholder', cs ? 'vas@email.cz' : 'your@email.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <button
                onClick={handleSubscribe}
                style={btnPrimary}
              >
                <Icon name="Bell" size={16} />
                {safeT('admin.integrations.notifyBtn', cs ? 'Upozornit' : 'Notify me')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shopify Detail View ─────────────────────────────────────

function ShopifyDetail({ config, setConfig, cs, t, onClose, materials }) {
  const safeT = t || ((key, fallback) => fallback || key);
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openStep, setOpenStep] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    material_key: '',
    quality_key: 'standard',
    shopify_variant_id: '',
    shopify_product_title: '',
  });
  const [showToken, setShowToken] = useState(false);
  const saveDebounceRef = useRef(null);

  const handleSave = useCallback((newConfig) => {
    setSaving(true);
    try {
      const saved = saveEcommerceConfig(newConfig);
      setConfig(saved);
      setBanner({ type: 'success', msg: safeT('admin.integrations.saved', cs ? 'Ulozeno' : 'Saved') });
      setTimeout(() => setBanner(null), 3000);
    } catch (e) {
      setBanner({ type: 'error', msg: e.message });
    }
    setSaving(false);
  }, [cs, setConfig]);

  const updateField = useCallback((field, value) => {
    setConfig(prev => {
      const next = {
        ...prev,
        shopify: { ...prev.shopify, [field]: value },
      };
      // Debounce save — wait 300ms after last keystroke before persisting
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => handleSave(next), 300);
      return next;
    });
  }, [handleSave, setConfig]);

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    // Validate before making a network request
    const validation = validateShopifyConfig(config.shopify);
    if (!validation.valid) {
      setTestResult({ success: false, error: validation.errors.join(' · ') });
      setTesting(false);
      return;
    }
    try {
      const result = await testShopifyConnection({
        shopDomain: config.shopify.shop_domain,
        storefrontAccessToken: config.shopify.storefront_access_token,
      });
      setTestResult(result);
      updateIntegrationsMeta({
        last_test_at: new Date().toISOString(),
        test_result: result.success ? 'ok' : 'error',
      });
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    }
    setTesting(false);
  }, [config]);

  const handleTestCart = useCallback(() => {
    if (!config?.shopify?.shop_domain) return;
    const testLine = config.shopify.fallback_variant_id || (config.shopify.variant_mappings?.[0]?.shopify_variant_id);
    if (!testLine) {
      setTestResult({ success: false, error: safeT('admin.integrations.noVariantForTest', cs ? 'Zadny variant ID pro test' : 'No variant ID for test') });
      return;
    }
    const result = buildCartPermalinkUrl({
      shopDomain: config.shopify.shop_domain,
      lineItems: [{ variantId: testLine, quantity: 1 }],
      note: 'ModelPricer Test Cart',
    });
    if (result.url) {
      window.open(result.url, '_blank');
      setTestResult({ success: true, shopName: 'Test cart opened', shopUrl: result.url });
    }
  }, [config, cs]);

  const handleAddMapping = useCallback(() => {
    if (!mappingForm.shopify_variant_id) return;
    addVariantMapping(mappingForm);
    setConfig(getEcommerceConfig());
    setMappingForm({ material_key: '', quality_key: 'standard', shopify_variant_id: '', shopify_product_title: '' });
    setShowMappingForm(false);
  }, [mappingForm, setConfig]);

  const handleDeleteMapping = useCallback((id) => {
    deleteVariantMapping(id);
    setConfig(getEcommerceConfig());
  }, [setConfig]);

  const handleToggleMapping = useCallback((id, active) => {
    updateVariantMapping(id, { active });
    setConfig(getEcommerceConfig());
  }, [setConfig]);

  const shopify = config.shopify || {};
  const mappings = Array.isArray(shopify.variant_mappings) ? shopify.variant_mappings : [];
  const isEnabled = !!shopify.enabled;
  const hasDomain = !!shopify.shop_domain;
  const hasToken = !!shopify.storefront_access_token;
  const step1Done = hasDomain && hasToken;
  const step2Done = mappings.length > 0 || !!shopify.fallback_variant_id;
  const step5Done = testResult?.success === true;
  const meta = config.integrations_meta || {};

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--forge-text-muted)',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          padding: '0',
          marginBottom: '20px',
        }}
      >
        <Icon name="ArrowLeft" size={16} />
        {safeT('admin.integrations.backToList', cs ? 'Zpet na integrace' : 'Back to integrations')}
      </button>

      {/* Banner */}
      {banner && (
        <div style={{
          ...cardStyle,
          padding: '12px 16px',
          backgroundColor: banner.type === 'success' ? 'rgba(0, 212, 170, 0.08)' : 'rgba(220, 38, 38, 0.08)',
          borderColor: banner.type === 'success' ? 'var(--forge-accent-primary)' : 'var(--forge-error)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Icon
            name={banner.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
            size={16}
            style={{ color: banner.type === 'success' ? 'var(--forge-success)' : 'var(--forge-error)' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--forge-text-primary)' }}>{banner.msg}</span>
        </div>
      )}

      {/* Header card with toggle + health */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              backgroundColor: 'var(--forge-bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="ShoppingBag" size={24} style={{ color: '#96BF48' }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '20px', fontWeight: 700,
                color: 'var(--forge-text-primary)',
                margin: 0,
              }}>
                Shopify
              </h2>
              <StatusBadge
                status={isEnabled && step1Done ? 'connected' : isEnabled ? 'configuring' : 'disconnected'}
                cs={cs}
                t={t}
              />
            </div>
          </div>
          <Toggle
            checked={isEnabled}
            onChange={(v) => updateField('enabled', v)}
          />
        </div>

        {/* Health summary for connected integrations */}
        {isEnabled && step1Done && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm, 8px)',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {safeT('admin.integrations.lastTest', cs ? 'Posledni test' : 'Last test')}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>
                {meta.last_test_at
                  ? new Date(meta.last_test_at).toLocaleString(cs ? 'cs-CZ' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
                  : safeT('admin.integrations.notTestedYet', cs ? 'Zatim netestovano' : 'Not tested yet')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {safeT('admin.integrations.status', cs ? 'Stav' : 'Status')}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: meta.test_result === 'ok' ? 'var(--forge-success)' : meta.test_result === 'error' ? 'var(--forge-error)' : 'var(--forge-text-secondary)',
                fontFamily: 'var(--forge-font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                {meta.test_result === 'ok' && <Icon name="CheckCircle" size={13} />}
                {meta.test_result === 'error' && <Icon name="AlertTriangle" size={13} />}
                {meta.test_result === 'ok' ? 'OK' : meta.test_result === 'error' ? safeT('admin.integrations.error', cs ? 'Chyba' : 'Error') : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {safeT('admin.integrations.ordersSent', cs ? 'Odeslane objednavky' : 'Orders sent')}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>
                {meta.orders_sent_count || 0}
              </div>
            </div>
          </div>
        )}

        {!isEnabled && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm, 8px)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: '1.6',
          }}>
            <p style={{ margin: 0 }}>
              {cs
                ? 'Objednavky se zpracovavaji primo v ModelPriceru. Zakaznici vyplni objednavkovy formular a objednavka se ulozi v sekci Orders.'
                : 'Orders are processed directly in ModelPricer. Customers fill out the order form and the order is saved in the Orders section.'}
            </p>
          </div>
        )}

        {isEnabled && !step1Done && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 212, 170, 0.05)',
            borderRadius: 'var(--forge-radius-sm, 8px)',
            border: '1px solid rgba(0, 212, 170, 0.15)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: '1.6',
          }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--forge-text-primary)' }}>
                {safeT('admin.integrations.shopifyModeActive', cs ? 'Shopify rezim aktivni' : 'Shopify mode active')}
              </strong>
              {' — '}
              {cs
                ? 'Zakaznici budou presmerovani na vas Shopify checkout. Platba a doprava se resi na strane Shopify.'
                : 'Customers will be redirected to your Shopify checkout. Payment and shipping are handled by Shopify.'}
            </p>
          </div>
        )}
      </div>

      {/* Setup Guide */}
      {isEnabled && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '12px',
          }}>
            {safeT('admin.integrations.setupGuide', cs ? 'Navod k nastaveni' : 'Setup Guide')}
          </h3>

          <SetupStep
            number={1}
            title={cs ? 'Vytvorte Custom App v Shopify' : 'Create a Custom App in Shopify'}
            done={step1Done}
            open={openStep === 1}
            onToggle={() => setOpenStep(openStep === 1 ? null : 1)}
          >
            <ol style={{ paddingLeft: '16px', margin: 0 }}>
              <li>{cs ? 'Jdete do' : 'Go to'} Settings &rarr; Apps and sales channels &rarr; Develop apps</li>
              <li>{cs ? 'Kliknete' : 'Click'} &quot;Create an app&quot; &rarr; {cs ? 'Pojmenujte' : 'Name it'} &quot;ModelPricer&quot;</li>
              <li>{cs ? 'V' : 'In'} &quot;Configuration&quot; &rarr; Storefront API access scopes:</li>
              <ul style={{ paddingLeft: '16px' }}>
                <li><code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-accent-primary)' }}>unauthenticated_read_product_listings</code></li>
                <li><code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-accent-primary)' }}>unauthenticated_write_checkouts</code></li>
              </ul>
              <li>{cs ? 'Kliknete' : 'Click'} &quot;Install app&quot;</li>
              <li>{cs ? 'Zkopirujte' : 'Copy'} &quot;Storefront API access token&quot;</li>
            </ol>
          </SetupStep>

          <SetupStep
            number={2}
            title={cs ? 'Vytvorte produkt(y) v Shopify' : 'Create product(s) in Shopify'}
            done={step2Done}
            open={openStep === 2}
            onToggle={() => setOpenStep(openStep === 2 ? null : 2)}
          >
            <ol style={{ paddingLeft: '16px', margin: 0 }}>
              <li>Products &rarr; Add product &rarr; {cs ? 'napr.' : 'e.g.'} &quot;3D Tisk&quot;</li>
              <li>{cs ? 'Pridejte varianty pro kazdy material/kvalitu' : 'Add variants for each material/quality'}</li>
              <li>{cs ? 'Variant ID najdete v URL produktu' : 'Find Variant ID in the product URL'}</li>
            </ol>
          </SetupStep>

          <SetupStep
            number={3}
            title={cs ? 'Zadejte pripojovaci udaje' : 'Enter connection details'}
            done={step1Done}
            open={openStep === 3}
            onToggle={() => setOpenStep(openStep === 3 ? null : 3)}
          >
            <p>{cs ? 'Vyplnte shop domain a token nize v sekci Konfigurace.' : 'Fill in shop domain and token below in the Configuration section.'}</p>
          </SetupStep>

          <SetupStep
            number={4}
            title={cs ? 'Namapujte materialy na varianty' : 'Map materials to variants'}
            done={step2Done}
            open={openStep === 4}
            onToggle={() => setOpenStep(openStep === 4 ? null : 4)}
          >
            <p>{cs ? 'Prirazdte kazdy material/kvalitu k Shopify variant ID nize v sekci Mapovani.' : 'Assign each material/quality to a Shopify variant ID below in the Mapping section.'}</p>
          </SetupStep>

          <SetupStep
            number={5}
            title={cs ? 'Otestujte pripojeni' : 'Test connection'}
            done={step5Done}
            open={openStep === 5}
            onToggle={() => setOpenStep(openStep === 5 ? null : 5)}
          >
            <p>{cs ? 'Pouzijte tlacitko Test pripojeni nize.' : 'Use the Test Connection button below.'}</p>
          </SetupStep>
        </div>
      )}

      {/* Configuration */}
      {isEnabled && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '20px',
          }}>
            {safeT('admin.integrations.connectionDetails', cs ? 'Pripojovaci udaje' : 'Connection Details')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Shop Domain */}
            <div>
              <label style={labelStyle}>{safeT('admin.integrations.shopDomain', cs ? 'Shop domain' : 'Shop Domain')}</label>
              <input
                type="text"
                placeholder="myshop.myshopify.com"
                value={shopify.shop_domain || ''}
                onChange={(e) => updateField('shop_domain', e.target.value.trim())}
                style={inputStyle}
              />
            </div>

            {/* Storefront Token — masked */}
            <div>
              <label style={labelStyle}>Storefront Access Token</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="shpat_..."
                  value={shopify.storefront_access_token || ''}
                  onChange={(e) => updateField('storefront_access_token', e.target.value.trim())}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--forge-text-muted)', padding: '4px',
                  }}
                >
                  <Icon name={showToken ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>

            {/* Checkout Mode */}
            <div>
              <label style={labelStyle}>{safeT('admin.integrations.checkoutMode', cs ? 'Rezim checkout' : 'Checkout Mode')}</label>
              <select
                value={shopify.checkout_mode || 'cart_permalink'}
                onChange={(e) => updateField('checkout_mode', e.target.value)}
                style={selectStyle}
              >
                <option value="cart_permalink">Cart Permalink ({safeT('admin.integrations.checkoutSimpler', cs ? 'jednodussi' : 'simpler')})</option>
                <option value="storefront_api">Storefront API ({safeT('admin.integrations.checkoutRicher', cs ? 'bohatsi' : 'richer')})</option>
              </select>
            </div>

            {/* Redirect */}
            <div>
              <label style={labelStyle}>{safeT('admin.integrations.redirectTo', cs ? 'Presmerovani' : 'Redirect To')}</label>
              <select
                value={shopify.redirect_to || 'checkout'}
                onChange={(e) => updateField('redirect_to', e.target.value)}
                style={selectStyle}
              >
                <option value="checkout">{safeT('admin.integrations.redirectCheckout', cs ? 'Primo na checkout' : 'Directly to checkout')}</option>
                <option value="cart">{safeT('admin.integrations.redirectCart', cs ? 'Na kosik' : 'To cart page')}</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label style={labelStyle}>{safeT('admin.integrations.currency', cs ? 'Mena' : 'Currency')}</label>
              <select
                value={shopify.currency || 'CZK'}
                onChange={(e) => updateField('currency', e.target.value)}
                style={selectStyle}
              >
                <option value="CZK">CZK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Fee Handling */}
            <div>
              <label style={labelStyle}>{safeT('admin.integrations.feeHandling', cs ? 'Zpracovani poplatku' : 'Fee Handling')}</label>
              <select
                value={shopify.fee_handling || 'included_in_price'}
                onChange={(e) => updateField('fee_handling', e.target.value)}
                style={selectStyle}
              >
                <option value="included_in_price">{safeT('admin.integrations.feeIncluded', cs ? 'Zahrnuto v cene' : 'Included in price')}</option>
                <option value="line_property">{safeT('admin.integrations.feeLineProperty', cs ? 'Vlastnost polozky' : 'Line item property')}</option>
                <option value="separate_variant">{safeT('admin.integrations.feeSeparate', cs ? 'Samostatna polozka' : 'Separate line item')}</option>
              </select>
            </div>

            {/* Cart Note Template */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{safeT('admin.integrations.cartNoteTemplate', cs ? 'Sablona poznamky kosiku' : 'Cart Note Template')}</label>
              <input
                type="text"
                placeholder="ModelPricer: {modelCount} modelu"
                value={shopify.cart_note_template || ''}
                onChange={(e) => updateField('cart_note_template', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '4px' }}>
                {safeT('admin.integrations.availableVars', cs ? 'Dostupne promenne' : 'Available variables')}: {'{modelCount}'}, {'{totalPrice}'}, {'{currency}'}
              </p>
            </div>

            {/* Fee Variant ID */}
            {shopify.fee_handling === 'separate_variant' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{safeT('admin.integrations.feeVariantId', cs ? 'Variant ID pro poplatky' : 'Fee Variant ID')}</label>
                <input
                  type="text"
                  placeholder="44012345678901"
                  value={shopify.fee_variant_id || ''}
                  onChange={(e) => updateField('fee_variant_id', e.target.value.trim())}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant Mappings */}
      {isEnabled && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '16px', fontWeight: 600,
              color: 'var(--forge-text-primary)',
            }}>
              {safeT('admin.integrations.materialMapping', cs ? 'Mapovani materialu' : 'Material Mapping')}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)' }}>
                {safeT('admin.integrations.mappingMode', cs ? 'Rezim' : 'Mode')}:
              </span>
              <select
                value={shopify.mapping_mode || 'per_variant'}
                onChange={(e) => updateField('mapping_mode', e.target.value)}
                style={{ ...selectStyle, width: 'auto', fontSize: '12px', padding: '6px 30px 6px 10px' }}
              >
                <option value="per_variant">Per-variant</option>
                <option value="universal">{safeT('admin.integrations.mappingUniversal', cs ? 'Univerzalni' : 'Universal')}</option>
              </select>
            </div>
          </div>

          {/* Universal Mode */}
          {shopify.mapping_mode === 'universal' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{safeT('admin.integrations.universalVariantId', cs ? 'Univerzalni Variant ID' : 'Universal Variant ID')}</label>
              <input
                type="text"
                placeholder="44012345678901"
                value={shopify.fallback_variant_id || ''}
                onChange={(e) => updateField('fallback_variant_id', e.target.value.trim())}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '4px' }}>
                {cs
                  ? 'Vsechny modely pujdou na tuto variantu. Material a kvalita budou ulozeny jako properties.'
                  : 'All models will use this variant. Material and quality will be stored as properties.'}
              </p>
            </div>
          )}

          {/* Per-Variant Mode */}
          {shopify.mapping_mode !== 'universal' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{safeT('admin.integrations.fallbackVariantId', cs ? 'Fallback Variant ID' : 'Fallback Variant ID')}</label>
                <input
                  type="text"
                  placeholder={safeT('admin.integrations.fallbackPlaceholder', cs ? 'Pro modely bez mapovani' : 'For unmapped models')}
                  value={shopify.fallback_variant_id || ''}
                  onChange={(e) => updateField('fallback_variant_id', e.target.value.trim())}
                  style={{ ...inputStyle, maxWidth: '300px' }}
                />
              </div>

              {mappings.length > 0 && (
                <div style={{
                  overflowX: 'auto',
                  marginBottom: '16px',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm, 8px)',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    fontFamily: 'var(--forge-font-body)',
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--forge-border-default)' }}>
                        {[safeT('admin.integrations.colMaterial', cs ? 'Material' : 'Material'), safeT('admin.integrations.colQuality', cs ? 'Kvalita' : 'Quality'), 'Variant ID', safeT('admin.integrations.colProduct', cs ? 'Produkt' : 'Product'), safeT('admin.integrations.colActive', cs ? 'Aktivni' : 'Active'), ''].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 12px',
                            textAlign: 'left',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--forge-text-muted)',
                            fontFamily: 'var(--forge-font-tech)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: 'var(--forge-bg-elevated)',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--forge-border-default)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--forge-text-primary)' }}>{m.material_key}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--forge-text-secondary)' }}>{m.quality_key}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--forge-font-tech)', fontSize: '12px', color: 'var(--forge-accent-primary)' }}>{m.shopify_variant_id}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--forge-text-secondary)' }}>{m.shopify_product_title || '\u2014'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleMapping(m.id, !m.active)}
                              style={{
                                width: '16px', height: '16px', borderRadius: '4px',
                                border: `2px solid ${m.active ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
                                backgroundColor: m.active ? 'var(--forge-accent-primary)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              {m.active && <Icon name="Check" size={10} style={{ color: '#fff' }} />}
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button onClick={() => handleDeleteMapping(m.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--forge-text-muted)', padding: '4px',
                            }}>
                              <Icon name="Trash2" size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showMappingForm ? (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--forge-bg-elevated)',
                  borderRadius: 'var(--forge-radius-sm, 8px)',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Material</label>
                      <select
                        value={mappingForm.material_key}
                        onChange={(e) => setMappingForm(f => ({ ...f, material_key: e.target.value }))}
                        style={{ ...selectStyle, fontSize: '13px', padding: '8px 30px 8px 10px' }}
                      >
                        <option value="">{safeT('admin.integrations.selectPlaceholder', cs ? '\u2014 Vyberte \u2014' : '\u2014 Select \u2014')}</option>
                        {materials.map((mat) => (
                          <option key={mat.key || mat.id} value={mat.key || mat.id}>
                            {mat.label || mat.name || mat.key || mat.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>{safeT('admin.integrations.quality', cs ? 'Kvalita' : 'Quality')}</label>
                      <select
                        value={mappingForm.quality_key}
                        onChange={(e) => setMappingForm(f => ({ ...f, quality_key: e.target.value }))}
                        style={{ ...selectStyle, fontSize: '13px', padding: '8px 30px 8px 10px' }}
                      >
                        <option value="standard">Standard</option>
                        <option value="fine">Fine</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Variant ID</label>
                      <input
                        type="text"
                        placeholder="44012345678901"
                        value={mappingForm.shopify_variant_id}
                        onChange={(e) => setMappingForm(f => ({ ...f, shopify_variant_id: e.target.value.trim() }))}
                        style={{ ...inputStyle, fontSize: '13px', padding: '8px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>{safeT('admin.integrations.productTitle', cs ? 'Nazev produktu' : 'Product Title')}</label>
                      <input
                        type="text"
                        placeholder="3D Tisk - PLA"
                        value={mappingForm.shopify_product_title}
                        onChange={(e) => setMappingForm(f => ({ ...f, shopify_product_title: e.target.value }))}
                        style={{ ...inputStyle, fontSize: '13px', padding: '8px 10px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleAddMapping} style={{ ...btnPrimary, fontSize: '13px', padding: '8px 16px' }}>
                      <Icon name="Plus" size={14} />
                      {safeT('admin.integrations.add', cs ? 'Pridat' : 'Add')}
                    </button>
                    <button onClick={() => setShowMappingForm(false)} style={{ ...btnOutline, fontSize: '13px', padding: '8px 16px' }}>
                      {safeT('admin.integrations.cancel', cs ? 'Zrusit' : 'Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowMappingForm(true)} style={btnOutline}>
                  <Icon name="Plus" size={16} />
                  {safeT('admin.integrations.addMapping', cs ? 'Pridat mapovani' : 'Add mapping')}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Test Connection */}
      {isEnabled && step1Done && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '16px',
          }}>
            {safeT('admin.integrations.testConnection', cs ? 'Test pripojeni' : 'Test Connection')}
          </h3>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={handleTestConnection} disabled={testing} style={btnPrimary}>
              {testing ? (
                <>
                  <span style={{
                    display: 'inline-block', width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'mp-spin 0.6s linear infinite',
                  }} />
                  {safeT('admin.integrations.testing', cs ? 'Testuji...' : 'Testing...')}
                </>
              ) : (
                <>
                  <Icon name="Wifi" size={16} />
                  {safeT('admin.integrations.testConnection', cs ? 'Otestovat pripojeni' : 'Test Connection')}
                </>
              )}
            </button>
            <button onClick={handleTestCart} style={btnOutline}>
              <Icon name="ShoppingCart" size={16} />
              {safeT('admin.integrations.testCart', cs ? 'Testovaci kosik' : 'Test Cart')}
            </button>
          </div>

          {testResult && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--forge-radius-sm, 8px)',
              backgroundColor: testResult.success ? 'rgba(0, 212, 170, 0.08)' : 'rgba(220, 38, 38, 0.08)',
              border: `1px solid ${testResult.success ? 'rgba(0, 212, 170, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: testResult.success ? '4px' : 0 }}>
                <Icon
                  name={testResult.success ? 'CheckCircle' : 'XCircle'}
                  size={16}
                  style={{ color: testResult.success ? 'var(--forge-success)' : 'var(--forge-error)' }}
                />
                <span style={{
                  fontSize: '14px', fontWeight: 600,
                  color: testResult.success ? 'var(--forge-success)' : 'var(--forge-error)',
                }}>
                  {testResult.success ? safeT('admin.integrations.testConnected', cs ? 'Pripojeno' : 'Connected') : safeT('admin.integrations.testError', cs ? 'Chyba' : 'Error')}
                </span>
              </div>
              {testResult.success && testResult.shopName && (
                <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', margin: '4px 0 0 24px' }}>
                  {safeT('admin.integrations.shop', cs ? 'Obchod' : 'Shop')}: <strong>{testResult.shopName}</strong>
                  {testResult.shopUrl && (
                    <a href={testResult.shopUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: '8px', color: 'var(--forge-accent-primary)', textDecoration: 'none', fontSize: '12px' }}>
                      {safeT('admin.integrations.open', cs ? 'Otevrit' : 'Open')} &rarr;
                    </a>
                  )}
                </p>
              )}
              {!testResult.success && testResult.error && (
                <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', margin: '4px 0 0 24px' }}>
                  {testResult.error}
                </p>
              )}
            </div>
          )}

          <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function AdminIntegrations() {
  const { language, t } = useLanguage();
  const cs = language === 'cs';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null); // integration id or null

  // Materials from pricing config
  const materials = useMemo(() => {
    try {
      const pc = loadPricingConfigV3();
      return Array.isArray(pc?.materials) ? pc.materials : [];
    } catch {
      return [];
    }
  }, []);

  // Load config
  useEffect(() => {
    try {
      const cfg = getEcommerceConfig();
      setConfig(cfg);
      setLoading(false);
    } catch (e) {
      debug('[AdminIntegrations] Load error:', e);
      setLoading(false);
    }
  }, []);

  // Determine Shopify status
  const getShopifyStatus = useCallback(() => {
    if (!config) return 'disconnected';
    const shopify = config.shopify || {};
    const meta = config.integrations_meta || {};
    if (!shopify.enabled) return 'disconnected';
    if (!shopify.shop_domain || !shopify.storefront_access_token) return 'configuring';
    if (meta.test_result === 'error') return 'error';
    return 'connected';
  }, [config]);

  // Get last sync time for Shopify
  const getLastSync = useCallback(() => {
    if (!config?.integrations_meta?.last_test_at) return null;
    try {
      const d = new Date(config.integrations_meta.last_test_at);
      return d.toLocaleString(cs ? 'cs-CZ' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return null;
    }
  }, [config, cs]);

  // Get status for any integration
  const getStatus = useCallback((integrationId) => {
    if (integrationId === 'shopify') return getShopifyStatus();
    if (integrationId === 'webhook') return 'disconnected'; // always available, neutral status
    return 'coming_soon';
  }, [getShopifyStatus]);

  // Handle card click
  const handleOpenIntegration = useCallback((integration) => {
    if (integration.isLink) {
      navigate(integration.linkTo);
      return;
    }
    setActiveDetail(integration.id);
  }, [navigate]);

  if (loading || !config) {
    return (
      <div style={{ padding: '32px', display: 'grid', gap: '16px' }}>
        <SkeletonCard textLines={2} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <SkeletonCard textLines={3} />
          <SkeletonCard textLines={3} />
          <SkeletonCard textLines={3} />
        </div>
      </div>
    );
  }

  // Detail view
  if (activeDetail) {
    const integration = INTEGRATIONS.find(i => i.id === activeDetail);
    if (!integration) {
      setActiveDetail(null);
      return null;
    }

    if (integration.id === 'shopify') {
      return (
        <ShopifyDetail
          config={config}
          setConfig={setConfig}
          cs={cs}
          t={t}
          onClose={() => setActiveDetail(null)}
          materials={materials}
        />
      );
    }

    return (
      <ComingSoonDetail
        integration={integration}
        cs={cs}
        t={t}
        onClose={() => setActiveDetail(null)}
      />
    );
  }

  // Group integrations by category
  const categories = {};
  INTEGRATIONS.forEach(i => {
    if (!categories[i.category]) categories[i.category] = [];
    categories[i.category].push(i);
  });

  const connectedCount = INTEGRATIONS.filter(i => {
    const s = getStatus(i.id);
    return s === 'connected' || s === 'configuring';
  }).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--forge-font-heading)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--forge-text-primary)',
          marginBottom: '4px',
        }}>
          {t('admin.integrations.integrationsLabel', cs ? 'Integrace' : 'Integrations')}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {cs
            ? `Propojte kalkulacku s vasimi sluzbami. ${connectedCount} aktivni${connectedCount === 1 ? '' : connectedCount > 1 && connectedCount < 5 ? 'ch' : 'ch'} z ${INTEGRATIONS.length} dostupnych.`
            : `Connect your calculator with your services. ${connectedCount} active out of ${INTEGRATIONS.length} available.`}
        </p>
      </div>

      {/* Integration grid by category */}
      {Object.entries(categories).map(([catKey, integrations]) => {
        const catLabel = CATEGORY_LABELS[catKey];
        return (
          <div key={catKey} style={{ marginBottom: '28px' }}>
            {/* Category label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}>
              <h2 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--forge-text-secondary)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {cs ? catLabel.cs : catLabel.en}
              </h2>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--forge-border-default)',
              }} />
            </div>

            {/* Cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: integrations.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}>
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={getStatus(integration.id)}
                  lastSync={integration.id === 'shopify' ? getLastSync() : null}
                  onOpen={() => handleOpenIntegration(integration)}
                  cs={cs}
                  t={t}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
