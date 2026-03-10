import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { readCompanyData, writeCompanyData } from '@/utils/adminCompanyStorage';
import { readTenantJson } from '@/utils/adminTenantStorage';

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

/* ──────────────────────────────────────────────────────────────────────────
   Card entrance animation variants (needed by Card component)
   ────────────────────────────────────────────────────────────────────────── */

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
  })
};

/* ──────────────────────────────────────────────────────────────────────────
   Reusable FORGE Form Input (extracted, memoized)
   ────────────────────────────────────────────────────────────────────────── */

const FormInput = React.memo(({ icon, label, type = 'text', value, onChange, placeholder, readOnly = false, note, error }) => (
  <div style={{ marginBottom: '0px' }}>
    <label style={forgeLabelStyles}>
      {label}
      {note && (
        <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--forge-text-muted)', marginLeft: '6px', textTransform: 'none', letterSpacing: 'normal' }}>
          {note}
        </span>
      )}
    </label>
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
        readOnly={readOnly}
        style={{
          ...(icon ? forgeInputWithIconStyles : forgeInputStyles),
          ...(readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          ...(error ? { borderColor: 'var(--forge-error)', boxShadow: '0 0 0 2px rgba(255,71,87,0.15)' } : {}),
        }}
        onFocus={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = error ? 'var(--forge-error)' : 'var(--forge-accent-primary)';
            e.target.style.boxShadow = error ? '0 0 0 2px rgba(255,71,87,0.15)' : '0 0 0 2px rgba(0,212,170,0.15)';
          }
        }}
        onBlur={(e) => {
          if (!readOnly) {
            e.target.style.borderColor = error ? 'var(--forge-error)' : '';
            e.target.style.boxShadow = error ? '0 0 0 2px rgba(255,71,87,0.15)' : '';
          }
        }}
      />
    </div>
    {error && (
      <span style={{ fontSize: '11px', color: 'var(--forge-error)', marginTop: '4px', display: 'block' }}>
        {error}
      </span>
    )}
  </div>
));
FormInput.displayName = 'FormInput';

/* ──────────────────────────────────────────────────────────────────────────
   Reusable FORGE Card Component (extracted, memoized)
   ────────────────────────────────────────────────────────────────────────── */

const Card = React.memo(({ icon, title, children, index = 0, style = {} }) => (
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
));
Card.displayName = 'Card';

/* ════════════════════════════════════════════════════════════════════════ */

