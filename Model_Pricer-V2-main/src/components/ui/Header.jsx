import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../AppIcon';
import Button from './Button';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const langMenuRef = useRef(null);
  const langToggleBtnRef = useRef(null);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // zavřít dropdown při kliknutí mimo
  useEffect(() => {
    function onDocClick(e) {
      const el = e.target;
      
      // User menu
      if (userMenuOpen) {
        if (!menuRef.current?.contains(el) && !toggleBtnRef.current?.contains(el)) {
          setUserMenuOpen(false);
        }
      }
      
      // Language menu
      if (langMenuOpen) {
        if (!langMenuRef.current?.contains(el) && !langToggleBtnRef.current?.contains(el)) {
          setLangMenuOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [userMenuOpen, langMenuOpen]);

  // zavřít dropdown při změně trasy
  useEffect(() => {
    if (userMenuOpen) setUserMenuOpen(false);
    if (langMenuOpen) setLangMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // lock scroll when mobile drawer is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

  // close drawer on ESC
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  const handleToggleUserMenu = () => setUserMenuOpen(v => !v);
  const handleToggleLangMenu = () => setLangMenuOpen(v => !v);

  async function handleSignOut() {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (e) {
      console.error('Sign out failed:', e);
      alert('Nepodařilo se odhlásit. Zkuste to prosím znovu.');
    }
  }

  const isLoggedIn = !!auth.currentUser;

  const navItems = [
    { label: t('nav.home'), path: '/', icon: 'Home' },
    { label: t('nav.demo'), path: '/model-upload', icon: 'Calculator' },
    { label: 'Test Kalkulačka', path: '/test-kalkulacka', icon: 'TestTube' },
    { label: t('nav.pricing'), path: '/pricing', icon: 'DollarSign' },
    { label: t('nav.support'), path: '/support', icon: 'HelpCircle' },
    { label: t('nav.admin'), path: '/admin', icon: 'Settings' },
  ];

  const languages = [
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    // Připraveno pro budoucí jazyky:
    // { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    // { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const isActivePath = (path) => {
    if (path === '/') {
      return location?.pathname === '/';
    }
    return location?.pathname === path || location?.pathname?.startsWith(path + '/');
  };

  const Logo = () => (
    <Link to="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Icon name="Layers3" size={20} color="white" />
      </div>
      <span className="text-xl font-semibold text-foreground">ModelPricer</span>
    </Link>
  );

  return (
    <header className="sticky top-0 left-0 right-0 z-1000 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-b border-border elevation-2">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-micro hover-scale ${
                  isActivePath(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item?.icon} size={16} />
                <span>{item?.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                ref={langToggleBtnRef}
                onClick={handleToggleLangMenu}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition text-sm font-medium"
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
              >
                <span className="text-lg">{currentLanguage?.flag}</span>
                <span>{currentLanguage?.code.toUpperCase()}</span>
                <Icon name="ChevronDown" size={14} />
              </button>

              {/* Language Dropdown Menu */}
              {langMenuOpen && (
                <div
                  ref={langMenuRef}
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-popover text-popover-foreground shadow-card overflow-hidden z-50"
                >
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        role="menuitem"
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition ${
                          language === lang.code ? 'bg-muted font-medium' : ''
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {language === lang.code && (
                          <Icon name="Check" size={16} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
                >
                  {t('nav.login')}
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/register';
                  }}
                >
                  {t('nav.register')}
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                iconName="Upload"
                iconPosition="left"
                onClick={() => {
                  window.location.href = '/model-upload';
                }}
              >
                Upload Model
              </Button>
            )}

            {/* User Menu (split: Link + Button) */}
            <div className="relative flex items-center gap-1">
              {/* Link na účet = ikona + text */}
              <Link
                to="/account"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted transition"
              >
                <span className="w-8 h-8 bg-muted rounded-full inline-flex items-center justify-center">
                  <Icon name="User" size={16} />
                </span>
                <span className="text-sm font-medium">{t('nav.account')}</span>
              </Link>

              {/* Chevron = samostatné tlačítko pro otevření dropdownu */}
              <button
                ref={toggleBtnRef}
                type="button"
                onClick={handleToggleUserMenu}
                className="inline-flex items-center rounded-lg p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-micro"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-controls="user-menu"
                aria-label="Otevřít uživatelské menu"
              >
                <Icon name="ChevronDown" size={16} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  id="user-menu"
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-card overflow-hidden z-50"
                >
                  {isLoggedIn ? (
                    <div className="py-1">
                      <Link
                        to="/account"
                        role="menuitem"
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.account')}
                      </Link>
                      <button
                        role="menuitem"
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                        onClick={handleSignOut}
                      >
                        {t('nav.logout')}
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <Link
                        to="/login"
                        role="menuitem"
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        to="/register"
                        role="menuitem"
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.register')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-micro rounded-lg hover:bg-muted"
            aria-label="Open menu"
          >
            <Icon name={'Menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[1100] md:hidden"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Overlay */}
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            />

            {/* Panel */}
            <motion.div
              className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-card border-l border-border shadow-2xl"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <Logo />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-micro"
                aria-label="Close menu"
              >
                <Icon name="X" size={22} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)]">
              <nav className="space-y-2">
                {navItems?.map((item) => (
                  <Link
                    key={item?.path}
                    to={item?.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-micro ${
                      isActivePath(item?.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon name={item?.icon} size={18} />
                    <span>{item?.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="h-px bg-border" />

              {/* Mobile Actions */}
              <div className="space-y-3">
                <Button
                  variant="default"
                  fullWidth
                  iconName="Upload"
                  iconPosition="left"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.location.href = '/model-upload';
                  }}
                >
                  Upload Model
                </Button>

                <div className="flex items-center justify-center px-4 py-2">
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                      <Icon name="User" size={16} />
                    </div>
                    <span className="text-sm font-medium">{t('nav.account')}</span>
                  </Link>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Tip: zavřeš i kliknutím mimo panel.
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
