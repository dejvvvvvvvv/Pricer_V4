import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import WidgetKalkulacka from '../widget-kalkulacka';
import {
  getWidgetByPublicId,
  getBranding,
  isDomainAllowedByWhitelist,
  getDefaultWidgetTheme,
} from '../../utils/adminBrandingWidgetStorage';

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
        const isAllowed = isDomainAllowedByWhitelist(referrerOrigin, domains);

        // For localhost/127.0.0.1, allow for dev
        const isLocalDev = ['localhost', '127.0.0.1', ''].includes(referrerOrigin);

        if (!isAllowed && !isLocalDev) {
          setError(`Domena "${referrerOrigin}" neni povolena pro tento widget`);
          setLoading(false);
          return;
        }
      }

      // Load branding for tenant
      const brand = getBranding(tid);

      setWidget(w);
      setTenantId(tid);
      setBranding(brand);
      setLoading(false);
    } catch (e) {
      console.error('[WidgetPublicPage] Error loading widget:', e);
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
      }, '*');
    } catch (e) {
      console.error('[WidgetPublicPage] postMessage error:', e);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Nacitam kalkulacku...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Widget neni dostupny
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-400">
            Widget ID: {publicWidgetId || 'neuvedeno'}
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
      publicWidgetId={publicWidgetId}
      onQuoteCalculated={handleQuoteCalculated}
    />
  );
};

export default WidgetPublicPage;
