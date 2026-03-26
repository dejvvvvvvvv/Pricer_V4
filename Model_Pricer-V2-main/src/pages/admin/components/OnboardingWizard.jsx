import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import { useLanguage } from '../../../contexts/LanguageContext';
import { readTenantJson, writeTenantJson, getTenantId } from '../../../utils/adminTenantStorage';
import { getBranding, saveBranding, getDefaultBranding } from '../../../utils/adminBrandingWidgetStorage';
import { loadPricingConfigV3, savePricingConfigV3 } from '../../../utils/adminPricingStorage';
import { loadFeesConfigV3, saveFeesConfigV3 } from '../../../utils/adminFeesStorage';
import { triggerConfetti, playSuccessSound } from '../../../lib/confetti';
import { generateId } from '../../../utils/generateId';

/* ── Constants ────────────────────────────────────────────────────────── */

const ONBOARDING_NS = 'onboarding';
const STEPS = ['welcome', 'branding', 'pricing', 'fees', 'widget'];

const LABELS = {
  cs: {
    wizardTitle: 'Pruvodce nastavenim',
    wizardSubtitle: 'Nastavte si zakladni konfiguraci ve 4 krocich',
    stepWelcome: 'Vitejte',
    stepBranding: 'Branding',
    stepPricing: 'Cenik',
    stepFees: 'Poplatky',
    stepWidget: 'Widget',
    next: 'Dalsi',
    back: 'Zpet',
    skip: 'Preskocit',
    finish: 'Dokoncit',
    close: 'Zavrit',

    // Welcome
    welcomeTitle: 'Vitejte v ModelPricer!',
    welcomeDesc: 'Tento pruvodce vam pomuze nastavit zakladni konfiguraci vasi 3D tiskove kalkulacky. Muzete ho kdykoliv spustit znovu z nastaveni.',
    welcomeReady: 'Pojdme na to!',

    // Branding
    brandingTitle: 'Nastavte svuj branding',
    brandingDesc: 'Jak se vase firma jmenuje? Pridejte nazev a pripadne logo.',
    businessName: 'Nazev firmy',
    tagline: 'Slogan',
    logoUrl: 'URL loga',
    logoUrlPlaceholder: 'https://example.com/logo.png',
    brandingSaved: 'Branding ulozen',

    // Pricing
    pricingTitle: 'Zakladni cenik',
    pricingDesc: 'Nastavte cenu za gram pro vas hlavni material a hodinovou sazbu.',
    materialName: 'Nazev materialu',
    pricePerGram: 'Cena za gram (Kc)',
    ratePerHour: 'Hodinova sazba (Kc)',
    pricingSaved: 'Cenik ulozen',

    // Fees
    feesTitle: 'Poplatky',
    feesDesc: 'Pridejte prvni poplatek (napr. prace, baleni, doprava).',
    feeName: 'Nazev poplatku',
    feeAmount: 'Castka (Kc)',
    feeType: 'Typ',
    feeTypeFixed: 'Fixni',
    feeTypePercent: 'Procento',
    addFee: 'Pridat poplatek',
    feesSaved: 'Poplatek pridan',
    noFeesYet: 'Zatim zadne poplatky',

    // Widget
    widgetTitle: 'Vas widget',
    widgetDesc: 'Zkopirujte embed kod a vlozte ho na svuj web. Widget pouzije nastaveni ktere jste prave nakonfigurovali.',
    embedCode: 'Embed kod',
    copied: 'Zkopirovano!',
    copyCode: 'Kopirovat kod',
    widgetPreview: 'Nahled',

    // Complete
    completeTitle: 'Vse je pripraveno!',
    completeDesc: 'Zakladni nastaveni je hotove. Muzete zacit prijimat objednavky nebo dale upravovat nastaveni v admin panelu.',
    goToDashboard: 'Prejit na Dashboard',

    // Step status
    completed: 'Hotovo',
    notCompleted: 'Nenastaveno',
  },
  en: {
    wizardTitle: 'Setup Wizard',
    wizardSubtitle: 'Set up your basic configuration in 4 steps',
    stepWelcome: 'Welcome',
    stepBranding: 'Branding',
    stepPricing: 'Pricing',
    stepFees: 'Fees',
    stepWidget: 'Widget',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    finish: 'Finish',
    close: 'Close',

    // Welcome
    welcomeTitle: 'Welcome to ModelPricer!',
    welcomeDesc: 'This wizard will help you set up the basic configuration for your 3D printing calculator. You can restart it anytime from settings.',
    welcomeReady: "Let's go!",

    // Branding
    brandingTitle: 'Set up your branding',
    brandingDesc: "What's your company name? Add a name and optionally a logo.",
    businessName: 'Business name',
    tagline: 'Tagline',
    logoUrl: 'Logo URL',
    logoUrlPlaceholder: 'https://example.com/logo.png',
    brandingSaved: 'Branding saved',

    // Pricing
    pricingTitle: 'Basic pricing',
    pricingDesc: 'Set the price per gram for your main material and hourly rate.',
    materialName: 'Material name',
    pricePerGram: 'Price per gram (CZK)',
    ratePerHour: 'Hourly rate (CZK)',
    pricingSaved: 'Pricing saved',

    // Fees
    feesTitle: 'Fees',
    feesDesc: 'Add your first fee (e.g., labor, packaging, shipping).',
    feeName: 'Fee name',
    feeAmount: 'Amount (CZK)',
    feeType: 'Type',
    feeTypeFixed: 'Fixed',
    feeTypePercent: 'Percent',
    addFee: 'Add fee',
    feesSaved: 'Fee added',
    noFeesYet: 'No fees yet',

    // Widget
    widgetTitle: 'Your widget',
    widgetDesc: 'Copy the embed code and paste it into your website. The widget will use the settings you just configured.',
    embedCode: 'Embed code',
    copied: 'Copied!',
    copyCode: 'Copy code',
    widgetPreview: 'Preview',

    // Complete
    completeTitle: 'All set!',
    completeDesc: 'Basic setup is complete. You can start receiving orders or further customize your settings in the admin panel.',
    goToDashboard: 'Go to Dashboard',

    // Step status
    completed: 'Done',
    notCompleted: 'Not set',
  },
};

