import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import Reveal from '../../components/marketing/Reveal';
import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle';
import ForgeButton from '../../components/ui/forge/ForgeButton';
import ForgeSectionLabel from '../../components/ui/forge/ForgeSectionLabel';
import ForgeFaqAccordion from '../../components/ui/forge/ForgeFaqAccordion';

// ─── Styles ──────────────────────────────────────────
const forgePageStyles = {
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  minHeight: '100vh',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontFamily: 'var(--forge-font-body)',
  fontSize: 'var(--forge-text-base)',
  color: 'var(--forge-text-primary)',
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-active)',
  borderRadius: 'var(--forge-radius-sm)',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--forge-font-heading)',
  fontSize: 'var(--forge-text-sm)',
  fontWeight: 500,
  color: 'var(--forge-text-secondary)',
};

const sectionNavStyle = {
  position: 'sticky',
  top: 80,
  alignSelf: 'start',
};

// ─── SVG Icons ───────────────────────────────────────
const icons = {
  search: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--forge-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="6" />
      <path d="M15 15l4 4" />
    </svg>
  ),
  faq: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  ),
  guide: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  ),
  video: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 9l4-2v10l-4-2" />
    </svg>
  ),
  contact: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  ),
  system: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  troubleshoot: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  mail: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="22" height="18" rx="2" />
      <path d="M3 7l11 8 11-8" />
    </svg>
  ),
  chat: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h20v16H10l-6 4V4z" />
      <path d="M10 10h8M10 14h5" />
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
      <path d="M10 3v11M6 7l4-4 4 4" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1v2M10 17v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1 10h2M17 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
    </svg>
  ),
  widget: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l-3 3 3 3" />
      <path d="M15 3l3 3-3 3" />
      <path d="M12 2l-4 16" />
    </svg>
  ),
  orders: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M6 7h8M6 10h5" />
    </svg>
  ),
  branding: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <circle cx="13" cy="9" r="1.5" fill="currentColor" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),
  express: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4 14h5l-1 6 9-12h-5l1-6z" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--forge-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3 3 7-7" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L1 18h18L10 2z" />
      <path d="M10 8v4M10 14.5h.01" />
    </svg>
  ),
  play: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 12l12 8-12 8V12z" fill="currentColor" opacity="0.7" />
    </svg>
  ),
};

// ─── Section nav items ───────────────────────────────
const SECTIONS = [
  { id: 'faq', icon: icons.faq, key: 'support.nav.faq' },
  { id: 'guides', icon: icons.guide, key: 'support.nav.guides' },
  { id: 'videos', icon: icons.video, key: 'support.nav.videos' },
  { id: 'contact', icon: icons.contact, key: 'support.nav.contact' },
  { id: 'system-req', icon: icons.system, key: 'support.nav.systemReq' },
  { id: 'troubleshooting', icon: icons.troubleshoot, key: 'support.nav.troubleshooting' },
];

