import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const PrintConfiguration = ({ onConfigChange, selectedFile, initialConfig }) => {
  const [config, setConfig] = useState(initialConfig || {
    material: 'pla',
    quality: 'standard',
    infill: 20,
    quantity: 1,
    supports: false,
    postProcessing: [],
    expressDelivery: false,
    color: 'white'
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const materials = [
    { value: 'pla', label: 'PLA', description: 'Základní materiál, snadný tisk' },
    { value: 'abs', label: 'ABS', description: 'Odolný, vhodný pro funkční díly' },
    { value: 'petg', label: 'PETG', description: 'Chemicky odolný, průhledný' },
    { value: 'tpu', label: 'TPU', description: 'Flexibilní, gumový materiál' },
    { value: 'wood', label: 'Wood Fill', description: 'PLA s dřevěnými vlákny' },
    { value: 'carbon', label: 'Carbon Fiber', description: 'Vysoce pevný kompozit' }
  ];

  const qualities = [
    { value: 'nozzle_08', label: 'Extra hrubý (0.8mm)', description: 'Extrémně rychlý tisk pro robustní díly.' },
    { value: 'nozzle_06', label: 'Hrubý (0.6mm)', description: 'Rychlý tisk ideální pro velké modely.' },
    { value: 'nozzle_04', label: 'Rychlý (0.4mm)', description: 'Urychlený tisk pro méně detailní objekty.' },
    { value: 'draft', label: 'Návrhový (0.3mm)', description: 'Nejrychlejší pro ověření konceptu, nízká kvalita.' },
    { value: 'standard', label: 'Standardní (0.2mm)', description: 'Vyvážený poměr kvality a rychlosti.' },
    { value: 'fine', label: 'Jemný (0.15mm)', description: 'Vysoká kvalita pro detailní modely.' },
    { value: 'ultra', label: 'Ultra jemný (0.1mm)', description: 'Nejvyšší možná kvalita, velmi pomalý tisk.' }
  ];

  const colors = [
    { value: 'white', label: 'Bílá', color: '#FFFFFF' },
    { value: 'black', label: 'Černá', color: '#000000' },
    { value: 'red', label: 'Červená', color: '#EF4444' },
    { value: 'blue', label: 'Modrá', color: '#3B82F6' },
    { value: 'green', label: 'Zelená', color: '#10B981' },
    { value: 'yellow', label: 'Žlutá', color: '#F59E0B' },
    { value: 'orange', label: 'Oranžová', color: '#F97316' },
    { value: 'purple', label: 'Fialová', color: '#8B5CF6' }
  ];

  const postProcessingOptions = [
    { id: 'sanding', label: 'Broušení', price: 50, description: 'Vyhlazení povrchu' },
    { id: 'painting', label: 'Lakování', price: 120, description: 'Barevná úprava povrchu' },
    { id: 'assembly', label: 'Montáž', price: 200, description: 'Sestavení více dílů' },
    { id: 'drilling', label: 'Vrtání otvorů', price: 80, description: 'Přesné otvory dle specifikace' }
  ];

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handlePostProcessingChange = (optionId, checked) => {
    const newPostProcessing = checked
      ? [...config?.postProcessing, optionId]
      : config?.postProcessing?.filter(id => id !== optionId);

    handleConfigChange('postProcessing', newPostProcessing);
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
            options={materials}
            value={config?.material}
            onChange={(value) => handleConfigChange('material', value)}
            searchable
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Barva</label>
            <div className="grid grid-cols-4 gap-2">
              {colors?.map((color) => (
                <button
                  key={color?.value}
                  onClick={() => handleConfigChange('color', color?.value)}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${config?.color === color?.value
                    ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color?.color }}
                  />
                  <span className="text-xs font-medium">{color?.label}</span>
                </button>
              ))}
            </div>
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
      {/* Quantity and Express */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Package2" size={20} className="mr-2" />
          Množství a doručení
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Počet kusů"
            type="number"
            min="1"
            max="100"
            value={config?.quantity}
            onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}
          />

          <div className="space-y-4">
            <Checkbox
              label="Expresní tisk"
              description="Prioritní zpracování do 24 hodin (+50% k ceně)"
              checked={config?.expressDelivery}
              onChange={(e) => handleConfigChange('expressDelivery', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Post Processing */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Wrench" size={20} className="mr-2" />
          Dodatečné služby
        </h3>

        <div className="space-y-3">
          {postProcessingOptions?.map((option) => (
            <div key={option?.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={config?.postProcessing?.includes(option?.id)}
                  onChange={(e) => handlePostProcessingChange(option?.id, e?.target?.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{option?.label}</p>
                  <p className="text-xs text-muted-foreground">{option?.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">+{option?.price} Kč</p>
                <p className="text-xs text-muted-foreground">za kus</p>
              </div>
            </div>
          ))}
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