import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Match AdminLayout sidebar logic
  const isAdmin = location.pathname.startsWith('/admin');
  const isMobile = windowWidth < 768;
  const sidebarCollapsed = windowWidth < 1200 && windowWidth >= 768;
  const sidebarWidth = isAdmin && !isMobile ? (sidebarCollapsed ? 64 : 260) : 0;

  return (
    <footer className="footer" style={sidebarWidth > 0 ? { marginLeft: sidebarWidth, transition: 'margin-left 250ms cubic-bezier(0.16, 1, 0.3, 1)' } : undefined}>
      <div className="footer-container">
        <div className="footer-content">
          {/* LEFT — Logo + Description */}
          <div className="footer-column" style={sidebarWidth > 0 ? { paddingLeft: 60 } : undefined}>
            <div className="footer-logo">
              <img
                src={logoImg}
                alt="ModelPricer"
                style={{ width: 40, height: 40, mixBlendMode: 'lighten', objectFit: 'contain' }}
              />
              <span className="logo-text">ModelPricer</span>
            </div>
            <p className="footer-description">{t('footer.description')}</p>
            <span className="footer-version">[ MODEL.PRICER ] &middot; v3.2</span>
            <div className="footer-social">
              <a href="#" aria-label="GitHub" className="footer-social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="footer-social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="footer-social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* CENTER — Navigation */}
          <div className="footer-column">
            <h4>{t('footer.nav.title')}</h4>
            <nav className="footer-nav">
              <Link to="/">{t('nav.home')}</Link>
              <Link to="/test-kalkulacka">{t('nav.demo')}</Link>
              <Link to="/pricing">{t('nav.pricing')}</Link>
              <Link to="/support">{t('nav.support')}</Link>
              <Link to="/track">{t('nav.track')}</Link>
            </nav>
          </div>

          {/* RIGHT — Legal */}
          <div className="footer-column">
            <h4>{t('footer.legal.title')}</h4>
            <nav className="footer-nav">
              <Link to="/privacy">{t('footer.legal.privacy')}</Link>
              <Link to="/terms">{t('footer.legal.terms')}</Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>

      <style>{`
        .footer {
          background: var(--forge-bg-surface, #0E1015);
          color: var(--forge-text-secondary, #9BA3B0);
          padding: 60px 0 24px 0;
          margin-top: 0;
          border-top: 1px solid var(--forge-border-default, #1E2230);
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-column h4 {
          font-family: var(--forge-font-heading, 'Space Grotesk', system-ui, sans-serif);
          font-size: 14px;
          font-weight: 600;
          color: var(--forge-text-primary, #E8ECF1);
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .logo-text {
          font-family: var(--forge-font-heading, 'Space Grotesk', system-ui, sans-serif);
          font-size: 20px;
          font-weight: 700;
          color: var(--forge-text-primary, #E8ECF1);
        }

        .footer-description {
          font-family: var(--forge-font-body, 'IBM Plex Sans', system-ui, sans-serif);
          font-size: 14px;
          color: var(--forge-text-muted, #7A8291);
          margin: 0 0 12px 0;
        }

        .footer-version {
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          font-size: 11px;
          color: var(--forge-text-muted, #7A8291);
          letter-spacing: 0.05em;
        }

        .footer-social {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .footer-social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: var(--forge-text-muted, #7A8291);
          background: transparent;
          border: 1px solid var(--forge-border-default, #1E2230);
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }

        .footer-social-link:hover {
          color: var(--forge-accent-primary, #00D4AA);
          border-color: var(--forge-accent-primary, #00D4AA);
          background: rgba(0, 212, 170, 0.06);
        }

        .footer-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-nav a {
          color: var(--forge-text-secondary, #9BA3B0);
          text-decoration: none;
          font-family: var(--forge-font-body, 'IBM Plex Sans', system-ui, sans-serif);
          font-size: 14px;
          transition: color 0.15s;
        }

        .footer-nav a:hover {
          color: var(--forge-accent-primary, #00D4AA);
        }

        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid var(--forge-border-default, #1E2230);
          text-align: center;
        }

        .footer-bottom p {
          margin: 0;
          font-size: 14px;
          color: var(--forge-text-muted, #7A8291);
        }

        @media (max-width: 768px) {
          .footer {
            padding: 40px 0 20px 0;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
