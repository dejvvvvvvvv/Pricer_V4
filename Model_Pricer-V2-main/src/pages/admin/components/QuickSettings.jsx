import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import ForgeCard from '../../../components/ui/forge/ForgeCard';
import ForgeToggle from '../../../components/ui/forge/ForgeToggle';
import ForgeSlider from '../../../components/ui/forge/ForgeSlider';
import { useNotification } from '../../../contexts/NotificationContext';
import { loadPricingConfigV3, savePricingConfigV3 } from '../../../utils/adminPricingStorage';
import { loadFeesConfigV3, saveFeesConfigV3 } from '../../../utils/adminFeesStorage';

const DEBOUNCE_MS = 600;

/**
 * QuickSettings — collapsible panel on AdminDashboard for rapid config adjustments.
 *
 * Reads pricing + fees config via storage helpers, exposes key toggles/sliders,
 * debounces saves, and shows a brief "Ulozeno" indicator after each save.
 */
export default function QuickSettings({ language = 'cs' }) {
  const navigate = useNavigate();
  const { showSuccess } = useNotification();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mp:quicksettings:collapsed') === '1';
    } catch {
      return false;
    }
  });

  // ---- state from storage ----
  const [markupEnabled, setMarkupEnabled] = useState(false);
  const [markupValue, setMarkupValue] = useState(20);
  const [minOrderEnabled, setMinOrderEnabled] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState(199);
  const [volumeDiscountsEnabled, setVolumeDiscountsEnabled] = useState(false);
  const [expressFeeEnabled, setExpressFeeEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [freeShippingFeeId, setFreeShippingFeeId] = useState(null);

  // ---- save indicator ----
  const [saveIndicator, setSaveIndicator] = useState(null); // 'pricing' | 'fees' | null
  const indicatorTimer = useRef(null);

  // ---- debounce refs ----
  const pricingTimerRef = useRef(null);
  const feesTimerRef = useRef(null);
  const pricingConfigRef = useRef(null);
  const feesConfigRef = useRef(null);

  // ---- load on mount ----
  useEffect(() => {
    const pricing = loadPricingConfigV3();
    pricingConfigRef.current = pricing;

    const tp = pricing.tenant_pricing || {};
    setMarkupEnabled(!!tp.markup_enabled);
    setMarkupValue(Number(tp.markup_value) || 20);
    setMinOrderEnabled(!!tp.min_order_total_enabled);
    setMinOrderValue(Number(tp.min_order_total_value) || 199);

    const vd = pricing.volume_discounts || {};
    setVolumeDiscountsEnabled(!!vd.enabled);

    const fees = loadFeesConfigV3();
    feesConfigRef.current = fees;

    // Find express fee (heuristic: name contains "express" or "expresn")
    const expressFee = (fees.fees || []).find(
      (f) => /express|expresn/i.test(f.name || '')
    );
    setExpressFeeEnabled(expressFee ? !!expressFee.active : false);

    // Find shipping fee with a threshold-like condition or name
    const shippingFee = (fees.fees || []).find(
      (f) => /shipping|doprav|postov/i.test(f.name || '')
    );
    if (shippingFee) {
      setFreeShippingFeeId(shippingFee.id);
      // Check conditions for a threshold
      const thresholdCond = (shippingFee.conditions || []).find(
        (c) => c.key === 'order_total' && (c.op === 'lt' || c.op === 'lte')
      );
      setFreeShippingThreshold(thresholdCond ? Number(thresholdCond.value) || 0 : 0);
    }
  }, []);

  // ---- persist collapsed state ----
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mp:quicksettings:collapsed', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ---- flash save indicator ----
  const flashSaved = useCallback(
    (area) => {
      setSaveIndicator(area);
      if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
      indicatorTimer.current = setTimeout(() => setSaveIndicator(null), 2000);
      showSuccess(
        language === 'cs' ? 'Ulozeno' : 'Saved',
        language === 'cs' ? 'Nastaveni bylo ulozeno.' : 'Settings saved.'
      );
    },
    [language, showSuccess]
  );

  // ---- debounced save helpers ----
  const debouncedSavePricing = useCallback(
    (updater) => {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = setTimeout(() => {
        const current = loadPricingConfigV3();
        const updated = updater(current);
        savePricingConfigV3(updated);
        pricingConfigRef.current = updated;
        flashSaved('pricing');
      }, DEBOUNCE_MS);
    },
    [flashSaved]
  );

  const debouncedSaveFees = useCallback(
    (updater) => {
      if (feesTimerRef.current) clearTimeout(feesTimerRef.current);
      feesTimerRef.current = setTimeout(() => {
        const current = loadFeesConfigV3();
        const updated = updater(current);
        saveFeesConfigV3(updated);
        feesConfigRef.current = updated;
        flashSaved('fees');
      }, DEBOUNCE_MS);
    },
    [flashSaved]
  );

  // cleanup timers
  useEffect(() => {
    return () => {
      if (pricingTimerRef.current) clearTimeout(pricingTimerRef.current);
      if (feesTimerRef.current) clearTimeout(feesTimerRef.current);
      if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
    };
  }, []);

  // ---- handlers ----
  const handleMarkupToggle = (val) => {
    setMarkupEnabled(val);
    debouncedSavePricing((cfg) => ({
      ...cfg,
      tenant_pricing: { ...(cfg.tenant_pricing || {}), markup_enabled: val },
    }));
  };

  const handleMarkupValue = (val) => {
    const v = Math.max(0, Math.min(200, Number(val) || 0));
    setMarkupValue(v);
    debouncedSavePricing((cfg) => ({
      ...cfg,
      tenant_pricing: {
        ...(cfg.tenant_pricing || {}),
        markup_enabled: true,
        markup_value: v,
      },
    }));
  };

  const handleMinOrderToggle = (val) => {
    setMinOrderEnabled(val);
    debouncedSavePricing((cfg) => ({
      ...cfg,
      tenant_pricing: { ...(cfg.tenant_pricing || {}), min_order_total_enabled: val },
    }));
  };

  const handleMinOrderValue = (val) => {
    const v = Math.max(0, Number(val) || 0);
    setMinOrderValue(v);
    debouncedSavePricing((cfg) => ({
      ...cfg,
      tenant_pricing: {
        ...(cfg.tenant_pricing || {}),
        min_order_total_enabled: true,
        min_order_total_value: v,
      },
    }));
  };

  const handleVolumeDiscountsToggle = (val) => {
    setVolumeDiscountsEnabled(val);
    debouncedSavePricing((cfg) => ({
      ...cfg,
      volume_discounts: { ...(cfg.volume_discounts || {}), enabled: val },
    }));
  };

  const handleExpressFeeToggle = (val) => {
    setExpressFeeEnabled(val);
    debouncedSaveFees((cfg) => {
      const fees = (cfg.fees || []).map((f) => {
        if (/express|expresn/i.test(f.name || '')) {
          return { ...f, active: val };
        }
        return f;
      });
      return { ...cfg, fees };
    });
  };

  const handleFreeShippingThreshold = (val) => {
    const v = Math.max(0, Number(val) || 0);
    setFreeShippingThreshold(v);
    if (!freeShippingFeeId) return;
    debouncedSaveFees((cfg) => {
      const fees = (cfg.fees || []).map((f) => {
        if (f.id !== freeShippingFeeId) return f;
        // Update or add the order_total condition
        const conditions = (f.conditions || []).filter(
          (c) => c.key !== 'order_total'
        );
        if (v > 0) {
          conditions.push({ key: 'order_total', op: 'lt', value: v });
        }
        return { ...f, conditions };
      });
      return { ...cfg, fees };
    });
  };

  // ---- styles ----
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '0',
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading, "Space Grotesk", sans-serif)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--forge-text-primary, #F1F5F9)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const chevronStyle = {
    transition: 'transform 200ms ease-out',
    transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
    color: 'var(--forge-text-muted, #64748B)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  };

  const settingItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    backgroundColor: 'var(--forge-bg-elevated, #111827)',
    borderRadius: 'var(--forge-radius-md, 6px)',
    border: '1px solid var(--forge-border-default, #1E293B)',
  };

  const settingHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  };

  const settingLabelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--forge-text-primary, #F1F5F9)',
  };

  const settingDescStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    color: 'var(--forge-text-muted, #64748B)',
    lineHeight: 1.4,
  };

  const linkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
    color: 'var(--forge-accent-primary, #00D4AA)',
    textDecoration: 'none',
    cursor: 'pointer',
    marginTop: '4px',
    background: 'none',
    border: 'none',
    padding: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const numberInputStyle = {
    width: '80px',
    height: '32px',
    padding: '0 8px',
    backgroundColor: 'var(--forge-bg-void, #0A0E17)',
    border: '1px solid var(--forge-border-default, #1E293B)',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
    fontSize: '13px',
    color: 'var(--forge-text-primary, #F1F5F9)',
    outline: 'none',
    textAlign: 'right',
  };

  const sliderRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const savedBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
    color: 'var(--forge-accent-primary, #00D4AA)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    opacity: saveIndicator ? 1 : 0,
    transition: 'opacity 300ms ease-out',
  };

  return (
    <ForgeCard style={{ marginTop: '20px', padding: '20px' }}>
      {/* Header */}
      <div style={headerStyle} onClick={toggleCollapsed} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapsed(); } }}
        aria-expanded={!collapsed}
        aria-label={language === 'cs' ? 'Rychle nastaveni' : 'Quick Settings'}
      >
        <div style={titleStyle}>
          <Icon name="Sliders" size={20} />
          <span>{language === 'cs' ? 'Rychle nastaveni' : 'Quick Settings'}</span>
          <span style={savedBadgeStyle}>
            <Icon name="Check" size={12} />
            {language === 'cs' ? 'Ulozeno' : 'Saved'}
          </span>
        </div>
        <div style={chevronStyle}>
          <Icon name="ChevronDown" size={20} />
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div style={gridStyle}>
          {/* 1. Global Markup */}
          <div style={settingItemStyle}>
            <div style={settingHeaderStyle}>
              <span style={settingLabelStyle}>
                {language === 'cs' ? 'Globalni prirazka' : 'Global Markup'}
              </span>
              <ForgeToggle
                checked={markupEnabled}
                onChange={handleMarkupToggle}
              />
            </div>
            {markupEnabled && (
              <div>
                <div style={sliderRowStyle}>
                  <ForgeSlider
                    min={0}
                    max={200}
                    step={1}
                    value={markupValue}
                    onChange={handleMarkupValue}
                    label={language === 'cs' ? 'Prirazka (%)' : 'Markup (%)'}
                    showValue
                    className="quick-settings-slider"
                  />
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step={1}
                    value={markupValue}
                    onChange={(e) => handleMarkupValue(e.target.value)}
                    style={numberInputStyle}
                    aria-label={language === 'cs' ? 'Prirazka procenta' : 'Markup percentage'}
                  />
                </div>
              </div>
            )}
            <p style={settingDescStyle}>
              {language === 'cs'
                ? 'Procentualni prirazka aplikovana na celkovou cenu.'
                : 'Percentage markup applied to the total price.'}
            </p>
            <button style={linkStyle} onClick={() => navigate('/admin/pricing')}>
              {language === 'cs' ? 'Upravit vse' : 'Edit all'} <Icon name="ArrowRight" size={12} />
            </button>
          </div>

          {/* 2. Minimum Order Price */}
          <div style={settingItemStyle}>
            <div style={settingHeaderStyle}>
              <span style={settingLabelStyle}>
                {language === 'cs' ? 'Minimalni cena objednavky' : 'Minimum Order Price'}
              </span>
              <ForgeToggle
                checked={minOrderEnabled}
                onChange={handleMinOrderToggle}
              />
            </div>
            {minOrderEnabled && (
              <div style={sliderRowStyle}>
                <ForgeSlider
                  min={0}
                  max={2000}
                  step={10}
                  value={minOrderValue}
                  onChange={handleMinOrderValue}
                  label={language === 'cs' ? 'Min. cena (Kc)' : 'Min. price (CZK)'}
                  showValue
                  className="quick-settings-slider"
                />
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={10}
                  value={minOrderValue}
                  onChange={(e) => handleMinOrderValue(e.target.value)}
                  style={numberInputStyle}
                  aria-label={language === 'cs' ? 'Minimalni cena' : 'Minimum price'}
                />
              </div>
            )}
            <p style={settingDescStyle}>
              {language === 'cs'
                ? 'Objednavky pod touto castkou budou navyseny na minimum.'
                : 'Orders below this amount will be raised to the minimum.'}
            </p>
            <button style={linkStyle} onClick={() => navigate('/admin/pricing')}>
              {language === 'cs' ? 'Upravit vse' : 'Edit all'} <Icon name="ArrowRight" size={12} />
            </button>
          </div>

          {/* 3. Express Pricing Toggle */}
          <div style={settingItemStyle}>
            <div style={settingHeaderStyle}>
              <span style={settingLabelStyle}>
                {language === 'cs' ? 'Expresni zpracovani' : 'Express Processing'}
              </span>
              <ForgeToggle
                checked={expressFeeEnabled}
                onChange={handleExpressFeeToggle}
              />
            </div>
            <p style={settingDescStyle}>
              {language === 'cs'
                ? 'Povolit/zakazat expresni priplatek v kalkulacce.'
                : 'Enable/disable express fee in the calculator.'}
            </p>
            <button style={linkStyle} onClick={() => navigate('/admin/fees')}>
              {language === 'cs' ? 'Upravit vse' : 'Edit all'} <Icon name="ArrowRight" size={12} />
            </button>
          </div>

          {/* 4. Free Shipping Threshold */}
          <div style={settingItemStyle}>
            <div style={settingHeaderStyle}>
              <span style={settingLabelStyle}>
                {language === 'cs' ? 'Doprava zdarma od' : 'Free Shipping Threshold'}
              </span>
            </div>
            <div style={sliderRowStyle}>
              <ForgeSlider
                min={0}
                max={5000}
                step={50}
                value={freeShippingThreshold}
                onChange={handleFreeShippingThreshold}
                label={language === 'cs' ? 'Prah (Kc)' : 'Threshold (CZK)'}
                showValue
                disabled={!freeShippingFeeId}
                className="quick-settings-slider"
              />
              <input
                type="number"
                min={0}
                max={50000}
                step={50}
                value={freeShippingThreshold}
                onChange={(e) => handleFreeShippingThreshold(e.target.value)}
                style={{
                  ...numberInputStyle,
                  opacity: freeShippingFeeId ? 1 : 0.4,
                  cursor: freeShippingFeeId ? 'text' : 'not-allowed',
                }}
                disabled={!freeShippingFeeId}
                aria-label={language === 'cs' ? 'Prah dopravy zdarma' : 'Free shipping threshold'}
              />
            </div>
            {!freeShippingFeeId && (
              <p style={{ ...settingDescStyle, color: 'var(--forge-warning, #F59E0B)' }}>
                {language === 'cs'
                  ? 'Nebyl nalezen poplatek za dopravu. Vytvorte ho v sekci Poplatky.'
                  : 'No shipping fee found. Create one in the Fees section.'}
              </p>
            )}
            <p style={settingDescStyle}>
              {language === 'cs'
                ? 'Objednavky nad tuto castku maji dopravu zdarma. 0 = vypnuto.'
                : 'Orders above this amount get free shipping. 0 = disabled.'}
            </p>
            <button style={linkStyle} onClick={() => navigate('/admin/fees')}>
              {language === 'cs' ? 'Upravit vse' : 'Edit all'} <Icon name="ArrowRight" size={12} />
            </button>
          </div>

          {/* 5. Volume Discounts Toggle */}
          <div style={settingItemStyle}>
            <div style={settingHeaderStyle}>
              <span style={settingLabelStyle}>
                {language === 'cs' ? 'Mnozstevni slevy' : 'Volume Discounts'}
              </span>
              <ForgeToggle
                checked={volumeDiscountsEnabled}
                onChange={handleVolumeDiscountsToggle}
              />
            </div>
            <p style={settingDescStyle}>
              {language === 'cs'
                ? 'Povolit slevy pri vyssim poctu kusu. Prahy nastavite v ceniku.'
                : 'Enable discounts for higher quantities. Configure tiers in Pricing.'}
            </p>
            <button style={linkStyle} onClick={() => navigate('/admin/pricing')}>
              {language === 'cs' ? 'Upravit vse' : 'Edit all'} <Icon name="ArrowRight" size={12} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .quick-settings-slider {
          flex: 1;
          min-width: 0;
        }
      `}</style>
    </ForgeCard>
  );
}
