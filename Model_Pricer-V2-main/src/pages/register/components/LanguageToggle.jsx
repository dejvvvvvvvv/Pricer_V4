import React from 'react';
import Button from '../../../components/ui/Button';


const LanguageToggle = ({ currentLanguage, onLanguageChange }) => {
  const languages = [
    { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];

  return (
    <div className="flex items-center space-x-2">
      {languages?.map((lang) => (
        <Button
          key={lang?.code}
          variant={currentLanguage === lang?.code ? "default" : "ghost"}
          size="sm"
          onClick={() => onLanguageChange(lang?.code)}
          className="flex items-center space-x-2"
        >
          <span className="text-base">{lang?.flag}</span>
          <span className="text-sm">{lang?.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default LanguageToggle;