import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import QuantityStepper from './QuantityStepper';
import { Checkbox } from '../../../components/ui/Checkbox';
import ForgeCheckbox from '../../../components/ui/forge/ForgeCheckbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import MaterialComparison from './MaterialComparison';
import QualityComparison from './QualityComparison';
import { calculateOrderQuote } from '../../../lib/pricing/pricingEngineV3';

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

/* ── User Print Presets (localStorage) ──────────────────────────────────── */
const USER_PRESETS_KEY = 'modelpricer:user:print-presets';
const MAX_USER_PRESETS = 10;

const DEFAULT_USER_PRESETS = [
  {
    id: '__default_quick_draft',
    name: 'Rychly navrh',
    isDefault: true,
    settings: { quality: 'draft', infill: 10, supports: false },
  },
  {
    id: '__default_standard',
    name: 'Standard',
    isDefault: true,
    settings: { quality: 'standard', infill: 20, supports: false },
  },
  {
    id: '__default_high_quality',
    name: 'Vysoka kvalita',
    isDefault: true,
    settings: { quality: 'fine', infill: 30, supports: true },
  },
];

function loadUserPresets() {
  try {
    const raw = localStorage.getItem(USER_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserPresets(presets) {
  try {
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

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
  // Material comparison props
  printConfigs,
  expressConfig,
  selectedExpressTierId,
  onExpressTierChange,
  couponsConfig,
  appliedCouponCode,
  shippingConfig,
  selectedShippingMethodId,
  onShippingMethodChange,
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

  /* ── User presets state ─────────────────────────────────────────────── */
  const [userPresets, setUserPresets] = useState(() => loadUserPresets());
  const [userPresetsOpen, setUserPresetsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');
  const saveInputRef = useRef(null);

  const allUserPresets = useMemo(
    () => [...DEFAULT_USER_PRESETS, ...userPresets],
    [userPresets],
  );

  const handleSaveUserPreset = useCallback(() => {
    const trimmed = (savePresetName || '').trim();
    if (!trimmed) return;
    if (userPresets.length >= MAX_USER_PRESETS) return;

    const newPreset = {
      id: `user_${Date.now()}`,
      name: trimmed,
      isDefault: false,
      settings: {
        material: config?.material,
        color: config?.color,
        quality: config?.quality,
        infill: config?.infill,
        quantity: config?.quantity,
        supports: !!config?.supports,
      },
    };
    const next = [...userPresets, newPreset];
    setUserPresets(next);
    saveUserPresets(next);
    setSavePresetName('');
    setSaveDialogOpen(false);
  }, [savePresetName, userPresets, config]);

  const handleDeleteUserPreset = useCallback((presetId) => {
    const next = userPresets.filter((p) => p.id !== presetId);
    setUserPresets(next);
    saveUserPresets(next);
  }, [userPresets]);

  const handleApplyUserPreset = useCallback((preset) => {
    if (!preset?.settings) return;
    const merged = { ...config, ...preset.settings };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === undefined) delete merged[k];
    });
    setConfig(merged);
    onConfigChange?.(merged);
  }, [config, onConfigChange]);

  useEffect(() => {
    if (saveDialogOpen && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [saveDialogOpen]);

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

  const applyQualitySettings = useCallback((settings) => {
    const newConfig = { ...config, ...settings };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [config, onConfigChange]);


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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} role="form" aria-label="Konfigurace tisku">
      <style>{sliderCSS}</style>

      {/* ── User Print Presets (savable) ────────────────────────────────── */}
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Moje predvolby tisku">
        <button
          type="button"
          onClick={() => setUserPresetsOpen((v) => !v)}
          aria-expanded={userPresetsOpen}
          aria-controls="user-presets-panel"
          style={{
            ...fg.sectionTitle,
            marginBottom: userPresetsOpen ? '1rem' : 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            padding: 0,
          }}
        >
          <Icon name="Bookmark" size={20} style={{ marginRight: '0.5rem' }} />
          <span style={{ flex: 1, textAlign: 'left' }}>
            {language === 'en' ? 'MY PRESETS' : 'MOJE PREDVOLBY'}
          </span>
          <Icon
            name={userPresetsOpen ? 'ChevronUp' : 'ChevronDown'}
            size={16}
            style={{ color: 'var(--forge-text-muted)', transition: 'transform 0.2s' }}
          />
        </button>

        {userPresetsOpen && (
          <div id="user-presets-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Preset chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Seznam predvoleb">
              {allUserPresets.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid var(--forge-border-default)',
                    background: preset.isDefault
                      ? 'var(--forge-bg-elevated)'
                      : 'rgba(0, 212, 170, 0.06)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    fontSize: 'var(--forge-text-sm)',
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-primary)',
                    maxWidth: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleApplyUserPreset(preset)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '160px',
                    }}
                    title={preset.name}
                    aria-label={`${language === 'en' ? 'Apply preset' : 'Pouzit predvolbu'}: ${preset.name}`}
                  >
                    {preset.isDefault && (
                      <Icon name="Zap" size={12} style={{ marginRight: '0.25rem', verticalAlign: '-1px', color: 'var(--forge-text-muted)' }} />
                    )}
                    {preset.name}
                  </button>
                  {!preset.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUserPreset(preset.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0 0 0 0.125rem',
                        cursor: 'pointer',
                        color: 'var(--forge-text-muted)',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: '20px',
                        minHeight: '20px',
                        justifyContent: 'center',
                      }}
                      aria-label={`${language === 'en' ? 'Delete preset' : 'Smazat predvolbu'}: ${preset.name}`}
                    >
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Save new preset */}
            {!saveDialogOpen ? (
              <button
                type="button"
                onClick={() => setSaveDialogOpen(true)}
                disabled={userPresets.length >= MAX_USER_PRESETS}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--forge-radius-md)',
                  border: '1px dashed var(--forge-border-default)',
                  background: 'none',
                  cursor: userPresets.length >= MAX_USER_PRESETS ? 'not-allowed' : 'pointer',
                  opacity: userPresets.length >= MAX_USER_PRESETS ? 0.5 : 1,
                  fontSize: 'var(--forge-text-sm)',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-muted)',
                  transition: 'border-color 0.15s, color 0.15s',
                  alignSelf: 'flex-start',
                  minHeight: '36px',
                }}
                onMouseEnter={(e) => {
                  if (userPresets.length < MAX_USER_PRESETS) {
                    e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                    e.currentTarget.style.color = 'var(--forge-accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                  e.currentTarget.style.color = 'var(--forge-text-muted)';
                }}
                aria-label={language === 'en' ? 'Save current settings as preset' : 'Ulozit aktualni nastaveni jako predvolbu'}
              >
                <Icon name="Plus" size={14} />
                {language === 'en' ? 'Save as preset' : 'Ulozit jako predvolbu'}
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--forge-radius-md)',
                  border: '1px solid var(--forge-accent-primary)',
                  background: 'rgba(0, 212, 170, 0.04)',
                }}
              >
                <label htmlFor="user-preset-name" className="sr-only">
                  {language === 'en' ? 'Preset name' : 'Nazev predvolby'}
                </label>
                <input
                  ref={saveInputRef}
                  id="user-preset-name"
                  type="text"
                  maxLength={40}
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUserPreset();
                    if (e.key === 'Escape') { setSaveDialogOpen(false); setSavePresetName(''); }
                  }}
                  placeholder={language === 'en' ? 'Preset name...' : 'Nazev predvolby...'}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--forge-radius-sm)',
                    border: '1px solid var(--forge-border-default)',
                    background: 'var(--forge-bg-surface)',
                    color: 'var(--forge-text-primary)',
                    fontSize: 'var(--forge-text-sm)',
                    fontFamily: 'var(--forge-font-body)',
                    outline: 'none',
                  }}
                  aria-label={language === 'en' ? 'Preset name' : 'Nazev predvolby'}
                />
                <button
                  type="button"
                  onClick={handleSaveUserPreset}
                  disabled={!(savePresetName || '').trim()}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--forge-radius-sm)',
                    border: 'none',
                    background: 'var(--forge-accent-primary)',
                    color: 'var(--forge-bg-void, #0a0e17)',
                    fontSize: 'var(--forge-text-sm)',
                    fontFamily: 'var(--forge-font-body)',
                    fontWeight: 600,
                    cursor: (savePresetName || '').trim() ? 'pointer' : 'not-allowed',
                    opacity: (savePresetName || '').trim() ? 1 : 0.5,
                    minHeight: '32px',
                    whiteSpace: 'nowrap',
                  }}
                  aria-label={language === 'en' ? 'Confirm save' : 'Potvrdit ulozeni'}
                >
                  {language === 'en' ? 'Save' : 'Ulozit'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSaveDialogOpen(false); setSavePresetName(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    color: 'var(--forge-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '28px',
                    minHeight: '28px',
                    justifyContent: 'center',
                  }}
                  aria-label={language === 'en' ? 'Cancel' : 'Zrusit'}
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {/* Limit hint */}
            {userPresets.length >= MAX_USER_PRESETS && (
              <p style={fg.textMuted}>
                {language === 'en'
                  ? `Maximum ${MAX_USER_PRESETS} custom presets reached. Delete one to save a new one.`
                  : `Maximum ${MAX_USER_PRESETS} vlastnich predvoleb dosazeno. Smazte jednu pro ulozeni nove.`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Slicing preset selector (loaded from backend) */}
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Preset pro slicovani">
        <h3 style={fg.sectionTitle}>
          <Icon name="Sliders" size={20} style={{ marginRight: '0.5rem' }} />
          {presetUi.label}
        </h3>

        {/* Error / no presets banners */}
        {presetsError && (
          <div style={fg.bannerError} role="alert">
            <span>{presetUi.failed}</span>
            {onPresetsRetry && (
              <button
                onClick={onPresetsRetry}
                style={{ ...fg.bannerRetry, minHeight: '44px', minWidth: '44px' }}
                aria-label={language === 'en' ? 'Retry loading presets' : 'Zkusit znovu nacist presety'}
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
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Rychle predvolby">
        <h3 style={fg.sectionTitle}>
          <Icon name="Zap" size={20} style={{ marginRight: '0.5rem' }} />
          RYCHLE PREDVOLBY
        </h3>

        <div className="tk-print-preset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} role="group" aria-label="Rychle predvolby kvality">
          {Object.entries(qualityPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{ ...fg.presetBtn, minHeight: '44px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--forge-accent-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-default)'; }}
              aria-label={`Predvolba ${preset.name}: ${preset.description}`}
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
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Material a barva">
        <h3 style={fg.sectionTitle}>
          <Icon name="Package" size={20} style={{ marginRight: '0.5rem' }} />
          MATERIAL A BARVA
        </h3>

        <div className="tk-print-material-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Color swatch for selected material */}
              {(() => {
                const matColors = Array.isArray(selectedMaterial?.colors) ? selectedMaterial.colors : [];
                const selectedColor = matColors.find((c) => c.id === config?.color) || matColors[0];
                const hex = selectedColor?.hex;
                if (!hex) return null;
                return (
                  <div style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    border: '1px solid var(--forge-border-default)',
                    backgroundColor: hex,
                    flexShrink: 0,
                  }} aria-hidden="true" />
                );
              })()}
              <label htmlFor="tk-material-select" style={fg.label}>MATERIAL</label>
              {selectedMaterial?.price_per_gram != null && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-mono)',
                  color: 'var(--forge-text-muted)',
                  marginLeft: 'auto',
                }}>
                  od {Number(selectedMaterial.price_per_gram).toFixed(2)} Kč/g
                </span>
              )}
            </div>
            <Select
              options={materialOptions}
              value={config?.material || ''}
              onChange={(value) => handleMaterialChange(value)}
              searchable
              disabled={disabled || materialOptions.length <= 1}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={fg.label}>BARVA</label>
            <div className="tk-print-color-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }} role="radiogroup" aria-label="Vyber barvu">
              {uiColors?.map((color) => (
                <button
                  key={color?.id}
                  onClick={() => handleColorChange(color?.id)}
                  disabled={disabled}
                  className="tk-print-color-btn"
                  role="radio"
                  aria-checked={config?.color === color?.id}
                  aria-label={`Barva: ${color?.name}`}
                  style={{ ...fg.colorBtn(config?.color === color?.id), minHeight: '44px' }}
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

      {/* Material Comparison (expandable) */}
      <MaterialComparison
        pricingConfig={pricingConfig}
        feesConfig={feesConfig}
        feeSelections={feeSelections}
        selectedFile={selectedFile}
        uploadedFiles={uploadedFiles}
        printConfigs={printConfigs}
        currentMaterialKey={config?.material}
        onMaterialChange={handleMaterialChange}
        expressConfig={expressConfig}
        selectedExpressTierId={selectedExpressTierId}
        couponsConfig={couponsConfig}
        appliedCouponCode={appliedCouponCode}
        shippingConfig={shippingConfig}
        selectedShippingMethodId={selectedShippingMethodId}
      />

      {/* Print Quality */}
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Kvalita tisku">
        <h3 style={fg.sectionTitle}>
          <Icon name="Layers" size={20} style={{ marginRight: '0.5rem' }} />
          KVALITA TISKU
        </h3>

        <div className="tk-print-quality-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="KVALITA VRSTVY"
            options={qualities}
            value={config?.quality}
            onChange={(value) => handleConfigChange('quality', value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="tk-infill-slider" style={fg.label}>
              VYPLN: <span style={fg.infillValue}>{config?.infill}%</span>
            </label>
            <input
              id="tk-infill-slider"
              type="range"
              min="10"
              max="100"
              step="5"
              value={config?.infill}
              onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}
              className="forge-slider"
              style={fg.slider}
              aria-label={`Vypln: ${config?.infill}%`}
              aria-valuemin={10}
              aria-valuemax={100}
              aria-valuenow={config?.infill}
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

      {/* Quality Comparison (expandable) */}
      <QualityComparison
        pricingConfig={pricingConfig}
        feesConfig={feesConfig}
        feeSelections={feeSelections}
        selectedFile={selectedFile}
        printConfigs={printConfigs}
        currentConfig={config}
        onApplyPreset={applyQualitySettings}
        expressConfig={expressConfig}
        selectedExpressTierId={selectedExpressTierId}
        couponsConfig={couponsConfig}
        appliedCouponCode={appliedCouponCode}
        shippingConfig={shippingConfig}
        selectedShippingMethodId={selectedShippingMethodId}
      />

      {/* Quantity */}
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Mnozstvi">
        <h3 style={fg.sectionTitle}>
          <Icon name="Package2" size={20} style={{ marginRight: '0.5rem' }} />
          MNOZSTVI
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <QuantityStepper
            value={config?.quantity ?? 1}
            onChange={(qty) => handleConfigChange('quantity', qty)}
            min={1}
            max={9999}
            disabled={disabled}
            label="POČET KUSŮ"
            unitPrice={(() => {
              // Compute per-unit price from pricing engine for the selected model
              if (!selectedFile || selectedFile.status !== 'completed' || !selectedFile.result) return null;
              if (!pricingConfig) return null;
              try {
                const singleQuote = calculateOrderQuote({
                  uploadedFiles: [selectedFile],
                  printConfigs: { [selectedFile.id]: { ...config, quantity: 1 } },
                  pricingConfig,
                  feesConfig,
                  feeSelections,
                });
                if (singleQuote && Number.isFinite(singleQuote.total) && singleQuote.total > 0) {
                  return singleQuote.total;
                }
              } catch {
                // Silently fail — just don't show unit price
              }
              return null;
            })()}
            currency="Kč"
          />

          {/* Total pieces across all files */}
          {(uploadedFiles?.length || 0) > 1 && printConfigs && (() => {
            const totalPieces = (uploadedFiles || []).reduce((sum, f) => {
              const q = printConfigs?.[f.id]?.quantity;
              return sum + (Number.isFinite(Number(q)) ? Math.max(1, Number(q)) : 1);
            }, 0);
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--forge-radius-md)',
                background: 'rgba(0, 212, 170, 0.06)',
                border: '1px solid rgba(0, 212, 170, 0.15)',
              }}>
                <Icon name="Layers" size={14} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 'var(--forge-text-sm)',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-secondary)',
                }}>
                  Celkem:{' '}
                  <span style={{
                    fontFamily: 'var(--forge-font-mono)',
                    fontWeight: 700,
                    color: 'var(--forge-accent-primary)',
                  }}>
                    {totalPieces} {totalPieces === 1 ? 'kus' : totalPieces < 5 ? 'kusy' : 'kusů'}
                  </span>
                  {' '}({uploadedFiles.length} {uploadedFiles.length === 1 ? 'soubor' : uploadedFiles.length < 5 ? 'soubory' : 'souborů'})
                </span>
              </div>
            );
          })()}

          <p style={fg.textMuted}>
            Expresní příplatky a další služby nastavíš v <span style={{ fontWeight: 500 }}>Admin / Fees</span>.
          </p>
        </div>
      </div>

      {/* Additional services (fees from AdminFees) */}
      <div className="tk-print-config-card" style={fg.card} role="region" aria-label="Dodatecne sluzby">
        <h3 style={fg.sectionTitle}>
          <Icon name="Wrench" size={20} style={{ marginRight: '0.5rem' }} />
          DODATECNE SLUZBY
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
                <div
                  key={fee.id}
                  className="tk-fee-card"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Sluzba: ${fee.name} - ${formatFeeValue(fee)}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFeeSelected(fee.id, !isSelected);
                    }
                  }}
                  style={{
                    ...fg.feeCard,
                    cursor: 'pointer',
                    transition: 'border-color 200ms ease, background 200ms ease',
                    borderLeft: isSelected ? '3px solid var(--forge-accent-primary)' : '3px solid transparent',
                    background: isSelected ? 'rgba(0, 212, 170, 0.06)' : undefined,
                  }}
                  onClick={() => toggleFeeSelected(fee.id, !isSelected)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <ForgeCheckbox
                        checked={isSelected}
                        onChange={() => {}}
                        size={22}
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
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ ...fg.textMuted, marginBottom: '0.5rem' }}>
                        {language === 'en' ? 'Apply to:' : 'Aplikovat na:'}
                      </div>
                      <div className="tk-fee-radio-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: 'var(--forge-text-base)', color: 'var(--forge-text-primary)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: '44px' }}>
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'ALL'}
                            onChange={() => setFeeTargetAll(fee.id)}
                          />
                          <span>{language === 'en' ? 'All models' : 'Všechny modely'}</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: '44px' }}>
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'THIS'}
                            onChange={() => setFeeTargetSelected(fee.id, currentId ? [currentId] : [], 'THIS')}
                          />
                          <span>{language === 'en' ? 'This model' : 'Tento model'}</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: '44px' }}>
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

      {/* Shipping method selection */}
      {shippingConfig?.enabled && Array.isArray(shippingConfig.methods) && shippingConfig.methods.filter(m => m.active !== false).length > 0 && (
        <div className="tk-print-config-card" style={fg.card} role="region" aria-label={language === 'en' ? 'Shipping' : 'Doprava'}>
          <h3 style={fg.sectionTitle}>
            <Icon name="Truck" size={20} style={{ marginRight: '0.5rem' }} />
            {language === 'en' ? 'SHIPPING' : 'DOPRAVA'}
          </h3>

          {/* Free shipping progress */}
          {shippingConfig.free_shipping_enabled && shippingConfig.free_shipping_threshold > 0 && (() => {
            // Compute current order total for free shipping check
            const orderTotal = (() => {
              try {
                const completedFiles = (uploadedFiles || []).filter(f => f?.status === 'completed' && f?.result);
                if (completedFiles.length === 0 || !pricingConfig) return 0;
                const q = calculateOrderQuote({ uploadedFiles: completedFiles, printConfigs: printConfigs || {}, pricingConfig, feesConfig, feeSelections, expressConfig, selectedExpressTierId });
                return q?.total || 0;
              } catch { return 0; }
            })();
            const threshold = shippingConfig.free_shipping_threshold;
            const qualifies = orderTotal >= threshold;
            const remaining = Math.max(0, threshold - orderTotal);
            const progress = Math.min(100, (orderTotal / threshold) * 100);

            return (
              <div style={{ marginBottom: '0.75rem' }}>
                {qualifies ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--forge-text-sm)', color: 'var(--forge-success, #10B981)', fontWeight: 500 }}>
                    <Icon name="Check" size={14} />
                    <span>{language === 'en' ? 'Free shipping!' : 'Doprava zdarma!'}</span>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{ height: '6px', borderRadius: '3px', background: 'rgba(0, 212, 170, 0.15)', overflow: 'hidden', marginBottom: '0.375rem' }}
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={language === 'en' ? `Free shipping progress: ${Math.round(progress)}%` : `Postup k doprave zdarma: ${Math.round(progress)}%`}
                    >
                      <div style={{ height: '100%', width: `${progress}%`, borderRadius: '3px', background: 'var(--forge-accent-primary)', transition: 'width 0.3s' }} />
                    </div>
                    <p style={fg.textMuted}>
                      {language === 'en'
                        ? `Add ${Math.round(remaining)} CZK for free shipping`
                        : `Ještě ${Math.round(remaining)} Kč do dopravy zdarma`}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {shippingConfig.methods
              .filter(m => m.active !== false)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map(method => {
                const isSelected = method.id === selectedShippingMethodId;
                const isFree = method.type === 'PICKUP';
                const price = isFree ? 0 : (method.price || 0);
                const deliveryText = (method.delivery_days_min > 0 || method.delivery_days_max > 0)
                  ? (method.delivery_days_min === method.delivery_days_max
                    ? `${method.delivery_days_min} ${language === 'en' ? 'days' : 'dní'}`
                    : `${method.delivery_days_min}–${method.delivery_days_max} ${language === 'en' ? 'days' : 'dní'}`)
                  : null;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => onShippingMethodChange?.(method.id)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={`${method.name}${deliveryText ? `, ${deliveryText}` : ''}${isFree ? ', zdarma' : `, ${price} Kc`}${isSelected ? ' (vybrano)' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--forge-radius-md)',
                      border: isSelected ? '2px solid var(--forge-accent-primary)' : '1px solid var(--forge-border-default)',
                      background: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'border-color 0.15s, background 0.15s',
                      opacity: disabled ? 0.6 : 1,
                      minHeight: '44px',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--forge-accent-primary)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...fg.text, fontWeight: 500 }}>{method.name}</div>
                      {deliveryText && <div style={fg.textMuted}>{deliveryText}</div>}
                      {method.description && <div style={fg.textMuted}>{method.description}</div>}
                    </div>
                    <span style={{
                      ...fg.mono,
                      fontSize: 'var(--forge-text-sm)',
                      color: price === 0 ? 'var(--forge-success, #10B981)' : 'var(--forge-accent-primary)',
                    }}>
                      {price === 0
                        ? (language === 'en' ? 'Free' : 'Zdarma')
                        : `${price} Kč`}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Express / Priority delivery */}
      {expressConfig?.enabled && Array.isArray(expressConfig.tiers) && expressConfig.tiers.filter(t => t.active !== false).length > 0 && (
        <div className="tk-print-config-card" style={fg.card} role="region" aria-label={language === 'en' ? 'Delivery speed' : 'Rychlost dodani'}>
          <h3 style={fg.sectionTitle}>
            <Icon name="Zap" size={20} style={{ marginRight: '0.5rem' }} />
            {language === 'en' ? 'DELIVERY SPEED' : 'RYCHLOST DODANI'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {expressConfig.tiers
              .filter(t => t.active !== false)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map(tier => {
                const isSelected = tier.id === selectedExpressTierId;
                const surchargeLabel = tier.surcharge_value > 0
                  ? (tier.surcharge_type === 'percent' ? `+${tier.surcharge_value}%` : `+${tier.surcharge_value} Kč`)
                  : (language === 'en' ? 'Included' : 'V ceně');
                const deliveryText = tier.delivery_days > 0
                  ? `${tier.delivery_days} ${language === 'en' ? 'business days' : 'prac. dní'}`
                  : (language === 'en' ? 'Standard' : 'Standardní');

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onExpressTierChange?.(tier.id)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={`${tier.name}, ${deliveryText}, ${surchargeLabel}${isSelected ? ' (vybrano)' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--forge-radius-md)',
                      border: isSelected ? '2px solid var(--forge-accent-primary)' : '1px solid var(--forge-border-default)',
                      background: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'border-color 0.15s, background 0.15s',
                      opacity: disabled ? 0.6 : 1,
                      minHeight: '44px',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--forge-accent-primary)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...fg.text, fontWeight: 500 }}>{tier.name}</div>
                      <div style={fg.textMuted}>{deliveryText}</div>
                    </div>
                    <span style={{
                      ...fg.mono,
                      fontSize: 'var(--forge-text-sm)',
                      color: tier.surcharge_value > 0 ? 'var(--forge-warning, #F59E0B)' : 'var(--forge-success, #10B981)',
                    }}>
                      {surchargeLabel}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

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
            <div className="tk-print-result-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
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
