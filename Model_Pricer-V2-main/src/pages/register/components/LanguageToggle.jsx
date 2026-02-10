import React from 'react';
import ForgeButton from '../../../components/ui/forge/ForgeButton';

const LanguageToggle = ({ currentLanguage, onLanguageChange }) => {
  const languages = [
    { code: 'cs', label: 'CZ', flag: null },
    { code: 'en', label: 'EN', flag: null },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--forge-radius-sm)',
            border: '1px solid',
            borderColor: currentLanguage === lang.code ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
            backgroundColor: currentLanguage === lang.code ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
            color: currentLanguage === lang.code ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--forge-font-tech)',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
