import React from 'react';
import { useNavigate } from 'react-router-dom';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('404 - Page Not Found');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const pageStyle = {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  };

  const codeStyle = {
    fontFamily: 'var(--forge-font-mono)',
    fontSize: 'clamp(80px, 15vw, 140px)',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    opacity: 0.15,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    userSelect: 'none',
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-2xl)',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    marginTop: '-16px',
    marginBottom: '8px',
  };

  const descStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-muted)',
    marginBottom: '32px',
    maxWidth: '420px',
    textAlign: 'center',
    lineHeight: 1.6,
  };

  const linksContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '40px',
  };

  const helpSectionStyle = {
    borderTop: '1px solid var(--forge-border, #2a2d35)',
    paddingTop: '24px',
    textAlign: 'center',
    maxWidth: '400px',
  };

  const helpTitleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 600,
    color: 'var(--forge-text-secondary, #B0B8C4)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const helpLinksStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'center',
  };

  const helpLinkStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    transition: 'color 0.15s ease',
  };

  return (
    <div style={pageStyle} role="main" aria-labelledby="not-found-title">
      <div style={{ textAlign: 'center' }}>
        <div style={codeStyle} aria-hidden="true">404</div>
        <h1 id="not-found-title" style={titleStyle}>{t('notFound.title')}</h1>
        <p style={descStyle}>
          {t('notFound.description')}
        </p>
        <div style={linksContainerStyle}>
          <ForgeButton variant="primary" onClick={() => navigate('/')}>
            {t('notFound.goHome')}
          </ForgeButton>
          <ForgeButton variant="outline" onClick={() => navigate(-1)}>
            {t('notFound.goBack')}
          </ForgeButton>
        </div>
        <div style={helpSectionStyle}>
          <div style={helpTitleStyle}>{t('notFound.helpfulLinks')}</div>
          <nav style={helpLinksStyle} aria-label={t('notFound.helpfulLinks')}>
            <a
              href="/test-kalkulacka"
              onClick={(e) => { e.preventDefault(); navigate('/test-kalkulacka'); }}
              style={helpLinkStyle}
              onMouseEnter={(e) => e.target.style.color = 'var(--forge-accent-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--forge-text-muted)'}
            >
              {t('notFound.link.calculator')}
            </a>
            <a
              href="/pricing"
              onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}
              style={helpLinkStyle}
              onMouseEnter={(e) => e.target.style.color = 'var(--forge-accent-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--forge-text-muted)'}
            >
              {t('notFound.link.pricing')}
            </a>
            <a
              href="/support"
              onClick={(e) => { e.preventDefault(); navigate('/support'); }}
              style={helpLinkStyle}
              onMouseEnter={(e) => e.target.style.color = 'var(--forge-accent-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--forge-text-muted)'}
            >
              {t('notFound.link.support')}
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
