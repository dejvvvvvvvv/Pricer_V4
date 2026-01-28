import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import RoleSelectionCard from './components/RoleSelectionCard';
import RegistrationForm from './components/RegistrationForm';
import LanguageToggle from './components/LanguageToggle';
import ProgressSteps from './components/ProgressSteps';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const Register = () => {
  const [currentLanguage, setCurrentLanguage] = useState('cs');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'cs';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  const steps = [
    { id: 'role', title: 'Role', description: 'Výběr role' },
    { id: 'details', title: 'Údaje', description: 'Osobní info' },
    { id: 'verification', title: 'Ověření', description: 'E-mail' }
  ];

  const roleOptions = [
    {
      role: 'customer',
      title: 'Zákazník',
      description: 'Potřebuji vytisknout 3D modely a hledám kvalitní tiskové služby.',
      icon: 'User',
      benefits: [
        'Nahrávání 3D modelů (.stl, .obj)',
        'Automatický výpočet ceny',
        'Výběr z ověřených tiskáren',
        'Sledování objednávek v reálném čase',
      ]
    },
    {
      role: 'host',
      title: 'Poskytovatel',
      description: 'Vlastním 3D tiskárny a chci je monetizovat prostřednictvím platformy.',
      icon: 'Printer',
      benefits: [
        'Pasivní příjem z tiskáren',
        'Automatické rozdělování objednávek',
        'Detailní statistiky výdělků',
        'Správa více tiskáren',
      ]
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedRole) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">Vytvořit účet</h1>
                <p className="text-muted-foreground">
                  Připojte se k největší 3D tiskové komunitě v České republice
                </p>
              </div>
              <LanguageToggle 
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>
            <ProgressSteps currentStep={currentStep} totalSteps={3} steps={steps} />
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-2">Vyberte svou roli</h2>
                  <p className="text-muted-foreground">Jak chcete používat naši platformu?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roleOptions.map((option) => (
                    <RoleSelectionCard
                      key={option.role}
                      {...option}
                      isSelected={selectedRole === option.role}
                      onSelect={handleRoleSelect}
                    />
                  ))}
                </div>
                {selectedRole && (
                  <div className="flex justify-center pt-6">
                    <Button variant="default" size="lg" onClick={handleNextStep} iconName="ArrowRight" iconPosition="right">
                      Pokračovat
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Registrační údaje</h2>
                    <p className="text-muted-foreground">
                      {`Registrace jako ${selectedRole === 'host' ? 'Poskytovatel' : 'Zákazník'}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handlePreviousStep} iconName="ArrowLeft" iconPosition="left">
                    Zpět
                  </Button>
                </div>
                <RegistrationForm selectedRole={selectedRole} />
              </div>
            )}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             {/* Trust Indicators */}
          </div>
      </div>
    </div>
  );
};

export default Register;
