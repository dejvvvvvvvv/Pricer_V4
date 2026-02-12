import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getBranding,
  getDefaultBranding,
  getPlanFeatures,
  saveBranding,
} from '../../utils/adminBrandingWidgetStorage';

const AdminBranding = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const customerId = 'test-customer-1'; // TODO: Get from auth/context

  // Plan features (Varianta A: local storage seed)
  const [plan, setPlan] = useState(null);

  // Track baseline for "dirty state"
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  // Simple inline validation
  const [errors, setErrors] = useState({});

  // Logo draft (user picked file but not yet applied)
  const [logoDraft, setLogoDraft] = useState(null);
  const [logoDraftPreview, setLogoDraftPreview] = useState(null);
  const [logoDraftError, setLogoDraftError] = useState(null);
  const logoInputRef = useRef(null);

  // State for branding data
  const [branding, setBranding] = useState({
    businessName: '',
    tagline: '',
    logo: null,
    primaryColor: '#2563EB',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
    showLogo: true,
    showBusinessName: true,
    showTagline: true,
    showPoweredBy: true,
    cornerRadius: 12
  });

  const pickEditable = (b) => ({
    businessName: b?.businessName ?? '',
    tagline: b?.tagline ?? '',
    logo: b?.logo ?? null,
    primaryColor: b?.primaryColor ?? '#2563EB',
    secondaryColor: b?.secondaryColor ?? '#10B981',
    backgroundColor: b?.backgroundColor ?? '#FFFFFF',
    fontFamily: b?.fontFamily ?? 'Inter',
    showLogo: !!b?.showLogo,
    showBusinessName: !!b?.showBusinessName,
    showTagline: !!b?.showTagline,
    showPoweredBy: !!b?.showPoweredBy,
    cornerRadius: typeof b?.cornerRadius === 'number' ? b.cornerRadius : 12,
  });

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(pickEditable(branding)) !== JSON.stringify(pickEditable(savedSnapshot));
  }, [branding, savedSnapshot]);

  useEffect(() => {
    // Load from local storage (Varianta A)
    try {
      setLoading(true);
      const p = getPlanFeatures(customerId);
      setPlan(p);
      const loaded = getBranding(customerId);
      setBranding(loaded);
      setSavedSnapshot(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Validate live
    const nextErrors = {};

    const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test((v || '').trim());
    if (!branding.businessName || branding.businessName.trim().length < 2) {
      nextErrors.businessName = 'Zadej alespon 2 znaky.';
    }
    if (!isHex(branding.primaryColor)) nextErrors.primaryColor = 'Pouzij HEX ve formatu #RRGGBB.';
    if (!isHex(branding.secondaryColor)) nextErrors.secondaryColor = 'Pouzij HEX ve formatu #RRGGBB.';
    if (!isHex(branding.backgroundColor)) nextErrors.backgroundColor = 'Pouzij HEX ve formatu #RRGGBB.';

    const r = Number(branding.cornerRadius);
    if (Number.isNaN(r) || r < 0 || r > 24) {
      nextErrors.cornerRadius = 'Zaobleni musi byt v rozsahu 0-24.';
    }

    setErrors(nextErrors);
  }, [branding]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (Object.keys(errors).length > 0) {
        alert('Oprav prosim chyby ve formulari (cervene).');
        return;
      }

      const readAsDataUrl = (f) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });

      const rasterToOptimizedDataUrl = async (f) => {
        // Keep SVG untouched.
        if (f.type === 'image/svg+xml') return await readAsDataUrl(f);
        try {
          const MAX = 512;
          const bitmap = await createImageBitmap(f);
          const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
          const w = Math.max(1, Math.round(bitmap.width * scale));
          const h = Math.max(1, Math.round(bitmap.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(bitmap, 0, 0, w, h);
          // Try WEBP first (small), fallback to PNG.
          const webp = canvas.toDataURL('image/webp', 0.92);
          if (webp && typeof webp === 'string' && webp.startsWith('data:image')) return webp;
          return canvas.toDataURL('image/png');
        } catch {
          return await readAsDataUrl(f);
        }
      };

      // If user selected a logo file but didn't click "Pouzit", auto-apply it on Save.
      const brandingToSave = { ...branding };
      if (logoDraft) {
        const dataUrl = await rasterToOptimizedDataUrl(logoDraft);
        brandingToSave.logo = dataUrl;
      }

      const saved = saveBranding(customerId, pickEditable(brandingToSave), 'admin');
      setBranding(saved);
      setSavedSnapshot(saved);
      if (logoDraftPreview) URL.revokeObjectURL(logoDraftPreview);
      setLogoDraft(null);
      setLogoDraftPreview(null);
      setLogoDraftError(null);
      alert('Branding ulozen.');
    } catch (e) {
      console.error(e);
      alert('Ulozeni se nepodarilo.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    // Reset in UI only (requires Save) - per spec.
    const defaults = getDefaultBranding();
    // Enforce plan gating for Powered by
    const canHide = !!plan?.features?.can_hide_powered_by;
    if (!canHide) defaults.showPoweredBy = true;
    setBranding(defaults);
  };

  const enforcePoweredBy = useMemo(() => {
    const canHide = !!plan?.features?.can_hide_powered_by;
    return { canHide, poweredByRequired: !canHide };
  }, [plan]);

  useEffect(() => {
    // Hard-enforce required Powered by in the UI (backend enforcement is mirrored in storage helper)
    if (enforcePoweredBy.poweredByRequired && branding.showPoweredBy !== true) {
      setBranding((prev) => ({ ...prev, showPoweredBy: true }));
    }
  }, [enforcePoweredBy.poweredByRequired]);

  const startLogoDraftFromFile = (file) => {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setLogoDraftError('Nepodporovany format. Pouzij PNG/JPG/SVG/WEBP.');
      setLogoDraft(null);
      setLogoDraftPreview(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoDraftError('Soubor je prilis velky (max 2 MB).');
      setLogoDraft(null);
      setLogoDraftPreview(null);
      return;
    }
    setLogoDraftError(null);
    setLogoDraft(file);
    const url = URL.createObjectURL(file);
    setLogoDraftPreview(url);
  };

  const applyLogoDraft = async () => {
    if (!logoDraft) return;
    try {
      const readAsDataUrl = (f) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });

      const rasterToOptimizedDataUrl = async (f) => {
        if (f.type === 'image/svg+xml') return await readAsDataUrl(f);
        try {
          const MAX = 512;
          const bitmap = await createImageBitmap(f);
          const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
          const w = Math.max(1, Math.round(bitmap.width * scale));
          const h = Math.max(1, Math.round(bitmap.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(bitmap, 0, 0, w, h);
          const webp = canvas.toDataURL('image/webp', 0.92);
          if (webp && typeof webp === 'string' && webp.startsWith('data:image')) return webp;
          return canvas.toDataURL('image/png');
        } catch {
          return await readAsDataUrl(f);
        }
      };

      const dataUrl = await rasterToOptimizedDataUrl(logoDraft);
      setBranding({ ...branding, logo: dataUrl });
      setLogoDraft(null);
      if (logoDraftPreview) URL.revokeObjectURL(logoDraftPreview);
      setLogoDraftPreview(null);
    } catch (e) {
      console.error(e);
      setLogoDraftError('Logo se nepodarilo nacist. Zkus to prosim znovu.');
    }
  };

  const removeLogo = () => {
    if (logoDraftPreview) URL.revokeObjectURL(logoDraftPreview);
    setLogoDraft(null);
    setLogoDraftPreview(null);
    setLogoDraftError(null);
    setBranding({ ...branding, logo: null });
  };

  const colorPresets = [
    { name: 'Blue', primary: '#2563EB', secondary: '#10B981', background: '#FFFFFF' },
    { name: 'Green', primary: '#10B981', secondary: '#F59E0B', background: '#FFFFFF' },
    { name: 'Purple', primary: '#7C3AED', secondary: '#EC4899', background: '#FFFFFF' },
    { name: 'Orange', primary: '#F97316', secondary: '#10B981', background: '#FFFFFF' }
  ];

  const fonts = ['Inter', 'Roboto', 'Poppins', 'Open Sans'];

  const handleColorPreset = (preset) => {
    setBranding({
      ...branding,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      backgroundColor: preset.background
    });
  };

  /* ---- FORGE Style Objects ---- */

  const styles = {
    page: {
      maxWidth: 1400,
    },
    pageHeader: {
      marginBottom: 32,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    h1: {
      margin: '0 0 8px 0',
      fontSize: 'var(--forge-text-2xl)',
      fontWeight: 700,
      fontFamily: 'var(--forge-font-heading)',
      color: 'var(--forge-text-primary)',
    },
    subtitle: {
      margin: 0,
      fontSize: 'var(--forge-text-base)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-muted)',
    },
    headerActions: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 999,
      fontFamily: 'var(--forge-font-mono)',
      fontSize: 11,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    statusDirty: {
      backgroundColor: 'rgba(255,181,71,0.12)',
      color: 'var(--forge-warning)',
    },
    statusSaved: {
      backgroundColor: 'rgba(0,212,170,0.12)',
      color: 'var(--forge-success)',
    },
    statusError: {
      backgroundColor: 'rgba(255,71,87,0.12)',
      color: 'var(--forge-error)',
    },
    saveStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    unsavedBanner: {
      marginBottom: 24,
      padding: '12px 16px',
      backgroundColor: 'rgba(255,181,71,0.08)',
      border: '1px solid rgba(255,181,71,0.2)',
      borderRadius: 'var(--forge-radius-md)',
      color: 'var(--forge-warning)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
      marginBottom: 24,
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    },
    section: {
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      padding: 24,
    },
    sectionTitle: {
      margin: '0 0 20px 0',
      fontSize: 'var(--forge-text-xl)',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-heading)',
      color: 'var(--forge-text-primary)',
      paddingBottom: 12,
      borderBottom: '1px solid var(--forge-border-default)',
    },
    formGroup: {
      marginBottom: 20,
    },
    formGroupLast: {
      marginBottom: 0,
    },
    label: {
      display: 'block',
      marginBottom: 8,
      fontFamily: 'var(--forge-font-tech)',
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--forge-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-primary)',
      outline: 'none',
      transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
      boxSizing: 'border-box',
    },
    inputError: {
      borderColor: 'var(--forge-error)',
      boxShadow: '0 0 0 2px rgba(255,71,87,0.15)',
    },
    helpText: {
      margin: '6px 0 0 0',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-muted)',
    },
    errorText: {
      margin: '6px 0 0 0',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-error)',
    },
    sectionHeadRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingBottom: 12,
      borderBottom: '1px solid var(--forge-border-default)',
      marginBottom: 12,
    },
    btnTertiary: {
      padding: '8px 12px',
      border: '1px solid var(--forge-border-active)',
      backgroundColor: 'var(--forge-bg-elevated)',
      borderRadius: 'var(--forge-radius-md)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 13,
      color: 'var(--forge-text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    },
    helpCallout: {
      margin: '0 0 16px 0',
      padding: '12px 14px',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 13,
      color: 'var(--forge-text-secondary)',
      lineHeight: 1.4,
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 20,
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    },
    checkboxSpan: {
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-secondary)',
    },
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 8px',
      borderRadius: 999,
      fontFamily: 'var(--forge-font-mono)',
      fontSize: 10,
      fontWeight: 600,
      backgroundColor: 'rgba(108,99,255,0.12)',
      color: 'var(--forge-accent-tertiary)',
      letterSpacing: '0.05em',
    },
    currentLogo: {
      display: 'flex',
      gap: 16,
      marginBottom: 16,
    },
    logoPreview: {
      width: 120,
      height: 120,
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--forge-bg-elevated)',
      color: 'var(--forge-text-muted)',
    },
    logoInfo: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 4,
    },
    logoInfoP: {
      margin: 0,
      fontFamily: 'var(--forge-font-body)',
      fontSize: 13,
      color: 'var(--forge-text-muted)',
    },
    uploadArea: {
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '2px dashed var(--forge-border-active)',
      borderRadius: 'var(--forge-radius-md)',
      padding: 32,
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: 16,
    },
    uploadAreaP: {
      margin: '8px 0 0 0',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-secondary)',
    },
    uploadHint: {
      margin: '8px 0 0 0',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-sm)',
      color: 'var(--forge-text-muted)',
    },
    uploadActions: {
      display: 'flex',
      gap: 12,
    },
    colorInputGroup: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 'var(--forge-radius-lg)',
      border: '1px solid var(--forge-border-default)',
      flexShrink: 0,
    },
    colorPresets: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
    },
    presetBtn: {
      padding: '8px 16px',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    fontOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    },
    radioSpan: {
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-secondary)',
    },
    stickyPreview: {
      position: 'sticky',
      top: 24,
    },
    calculatorPreview: {
      border: '1px solid var(--forge-border-default)',
      borderRadius: 12,
      padding: 24,
      minHeight: 400,
    },
    previewHeader: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    previewLogo: {
      width: 48,
      height: 48,
      borderRadius: 'var(--forge-radius-lg)',
      backgroundColor: 'var(--forge-bg-elevated)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--forge-text-muted)',
    },
    previewH4: {
      margin: 0,
      fontSize: 18,
      fontWeight: 600,
      color: '#111827',
    },
    previewSubtitle: {
      margin: '4px 0 0 0',
      fontSize: 13,
      color: '#6B7280',
    },
    previewDivider: {
      height: 1,
      backgroundColor: '#E5E7EB',
      margin: '16px 0',
    },
    previewForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    previewFieldLabel: {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 500,
      color: '#374151',
    },
    previewInput: {
      padding: '10px 12px',
      border: '1px solid #D1D5DB',
      fontSize: 14,
      color: '#6B7280',
    },
    previewButton: {
      padding: '12px 24px',
      color: 'white',
      border: 'none',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: 8,
    },
    previewFooter: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid #E5E7EB',
      textAlign: 'center',
    },
    previewFooterSmall: {
      fontSize: 11,
      color: '#9CA3AF',
    },
    btnPrimary: {
      padding: '10px 28px',
      backgroundColor: 'var(--forge-accent-primary)',
      color: '#08090C',
      border: 'none',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-heading)',
      fontSize: 'var(--forge-text-base)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    btnPrimaryDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    btnSecondary: {
      padding: '10px 20px',
      backgroundColor: 'transparent',
      color: 'var(--forge-text-secondary)',
      border: '1px solid var(--forge-border-active)',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-heading)',
      fontSize: 'var(--forge-text-base)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    btnDanger: {
      padding: '10px 20px',
      backgroundColor: 'transparent',
      color: 'var(--forge-error)',
      border: '1px solid var(--forge-error)',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-heading)',
      fontSize: 'var(--forge-text-base)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    sliderLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    sliderLabelSpan: {
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-sm)',
      color: 'var(--forge-text-muted)',
    },
  };

  // Hover handlers for buttons
  const btnPrimaryHover = {
    onMouseEnter: (e) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-h)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--forge-shadow-glow)';
      }
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  const btnSecondaryHover = {
    onMouseEnter: (e) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
        e.currentTarget.style.color = 'var(--forge-text-primary)';
      }
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--forge-text-secondary)';
    },
  };

  const btnDangerHover = {
    onMouseEnter: (e) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = 'rgba(255,71,87,0.08)';
      }
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    },
  };

  const btnTertiaryHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
      e.currentTarget.style.borderColor = 'var(--forge-border-highlight)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
      e.currentTarget.style.borderColor = 'var(--forge-border-active)';
    },
  };

  const presetBtnHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
      e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
      e.currentTarget.style.color = 'var(--forge-accent-primary)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
      e.currentTarget.style.borderColor = 'var(--forge-border-default)';
      e.currentTarget.style.color = 'var(--forge-text-secondary)';
    },
  };

  const uploadAreaHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.borderColor = 'var(--forge-border-active)';
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
    },
  };

  const inputFocusHandler = (e) => {
    e.target.style.borderColor = 'var(--forge-accent-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
  };

  const inputBlurHandler = (hasError) => (e) => {
    e.target.style.borderColor = hasError ? 'var(--forge-error)' : 'var(--forge-border-default)';
    e.target.style.boxShadow = 'none';
  };

  // Compute slider track percent for FORGE slider styling
  const sliderPercent = ((branding.cornerRadius - 0) / (24 - 0)) * 100;
  const sliderTrackBg = `linear-gradient(to right, var(--forge-accent-primary) 0%, var(--forge-accent-primary) ${sliderPercent}%, var(--forge-bg-overlay) ${sliderPercent}%, var(--forge-bg-overlay) 100%)`;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.h1}>{t('admin.branding.title')}</h1>
          <p style={styles.subtitle}>{t('admin.branding.subtitle')}</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.saveStatus} aria-live="polite">
            {isDirty ? (
              <span style={{ ...styles.statusBadge, ...styles.statusDirty }}>Neuulozene zmeny</span>
            ) : (
              <span style={{ ...styles.statusBadge, ...styles.statusSaved }}>Ulozeno</span>
            )}
            {Object.keys(errors).length > 0 && (
              <span
                style={{ ...styles.statusBadge, ...styles.statusError }}
                title="Nejdriv oprav chyby ve formulari"
              >
                {Object.keys(errors).length}x chyba
              </span>
            )}
          </div>
          <button
            style={{
              ...styles.btnSecondary,
              ...(saving || loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
            onClick={handleResetToDefaults}
            disabled={saving || loading}
            title="Resetuje hodnoty na vychozi (vyzaduje Ulozit)"
            {...btnSecondaryHover}
          >
            {t('common.reset')}
          </button>
          <button
            style={{
              ...styles.btnPrimary,
              ...(saving || loading || !isDirty || Object.keys(errors).length > 0 ? styles.btnPrimaryDisabled : {}),
            }}
            onClick={handleSave}
            disabled={saving || loading || !isDirty || Object.keys(errors).length > 0}
            title={!isDirty ? 'Neni co ukladat' : undefined}
            {...btnPrimaryHover}
          >
            {saving ? t('common.saving') : 'Ulozit zmeny'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div style={styles.unsavedBanner}>
          Mas neulozene zmeny. Klikni na <strong>Ulozit zmeny</strong>, aby se projevily ve widgetu.
        </div>
      )}

      <div className="admin-branding-grid-responsive" style={styles.grid}>
        {/* Left Column */}
        <div style={styles.column}>
          {/* Business Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('admin.branding.businessInfo')}</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('admin.branding.businessName')}</label>
              <input
                type="text"
                value={branding.businessName}
                onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                placeholder={t('admin.branding.businessNamePlaceholder')}
                maxLength={50}
                style={{
                  ...styles.input,
                  ...(errors.businessName ? styles.inputError : {}),
                }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler(!!errors.businessName)}
              />
              {errors.businessName && <p style={styles.errorText}>{errors.businessName}</p>}
              <p style={styles.helpText}>{t('admin.branding.businessNameHelp')}</p>
            </div>
            <div style={{ ...styles.formGroup, marginBottom: 0 }}>
              <label style={styles.label}>{t('admin.branding.tagline')}</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                placeholder={t('admin.branding.taglinePlaceholder')}
                maxLength={100}
                style={styles.input}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler(false)}
              />
            </div>
          </div>

          {/* Logo */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('admin.branding.logo')}</h3>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) startLogoDraftFromFile(f);
                e.target.value = '';
              }}
            />

            {branding.logo && (
              <div style={styles.currentLogo}>
                <div style={styles.logoPreview}>
                  <img src={branding.logo} alt="Logo" style={{ maxWidth: 72, maxHeight: 72, objectFit: 'contain' }} />
                </div>
                <div style={styles.logoInfo}>
                  <p style={styles.logoInfoP}>PNG, JPG, SVG (max 2 MB)</p>
                  <p style={{ ...styles.logoInfoP, fontSize: 12, color: 'var(--forge-text-muted)' }}>Logo se ulozi po kliknuti na Ulozit zmeny.</p>
                </div>
              </div>
            )}

            <div
              style={styles.uploadArea}
              role="button"
              tabIndex={0}
              onClick={() => logoInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') logoInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f) startLogoDraftFromFile(f);
              }}
              title="Klikni pro vyber souboru, nebo sem pretahni logo"
              {...uploadAreaHover}
            >
              {logoDraftPreview ? (
                <div>
                  <img src={logoDraftPreview} alt="Nahled" style={{ maxWidth: 140, maxHeight: 80, objectFit: 'contain' }} />
                  <p style={styles.uploadHint}>Pripraveno k nahrani</p>
                </div>
              ) : (
                <>
                  <Icon name="Upload" size={32} style={{ color: 'var(--forge-text-muted)' }} />
                  <p style={styles.uploadAreaP}>{t('admin.branding.dragDrop')}</p>
                  <p style={styles.uploadHint}>{t('admin.branding.orClick')}</p>
                  <p style={styles.uploadHint}>{t('admin.branding.recommended')}</p>
                </>
              )}
            </div>

            {logoDraftError && <p style={styles.errorText}>{logoDraftError}</p>}

            <div style={styles.uploadActions}>
              <button style={styles.btnSecondary} onClick={() => logoInputRef.current?.click()} {...btnSecondaryHover}>
                {t('admin.branding.chooseFile')}
              </button>
              <button
                style={{
                  ...styles.btnPrimary,
                  ...(!logoDraft ? styles.btnPrimaryDisabled : {}),
                }}
                onClick={applyLogoDraft}
                disabled={!logoDraft}
                {...btnPrimaryHover}
              >
                Pouzit logo
              </button>
              {(branding.logo || logoDraft) && (
                <button
                  style={styles.btnDanger}
                  onClick={() => {
                    setBranding({ ...branding, logo: null });
                    setLogoDraft(null);
                    if (logoDraftPreview) URL.revokeObjectURL(logoDraftPreview);
                    setLogoDraftPreview(null);
                    setLogoDraftError(null);
                  }}
                  {...btnDangerHover}
                >
                  {t('admin.branding.removeLogo')}
                </button>
              )}
            </div>
          </div>

          {/* Display in widget */}
          <div style={styles.section}>
            <div style={styles.sectionHeadRow}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>{t('admin.branding.calculatorSettings')}</h3>
              <button
                style={styles.btnTertiary}
                onClick={() => (window.location.href = '/admin/widget')}
                title="Rozlozeni, embed kod a widget instance se resi ve Widget Code"
                {...btnTertiaryHover}
              >
                Otevrit Widget
              </button>
            </div>
            <p style={styles.helpCallout}>
              Tip: zde nastavujes hlavne <strong style={{ color: 'var(--forge-text-primary)' }}>logo/barvy/typografii</strong> a co se ukazuje v hlavicce widgetu.
              Rozmery, embed kod a instance widgetu nastavis ve strance <strong style={{ color: 'var(--forge-text-primary)' }}>Widget</strong>.
            </p>
            <div style={styles.checkboxGroup}>
              <ForgeCheckbox
                checked={branding.showLogo}
                onChange={(e) => setBranding({ ...branding, showLogo: e.target.checked })}
                label={t('admin.branding.showLogo')}
              />
              <ForgeCheckbox
                checked={branding.showBusinessName}
                onChange={(e) => setBranding({ ...branding, showBusinessName: e.target.checked })}
                label={t('admin.branding.showBusinessName')}
              />
              <ForgeCheckbox
                checked={branding.showTagline}
                onChange={(e) => setBranding({ ...branding, showTagline: e.target.checked })}
                label={t('admin.branding.showTagline')}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ForgeCheckbox
                  checked={enforcePoweredBy.poweredByRequired ? true : branding.showPoweredBy}
                  disabled={enforcePoweredBy.poweredByRequired}
                  onChange={(e) => setBranding({ ...branding, showPoweredBy: e.target.checked })}
                  label={t('admin.branding.showPoweredBy')}
                />
                {enforcePoweredBy.poweredByRequired && (
                  <span style={styles.chip} title="Dostupne v tarifu Pro">
                    PRO
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={styles.label}>{t('admin.branding.cornerRadius')} {branding.cornerRadius}px</label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={branding.cornerRadius}
                onChange={(e) => setBranding({ ...branding, cornerRadius: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: sliderTrackBg,
                  outline: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer',
                  margin: '8px 0',
                }}
                className="forge-slider-input"
              />
              {errors.cornerRadius && <p style={styles.errorText}>{errors.cornerRadius}</p>}
              <div style={styles.sliderLabels}>
                <span style={styles.sliderLabelSpan}>0px (Sharp)</span>
                <span style={styles.sliderLabelSpan}>24px (Rounded)</span>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('admin.branding.colorScheme')}</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('admin.branding.primaryColor')}</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  style={{
                    ...styles.input,
                    flex: 1,
                    ...(errors.primaryColor ? styles.inputError : {}),
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler(!!errors.primaryColor)}
                />
                <div style={{ ...styles.colorSwatch, backgroundColor: branding.primaryColor }} />
              </div>
              <p style={styles.helpText}>{t('admin.branding.primaryColorHelp')}</p>
              {errors.primaryColor && <p style={styles.errorText}>{errors.primaryColor}</p>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('admin.branding.secondaryColor')}</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  style={{
                    ...styles.input,
                    flex: 1,
                    ...(errors.secondaryColor ? styles.inputError : {}),
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler(!!errors.secondaryColor)}
                />
                <div style={{ ...styles.colorSwatch, backgroundColor: branding.secondaryColor }} />
              </div>
              <p style={styles.helpText}>{t('admin.branding.secondaryColorHelp')}</p>
              {errors.secondaryColor && <p style={styles.errorText}>{errors.secondaryColor}</p>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('admin.branding.backgroundColor')}</label>
              <div style={styles.colorInputGroup}>
                <input
                  type="text"
                  value={branding.backgroundColor}
                  onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                  style={{
                    ...styles.input,
                    flex: 1,
                    ...(errors.backgroundColor ? styles.inputError : {}),
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler(!!errors.backgroundColor)}
                />
                <div style={{ ...styles.colorSwatch, backgroundColor: branding.backgroundColor }} />
              </div>
              <p style={styles.helpText}>{t('admin.branding.backgroundColorHelp')}</p>
              {errors.backgroundColor && <p style={styles.errorText}>{errors.backgroundColor}</p>}
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={styles.label}>{t('admin.branding.presets')}</label>
              <div style={styles.colorPresets}>
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    style={styles.presetBtn}
                    onClick={() => handleColorPreset(preset)}
                    {...presetBtnHover}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('admin.branding.typography')}</h3>
            <div style={{ marginBottom: 0 }}>
              <label style={styles.label}>{t('admin.branding.fontFamily')}</label>
              <div style={styles.fontOptions}>
                {fonts.map((font) => (
                  <label key={font} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="font"
                      checked={branding.fontFamily === font}
                      onChange={() => setBranding({ ...branding, fontFamily: font })}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--forge-accent-primary)' }}
                    />
                    <span style={styles.radioSpan}>{font} {font === 'Inter' && '(Default)'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Live Preview */}
        <div style={styles.column}>
          <div style={{ ...styles.section, ...styles.stickyPreview }}>
            <h3 style={styles.sectionTitle}>{t('admin.branding.livePreview')}</h3>
            <div
              style={{
                ...styles.calculatorPreview,
                backgroundColor: branding.backgroundColor,
                borderRadius: `${branding.cornerRadius}px`,
                fontFamily: branding.fontFamily,
              }}
            >
              <div style={styles.previewHeader}>
                {branding.showLogo && (
                  <div style={styles.previewLogo}>
                    {branding.logo ? (
                      <img src={branding.logo} alt="Logo" style={{ maxWidth: 40, maxHeight: 40, objectFit: 'contain' }} />
                    ) : (
                      <Icon name="Image" size={32} />
                    )}
                  </div>
                )}
                <div>
                  {branding.showBusinessName && (
                    <h4 style={{ ...styles.previewH4, fontFamily: branding.fontFamily }}>{branding.businessName}</h4>
                  )}
                  {branding.showTagline && (
                    <p style={{ ...styles.previewSubtitle, fontFamily: branding.fontFamily }}>{branding.tagline}</p>
                  )}
                </div>
              </div>
              <div style={styles.previewDivider} />
              <div style={{ ...styles.previewForm, fontFamily: branding.fontFamily }}>
                <div>
                  <label style={styles.previewFieldLabel}>{t('admin.branding.uploadModel')}</label>
                  <div style={{ ...styles.previewInput, borderRadius: `${branding.cornerRadius}px` }}>
                    Choose File
                  </div>
                </div>
                <div>
                  <label style={styles.previewFieldLabel}>{t('admin.branding.material')}</label>
                  <div style={{ ...styles.previewInput, borderRadius: `${branding.cornerRadius}px` }}>
                    PLA &#9660;
                  </div>
                </div>
                <button
                  style={{
                    ...styles.previewButton,
                    backgroundColor: branding.primaryColor,
                    borderRadius: `${branding.cornerRadius}px`,
                  }}
                >
                  {t('admin.branding.calculatePrice')}
                </button>
              </div>
              {branding.showPoweredBy && (
                <div style={styles.previewFooter}>
                  <small style={styles.previewFooterSmall}>Powered by ModelPricer</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* FORGE slider thumb styles */
        .forge-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--forge-accent-primary);
          border: none;
          cursor: pointer;
          margin-top: -6px;
          transition: box-shadow 120ms ease-out;
        }
        .forge-slider-input::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.2);
        }
        .forge-slider-input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--forge-accent-primary);
          border: none;
          cursor: pointer;
        }
        .forge-slider-input::-moz-range-thumb:hover {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.2);
        }
        .forge-slider-input::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
        }
        .forge-slider-input::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
        .forge-slider-input:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.25);
        }
        .forge-slider-input:focus::-moz-range-thumb {
          box-shadow: 0 0 0 4px rgba(0,212,170,0.25);
        }

        @media (max-width: 1024px) {
          .admin-branding-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminBranding;
