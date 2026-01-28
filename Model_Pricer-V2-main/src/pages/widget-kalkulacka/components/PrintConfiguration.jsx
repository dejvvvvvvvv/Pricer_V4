import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';

const PrintConfiguration = ({
  onConfigChange,
  selectedFile,
  initialConfig,
  pricingConfig,
  feesConfig,
  feeSelections,
  onFeeSelectionsChange,
  uploadedFiles,
  disabled = false,
  availablePresets = [],
  defaultPresetId = null,
  selectedPresetId = null,
  onPresetChange,
  presetsLoading = false,
  presetsError = null,
  theme,
}) => {
  const { language } = useLanguage();

  const presetUi = {
    label: language === 'en' ? 'Slicing preset' : 'Preset pro slicovani',
    noPresets: language === 'en'
      ? 'No presets available — using default profile (Admin/parameters).'
      : 'Zadne presety nejsou k dispozici — pouzivam default profil (Admin/parameters).',
    failed: language === 'en'
      ? 'Failed to load presets — using default profile.'
      : 'Presety se nepodarilo nacist — pouzivam default profil.',
    placeholder: language === 'en' ? 'Select preset...' : 'Vyber preset...',
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

  const fallbackColors = useMemo(() => {
    return [
      { id: 'ui_white', name: language === 'en' ? 'White' : 'Bila', hex: '#F9FAFB' },
      { id: 'ui_black', name: language === 'en' ? 'Black' : 'Cerna', hex: '#111827' },
      { id: 'ui_red', name: language === 'en' ? 'Red' : 'Cervena', hex: '#EF4444' },
      { id: 'ui_blue', name: language === 'en' ? 'Blue' : 'Modra', hex: '#3B82F6' },
      { id: 'ui_green', name: language === 'en' ? 'Green' : 'Zelena', hex: '#10B981' },
      { id: 'ui_yellow', name: language === 'en' ? 'Yellow' : 'Zluta', hex: '#F59E0B' },
      { id: 'ui_orange', name: language === 'en' ? 'Orange' : 'Oranzova', hex: '#F97316' },
      { id: 'ui_purple', name: language === 'en' ? 'Purple' : 'Fialova', hex: '#8B5CF6' },
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
  }, [enabledMaterials, fallbackColors, config?.material, config?.color]);

  const selectableFees = useMemo(() => {
    const fees = Array.isArray(feesConfig?.fees) ? feesConfig.fees : [];
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
      nextTargets[feeId] = { mode: 'SELECTED', modelIds: uniq, uiMode };
      return { ...prev, feeTargetsById: nextTargets };
    });
  }, [updateFeeSelections]);

  const formatFeeValue = useCallback((fee) => {
    const v = Number(fee?.value || 0);
    const sign = v >= 0 ? '+' : '-';
    const abs = Math.abs(v);
    const unit = (s) => (language === 'en' ? s.en : s.cs);

    switch (fee?.type) {
      case 'percent': return `${sign}${abs}%`;
      case 'per_gram': return `${sign}${abs} ${unit({ cs: 'Kc/g', en: 'CZK/g' })}`;
      case 'per_minute': return `${sign}${abs} ${unit({ cs: 'Kc/min', en: 'CZK/min' })}`;
      case 'per_cm3': return `${sign}${abs} ${unit({ cs: 'Kc/cm3', en: 'CZK/cm3' })}`;
      case 'per_cm2': return `${sign}${abs} ${unit({ cs: 'Kc/cm2', en: 'CZK/cm2' })}`;
      case 'per_piece': return `${sign}${abs} ${unit({ cs: 'Kc/kus', en: 'CZK/piece' })}`;
      case 'flat':
      default: return `${sign}${abs} ${unit({ cs: 'Kc', en: 'CZK' })}`;
    }
  }, [language]);

  const qualities = [
    { value: 'nozzle_08', label: 'Extra hruby (0.8mm)', description: 'Extremne rychly tisk pro robustni dily.' },
    { value: 'nozzle_06', label: 'Hruby (0.6mm)', description: 'Rychly tisk idealni pro velke modely.' },
    { value: 'nozzle_04', label: 'Rychly (0.4mm)', description: 'Urychleny tisk pro mene detailni objekty.' },
    { value: 'draft', label: 'Navrhovy (0.3mm)', description: 'Nejrychlejsi pro overeni konceptu, nizka kvalita.' },
    { value: 'standard', label: 'Standardni (0.2mm)', description: 'Vyvazeny pomer kvality a rychlosti.' },
    { value: 'fine', label: 'Jemny (0.15mm)', description: 'Vysoka kvalita pro detailni modely.' },
    { value: 'ultra', label: 'Ultra jemny (0.1mm)', description: 'Nejvyssi mozna kvalita, velmi pomaly tisk.' }
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

  const qualityPresets = {
    basic: { name: 'Basic', description: 'Rychly tisk, nizka kvalita', settings: { quality: 'nozzle_06', infill: 15, supports: false } },
    middle: { name: 'Middle', description: 'Vyvazena kvalita a rychlost', settings: { quality: 'standard', infill: 20, supports: true } },
    pro: { name: 'Pro', description: 'Nejvyssi kvalita, pomaly tisk', settings: { quality: 'fine', infill: 30, supports: true } }
  };

  const applyPreset = (presetKey) => {
    const preset = qualityPresets[presetKey];
    const newConfig = { ...config, ...preset.settings };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const borderRadius = theme?.cornerRadius ? `${theme.cornerRadius}px` : '12px';

  if (!selectedFile) {
    return (
      <div
        className="p-8 text-center"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--widget-card, #F9FAFB)' }}
        >
          <Icon name="Settings" size={24} style={{ color: 'var(--widget-muted, #6B7280)' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--widget-header, #1F2937)' }}>
          Konfigurace tisku
        </h3>
        <p className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>
          Nejprve nahrajte 3D model pro konfiguraci parametru tisku
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slicing preset selector */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Sliders" size={20} className="mr-2" />
          {presetUi.label}
        </h3>

        {presetsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {presetUi.failed}
          </div>
        )}

        {!presetsError && !presetsLoading && (availablePresets?.length || 0) === 0 && (
          <div className="mb-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--widget-border, #E5E7EB)', backgroundColor: 'var(--widget-card, #F9FAFB)40', color: 'var(--widget-muted, #6B7280)' }}>
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

        {presetsLoading && (availablePresets?.length || 0) === 0 && (
          <Select label={presetUi.label} options={[]} value="" onChange={() => { }} loading disabled placeholder={presetUi.placeholder} />
        )}
      </div>

      {/* Quality Presets */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Zap" size={20} className="mr-2" />
          Rychle predvolby
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {Object.entries(qualityPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="p-4 text-left transition-colors"
              style={{
                backgroundColor: 'var(--widget-card, #F9FAFB)',
                border: '1px solid var(--widget-border, #E5E7EB)',
                borderRadius,
              }}
            >
              <div className="font-semibold mb-1" style={{ color: 'var(--widget-header, #1F2937)' }}>{preset.name}</div>
              <div className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Material Selection */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Package" size={20} className="mr-2" />
          Material a barva
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Material"
            options={materialOptions}
            value={config?.material || ''}
            onChange={(value) => handleMaterialChange(value)}
            searchable
            disabled={disabled || materialOptions.length <= 1}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>Barva</label>
            <div className="grid grid-cols-4 gap-2">
              {uiColors?.map((color) => (
                <button
                  key={color?.id}
                  onClick={() => handleColorChange(color?.id)}
                  disabled={disabled}
                  className="flex items-center space-x-2 p-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: config?.color === color?.id ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-border, #E5E7EB)',
                    backgroundColor: config?.color === color?.id ? 'var(--widget-btn-primary, #2563EB)10' : 'transparent',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color?.hex, borderColor: 'var(--widget-border, #E5E7EB)' }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--widget-text, #374151)' }}>{color?.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Quality */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Layers" size={20} className="mr-2" />
          Kvalita tisku
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Kvalita vrstvy"
            options={qualities}
            value={config?.quality}
            onChange={(value) => handleConfigChange('quality', value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
              Vypln: {config?.infill}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config?.infill}
              onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--widget-card, #F9FAFB)' }}
            />
            <div className="flex justify-between text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              <span>Rychly (10%)</span>
              <span>Pevny (100%)</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Checkbox
            label="Podpory"
            description="Automaticke generovani podpor pro previsle casti"
            checked={config?.supports}
            onChange={(e) => handleConfigChange('supports', e?.target?.checked)}
          />
        </div>
      </div>

      {/* Quantity */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Package2" size={20} className="mr-2" />
          Mnozstvi
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Pocet kusu"
            type="number"
            min="1"
            max="100"
            value={config?.quantity}
            onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}
          />
        </div>
      </div>

      {/* Additional services */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Wrench" size={20} className="mr-2" />
          Dodatecne sluzby
        </h3>

        <div className="space-y-3">
          {selectableFees.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              {language === 'en' ? 'No selectable services configured.' : 'Zadne volitelne sluzby nejsou nastavene.'}
            </div>
          ) : (
            selectableFees.map((fee) => {
              const isSelected = selectedFeeIds.has(fee.id);
              return (
                <div
                  key={fee.id}
                  className="p-3 rounded-lg"
                  style={{ border: '1px solid var(--widget-border, #E5E7EB)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleFeeSelected(fee.id, !!e?.target?.checked)}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>{fee.name}</p>
                        {fee.description && (
                          <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>{fee.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>{formatFeeValue(fee)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status/Results */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--widget-summary-bg, #F3F4F6)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--widget-header, #1F2937)' }}>
          <Icon name="Clock" size={20} className="mr-2" />
          {selectedFile?.status === 'processing' ? 'Vypocet...' :
            selectedFile?.status === 'completed' ? 'Vysledky slicingu' : 'Odhad tisku'}
        </h3>

        {selectedFile?.status === 'processing' && (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={32} className="animate-spin" style={{ color: 'var(--widget-btn-primary, #2563EB)' }} />
            <span className="ml-3" style={{ color: 'var(--widget-muted, #6B7280)' }}>Zpracovavam model...</span>
          </div>
        )}

        {selectedFile?.status === 'failed' && (
          <div className="text-center py-4">
            <Icon name="XCircle" size={32} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{selectedFile.error || 'Slicing se nezdaril'}</p>
          </div>
        )}

        {selectedFile?.status === 'completed' && selectedFile?.result && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: 'var(--widget-btn-primary, #2563EB)20' }}
              >
                <Icon name="Clock" size={20} style={{ color: 'var(--widget-btn-primary, #2563EB)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                {Math.round(selectedFile.result.time / 3600)}h {Math.round((selectedFile.result.time % 3600) / 60)}min
              </p>
              <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>Doba tisku</p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#10B98120' }}
              >
                <Icon name="Weight" size={20} style={{ color: '#10B981' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                {Math.round(selectedFile.result.material)}g
              </p>
              <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>Hmotnost</p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#F59E0B20' }}
              >
                <Icon name="Layers" size={20} style={{ color: '#F59E0B' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                {selectedFile.result.layers}
              </p>
              <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>Vrstvy</p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#EF444420' }}
              >
                <Icon name="Thermometer" size={20} style={{ color: '#EF4444' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                {config?.material === 'pla' ? '200°C' :
                  config?.material === 'abs' ? '250°C' :
                    config?.material === 'petg' ? '230°C' :
                      config?.material === 'tpu' ? '220°C' : '210°C'}
              </p>
              <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>Teplota</p>
            </div>
          </div>
        )}

        {(!selectedFile?.result && selectedFile?.status !== 'processing' && selectedFile?.status !== 'failed') && (
          <div className="text-center py-4 text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>
            Nastavte parametry a model se automaticky zpracuje
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintConfiguration;