// ─── Main Component ──────────────────────────────────
const Support = () => {
  const { t } = useLanguage();
  useDocumentTitle(t('support.hero.title'));

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('faq');
  const [openGuides, setOpenGuides] = useState({});
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'technical', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const sectionRefs = useRef({});

  // Intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const toggleGuide = useCallback((idx) => {
    setOpenGuides((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // ─── FAQ Data ───────────────────────────────────
  const faqCategories = [
    {
      key: 'getting-started',
      label: t('support.faq.cat.gettingStarted'),
      questions: [
        { q: t('support.faq.gs.q1'), a: t('support.faq.gs.a1') },
        { q: t('support.faq.gs.q2'), a: t('support.faq.gs.a2') },
        { q: t('support.faq.gs.q3'), a: t('support.faq.gs.a3') },
      ],
    },
    {
      key: 'models',
      label: t('support.faq.cat.models'),
      questions: [
        { q: t('support.faq.mod.q1'), a: t('support.faq.mod.a1') },
        { q: t('support.faq.mod.q2'), a: t('support.faq.mod.a2') },
        { q: t('support.faq.mod.q3'), a: t('support.faq.mod.a3') },
      ],
    },
    {
      key: 'pricing',
      label: t('support.faq.cat.pricing'),
      questions: [
        { q: t('support.faq.price.q1'), a: t('support.faq.price.a1') },
        { q: t('support.faq.price.q2'), a: t('support.faq.price.a2') },
        { q: t('support.faq.price.q3'), a: t('support.faq.price.a3') },
      ],
    },
    {
      key: 'orders',
      label: t('support.faq.cat.orders'),
      questions: [
        { q: t('support.faq.ord.q1'), a: t('support.faq.ord.a1') },
        { q: t('support.faq.ord.q2'), a: t('support.faq.ord.a2') },
      ],
    },
    {
      key: 'billing',
      label: t('support.faq.cat.billing'),
      questions: [
        { q: t('support.faq.bill.q1'), a: t('support.faq.bill.a1') },
        { q: t('support.faq.bill.q2'), a: t('support.faq.bill.a2') },
        { q: t('support.faq.bill.q3'), a: t('support.faq.bill.a3') },
      ],
    },
    {
      key: 'widget',
      label: t('support.faq.cat.widget'),
      questions: [
        { q: t('support.faq.wid.q1'), a: t('support.faq.wid.a1') },
        { q: t('support.faq.wid.q2'), a: t('support.faq.wid.a2') },
      ],
    },
    {
      key: 'account',
      label: t('support.faq.cat.account'),
      questions: [
        { q: t('support.faq.acc.q1'), a: t('support.faq.acc.a1') },
        { q: t('support.faq.acc.q2'), a: t('support.faq.acc.a2') },
      ],
    },
  ];

  // Filter FAQs
  const filteredFaqs = searchQuery.trim()
    ? faqCategories
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : faqCategories;

  // ─── Guides Data ────────────────────────────────
  const guides = [
    {
      title: t('support.guide.1.title'),
      icon: icons.upload,
      steps: [
        t('support.guide.1.s1'),
        t('support.guide.1.s2'),
        t('support.guide.1.s3'),
        t('support.guide.1.s4'),
        t('support.guide.1.s5'),
      ],
    },
    {
      title: t('support.guide.2.title'),
      icon: icons.settings,
      steps: [
        t('support.guide.2.s1'),
        t('support.guide.2.s2'),
        t('support.guide.2.s3'),
        t('support.guide.2.s4'),
        t('support.guide.2.s5'),
      ],
    },
    {
      title: t('support.guide.3.title'),
      icon: icons.widget,
      steps: [
        t('support.guide.3.s1'),
        t('support.guide.3.s2'),
        t('support.guide.3.s3'),
        t('support.guide.3.s4'),
      ],
    },
    {
      title: t('support.guide.4.title'),
      icon: icons.orders,
      steps: [
        t('support.guide.4.s1'),
        t('support.guide.4.s2'),
        t('support.guide.4.s3'),
        t('support.guide.4.s4'),
        t('support.guide.4.s5'),
      ],
    },
    {
      title: t('support.guide.5.title'),
      icon: icons.branding,
      steps: [
        t('support.guide.5.s1'),
        t('support.guide.5.s2'),
        t('support.guide.5.s3'),
        t('support.guide.5.s4'),
      ],
    },
    {
      title: t('support.guide.6.title'),
      icon: icons.express,
      steps: [
        t('support.guide.6.s1'),
        t('support.guide.6.s2'),
        t('support.guide.6.s3'),
        t('support.guide.6.s4'),
      ],
    },
  ];

  // ─── Video Categories ──────────────────────────
  const videoCategories = [
    {
      label: t('support.video.cat.start'),
      items: [
        { title: t('support.video.1.title'), duration: '3:45' },
        { title: t('support.video.2.title'), duration: '5:12' },
      ],
    },
    {
      label: t('support.video.cat.admin'),
      items: [
        { title: t('support.video.3.title'), duration: '7:30' },
        { title: t('support.video.4.title'), duration: '4:55' },
      ],
    },
    {
      label: t('support.video.cat.eshop'),
      items: [
        { title: t('support.video.5.title'), duration: '6:20' },
        { title: t('support.video.6.title'), duration: '8:15' },
      ],
    },
  ];

  // ─── System Requirements ───────────────────────
  const systemRequirements = [
    {
      title: t('support.sysreq.browsers.title'),
      items: [
        'Google Chrome 90+',
        'Mozilla Firefox 90+',
        'Microsoft Edge 90+',
        'Safari 15+',
        'Opera 80+',
      ],
    },
    {
      title: t('support.sysreq.formats.title'),
      items: ['STL (.stl)', '3MF (.3mf)', 'OBJ (.obj)'],
    },
    {
      title: t('support.sysreq.recommended.title'),
      items: [
        t('support.sysreq.recommended.i1'),
        t('support.sysreq.recommended.i2'),
        t('support.sysreq.recommended.i3'),
        t('support.sysreq.recommended.i4'),
      ],
    },
  ];

  // ─── Troubleshooting ──────────────────────────
  const troubleshootItems = [
    {
      title: t('support.trouble.1.title'),
      steps: [
        t('support.trouble.1.s1'),
        t('support.trouble.1.s2'),
        t('support.trouble.1.s3'),
        t('support.trouble.1.s4'),
      ],
    },
    {
      title: t('support.trouble.2.title'),
      steps: [
        t('support.trouble.2.s1'),
        t('support.trouble.2.s2'),
        t('support.trouble.2.s3'),
      ],
    },
    {
      title: t('support.trouble.3.title'),
      steps: [
        t('support.trouble.3.s1'),
        t('support.trouble.3.s2'),
        t('support.trouble.3.s3'),
        t('support.trouble.3.s4'),
      ],
    },
  ];

  // ─── Contact form logic ────────────────────────
  const subjectOptions = [
    { value: 'technical', label: t('support.contact.subjectOpt.technical') },
    { value: 'pricing', label: t('support.contact.subjectOpt.pricing') },
    { value: 'suggestion', label: t('support.contact.subjectOpt.suggestion') },
    { value: 'other', label: t('support.contact.subjectOpt.other') },
  ];

  const validateForm = () => {
    const errs = {};
    if (!contactForm.name.trim()) errs.name = t('support.contact.err.name');
    if (!contactForm.email.trim()) {
      errs.email = t('support.contact.err.emailReq');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errs.email = t('support.contact.err.emailInvalid');
    }
    if (!contactForm.message.trim()) errs.message = t('support.contact.err.message');
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { name, email, subject, message } = contactForm;
    const subjectLabel = subjectOptions.find((o) => o.value === subject)?.label || subject;
    const body = `${t('support.contact.name')}: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoUrl = `mailto:support@modelpricer.com?subject=${encodeURIComponent(subjectLabel)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailtoUrl;
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', subject: 'technical', message: '' });
      setFormErrors({});
    } catch {
      setSubmitStatus('error');
    }
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
  };
  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = 'var(--forge-border-active)';
  };

  // ─── Render ────────────────────────────────────
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
              {icons.search}
              <input
                type="search"
                placeholder={t('support.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('support.search.placeholder')}
                className="flex-1 bg-transparent border-none outline-none"
                style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: 'var(--forge-text-base)',
                  color: 'var(--forge-text-primary)',
                }}
              />
            </div>
          </Reveal>

          {/* Quick section links (mobile) */}
          <Reveal delay={0.08}>
            <div className="flex flex-wrap justify-center gap-3 mt-8 lg:hidden">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="flex items-center gap-2 px-4 py-2 forge-transition-micro"
                  style={{
                    background: 'var(--forge-bg-surface)',
                    border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-sm)',
                    color: 'var(--forge-text-secondary)',
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: 'var(--forge-text-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sec.icon}
                  </span>
                  {t(sec.key)}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== MAIN CONTENT WITH SIDEBAR ========== */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
          {/* ─── Sidebar Navigation (desktop) ─── */}
          <aside className="hidden lg:block" style={sectionNavStyle}>
            <nav aria-label={t('support.nav.ariaLabel')}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SECTIONS.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <li key={sec.id}>
                      <button
                        onClick={() => scrollToSection(sec.id)}
                        className="forge-transition-micro"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '10px 14px',
                          background: isActive ? 'var(--forge-bg-surface)' : 'transparent',
                          border: 'none',
                          borderLeft: isActive
                            ? '3px solid var(--forge-accent-primary)'
                            : '3px solid transparent',
                          borderRadius: '0 var(--forge-radius-sm) var(--forge-radius-sm) 0',
                          color: isActive ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
                          fontFamily: 'var(--forge-font-body)',
                          fontSize: 'var(--forge-text-sm)',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sec.icon}
                        </span>
                        {t(sec.key)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* ─── Main Content ─── */}
          <main>
            {/* ========== FAQ SECTION ========== */}
            <section
              id="faq"
              ref={(el) => { sectionRefs.current['faq'] = el; }}
              style={{ scrollMarginTop: 80 }}
            >
              <Reveal>
                <ForgeSectionLabel text="FAQ" className="mb-4 block" />
                <h2 className="forge-h2 mb-8">{t('support.faq.title')}</h2>
              </Reveal>

              {filteredFaqs.length === 0 ? (
                <p
                  style={{
                    color: 'var(--forge-text-muted)',
                    textAlign: 'center',
                    padding: '2rem 0',
                  }}
                >
                  {t('support.faq.noResults')}
                </p>
              ) : (
                filteredFaqs.map((category, i) => (
                  <Reveal key={category.key} delay={i * 0.03}>
                    <div className="mb-8">
                      <h3
                        className="mb-3"
                        style={{
                          fontFamily: 'var(--forge-font-heading)',
                          fontSize: 'var(--forge-text-lg)',
                          fontWeight: 600,
                          color: 'var(--forge-accent-primary)',
                        }}
                      >
                        {category.label}
                      </h3>
                      <ForgeFaqAccordion items={category.questions} />
                    </div>
                  </Reveal>
                ))
              )}
            </section>

            {/* ========== GUIDES SECTION ========== */}
            <section
              id="guides"
              ref={(el) => { sectionRefs.current['guides'] = el; }}
              className="pt-16"
              style={{ scrollMarginTop: 80, borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Reveal>
                <ForgeSectionLabel text={t('support.guides.label')} className="mb-4 block" />
                <h2 className="forge-h2 mb-8">{t('support.guides.title')}</h2>
              </Reveal>

              <div className="space-y-4">
                {guides.map((guide, idx) => (
                  <Reveal key={idx} delay={idx * 0.03}>
                    <div
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => toggleGuide(idx)}
                        className="w-full flex items-center justify-between p-5 forge-transition-micro"
                        aria-expanded={!!openGuides[idx]}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--forge-bg-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 'var(--forge-radius-sm)',
                              background: 'var(--forge-bg-void)',
                              color: 'var(--forge-accent-primary)',
                            }}
                          >
                            {guide.icon}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--forge-font-heading)',
                              fontSize: 'var(--forge-text-lg)',
                              fontWeight: 600,
                              color: 'var(--forge-text-primary)',
                            }}
                          >
                            {guide.title}
                          </span>
                        </div>
                        <span
                          className="shrink-0 forge-transition-micro"
                          style={{
                            fontFamily: 'var(--forge-font-mono)',
                            fontSize: '22px',
                            lineHeight: 1,
                            color: openGuides[idx]
                              ? 'var(--forge-accent-secondary)'
                              : 'var(--forge-accent-primary)',
                            transform: openGuides[idx] ? 'rotate(45deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                          }}
                        >
                          +
                        </span>
                      </button>
                      <div
                        style={{
                          maxHeight: openGuides[idx] ? '600px' : '0',
                          overflow: 'hidden',
                          transition: 'max-height 300ms ease',
                        }}
                      >
                        <div
                          className="px-5 pb-5"
                          style={{ paddingLeft: 72 }}
                        >
                          <ol
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                            }}
                          >
                            {guide.steps.map((step, si) => (
                              <li
                                key={si}
                                className="flex items-start gap-3"
                              >
                                <span
                                  className="shrink-0 flex items-center justify-center"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'var(--forge-accent-primary)',
                                    color: 'var(--forge-bg-void)',
                                    fontFamily: 'var(--forge-font-mono)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                >
                                  {si + 1}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--forge-font-body)',
                                    fontSize: 'var(--forge-text-base)',
                                    color: 'var(--forge-text-secondary)',
                                    lineHeight: '1.6',
                                    paddingTop: 3,
                                  }}
                                >
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ========== VIDEO TUTORIALS SECTION ========== */}
            <section
              id="videos"
              ref={(el) => { sectionRefs.current['videos'] = el; }}
              className="pt-16"
              style={{ scrollMarginTop: 80, borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Reveal>
                <ForgeSectionLabel text={t('support.video.label')} className="mb-4 block" />
                <h2 className="forge-h2 mb-3">{t('support.video.title')}</h2>
                <p
                  className="mb-8"
                  style={{
                    color: 'var(--forge-text-muted)',
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: 'var(--forge-text-sm)',
                  }}
                >
                  {t('support.video.comingSoon')}
                </p>
              </Reveal>

              {videoCategories.map((cat, ci) => (
                <Reveal key={ci} delay={ci * 0.04}>
                  <div className="mb-8">
                    <h3
                      className="mb-4"
                      style={{
                        fontFamily: 'var(--forge-font-heading)',
                        fontSize: 'var(--forge-text-lg)',
                        fontWeight: 600,
                        color: 'var(--forge-text-primary)',
                      }}
                    >
                      {cat.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {cat.items.map((vid, vi) => (
                        <div
                          key={vi}
                          className="group"
                          style={{
                            background: 'var(--forge-bg-surface)',
                            border: '1px solid var(--forge-border-default)',
                            borderRadius: 'var(--forge-radius-md)',
                            overflow: 'hidden',
                            opacity: 0.65,
                            cursor: 'default',
                          }}
                        >
                          {/* Video placeholder */}
                          <div
                            className="flex items-center justify-center"
                            style={{
                              height: 140,
                              background: 'var(--forge-bg-elevated)',
                              borderBottom: '1px solid var(--forge-border-default)',
                              color: 'var(--forge-text-muted)',
                              position: 'relative',
                            }}
                          >
                            {icons.play}
                            <span
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontFamily: 'var(--forge-font-mono)',
                                fontSize: '11px',
                                color: 'var(--forge-text-muted)',
                                background: 'var(--forge-bg-void)',
                                padding: '2px 6px',
                                borderRadius: 'var(--forge-radius-sm)',
                              }}
                            >
                              {vid.duration}
                            </span>
                          </div>
                          <div className="p-4">
                            <p
                              style={{
                                fontFamily: 'var(--forge-font-heading)',
                                fontSize: 'var(--forge-text-base)',
                                fontWeight: 500,
                                color: 'var(--forge-text-primary)',
                                margin: 0,
                              }}
                            >
                              {vid.title}
                            </p>
                            <span
                              className="mt-2 inline-block"
                              style={{
                                fontSize: '11px',
                                fontFamily: 'var(--forge-font-mono)',
                                color: 'var(--forge-text-muted)',
                                border: '1px solid var(--forge-border-default)',
                                borderRadius: 'var(--forge-radius-sm)',
                                padding: '1px 6px',
                              }}
                            >
                              {t('support.resources.soon')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </section>

            {/* ========== CONTACT FORM SECTION ========== */}
            <section
              id="contact"
              ref={(el) => { sectionRefs.current['contact'] = el; }}
              className="pt-16"
              style={{ scrollMarginTop: 80, borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Reveal>
                <ForgeSectionLabel text={t('support.contact.label')} className="mb-4 block" />
                <h2 className="forge-h2 mb-8">{t('support.contact.title')}</h2>
              </Reveal>

              <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                {/* Form */}
                <div className="lg:col-span-7">
                  <Reveal delay={0.02}>
                    <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                          <label htmlFor="contact-name" style={labelStyle}>
                            {t('support.contact.name')} *
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            value={contactForm.name}
                            onChange={(e) =>
                              setContactForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder={t('support.contact.namePlaceholder')}
                            style={{
                              ...inputStyle,
                              borderColor: formErrors.name ? 'var(--forge-accent-secondary, #FF6B6B)' : inputStyle.border,
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            aria-invalid={!!formErrors.name}
                            aria-describedby={formErrors.name ? 'name-error' : undefined}
                          />
                          {formErrors.name && (
                            <p id="name-error" role="alert" style={{ color: 'var(--forge-accent-secondary, #FF6B6B)', fontSize: 'var(--forge-text-sm)', marginTop: 4 }}>
                              {formErrors.name}
                            </p>
                          )}
                        </div>
                        {/* Email */}
                        <div>
                          <label htmlFor="contact-email" style={labelStyle}>
                            Email *
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={contactForm.email}
                            onChange={(e) =>
                              setContactForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder={t('support.contact.emailPlaceholder')}
                            style={{
                              ...inputStyle,
                              borderColor: formErrors.email ? 'var(--forge-accent-secondary, #FF6B6B)' : inputStyle.border,
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? 'email-error' : undefined}
                          />
                          {formErrors.email && (
                            <p id="email-error" role="alert" style={{ color: 'var(--forge-accent-secondary, #FF6B6B)', fontSize: 'var(--forge-text-sm)', marginTop: 4 }}>
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subject select */}
                      <div>
                        <label htmlFor="contact-subject" style={labelStyle}>
                          {t('support.contact.subject')}
                        </label>
                        <select
                          id="contact-subject"
                          value={contactForm.subject}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                          }
                          style={{
                            ...inputStyle,
                            cursor: 'pointer',
                            appearance: 'auto',
                          }}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        >
                          {subjectOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label htmlFor="contact-message" style={labelStyle}>
                          {t('support.contact.message')} *
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={contactForm.message}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, message: e.target.value }))
                          }
                          placeholder={t('support.contact.messagePlaceholder')}
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                            minHeight: 120,
                            borderColor: formErrors.message ? 'var(--forge-accent-secondary, #FF6B6B)' : inputStyle.border,
                          }}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          aria-invalid={!!formErrors.message}
                          aria-describedby={formErrors.message ? 'message-error' : undefined}
                        />
                        {formErrors.message && (
                          <p id="message-error" role="alert" style={{ color: 'var(--forge-accent-secondary, #FF6B6B)', fontSize: 'var(--forge-text-sm)', marginTop: 4 }}>
                            {formErrors.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <ForgeButton type="submit" variant="primary" size="lg">
                          {t('support.contact.send')}
                        </ForgeButton>
                        {submitStatus === 'success' && (
                          <p
                            role="status"
                            style={{
                              fontSize: 'var(--forge-text-sm)',
                              color: 'var(--forge-accent-primary)',
                              fontFamily: 'var(--forge-font-body)',
                            }}
                          >
                            {t('support.contact.successMsg')}
                          </p>
                        )}
                        {submitStatus === 'error' && (
                          <p
                            role="alert"
                            style={{
                              fontSize: 'var(--forge-text-sm)',
                              color: 'var(--forge-accent-secondary, #FF6B6B)',
                              fontFamily: 'var(--forge-font-body)',
                            }}
                          >
                            {t('support.contact.errorMsg')}
                          </p>
                        )}
                      </div>
                    </form>
                  </Reveal>
                </div>

                {/* Contact info cards */}
                <div className="lg:col-span-5 space-y-5">
                  <Reveal delay={0.06}>
                    <div
                      className="p-6 flex items-start gap-4"
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-md)',
                      }}
                    >
                      <div className="shrink-0 mt-1" style={{ color: 'var(--forge-accent-primary)' }}>
                        {icons.mail}
                      </div>
                      <div>
                        <strong
                          className="block mb-1"
                          style={{
                            fontFamily: 'var(--forge-font-heading)',
                            fontSize: 'var(--forge-text-base)',
                            color: 'var(--forge-text-primary)',
                          }}
                        >
                          Email
                        </strong>
                        <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                          support@modelpricer.com
                        </span>
                        <span className="block mt-1" style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                          {t('support.contact.emailReply')}
                        </span>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal delay={0.08}>
                    <div
                      className="p-6 flex items-start gap-4"
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-md)',
                      }}
                    >
                      <div className="shrink-0 mt-1" style={{ color: 'var(--forge-accent-primary)' }}>
                        {icons.chat}
                      </div>
                      <div>
                        <strong
                          className="block mb-1"
                          style={{
                            fontFamily: 'var(--forge-font-heading)',
                            fontSize: 'var(--forge-text-base)',
                            color: 'var(--forge-text-primary)',
                          }}
                        >
                          Live Chat
                        </strong>
                        <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-muted)' }}>
                          {t('support.contact.liveChat')}
                        </span>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <div
                      className="p-6"
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-accent-primary)',
                        borderRadius: 'var(--forge-radius-md)',
                        boxShadow: '0 0 30px rgba(0,212,170,0.06)',
                      }}
                    >
                      <strong
                        className="block mb-2"
                        style={{
                          fontFamily: 'var(--forge-font-heading)',
                          fontSize: 'var(--forge-text-base)',
                          color: 'var(--forge-text-primary)',
                        }}
                      >
                        {t('support.contact.enterprise')}
                      </strong>
                      <p
                        style={{
                          fontSize: 'var(--forge-text-sm)',
                          color: 'var(--forge-text-muted)',
                          marginBottom: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {t('support.contact.enterpriseDesc')}
                      </p>
                      <ForgeButton to="/pricing" variant="outline" size="sm">
                        {t('support.contact.viewPlans')}
                      </ForgeButton>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>

            {/* ========== SYSTEM REQUIREMENTS SECTION ========== */}
            <section
              id="system-req"
              ref={(el) => { sectionRefs.current['system-req'] = el; }}
              className="pt-16"
              style={{ scrollMarginTop: 80, borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Reveal>
                <ForgeSectionLabel text={t('support.sysreq.label')} className="mb-4 block" />
                <h2 className="forge-h2 mb-8">{t('support.sysreq.title')}</h2>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {systemRequirements.map((group, gi) => (
                  <Reveal key={gi} delay={gi * 0.04}>
                    <div
                      className="p-6 h-full"
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-md)',
                      }}
                    >
                      <h3
                        className="mb-4"
                        style={{
                          fontFamily: 'var(--forge-font-heading)',
                          fontSize: 'var(--forge-text-lg)',
                          fontWeight: 600,
                          color: 'var(--forge-text-primary)',
                        }}
                      >
                        {group.title}
                      </h3>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        {group.items.map((item, ii) => (
                          <li
                            key={ii}
                            className="flex items-center gap-2"
                            style={{
                              fontFamily: 'var(--forge-font-body)',
                              fontSize: 'var(--forge-text-sm)',
                              color: 'var(--forge-text-secondary)',
                            }}
                          >
                            {icons.check}
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ========== TROUBLESHOOTING SECTION ========== */}
            <section
              id="troubleshooting"
              ref={(el) => { sectionRefs.current['troubleshooting'] = el; }}
              className="pt-16 pb-8"
              style={{ scrollMarginTop: 80, borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Reveal>
                <ForgeSectionLabel text={t('support.trouble.label')} className="mb-4 block" />
                <h2 className="forge-h2 mb-8">{t('support.trouble.title')}</h2>
              </Reveal>

              <div className="space-y-6">
                {troubleshootItems.map((item, ti) => (
                  <Reveal key={ti} delay={ti * 0.04}>
                    <div
                      className="p-6"
                      style={{
                        background: 'var(--forge-bg-surface)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-md)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span style={{ color: 'var(--forge-accent-secondary, #FF8C42)' }}>
                          {icons.warning}
                        </span>
                        <h3
                          style={{
                            fontFamily: 'var(--forge-font-heading)',
                            fontSize: 'var(--forge-text-lg)',
                            fontWeight: 600,
                            color: 'var(--forge-text-primary)',
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <ol
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          paddingLeft: 32,
                        }}
                      >
                        {item.steps.map((step, si) => (
                          <li
                            key={si}
                            className="flex items-start gap-3"
                            style={{
                              fontFamily: 'var(--forge-font-body)',
                              fontSize: 'var(--forge-text-base)',
                              color: 'var(--forge-text-secondary)',
                              lineHeight: '1.5',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--forge-font-mono)',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--forge-accent-primary)',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              {si + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Support;
