import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
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
  const [activeTab, setActiveTab] = useState(0);

  const faqCategories = getFaqCategories(language);

  const plans = [
    {
      name: t('pricing.plan.starter'),
      price: language === 'cs' ? '499 Kč' : '$0',
      period: t('pricing.monthly'),
      ctaText: language === 'cs' ? 'Začít zdarma' : 'Start free',
      ctaTo: '/register',
      recommended: false,
      features: language === 'cs'
        ? [
            'Až 100 kalkulací měsíčně',
            'Základní branding (barvy, logo)',
            '1 widget na web',
            'Email podpora',
            'Uložení modelů 2 GB',
          ]
        : [
            'Up to 100 calculations / month',
            'Basic branding (colors, logo)',
            '1 widget on your site',
            'Email support',
            '2 GB model storage',
          ],
    },
    {
      name: t('pricing.plan.professional'),
      price: language === 'cs' ? '999 Kč' : '$49',
      period: t('pricing.monthly'),
      ctaText: language === 'cs' ? 'Vyzkoušet zdarma' : 'Try free',
      ctaTo: '/register',
      recommended: true,
      features: language === 'cs'
        ? [
            'Až 500 kalkulací měsíčně',
            'Plný branding + vlastní doména',
            'Neomezené widgety',
            'Pokročilé poplatky a pravidla',
            'Prioritní podpora',
            'Uložení modelů 5 GB',
          ]
        : [
            'Up to 500 calculations / month',
            'Full branding + custom domain',
            'Unlimited widgets',
            'Advanced fees & rules',
            'Priority support',
            '5 GB model storage',
          ],
    },
    {
      name: t('pricing.plan.enterprise'),
      price: null,
      period: t('pricing.custom'),
      ctaText: language === 'cs' ? 'Kontaktovat' : 'Contact',
      ctaTo: '/support',
      recommended: false,
      features: language === 'cs'
        ? [
            'Vše z Professional',
            'White-label řešení',
            'SLA a dedikovaná podpora',
            'Neomezení uživatelé',
            'Custom integrace (API / e-shop)',
            'Možnost on-premise',
          ]
        : [
            'Everything from Professional',
            'White-label solution',
            'SLA + dedicated support',
            'Unlimited users',
            'Custom integrations (API / e-shop)',
            'Optional on-premise',
          ],
    },
  ];

  const kpis = language === 'cs'
    ? [
        { value: '8s', title: 'k ceně', desc: 'Průměrně během pár sekund po nahrání modelu.' },
        { value: '60%', title: 'méně ruční práce', desc: 'Zákazník vidí cenu hned – bez e-mailů tam a zpět.' },
        { value: '24/7', title: 'automatizace', desc: 'Kalkulace běží nonstop, i když zrovna netiskneš.' },
      ]
    : [
        { value: '8s', title: 'to a quote', desc: 'Typically within seconds after upload.' },
        { value: '60%', title: 'less manual quoting', desc: 'Customers get a price instantly – no email ping-pong.' },
        { value: '24/7', title: 'automation', desc: 'Quoting runs nonstop, even when you\'re away.' },
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
            <h1 className="forge-h1 mb-4">
              {t('pricing.hero.title')}
            </h1>
            <p
              className="forge-body-lg mx-auto mb-10"
              style={{ color: 'var(--forge-text-secondary)', maxWidth: 560 }}
            >
              {t('pricing.hero.subtitle')}
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="p-5"
                  style={{
                    background: 'var(--forge-bg-surface)',
                    border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-md)',
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
            <ForgeSectionLabel text="PLANS" className="mb-4 block text-center" />
            <h2 className="forge-h2 text-center mb-4">
              {language === 'cs' ? 'Plány pro každou tiskárnu' : 'Plans for every shop'}
            </h2>
            <p
              className="text-center mb-12 mx-auto"
              style={{ color: 'var(--forge-text-secondary)', maxWidth: 480 }}
            >
              {language === 'cs'
                ? 'Začni zdarma a škáluj podle počtu kalkulací, brandingu a integrací.'
                : 'Start free and scale by usage, branding, and integrations.'}
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
                  {language === 'cs' ? 'Roční sleva + individuální pilot' : 'Annual discount + pilot options'}
                </span>
                <span style={{ color: 'var(--forge-text-secondary)', fontSize: 'var(--forge-text-sm)' }}>
                  {language === 'cs'
                    ? 'Chceš delší test nebo plán pro firmu? Napiš nám.'
                    : 'Need a longer test or a rollout plan? Contact us.'}
                </span>
              </div>
              <ForgeButton to="/support" variant="outline" size="sm">
                {language === 'cs' ? 'Kontaktovat podporu' : 'Contact support'}
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
            {language === 'cs' ? 'Často kladené otázky' : 'Frequently Asked Questions'}
          </h2>
          <p className="mb-8" style={{ color: 'var(--forge-text-secondary)' }}>
            {language === 'cs'
              ? 'Krátké odpovědi na nejčastější otázky před startem.'
              : 'Quick answers to the most common questions.'}
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left sidebar — tabs + CTAs */}
          <div className="lg:col-span-4">
            <Reveal delay={0.02}>
              <div className="space-y-1 mb-8">
                {faqCategories.map((cat, i) => (
                  <button
                    key={i}
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
                  {language === 'cs' ? 'Začít zdarma' : 'Start free'}
                </ForgeButton>
                <ForgeButton to="/support" variant="outline" fullWidth>
                  {language === 'cs' ? 'Napsat podporu' : 'Contact support'}
                </ForgeButton>
              </div>
            </Reveal>
          </div>

          {/* Right — FAQ accordion */}
          <div className="lg:col-span-8">
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
                {language === 'cs'
                  ? 'Chceš plán na míru nebo integraci do e-shopu?'
                  : 'Need a custom plan or e-shop integration?'}
              </h3>
              <p style={{ color: 'var(--forge-text-secondary)' }}>
                {language === 'cs'
                  ? 'Napiš nám, co potřebuješ – pošleme doporučení a další kroky.'
                  : 'Tell us what you need and we\'ll propose the best next steps.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <ForgeButton to="/support" variant="primary" size="lg">
                {language === 'cs' ? 'Kontaktovat' : 'Contact'}
              </ForgeButton>
              <ForgeButton to="/test-kalkulacka" variant="outline" size="lg">
                {language === 'cs' ? 'Vyzkoušet demo' : 'Try demo'}
              </ForgeButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ========== FOOTER ========== */}
      <footer
        className="py-8 text-center"
        style={{ borderTop: '1px solid var(--forge-border-default)' }}
      >
        <span
          style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: 'var(--forge-text-sm)',
            color: 'var(--forge-text-muted)',
            letterSpacing: '0.05em',
          }}
        >
          [ MODEL.PRICER ] &middot; v3.2
        </span>
        <div className="mt-3 flex justify-center gap-6">
          {[
            { label: 'HOME', to: '/' },
            { label: 'PRICING', to: '/pricing' },
            { label: 'SUPPORT', to: '/support' },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="forge-transition-micro"
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: 'var(--forge-text-xs)',
                color: 'var(--forge-text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
