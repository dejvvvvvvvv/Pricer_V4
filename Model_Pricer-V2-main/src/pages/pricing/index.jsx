import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import Reveal from '../../components/marketing/Reveal';
import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle';
import ForgeButton from '../../components/ui/forge/ForgeButton';
import ForgeSectionLabel from '../../components/ui/forge/ForgeSectionLabel';
import ForgePricingCard from '../../components/ui/forge/ForgePricingCard';
import ForgeFaqAccordion from '../../components/ui/forge/ForgeFaqAccordion';
import { getFaqCategories } from '../../data/faq';

const forgePageStyles = {
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  minHeight: '100vh',
};

const Pricing = () => {
  const { t, language } = useLanguage();
  useDocumentTitle('Pricing Plans');
  const [activeTab, setActiveTab] = useState(0);

  const faqCategories = getFaqCategories(language);

  const plans = [
    {
      name: t('pricing.plan.starter'),
      price: language === 'cs' ? '499 Kč' : '$20',
      period: t('pricing.monthly'),
      ctaText: t('pricing.plan.starter.cta'),
      ctaTo: '/register',
      recommended: false,
      features: [
        t('pricing.starter.f1'),
        t('pricing.starter.f2'),
        t('pricing.starter.f3'),
        t('pricing.starter.f4'),
        t('pricing.starter.f5'),
      ],
    },
    {
      name: t('pricing.plan.professional'),
      price: language === 'cs' ? '1 999 Kč' : '$80',
      period: t('pricing.monthly'),
      ctaText: t('pricing.plan.professional.cta'),
      ctaTo: '/register',
      recommended: true,
      features: [
        t('pricing.pro.f1'),
        t('pricing.pro.f2'),
        t('pricing.pro.f3'),
        t('pricing.pro.f4'),
        t('pricing.pro.f5'),
        t('pricing.pro.f6'),
      ],
    },
    {
      name: t('pricing.plan.enterprise'),
      price: t('pricing.plan.enterprise.price'),
      period: t('pricing.custom'),
      ctaText: t('pricing.plan.enterprise.cta'),
      ctaTo: '/support',
      recommended: false,
      features: [
        t('pricing.enterprise.f1'),
        t('pricing.enterprise.f2'),
        t('pricing.enterprise.f3'),
        t('pricing.enterprise.f4'),
        t('pricing.enterprise.f5'),
        t('pricing.enterprise.f6'),
      ],
    },
  ];

  const kpis = [
    { value: '8s', title: t('pricing.kpi.toQuote'), desc: t('pricing.kpi.toQuoteDesc') },
    { value: '60%', title: t('pricing.kpi.lessManual'), desc: t('pricing.kpi.lessManualDesc') },
    { value: '24/7', title: t('pricing.kpi.automation'), desc: t('pricing.kpi.automationDesc') },
  ];

  return (
    <div className="forge-grain" style={forgePageStyles}>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden forge-grid-bg py-20 lg:py-28">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <Reveal>
            <h1 className="forge-h1 mb-5" style={{ letterSpacing: '-0.02em' }}>
              {t('pricing.hero.title')}
            </h1>
            <p
              className="forge-body-lg mx-auto mb-12"
              style={{ color: 'var(--forge-text-secondary)', maxWidth: 560, lineHeight: 1.6 }}
            >
              {t('pricing.hero.subtitle')}
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="p-5"
                  style={{
                    background: 'var(--forge-bg-surface)',
                    border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-md)',
                    borderTop: '2px solid var(--forge-accent-primary)',
                  }}
                >
                  <span
                    className="forge-mono-bold block mb-1"
                    style={{ fontSize: 'var(--forge-text-2xl)', color: 'var(--forge-accent-primary)' }}
                  >
                    {kpi.value}
                  </span>
                  <span
                    className="block mb-1"
                    style={{
                      fontFamily: 'var(--forge-font-heading)',
                      fontSize: 'var(--forge-text-base)',
                      fontWeight: 600,
                      color: 'var(--forge-text-primary)',
                    }}
                  >
                    {kpi.title}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--forge-text-sm)',
                      color: 'var(--forge-text-muted)',
                    }}
                  >
                    {kpi.desc}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== PLANS ========== */}
      <section className="forge-skewed-bg py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <ForgeSectionLabel text={t('pricing.plans.label')} className="mb-4 block text-center" />
            <h2 className="forge-h2 text-center mb-4">
              {t('pricing.plans.title')}
            </h2>
            <p
              className="text-center mb-12 mx-auto"
              style={{ color: 'var(--forge-text-secondary)', maxWidth: 480 }}
            >
              {t('pricing.plans.subtitle')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.05}>
                <ForgePricingCard
                  name={plan.name}
                  price={plan.price}
                  period={plan.period}
                  features={plan.features}
                  ctaText={plan.ctaText}
                  ctaTo={plan.ctaTo}
                  recommended={plan.recommended}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>

          {/* Annual discount banner */}
          <Reveal delay={0.15}>
            <div
              className="mt-10 p-6 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                background: 'var(--forge-bg-surface)',
                border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-md)',
              }}
            >
              <div>
                <span
                  className="block mb-1"
                  style={{
                    fontFamily: 'var(--forge-font-heading)',
                    fontWeight: 600,
                    color: 'var(--forge-text-primary)',
                  }}
                >
                  {t('pricing.annual.title')}
                </span>
                <span style={{ color: 'var(--forge-text-secondary)', fontSize: 'var(--forge-text-sm)' }}>
                  {t('pricing.annual.desc')}
                </span>
              </div>
              <ForgeButton to="/support" variant="outline" size="sm">
                {t('pricing.annual.cta')}
              </ForgeButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="faq" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <ForgeSectionLabel text="FAQ" className="mb-4 block" />
          <h2 className="forge-h2 mb-2">
            {t('pricing.faq.title')}
          </h2>
          <p className="mb-8" style={{ color: 'var(--forge-text-secondary)' }}>
            {t('pricing.faq.subtitle')}
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left sidebar — tabs + CTAs */}
          <div className="lg:col-span-4">
            <Reveal delay={0.02}>
              <div className="space-y-1 mb-8" role="tablist" aria-label={t('pricing.faq.categories')}>
                {faqCategories.map((cat, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={activeTab === i}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-tab-${i}`}
                    onClick={() => setActiveTab(i)}
                    className="w-full text-left px-4 py-3 rounded-[var(--forge-radius-sm)] forge-transition-micro"
                    style={{
                      fontFamily: 'var(--forge-font-heading)',
                      fontSize: 'var(--forge-text-base)',
                      fontWeight: activeTab === i ? 600 : 400,
                      color: activeTab === i ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
                      background: activeTab === i ? 'var(--forge-bg-surface)' : 'transparent',
                      border: activeTab === i ? '1px solid var(--forge-border-active)' : '1px solid transparent',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <ForgeButton to="/register" variant="primary" fullWidth>
                  {t('pricing.faq.startFree')}
                </ForgeButton>
                <ForgeButton to="/support" variant="outline" fullWidth>
                  {t('pricing.faq.contactSupport')}
                </ForgeButton>
              </div>
            </Reveal>
          </div>

          {/* Right — FAQ accordion */}
          <div
            className="lg:col-span-8"
            role="tabpanel"
            id={`faq-panel-${activeTab}`}
            aria-labelledby={`faq-tab-${activeTab}`}
          >
            {faqCategories[activeTab] && (
              <ForgeFaqAccordion
                items={faqCategories[activeTab].items}
              />
            )}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <Reveal>
          <div
            className="p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            style={{
              background: 'var(--forge-bg-surface)',
              border: '1px solid var(--forge-accent-primary)',
              borderRadius: 'var(--forge-radius-md)',
              boxShadow: '0 0 40px rgba(0,212,170,0.08)',
            }}
          >
            <div>
              <h3
                className="forge-h3 mb-2"
                style={{ fontFamily: 'var(--forge-font-heading)' }}
              >
                {t('pricing.cta.title')}
              </h3>
              <p style={{ color: 'var(--forge-text-secondary)' }}>
                {t('pricing.cta.desc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <ForgeButton to="/support" variant="primary" size="lg">
                {t('pricing.cta.contact')}
              </ForgeButton>
              <ForgeButton to="/test-kalkulacka" variant="outline" size="lg">
                {t('pricing.cta.demo')}
              </ForgeButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer handled by shared Footer.jsx component */}
    </div>
  );
};

export default Pricing;