/* ── Onboarding storage helpers ───────────────────────────────────────── */

export function isOnboardingCompleted() {
  const data = readTenantJson(ONBOARDING_NS, null);
  return !!(data && data.completed);
}

export function markOnboardingCompleted() {
  const existing = readTenantJson(ONBOARDING_NS, {});
  writeTenantJson(ONBOARDING_NS, {
    ...existing,
    completed: true,
    completed_at: new Date().toISOString(),
  });
}

export function resetOnboarding() {
  writeTenantJson(ONBOARDING_NS, { completed: false });
}

/* ── Step detection ───────────────────────────────────────────────────── */

function detectStepCompletion() {
  const tenantId = getTenantId();

  // Branding: has custom name or logo
  const branding = getBranding(tenantId);
  const defaults = getDefaultBranding();
  const brandingDone = !!(
    branding &&
    ((branding.businessName && branding.businessName !== defaults.businessName) || branding.logo)
  );

  // Pricing: has materials with price > 0
  const pricing = loadPricingConfigV3();
  const pricingDone = !!(
    pricing &&
    Array.isArray(pricing.materials) &&
    pricing.materials.some(m => m.enabled && m.price_per_gram > 0)
  );

  // Fees: has at least one fee
  const fees = loadFeesConfigV3();
  const feesList = Array.isArray(fees?.fees) ? fees.fees : [];
  const feesDone = feesList.length > 0;

  // Widget: has onboarding widget flag or any widget config
  const onboarding = readTenantJson(ONBOARDING_NS, {});
  const widgetDone = !!(onboarding && onboarding.widget_configured);

  return { brandingDone, pricingDone, feesDone, widgetDone };
}

/* ── Step icons ───────────────────────────────────────────────────────── */

const STEP_ICONS = {
  welcome: 'Rocket',
  branding: 'Palette',
  pricing: 'DollarSign',
  fees: 'Receipt',
  widget: 'Layout',
};

/* ── Main component ───────────────────────────────────────────────────── */

