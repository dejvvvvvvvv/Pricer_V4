import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
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
      nextErrors.businessName = 'Zadej alespoň 2 znaky.';
    }
    if (!isHex(branding.primaryColor)) nextErrors.primaryColor = 'Použij HEX ve formátu #RRGGBB.';
    if (!isHex(branding.secondaryColor)) nextErrors.secondaryColor = 'Použij HEX ve formátu #RRGGBB.';
    if (!isHex(branding.backgroundColor)) nextErrors.backgroundColor = 'Použij HEX ve formátu #RRGGBB.';

    const r = Number(branding.cornerRadius);
    if (Number.isNaN(r) || r < 0 || r > 24) {
      nextErrors.cornerRadius = 'Zaoblení musí být v rozsahu 0–24.';
    }

    setErrors(nextErrors);
  }, [branding]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (Object.keys(errors).length > 0) {
        alert('❌ Oprav prosím chyby ve formuláři (červeně).');
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

      // If user selected a logo file but didn't click "Použít", auto-apply it on Save.
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
      alert('✅ Branding uložen.');
    } catch (e) {
      console.error(e);
      alert('❌ Uložení se nepodařilo.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    // Reset in UI only (requires Save) – per spec.
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
      setLogoDraftError('Nepodporovaný formát. Použij PNG/JPG/SVG/WEBP.');
      setLogoDraft(null);
      setLogoDraftPreview(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoDraftError('Soubor je příliš velký (max 2 MB).');
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
      setLogoDraftError('Logo se nepodařilo načíst. Zkus to prosím znovu.');
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

  return (
    <div className="admin-branding">
      <div className="page-header">
        <div>
          <h1>{t('admin.branding.title')}</h1>
          <p className="subtitle">{t('admin.branding.subtitle')}</p>
        </div>
        <div className="header-actions">
          <div className="save-status" aria-live="polite">
            {isDirty ? (
              <span className="status-badge status-dirty">Neuložené změny</span>
            ) : (
              <span className="status-badge status-saved">Uloženo</span>
            )}
            {Object.keys(errors).length > 0 && (
              <span className="status-badge status-error" title="Nejdřív oprav chyby ve formuláři">
                {Object.keys(errors).length}× chyba
              </span>
            )}
          </div>
          <button
            className="btn-secondary"
            onClick={handleResetToDefaults}
            disabled={saving || loading}
            title="Resetuje hodnoty na výchozí (vyžaduje Uložit)"
          >
            {t('common.reset')}
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || loading || !isDirty || Object.keys(errors).length > 0}
            title={!isDirty ? 'Není co ukládat' : undefined}
          >
            {saving ? t('common.saving') : 'Uložit změny'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="unsaved-banner">
          Máš neuložené změny. Klikni na <strong>Uložit změny</strong>, aby se projevily ve widgetu.
        </div>
      )}

      <div className="branding-grid">
        {/* Left Column */}
        <div className="branding-column">
          {/* Business Information */}
          <div className="branding-section">
            <h3>{t('admin.branding.businessInfo')}</h3>
            <div className="form-group">
              <label>{t('admin.branding.businessName')}</label>
              <input
                type="text"
                value={branding.businessName}
                onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                placeholder={t('admin.branding.businessNamePlaceholder')}
                maxLength={50}
                className={errors.businessName ? 'input-error' : ''}
              />
              {errors.businessName && <p className="error-text">{errors.businessName}</p>}
              <p className="help-text">{t('admin.branding.businessNameHelp')}</p>
            </div>
            <div className="form-group">
              <label>{t('admin.branding.tagline')}</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                placeholder={t('admin.branding.taglinePlaceholder')}
                maxLength={100}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="branding-section">
            <h3>{t('admin.branding.logo')}</h3>
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
              <div className="current-logo">
                <div className="logo-preview">
                  <img src={branding.logo} alt="Logo" style={{ maxWidth: 72, maxHeight: 72, objectFit: 'contain' }} />
                </div>
                <div className="logo-info">
                  <p>PNG, JPG, SVG (max 2 MB)</p>
                  <p className="help-text">Logo se uloží po kliknutí na Uložit změny.</p>
                </div>
              </div>
            )}

            <div
              className="upload-area"
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
              title="Klikni pro výběr souboru, nebo sem přetáhni logo"
            >
              {logoDraftPreview ? (
                <div className="draft-preview">
                  <img src={logoDraftPreview} alt="Náhled" style={{ maxWidth: 140, maxHeight: 80, objectFit: 'contain' }} />
                  <p className="upload-hint">Připraveno k nahrání</p>
                </div>
              ) : (
                <>
                  <Icon name="Upload" size={32} />
                  <p>{t('admin.branding.dragDrop')}</p>
                  <p className="upload-hint">{t('admin.branding.orClick')}</p>
                  <p className="upload-hint">{t('admin.branding.recommended')}</p>
                </>
              )}
            </div>

            {logoDraftError && <p className="error-text">{logoDraftError}</p>}

            <div className="upload-actions">
              <button className="btn-secondary" onClick={() => logoInputRef.current?.click()}>
                {t('admin.branding.chooseFile')}
              </button>
              <button className="btn-primary" onClick={applyLogoDraft} disabled={!logoDraft}>
                Použít logo
              </button>
              {(branding.logo || logoDraft) && (
                <button
                  className="btn-danger"
                  onClick={() => {
                    setBranding({ ...branding, logo: null });
                    setLogoDraft(null);
                    if (logoDraftPreview) URL.revokeObjectURL(logoDraftPreview);
                    setLogoDraftPreview(null);
                    setLogoDraftError(null);
                  }}
                >
                  {t('admin.branding.removeLogo')}
                </button>
              )}
            </div>
          </div>

          {/* Display in widget */}
          <div className="branding-section">
            <div className="section-head-row">
              <h3 style={{ marginBottom: 0 }}>{t('admin.branding.calculatorSettings')}</h3>
              <button
                className="btn-tertiary"
                onClick={() => (window.location.href = '/admin/widget')}
                title="Rozložení, embed kód a widget instance se řeší ve Widget Code"
              >
                Otevřít Widget
              </button>
            </div>
            <p className="help-callout">
              Tip: zde nastavuješ hlavně <strong>logo/barvy/typografii</strong> a co se ukazuje v hlavičce widgetu.
              Rozměry, embed kód a instance widgetu nastavíš ve stránce <strong>Widget</strong>.
            </p>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={branding.showLogo}
                  onChange={(e) => setBranding({ ...branding, showLogo: e.target.checked })}
                />
                <span>{t('admin.branding.showLogo')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={branding.showBusinessName}
                  onChange={(e) => setBranding({ ...branding, showBusinessName: e.target.checked })}
                />
                <span>{t('admin.branding.showBusinessName')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={branding.showTagline}
                  onChange={(e) => setBranding({ ...branding, showTagline: e.target.checked })}
                />
                <span>{t('admin.branding.showTagline')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enforcePoweredBy.poweredByRequired ? true : branding.showPoweredBy}
                  disabled={enforcePoweredBy.poweredByRequired}
                  onChange={(e) => setBranding({ ...branding, showPoweredBy: e.target.checked })}
                  title={enforcePoweredBy.poweredByRequired ? 'Dostupné v tarifu Pro (white-label)' : ''}
                />
                <span>{t('admin.branding.showPoweredBy')}</span>
                {enforcePoweredBy.poweredByRequired && (
                  <span className="chip" title="Dostupné v tarifu Pro">
                    PRO
                  </span>
                )}
              </label>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>{t('admin.branding.cornerRadius')} {branding.cornerRadius}px</label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={branding.cornerRadius}
                onChange={(e) => setBranding({ ...branding, cornerRadius: parseInt(e.target.value) })}
                className="slider"
              />
              {errors.cornerRadius && <p className="error-text">{errors.cornerRadius}</p>}
              <div className="slider-labels">
                <span>0px (Sharp)</span>
                <span>24px (Rounded)</span>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="branding-section">
            <h3>{t('admin.branding.colorScheme')}</h3>
            <div className="form-group">
              <label>{t('admin.branding.primaryColor')}</label>
              <div className="color-input-group">
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className={errors.primaryColor ? 'input-error' : ''}
                />
                <div className="color-swatch" style={{ backgroundColor: branding.primaryColor }}></div>
              </div>
              <p className="help-text">{t('admin.branding.primaryColorHelp')}</p>
              {errors.primaryColor && <p className="error-text">{errors.primaryColor}</p>}
            </div>
            <div className="form-group">
              <label>{t('admin.branding.secondaryColor')}</label>
              <div className="color-input-group">
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className={errors.secondaryColor ? 'input-error' : ''}
                />
                <div className="color-swatch" style={{ backgroundColor: branding.secondaryColor }}></div>
              </div>
              <p className="help-text">{t('admin.branding.secondaryColorHelp')}</p>
              {errors.secondaryColor && <p className="error-text">{errors.secondaryColor}</p>}
            </div>
            <div className="form-group">
              <label>{t('admin.branding.backgroundColor')}</label>
              <div className="color-input-group">
                <input
                  type="text"
                  value={branding.backgroundColor}
                  onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                  className={errors.backgroundColor ? 'input-error' : ''}
                />
                <div className="color-swatch" style={{ backgroundColor: branding.backgroundColor }}></div>
              </div>
              <p className="help-text">{t('admin.branding.backgroundColorHelp')}</p>
              {errors.backgroundColor && <p className="error-text">{errors.backgroundColor}</p>}
            </div>
            <div className="form-group">
              <label>{t('admin.branding.presets')}</label>
              <div className="color-presets">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className="preset-btn"
                    onClick={() => handleColorPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="branding-section">
            <h3>{t('admin.branding.typography')}</h3>
            <div className="form-group">
              <label>{t('admin.branding.fontFamily')}</label>
              <div className="font-options">
                {fonts.map((font) => (
                  <label key={font} className="radio-label">
                    <input
                      type="radio"
                      name="font"
                      checked={branding.fontFamily === font}
                      onChange={() => setBranding({ ...branding, fontFamily: font })}
                    />
                    <span>{font} {font === 'Inter' && '(Default)'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Live Preview */}
        <div className="branding-column">
          <div className="branding-section sticky-preview">
            <h3>{t('admin.branding.livePreview')}</h3>
            <div
              className="calculator-preview"
              style={{
                backgroundColor: branding.backgroundColor,
                borderRadius: `${branding.cornerRadius}px`,
                fontFamily: branding.fontFamily,
              }}
            >
              <div className="preview-header">
                {branding.showLogo && (
                  <div className="preview-logo">
                    {branding.logo ? (
                      <img src={branding.logo} alt="Logo" />
                    ) : (
                      <Icon name="Image" size={32} />
                    )}
                  </div>
                )}
                <div>
                  {branding.showBusinessName && (
                    <h4 style={{ fontFamily: branding.fontFamily }}>{branding.businessName}</h4>
                  )}
                  {branding.showTagline && (
                    <p style={{ fontFamily: branding.fontFamily }}>{branding.tagline}</p>
                  )}
                </div>
              </div>
              <div className="preview-divider"></div>
              <div className="preview-form" style={{ fontFamily: branding.fontFamily }}>
                <div className="preview-field">
                  <label>{t('admin.branding.uploadModel')}</label>
                  <div className="preview-input" style={{ borderRadius: `${branding.cornerRadius}px` }}>
                    Choose File
                  </div>
                </div>
                <div className="preview-field">
                  <label>{t('admin.branding.material')}</label>
                  <div className="preview-select" style={{ borderRadius: `${branding.cornerRadius}px` }}>
                    PLA ▼
                  </div>
                </div>
                <button 
                  className="preview-button" 
                  style={{ 
                    backgroundColor: branding.primaryColor,
                    borderRadius: `${branding.cornerRadius}px`
                  }}
                >
                  {t('admin.branding.calculatePrice')}
                </button>
              </div>
              {branding.showPoweredBy && (
                <div className="preview-footer">
                  <small>Powered by ModelPricer</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-branding {
          max-width: 1400px;
        }

        .page-header {
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #6B7280;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .section-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E5E7EB;
          margin-bottom: 12px;
        }

        .section-head-row h3 {
          margin: 0;
          padding: 0;
          border: none;
        }

        .btn-tertiary {
          padding: 8px 12px;
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          border-radius: 10px;
          font-size: 13px;
          color: #111827;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-tertiary:hover {
          background: #F3F4F6;
          border-color: #D1D5DB;
        }

        .help-callout {
          margin: 0 0 16px 0;
          padding: 12px 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }

        .branding-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .branding-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .branding-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .branding-section h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          padding-bottom: 12px;
          border-bottom: 1px solid #E5E7EB;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        input[type="text"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          color: #111827;
          transition: all 0.2s;
        }

        input[type="text"]:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .help-text {
          margin: 6px 0 0 0;
          font-size: 12px;
          color: #6B7280;
        }

        .error-text {
          margin: 6px 0 0 0;
          font-size: 12px;
          color: #EF4444;
        }

        .input-error {
          border-color: #EF4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #6B7280;
        }

        .header-status.dirty {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.08);
          color: #B45309;
        }

        .current-logo {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .logo-preview {
          width: 120px;
          height: 120px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F9FAFB;
          color: #9CA3AF;
        }

        .logo-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .logo-info p {
          margin: 0;
          font-size: 13px;
          color: #6B7280;
        }

        .upload-area {
          background: #F9FAFB;
          border: 2px dashed #D1D5DB;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .upload-area:hover {
          border-color: #2563EB;
          background: #EFF6FF;
        }

        .upload-area p {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #374151;
        }

        .upload-hint {
          font-size: 12px !important;
          color: #9CA3AF !important;
        }

        .upload-actions {
          display: flex;
          gap: 12px;
        }

        .color-input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .color-input-group input {
          flex: 1;
        }

        .color-swatch {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          flex-shrink: 0;
        }

        .color-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .preset-btn {
          padding: 8px 16px;
          background: white;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          background: #F9FAFB;
          border-color: #2563EB;
          color: #2563EB;
        }

        .font-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .radio-label input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .radio-label span {
          font-size: 14px;
          color: #374151;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-label span {
          font-size: 14px;
          color: #374151;
        }

        .slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #E5E7EB;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563EB;
          cursor: pointer;
          border: none;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .slider-labels span {
          font-size: 12px;
          color: #6B7280;
        }

        .sticky-preview {
          position: sticky;
          top: 24px;
        }

        .calculator-preview {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 24px;
          min-height: 400px;
        }

        .preview-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .preview-logo {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: #F9FAFB;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9CA3AF;
        }

        .preview-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .preview-header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #6B7280;
        }

        .preview-divider {
          height: 1px;
          background: #E5E7EB;
          margin: 16px 0;
        }

        .preview-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-field label {
          margin-bottom: 6px;
          font-size: 13px;
        }

        .preview-input,
        .preview-select {
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          font-size: 14px;
          color: #6B7280;
        }

        .preview-button {
          padding: 12px 24px;
          color: white;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }

        .preview-footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
        }

        .preview-footer small {
          font-size: 11px;
          color: #9CA3AF;
        }

        .page-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-primary {
          padding: 12px 32px;
          background: #2563EB;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #1D4ED8;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
          padding: 12px 24px;
          background: white;
          color: #374151;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #F9FAFB;
          border-color: #9CA3AF;
        }

        .btn-danger {
          padding: 12px 24px;
          background: white;
          color: #DC2626;
          border: 1px solid #DC2626;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #FEF2F2;
        }

        @media (max-width: 1024px) {
          .branding-grid {
            grid-template-columns: 1fr;
          }

          .sticky-preview {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminBranding;
