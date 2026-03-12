import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getBranding,
  saveBranding,
} from '../../utils/adminBrandingWidgetStorage';
import {
  readCompanyData,
  writeCompanyData,
} from '../../utils/adminCompanyStorage';
import { getTenantId } from '../../utils/adminTenantStorage';

/* ------------------------------------------------------------------ */
/*  Debounce helper                                                    */
/* ------------------------------------------------------------------ */
function useDebouncedSave(saveFn, delay = 800) {
  const timerRef = useRef(null);
  const latestRef = useRef(null);

  const trigger = useCallback(
    (data) => {
      latestRef.current = data;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveFn(latestRef.current);
        timerRef.current = null;
      }, delay);
    },
    [saveFn, delay],
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveFn(latestRef.current);
      }
    };
  }, [saveFn]);

  return trigger;
}

/* ------------------------------------------------------------------ */
/*  Logo file helpers                                                  */
/* ------------------------------------------------------------------ */
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB

function readFileAsDataUrl(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

async function optimizeLogo(f) {
  if (f.type === 'image/svg+xml') return readFileAsDataUrl(f);
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
    if (webp && webp.startsWith('data:image')) return webp;
    return canvas.toDataURL('image/png');
  } catch {
    return readFileAsDataUrl(f);
  }
}

/* ================================================================== */
/*  AdminBranding Component                                            */
/* ================================================================== */
const AdminBranding = () => {
  const { t } = useLanguage();
  const tenantId = getTenantId();
  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [logoError, setLogoError] = useState(null);

  // Branding state (visual identity — stored via brandingWidgetStorage)
  const [branding, setBranding] = useState({
    businessName: '',
    tagline: '',
    logo: null,
    primaryColor: '#2563EB',
    secondaryColor: '#10B981',
  });

  // Company / legal state (stored via companyStorage)
  const [company, setCompany] = useState({
    companyName: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    zip: '',
    country: 'CZ',
    contactEmail: '',
    contactPhone: '',
    website: '',
    bankAccount: '',
    bankName: '',
    iban: '',
  });

  /* ---- Load data ------------------------------------------------ */
  useEffect(() => {
    try {
      const b = getBranding(tenantId);
      setBranding({
        businessName: b.businessName || '',
        tagline: b.tagline || '',
        logo: b.logo || null,
        primaryColor: b.primaryColor || '#2563EB',
        secondaryColor: b.secondaryColor || '#10B981',
      });
      const c = readCompanyData();
      setCompany((prev) => ({ ...prev, ...c }));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  /* ---- Persist functions ---------------------------------------- */
  const persistBranding = useCallback(
    (b) => {
      setSaveStatus('saving');
      // Merge with existing stored branding to preserve fields we don't edit here
      const existing = getBranding(tenantId);
      saveBranding(tenantId, { ...existing, ...b }, 'admin');
      setTimeout(() => setSaveStatus('saved'), 300);
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [tenantId],
  );

  const persistCompany = useCallback(
    (c) => {
      setSaveStatus('saving');
      writeCompanyData(c);
      setTimeout(() => setSaveStatus('saved'), 300);
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [],
  );

  const debouncedSaveBranding = useDebouncedSave(persistBranding);
  const debouncedSaveCompany = useDebouncedSave(persistCompany);

  /* ---- Field change handlers ------------------------------------ */
  const updateBranding = (field, value) => {
    const next = { ...branding, [field]: value };
    setBranding(next);
    debouncedSaveBranding(next);
  };

  const updateCompany = (field, value) => {
    const next = { ...company, [field]: value };
    setCompany(next);
    debouncedSaveCompany(next);
  };

  /* ---- Logo handling -------------------------------------------- */
  const handleLogoFile = async (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoError('Nepodporovany format. Pouzij PNG, JPG, SVG nebo WEBP.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Soubor je prilis velky (max 2 MB).');
      return;
    }
    setLogoError(null);
    try {
      const dataUrl = await optimizeLogo(file);
      updateBranding('logo', dataUrl);
    } catch {
      setLogoError('Logo se nepodarilo nacist.');
    }
  };

  const removeLogo = () => {
    setLogoError(null);
    updateBranding('logo', null);
  };

  /* ---- Validation helpers --------------------------------------- */
  const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test((v || '').trim());

  /* ================================================================ */
  /*  STYLES                                                           */
  /* ================================================================ */
  const s = {
    page: { maxWidth: 1280 },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 28,
    },
    h1: {
      margin: 0,
      fontSize: 'var(--forge-text-2xl)',
      fontWeight: 700,
      fontFamily: 'var(--forge-font-heading)',
      color: 'var(--forge-text-primary)',
    },
    subtitle: {
      margin: '6px 0 0',
      fontSize: 'var(--forge-text-base)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-muted)',
    },
    saveIndicator: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 999,
      fontFamily: 'var(--forge-font-mono)',
      fontSize: 11,
      fontWeight: 500,
      transition: 'all 200ms ease',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: 28,
    },
    card: {
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-lg)',
      padding: 24,
      marginBottom: 20,
    },
    cardTitle: {
      margin: '0 0 16px',
      fontSize: 'var(--forge-text-lg)',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-heading)',
      color: 'var(--forge-text-primary)',
    },
    field: { marginBottom: 16 },
    fieldLast: { marginBottom: 0 },
    label: {
      display: 'block',
      marginBottom: 6,
      fontFamily: 'var(--forge-font-tech)',
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--forge-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    input: {
      width: '100%',
      padding: '9px 12px',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-sm)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 'var(--forge-text-base)',
      color: 'var(--forge-text-primary)',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 120ms ease, box-shadow 120ms ease',
    },
    inputError: {
      borderColor: 'var(--forge-error)',
      boxShadow: '0 0 0 2px rgba(255,71,87,0.15)',
    },
    helper: {
      margin: '4px 0 0',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-muted)',
    },
    errorMsg: {
      margin: '4px 0 0',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-error)',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
    },
    row3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
    },
    /* Color picker */
    colorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 'var(--forge-radius-md)',
      border: '1px solid var(--forge-border-default)',
      flexShrink: 0,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    },
    colorNative: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      border: 'none',
      padding: 0,
    },
    /* Upload zone */
    uploadZone: {
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '2px dashed var(--forge-border-active)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '20px 16px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'border-color 150ms ease, background-color 150ms ease',
    },
    uploadText: {
      margin: '6px 0 0',
      fontSize: 'var(--forge-text-base)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-secondary)',
    },
    uploadHint: {
      margin: '4px 0 0',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-muted)',
    },
    logoPreviewRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    logoThumb: {
      width: 64,
      height: 64,
      borderRadius: 'var(--forge-radius-md)',
      border: '1px solid var(--forge-border-default)',
      backgroundColor: 'var(--forge-bg-elevated)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    removeBtn: {
      padding: '5px 10px',
      border: '1px solid var(--forge-error)',
      borderRadius: 'var(--forge-radius-sm)',
      backgroundColor: 'transparent',
      color: 'var(--forge-error)',
      fontFamily: 'var(--forge-font-body)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'background-color 150ms ease',
    },
    /* Preview card */
    previewSticky: {
      position: 'sticky',
      top: 24,
    },
    previewCard: {
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-lg)',
      padding: 24,
      overflow: 'hidden',
    },
    previewLabel: {
      margin: '0 0 12px',
      fontSize: 'var(--forge-text-sm)',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 500,
      color: 'var(--forge-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  };

  /* ---- Focus/blur handlers -------------------------------------- */
  const onFocus = (e) => {
    e.target.style.borderColor = 'var(--forge-accent-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
  };
  const onBlur = (e) => {
    e.target.style.borderColor = 'var(--forge-border-default)';
    e.target.style.boxShadow = 'none';
  };

  /* ---- Upload zone hover ---------------------------------------- */
  const uploadHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.borderColor = 'var(--forge-border-active)';
      e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
    },
  };

  /* ---- Save indicator colors ------------------------------------ */
  const indicatorStyle =
    saveStatus === 'saving'
      ? { backgroundColor: 'rgba(255,181,71,0.12)', color: 'var(--forge-warning)' }
      : saveStatus === 'saved'
        ? { backgroundColor: 'rgba(0,212,170,0.12)', color: 'var(--forge-success)' }
        : { backgroundColor: 'transparent', color: 'var(--forge-text-muted)' };

  const indicatorText =
    saveStatus === 'saving' ? 'Ukladam...' : saveStatus === 'saved' ? 'Ulozeno' : '';

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--forge-text-muted)' }}>
        Nacitam...
      </div>
    );
  }

  const displayName = branding.businessName || company.companyName || 'Vas nazev firmy';
  const displayTagline = branding.tagline || 'Popis vasi firmy';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>{t('admin.branding.title') || 'Branding'}</h1>
          <p style={s.subtitle}>Nastaveni vizualni identity a kontaktnich udaju firmy</p>
        </div>
        {indicatorText && (
          <span style={{ ...s.saveIndicator, ...indicatorStyle }}>
            {saveStatus === 'saved' && (
              <Icon name="Check" size={14} style={{ color: 'var(--forge-success)' }} />
            )}
            {indicatorText}
          </span>
        )}
      </div>

      {/* Grid: Preview | Settings */}
      <div className="admin-branding-layout" style={s.grid}>
        {/* LEFT: Live Preview */}
        <div style={s.previewSticky}>
          <div style={s.previewCard}>
            <p style={s.previewLabel}>Nahled</p>

            {/* Simulated header */}
            <div
              style={{
                borderRadius: 'var(--forge-radius-md)',
                border: '1px solid var(--forge-border-default)',
                overflow: 'hidden',
              }}
            >
              {/* Header bar */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: branding.primaryColor || '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {branding.logo ? (
                  <img
                    src={branding.logo}
                    alt=""
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      objectFit: 'contain',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="Image" size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'var(--forge-font-heading)',
                      lineHeight: 1.2,
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 11,
                      fontFamily: 'var(--forge-font-body)',
                      marginTop: 2,
                    }}
                  >
                    {displayTagline}
                  </div>
                </div>
              </div>

              {/* Body preview */}
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--forge-bg-elevated)' }}>
                <div
                  style={{
                    height: 8,
                    width: '75%',
                    backgroundColor: 'var(--forge-border-active)',
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 8,
                    width: '50%',
                    backgroundColor: 'var(--forge-border-active)',
                    borderRadius: 4,
                    marginBottom: 16,
                  }}
                />
                <div
                  style={{
                    height: 32,
                    borderRadius: 'var(--forge-radius-sm)',
                    backgroundColor: branding.primaryColor || '#2563EB',
                    opacity: 0.9,
                  }}
                />
              </div>

              {/* Footer preview */}
              <div
                style={{
                  padding: '10px 20px',
                  borderTop: '1px solid var(--forge-border-default)',
                  backgroundColor: 'var(--forge-bg-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-muted)',
                  }}
                >
                  {company.contactEmail || 'email@firma.cz'}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-muted)',
                  }}
                >
                  {company.contactPhone || '+420 ...'}
                </span>
              </div>
            </div>

            {/* Accent color swatch */}
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: branding.primaryColor,
                  border: '1px solid var(--forge-border-default)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--forge-font-mono)',
                  fontSize: 11,
                  color: 'var(--forge-text-muted)',
                }}
              >
                Primary
              </span>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: branding.secondaryColor,
                  border: '1px solid var(--forge-border-default)',
                  marginLeft: 8,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--forge-font-mono)',
                  fontSize: 11,
                  color: 'var(--forge-text-muted)',
                }}
              >
                Accent
              </span>
            </div>
          </div>

          {/* Company invoice mini-preview */}
          {(company.companyName || company.ico) && (
            <div style={{ ...s.previewCard, marginTop: 16 }}>
              <p style={s.previewLabel}>Fakturacni udaje</p>
              <div
                style={{
                  fontSize: 'var(--forge-text-sm)',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {company.companyName && <div style={{ fontWeight: 600, color: 'var(--forge-text-primary)' }}>{company.companyName}</div>}
                {company.address && <div>{company.address}</div>}
                {(company.zip || company.city) && (
                  <div>
                    {company.zip} {company.city}
                  </div>
                )}
                {company.ico && <div>ICO: {company.ico}</div>}
                {company.dic && <div>DIC: {company.dic}</div>}
                {company.bankAccount && (
                  <div style={{ marginTop: 6 }}>
                    {company.bankName && <span>{company.bankName}: </span>}
                    {company.bankAccount}
                  </div>
                )}
                {company.iban && <div>IBAN: {company.iban}</div>}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Settings forms */}
        <div>
          {/* Card 1: Company Info */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Zakladni informace</h3>

            <div style={s.field}>
              <label style={s.label}>Nazev firmy / znacky</label>
              <input
                type="text"
                value={branding.businessName}
                onChange={(e) => updateBranding('businessName', e.target.value)}
                placeholder="Moje 3D tiskarna"
                maxLength={60}
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p style={s.helper}>Zobrazuje se v hlavicce widgetu a na fakturach</p>
            </div>

            <div style={s.field}>
              <label style={s.label}>Popisek / tagline</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => updateBranding('tagline', e.target.value)}
                placeholder="Rychla kalkulace a objednavka 3D tisku"
                maxLength={120}
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p style={s.helper}>Kratky popis pod nazvem firmy</p>
            </div>

            <div style={s.fieldLast}>
              <label style={s.label}>Logo</label>
              {branding.logo ? (
                <div style={s.logoPreviewRow}>
                  <div style={s.logoThumb}>
                    <img
                      src={branding.logo}
                      alt="Logo"
                      style={{ maxWidth: 56, maxHeight: 56, objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    style={s.removeBtn}
                    onClick={removeLogo}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,71,87,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Odebrat logo
                  </button>
                </div>
              ) : null}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoFile(f);
                  e.target.value = '';
                }}
              />
              <div
                style={s.uploadZone}
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
                  if (f) handleLogoFile(f);
                }}
                {...uploadHover}
              >
                <Icon name="Upload" size={24} style={{ color: 'var(--forge-text-muted)' }} />
                <p style={s.uploadText}>Pretahni sem logo nebo klikni</p>
                <p style={s.uploadHint}>PNG, JPG, SVG, WEBP do 2 MB</p>
              </div>
              {logoError && <p style={s.errorMsg}>{logoError}</p>}
            </div>
          </div>

          {/* Card 2: Visual Identity */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Vizualni identita</h3>

            <div style={s.field}>
              <label style={s.label}>Primarni barva</label>
              <div style={s.colorRow}>
                <div style={{ ...s.colorSwatch, backgroundColor: branding.primaryColor }}>
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    style={s.colorNative}
                    title="Vybrat primarni barvu"
                  />
                </div>
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => updateBranding('primaryColor', e.target.value)}
                  style={{
                    ...s.input,
                    flex: 1,
                    fontFamily: 'var(--forge-font-mono)',
                    fontSize: 13,
                    ...(branding.primaryColor && !isHex(branding.primaryColor) ? s.inputError : {}),
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  maxLength={7}
                />
              </div>
              {branding.primaryColor && !isHex(branding.primaryColor) && (
                <p style={s.errorMsg}>Format: #RRGGBB</p>
              )}
              <p style={s.helper}>Pouziva se pro hlavicku, tlacitka a hlavni akcenty</p>
            </div>

            <div style={s.fieldLast}>
              <label style={s.label}>Sekundarni / akcentova barva</label>
              <div style={s.colorRow}>
                <div style={{ ...s.colorSwatch, backgroundColor: branding.secondaryColor }}>
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    style={s.colorNative}
                    title="Vybrat sekundarni barvu"
                  />
                </div>
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                  style={{
                    ...s.input,
                    flex: 1,
                    fontFamily: 'var(--forge-font-mono)',
                    fontSize: 13,
                    ...(branding.secondaryColor && !isHex(branding.secondaryColor) ? s.inputError : {}),
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  maxLength={7}
                />
              </div>
              {branding.secondaryColor && !isHex(branding.secondaryColor) && (
                <p style={s.errorMsg}>Format: #RRGGBB</p>
              )}
              <p style={s.helper}>Pro sekundarni elementy, badges, hover stavy</p>
            </div>
          </div>

          {/* Card 3: Contact */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Kontaktni udaje</h3>

            <div style={s.field}>
              <label style={s.label}>E-mail</label>
              <input
                type="email"
                value={company.contactEmail}
                onChange={(e) => updateCompany('contactEmail', e.target.value)}
                placeholder="info@firma.cz"
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Telefon</label>
                <input
                  type="tel"
                  value={company.contactPhone}
                  onChange={(e) => updateCompany('contactPhone', e.target.value)}
                  placeholder="+420 123 456 789"
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Web</label>
                <input
                  type="url"
                  value={company.website}
                  onChange={(e) => updateCompany('website', e.target.value)}
                  placeholder="https://firma.cz"
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Legal & Invoicing */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Fakturacni a pravni udaje</h3>

            <div style={s.field}>
              <label style={s.label}>Nazev spolecnosti</label>
              <input
                type="text"
                value={company.companyName}
                onChange={(e) => updateCompany('companyName', e.target.value)}
                placeholder="3D Print s.r.o."
                maxLength={100}
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p style={s.helper}>Pravni nazev pro faktury (muze se lisit od nazvu znacky)</p>
            </div>

            <div style={s.field}>
              <label style={s.label}>Adresa sidla</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => updateCompany('address', e.target.value)}
                placeholder="Hlavni 123"
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={{ ...s.row3, ...s.field }}>
              <div>
                <label style={s.label}>PSC</label>
                <input
                  type="text"
                  value={company.zip}
                  onChange={(e) => updateCompany('zip', e.target.value)}
                  placeholder="110 00"
                  maxLength={10}
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label style={s.label}>Mesto</label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => updateCompany('city', e.target.value)}
                  placeholder="Praha"
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label style={s.label}>Stat</label>
                <input
                  type="text"
                  value={company.country}
                  onChange={(e) => updateCompany('country', e.target.value)}
                  placeholder="CZ"
                  maxLength={3}
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div style={{ ...s.row, ...s.field }}>
              <div>
                <label style={s.label}>ICO</label>
                <input
                  type="text"
                  value={company.ico}
                  onChange={(e) => updateCompany('ico', e.target.value)}
                  placeholder="12345678"
                  maxLength={12}
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label style={s.label}>DIC</label>
                <input
                  type="text"
                  value={company.dic}
                  onChange={(e) => updateCompany('dic', e.target.value)}
                  placeholder="CZ12345678"
                  maxLength={14}
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Cislo uctu</label>
              <input
                type="text"
                value={company.bankAccount}
                onChange={(e) => updateCompany('bankAccount', e.target.value)}
                placeholder="123456789/0100"
                style={s.input}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={{ ...s.row, ...s.fieldLast }}>
              <div>
                <label style={s.label}>Nazev banky</label>
                <input
                  type="text"
                  value={company.bankName}
                  onChange={(e) => updateCompany('bankName', e.target.value)}
                  placeholder="Komercni banka"
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label style={s.label}>IBAN</label>
                <input
                  type="text"
                  value={company.iban}
                  onChange={(e) => updateCompany('iban', e.target.value)}
                  placeholder="CZ65 0100 0000 0012 3456 789"
                  maxLength={34}
                  style={s.input}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-branding-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminBranding;