export default function OnboardingWizard({ open, onClose }) {
  const { language } = useLanguage();
  const t = LABELS[language] || LABELS.en;

  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [completion, setCompletion] = useState(() => detectStepCompletion());

  // Branding form
  const tenantId = getTenantId();
  const existingBranding = useMemo(() => getBranding(tenantId), [tenantId]);
  const [brandingName, setBrandingName] = useState(existingBranding?.businessName || '');
  const [brandingTagline, setBrandingTagline] = useState(existingBranding?.tagline || '');
  const [brandingLogo, setBrandingLogo] = useState(existingBranding?.logo || '');

  // Pricing form
  const existingPricing = useMemo(() => loadPricingConfigV3(), []);
  const firstMaterial = existingPricing?.materials?.[0];
  const [matName, setMatName] = useState(firstMaterial?.name || 'PLA');
  const [matPrice, setMatPrice] = useState(firstMaterial?.price_per_gram || 3);
  const [hourRate, setHourRate] = useState(
    existingPricing?.tenant_pricing?.rate_per_hour || 350
  );

  // Fees form
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeType, setFeeType] = useState('flat');
  const [addedFees, setAddedFees] = useState([]);

  // Widget
  const [copied, setCopied] = useState(false);

  // Timer refs for cleanup
  const feedbackTimerRef = useRef(null);
  const finishTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(feedbackTimerRef.current);
      clearTimeout(finishTimerRef.current);
      clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const refreshCompletion = useCallback(() => {
    setCompletion(detectStepCompletion());
  }, []);

  const showFeedback = useCallback((msg) => {
    setFeedback(msg);
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  }, []);

  /* ── Save handlers ──────────────────────────────────────────────────── */

  const handleSaveBranding = useCallback(() => {
    const current = getBranding(tenantId);
    saveBranding(tenantId, {
      ...current,
      businessName: brandingName.trim() || current.businessName,
      tagline: brandingTagline.trim() || current.tagline,
      logo: brandingLogo.trim() || current.logo,
    });
    refreshCompletion();
    showFeedback(t.brandingSaved);
  }, [tenantId, brandingName, brandingTagline, brandingLogo, refreshCompletion, showFeedback, t]);

  const handleSavePricing = useCallback(() => {
    const config = loadPricingConfigV3();
    const materials = [...(config.materials || [])];

    if (materials.length > 0) {
      materials[0] = {
        ...materials[0],
        name: matName.trim() || materials[0].name,
        key: (matName.trim() || materials[0].key).toLowerCase().replace(/\s+/g, '_'),
        price_per_gram: Number(matPrice) || materials[0].price_per_gram,
        enabled: true,
      };
    } else {
      materials.push({
        id: `mat-${(matName || 'pla').toLowerCase().replace(/\s+/g, '_')}`,
        key: (matName || 'pla').toLowerCase().replace(/\s+/g, '_'),
        name: matName || 'PLA',
        price_per_gram: Number(matPrice) || 3,
        enabled: true,
        colors: [],
      });
    }

    savePricingConfigV3({
      ...config,
      materials,
      tenant_pricing: {
        ...(config.tenant_pricing || {}),
        rate_per_hour: Number(hourRate) || 350,
      },
    });

    refreshCompletion();
    showFeedback(t.pricingSaved);
  }, [matName, matPrice, hourRate, refreshCompletion, showFeedback, t]);

  const handleAddFee = useCallback(() => {
    if (!feeName.trim() || !feeAmount) return;

    try {
      const feesConfig = loadFeesConfigV3();
      const feesList = Array.isArray(feesConfig?.fees) ? [...feesConfig.fees] : [];

      const newFee = {
        id: generateId('fee'),
        name: feeName.trim(),
        value: Number(feeAmount) || 0,
        type: feeType,
        active: true,
        scope: 'MODEL',
        charge_basis: 'PER_FILE',
        selectable: true,
        selected_by_default: false,
        required: false,
      };

      feesList.push(newFee);
      saveFeesConfigV3({ ...feesConfig, fees: feesList });

      setAddedFees(prev => [...prev, newFee]);
      setFeeName('');
      setFeeAmount('');
      refreshCompletion();
      showFeedback(t.feesSaved);
    } catch (err) {
      console.error('[OnboardingWizard] handleAddFee error:', err);
    }
  }, [feeName, feeAmount, feeType, refreshCompletion, showFeedback, t]);

  const handleMarkWidgetDone = useCallback(() => {
    const existing = readTenantJson(ONBOARDING_NS, {});
    writeTenantJson(ONBOARDING_NS, { ...existing, widget_configured: true });
    refreshCompletion();
  }, [refreshCompletion]);

  const handleFinish = useCallback(() => {
    markOnboardingCompleted();
    triggerConfetti({ particleCount: 200 });
    playSuccessSound();
    clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 2500);
  }, [onClose]);

  const embedCode = useMemo(() => {
    return `<iframe
  src="${window.location.origin}/w/${tenantId}"
  width="100%"
  height="700"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`;
  }, [tenantId]);

  const handleCopyEmbed = useCallback(() => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      handleMarkWidgetDone();
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [embedCode, handleMarkWidgetDone]);

  /* ── Navigation ─────────────────────────────────────────────────────── */

  const goNext = () => {
    // Auto-save on step exit — wrapped in try/catch so navigation always proceeds
    try {
      if (currentStep === 1) handleSaveBranding();
      if (currentStep === 2) handleSavePricing();
    } catch (err) {
      console.warn('[OnboardingWizard] Auto-save failed on step exit:', err);
    }
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  if (!open) return null;

  /* ── Step content renderers ─────────────────────────────────────────── */

  function renderWelcome() {
    return (
      <div className="owz-step-content owz-welcome">
        <div className="owz-welcome-icon">
          <Icon name="Rocket" size={48} color="var(--forge-accent-primary, #00D4AA)" />
        </div>
        <h2 className="owz-step-title">{t.welcomeTitle}</h2>
        <p className="owz-step-desc">{t.welcomeDesc}</p>

        <div className="owz-checklist">
          {['branding', 'pricing', 'fees', 'widget'].map((key, i) => {
            const done = key === 'branding' ? completion.brandingDone
              : key === 'pricing' ? completion.pricingDone
              : key === 'fees' ? completion.feesDone
              : completion.widgetDone;
            return (
              <div key={key} className={`owz-checklist-item ${done ? 'owz-checklist-item--done' : ''}`}>
                <div className="owz-checklist-num">{i + 1}</div>
                <span>{t[`step${key.charAt(0).toUpperCase() + key.slice(1)}`]}</span>
                <span className="owz-checklist-status">
                  {done ? t.completed : t.notCompleted}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderBranding() {
    return (
      <div className="owz-step-content">
        <h2 className="owz-step-title">{t.brandingTitle}</h2>
        <p className="owz-step-desc">{t.brandingDesc}</p>

        <div className="owz-form">
          <label className="owz-label">{t.businessName}</label>
          <input
            className="owz-input"
            value={brandingName}
            onChange={e => setBrandingName(e.target.value)}
            placeholder="My 3D Print Shop"
          />

          <label className="owz-label">{t.tagline}</label>
          <input
            className="owz-input"
            value={brandingTagline}
            onChange={e => setBrandingTagline(e.target.value)}
            placeholder="Fast & Reliable 3D Printing"
          />

          <label className="owz-label">{t.logoUrl}</label>
          <input
            className="owz-input"
            value={brandingLogo}
            onChange={e => setBrandingLogo(e.target.value)}
            placeholder={t.logoUrlPlaceholder}
          />

          {brandingLogo && (
            <div className="owz-logo-preview">
              <img
                src={brandingLogo}
                alt="Logo preview"
                onError={e => { e.target.style.display = 'none'; }}
                style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPricing() {
    return (
      <div className="owz-step-content">
        <h2 className="owz-step-title">{t.pricingTitle}</h2>
        <p className="owz-step-desc">{t.pricingDesc}</p>

        <div className="owz-form">
          <label className="owz-label">{t.materialName}</label>
          <input
            className="owz-input"
            value={matName}
            onChange={e => setMatName(e.target.value)}
            placeholder="PLA"
          />

          <label className="owz-label">{t.pricePerGram}</label>
          <input
            className="owz-input"
            type="number"
            min="0"
            step="0.1"
            value={matPrice}
            onChange={e => setMatPrice(e.target.value)}
          />

          <label className="owz-label">{t.ratePerHour}</label>
          <input
            className="owz-input"
            type="number"
            min="0"
            step="10"
            value={hourRate}
            onChange={e => setHourRate(e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderFees() {
    let existingFees = [];
    try {
      const feesConfig = loadFeesConfigV3();
      existingFees = Array.isArray(feesConfig?.fees) ? feesConfig.fees : [];
    } catch (err) {
      console.warn('[OnboardingWizard] Failed to load fees:', err);
    }

    return (
      <div className="owz-step-content">
        <h2 className="owz-step-title">{t.feesTitle}</h2>
        <p className="owz-step-desc">{t.feesDesc}</p>

        {existingFees.length > 0 && (
          <div className="owz-fees-list">
            {existingFees.map(f => (
              <div key={f.id} className="owz-fee-item">
                <span>{f.name}</span>
                <span className="owz-fee-amount">
                  {f.value} {f.type === 'percent' ? '%' : 'Kc'}
                </span>
              </div>
            ))}
          </div>
        )}

        {existingFees.length === 0 && addedFees.length === 0 && (
          <p className="owz-empty-hint">{t.noFeesYet}</p>
        )}

        <div className="owz-form owz-form--inline">
          <div className="owz-form-row">
            <div className="owz-form-field owz-form-field--grow">
              <label className="owz-label">{t.feeName}</label>
              <input
                className="owz-input"
                value={feeName}
                onChange={e => setFeeName(e.target.value)}
                placeholder={language === 'cs' ? 'Prace' : 'Labor'}
              />
            </div>
            <div className="owz-form-field">
              <label className="owz-label">{t.feeAmount}</label>
              <input
                className="owz-input"
                type="number"
                min="0"
                value={feeAmount}
                onChange={e => setFeeAmount(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="owz-form-field">
              <label className="owz-label">{t.feeType}</label>
              <select
                className="owz-input owz-select"
                value={feeType}
                onChange={e => setFeeType(e.target.value)}
              >
                <option value="flat">{t.feeTypeFixed}</option>
                <option value="percent">{t.feeTypePercent}</option>
              </select>
            </div>
          </div>
          <button
            className="owz-btn owz-btn--secondary"
            onClick={handleAddFee}
            disabled={!feeName.trim() || !feeAmount}
          >
            <Icon name="Plus" size={14} />
            {t.addFee}
          </button>
        </div>
      </div>
    );
  }

  function renderWidget() {
    return (
      <div className="owz-step-content">
        <h2 className="owz-step-title">{t.widgetTitle}</h2>
        <p className="owz-step-desc">{t.widgetDesc}</p>

        <div className="owz-embed-section">
          <label className="owz-label">{t.embedCode}</label>
          <pre className="owz-code-block">{embedCode}</pre>
          <button className="owz-btn owz-btn--primary" onClick={handleCopyEmbed}>
            <Icon name={copied ? 'Check' : 'Copy'} size={14} />
            {copied ? t.copied : t.copyCode}
          </button>
        </div>
      </div>
    );
  }

  const stepRenderers = [renderWelcome, renderBranding, renderPricing, renderFees, renderWidget];

  /* ── Render ─────────────────────────────────────────────────────────── */

  return createPortal(
    <div className="owz-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="owz-modal">
        {/* Close button */}
        <button className="owz-close" onClick={onClose} aria-label={t.close}>
          <Icon name="X" size={18} />
        </button>

        {/* Header with stepper */}
        <div className="owz-header">
          <h1 className="owz-title">{t.wizardTitle}</h1>
          <div className="owz-stepper">
            {STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isPast = i < currentStep;
              const stepCompl = step === 'branding' ? completion.brandingDone
                : step === 'pricing' ? completion.pricingDone
                : step === 'fees' ? completion.feesDone
                : step === 'widget' ? completion.widgetDone
                : false;

              return (
                <React.Fragment key={step}>
                  {i > 0 && <div className={`owz-stepper-line ${isPast ? 'owz-stepper-line--done' : ''}`} />}
                  <button
                    className={`owz-stepper-dot ${isActive ? 'owz-stepper-dot--active' : ''} ${isPast || stepCompl ? 'owz-stepper-dot--done' : ''}`}
                    onClick={() => setCurrentStep(i)}
                    title={t[`step${step.charAt(0).toUpperCase() + step.slice(1)}`]}
                  >
                    {isPast || stepCompl ? (
                      <Icon name="Check" size={14} />
                    ) : (
                      <Icon name={STEP_ICONS[step]} size={14} />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <p className="owz-step-label">
            {t[`step${STEPS[currentStep].charAt(0).toUpperCase() + STEPS[currentStep].slice(1)}`]}
            <span className="owz-step-count">{currentStep + 1}/{STEPS.length}</span>
          </p>
        </div>

        {/* Step content */}
        <div className="owz-body">
          {stepRenderers[currentStep]()}
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className="owz-feedback">
            <Icon name="Check" size={14} />
            {feedback}
          </div>
        )}

        {/* Footer navigation */}
        <div className="owz-footer">
          <div className="owz-footer-left">
            {!isFirst && (
              <button className="owz-btn owz-btn--ghost" onClick={goBack}>
                <Icon name="ChevronLeft" size={14} />
                {t.back}
              </button>
            )}
          </div>
          <div className="owz-footer-right">
            {!isFirst && !isLast && (
              <button className="owz-btn owz-btn--ghost" onClick={goNext}>
                {t.skip}
              </button>
            )}
            {isLast ? (
              <button className="owz-btn owz-btn--primary" onClick={handleFinish}>
                <Icon name="PartyPopper" size={14} />
                {t.finish}
              </button>
            ) : (
              <button className="owz-btn owz-btn--primary" onClick={goNext}>
                {t.next}
                <Icon name="ChevronRight" size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{wizardStyles}</style>
    </div>,
    document.body
  );
}

/* ── Styles ────────────────────────────────────────────────────────────── */

const wizardStyles = `
  .owz-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: owzFadeIn 0.25s ease;
  }

  @keyframes owzFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .owz-modal {
    position: relative;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    background: var(--forge-bg-surface, #111827);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-lg, 12px);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
  }

  .owz-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: var(--forge-text-muted, #7A8291);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    z-index: 1;
  }

  .owz-close:hover {
    color: var(--forge-text-primary, #F1F5F9);
    background: var(--forge-bg-elevated, #1E293B);
  }

  /* Header */
  .owz-header {
    padding: 28px 28px 0;
    text-align: center;
  }

  .owz-title {
    margin: 0 0 20px;
    font-size: 20px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
    letter-spacing: -0.02em;
  }

  /* Stepper */
  .owz-stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-bottom: 12px;
  }

  .owz-stepper-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--forge-border-default, #1E293B);
    background: var(--forge-bg-elevated, #0D1117);
    color: var(--forge-text-muted, #7A8291);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .owz-stepper-dot--active {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: rgba(0, 212, 170, 0.1);
    color: var(--forge-accent-primary, #00D4AA);
    box-shadow: 0 0 12px rgba(0, 212, 170, 0.2);
  }

  .owz-stepper-dot--done {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .owz-stepper-line {
    width: 40px;
    height: 2px;
    background: var(--forge-border-default, #1E293B);
    flex-shrink: 0;
  }

  .owz-stepper-line--done {
    background: var(--forge-accent-primary, #00D4AA);
  }

  .owz-step-label {
    margin: 0;
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .owz-step-count {
    color: var(--forge-accent-primary, #00D4AA);
    font-weight: 600;
  }

  /* Body */
  .owz-body {
    padding: 24px 28px;
    flex: 1;
    min-height: 300px;
  }

  .owz-step-content {
    animation: owzSlideIn 0.2s ease;
  }

  @keyframes owzSlideIn {
    from { opacity: 0; transform: translateX(12px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .owz-step-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .owz-step-desc {
    margin: 0 0 20px;
    font-size: 14px;
    color: var(--forge-text-secondary, #94A3B8);
    line-height: 1.5;
  }

  /* Welcome */
  .owz-welcome {
    text-align: center;
    padding-top: 12px;
  }

  .owz-welcome-icon {
    margin-bottom: 16px;
  }

  .owz-checklist {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 360px;
    margin: 0 auto;
    text-align: left;
  }

  .owz-checklist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
    transition: all 0.15s;
  }

  .owz-checklist-item--done {
    border-color: rgba(0, 212, 170, 0.3);
    background: rgba(0, 212, 170, 0.05);
  }

  .owz-checklist-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--forge-bg-surface, #111827);
    border: 1px solid var(--forge-border-default, #1E293B);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    font-weight: 600;
    color: var(--forge-text-muted, #7A8291);
    flex-shrink: 0;
  }

  .owz-checklist-item--done .owz-checklist-num {
    background: var(--forge-accent-primary, #00D4AA);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .owz-checklist-status {
    margin-left: auto;
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .owz-checklist-item--done .owz-checklist-status {
    color: var(--forge-accent-primary, #00D4AA);
  }

  /* Forms */
  .owz-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .owz-label {
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--forge-text-muted, #7A8291);
    margin-bottom: -8px;
    font-weight: 500;
  }

  .owz-input {
    padding: 10px 14px;
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    color: var(--forge-text-primary, #F1F5F9);
    font-size: 14px;
    font-family: var(--forge-font-body, 'IBM Plex Sans', sans-serif);
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  .owz-input:focus {
    border-color: var(--forge-accent-primary, #00D4AA);
    box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.1);
  }

  .owz-input::placeholder {
    color: var(--forge-text-muted, #7A8291);
    opacity: 0.6;
  }

  .owz-select {
    appearance: none;
    cursor: pointer;
  }

  .owz-logo-preview {
    padding: 12px;
    background: var(--forge-bg-elevated, #0D1117);
    border-radius: var(--forge-radius-md, 6px);
    border: 1px solid var(--forge-border-default, #1E293B);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .owz-form--inline {
    gap: 12px;
  }

  .owz-form-row {
    display: grid;
    grid-template-columns: 1fr 120px 120px;
    gap: 12px;
  }

  .owz-form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .owz-form-field--grow {
    flex: 1;
  }

  /* Fees list */
  .owz-fees-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .owz-fee-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
  }

  .owz-fee-amount {
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    font-weight: 600;
    color: var(--forge-text-primary, #F1F5F9);
    font-size: 13px;
  }

  .owz-empty-hint {
    font-size: 13px;
    color: var(--forge-text-muted, #7A8291);
    font-style: italic;
    margin: 0 0 16px;
  }

  /* Widget embed */
  .owz-embed-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .owz-code-block {
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 14px;
    font-size: 12px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    line-height: 1.5;
  }

  /* Buttons */
  .owz-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: var(--forge-radius-md, 6px);
    font-size: 13px;
    font-family: var(--forge-font-body, 'IBM Plex Sans', sans-serif);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .owz-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .owz-btn--primary {
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .owz-btn--primary:hover:not(:disabled) {
    background: #00E8BB;
    box-shadow: 0 0 16px rgba(0, 212, 170, 0.25);
  }

  .owz-btn--secondary {
    background: var(--forge-bg-surface, #111827);
    color: var(--forge-text-secondary, #94A3B8);
    border-color: var(--forge-border-default, #1E293B);
  }

  .owz-btn--secondary:hover:not(:disabled) {
    background: var(--forge-bg-elevated, #1E293B);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .owz-btn--ghost {
    background: transparent;
    color: var(--forge-text-muted, #7A8291);
    border: none;
  }

  .owz-btn--ghost:hover {
    color: var(--forge-text-primary, #F1F5F9);
    background: var(--forge-bg-elevated, #1E293B);
  }

  /* Feedback toast */
  .owz-feedback {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
    font-size: 13px;
    font-weight: 600;
    border-radius: 999px;
    animation: owzToastIn 0.2s ease;
    z-index: 10;
  }

  @keyframes owzToastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Footer */
  .owz-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 28px;
    border-top: 1px solid var(--forge-border-default, #1E293B);
  }

  .owz-footer-left,
  .owz-footer-right {
    display: flex;
    gap: 8px;
  }

  /* Scrollbar */
  .owz-modal::-webkit-scrollbar {
    width: 4px;
  }
  .owz-modal::-webkit-scrollbar-track {
    background: transparent;
  }
  .owz-modal::-webkit-scrollbar-thumb {
    background: var(--forge-border-default, #1E293B);
    border-radius: 2px;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .owz-overlay {
      padding: 12px;
    }

    .owz-modal {
      max-height: 95vh;
    }

    .owz-header {
      padding: 20px 20px 0;
    }

    .owz-body {
      padding: 20px;
    }

    .owz-footer {
      padding: 12px 20px;
    }

    .owz-stepper-line {
      width: 20px;
    }

    .owz-form-row {
      grid-template-columns: 1fr;
    }
  }
`;
