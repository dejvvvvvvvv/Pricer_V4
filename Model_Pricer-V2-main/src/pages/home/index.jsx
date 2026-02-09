import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/ui/Button';
import Reveal from '../../components/marketing/Reveal';
import ForgeStatusIndicator from '../../components/ui/forge/ForgeStatusIndicator';
import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle';
import ForgePrinterSVG from '../../components/ui/forge/ForgePrinterSVG';
import ForgeNumberedCard from '../../components/ui/forge/ForgeNumberedCard';

const Home = () => {
  const { t } = useLanguage();

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
      cta: t('home.hero.cta.secondary'),
      recommended: false,
      features: [
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
      ],
    },
    {
      name: 'PRO',
      price: '$49',
      cta: 'Recommended',
      recommended: true,
      features: [
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
      ],
    },
    {
      name: 'ENTERPRISE',
      price: '$199',
      cta: 'Kontaktujte',
      recommended: false,
      features: [
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
        'IBM Plex Sans 14px',
      ],
    },
  ];

  const faqItems = [
    { q: t('home.faq.q1'), a: t('home.faq.a1') },
    { q: t('home.faq.q2'), a: t('home.faq.a2') },
    { q: t('home.faq.q3'), a: t('home.faq.a3') },
  ];

  return (
    <div
      className="forge-grain"
      style={{
        backgroundColor: 'var(--forge-bg-void)',
        color: 'var(--forge-text-primary)',
        fontFamily: 'var(--forge-font-body)',
        minHeight: '100vh',
      }}
    >
      {/* ========== HERO ========== */}
      <section
        className="relative overflow-hidden forge-grid-bg"
        style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}
      >
        {/* Glow effect behind printer */}
        <div
          className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[500px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center py-16 lg:py-0">
          {/* LEFT — Text content (LEFT-ALIGNED) */}
          <Reveal>
            <div className="relative z-10">
              {/* Status badge */}
              <ForgeStatusIndicator status="printing" className="mb-6" />

              {/* Headline — Space Grotesk 700 */}
              <h1 className="forge-h1" style={{ maxWidth: 540 }}>
                Precision Pricing for{' '}
                <br className="hidden sm:block" />
                3D{' '}
                <span className="relative inline-block">
                  Manufacturing.
                  <ForgeSquiggle className="absolute -bottom-2 left-0 w-full h-3" />
                </span>
              </h1>

              {/* Subheadline — IBM Plex Sans 400 */}
              <p
                className="forge-body-lg mt-6"
                style={{ color: 'var(--forge-text-secondary)', maxWidth: 480 }}
              >
                Automated quoting for FDM, SLA, and SLS print farms.
                Upload models, configure parameters, get instant pricing.
              </p>

              {/* CTA cluster */}
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center h-12 px-7 text-base font-semibold rounded-[var(--forge-radius-sm)] forge-transition-micro"
                  style={{
                    backgroundColor: 'var(--forge-accent-primary)',
                    color: '#08090C',
                    fontFamily: 'var(--forge-font-heading)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-h)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--forge-shadow-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Start Building
                </Link>
                <Link
                  to="/test-kalkulacka"
                  className="inline-flex items-center justify-center h-12 px-7 text-base font-medium rounded-[var(--forge-radius-sm)] forge-transition-micro"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--forge-text-secondary)',
                    border: '1px solid var(--forge-border-active)',
                    fontFamily: 'var(--forge-font-heading)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                    e.currentTarget.style.color = 'var(--forge-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--forge-text-secondary)';
                  }}
                >
                  See Demo
                </Link>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — Animated 3D Printer SVG */}
          <Reveal delay={0.1}>
            <div className="relative z-10 hidden lg:flex justify-center">
              <ForgePrinterSVG />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== TRUST STRIP / SOCIAL PROOF MARQUEE ========== */}
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

      {/* ========== CAPABILITIES — Numbered Feature Cards ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <div className="mb-10">
            <span
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: 'var(--forge-text-xs)',
                letterSpacing: '0.1em',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              CAPABILITIES
            </span>
          </div>
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
              title="Precision Pricing Engine"
              description="Volume-based calculations to aviation 3D-printing and volume its own hanovation, receipt-style breakdowns inv volume-based calculations and receipt-style breakdowns."
              className="md:row-span-2 h-full"
            />
          </Reveal>

          <Reveal delay={0.06}>
            <ForgeNumberedCard
              number="02"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="20" height="4" rx="1" />
                  <rect x="6" y="14" width="20" height="4" rx="1" />
                  <rect x="6" y="22" width="20" height="4" rx="1" />
                </svg>
              }
              title="Printing layers"
              description="Printing require models to upload models invvasanute eatoms in 3D-printing carriers."
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
              title="Spool for filament"
              description="Spool 3D-printing themed SVG filament enquires 3D-printing filament."
            />
          </Reveal>
        </div>
      </section>

      {/* ========== PRICING PLANS ========== */}
      <section className="forge-skewed-bg py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <h2
              className="forge-h2 text-center mb-12"
              style={{ fontFamily: 'var(--forge-font-heading)' }}
            >
              Pricing Plans
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.05}>
                <div
                  className="relative p-6 h-full flex flex-col"
                  style={{
                    background: 'var(--forge-bg-surface)',
                    border: plan.recommended
                      ? '1px solid var(--forge-accent-primary)'
                      : '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-md)',
                    ...(plan.recommended ? { boxShadow: '0 0 30px rgba(0,212,170,0.1)' } : {}),
                  }}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold"
                      style={{
                        background: 'var(--forge-accent-primary)',
                        color: '#08090C',
                        fontFamily: 'var(--forge-font-heading)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Recommended
                    </div>
                  )}

                  {/* Plan name */}
                  <span className="forge-label">{plan.name}</span>

                  {/* Price */}
                  <div className="mt-4 mb-6">
                    <span
                      className="forge-mono-bold"
                      style={{ fontSize: 'var(--forge-text-3xl)', color: 'var(--forge-text-primary)' }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="ml-2"
                      style={{
                        fontFamily: 'var(--forge-font-tech)',
                        fontSize: 'var(--forge-text-sm)',
                        color: 'var(--forge-text-muted)',
                      }}
                    >
                      per month
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-center gap-2"
                        style={{
                          fontFamily: 'var(--forge-font-body)',
                          fontSize: 'var(--forge-text-base)',
                          color: 'var(--forge-text-secondary)',
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="shrink-0"
                        >
                          <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke="var(--forge-accent-primary)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="mt-8">
                    <Link
                      to={plan.recommended ? '/register' : '/test-kalkulacka'}
                      className="w-full inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-[var(--forge-radius-sm)] forge-transition-micro"
                      style={plan.recommended ? {
                        backgroundColor: 'var(--forge-accent-primary)',
                        color: '#08090C',
                        fontFamily: 'var(--forge-font-heading)',
                      } : {
                        backgroundColor: 'transparent',
                        color: 'var(--forge-text-secondary)',
                        border: '1px solid var(--forge-border-active)',
                        fontFamily: 'var(--forge-font-heading)',
                      }}
                      onMouseEnter={(e) => {
                        if (plan.recommended) {
                          e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-h)';
                        } else {
                          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                          e.currentTarget.style.color = 'var(--forge-text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (plan.recommended) {
                          e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary)';
                        } else {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--forge-text-secondary)';
                        }
                      }}
                    >
                      {plan.recommended ? plan.cta : 'See Demo'}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <div className="max-w-2xl mx-auto">
            <h2 className="forge-h2 text-center mb-12">FAQ</h2>

            <div className="space-y-0">
              {faqItems.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 forge-transition-micro"
                style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: 'var(--forge-text-base)',
                  color: 'var(--forge-text-muted)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-accent-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 10V8M8 6h.01" />
                </svg>
                Support
              </Link>
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
          {['UPPERCASE', 'PRICING', 'SUPPORT'].map((label) => (
            <span
              key={label}
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: 'var(--forge-text-xs)',
                color: 'var(--forge-text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

/* ========== FAQ ITEM (internal component) ========== */
function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--forge-border-default)' }}>
      <button
        className="w-full flex items-center justify-between py-5 text-left forge-transition-micro group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span
          style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: 'var(--forge-text-lg)',
            fontWeight: 500,
            color: 'var(--forge-text-primary)',
          }}
        >
          {question}
        </span>
        <span
          className="shrink-0 ml-4 forge-transition-micro"
          style={{
            fontFamily: 'var(--forge-font-mono)',
            fontSize: 'var(--forge-text-lg)',
            color: 'var(--forge-accent-primary)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </span>
      </button>
      {isOpen && (
        <div
          className="pb-5"
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: 'var(--forge-text-base)',
            color: 'var(--forge-text-secondary)',
            lineHeight: '1.6',
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}

export default Home;
