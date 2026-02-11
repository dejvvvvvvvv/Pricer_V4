import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';

/* ── FORGE style objects ─────────────────────────────────────────────────── */
const fg = {
  card: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
  },
  sectionTitle: {
    fontSize: 'var(--forge-text-lg)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  text: {
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  textMuted: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
  },
  textSecondary: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
  },
  mono: {
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-accent-primary)',
    fontWeight: 700,
  },
  presetBtn: {
    background: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '1rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  presetBtnHover: {
    borderColor: 'var(--forge-accent-primary)',
  },
  colorBtn: (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: 'var(--forge-radius-md)',
    border: isSelected ? '1px solid var(--forge-accent-primary)' : '1px solid var(--forge-border-default)',
    background: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  colorDot: (hex) => ({
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    border: '1px solid var(--forge-border-default)',
    backgroundColor: hex,
    flexShrink: 0,
  }),
  colorName: {
    fontSize: 'var(--forge-text-xs)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  slider: {
    width: '100%',
    height: '0.5rem',
    borderRadius: 'var(--forge-radius-sm)',
    appearance: 'none',
    background: 'var(--forge-bg-elevated)',
    outline: 'none',
    cursor: 'pointer',
  },
  infillValue: {
    fontFamily: 'var(--forge-font-mono)',
    color: 'var(--forge-accent-primary)',
    fontWeight: 700,
  },
  pill: {
    display: 'inline-block',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono)',
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-muted)',
    border: '1px solid var(--forge-border-default)',
  },
  feeCard: {
    padding: '0.75rem',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    background: 'var(--forge-bg-surface)',
  },
  feeValue: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
  resultCard: {
    background: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1.5rem',
  },
  resultMetricCircle: (bg) => ({
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    margin: '0 auto 0.5rem auto',
  }),
  emptyState: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '4rem',
    height: '4rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
  },
  bannerError: {
    marginBottom: '1rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-error)',
    background: 'rgba(255, 71, 87, 0.08)',
    padding: '0.75rem 1rem',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-error)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerRetry: {
    marginLeft: '0.75rem',
    fontSize: 'var(--forge-text-xs)',
    fontWeight: 500,
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--forge-radius-sm)',
    background: 'rgba(255, 71, 87, 0.15)',
    color: 'var(--forge-error)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  bannerInfo: {
    marginBottom: '1rem',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    padding: '0.75rem 1rem',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
  },
  priceLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  priceValue: {
    fontSize: 'var(--forge-text-xl)',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
};

/* ── Slider custom CSS ──────────────────────────────────────────────────── */
const sliderCSS = `
.forge-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--forge-accent-primary);
  cursor: pointer;
  border: 2px solid var(--forge-bg-void);
  box-shadow: 0 0 6px rgba(0, 212, 170, 0.4);
}
.forge-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--forge-accent-primary);
  cursor: pointer;
  border: 2px solid var(--forge-bg-void);
  box-shadow: 0 0 6px rgba(0, 212, 170, 0.4);
}
`;

