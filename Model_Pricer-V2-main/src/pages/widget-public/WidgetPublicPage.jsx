import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import WidgetKalkulacka from '../widget-kalkulacka';
import WidgetSkeleton from '../widget-kalkulacka/components/WidgetSkeleton';
import {
  getWidgetByPublicId,
  getBranding,
  isDomainAllowedByWhitelist,
  getDefaultWidgetTheme,
} from '../../utils/adminBrandingWidgetStorage';
import { getShopifyConfig } from '../../utils/adminEcommerceStorage';
import { debug } from '@/lib/debug';

/**
 * Get target origin for postMessage.
 * Uses document.referrer when embedded in iframe.
 * Falls back to own origin instead of '*' to prevent data leakage to arbitrary windows.
 */
function getTargetOrigin() {
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    // Invalid referrer URL
  }
  // Never use '*' -- fall back to own origin
  return window.location.origin;
}

/**
 * Public widget page - serves the embeddable calculator.
 * Route: /w/:publicWidgetId
 *
 * Features:
 * - Loads widget config by publicId
 * - Validates domain whitelist (Origin header)
 * - Applies widget theme
 * - PostMessage communication with parent
 */
const WidgetPublicPage = () => {
  const { publicWidgetId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [widget, setWidget] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [branding, setBranding] = useState(null);
  const [shopifyConf, setShopifyConf] = useState(null);

  // Get referrer/origin for domain validation
  const referrerOrigin = useMemo(() => {
    try {
      // In iframe, try to get parent origin
      if (window.parent !== window) {
        // Can't access parent.location due to CORS, but document.referrer might work
        const ref = document.referrer;
        if (ref) {
          const url = new URL(ref);
          return url.hostname;
        }
      }
      // Fallback: current location (for direct access/testing)
      return window.location.hostname;
    } catch {
      return window.location.hostname;
    }
  }, []);

  // Load widget configuration
  useEffect(() => {
    if (!publicWidgetId) {
      setError('Chybi ID widgetu');
      setLoading(false);
      return;
    }

    // Validate publicWidgetId format: only alphanumeric, hyphens, underscores, max 128 chars.
    // This prevents passing malformed or oversized strings to storage lookups.
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(publicWidgetId)) {
      setError('Neplatne ID widgetu');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Look up widget by public ID
      const result = getWidgetByPublicId(publicWidgetId);

      if (!result || !result.widget) {
        setError('Widget nenalezen');
        setLoading(false);
        return;
      }

      const { widget: w, tenantId: tid } = result;

      // Check if widget is enabled
      if (w.status === 'disabled') {
        setError('Widget je deaktivovan');
        setLoading(false);
        return;
      }

      // Domain whitelist check
      const domains = Array.isArray(w.domains) ? w.domains : [];
      const hasWhitelist = domains.some((d) => d.isActive);

      if (hasWhitelist) {
        // Localhost / 127.0.0.1 are always allowed (dev environments).
        const isLocalDev = ['localhost', '127.0.0.1'].includes(referrerOrigin);

        if (!isLocalDev) {
          // When referrer is absent ('') the embedding page may have suppressed it
          // with referrerpolicy="no-referrer". We cannot verify the origin, so we
          // must block — otherwise the whitelist provides no protection at all.
          if (!referrerOrigin) {
            setError('Neoveritelna zdrojova domena — referrer byl potlacen');
            setLoading(false);
            return;
          }

          const isAllowed = isDomainAllowedByWhitelist(referrerOrigin, domains);
          if (!isAllowed) {
            setError(`Domena "${referrerOrigin}" neni povolena pro tento widget`);
            setLoading(false);
            return;
          }
        }
      }

      // Load branding for tenant
      const brand = getBranding(tid);

      // Load Shopify config for tenant (if enabled)
      const shopify = getShopifyConfig(tid);
      const shopifyEnabled = shopify?.enabled && shopify?.shop_domain;

      setWidget(w);
      setTenantId(tid);
      setBranding(brand);
      setShopifyConf(shopifyEnabled ? shopify : null);
      setLoading(false);
    } catch (e) {
      debug('[WidgetPublicPage] Error loading widget:', e);
      setError('Chyba pri nacitani widgetu');
      setLoading(false);
    }
  }, [publicWidgetId, referrerOrigin]);

  // Build effective theme from widget config and branding
  const effectiveTheme = useMemo(() => {
    const defaults = getDefaultWidgetTheme();

    if (!widget) return defaults;

    // Start with defaults
    let theme = { ...defaults };

    // Apply widget's theme config if available
    if (widget.themeConfig && typeof widget.themeConfig === 'object') {
      theme = { ...theme, ...widget.themeConfig };
    }

    // Apply branding overrides if available
    if (branding) {
      if (branding.primaryColor) {
        theme.buttonPrimaryColor = branding.primaryColor;
      }
      if (branding.fontFamily) {
        theme.fontFamily = branding.fontFamily;
      }
      if (branding.cornerRadius !== undefined) {
        theme.cornerRadius = branding.cornerRadius;
      }
    }

    // Apply widget-specific primary color override
    if (widget.primaryColorOverride) {
      theme.buttonPrimaryColor = widget.primaryColorOverride;
    }

    return theme;
  }, [widget, branding]);

  // Handle quote calculated - send postMessage
  const handleQuoteCalculated = (quoteData) => {
    if (typeof window === 'undefined') return;

    try {
      window.parent.postMessage({
        type: 'MODELPRICER_QUOTE_CREATED',
        publicWidgetId,
        quote: quoteData,
      }, getTargetOrigin());
    } catch (e) {
      debug('[WidgetPublicPage] postMessage error:', e);
    }
  };

  // Loading state
  if (loading) {
    return <WidgetSkeleton />;
  }

  // Error state — compact so it fits inside an iframe without dead whitespace
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '32px 16px',
          backgroundColor: '#F9FAFB',
          minHeight: '200px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="24" height="24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
            Widget neni dostupny
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: '0 0 12px' }}>{error}</p>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>
            ID: {publicWidgetId || 'neuvedeno'}
          </p>
        </div>
      </div>
    );
  }

  // Render widget
  return (
    <WidgetKalkulacka
      theme={effectiveTheme}
      embedded={true}
      showHeader={true}
      publicWidgetId={publicWidgetId}
      onQuoteCalculated={handleQuoteCalculated}
      shopifyConfig={shopifyConf}
      tenantId={tenantId}
    />
  );
};

export default WidgetPublicPage;
