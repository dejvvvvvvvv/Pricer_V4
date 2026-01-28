import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import BackgroundPattern from '../../components/ui/BackgroundPattern';

const AccountPage = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock data pro vývoj
  const [profileData, setProfileData] = useState({
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@example.com',
    phone: '+420 123 456 789',
    company: 'ModelPricer s.r.o.',
    ico: '12345678',
    dic: 'CZ12345678',
    address: 'Hlavní 123',
    city: 'Praha',
    zip: '110 00',
    country: 'Česká republika'
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
    alert(language === 'cs' ? '✅ Profil uložen!' : '✅ Profile saved!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(language === 'cs' ? '❌ Hesla se neshodují!' : '❌ Passwords do not match!');
      return;
    }
    console.log('Changing password');
    alert(language === 'cs' ? '✅ Heslo změněno!' : '✅ Password changed!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '', color: 'bg-gray-200' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { level: 25, text: language === 'cs' ? 'Slabé' : 'Weak', color: 'bg-red-500' };
    if (strength === 2) return { level: 50, text: language === 'cs' ? 'Střední' : 'Medium', color: 'bg-yellow-500' };
    if (strength === 3) return { level: 75, text: language === 'cs' ? 'Dobré' : 'Good', color: 'bg-blue-500' };
    return { level: 100, text: language === 'cs' ? 'Silné' : 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const t = {
    'account.title': language === 'cs' ? 'Nastavení účtu' : 'Account Settings',
    'account.subtitle': language === 'cs' ? 'Spravujte informace o účtu a předvolby' : 'Manage your account information and preferences',
    'tab.profile': language === 'cs' ? 'Profil' : 'Profile',
    'tab.company': language === 'cs' ? 'Firma' : 'Company',
    'tab.security': language === 'cs' ? 'Zabezpečení' : 'Security',
    'profile.title': language === 'cs' ? 'Osobní informace' : 'Personal Information',
    'profile.firstName': language === 'cs' ? 'Jméno' : 'First Name',
    'profile.lastName': language === 'cs' ? 'Příjmení' : 'Last Name',
    'profile.email': language === 'cs' ? 'Emailová adresa' : 'Email Address',
    'profile.phone': language === 'cs' ? 'Telefonní číslo' : 'Phone Number',
    'company.title': language === 'cs' ? 'Informace o firmě' : 'Company Information',
    'company.name': language === 'cs' ? 'Název firmy' : 'Company Name',
    'company.ico': language === 'cs' ? 'IČO' : 'Company ID',
    'company.dic': language === 'cs' ? 'DIČ' : 'VAT ID',
    'company.address': language === 'cs' ? 'Adresa' : 'Address',
    'company.city': language === 'cs' ? 'Město' : 'City',
    'company.zip': language === 'cs' ? 'PSČ' : 'ZIP Code',
    'company.country': language === 'cs' ? 'Země' : 'Country',
    'security.title': language === 'cs' ? 'Změnit heslo' : 'Change Password',
    'security.current': language === 'cs' ? 'Současné heslo' : 'Current Password',
    'security.new': language === 'cs' ? 'Nové heslo' : 'New Password',
    'security.confirm': language === 'cs' ? 'Potvrdit nové heslo' : 'Confirm New Password',
    'security.2fa.title': language === 'cs' ? 'Dvoufaktorové ověření' : 'Two-Factor Authentication',
    'security.2fa.desc': language === 'cs' ? 'Přidejte další vrstvu zabezpečení k vašemu účtu' : 'Add an extra layer of security to your account',
    'security.2fa.enable': language === 'cs' ? 'Zapnout 2FA' : 'Enable 2FA',
    'security.sessions.title': language === 'cs' ? 'Aktivní relace' : 'Active Sessions',
    'security.sessions.desc': language === 'cs' ? 'Spravujte zařízení, na kterých jste přihlášeni' : 'Manage devices where you\'re currently logged in',
    'security.sessions.current': language === 'cs' ? 'Toto zařízení' : 'This device',
    'common.cancel': language === 'cs' ? 'Zrušit' : 'Cancel',
    'common.save': language === 'cs' ? 'Uložit změny' : 'Save Changes',
    'common.change': language === 'cs' ? 'Změnit heslo' : 'Change Password',
    'tab.billing': language === 'cs' ? 'Fakturace' : 'Billing',
    'billing.title': language === 'cs' ? 'Fakturace a předplatné' : 'Billing & Subscription',
    'billing.plan.title': language === 'cs' ? 'Aktuální tarif' : 'Current Plan',
    'billing.plan.name': language === 'cs' ? 'Professional tarif' : 'Professional Plan',
    'billing.plan.change': language === 'cs' ? 'Změnit tarif' : 'Change Plan',
    'billing.plan.cancel': language === 'cs' ? 'Zrušit předplatné' : 'Cancel Subscription',
    'billing.payment.title': language === 'cs' ? 'Platební metody' : 'Payment Methods',
    'billing.payment.add': language === 'cs' ? 'Přidat platební metodu' : 'Add Payment Method',
    'billing.payment.expires': language === 'cs' ? 'Platnost do' : 'Expires',
    'billing.history.title': language === 'cs' ? 'Historie faktur' : 'Billing History',
    'billing.history.download': language === 'cs' ? 'Stáhnout PDF' : 'Download PDF',
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

  // Reusable Input Component
  const FormInput = ({ icon, label, type = 'text', value, onChange, placeholder }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name={icon} size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-slate-300`}
        />
      </div>
    </div>
  );

  // Card Component
  const Card = ({ icon, title, children, index = 0, className = '' }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon name={icon} size={20} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative">
      <BackgroundPattern />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30">
                {profileData.firstName[0]}{profileData.lastName[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-primary transition-colors border border-slate-100">
                <Icon name="Camera" size={14} />
              </button>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t['account.title']}</h1>
              <p className="text-slate-500 mt-1">{t['account.subtitle']}</p>
            </div>
          </div>
        </motion.div>

        {/* Pill Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="inline-flex p-1.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'text-white' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-violet-600 rounded-xl shadow-lg shadow-primary/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon name={tab.icon} size={18} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card icon="User" title={t['profile.title']} index={0} className="md:col-span-2">
                  <div className="grid gap-5 sm:grid-cols-2">
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
                  
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                      {t['common.cancel']}
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {t['common.save']}
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* COMPANY TAB */}
            {activeTab === 'company' && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card icon="Building2" title={language === 'cs' ? 'Základní údaje' : 'Basic Info'} index={0}>
                  <div className="space-y-5">
                    <FormInput
                      icon="Building2"
                      label={t['company.name']}
                      value={profileData.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                      placeholder={t['company.name']}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-5">
                    <FormInput
                      icon="MapPin"
                      label={t['company.address']}
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      placeholder={t['company.address']}
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">{t['company.country']}</label>
                      <select
                        value={profileData.country}
                        onChange={(e) => handleProfileChange('country', e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-slate-300 appearance-none cursor-pointer"
                      >
                        <option>Česká republika</option>
                        <option>Slovensko</option>
                        <option>Polsko</option>
                        <option>Německo</option>
                        <option>Rakousko</option>
                      </select>
                    </div>
                  </div>
                </Card>
                
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                    {t['common.cancel']}
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {t['common.save']}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card icon="Key" title={t['security.title']} index={0}>
                  <div className="space-y-5">
                    <FormInput
                      icon="Lock"
                      label={t['security.current']}
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="••••••••"
                    />
                    <div>
                      <FormInput
                        icon="Key"
                        label={t['security.new']}
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                      {passwordData.newPassword && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{language === 'cs' ? 'Síla hesla' : 'Password strength'}</span>
                            <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.text}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.level}%` }}
                              className={`h-full ${passwordStrength.color} rounded-full`}
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
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button 
                      onClick={handleChangePassword}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {t['common.change']}
                    </button>
                  </div>
                </Card>
                
                <div className="space-y-6">
                  <Card icon="ShieldCheck" title={t['security.2fa.title']} index={1}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{t['security.2fa.desc']}</p>
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                        {t['security.2fa.enable']}
                      </button>
                    </div>
                  </Card>
                  
                  <Card icon="Monitor" title={t['security.sessions.title']} index={2}>
                    <p className="text-sm text-slate-500 mb-4">{t['security.sessions.desc']}</p>
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <Icon name="Monitor" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Windows PC - Chrome</div>
                        <div className="text-xs text-slate-500">{language === 'cs' ? 'Praha, Česká republika' : 'Prague, Czech Republic'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        {t['security.sessions.current']}
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card icon="CreditCard" title={t['billing.title']} index={0} className="md:col-span-2">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Current Plan */}
                    <div className="flex-1 space-y-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t['billing.plan.title']}</h4>
                             <div className="text-2xl font-bold text-slate-900 mt-1">{t['billing.plan.name']}</div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">ACTIVE</span>
                        </div>
                        <div className="text-3xl font-bold text-primary mt-4">1,299 Kč <span className="text-sm font-normal text-slate-500">/ měsíc</span></div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                          {t['billing.plan.change']}
                        </button>
                        <button className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors">
                          {t['billing.plan.cancel']}
                        </button>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex-1 space-y-4">
                       <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t['billing.payment.title']}</h4>
                       
                       <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-4">
                          <div className="w-12 h-8 rounded bg-slate-100 flex items-center justify-center">
                            <Icon name="CreditCard" size={20} className="text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">Visa končící na 4242</div>
                            <div className="text-xs text-slate-500">{t['billing.payment.expires']} 12/2025</div>
                          </div>
                          <button className="text-sm font-medium text-primary hover:text-primary/80">Upravit</button>
                       </div>

                       <button className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                          <Icon name="Plus" size={18} />
                          {t['billing.payment.add']}
                       </button>
                    </div>
                  </div>
                </Card>

                <Card icon="FileText" title={t['billing.history.title']} index={1} className="md:col-span-2">
                  <div className="space-y-1">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <Icon name="FileText" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">Faktura #{2024000 + item}</div>
                            <div className="text-xs text-slate-500">1. {item === 1 ? 'prosince' : item === 2 ? 'listopadu' : 'října'} 2024</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-medium text-slate-900">1,299 Kč</div>
                          <button className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
                            <Icon name="Download" size={18} />
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
