import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* LEVÁ ČÁST */}
          <div className="footer-column">
            <div className="footer-logo">
              <div className="logo-icon">
                <Icon name="Layers3" size={24} color="white" />
              </div>
              <span className="logo-text">ModelPricer</span>
            </div>
            <p className="footer-description">{t('footer.description')}</p>
          </div>

          {/* STŘED - Navigace */}
          <div className="footer-column">
            <h4>{t('footer.nav.title')}</h4>
            <nav className="footer-nav">
              <Link to="/">{t('nav.home')}</Link>
              <Link to="/model-upload">{t('nav.demo')}</Link>
              <Link to="/pricing">{t('nav.pricing')}</Link>
              <Link to="/support">{t('nav.support')}</Link>
            </nav>
          </div>

          {/* PRAVÁ ČÁST - Právní */}
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
          background: #1F2937;
          color: #D1D5DB;
          padding: 60px 0 24px 0;
          margin-top: 80px;
        }

        .container {
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
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .footer-description {
          font-size: 14px;
          color: #9CA3AF;
          margin: 0;
        }

        .footer-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-nav a {
          color: #D1D5DB;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-nav a:hover {
          color: white;
        }

        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid #374151;
          text-align: center;
        }

        .footer-bottom p {
          margin: 0;
          font-size: 14px;
          color: #9CA3AF;
        }

        @media (max-width: 768px) {
          .footer {
            padding: 40px 0 20px 0;
            margin-top: 60px;
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
