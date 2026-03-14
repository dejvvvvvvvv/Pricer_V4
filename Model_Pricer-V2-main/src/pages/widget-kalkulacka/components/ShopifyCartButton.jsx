import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { mapQuoteToShopifyLines, buildCartNote } from '../../../lib/shopify/shopifyCartMapper';
import {
  buildCartPermalinkUrl,
  createStorefrontCart,
  isValidCheckoutUrl,
} from '../../../lib/shopify/shopifyCartClient';

/**
 * ShopifyCartButton — "Add to Shopify Cart" button for widget/test calculators.
 *
 * Replaces the standard CheckoutForm when Shopify integration is enabled.
 * Uses CSS vars for widget theming (no Tailwind).
 */
const ShopifyCartButton = ({
  quoteResult,
  shopifyConfig,
  uploadedFiles = [],
  embedded = false,
  publicWidgetId = null,
  disabled = false,
  onCheckoutUrl,
  tenantId = undefined,
}) => {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | warning
  const [errorMsg, setErrorMsg] = useState('');
  const [unmappedModels, setUnmappedModels] = useState([]);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const handleClick = useCallback(async (allowPartial = false) => {
    if (!quoteResult || !shopifyConfig) return;

    setStatus('loading');
    setErrorMsg('');
    setUnmappedModels([]);

    try {
      // Map quote to Shopify line items
      const mapped = mapQuoteToShopifyLines({
        quoteResult,
        variantMappings: shopifyConfig.variant_mappings || [],
        fallbackVariantId: shopifyConfig.fallback_variant_id || '',
        mappingMode: shopifyConfig.mapping_mode || 'per_variant',
        feeHandling: shopifyConfig.fee_handling || 'included_in_price',
        feeVariantId: shopifyConfig.fee_variant_id || '',
        uploadedFiles,
        currency: shopifyConfig.currency || 'CZK',
        tenantId,
      });

      // Check for unmapped models — only block if user has NOT confirmed proceeding
      if (!allowPartial && mapped.unmappedModels.length > 0 && mapped.lineItems.length === 0) {
        setUnmappedModels(mapped.unmappedModels);
        setStatus('warning');
        return;
      }

      if (mapped.lineItems.length === 0) {
        setErrorMsg('No items to add to cart');
        setStatus('error');
        return;
      }

      // Build cart note
      const note = buildCartNote(shopifyConfig.cart_note_template, {
        modelCount: (quoteResult.models || []).length,
        totalPrice: mapped.totalCalculated,
        currency: shopifyConfig.currency || 'CZK',
      });

      const shopDomain = shopifyConfig.shop_domain;
      const mode = shopifyConfig.checkout_mode || 'cart_permalink';

      let resultUrl = '';

      if (mode === 'cart_permalink') {
        // Strategy A: Cart Permalink
        const permalink = buildCartPermalinkUrl({
          shopDomain,
          lineItems: mapped.lineItems,
          note,
          redirectTo: shopifyConfig.redirect_to || 'checkout',
        });

        if (permalink.tooLong) {
          // Auto-fallback to Storefront API if URL too long
          if (shopifyConfig.storefront_access_token) {
            const apiResult = await createStorefrontCart({
              shopDomain,
              storefrontAccessToken: shopifyConfig.storefront_access_token,
              lineItems: mapped.lineItems,
              note,
            });

            if (apiResult.errors && apiResult.errors.length > 0) {
              setErrorMsg(apiResult.errors.map(e => e.message).join('; '));
              setStatus('error');
              return;
            }
            resultUrl = apiResult.checkoutUrl;
          } else {
            // Use long permalink anyway (might get truncated)
            resultUrl = permalink.url;
          }
        } else {
          resultUrl = permalink.url;
        }
      } else {
        // Strategy B: Storefront API
        const apiResult = await createStorefrontCart({
          shopDomain,
          storefrontAccessToken: shopifyConfig.storefront_access_token,
          lineItems: mapped.lineItems,
          note,
        });

        if (apiResult.errors && apiResult.errors.length > 0) {
          setErrorMsg(apiResult.errors.map(e => e.message).join('; '));
          setStatus('error');
          return;
        }
        resultUrl = apiResult.checkoutUrl;
      }

      if (!resultUrl) {
        setErrorMsg('Failed to create checkout URL');
        setStatus('error');
        return;
      }

      setCheckoutUrl(resultUrl);
      setStatus('success');

      // Callback for parent
      if (onCheckoutUrl) {
        onCheckoutUrl(resultUrl);
      }

      // PostMessage for iframe context
      if (embedded && publicWidgetId) {
        try {
          // Use referrer origin when available; fall back to own origin (never '*').
          // widget.js on the parent enforces strict origin matching so '*' would
          // be silently rejected there anyway, and it leaks data to any listener.
          let targetOrigin = window.location.origin;
          if (document.referrer) {
            try { targetOrigin = new URL(document.referrer).origin; } catch { /* keep own origin */ }
          }
          window.parent.postMessage({
            type: 'MODELPRICER_SHOPIFY_CHECKOUT_URL',
            publicWidgetId,
            checkoutUrl: resultUrl,
            cartId: '',
            lineCount: mapped.lineItems.length,
          }, targetOrigin);
        } catch (e) {
          // PostMessage failed — do direct redirect
        }
      }

      // Auto-redirect after 1 second (for non-iframe or if postMessage didn't handle it)
      if (!embedded && isValidCheckoutUrl(resultUrl)) {
        setTimeout(() => {
          window.location.href = resultUrl;
        }, 1000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
    }
  }, [quoteResult, shopifyConfig, uploadedFiles, embedded, publicWidgetId, onCheckoutUrl, tenantId]);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setErrorMsg('');
    setUnmappedModels([]);
  }, []);

  const handleProceedWithUnmapped = useCallback(() => {
    // Pass allowPartial=true so the warning gate is skipped even when some models
    // have no variant mapping. State will be reset inside handleClick.
    handleClick(true);
  }, [handleClick]);

  // ─── Styles (CSS vars for widget theming) ──────────────

  const baseButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 24px',
    borderRadius: 'var(--widget-border-radius, 10px)',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'var(--widget-font-family, inherit)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 200ms ease-out',
    opacity: disabled ? 0.5 : 1,
  };

  const idleStyle = {
    ...baseButtonStyle,
    backgroundColor: 'var(--widget-button-primary, #10B981)',
    color: '#fff',
  };

  const loadingStyle = {
    ...baseButtonStyle,
    backgroundColor: 'var(--widget-button-primary, #10B981)',
    color: '#fff',
    opacity: 0.8,
    cursor: 'wait',
  };

  const successStyle = {
    ...baseButtonStyle,
    backgroundColor: '#059669',
    color: '#fff',
  };

  const errorStyle = {
    ...baseButtonStyle,
    backgroundColor: '#DC2626',
    color: '#fff',
  };

  // ─── Render ────────────────────────────────────────────

  // Warning state: unmapped models dialog
  if (status === 'warning' && unmappedModels.length > 0) {
    return (
      <div style={{
        border: '1px solid #F59E0B',
        borderRadius: 'var(--widget-border-radius, 10px)',
        padding: '16px',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Icon name="AlertTriangle" size={20} style={{ color: '#F59E0B' }} />
          <span style={{
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--widget-text-primary, #111)',
          }}>
            Some models cannot be added
          </span>
        </div>
        <ul style={{ margin: '0 0 12px 20px', padding: 0, fontSize: '13px', color: 'var(--widget-text-secondary, #666)' }}>
          {unmappedModels.map((m, i) => (
            <li key={i}>{m.name} ({m.material}/{m.quality}) — {m.reason === 'no_mapping' ? 'no variant mapping' : 'missing variant ID'}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleRetry} style={{
            ...baseButtonStyle,
            width: 'auto',
            padding: '8px 16px',
            fontSize: '13px',
            backgroundColor: 'transparent',
            border: '1px solid var(--widget-border-color, #ddd)',
            color: 'var(--widget-text-primary, #111)',
          }}>
            Cancel
          </button>
          <button onClick={handleProceedWithUnmapped} style={{
            ...baseButtonStyle,
            width: 'auto',
            padding: '8px 16px',
            fontSize: '13px',
            flex: 1,
          }}>
            Continue without these
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div>
        <button onClick={handleRetry} style={errorStyle}>
          <Icon name="AlertCircle" size={20} />
          <span>Error — Try Again</span>
        </button>
        {errorMsg && (
          <p style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#DC2626',
            textAlign: 'center',
          }}>
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <button disabled style={successStyle}>
        <Icon name="Check" size={20} />
        <span>Redirecting to checkout...</span>
      </button>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <button disabled style={loadingStyle}>
        <span style={{
          display: 'inline-block',
          width: '18px',
          height: '18px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'mp-shopify-spin 0.6s linear infinite',
        }} />
        <span>Creating cart...</span>
        <style>{`@keyframes mp-shopify-spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }

  // Idle state
  return (
    <button
      onClick={handleClick}
      disabled={disabled || !quoteResult}
      style={idleStyle}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.opacity = '1';
      }}
    >
      <Icon name="ShoppingCart" size={20} />
      <span>Add to Shopify Cart</span>
    </button>
  );
};

export default ShopifyCartButton;