const AccountPage = () => {
  useDocumentTitle('Account');
  const { language } = useLanguage();
  const { currentUser, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile data — initialized from currentUser, edited locally, saved via updateProfile
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Company data — initialized from tenant storage on mount
  const [companyData, setCompanyData] = useState(() => readCompanyData());
  const [companyValidation, setCompanyValidation] = useState({});
  const [companySaving, setCompanySaving] = useState(false);

  // Subscription/billing data — read from tenant storage (namespace subscription:v1)
  const subscriptionData = useMemo(() => {
    const defaults = {
      plan: 'starter',
      status: 'active',
      priceMonthly: null,
      currency: 'CZK',
    };
    const stored = readTenantJson('subscription:v1', null);
    if (!stored || typeof stored !== 'object') return defaults;
    return { ...defaults, ...stored };
  }, []);

  // Plan display configuration
  const planConfig = useMemo(() => {
    const plans = {
      starter: {
        name: { cs: 'Starter tarif', en: 'Starter Plan' },
        price: { CZK: '499 Kc', USD: '$20', EUR: '18 EUR' },
        period: { cs: 'mesic', en: 'month' },
      },
      professional: {
        name: { cs: 'Professional tarif', en: 'Professional Plan' },
        price: { CZK: '1 999 Kc', USD: '$80', EUR: '74 EUR' },
        period: { cs: 'mesic', en: 'month' },
      },
      enterprise: {
        name: { cs: 'Enterprise tarif', en: 'Enterprise Plan' },
        price: { CZK: null, USD: null, EUR: null },
        period: { cs: 'mesic', en: 'month' },
      },
    };
    const key = (subscriptionData.plan || 'starter').toLowerCase();
    return plans[key] || plans.starter;
  }, [subscriptionData.plan]);

  // Sync profileData from currentUser on mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        firstName: currentUser.firstName || currentUser.displayName?.split(' ')[0] || '',
        lastName: currentUser.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field on change
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validate profile fields before save
  const validateProfile = useCallback(() => {
    const errors = {};
    if (!profileData.firstName.trim()) {
      errors.firstName = language === 'cs' ? 'Jmeno je povinne' : 'First name is required';
    }
    if (!profileData.lastName.trim()) {
      errors.lastName = language === 'cs' ? 'Prijmeni je povinne' : 'Last name is required';
    }
    // Phone: optional, but if filled must be valid format
    if (profileData.phone && !/^[+\d\s\-()]*$/.test(profileData.phone)) {
      errors.phone = language === 'cs' ? 'Neplatny format telefonu' : 'Invalid phone format';
    }
    return errors;
  }, [profileData.firstName, profileData.lastName, profileData.phone, language]);

  // Cancel edits — revert to currentUser data
  const handleCancelProfile = useCallback(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        firstName: currentUser.firstName || currentUser.displayName?.split(' ')[0] || '',
        lastName: currentUser.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      }));
    }
    setValidationErrors({});
  }, [currentUser]);

  // ── Company handlers ─────────────────────────────────────────────────
  const handleCompanyChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    if (companyValidation[field]) {
      setCompanyValidation(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateCompany = useCallback(() => {
    const errors = {};
    // companyName: optional, but if filled min 2 chars
    if (companyData.companyName && companyData.companyName.trim().length < 2) {
      errors.companyName = language === 'cs' ? 'Nazev firmy musi mit alespon 2 znaky' : 'Company name must be at least 2 characters';
    }
    // ICO: optional, but if filled must be exactly 8 digits
    if (companyData.ico && !/^\d{8}$/.test(companyData.ico.trim())) {
      errors.ico = language === 'cs' ? 'ICO musi byt presne 8 cislic' : 'Company ID must be exactly 8 digits';
    }
    // DIC: optional, but if filled must match 2 uppercase letters + 8-10 digits
    if (companyData.dic && !/^[A-Z]{2}\d{8,10}$/.test(companyData.dic.trim())) {
      errors.dic = language === 'cs' ? 'DIC musi zacinat 2 pismeny a 8-10 cislic (napr. CZ12345678)' : 'VAT ID must start with 2 letters and 8-10 digits (e.g. CZ12345678)';
    }
    // ZIP: optional, but if filled must be 3 digits + optional space + 2 digits
    if (companyData.zip && !/^\d{3}\s?\d{2}$/.test(companyData.zip.trim())) {
      errors.zip = language === 'cs' ? 'PSC musi byt ve formatu 110 00 nebo 11000' : 'ZIP must be in format 110 00 or 11000';
    }
    return errors;
  }, [companyData.companyName, companyData.ico, companyData.dic, companyData.zip, language]);

  const handleSaveCompany = () => {
    const errors = validateCompany();
    if (Object.keys(errors).length > 0) {
      setCompanyValidation(errors);
      showError(
        language === 'cs' ? 'Chyba validace' : 'Validation Error',
        language === 'cs' ? 'Opravte prosim zvyraznena pole' : 'Please fix the highlighted fields'
      );
      return;
    }

    setCompanySaving(true);
    try {
      writeCompanyData({
        companyName: companyData.companyName.trim(),
        ico: companyData.ico.trim(),
        dic: companyData.dic.trim(),
        address: companyData.address.trim(),
        city: companyData.city.trim(),
        zip: companyData.zip.trim(),
        country: companyData.country,
      });
      showSuccess(
        language === 'cs' ? 'Firma ulozena' : 'Company Saved',
        language === 'cs' ? 'Udaje o firme byly uspesne aktualizovany.' : 'Company information has been updated successfully.'
      );
      setCompanyValidation({});
    } catch (err) {
      showError(
        language === 'cs' ? 'Chyba pri ukladani' : 'Save Error',
        err.message || (language === 'cs' ? 'Nepodarilo se ulozit udaje o firme.' : 'Failed to save company information.')
      );
    } finally {
      setCompanySaving(false);
    }
  };

  const handleCancelCompany = useCallback(() => {
    setCompanyData(readCompanyData());
    setCompanyValidation({});
  }, []);

  const handleSaveProfile = async () => {
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showError(
        language === 'cs' ? 'Chyba validace' : 'Validation Error',
        language === 'cs' ? 'Opravte prosim zvyraznena pole' : 'Please fix the highlighted fields'
      );
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phone: profileData.phone.trim(),
        displayName: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
      });
      showSuccess(
        language === 'cs' ? 'Profil ulozen' : 'Profile Saved',
        language === 'cs' ? 'Vase osobni udaje byly uspesne aktualizovany.' : 'Your personal information has been updated successfully.'
      );
      setValidationErrors({});
    } catch (err) {
      showError(
        language === 'cs' ? 'Chyba pri ukladani' : 'Save Error',
        err.message || (language === 'cs' ? 'Nepodarilo se ulozit profil.' : 'Failed to save profile.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = language === 'cs' ? 'Zadejte soucasne heslo' : 'Enter current password';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = language === 'cs' ? 'Zadejte nove heslo' : 'Enter new password';
    } else if (getPasswordStrength(passwordData.newPassword).level < 75) {
      errors.newPassword = language === 'cs'
        ? 'Heslo musi byt alespon "Dobre" (8+ znaku, velke pismeno, cislo nebo specialni znak)'
        : 'Password must be at least "Good" (8+ chars, uppercase, number or special char)';
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = language === 'cs' ? 'Potvrdte nove heslo' : 'Confirm new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = language === 'cs' ? 'Hesla se neshoduji' : 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordSaving(true);
    setPasswordErrors({});
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSuccess(
        language === 'cs' ? 'Heslo zmeneno' : 'Password Changed',
        language === 'cs' ? 'Vase heslo bylo uspesne zmeneno.' : 'Your password has been changed successfully.'
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const code = err?.code || '';
      let msg;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = language === 'cs' ? 'Spatne aktualni heslo.' : 'Incorrect current password.';
      } else if (code === 'auth/weak-password') {
        msg = language === 'cs' ? 'Heslo je prilis slabe.' : 'Password is too weak.';
      } else if (code === 'auth/requires-recent-login') {
        msg = language === 'cs' ? 'Prihlaste se znovu a zkuste to znovu.' : 'Please log in again and try again.';
      } else if (code === 'auth/too-many-requests') {
        msg = language === 'cs' ? 'Prilis mnoho pokusu. Zkuste to pozdeji.' : 'Too many attempts. Please try again later.';
      } else {
        msg = err.message || (language === 'cs' ? 'Nepodarilo se zmenit heslo.' : 'Failed to change password.');
      }
      showError(
        language === 'cs' ? 'Chyba pri zmene hesla' : 'Password Change Error',
        msg
      );
    } finally {
      setPasswordSaving(false);
    }
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
    'billing.plan.name': planConfig.name[language === 'cs' ? 'cs' : 'en'],
    'billing.plan.change': language === 'cs' ? 'Zmenit tarif' : 'Change Plan',
    'billing.plan.cancel': language === 'cs' ? 'Zrusit predplatne' : 'Cancel Subscription',
    'billing.plan.active': language === 'cs' ? 'AKTIVNI' : 'ACTIVE',
    'billing.plan.custom': language === 'cs' ? 'Na miru' : 'Custom',
    'billing.plan.period': planConfig.period[language === 'cs' ? 'cs' : 'en'],
    'billing.payment.title': language === 'cs' ? 'Platebni metody' : 'Payment Methods',
    'billing.payment.none': language === 'cs' ? 'Zadne platebni metody nejsou nastaveny' : 'No payment methods configured',
    'billing.payment.add': language === 'cs' ? 'Pridat platebni metodu' : 'Add Payment Method',
    'billing.payment.expires': language === 'cs' ? 'Platnost do' : 'Expires',
    'billing.history.title': language === 'cs' ? 'Historie faktur' : 'Billing History',
    'billing.history.none': language === 'cs' ? 'Zatim zadne faktury' : 'No invoices yet',
    'billing.history.download': language === 'cs' ? 'Stahnout PDF' : 'Download PDF',
    'profile.email.readonly': language === 'cs' ? '(zmena pres Firebase konzoli)' : '(change via Firebase console)',
    'common.saving': language === 'cs' ? 'Ukladam...' : 'Saving...',
    'common.changingPassword': language === 'cs' ? 'Menim heslo...' : 'Changing password...',
    'security.googleOnly.title': language === 'cs' ? 'Prihlaseni pres Google' : 'Google Sign-In',
    'security.googleOnly.desc': language === 'cs'
      ? 'Vas ucet pouziva prihlaseni pres Google. Zmena hesla neni k dispozici — heslo spravuje Google.'
      : 'Your account uses Google Sign-In. Password change is not available — your password is managed by Google.',
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
                {(profileData.firstName || '?')[0]}{(profileData.lastName || '?')[0]}
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
          <div
            role="tablist"
            aria-label={t['account.title']}
            style={{
              display: 'flex',
              gap: '0',
              borderBottom: '1px solid var(--forge-border-default)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
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
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
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
                      error={validationErrors.firstName}
                    />
                    <FormInput
                      icon="User"
                      label={t['profile.lastName']}
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      placeholder={t['profile.lastName']}
                      error={validationErrors.lastName}
                    />
                    <FormInput
                      icon="Mail"
                      label={t['profile.email']}
                      type="email"
                      value={profileData.email}
                      readOnly
                      note={t['profile.email.readonly']}
                      placeholder={t['profile.email']}
                    />
                    <FormInput
                      icon="Phone"
                      label={t['profile.phone']}
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder={t['profile.phone']}
                      error={validationErrors.phone}
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
                    <button
                      onClick={handleCancelProfile}
                      style={forgeOutlineBtn}
                      disabled={saving}
                    >
                      {t['common.cancel']}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        ...forgePrimaryBtn,
                        ...(saving ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                      }}
                    >
                      {saving && <Icon name="Loader2" size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                      {saving ? t['common.saving'] : t['common.save']}
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
                      value={companyData.companyName}
                      onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                      placeholder={t['company.name']}
                      error={companyValidation.companyName}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <FormInput
                        label={t['company.ico']}
                        value={companyData.ico}
                        onChange={(e) => handleCompanyChange('ico', e.target.value)}
                        placeholder="12345678"
                        error={companyValidation.ico}
                      />
                      <FormInput
                        label={t['company.dic']}
                        value={companyData.dic}
                        onChange={(e) => handleCompanyChange('dic', e.target.value)}
                        placeholder="CZ12345678"
                        error={companyValidation.dic}
                      />
                    </div>
                  </div>
                </Card>

                <Card icon="MapPin" title={language === 'cs' ? 'Adresa' : 'Address'} index={1}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FormInput
                      icon="MapPin"
                      label={t['company.address']}
                      value={companyData.address}
                      onChange={(e) => handleCompanyChange('address', e.target.value)}
                      placeholder={t['company.address']}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <FormInput
                        label={t['company.city']}
                        value={companyData.city}
                        onChange={(e) => handleCompanyChange('city', e.target.value)}
                        placeholder={t['company.city']}
                      />
                      <FormInput
                        label={t['company.zip']}
                        value={companyData.zip}
                        onChange={(e) => handleCompanyChange('zip', e.target.value)}
                        placeholder="110 00"
                        error={companyValidation.zip}
                      />
                    </div>
                    <div>
                      <label style={forgeLabelStyles}>{t['company.country']}</label>
                      <select
                        value={companyData.country}
                        onChange={(e) => handleCompanyChange('country', e.target.value)}
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
                        <option value="CZ">{language === 'cs' ? 'Ceska republika' : 'Czech Republic'}</option>
                        <option value="SK">{language === 'cs' ? 'Slovensko' : 'Slovakia'}</option>
                        <option value="PL">{language === 'cs' ? 'Polsko' : 'Poland'}</option>
                        <option value="DE">{language === 'cs' ? 'Nemecko' : 'Germany'}</option>
                        <option value="AT">{language === 'cs' ? 'Rakousko' : 'Austria'}</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={handleCancelCompany}
                    style={forgeOutlineBtn}
                    disabled={companySaving}
                  >
                    {t['common.cancel']}
                  </button>
                  <button
                    onClick={handleSaveCompany}
                    disabled={companySaving}
                    style={{
                      ...forgePrimaryBtn,
                      ...(companySaving ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                    }}
                  >
                    {companySaving && <Icon name="Loader2" size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {companySaving ? t['common.saving'] : t['common.save']}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ SECURITY TAB ═══ */}
            {activeTab === 'security' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <Card icon="Key" title={t['security.title']} index={0}>
                  {currentUser?.authProvider === 'google' ? (
                    /* Google-only accounts cannot change password */
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: 'var(--forge-radius-sm)',
                      backgroundColor: 'rgba(77,168,218,0.08)',
                      border: '1px solid rgba(77,168,218,0.2)',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--forge-radius-sm)',
                        backgroundColor: 'rgba(77,168,218,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--forge-info)',
                        flexShrink: 0,
                      }}>
                        <Icon name="Info" size={18} />
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: 'var(--forge-text-primary)',
                          marginBottom: '4px',
                        }}>
                          {t['security.googleOnly.title']}
                        </div>
                        <p style={{
                          fontSize: '13px',
                          color: 'var(--forge-text-secondary)',
                          margin: 0,
                          lineHeight: '1.5',
                        }}>
                          {t['security.googleOnly.desc']}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Email/password accounts — password change form */
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <FormInput
                          icon="Lock"
                          label={t['security.current']}
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="--------"
                          error={passwordErrors.currentPassword}
                        />
                        <div>
                          <FormInput
                            icon="Key"
                            label={t['security.new']}
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            placeholder="--------"
                            error={passwordErrors.newPassword}
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
                          error={passwordErrors.confirmPassword}
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
                          disabled={passwordSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          style={{
                            ...forgePrimaryBtn,
                            ...((passwordSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword)
                              ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                          }}
                        >
                          {passwordSaving && <Icon name="Loader2" size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                          {passwordSaving ? t['common.changingPassword'] : t['common.change']}
                        </button>
                      </div>
                    </>
                  )}
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
                    {/* Current Plan — reads from tenant storage subscription:v1 */}
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
                            backgroundColor: subscriptionData.status === 'active' ? 'rgba(0,212,170,0.1)' : 'rgba(255,181,71,0.1)',
                            color: subscriptionData.status === 'active' ? 'var(--forge-accent-primary)' : 'var(--forge-warning)',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {t['billing.plan.active']}
                          </span>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          {(() => {
                            const currency = subscriptionData.currency || 'CZK';
                            const priceDisplay = subscriptionData.priceMonthly
                              ? `${subscriptionData.priceMonthly} ${currency}`
                              : planConfig.price[currency] || planConfig.price.CZK;
                            const isEnterprise = (subscriptionData.plan || 'starter').toLowerCase() === 'enterprise';
                            return (
                              <>
                                <span style={{
                                  fontFamily: 'var(--forge-font-heading)',
                                  fontWeight: 700,
                                  fontSize: 'var(--forge-text-2xl)',
                                  color: 'var(--forge-accent-primary)',
                                }}>
                                  {isEnterprise && !subscriptionData.priceMonthly
                                    ? t['billing.plan.custom']
                                    : priceDisplay}
                                </span>
                                {!isEnterprise && (
                                  <span style={{
                                    fontSize: '13px',
                                    color: 'var(--forge-text-muted)',
                                    marginLeft: '4px',
                                  }}>
                                    / {t['billing.plan.period']}
                                  </span>
                                )}
                              </>
                            );
                          })()}
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

                    {/* Payment Methods — placeholder (no real payment integration yet) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={forgeLabelStyles}>
                        {t['billing.payment.title']}
                      </h4>

                      <div style={{
                        padding: '24px 14px',
                        borderRadius: 'var(--forge-radius-sm)',
                        border: '1px solid var(--forge-border-default)',
                        backgroundColor: 'var(--forge-bg-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--forge-radius-md)',
                          backgroundColor: 'var(--forge-bg-overlay)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--forge-text-muted)',
                        }}>
                          <Icon name="CreditCard" size={22} />
                        </div>
                        <p style={{
                          fontSize: '13px',
                          color: 'var(--forge-text-muted)',
                          margin: 0,
                          textAlign: 'center',
                        }}>
                          {t['billing.payment.none']}
                        </p>
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
                  <div style={{
                    padding: '32px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--forge-radius-md)',
                      backgroundColor: 'var(--forge-bg-overlay)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--forge-text-muted)',
                    }}>
                      <Icon name="FileText" size={24} />
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--forge-text-muted)',
                      margin: 0,
                      textAlign: 'center',
                    }}>
                      {t['billing.history.none']}
                    </p>
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
