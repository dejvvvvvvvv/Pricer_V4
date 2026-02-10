import React, { useState, useEffect } from 'react';
import RoleSelectionCard from './components/RoleSelectionCard';
import RegistrationForm from './components/RegistrationForm';
import LanguageToggle from './components/LanguageToggle';
import ProgressSteps from './components/ProgressSteps';
import ForgeButton from '../../components/ui/forge/ForgeButton';
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
    { id: 'role', title: 'Role', description: 'Select role' },
    { id: 'details', title: 'Details', description: 'Personal info' },
    { id: 'verification', title: 'Verify', description: 'E-mail' }
  ];

  const roleOptions = [
    {
      role: 'customer',
      title: 'Customer',
      description: 'I need to print 3D models and looking for quality print services.',
      icon: 'User',
      benefits: [
        'Upload 3D models (.stl, .obj)',
        'Automatic price calculation',
        'Choose from verified printers',
        'Real-time order tracking',
      ]
    },
    {
      role: 'host',
      title: 'Provider',
      description: 'I own 3D printers and want to monetize them through the platform.',
      icon: 'Printer',
      benefits: [
        'Passive income from printers',
        'Automatic order distribution',
        'Detailed earnings statistics',
        'Multi-printer management',
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

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: 'var(--forge-bg-void)',
    color: 'var(--forge-text-primary)',
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '48px 24px',
  };

  const cardStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '32px',
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: 'var(--forge-text-3xl)',
                fontWeight: 700,
                color: 'var(--forge-text-primary)',
                margin: '0 0 8px 0',
              }}>
                Create Account
              </h1>
              <p style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: 'var(--forge-text-base)',
                color: 'var(--forge-text-muted)',
                margin: 0,
              }}>
                Join the 3D printing platform
              </p>
            </div>
            <LanguageToggle
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <ProgressSteps currentStep={currentStep} totalSteps={3} steps={steps} />
        </div>

        <div style={cardStyle}>
          {currentStep === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{
                  fontFamily: 'var(--forge-font-heading)',
                  fontSize: 'var(--forge-text-xl)',
                  fontWeight: 600,
                  color: 'var(--forge-text-primary)',
                  margin: '0 0 8px 0',
                }}>
                  Select Your Role
                </h2>
                <p style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: 'var(--forge-text-base)',
                  color: 'var(--forge-text-muted)',
                  margin: 0,
                }}>
                  How do you want to use the platform?
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '24px' }}>
                  <ForgeButton variant="primary" onClick={handleNextStep}>
                    Continue
                  </ForgeButton>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--forge-font-heading)',
                    fontSize: 'var(--forge-text-xl)',
                    fontWeight: 600,
                    color: 'var(--forge-text-primary)',
                    margin: '0 0 4px 0',
                  }}>
                    Registration Details
                  </h2>
                  <p style={{
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: 'var(--forge-text-base)',
                    color: 'var(--forge-text-muted)',
                    margin: 0,
                  }}>
                    {`Registering as ${selectedRole === 'host' ? 'Provider' : 'Customer'}`}
                  </p>
                </div>
                <ForgeButton variant="ghost" size="sm" onClick={handlePreviousStep}>
                  Back
                </ForgeButton>
              </div>
              <RegistrationForm selectedRole={selectedRole} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
