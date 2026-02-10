import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

/* ──────────────────────────────────────────────────────────────────────────
   FORGE inline-style helpers (no Tailwind light-mode classes)
   ────────────────────────────────────────────────────────────────────────── */

const forgePageStyles = {
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  minHeight: '100vh',
};

const forgeCardStyles = {
  backgroundColor: 'var(--forge-bg-surface)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-md)',
  overflow: 'hidden',
};

const forgeCardHeaderStyles = {
  padding: '16px 24px',
  borderBottom: '1px solid var(--forge-border-default)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const forgeCardHeaderIconBox = {
  width: 36,
  height: 36,
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'rgba(0,212,170,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--forge-accent-primary)',
  flexShrink: 0,
};

const forgeCardTitle = {
  fontFamily: 'var(--forge-font-heading)',
  fontWeight: 700,
  fontSize: '1rem',
  color: 'var(--forge-text-primary)',
  margin: 0,
};

const forgeCardBody = {
  padding: '24px',
};

const forgeLabelStyles = {
  fontFamily: 'var(--forge-font-body)',
  fontSize: '12px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--forge-text-secondary)',
  marginBottom: '6px',
  display: 'block',
};

const forgeInputStyles = {
  width: '100%',
  height: '40px',
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-sm)',
  color: 'var(--forge-text-primary)',
  fontFamily: 'var(--forge-font-body)',
  fontSize: '14px',
  padding: '0 12px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const forgeInputWithIconStyles = {
  ...forgeInputStyles,
  paddingLeft: '38px',
};

const forgeSelectStyles = {
  ...forgeInputStyles,
  appearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239BA3B0' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

const forgePrimaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px 20px',
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'var(--forge-accent-primary)',
  color: '#08090C',
  fontFamily: 'var(--forge-font-body)',
  fontWeight: 600,
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s, transform 0.15s',
};

const forgeOutlineBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px 20px',
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'transparent',
  color: 'var(--forge-text-secondary)',
  fontFamily: 'var(--forge-font-body)',
  fontWeight: 500,
  fontSize: '14px',
  border: '1px solid var(--forge-border-default)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, color 0.2s',
};

const forgeDangerOutlineBtn = {
  ...forgeOutlineBtn,
  color: 'var(--forge-error)',
  borderColor: 'rgba(255,71,87,0.3)',
};

const forgeGhostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'rgba(0,212,170,0.08)',
  color: 'var(--forge-accent-primary)',
  fontFamily: 'var(--forge-font-body)',
  fontWeight: 500,
  fontSize: '13px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

/* ──────────────────────────────────────────────────────────────────────────
   Password strength colour mapping (FORGE semantic tokens)
   ────────────────────────────────────────────────────────────────────────── */

const strengthColors = {
  weak: 'var(--forge-error)',       // #FF4757
  medium: 'var(--forge-warning)',   // #FFB547
  good: 'var(--forge-info)',        // #4DA8DA
  strong: 'var(--forge-success)',   // #00D4AA
};

/* ════════════════════════════════════════════════════════════════════════ */

