import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../../components/marketing/Reveal';
import ForgeStatusIndicator from '../../components/ui/forge/ForgeStatusIndicator';
import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle';
import ForgePrinterSVG from '../../components/ui/forge/ForgePrinterSVG';
import ForgeNumberedCard from '../../components/ui/forge/ForgeNumberedCard';
import ForgeButton from '../../components/ui/forge/ForgeButton';
import ForgeSectionLabel from '../../components/ui/forge/ForgeSectionLabel';
import ForgePricingCard from '../../components/ui/forge/ForgePricingCard';
import ForgeFaqAccordion from '../../components/ui/forge/ForgeFaqAccordion';

const forgePageStyles = {
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  minHeight: '100vh',
};

const Home = () => {
  const { t, language } = useLanguage();

  const trustItems = [
    'PrusaSlicer CLI',
    'White-label widget',
    'Multi-tenant',
    'Fees & Markup',
    'Presets (.ini)',
    'Limits (X/Y/Z)',
    'WooCommerce',
    'Shopify',
    'Shoptet',
    'API ready',
  ];

  const plans = [
    {
      name: 'STARTER',
      price: '$0',
      period: t('home.forge.plans.period'),
      ctaText: t('home.hero.cta.secondary'),
      ctaTo: '/test-kalkulacka',
      recommended: false,
      features: [
        t('home.forge.plans.starter.f1'),
        t('home.forge.plans.starter.f2'),
        t('home.forge.plans.starter.f3'),
      ],
    },
    {
      name: 'PRO',
      price: '$49',
      period: t('home.forge.plans.period'),
      ctaText: t('home.forge.plans.pro.cta'),
      ctaTo: '/register',
      recommended: true,
      features: [
        t('home.forge.plans.pro.f1'),
        t('home.forge.plans.pro.f2'),
        t('home.forge.plans.pro.f3'),
        t('home.forge.plans.pro.f4'),
      ],
    },
    {
      name: 'ENTERPRISE',
      price: '$199',
      period: t('home.forge.plans.period'),
      ctaText: t('home.forge.plans.enterprise.cta'),
      ctaTo: '/support',
      recommended: false,
      features: [
        t('home.forge.plans.enterprise.f1'),
        t('home.forge.plans.enterprise.f2'),
        t('home.forge.plans.enterprise.f3'),
        t('home.forge.plans.enterprise.f4'),
      ],
    },
  ];

  const faqItems = [
    { question: t('home.faq.q1'), answer: t('home.faq.a1') },
    { question: t('home.faq.q2'), answer: t('home.faq.a2') },
    { question: t('home.faq.q3'), answer: t('home.faq.a3') },
  ];

  const howItWorksSteps = [
    {
      number: '01',
      title: t('home.howItWorks.step1.title'),
      desc: t('home.howItWorks.step1.desc'),
    },
    {
      number: '02',
      title: t('home.howItWorks.step2.title'),
      desc: t('home.howItWorks.step2.desc'),
    },
    {
      number: '03',
      title: t('home.howItWorks.step3.title'),
      desc: t('home.howItWorks.step3.desc'),
    },
    {
      number: '04',
      title: t('home.howItWorks.step4.title'),
      desc: t('home.howItWorks.step4.desc'),
    },
  ];

  return (
    <div className="forge-grain" style={forgePageStyles}>
      {/* ========== HERO (UNTOUCHED) ========== */}
      <section
        className="relative overflow-hidden forge-grid-bg"
        style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}
      >
        <div
          className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[500px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center py-16 lg:py-0">
          <Reveal>
            <div className="relative z-10">
              <ForgeStatusIndicator status="printing" className="mb-6" />

              <h1 className="forge-h1" style={{ maxWidth: 540 }}>
                Precision Pricing for{' '}
                <br className="hidden sm:block" />
                3D{' '}
                <span className="relative inline-block">
                  Manufacturing.
                  <ForgeSquiggle className="absolute -bottom-2 left-0 w-full h-3" />
                </span>
              </h1>

              <p
                className="forge-body-lg mt-6"
                style={{ color: 'var(--forge-text-secondary)', maxWidth: 480 }}
              >
                Automated quoting for FDM, SLA, and SLS print farms.
                Upload models, configure parameters, get instant pricing.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <ForgeButton to="/register" variant="primary" size="lg">
                  Start Building
                </ForgeButton>
                <ForgeButton to="/test-kalkulacka" variant="outline" size="lg">
                  See Demo
                </ForgeButton>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative z-10 hidden lg:flex justify-center">
              <ForgePrinterSVG />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== TRUST STRIP ========== */}
      <section
        className="overflow-hidden py-5"
        style={{ borderTop: '1px solid var(--forge-border-default)', borderBottom: '1px solid var(--forge-border-default)' }}
      >
        <div className="flex items-center">
          <span
            className="whitespace-nowrap px-8 shrink-0"
            style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: 'var(--forge-text-sm)',
              color: 'var(--forge-text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            Trusted by 120+ print farms
          </span>
          <div className="flex forge-marquee whitespace-nowrap">
            {[...trustItems, ...trustItems].map((item, i) => (
              <span
                key={i}
                className="mx-8 shrink-0 forge-transition-micro"
                style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: 'var(--forge-text-sm)',
                  color: 'var(--forge-text-muted)',
                  opacity: 0.4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.7; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.4; }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHAT WE DO — About Section ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <ForgeSectionLabel text="ABOUT" className="mb-4 block" />
          <h2 className="forge-h2 mb-10">{t('home.whatWeDo.title')}</h2>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16">
          <Reveal delay={0.02}>
            <div>
              <p className="forge-body-lg mb-6" style={{ color: 'var(--forge-text-secondary)', lineHeight: '1.7' }}>
                {t('home.whatWeDo.p1')}
              </p>
              <p className="forge-body mb-6" style={{ color: 'var(--forge-text-secondary)', lineHeight: '1.7' }}>
                {t('home.whatWeDo.p2')}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-4">
              {[
                { value: '8s', label: t('home.whatWeDo.stat1') },
                { value: '60%', label: t('home.whatWeDo.stat2') },
                { value: '24/7', label: t('home.whatWeDo.stat3') },
              ].map((stat, i) => (
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
                    {stat.value}
                  </span>
                  <span style={{ color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-body)' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section
        className="py-20 lg:py-24"
        style={{ borderTop: '1px solid var(--forge-border-default)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <ForgeSectionLabel text="PROCESS" className="mb-4 block" />
            <h2 className="forge-h2 mb-12">
              <span className="relative inline-block">
                {t('home.howItWorks.title')}
                <ForgeSquiggle className="absolute -bottom-2 left-0 w-full h-3" />
              </span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorksSteps.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.04}>
                <ForgeNumberedCard
                  number={step.number}
                  title={step.title}
                  description={step.desc}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CAPABILITIES — Numbered Feature Cards ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <ForgeSectionLabel text="CAPABILITIES" className="mb-10 block" />
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
          <Reveal delay={0.02}>
            <ForgeNumberedCard
              number="01"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="24" height="24" rx="2" />
                  <path d="M4 16h24M16 4v24" />
                  <circle cx="16" cy="16" r="3" />
                </svg>
              }
              title={t('home.forge.feature1.title')}
              description={t('home.forge.feature1.desc')}
              className="md:row-span-2 h-full"
            />
          </Reveal>

          <Reveal delay={0.06}>
            <ForgeNumberedCard
              number="02"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4l4 8h8l-6 5 2 9-8-5-8 5 2-9-6-5h8z" />
                </svg>
              }
              title={t('home.forge.feature2.title')}
              description={t('home.forge.feature2.desc')}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <ForgeNumberedCard
              number="03"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="16" cy="16" r="10" />
                  <circle cx="16" cy="16" r="4" />
                  <path d="M16 6v4M16 22v4M6 16h4M22 16h4" />
                </svg>
              }
              title={t('home.forge.feature3.title')}
              description={t('home.forge.feature3.desc')}
            />
          </Reveal>
        </div>
      </section>

      {/* ========== PRICING PLANS ========== */}
      <section className="forge-skewed-bg py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <ForgeSectionLabel text="PLANS" className="mb-4 block text-center" />
            <h2 className="forge-h2 text-center mb-12">
              {t('home.forge.plans.title')}
            </h2>
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
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <ForgeSectionLabel text="FAQ" className="mb-4 block text-center" />
            <h2 className="forge-h2 text-center mb-12">{t('home.faq.title')}</h2>

            <ForgeFaqAccordion items={faqItems} />

            <div className="mt-8 text-center">
              <ForgeButton to="/support" variant="ghost">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 10V8M8 6h.01" />
                </svg>
                {t('home.faq.more')}
              </ForgeButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ========== FOOTER BRANDING ========== */}
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

export default Home;
