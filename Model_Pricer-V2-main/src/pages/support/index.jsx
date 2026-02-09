import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../../components/marketing/Reveal';
import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle';
import ForgeButton from '../../components/ui/forge/ForgeButton';
import ForgeSectionLabel from '../../components/ui/forge/ForgeSectionLabel';
import ForgeFaqAccordion from '../../components/ui/forge/ForgeFaqAccordion';

const forgePageStyles = {
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  minHeight: '100vh',
};

const Support = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = language === 'cs' ? [
    {
      category: 'Začínáme',
      questions: [
        { q: 'Jak začít používat ModelPricer?', a: 'Stačí se zaregistrovat, nastavit ceny v admin panelu a vložit widget kód na svůj web. Celý proces zabere jen pár minut.' },
        { q: 'Potřebuji mít vlastní server nebo instalovat PrusaSlicer?', a: 'Ne. PrusaSlicer běží na našem serveru, takže nemusíš nic instalovat ani spravovat.' },
        { q: 'Jak vložím kalkulačku na svůj web?', a: 'V admin panelu v sekci "Widget Code" najdeš jednoduchý kód, který stačí zkopírovat a vložit na svůj web.' },
      ],
    },
    {
      category: 'Ceny a poplatky',
      questions: [
        { q: 'Můžu používat vlastní ceny a poplatky?', a: 'Ano. V administraci si nastavíš ceny za gram materiálu, hodinovou sazbu a jakékoliv další poplatky (montáž, lakování, energie, atd.).' },
        { q: 'Jak se počítá cena tisku?', a: 'Cena = (hmotnost × cena materiálu) + (čas tisku × hodinová sazba) + poplatky. Všechny parametry si nastavuješ sám.' },
        { q: 'Můžu mít různé ceny pro různé materiály?', a: 'Ano, můžeš nastavit vlastní cenu za gram pro každý materiál (PLA, ABS, PETG, TPU, atd.).' },
      ],
    },
    {
      category: 'Technické',
      questions: [
        { q: 'Co když je model větší než moje tiskárna?', a: 'V adminu nastavíš maximální rozměry podle své tiskárny. Systém automaticky odmítne modely, které jsou příliš velké.' },
        { q: 'Jaké formáty souborů podporujete?', a: 'Aktuálně podporujeme STL soubory. Další formáty (OBJ, 3MF) plánujeme v budoucnu.' },
        { q: 'Jak dlouho trvá slicing?', a: 'Většina modelů se slicuje do 30 sekund. Složitější modely mohou trvat až 2 minuty.' },
        { q: 'Můžu si upravit vzhled kalkulačky?', a: 'Ano, v sekci "Branding" si můžeš nastavit barvy, logo, fonty a další vizuální prvky.' },
      ],
    },
    {
      category: 'Účet a fakturace',
      questions: [
        { q: 'Můžu změnit tarif kdykoliv?', a: 'Ano, můžeš kdykoliv upgradovat nebo downgradovat svůj tarif. Změna se projeví od následujícího měsíce.' },
        { q: 'Nabízíte roční slevu?', a: 'Ano, při roční platbě získáš 20% slevu oproti měsíčnímu předplatnému.' },
        { q: 'Co když překročím limit kalkulací?', a: 'Systém tě upozorní emailem. Můžeš buď upgradovat tarif nebo dokoupit extra balíček kalkulací.' },
      ],
    },
  ] : [
    {
      category: 'Getting Started',
      questions: [
        { q: 'How do I start using ModelPricer?', a: 'Just register, set prices in the admin panel, and embed the widget code on your website. The whole process takes just a few minutes.' },
        { q: 'Do I need my own server or install PrusaSlicer?', a: 'No. PrusaSlicer runs on our server, so you don\'t need to install or manage anything.' },
        { q: 'How do I embed the calculator on my website?', a: 'In the admin panel under "Widget Code" you\'ll find simple code to copy and paste on your website.' },
      ],
    },
    {
      category: 'Pricing & Fees',
      questions: [
        { q: 'Can I use custom prices and fees?', a: 'Yes. In the admin panel you can set prices per gram of material, hourly rates, and any additional fees (assembly, painting, energy, etc.).' },
        { q: 'How is the print price calculated?', a: 'Price = (weight × material price) + (print time × hourly rate) + fees. You set all parameters yourself.' },
        { q: 'Can I have different prices for different materials?', a: 'Yes, you can set custom price per gram for each material (PLA, ABS, PETG, TPU, etc.).' },
      ],
    },
    {
      category: 'Technical',
      questions: [
        { q: 'What if the model is larger than my printer?', a: 'In the admin panel you set maximum dimensions based on your printer. The system automatically rejects models that are too large.' },
        { q: 'What file formats do you support?', a: 'We currently support STL files. Additional formats (OBJ, 3MF) are planned for the future.' },
        { q: 'How long does slicing take?', a: 'Most models slice within 30 seconds. More complex models may take up to 2 minutes.' },
        { q: 'Can I customize the calculator appearance?', a: 'Yes, in the "Branding" section you can set colors, logo, fonts, and other visual elements.' },
      ],
    },
    {
      category: 'Account & Billing',
      questions: [
        { q: 'Can I change my plan anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect from the next month.' },
        { q: 'Do you offer annual discounts?', a: 'Yes, you get 20% off with annual payment compared to monthly subscription.' },
        { q: 'What if I exceed the calculation limit?', a: 'The system will notify you by email. You can either upgrade your plan or purchase an extra calculation package.' },
      ],
    },
  ];

  const quickLinks = language === 'cs' ? [
    { icon: 'book', title: 'Dokumentace', desc: 'Kompletní návody a tutoriály' },
    { icon: 'video', title: 'Video návody', desc: 'Krok za krokem videa' },
    { icon: 'chat', title: 'Live Chat', desc: 'Okamžitá podpora online' },
    { icon: 'mail', title: 'Email podpora', desc: 'support@modelpricer.com' },
  ] : [
    { icon: 'book', title: 'Documentation', desc: 'Complete guides and tutorials' },
    { icon: 'video', title: 'Video Tutorials', desc: 'Step-by-step videos' },
    { icon: 'chat', title: 'Live Chat', desc: 'Instant online support' },
    { icon: 'mail', title: 'Email Support', desc: 'support@modelpricer.com' },
  ];

  const icons = {
    book: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5a2 2 0 012-2h5l3 3 3-3h5a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
        <path d="M14 6v17" />
      </svg>
    ),
    video: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="16" height="18" rx="2" />
        <path d="M19 10l6-3v14l-6-3" />
      </svg>
    ),
    chat: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h20v16H10l-6 4V4z" />
        <path d="M10 10h8M10 14h5" />
      </svg>
    ),
    mail: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="22" height="18" rx="2" />
        <path d="M3 7l11 8 11-8" />
      </svg>
    ),
  };

  // Filter FAQs by search query
  const filteredFaqs = searchQuery.trim()
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.questions.length > 0)
    : faqs;

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
              <span className="relative inline-block">
                {t('support.hero.title')}
                <ForgeSquiggle className="absolute -bottom-2 left-0 w-full h-3" />
              </span>
            </h1>
            <p
              className="forge-body-lg mx-auto mb-10"
              style={{ color: 'var(--forge-text-secondary)', maxWidth: 560 }}
            >
              {t('support.hero.subtitle')}
            </p>
          </Reveal>

          {/* Search */}
          <Reveal delay={0.05}>
            <div
              className="max-w-xl mx-auto flex items-center gap-3 px-5 py-3"
              style={{
                background: 'var(--forge-bg-surface)',
                border: '1px solid var(--forge-border-active)',
                borderRadius: 'var(--forge-radius-sm)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--forge-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="9" r="6" />
                <path d="M15 15l4 4" />
              </svg>
              <input
                type="text"
                placeholder={t('support.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none"
                style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: 'var(--forge-text-base)',
                  color: 'var(--forge-text-primary)',
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== QUICK LINKS ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <Reveal>
          <ForgeSectionLabel text="RESOURCES" className="mb-8 block" />
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickLinks.map((link, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div
                className="forge-card-interactive group p-6 text-center h-full"
              >
                <div className="mb-4 inline-flex" style={{ color: 'var(--forge-accent-primary)' }}>
                  {icons[link.icon]}
                </div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: 'var(--forge-font-heading)',
                    fontSize: 'var(--forge-text-lg)',
                    fontWeight: 600,
                    color: 'var(--forge-text-primary)',
                  }}
                >
                  {link.title}
                </h3>
                <p style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                  {link.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section
        className="py-16 lg:py-20"
        style={{ borderTop: '1px solid var(--forge-border-default)' }}
      >
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Reveal>
            <ForgeSectionLabel text="FAQ" className="mb-4 block" />
            <h2 className="forge-h2 mb-10">
              {language === 'cs' ? 'Často kladené otázky' : 'Frequently Asked Questions'}
            </h2>
          </Reveal>

          {filteredFaqs.length === 0 ? (
            <p style={{ color: 'var(--forge-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              {language === 'cs' ? 'Žádné výsledky pro hledaný výraz.' : 'No results found for your search.'}
            </p>
          ) : (
            filteredFaqs.map((category, i) => (
              <Reveal key={i} delay={i * 0.03}>
                <div className="mb-10">
                  <h3
                    className="mb-4"
                    style={{
                      fontFamily: 'var(--forge-font-heading)',
                      fontSize: 'var(--forge-text-xl)',
                      fontWeight: 600,
                      color: 'var(--forge-accent-primary)',
                    }}
                  >
                    {category.category}
                  </h3>
                  <ForgeFaqAccordion items={category.questions} />
                </div>
              </Reveal>
            ))
          )}
        </div>
      </section>

      {/* ========== CONTACT ========== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <Reveal>
          <div
            className="max-w-2xl mx-auto p-8 sm:p-10 text-center"
            style={{
              background: 'var(--forge-bg-surface)',
              border: '1px solid var(--forge-accent-primary)',
              borderRadius: 'var(--forge-radius-md)',
              boxShadow: '0 0 40px rgba(0,212,170,0.08)',
            }}
          >
            <h2
              className="forge-h3 mb-3"
              style={{ fontFamily: 'var(--forge-font-heading)' }}
            >
              {t('support.contact.title')}
            </h2>
            <p className="mb-8" style={{ color: 'var(--forge-text-secondary)' }}>
              {t('support.contact.subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="p-5 flex items-center gap-4 text-left"
                style={{
                  background: 'var(--forge-bg-elevated)',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm)',
                }}
              >
                <div style={{ color: 'var(--forge-accent-primary)' }}>
                  {icons.mail}
                </div>
                <div>
                  <strong
                    className="block mb-1"
                    style={{
                      fontFamily: 'var(--forge-font-heading)',
                      color: 'var(--forge-text-primary)',
                    }}
                  >
                    Email
                  </strong>
                  <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                    support@modelpricer.com
                  </span>
                </div>
              </div>

              <div
                className="p-5 flex items-center gap-4 text-left"
                style={{
                  background: 'var(--forge-bg-elevated)',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm)',
                }}
              >
                <div style={{ color: 'var(--forge-accent-primary)' }}>
                  {icons.chat}
                </div>
                <div>
                  <strong
                    className="block mb-1"
                    style={{
                      fontFamily: 'var(--forge-font-heading)',
                      color: 'var(--forge-text-primary)',
                    }}
                  >
                    Live Chat
                  </strong>
                  <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                    {language === 'cs' ? 'Po-Pá 9:00-17:00' : 'Mon-Fri 9:00-17:00'}
                  </span>
                </div>
              </div>
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

export default Support;
