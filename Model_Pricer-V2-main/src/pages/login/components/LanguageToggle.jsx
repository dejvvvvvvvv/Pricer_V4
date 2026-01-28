import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';


const LanguageToggle = () => {
  const [currentLanguage, setCurrentLanguage] = useState('cs');

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLanguage = localStorage.getItem('language') || 'cs';
    setCurrentLanguage(savedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'cs' ? 'en' : 'cs';
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // In a real app, this would trigger a global language change
    // For now, we'll just reload the page to simulate the change
    window.location?.reload();
  };

  return (
    <div className="absolute top-4 right-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        iconName="Globe"
        iconPosition="left"
        className="text-muted-foreground hover:text-foreground"
      >
        {currentLanguage === 'cs' ? 'EN' : 'CZ'}
      </Button>
    </div>
  );
};

export default LanguageToggle;
