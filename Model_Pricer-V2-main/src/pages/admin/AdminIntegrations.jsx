// Admin Integrations Page — Shopify Storefront API Configuration
// Route: /admin/integrations
//
// Sections:
// A) Main toggle + status
// B) Setup guide (step-by-step)
// C) Configuration form
// D) Variant mappings table
// E) Test connection

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { debug } from '@/lib/debug';
import { getTenantId } from '../../utils/adminTenantStorage';
import {
  getEcommerceConfig,
  saveEcommerceConfig,
  getShopifyConfig,
  saveShopifyConfig,
  getVariantMappings,
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

// ─── Styles ──────────────────────────────────────────────────

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
  color: '#fff',
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

const btnDanger = {
  ...btnPrimary,
  backgroundColor: 'var(--forge-error, #DC2626)',
  padding: '6px 12px',
  fontSize: '12px',
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
          backgroundColor: '#fff',
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
          color: done ? '#fff' : 'var(--forge-text-muted)',
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

// ─── Main Component ──────────────────────────────────────────

export default function AdminIntegrations() {
  const { language } = useLanguage();
  const cs = language === 'cs';

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openStep, setOpenStep] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Mapping form
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    material_key: '',
    quality_key: 'standard',
    shopify_variant_id: '',
    shopify_product_title: '',
  });

  // Password visibility
  const [showToken, setShowToken] = useState(false);

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

  // Save helper
  const handleSave = useCallback((newConfig) => {
    setSaving(true);
    try {
      const saved = saveEcommerceConfig(newConfig);
      setConfig(saved);
      setBanner({ type: 'success', msg: cs ? 'Ulozeno' : 'Saved' });
      setTimeout(() => setBanner(null), 3000);
    } catch (e) {
      setBanner({ type: 'error', msg: e.message });
    }
    setSaving(false);
  }, [cs]);

  // Update a field in shopify config
  const updateField = useCallback((field, value) => {
    setConfig(prev => {
      const next = {
        ...prev,
        shopify: { ...prev.shopify, [field]: value },
      };
      handleSave(next);
      return next;
    });
  }, [handleSave]);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
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

  // Test cart
  const handleTestCart = useCallback(() => {
    if (!config?.shopify?.shop_domain) return;
    const testLine = config.shopify.fallback_variant_id || (config.shopify.variant_mappings?.[0]?.shopify_variant_id);
    if (!testLine) {
      setTestResult({ success: false, error: cs ? 'Zadny variant ID pro test' : 'No variant ID for test' });
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

  // Add mapping
  const handleAddMapping = useCallback(() => {
    if (!mappingForm.shopify_variant_id) return;
    addVariantMapping(mappingForm);
    setConfig(getEcommerceConfig());
    setMappingForm({ material_key: '', quality_key: 'standard', shopify_variant_id: '', shopify_product_title: '' });
    setShowMappingForm(false);
  }, [mappingForm]);

  // Delete mapping
  const handleDeleteMapping = useCallback((id) => {
    deleteVariantMapping(id);
    setConfig(getEcommerceConfig());
  }, []);

  // Toggle mapping active
  const handleToggleMapping = useCallback((id, active) => {
    updateVariantMapping(id, { active });
    setConfig(getEcommerceConfig());
  }, []);

  if (loading || !config) {
    return (
      <div style={{ padding: '32px', display: 'grid', gap: '16px' }}>
        <SkeletonCard textLines={2} />
        <SkeletonCard textLines={3} />
        <SkeletonCard textLines={2} />
      </div>
    );
  }

  const shopify = config.shopify || {};
  const mappings = Array.isArray(shopify.variant_mappings) ? shopify.variant_mappings : [];
  const isEnabled = !!shopify.enabled;
  const hasDomain = !!shopify.shop_domain;
  const hasToken = !!shopify.storefront_access_token;

  // Setup step completion
  const step1Done = hasDomain && hasToken;
  const step2Done = mappings.length > 0 || !!shopify.fallback_variant_id;
  const step3Done = step1Done;
  const step4Done = step2Done;
  const step5Done = testResult?.success === true;

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
          {cs ? 'Integrace' : 'Integrations'}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {cs ? 'Propojte kalkulacku s vasim e-shopem' : 'Connect your calculator to your e-shop'}
        </p>
      </div>

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

      {/* ─── A) Main Toggle ─────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: 'var(--forge-bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="ShoppingBag" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '18px', fontWeight: 600,
                color: 'var(--forge-text-primary)',
              }}>
                Shopify
              </h2>
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--forge-font-tech)',
                color: isEnabled && step1Done
                  ? 'var(--forge-success)'
                  : isEnabled
                    ? 'var(--forge-warning, #F59E0B)'
                    : 'var(--forge-text-muted)',
                textTransform: 'uppercase',
              }}>
                {isEnabled && step1Done ? (cs ? 'PRIPOJENO' : 'CONNECTED')
                  : isEnabled ? (cs ? 'KONFIGURACE' : 'CONFIGURING')
                  : (cs ? 'ODPOJENO' : 'DISCONNECTED')}
              </span>
            </div>
          </div>
          <Toggle
            checked={isEnabled}
            onChange={(v) => updateField('enabled', v)}
            label={cs ? 'Shopify integrace' : 'Shopify integration'}
          />
        </div>

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

        {isEnabled && (
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
                {cs ? 'Shopify rezim aktivni' : 'Shopify mode active'}
              </strong>
              {' — '}
              {cs
                ? 'Zakaznici budou presmerovani na vas Shopify checkout. Platba a doprava se resi na strane Shopify.'
                : 'Customers will be redirected to your Shopify checkout. Payment and shipping are handled by Shopify.'}
            </p>
          </div>
        )}
      </div>

      {/* ─── B) Setup Guide ─────────────────────────────────── */}
      {isEnabled && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '12px',
          }}>
            {cs ? 'Navod k nastaveni' : 'Setup Guide'}
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
            done={step3Done}
            open={openStep === 3}
            onToggle={() => setOpenStep(openStep === 3 ? null : 3)}
          >
            <p>{cs ? 'Vyplnte shop domain a token nize v sekci Konfigurace.' : 'Fill in shop domain and token below in the Configuration section.'}</p>
          </SetupStep>

          <SetupStep
            number={4}
            title={cs ? 'Namapujte materialy na varianty' : 'Map materials to variants'}
            done={step4Done}
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

      {/* ─── C) Configuration ───────────────────────────────── */}
      {isEnabled && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '20px',
          }}>
            {cs ? 'Konfigurace' : 'Configuration'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Shop Domain */}
            <div>
              <label style={labelStyle}>{cs ? 'Shop domain' : 'Shop Domain'}</label>
              <input
                type="text"
                placeholder="myshop.myshopify.com"
                value={shopify.shop_domain || ''}
                onChange={(e) => updateField('shop_domain', e.target.value.trim())}
                style={inputStyle}
              />
            </div>

            {/* Storefront Token */}
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
              <label style={labelStyle}>{cs ? 'Rezim checkout' : 'Checkout Mode'}</label>
              <select
                value={shopify.checkout_mode || 'cart_permalink'}
                onChange={(e) => updateField('checkout_mode', e.target.value)}
                style={selectStyle}
              >
                <option value="cart_permalink">Cart Permalink ({cs ? 'jednodussi' : 'simpler'})</option>
                <option value="storefront_api">Storefront API ({cs ? 'bohatsi' : 'richer'})</option>
              </select>
            </div>

            {/* Redirect */}
            <div>
              <label style={labelStyle}>{cs ? 'Presmerovani' : 'Redirect To'}</label>
              <select
                value={shopify.redirect_to || 'checkout'}
                onChange={(e) => updateField('redirect_to', e.target.value)}
                style={selectStyle}
              >
                <option value="checkout">{cs ? 'Primo na checkout' : 'Directly to checkout'}</option>
                <option value="cart">{cs ? 'Na kosik' : 'To cart page'}</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label style={labelStyle}>{cs ? 'Mena' : 'Currency'}</label>
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
              <label style={labelStyle}>{cs ? 'Zpracovani poplatku' : 'Fee Handling'}</label>
              <select
                value={shopify.fee_handling || 'included_in_price'}
                onChange={(e) => updateField('fee_handling', e.target.value)}
                style={selectStyle}
              >
                <option value="included_in_price">{cs ? 'Zahrnuto v cene' : 'Included in price'}</option>
                <option value="line_property">{cs ? 'Vlastnost polozky' : 'Line item property'}</option>
                <option value="separate_variant">{cs ? 'Samostatna polozka' : 'Separate line item'}</option>
              </select>
            </div>

            {/* Cart Note Template */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{cs ? 'Sablona poznamky kosiku' : 'Cart Note Template'}</label>
              <input
                type="text"
                placeholder="ModelPricer: {modelCount} modelu"
                value={shopify.cart_note_template || ''}
                onChange={(e) => updateField('cart_note_template', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '4px' }}>
                {cs ? 'Dostupne promenne' : 'Available variables'}: {'{modelCount}'}, {'{totalPrice}'}, {'{currency}'}
              </p>
            </div>

            {/* Fee Variant ID (only when separate_variant) */}
            {shopify.fee_handling === 'separate_variant' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{cs ? 'Variant ID pro poplatky' : 'Fee Variant ID'}</label>
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

      {/* ─── D) Variant Mappings ────────────────────────────── */}
      {isEnabled && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '16px', fontWeight: 600,
              color: 'var(--forge-text-primary)',
            }}>
              {cs ? 'Mapovani materialu' : 'Material Mapping'}
            </h3>

            {/* Mapping Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)' }}>
                {cs ? 'Rezim' : 'Mode'}:
              </span>
              <select
                value={shopify.mapping_mode || 'per_variant'}
                onChange={(e) => updateField('mapping_mode', e.target.value)}
                style={{ ...selectStyle, width: 'auto', fontSize: '12px', padding: '6px 30px 6px 10px' }}
              >
                <option value="per_variant">Per-variant</option>
                <option value="universal">{cs ? 'Univerzalni' : 'Universal'}</option>
              </select>
            </div>
          </div>

          {/* Universal Mode */}
          {shopify.mapping_mode === 'universal' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{cs ? 'Univerzalni Variant ID' : 'Universal Variant ID'}</label>
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
              {/* Fallback */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{cs ? 'Fallback Variant ID' : 'Fallback Variant ID'}</label>
                <input
                  type="text"
                  placeholder={cs ? 'Pro modely bez mapovani' : 'For unmapped models'}
                  value={shopify.fallback_variant_id || ''}
                  onChange={(e) => updateField('fallback_variant_id', e.target.value.trim())}
                  style={{ ...inputStyle, maxWidth: '300px' }}
                />
              </div>

              {/* Mappings Table */}
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
                        {[cs ? 'Material' : 'Material', cs ? 'Kvalita' : 'Quality', 'Variant ID', cs ? 'Produkt' : 'Product', cs ? 'Aktivni' : 'Active', ''].map((h, i) => (
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
                          <td style={{ padding: '10px 12px', color: 'var(--forge-text-secondary)' }}>{m.shopify_product_title || '—'}</td>
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

              {/* Add Mapping Form */}
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
                        <option value="">{cs ? '— Vyberte —' : '— Select —'}</option>
                        {materials.map((mat) => (
                          <option key={mat.key || mat.id} value={mat.key || mat.id}>
                            {mat.label || mat.name || mat.key || mat.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>{cs ? 'Kvalita' : 'Quality'}</label>
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
                      <label style={{ ...labelStyle, fontSize: '11px' }}>{cs ? 'Nazev produktu' : 'Product Title'}</label>
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
                      {cs ? 'Pridat' : 'Add'}
                    </button>
                    <button onClick={() => setShowMappingForm(false)} style={{ ...btnOutline, fontSize: '13px', padding: '8px 16px' }}>
                      {cs ? 'Zrusit' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowMappingForm(true)} style={btnOutline}>
                  <Icon name="Plus" size={16} />
                  {cs ? 'Pridat mapovani' : 'Add mapping'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── E) Test Connection ─────────────────────────────── */}
      {isEnabled && step1Done && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px', fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '16px',
          }}>
            {cs ? 'Test pripojeni' : 'Test Connection'}
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
                  {cs ? 'Testuji...' : 'Testing...'}
                </>
              ) : (
                <>
                  <Icon name="Wifi" size={16} />
                  {cs ? 'Otestovat pripojeni' : 'Test Connection'}
                </>
              )}
            </button>
            <button onClick={handleTestCart} style={btnOutline}>
              <Icon name="ShoppingCart" size={16} />
              {cs ? 'Testovaci kosik' : 'Test Cart'}
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
                  {testResult.success ? (cs ? 'Pripojeno' : 'Connected') : (cs ? 'Chyba' : 'Error')}
                </span>
              </div>
              {testResult.success && testResult.shopName && (
                <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', margin: '4px 0 0 24px' }}>
                  {cs ? 'Obchod' : 'Shop'}: <strong>{testResult.shopName}</strong>
                  {testResult.shopUrl && (
                    <a href={testResult.shopUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: '8px', color: 'var(--forge-accent-primary)', textDecoration: 'none', fontSize: '12px' }}>
                      {cs ? 'Otevrit' : 'Open'} &rarr;
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
