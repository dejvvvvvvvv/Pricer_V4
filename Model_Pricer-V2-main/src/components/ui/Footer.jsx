import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* LEFT — Logo + Description */}
          <div className="footer-column">
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
          </div>

          {/* CENTER — Navigation */}
          <div className="footer-column">
            <h4>{t('footer.nav.title')}</h4>
            <nav className="footer-nav">
              <Link to="/">{t('nav.home')}</Link>
              <Link to="/test-kalkulacka">{t('nav.demo')}</Link>
              <Link to="/pricing">{t('nav.pricing')}</Link>
              <Link to="/support">{t('nav.support')}</Link>
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