const PrintConfiguration = ({
  onConfigChange,
  selectedFile,
  initialConfig,
  // AdminPricing/AdminFees (tenant-scoped)
  pricingConfig,
  feesConfig,
  feeSelections,
  onFeeSelectionsChange,
  uploadedFiles,
  disabled = false,
  // Widget slicing presets
  availablePresets = [],
  defaultPresetId = null,
  selectedPresetId = null,
  onPresetChange,
  presetsLoading = false,
  presetsError = null,
  onPresetsRetry,
}) => {
  const { language } = useLanguage();

  const presetUi = {
    label: language === 'en' ? 'Slicing preset' : 'Preset pro slicování',
    noPresets: language === 'en'
      ? 'No presets available — using default profile (Admin/parameters).'
      : 'Žádné presety nejsou k dispozici — používám default profil (Admin/parameters).',
    failed: language === 'en'
      ? 'Failed to load presets — using default profile.'
      : 'Presety se nepodařilo načíst — používám default profil.',
    placeholder: language === 'en' ? 'Select preset…' : 'Vyber preset…',
  };
  const [config, setConfig] = useState(initialConfig || {
    material: 'pla',
    color: null,
    quality: 'standard',
    infill: 20,
    quantity: 1,
    supports: false,
  });

  useEffect(() => {
    if (initialConfig) {
      // Ensure stable shape for older configs (avoid undefined arrays/bools).
      setConfig({
        material: 'pla',
        color: null,
        quality: 'standard',
        infill: 20,
        quantity: 1,
        supports: false,
        ...(initialConfig || {}),
      });
    }
  }, [initialConfig]);

  // Dynamic materials/colors from AdminPricing (pricing:v3)
  const fallbackColors = useMemo(() => {
    // Simple palette is UI-only fallback (not a source of truth).
    return [
      { id: 'ui_white', name: language === 'en' ? 'White' : 'Bílá', hex: '#F9FAFB' },
      { id: 'ui_black', name: language === 'en' ? 'Black' : 'Černá', hex: '#111827' },
      { id: 'ui_red', name: language === 'en' ? 'Red' : 'Červená', hex: '#EF4444' },
      { id: 'ui_blue', name: language === 'en' ? 'Blue' : 'Modrá', hex: '#3B82F6' },
      { id: 'ui_green', name: language === 'en' ? 'Green' : 'Zelená', hex: '#10B981' },
      { id: 'ui_yellow', name: language === 'en' ? 'Yellow' : 'Žlutá', hex: '#F59E0B' },
      { id: 'ui_orange', name: language === 'en' ? 'Orange' : 'Oranžová', hex: '#F97316' },
      { id: 'ui_purple', name: language === 'en' ? 'Purple' : 'Fialová', hex: '#8B5CF6' },
    ];
  }, [language]);

  const enabledMaterials = useMemo(() => {
    const mats = Array.isArray(pricingConfig?.materials) ? pricingConfig.materials : [];
    return mats.filter((m) => !!m?.enabled);
  }, [pricingConfig]);

  const materialOptions = useMemo(() => {
    return enabledMaterials.map((m) => ({
      value: m.key,
      label: m.name,
      description: (m?.price_per_gram ?? null) !== null
        ? `${Number(m.price_per_gram).toFixed(2)} / g`
        : undefined,
    }));
  }, [enabledMaterials]);

  const selectedMaterial = useMemo(() => {
    const currentKey = config?.material;
    return enabledMaterials.find((m) => m.key === currentKey) || enabledMaterials[0] || null;
  }, [enabledMaterials, config?.material]);

  const uiColors = useMemo(() => {
    const materialColors = Array.isArray(selectedMaterial?.colors) ? selectedMaterial.colors : [];
    const src = materialColors.length ? materialColors : fallbackColors;
    return src.map((c) => ({ id: c.id, name: c.name, hex: c.hex }));
  }, [selectedMaterial, fallbackColors]);

  // Validate selected material/color whenever AdminPricing or selection changes.
  useEffect(() => {
    if (!enabledMaterials.length) return;

    const enabledKeys = new Set(enabledMaterials.map((m) => m.key));
    const next = { ...config };
    let changed = false;

    if (!next.material || !enabledKeys.has(next.material)) {
      next.material = enabledMaterials[0]?.key || 'pla';
      changed = true;
    }

    const mat = enabledMaterials.find((m) => m.key === next.material) || enabledMaterials[0] || null;
    const matColors = Array.isArray(mat?.colors) ? mat.colors : [];
    const fallbackColorId = fallbackColors[0]?.id || null;

    if (matColors.length) {
      const validColorIds = new Set(matColors.map((c) => c.id));
      if (!next.color || !validColorIds.has(next.color)) {
        next.color = matColors[0]?.id || null;
        changed = true;
      }
    } else {
      if (!next.color) {
        next.color = fallbackColorId;
        changed = true;
      }
    }

    if (changed) {
      setConfig(next);
      onConfigChange?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledMaterials, fallbackColors, config?.material, config?.color]);

  // Selectable services (fees) from AdminFees (fees:v3)
  const selectableFees = useMemo(() => {
    const fees = Array.isArray(feesConfig?.fees) ? feesConfig.fees : [];
    // Show only active + selectable fees; required fees are not selectable in UI (will appear in breakdown later).
    return fees.filter((f) => !!f?.active && !!f?.selectable && !f?.required);
  }, [feesConfig]);

  const selectedFeeIds = useMemo(() => {
    const v = feeSelections?.selectedFeeIds;
    if (v instanceof Set) return v;
    if (Array.isArray(v)) return new Set(v);
    return new Set();
  }, [feeSelections]);

  const feeTargetsById = feeSelections?.feeTargetsById && typeof feeSelections.feeTargetsById === 'object'
    ? feeSelections.feeTargetsById
    : {};

  const updateFeeSelections = useCallback((fn) => {
    if (!onFeeSelectionsChange) return;
    onFeeSelectionsChange((prev) => {
      const safePrev = prev && typeof prev === 'object' ? prev : {};
      const prevSet = safePrev.selectedFeeIds instanceof Set
        ? safePrev.selectedFeeIds
        : new Set(Array.isArray(safePrev.selectedFeeIds) ? safePrev.selectedFeeIds : []);
      const prevTargets = safePrev.feeTargetsById && typeof safePrev.feeTargetsById === 'object'
        ? safePrev.feeTargetsById
        : {};
      return fn({ selectedFeeIds: prevSet, feeTargetsById: prevTargets });
    });
  }, [onFeeSelectionsChange]);

  const toggleFeeSelected = useCallback((feeId, checked) => {
    updateFeeSelections((prev) => {
      const nextSet = new Set(prev.selectedFeeIds);
      if (checked) nextSet.add(feeId);
      else nextSet.delete(feeId);
      return { ...prev, selectedFeeIds: nextSet };
    });
  }, [updateFeeSelections]);

  const setFeeTargetAll = useCallback((feeId) => {
    updateFeeSelections((prev) => {
      const nextTargets = { ...(prev.feeTargetsById || {}) };
      delete nextTargets[feeId];
      return { ...prev, feeTargetsById: nextTargets };
    });
  }, [updateFeeSelections]);

  const setFeeTargetSelected = useCallback((feeId, modelIds, uiMode = 'SELECTED') => {
    const uniq = Array.from(new Set((modelIds || []).filter(Boolean)));
    updateFeeSelections((prev) => {
      const nextTargets = { ...(prev.feeTargetsById || {}) };
      // uiMode is UI-only; engine uses { mode, modelIds }.
      nextTargets[feeId] = { mode: 'SELECTED', modelIds: uniq, uiMode };
      return { ...prev, feeTargetsById: nextTargets };
    });
  }, [updateFeeSelections]);

  const formatFeeValue = useCallback((fee) => {
    const v = Number(fee?.value || 0);
    const sign = v >= 0 ? '+' : '−';
    const abs = Math.abs(v);

    const unit = (s) => (language === 'en' ? s.en : s.cs);

    switch (fee?.type) {
      case 'percent':
        return `${sign}${abs}%`;
      case 'per_gram':
        return `${sign}${abs} ${unit({ cs: 'Kč/g', en: 'CZK/g' })}`;
      case 'per_minute':
        return `${sign}${abs} ${unit({ cs: 'Kč/min', en: 'CZK/min' })}`;
      case 'per_cm3':
        return `${sign}${abs} ${unit({ cs: 'Kč/cm³', en: 'CZK/cm³' })}`;
      case 'per_cm2':
        return `${sign}${abs} ${unit({ cs: 'Kč/cm²', en: 'CZK/cm²' })}`;
      case 'per_piece':
        return `${sign}${abs} ${unit({ cs: 'Kč/kus', en: 'CZK/piece' })}`;
      case 'flat':
      default:
        return `${sign}${abs} ${unit({ cs: 'Kč', en: 'CZK' })}`;
    }
  }, [language]);

  const qualities = [
    { value: 'nozzle_08', label: 'Extra hrubý (0.8mm)', description: 'Extrémně rychlý tisk pro robustní díly.' },
    { value: 'nozzle_06', label: 'Hrubý (0.6mm)', description: 'Rychlý tisk ideální pro velké modely.' },
    { value: 'nozzle_04', label: 'Rychlý (0.4mm)', description: 'Urychlený tisk pro méně detailní objekty.' },
    { value: 'draft', label: 'Návrhový (0.3mm)', description: 'Nejrychlejší pro ověření konceptu, nízká kvalita.' },
    { value: 'standard', label: 'Standardní (0.2mm)', description: 'Vyvážený poměr kvality a rychlosti.' },
    { value: 'fine', label: 'Jemný (0.15mm)', description: 'Vysoká kvalita pro detailní modely.' },
    { value: 'ultra', label: 'Ultra jemný (0.1mm)', description: 'Nejvyšší možná kvalita, velmi pomalý tisk.' }
  ];

  const commitConfig = (nextConfig) => {
    setConfig(nextConfig);
    onConfigChange?.(nextConfig);
  };

  const handleConfigChange = (key, value) => {
    commitConfig({ ...config, [key]: value });
  };

  const handleMaterialChange = (materialKey) => {
    const mat = enabledMaterials.find((m) => m.key === materialKey) || null;
    const nextColor = (Array.isArray(mat?.colors) && mat.colors.length)
      ? mat.colors[0]?.id
      : (fallbackColors[0]?.id || null);
    commitConfig({ ...config, material: materialKey, color: nextColor });
  };

  const handleColorChange = (colorId) => {
    commitConfig({ ...config, color: colorId });
  };

  // Quality presets
  const qualityPresets = {
    basic: {
      name: 'Basic',
      description: 'Rychlý tisk, nízká kvalita',
      settings: {
        quality: 'nozzle_06',
        infill: 15,
        supports: false,
      }
    },
    middle: {
      name: 'Middle',
      description: 'Vyvážená kvalita a rychlost',
      settings: {
        quality: 'standard',
        infill: 20,
        supports: true,
      }
    },
    pro: {
      name: 'Pro',
      description: 'Nejvyšší kvalita, pomalý tisk',
      settings: {
        quality: 'fine',
        infill: 30,
        supports: true,
      }
    }
  };

  const applyPreset = (presetKey) => {
    const preset = qualityPresets[presetKey];
    const newConfig = { ...config, ...preset.settings };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };


  if (!selectedFile) {
    return (
      <div style={fg.emptyState}>
        <div style={fg.emptyIcon}>
          <Icon name="Settings" size={24} style={{ color: 'var(--forge-text-muted)' }} />
        </div>
        <h3 style={{ ...fg.sectionTitle, justifyContent: 'center', marginBottom: '0.5rem' }}>
          Konfigurace tisku
        </h3>
        <p style={fg.textSecondary}>
          Nejprve nahrajte 3D model pro konfiguraci parametrů tisku
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{sliderCSS}</style>

      {/* Slicing preset selector (loaded from backend) */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Sliders" size={20} style={{ marginRight: '0.5rem' }} />
          {presetUi.label}
        </h3>

        {/* Error / no presets banners */}
        {presetsError && (
          <div style={fg.bannerError}>
            <span>{presetUi.failed}</span>
            {onPresetsRetry && (
              <button
                onClick={onPresetsRetry}
                style={fg.bannerRetry}
              >
                {language === 'en' ? 'Retry' : 'Zkusit znovu'}
              </button>
            )}
          </div>
        )}

        {!presetsError && !presetsLoading && (availablePresets?.length || 0) === 0 && (
          <div style={fg.bannerInfo}>
            {presetUi.noPresets}
          </div>
        )}

        {(availablePresets?.length || 0) > 0 && (
          <Select
            label={presetUi.label}
            options={(availablePresets || []).map((p) => ({ value: p.id, label: p.name }))}
            value={selectedPresetId || ''}
            onChange={(value) => onPresetChange?.(value || null)}
            searchable
            loading={presetsLoading}
            disabled={presetsLoading}
            placeholder={presetUi.placeholder}
          />
        )}

        {/* Show loading state even when presets list is not yet available */}
        {presetsLoading && (availablePresets?.length || 0) === 0 && (
          <Select
            label={presetUi.label}
            options={[]}
            value=""
            onChange={() => { }}
            loading
            disabled
            placeholder={presetUi.placeholder}
          />
        )}
      </div>

      {/* Quality Presets */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Zap" size={20} style={{ marginRight: '0.5rem' }} />
          RYCHLÉ PŘEDVOLBY
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {Object.entries(qualityPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={fg.presetBtn}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--forge-accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-default)'; }}
            >
              <div style={{ fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {preset.name}
              </div>
              <div style={fg.textMuted}>{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Material Selection */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Package" size={20} style={{ marginRight: '0.5rem' }} />
          MATERIÁL A BARVA
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="MATERIÁL"
            options={materialOptions}
            value={config?.material || ''}
            onChange={(value) => handleMaterialChange(value)}
            searchable
            disabled={disabled || materialOptions.length <= 1}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={fg.label}>BARVA</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {uiColors?.map((color) => (
                <button
                  key={color?.id}
                  onClick={() => handleColorChange(color?.id)}
                  disabled={disabled}
                  style={fg.colorBtn(config?.color === color?.id)}
                >
                  <div style={fg.colorDot(color?.hex)} />
                  <span style={fg.colorName}>{color?.name}</span>
                </button>
              ))}
            </div>
            {selectedMaterial && (!Array.isArray(selectedMaterial?.colors) || selectedMaterial.colors.length === 0) && (
              <div style={fg.textMuted}>
                {language === 'en' ? 'Using fallback palette (UI only).' : 'Používám fallback paletu (jen pro UI).'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Quality */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Layers" size={20} style={{ marginRight: '0.5rem' }} />
          KVALITA TISKU
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="KVALITA VRSTVY"
            options={qualities}
            value={config?.quality}
            onChange={(value) => handleConfigChange('quality', value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={fg.label}>
              VÝPLŇ: <span style={fg.infillValue}>{config?.infill}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config?.infill}
              onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}
              className="forge-slider"
              style={fg.slider}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={fg.textMuted}>Rychlý (10%)</span>
              <span style={fg.textMuted}>Pevný (100%)</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Checkbox
            label="Podpěry"
            description="Automatické generování podpěr pro převislé části"
            checked={config?.supports}
            onChange={(e) => handleConfigChange('supports', e?.target?.checked)}
          />
        </div>
      </div>

      {/* Quantity */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Package2" size={20} style={{ marginRight: '0.5rem' }} />
          MNOŽSTVÍ
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="POČET KUSŮ"
            type="number"
            min="1"
            max="100"
            value={config?.quantity}
            onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}
          />
          <p style={fg.textMuted}>
            Expresní příplatky a další služby nastavíš v <span style={{ fontWeight: 500 }}>Admin / Fees</span>.
          </p>
        </div>
      </div>

      {/* Additional services (fees from AdminFees) */}
      <div style={fg.card}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Wrench" size={20} style={{ marginRight: '0.5rem' }} />
          DODATEČNÉ SLUŽBY
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectableFees.length === 0 ? (
            <div style={fg.textSecondary}>
              {language === 'en'
                ? 'No selectable services configured. Add fees in Admin / Fees.'
                : 'Žádné volitelné služby nejsou nastavené. Přidej je v Admin / Fees.'}
            </div>
          ) : (
            selectableFees.map((fee) => {
              const isSelected = selectedFeeIds.has(fee.id);
              const target = feeTargetsById?.[fee.id];
              const targetIds = Array.isArray(target?.modelIds) ? target.modelIds : [];
              const targetUi = (target && typeof target === 'object' && target.uiMode)
                ? target.uiMode
                : (target?.mode === 'SELECTED' ? 'SELECTED' : 'ALL');

              const canTarget = !!fee?.apply_to_selected_models_enabled && (uploadedFiles?.length || 0) > 1;
              const currentId = selectedFile?.id || null;
              const ensureAtLeastOne = (ids) => {
                const uniq = Array.from(new Set((ids || []).filter(Boolean)));
                if (uniq.length > 0) return uniq;
                return currentId ? [currentId] : [];
              };

              return (
                <div key={fee.id} style={fg.feeCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleFeeSelected(fee.id, !!e?.target?.checked)}
                      />
                      <div>
                        <p style={{ ...fg.text, fontWeight: 500 }}>{fee.name}</p>
                        {fee.description ? (
                          <p style={fg.textMuted}>{fee.description}</p>
                        ) : null}
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={fg.pill}>
                            {(fee.scope || 'MODEL').toUpperCase()}
                          </span>
                          {fee.charge_basis === 'PER_PIECE' ? (
                            <span style={fg.pill}>
                              {language === 'en' ? 'Per piece' : 'Za kus'}
                            </span>
                          ) : (
                            <span style={fg.pill}>
                              {language === 'en' ? 'Per file' : 'Za soubor'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={fg.feeValue}>{formatFeeValue(fee)}</p>
                      <p style={fg.textMuted}>
                        {fee.type === 'percent'
                          ? (language === 'en' ? 'from subtotal' : 'ze subtotalu')
                          : (language === 'en' ? 'in quote' : 'v ceně')}
                      </p>
                    </div>
                  </div>

                  {canTarget && isSelected && (
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
                      <div style={{ ...fg.textMuted, marginBottom: '0.5rem' }}>
                        {language === 'en' ? 'Apply to:' : 'Aplikovat na:'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: 'var(--forge-text-base)', color: 'var(--forge-text-primary)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'ALL'}
                            onChange={() => setFeeTargetAll(fee.id)}
                          />
                          <span>{language === 'en' ? 'All models' : 'Všechny modely'}</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'THIS'}
                            onChange={() => setFeeTargetSelected(fee.id, currentId ? [currentId] : [], 'THIS')}
                          />
                          <span>{language === 'en' ? 'This model' : 'Tento model'}</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'SELECTED'}
                            onChange={() => setFeeTargetSelected(fee.id, ensureAtLeastOne(targetIds), 'SELECTED')}
                          />
                          <span>{language === 'en' ? 'Selected models' : 'Vybrané modely'}</span>
                        </label>
                      </div>

                      {targetUi === 'SELECTED' && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(uploadedFiles || []).map((f) => {
                            const checked = targetIds.includes(f.id);
                            return (
                              <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-primary)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = new Set(targetIds);
                                    if (e?.target?.checked) next.add(f.id);
                                    else next.delete(f.id);
                                    setFeeTargetSelected(fee.id, ensureAtLeastOne(Array.from(next)), 'SELECTED');
                                  }}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>{f.name}</span>
                                {f.id === currentId ? (
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '999px',
                                    background: 'rgba(0, 212, 170, 0.1)',
                                    color: 'var(--forge-accent-primary)',
                                    border: '1px solid rgba(0, 212, 170, 0.2)',
                                    fontFamily: 'var(--forge-font-mono)',
                                  }}>
                                    {language === 'en' ? 'current' : 'aktuální'}
                                  </span>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!!fee?.apply_to_selected_models_enabled === false && isSelected ? (
                    <div style={{ marginTop: '0.5rem', ...fg.textMuted }}>
                      {language === 'en' ? 'Applied to all models.' : 'Aplikováno na všechny modely.'}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Estimated Results */}
      <div style={fg.resultCard}>
        <h3 style={fg.sectionTitle}>
          <Icon name="Clock" size={20} style={{ marginRight: '0.5rem' }} />
          {selectedFile?.status === 'processing' ? 'VÝPOČET...' :
            selectedFile?.status === 'completed' ? 'VÝSLEDKY SLICINGU' : 'ODHAD TISKU'}
        </h3>

        {selectedFile?.status === 'processing' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <Icon name="Loader" size={32} className="animate-spin" style={{ color: 'var(--forge-accent-primary)' }} />
            <span style={{ marginLeft: '0.75rem', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-body)' }}>Zpracovávám model...</span>
          </div>
        )}

        {selectedFile?.status === 'failed' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <Icon name="XCircle" size={32} style={{ color: 'var(--forge-error)', margin: '0 auto 0.5rem auto', display: 'block' }} />
            <p style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-error)' }}>{selectedFile.error || 'Slicing se nezdařil'}</p>
          </div>
        )}

        {selectedFile?.status === 'completed' && selectedFile?.result && (() => {
          // Bug 4 fix: safe number helper
          const safeN = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
          const res = selectedFile.result;
          const timeSeconds = safeN(res.time, 0);
          const materialG = safeN(res.material, 0);
          const layers = safeN(res.layers, 0);
          const price = safeN(res.price, 0);

          return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={fg.resultMetricCircle('rgba(0, 212, 170, 0.1)')}>
                  <Icon name="Clock" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
                </div>
                <p style={{ ...fg.text, fontWeight: 500, fontFamily: 'var(--forge-font-mono)' }}>
                  {timeSeconds > 0 ? `${Math.round(timeSeconds / 3600)}h ${Math.round((timeSeconds % 3600) / 60)}min` : '—'}
                </p>
                <p style={fg.textMuted}>Doba tisku</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={fg.resultMetricCircle('rgba(0, 212, 170, 0.1)')}>
                  <Icon name="Weight" size={20} style={{ color: 'var(--forge-success)' }} />
                </div>
                <p style={{ ...fg.text, fontWeight: 500, fontFamily: 'var(--forge-font-mono)' }}>{materialG > 0 ? `${Math.round(materialG)}g` : '—'}</p>
                <p style={fg.textMuted}>Hmotnost</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={fg.resultMetricCircle('rgba(255, 181, 71, 0.1)')}>
                  <Icon name="Layers" size={20} style={{ color: 'var(--forge-warning)' }} />
                </div>
                <p style={{ ...fg.text, fontWeight: 500, fontFamily: 'var(--forge-font-mono)' }}>{layers > 0 ? layers : '—'}</p>
                <p style={fg.textMuted}>Vrstvy</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={fg.resultMetricCircle('rgba(255, 71, 87, 0.1)')}>
                  <Icon name="Thermometer" size={20} style={{ color: 'var(--forge-error)' }} />
                </div>
                <p style={{ ...fg.text, fontWeight: 500, fontFamily: 'var(--forge-font-mono)' }}>
                  {config?.material === 'pla' ? '200°C' :
                    config?.material === 'abs' ? '250°C' :
                      config?.material === 'petg' ? '230°C' :
                        config?.material === 'tpu' ? '220°C' : '210°C'}
                </p>
                <p style={fg.textMuted}>Teplota</p>
              </div>
            </div>

            {res.pricing && Array.isArray(res.pricing?.breakdown) && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--forge-border-default)' }}>
                <div style={fg.priceLine}>
                  <span style={fg.priceLabel}>Cena za tisk:</span>
                  <span style={fg.priceValue}>{price > 0 ? `${Math.round(price)} Kč` : '—'}</span>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {res.pricing.breakdown.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
                      <span>{item?.label ?? ''}:</span>
                      <span>{Number.isFinite(Number(item?.amount)) ? `${Math.round(Number(item.amount))} Kč` : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
          );
        })()}

        {(!selectedFile?.result && selectedFile?.status !== 'processing' && selectedFile?.status !== 'failed') && (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--forge-text-secondary)', fontSize: 'var(--forge-text-sm)', fontFamily: 'var(--forge-font-body)' }}>
            Nastavte parametry a model se automaticky zpracuje
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintConfiguration;
