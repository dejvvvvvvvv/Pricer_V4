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
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Settings" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Konfigurace tisku</h3>
        <p className="text-sm text-muted-foreground">
          Nejprve nahrajte 3D model pro konfiguraci parametrů tisku
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slicing preset selector (loaded from backend) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Sliders" size={20} className="mr-2" />
          {presetUi.label}
        </h3>

        {/* Error / no presets banners */}
        {presetsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {presetUi.failed}
          </div>
        )}

        {!presetsError && !presetsLoading && (availablePresets?.length || 0) === 0 && (
          <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
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
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Zap" size={20} className="mr-2" />
          Rychlé předvolby
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {Object.entries(qualityPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="bg-muted hover:bg-muted/80 border border-border rounded-lg p-4 text-left transition-colors"
            >
              <div className="font-semibold text-foreground mb-1">{preset.name}</div>
              <div className="text-xs text-muted-foreground">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Material Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Package" size={20} className="mr-2" />
          Materiál a barva
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Materiál"
            options={materialOptions}
            value={config?.material || ''}
            onChange={(value) => handleMaterialChange(value)}
            searchable
            disabled={disabled || materialOptions.length <= 1}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Barva</label>
            <div className="grid grid-cols-4 gap-2">
              {uiColors?.map((color) => (
                <button
                  key={color?.id}
                  onClick={() => handleColorChange(color?.id)}
                  disabled={disabled}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${config?.color === color?.id
                    ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color?.hex }}
                  />
                  <span className="text-xs font-medium">{color?.name}</span>
                </button>
              ))}
            </div>
            {selectedMaterial && (!Array.isArray(selectedMaterial?.colors) || selectedMaterial.colors.length === 0) && (
              <div className="text-xs text-muted-foreground">
                {language === 'en' ? 'Using fallback palette (UI only).' : 'Používám fallback paletu (jen pro UI).'}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Print Quality */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
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
            <label className="text-sm font-medium text-foreground">
              Výplň: {config?.infill}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config?.infill}
              onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rychlý (10%)</span>
              <span>Pevný (100%)</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Checkbox
            label="Podpěry"
            description="Automatické generování podpěr pro převislé části"
            checked={config?.supports}
            onChange={(e) => handleConfigChange('supports', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Quantity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Package2" size={20} className="mr-2" />
          Množství
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Počet kusů"
            type="number"
            min="1"
            max="100"
            value={config?.quantity}
            onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}
          />
          <p className="text-xs text-muted-foreground">
            Expresní příplatky a další služby nastavíš v <span className="font-medium">Admin / Fees</span>.
          </p>
        </div>
      </div>
      {/* Additional services (fees from AdminFees) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Wrench" size={20} className="mr-2" />
          Dodatečné služby
        </h3>

        <div className="space-y-3">
          {selectableFees.length === 0 ? (
            <div className="text-sm text-muted-foreground">
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
                <div key={fee.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleFeeSelected(fee.id, !!e?.target?.checked)}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{fee.name}</p>
                        {fee.description ? (
                          <p className="text-xs text-muted-foreground">{fee.description}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            {(fee.scope || 'MODEL').toUpperCase()}
                          </span>
                          {fee.charge_basis === 'PER_PIECE' ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              {language === 'en' ? 'Per piece' : 'Za kus'}
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              {language === 'en' ? 'Per file' : 'Za soubor'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatFeeValue(fee)}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee.type === 'percent'
                          ? (language === 'en' ? 'from subtotal' : 'ze subtotalu')
                          : (language === 'en' ? 'in quote' : 'v ceně')}
                      </p>
                    </div>
                  </div>

                  {canTarget && isSelected && (
                    <div className="mt-3 pl-7">
                      <div className="text-xs text-muted-foreground mb-2">
                        {language === 'en' ? 'Apply to:' : 'Aplikovat na:'}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'ALL'}
                            onChange={() => setFeeTargetAll(fee.id)}
                          />
                          <span>{language === 'en' ? 'All models' : 'Všechny modely'}</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`fee_target_${fee.id}`}
                            checked={targetUi === 'THIS'}
                            onChange={() => setFeeTargetSelected(fee.id, currentId ? [currentId] : [], 'THIS')}
                          />
                          <span>{language === 'en' ? 'This model' : 'Tento model'}</span>
                        </label>

                        <label className="flex items-center gap-2">
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
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {(uploadedFiles || []).map((f) => {
                            const checked = targetIds.includes(f.id);
                            return (
                              <label key={f.id} className="flex items-center gap-2 text-xs text-foreground">
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
                                <span className="truncate max-w-[320px]">{f.name}</span>
                                {f.id === currentId ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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
                    <div className="mt-2 text-xs text-muted-foreground">
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
      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Clock" size={20} className="mr-2" />
          {selectedFile?.status === 'processing' ? 'Výpočet...' :
            selectedFile?.status === 'completed' ? 'Výsledky slicingu' : 'Odhad tisku'}
        </h3>

        {selectedFile?.status === 'processing' && (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Zpracovávám model...</span>
          </div>
        )}

        {selectedFile?.status === 'failed' && (
          <div className="text-center py-4">
            <Icon name="XCircle" size={32} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{selectedFile.error || 'Slicing se nezdařil'}</p>
          </div>
        )}

        {selectedFile?.status === 'completed' && selectedFile?.result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="Clock" size={20} className="text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {Math.round(selectedFile.result.time / 3600)}h {Math.round((selectedFile.result.time % 3600) / 60)}min
                </p>
                <p className="text-xs text-muted-foreground">Doba tisku</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="Weight" size={20} className="text-success" />
                </div>
                <p className="text-sm font-medium text-foreground">{Math.round(selectedFile.result.material)}g</p>
                <p className="text-xs text-muted-foreground">Hmotnost</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="Layers" size={20} className="text-warning" />
                </div>
                <p className="text-sm font-medium text-foreground">{selectedFile.result.layers}</p>
                <p className="text-xs text-muted-foreground">Vrstvy</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="Thermometer" size={20} className="text-error" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {config?.material === 'pla' ? '200°C' :
                    config?.material === 'abs' ? '250°C' :
                      config?.material === 'petg' ? '230°C' :
                        config?.material === 'tpu' ? '220°C' : '210°C'}
                </p>
                <p className="text-xs text-muted-foreground">Teplota</p>
              </div>
            </div>

            {selectedFile.result.pricing && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Cena za tisk:</span>
                  <span className="text-lg font-bold text-primary">{Math.round(selectedFile.result.price)} Kč</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedFile.result.pricing.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.label}:</span>
                      <span>{Math.round(item.amount)} Kč</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {(!selectedFile?.result && selectedFile?.status !== 'processing' && selectedFile?.status !== 'failed') && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nastavte parametry a model se automaticky zpracuje
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintConfiguration;