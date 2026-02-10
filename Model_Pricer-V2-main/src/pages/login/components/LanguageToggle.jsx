import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const LanguageToggle = () => {
  const [currentLanguage, setCurrentLanguage] = useState('cs');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'cs';
    setCurrentLanguage(savedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'cs' ? 'en' : 'cs';
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    window.location?.reload();
  };

  return (
    <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
      <button
        onClick={toggleLanguage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-sm)',
          color: 'var(--forge-text-muted)',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--forge-font-tech)',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'all 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
          e.currentTarget.style.color = 'var(--forge-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--forge-border-default)';
          e.currentTarget.style.color = 'var(--forge-text-muted)';
        }}
      >
        <Icon name="Globe" size={14} />
        {currentLanguage === 'cs' ? 'EN' : 'CZ'}
      </button>
    </div>
  );
};

export default LanguageToggle;