const AccountPage = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data pro vyvoj
  const [profileData, setProfileData] = useState({
    firstName: 'Jan',
    lastName: 'Novak',
    email: 'jan.novak@example.com',
    phone: '+420 123 456 789',
    company: 'ModelPricer s.r.o.',
    ico: '12345678',
    dic: 'CZ12345678',
    address: 'Hlavni 123',
    city: 'Praha',
    zip: '110 00',
    country: 'Ceska republika'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    console.log('Saving profile:', profileData);
    alert(language === 'cs' ? 'Profil ulozen!' : 'Profile saved!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(language === 'cs' ? 'Hesla se neshoduji!' : 'Passwords do not match!');
      return;
    }
    console.log('Changing password');
    alert(language === 'cs' ? 'Heslo zmeneno!' : 'Password changed!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '', color: 'transparent', textColor: 'transparent' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { level: 25, text: language === 'cs' ? 'Slabe' : 'Weak', color: strengthColors.weak, textColor: strengthColors.weak };
    if (strength === 2) return { level: 50, text: language === 'cs' ? 'Stredni' : 'Medium', color: strengthColors.medium, textColor: strengthColors.medium };
    if (strength === 3) return { level: 75, text: language === 'cs' ? 'Dobre' : 'Good', color: strengthColors.good, textColor: strengthColors.good };
    return { level: 100, text: language === 'cs' ? 'Silne' : 'Strong', color: strengthColors.strong, textColor: strengthColors.strong };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const t = {
    'account.title': language === 'cs' ? 'Nastaveni uctu' : 'Account Settings',
    'account.subtitle': language === 'cs' ? 'Spravujte informace o uctu a predvolby' : 'Manage your account information and preferences',
    'tab.profile': language === 'cs' ? 'Profil' : 'Profile',
    'tab.company': language === 'cs' ? 'Firma' : 'Company',
    'tab.security': language === 'cs' ? 'Zabezpeceni' : 'Security',
    'profile.title': language === 'cs' ? 'Osobni informace' : 'Personal Information',
    'profile.firstName': language === 'cs' ? 'Jmeno' : 'First Name',
    'profile.lastName': language === 'cs' ? 'Prijmeni' : 'Last Name',
    'profile.email': language === 'cs' ? 'Emailova adresa' : 'Email Address',
    'profile.phone': language === 'cs' ? 'Telefonni cislo' : 'Phone Number',
    'company.title': language === 'cs' ? 'Informace o firme' : 'Company Information',
    'company.name': language === 'cs' ? 'Nazev firmy' : 'Company Name',
    'company.ico': language === 'cs' ? 'ICO' : 'Company ID',
    'company.dic': language === 'cs' ? 'DIC' : 'VAT ID',
    'company.address': language === 'cs' ? 'Adresa' : 'Address',
    'company.city': language === 'cs' ? 'Mesto' : 'City',
    'company.zip': language === 'cs' ? 'PSC' : 'ZIP Code',
    'company.country': language === 'cs' ? 'Zeme' : 'Country',
    'security.title': language === 'cs' ? 'Zmenit heslo' : 'Change Password',
    'security.current': language === 'cs' ? 'Soucasne heslo' : 'Current Password',
    'security.new': language === 'cs' ? 'Nove heslo' : 'New Password',
    'security.confirm': language === 'cs' ? 'Potvrdit nove heslo' : 'Confirm New Password',
    'security.2fa.title': language === 'cs' ? 'Dvoufaktorove overeni' : 'Two-Factor Authentication',
    'security.2fa.desc': language === 'cs' ? 'Pridejte dalsi vrstvu zabezpeceni k vasemu uctu' : 'Add an extra layer of security to your account',
    'security.2fa.enable': language === 'cs' ? 'Zapnout 2FA' : 'Enable 2FA',
    'security.sessions.title': language === 'cs' ? 'Aktivni relace' : 'Active Sessions',
    'security.sessions.desc': language === 'cs' ? 'Spravujte zarizeni, na kterych jste prihlaseni' : 'Manage devices where you\'re currently logged in',
    'security.sessions.current': language === 'cs' ? 'Toto zarizeni' : 'This device',
    'common.cancel': language === 'cs' ? 'Zrusit' : 'Cancel',
    'common.save': language === 'cs' ? 'Ulozit zmeny' : 'Save Changes',
    'common.change': language === 'cs' ? 'Zmenit heslo' : 'Change Password',
    'tab.billing': language === 'cs' ? 'Fakturace' : 'Billing',
    'billing.title': language === 'cs' ? 'Fakturace a predplatne' : 'Billing & Subscription',
    'billing.plan.title': language === 'cs' ? 'Aktualni tarif' : 'Current Plan',
    'billing.plan.name': language === 'cs' ? 'Professional tarif' : 'Professional Plan',
    'billing.plan.change': language === 'cs' ? 'Zmenit tarif' : 'Change Plan',
    'billing.plan.cancel': language === 'cs' ? 'Zrusit predplatne' : 'Cancel Subscription',
    'billing.payment.title': language === 'cs' ? 'Platebni metody' : 'Payment Methods',
    'billing.payment.add': language === 'cs' ? 'Pridat platebni metodu' : 'Add Payment Method',
    'billing.payment.expires': language === 'cs' ? 'Platnost do' : 'Expires',
    'billing.history.title': language === 'cs' ? 'Historie faktur' : 'Billing History',
    'billing.history.download': language === 'cs' ? 'Stahnout PDF' : 'Download PDF',
  };

  const tabs = [
    { id: 'profile', label: t['tab.profile'], icon: 'User' },
    { id: 'company', label: t['tab.company'], icon: 'Building2' },
    { id: 'security', label: t['tab.security'], icon: 'Shield' },
    { id: 'billing', label: t['tab.billing'], icon: 'CreditCard' },
  ];

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
    })
  };

  /* ── Reusable FORGE Form Input ────────────────────────────────────────── */

  const FormInput = ({ icon, label, type = 'text', value, onChange, placeholder }) => (
    <div style={{ marginBottom: '0px' }}>
      <label style={forgeLabelStyles}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--forge-text-muted)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Icon name={icon} size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={icon ? forgeInputWithIconStyles : forgeInputStyles}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--forge-accent-primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '';
            e.target.style.boxShadow = '';
          }}
        />
      </div>
    </div>
  );

  /* ── Reusable FORGE Card Component ────────────────────────────────────── */

  const Card = ({ icon, title, children, index = 0, style = {} }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      style={{ ...forgeCardStyles, ...style }}
    >
      <div style={forgeCardHeaderStyles}>
        <div style={forgeCardHeaderIconBox}>
          <Icon name={icon} size={18} />
        </div>
        <h3 style={forgeCardTitle}>{title}</h3>
      </div>
      <div style={forgeCardBody}>
        {children}
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={forgePageStyles}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 16px' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--forge-radius-lg)',
                background: 'var(--forge-gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#08090C',
                fontSize: '1.5rem',
                fontFamily: 'var(--forge-font-heading)',
                fontWeight: 700,
                boxShadow: '0 0 24px rgba(0,212,170,0.18)',
              }}>
                {profileData.firstName[0]}{profileData.lastName[0]}
              </div>
              <button style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '26px',
                height: '26px',
                borderRadius: 'var(--forge-radius-sm)',
                backgroundColor: 'var(--forge-bg-elevated)',
                border: '1px solid var(--forge-border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--forge-text-muted)',
                cursor: 'pointer',
                padding: 0,
              }}>
                <Icon name="Camera" size={12} />
              </button>
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontWeight: 700,
                fontSize: 'var(--forge-text-2xl)',
                color: 'var(--forge-text-primary)',
                margin: 0,
              }}>
                {t['account.title']}
              </h1>
              <p style={{
                color: 'var(--forge-text-secondary)',
                fontSize: '14px',
                marginTop: '4px',
                margin: '4px 0 0',
              }}>
                {t['account.subtitle']}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Navigation (FORGE tech font, bottom-border style) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid var(--forge-border-default)',
          }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: 'relative',
                    padding: '12px 20px',
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--forge-accent-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'color 0.2s, border-color 0.2s',
                    marginBottom: '-1px',
                  }}
                >
                  <Icon name={tab.icon} size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tab Content ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* ═══ PROFILE TAB ═══ */}
            {activeTab === 'profile' && (
              <div>
                <Card icon="User" title={t['profile.title']} index={0}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    <FormInput
                      icon="User"
                      label={t['profile.firstName']}
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      placeholder={t['profile.firstName']}
                    />
                    <FormInput
                      icon="User"
                      label={t['profile.lastName']}
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      placeholder={t['profile.lastName']}
                    />
                    <FormInput
                      icon="Mail"
                      label={t['profile.email']}
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      placeholder={t['profile.email']}
                    />
                    <FormInput
                      icon="Phone"
                      label={t['profile.phone']}
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder={t['profile.phone']}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--forge-border-default)',
                  }}>
                    <button style={forgeOutlineBtn}>
                      {t['common.cancel']}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      style={forgePrimaryBtn}
                    >
                      {t['common.save']}
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* ═══ COMPANY TAB ═══ */}
            {activeTab === 'company' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <Card icon="Building2" title={language === 'cs' ? 'Zakladni udaje' : 'Basic Info'} index={0}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FormInput
                      icon="Building2"
                      label={t['company.name']}
                      value={profileData.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                      placeholder={t['company.name']}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <FormInput
                        label={t['company.ico']}
                        value={profileData.ico}
                        onChange={(e) => handleProfileChange('ico', e.target.value)}
                        placeholder={t['company.ico']}
                      />
                      <FormInput
                        label={t['company.dic']}
                        value={profileData.dic}
                        onChange={(e) => handleProfileChange('dic', e.target.value)}
                        placeholder={t['company.dic']}
                      />
                    </div>
                  </div>
                </Card>

                <Card icon="MapPin" title={language === 'cs' ? 'Adresa' : 'Address'} index={1}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FormInput
                      icon="MapPin"
                      label={t['company.address']}
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      placeholder={t['company.address']}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <FormInput
                        label={t['company.city']}
                        value={profileData.city}
                        onChange={(e) => handleProfileChange('city', e.target.value)}
                        placeholder={t['company.city']}
                      />
                      <FormInput
                        label={t['company.zip']}
                        value={profileData.zip}
                        onChange={(e) => handleProfileChange('zip', e.target.value)}
                        placeholder={t['company.zip']}
                      />
                    </div>
                    <div>
                      <label style={forgeLabelStyles}>{t['company.country']}</label>
                      <select
                        value={profileData.country}
                        onChange={(e) => handleProfileChange('country', e.target.value)}
                        style={forgeSelectStyles}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--forge-accent-primary)';
                          e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }}
                      >
                        <option>Ceska republika</option>
                        <option>Slovensko</option>
                        <option>Polsko</option>
                        <option>Nemecko</option>
                        <option>Rakousko</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button style={forgeOutlineBtn}>
                    {t['common.cancel']}
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    style={forgePrimaryBtn}
                  >
                    {t['common.save']}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ SECURITY TAB ═══ */}
            {activeTab === 'security' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <Card icon="Key" title={t['security.title']} index={0}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FormInput
                      icon="Lock"
                      label={t['security.current']}
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="--------"
                    />
                    <div>
                      <FormInput
                        icon="Key"
                        label={t['security.new']}
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="--------"
                      />
                      {passwordData.newPassword && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--forge-text-muted)' }}>
                              {language === 'cs' ? 'Sila hesla' : 'Password strength'}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: passwordStrength.textColor }}>
                              {passwordStrength.text}
                            </span>
                          </div>
                          <div style={{
                            height: '4px',
                            backgroundColor: 'var(--forge-bg-overlay)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.level}%` }}
                              style={{
                                height: '100%',
                                backgroundColor: passwordStrength.color,
                                borderRadius: '2px',
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <FormInput
                      icon="Key"
                      label={t['security.confirm']}
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="--------"
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--forge-border-default)',
                  }}>
                    <button
                      onClick={handleChangePassword}
                      style={forgePrimaryBtn}
                    >
                      {t['common.change']}
                    </button>
                  </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Card icon="ShieldCheck" title={t['security.2fa.title']} index={1}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', margin: 0 }}>
                        {t['security.2fa.desc']}
                      </p>
                      <button style={forgeGhostBtn}>
                        {t['security.2fa.enable']}
                      </button>
                    </div>
                  </Card>

                  <Card icon="Monitor" title={t['security.sessions.title']} index={2}>
                    <p style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', margin: '0 0 16px' }}>
                      {t['security.sessions.desc']}
                    </p>
                    <div style={{
                      padding: '14px',
                      borderRadius: 'var(--forge-radius-sm)',
                      backgroundColor: 'var(--forge-bg-elevated)',
                      border: '1px solid var(--forge-border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--forge-radius-sm)',
                        backgroundColor: 'rgba(0,212,170,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--forge-accent-primary)',
                        flexShrink: 0,
                      }}>
                        <Icon name="Monitor" size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: 'var(--forge-text-primary)',
                        }}>
                          Windows PC - Chrome
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)', marginTop: '2px' }}>
                          {language === 'cs' ? 'Praha, Ceska republika' : 'Prague, Czech Republic'}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '100px',
                        backgroundColor: 'rgba(0,212,170,0.1)',
                        color: 'var(--forge-accent-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {t['security.sessions.current']}
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ BILLING TAB ═══ */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card icon="CreditCard" title={t['billing.title']} index={0}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {/* Current Plan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{
                        padding: '20px',
                        borderRadius: 'var(--forge-radius-md)',
                        backgroundColor: 'var(--forge-bg-elevated)',
                        border: '1px solid var(--forge-border-highlight)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{
                              ...forgeLabelStyles,
                              marginBottom: '4px',
                            }}>
                              {t['billing.plan.title']}
                            </h4>
                            <div style={{
                              fontFamily: 'var(--forge-font-heading)',
                              fontWeight: 700,
                              fontSize: 'var(--forge-text-xl)',
                              color: 'var(--forge-text-primary)',
                            }}>
                              {t['billing.plan.name']}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '100px',
                            backgroundColor: 'rgba(0,212,170,0.1)',
                            color: 'var(--forge-accent-primary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            ACTIVE
                          </span>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          <span style={{
                            fontFamily: 'var(--forge-font-heading)',
                            fontWeight: 700,
                            fontSize: 'var(--forge-text-2xl)',
                            color: 'var(--forge-accent-primary)',
                          }}>
                            1,299 Kc
                          </span>
                          <span style={{
                            fontSize: '13px',
                            color: 'var(--forge-text-muted)',
                            marginLeft: '4px',
                          }}>
                            / {language === 'cs' ? 'mesic' : 'month'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ ...forgePrimaryBtn, flex: 1 }}>
                          {t['billing.plan.change']}
                        </button>
                        <button style={forgeDangerOutlineBtn}>
                          {t['billing.plan.cancel']}
                        </button>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={forgeLabelStyles}>
                        {t['billing.payment.title']}
                      </h4>

                      <div style={{
                        padding: '14px',
                        borderRadius: 'var(--forge-radius-sm)',
                        border: '1px solid var(--forge-border-default)',
                        backgroundColor: 'var(--forge-bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <div style={{
                          width: '44px',
                          height: '30px',
                          borderRadius: 'var(--forge-radius-sm)',
                          backgroundColor: 'var(--forge-bg-overlay)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--forge-text-muted)',
                          flexShrink: 0,
                        }}>
                          <Icon name="CreditCard" size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--forge-text-primary)',
                          }}>
                            Visa {language === 'cs' ? 'koncici na' : 'ending in'} 4242
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)', marginTop: '2px' }}>
                            {t['billing.payment.expires']} 12/2025
                          </div>
                        </div>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--forge-accent-primary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontFamily: 'var(--forge-font-body)',
                        }}>
                          {language === 'cs' ? 'Upravit' : 'Edit'}
                        </button>
                      </div>

                      <button style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 'var(--forge-radius-sm)',
                        border: '2px dashed var(--forge-border-default)',
                        backgroundColor: 'transparent',
                        color: 'var(--forge-text-muted)',
                        fontFamily: 'var(--forge-font-body)',
                        fontWeight: 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                          e.currentTarget.style.color = 'var(--forge-accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                          e.currentTarget.style.color = 'var(--forge-text-muted)';
                        }}
                      >
                        <Icon name="Plus" size={16} />
                        {t['billing.payment.add']}
                      </button>
                    </div>
                  </div>
                </Card>

                <Card icon="FileText" title={t['billing.history.title']} index={1}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px',
                          borderRadius: 'var(--forge-radius-sm)',
                          transition: 'background-color 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--forge-radius-sm)',
                            backgroundColor: 'var(--forge-bg-overlay)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--forge-text-muted)',
                            flexShrink: 0,
                          }}>
                            <Icon name="FileText" size={16} />
                          </div>
                          <div>
                            <div style={{
                              fontWeight: 600,
                              fontSize: '14px',
                              color: 'var(--forge-text-primary)',
                            }}>
                              {language === 'cs' ? 'Faktura' : 'Invoice'} #{2024000 + item}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)', marginTop: '2px' }}>
                              1. {item === 1 ? (language === 'cs' ? 'prosince' : 'December') : item === 2 ? (language === 'cs' ? 'listopadu' : 'November') : (language === 'cs' ? 'rijna' : 'October')} 2024
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--forge-text-primary)',
                            fontFamily: 'var(--forge-font-tech)',
                          }}>
                            1,299 Kc
                          </div>
                          <button style={{
                            padding: '6px',
                            borderRadius: 'var(--forge-radius-sm)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--forge-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.15s',
                          }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--forge-accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--forge-text-muted)';
                            }}
                          >
                            <Icon name="Download" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountPage;
