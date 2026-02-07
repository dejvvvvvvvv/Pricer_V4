// src/pages/test-kalkulacka/index.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FileUploadZone from './components/FileUploadZone';
import ModelViewer from './components/ModelViewer';
import PrintConfiguration from './components/PrintConfiguration';
import PricingCalculator from './components/PricingCalculator';
import GenerateButton from './components/GenerateButton';
import ErrorBoundary from './components/ErrorBoundary';
import { sliceModelLocal } from '../../services/slicerApi';
import { fetchWidgetPresets } from '../../services/presetsApi';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import { loadFeesConfigV3 } from '../../utils/adminFeesStorage';
import { parseSlicerError } from '../../utils/slicerErrorClassifier';

// Default config is used for newly uploaded models (so switching between models does not
// accidentally reset already-sliced results when a config entry is missing).
const DEFAULT_PRINT_CONFIG = {
  material: 'pla',
  color: null,
  quality: 'standard',
  infill: 20,
  quantity: 1,
  supports: false,
};

const TestKalkulacka = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [printConfigs, setPrintConfigs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliceAllProcessing, setSliceAllProcessing] = useState(false);

  // Tenant-scoped pricing + fees (AdminPricing/AdminFees)
  const [pricingConfig, setPricingConfig] = useState(() => loadPricingConfigV3());
  const [feesConfig, setFeesConfig] = useState(() => loadFeesConfigV3());

  // Fee selections in calculator UI (optional selectable fees + apply targets)
  const [feeSelections, setFeeSelections] = useState(() => ({
    selectedFeeIds: new Set(),
    feeTargetsById: {},
  }));

  const [batchProgress, setBatchProgress] = useState({ mode: null, done: 0, total: 0 });

  // Keep calculator configs synced with localStorage changes (best-effort; storage events fire across tabs).
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key) return;
      if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3());
      if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Seed default selections from AdminFees (selected_by_default) + prune removed fees.
  useEffect(() => {
    const fees = Array.isArray(feesConfig?.fees) ? feesConfig.fees : [];
    // Only selectable + not-required fees belong to UI selections.
    const activeSelectable = new Set(fees.filter(f => f?.active && f?.selectable && !f?.required).map(f => f.id));
    const defaults = fees.filter(f => f?.active && f?.selectable && !f?.required && f?.selected_by_default).map(f => f.id);

    setFeeSelections(prev => {
      const prevSet = (prev?.selectedFeeIds instanceof Set) ? prev.selectedFeeIds : new Set();
      const nextSet = new Set([...prevSet].filter(id => activeSelectable.has(id)));
      for (const id of defaults) nextSet.add(id);

      const nextTargets = { ...(prev?.feeTargetsById || {}) };
      for (const k of Object.keys(nextTargets)) {
        if (!activeSelectable.has(k)) delete nextTargets[k];
      }

      return { selectedFeeIds: nextSet, feeTargetsById: nextTargets };
    });
  }, [feesConfig]);

  // Widget slicing presets (loaded from backend)
  const [availablePresets, setAvailablePresets] = useState([]);
  const [defaultPresetId, setDefaultPresetId] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState(null);

  const selectedFile = selectedFileId
    ? (uploadedFiles.find(f => f.id === selectedFileId) || null)
    : null;

  const updateModelStatus = useCallback((modelId, newProps) => {
    setUploadedFiles(prevFiles =>
      prevFiles.map(file => {
        if (file.id !== modelId) return file;

        const next = { ...file, ...newProps };

        // Persist client-computed model info (e.g. surface) across re-slices.
        const mergedClientModelInfo = newProps?.clientModelInfo
          ? { ...(file.clientModelInfo || {}), ...newProps.clientModelInfo }
          : (file.clientModelInfo || undefined);
        if (mergedClientModelInfo) next.clientModelInfo = mergedClientModelInfo;

        if (newProps?.clientModelInfoMeta) {
          next.clientModelInfoMeta = { ...(file.clientModelInfoMeta || {}), ...newProps.clientModelInfoMeta };
        }

        const patchSurfaceIntoResult = (res) => {
          if (!res || typeof res !== 'object') return res;
          const surfaceMm2 = mergedClientModelInfo?.surfaceMm2;
          if (!Number.isFinite(surfaceMm2) || surfaceMm2 <= 0) return res;
          return {
            ...res,
            modelInfo: {
              ...(res.modelInfo || {}),
              surfaceMm2,
              surfaceCm2: mergedClientModelInfo?.surfaceCm2 ?? surfaceMm2 / 100,
            },
          };
        };

        // If result is being set (even to null), handle it explicitly.
        if (Object.prototype.hasOwnProperty.call(newProps, 'result')) {
          next.result = patchSurfaceIntoResult(newProps.result);
        } else if (mergedClientModelInfo && next.result) {
          // If client info arrived later, patch existing result too.
          next.result = patchSurfaceIntoResult(next.result);
        }

        return next;
      })
    );
  }, []);

  // Surface (cm^2) is computed in the browser (STL only, guarded). We cache it per model
  // and merge it into slicer results so per_cm2 fees can work.
  const handleSurfaceComputed = useCallback(
    (modelId, payload) => {
      if (!modelId || !payload) return;
      const surfaceMm2 = payload?.surfaceMm2;
      const surfaceCm2 = payload?.surfaceCm2;

      const clientModelInfo = {};
      // Only write numeric surface values (avoid overwriting valid cached surface with nulls)
      if (Number.isFinite(surfaceMm2) && surfaceMm2 > 0) {
        clientModelInfo.surfaceMm2 = surfaceMm2;
        clientModelInfo.surfaceCm2 = Number.isFinite(surfaceCm2) ? surfaceCm2 : surfaceMm2 / 100;
      }

      const clientModelInfoMeta = payload?.meta ? { surface: payload.meta } : undefined;

      updateModelStatus(modelId, {
        ...(Object.keys(clientModelInfo).length ? { clientModelInfo } : {}),
        ...(clientModelInfoMeta ? { clientModelInfoMeta } : {}),
      });
    },
    [updateModelStatus]
  );

  const handleConfigChange = useCallback((newConfig) => {
    if (selectedFileId === null) return;

    setPrintConfigs(prev => {
      const oldConfig = prev[selectedFileId] || {};

      // Only reset slice results if the config actually changed in a meaningful way.
      // This prevents the bug where switching between models triggers a remount
      // of PrintConfiguration, which fires onConfigChange with the same config,
      // which would incorrectly reset already-sliced results.
      const meaningfulKeys = ['material', 'quality', 'infill', 'supports'];
      const changed = meaningfulKeys.some(k => {
        const oldVal = oldConfig[k];
        const newVal = newConfig[k];
        // Treat undefined/null as equivalent to the default
        if (oldVal == null && newVal == null) return false;
        return String(oldVal) !== String(newVal);
      });

      if (changed) {
        updateModelStatus(selectedFileId, { status: 'pending', result: null, error: null });
      }

      return { ...prev, [selectedFileId]: newConfig };
    });
  }, [selectedFileId, updateModelStatus]);

  const steps = [
    { id: 1, title: 'Nahrání souborů', icon: 'Upload', description: 'Nahrajte 3D modely' },
    { id: 2, title: 'Konfigurace', icon: 'Settings', description: 'Nastavte parametry tisku' },
    { id: 3, title: 'Kontrola a cena', icon: 'Calculator', description: 'Zkontrolujte objednávku' }
  ];

  useEffect(() => {
    if (uploadedFiles.length === 0) {
      if (selectedFileId !== null) setSelectedFileId(null);
      return;
    }
    // If nothing selected (or selected file was deleted), select the first one.
    const exists = selectedFileId !== null && uploadedFiles.some(f => f.id === selectedFileId);
    if (!exists) setSelectedFileId(uploadedFiles[0].id);
  }, [uploadedFiles, selectedFileId]);

  // Load widget presets once on calculator mount.
  useEffect(() => {
    let cancelled = false;

    const loadPresets = async () => {
      setPresetsLoading(true);
      setPresetsError(null);
      try {
        const res = await fetchWidgetPresets();
        if (cancelled) return;

        if (!res?.ok) {
          throw new Error(res?.message || 'Failed to load presets');
        }

        const payload = res.data || {};
        const presets = Array.isArray(payload?.presets) ? payload.presets : [];
        const defId = typeof payload?.defaultPresetId === 'string' && payload.defaultPresetId ? payload.defaultPresetId : null;

        setAvailablePresets(presets);
        setDefaultPresetId(defId);

        // Preselect default preset if present; otherwise pick the first available preset.
        const preselected = (defId && presets.some(p => p?.id === defId))
          ? defId
          : (presets?.[0]?.id || null);

        setSelectedPresetId(preselected);
      } catch (e) {
        if (cancelled) return;
        setAvailablePresets([]);
        setDefaultPresetId(null);
        setSelectedPresetId(null);
        setPresetsError(e || new Error('Failed to load presets'));
      } finally {
        if (!cancelled) setPresetsLoading(false);
      }
    };

    loadPresets();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Ensure every model has an entry in printConfigs.
    // IMPORTANT: Do NOT call handleConfigChange() here, because it resets result/status.
    // This avoids the bug where batch-sliced models lose their metrics when selected.
    if (!selectedFile) return;
    if (printConfigs[selectedFile.id]) return;

    setPrintConfigs(prev => ({
      ...prev,
      [selectedFile.id]: { ...DEFAULT_PRINT_CONFIG },
    }));
  }, [selectedFile, printConfigs]);

  useEffect(() => {
    if (uploadedFiles.length > 0 && currentStep === 1) {
      const t = setTimeout(() => setCurrentStep(2), 1000);
      return () => clearTimeout(t);
    }
  }, [uploadedFiles, currentStep]);

  const handleSliceSelected = useCallback(async () => {
    if (!selectedFile) return;

    const cfg = printConfigs[selectedFile.id] || {};
    if (selectedFile.status === 'processing') return;

    try {
      updateModelStatus(selectedFile.id, { status: 'processing', error: null });

      console.log('[test-kalkulacka] Slicing (local) file:', selectedFile.name, 'config:', cfg);

      const trySliceWithFallback = async (presetId) => {
        try {
          return await sliceModelLocal(selectedFile.file, { presetId });
        } catch (e) {
          // Fallback: if preset-based slicing fails, drop presetId and retry once.
          if (presetId) {
            console.warn('[test-kalkulacka] Slice failed with presetId, retrying without presetId:', presetId, e);
            setSelectedPresetId(null);
            return await sliceModelLocal(selectedFile.file, { presetId: null });
          }
          throw e;
        }
      };

      const res = await trySliceWithFallback(selectedPresetId);
      const ok = (res?.ok ?? res?.success ?? true);
      if (!ok) throw new Error(res?.error || res?.message || 'Slicování selhalo');

      if (import.meta?.env?.DEV) {
        if (res?.usedPreset) console.debug('[test-kalkulacka] usedPreset:', res.usedPreset);
        if (res?.warnings) console.debug('[test-kalkulacka] warnings:', res.warnings);
      }

      updateModelStatus(selectedFile.id, {
        status: 'completed',
        result: res,
        error: null,
      });

      // After successful slice, it's useful to show the price step.
      if (currentStep < 3) setCurrentStep(3);
    } catch (err) {
      console.error('[test-kalkulacka] Slice failed:', err);
      const classified = parseSlicerError(err);
      updateModelStatus(selectedFile.id, {
        status: 'failed',
        error: classified.userMessage,
        errorCategory: classified.category,
        errorSeverity: classified.severity,
        errorRaw: classified.raw,
      });
    }
  }, [selectedFile, printConfigs, updateModelStatus, currentStep, selectedPresetId]);

  const runBatchSlice = useCallback(async (targets, mode) => {
    if (!Array.isArray(targets) || targets.length === 0) return;

    // Use a mutable local so we can downgrade to no-preset mid-batch if backend rejects a preset.
    let effectivePresetId = selectedPresetId;

    setSliceAllProcessing(true);
    setBatchProgress({ mode, done: 0, total: targets.length });

    try {
      if (currentStep < 3) setCurrentStep(3);

      let done = 0;
      for (const fileItem of targets) {
        if (!fileItem?.file) {
          done += 1;
          setBatchProgress(prev => ({ ...prev, done }));
          continue;
        }

        try {
          updateModelStatus(fileItem.id, { status: 'processing', error: null });
          console.log('[test-kalkulacka] Batch slicing (local):', fileItem.name);

          const trySliceWithFallback = async (presetId) => {
            try {
              return await sliceModelLocal(fileItem.file, { presetId });
            } catch (e) {
              if (presetId) {
                console.warn('[test-kalkulacka] Batch slice failed with presetId, retrying without presetId:', presetId, e);
                effectivePresetId = null;
                setSelectedPresetId(null);
                return await sliceModelLocal(fileItem.file, { presetId: null });
              }
              throw e;
            }
          };

          const res = await trySliceWithFallback(effectivePresetId);
          const ok = (res?.ok ?? res?.success ?? true);
          if (!ok) throw new Error(res?.error || res?.message || 'Slicování selhalo');

          if (import.meta?.env?.DEV) {
            if (res?.usedPreset) console.debug('[test-kalkulacka] usedPreset:', res.usedPreset);
            if (res?.warnings) console.debug('[test-kalkulacka] warnings:', res.warnings);
          }

          updateModelStatus(fileItem.id, {
            status: 'completed',
            result: res,
            error: null,
          });
        } catch (err) {
          console.error('[test-kalkulacka] Batch slice failed:', fileItem.name, err);
          const classified = parseSlicerError(err);
          updateModelStatus(fileItem.id, {
            status: 'failed',
            error: classified.userMessage,
            errorCategory: classified.category,
            errorSeverity: classified.severity,
            errorRaw: classified.raw,
          });
        } finally {
          done += 1;
          setBatchProgress(prev => ({ ...prev, done }));
        }
      }
    } finally {
      setSliceAllProcessing(false);
    }
  }, [currentStep, selectedPresetId, updateModelStatus]);

  const handleSliceAll = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    if (sliceAllProcessing) return;

    // Work on a snapshot to avoid issues if the user clicks around while batching.
    const filesSnapshot = [...uploadedFiles];

    // Slice only models that are not already completed (saves time).
    const targets = filesSnapshot.filter(f => f?.file && !(f.status === 'completed' && f.result));
    if (targets.length === 0) return;

    await runBatchSlice(targets, 'all');
  }, [uploadedFiles, sliceAllProcessing, runBatchSlice]);

  const handleResliceFailed = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    if (sliceAllProcessing) return;

    const filesSnapshot = [...uploadedFiles];
    const targets = filesSnapshot.filter(f => f?.file && f.status === 'failed');
    if (targets.length === 0) return;

    await runBatchSlice(targets, 'failed');
  }, [uploadedFiles, sliceAllProcessing, runBatchSlice]);

  const handleFilesUploaded = (uploadedItem) => {
    const fileToProcess = uploadedItem.file instanceof File ? uploadedItem.file : uploadedItem;
    if (!(fileToProcess instanceof File)) return;

    if (!uploadedFiles.some(file => file.name === fileToProcess.name)) {
      const newId = Date.now() + Math.random();
      const modelObject = {
        id: newId,
        name: fileToProcess.name,
        size: fileToProcess.size,
        type: fileToProcess.type,
        file: fileToProcess,
        uploadedAt: new Date(),
        status: 'pending',
        result: null,
        error: null,
      };
      setUploadedFiles(prev => [...prev, modelObject]);

      // Create default config right away so later selecting this model does NOT
      // clear its slicing result (important for "Spočítat vse" batch slicing).
      setPrintConfigs(prev => (prev[newId] ? prev : ({
        ...prev,
        [newId]: { ...DEFAULT_PRINT_CONFIG },
      })));
    }
  };

  const handleAddModelClick = () => fileInputRef.current?.click();

  const handleResetUpload = () => {
    setUploadedFiles([]);
    setSelectedFileId(null);
    setPrintConfigs({});
    setCurrentStep(1);
  };

  const handleFileDelete = (fileToDelete) => {
    const newUploadedFiles = uploadedFiles.filter(file => file.id !== fileToDelete.id);
    const newPrintConfigs = { ...printConfigs };
    delete newPrintConfigs[fileToDelete.id];

    setUploadedFiles(newUploadedFiles);
    setPrintConfigs(newPrintConfigs);

    if (selectedFileId !== null && selectedFileId === fileToDelete.id) {
      setSelectedFileId(newUploadedFiles.length > 0 ? newUploadedFiles[0].id : null);
    }
    if (newUploadedFiles.length === 0) {
      handleResetUpload();
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/printer-catalog', { state: { uploadedFiles, printConfigs, fromUpload: true } });
  };

  const currentConfig = selectedFile ? (printConfigs[selectedFile.id] || {}) : {};

  const canProceed = () => {
    switch (currentStep) {
      case 1: return uploadedFiles.length > 0;
      case 2: return !!currentConfig && !!selectedFile;
      case 3: return uploadedFiles.every(f => f.status === 'completed');
      default: return false;
    }
  };

  const statusTooltips = {
    pending: 'Čeká na zpracování',
    processing: 'Výpočet...',
    completed: 'Hotovo',
    failed: 'Výpočet se nezdařil'
  };

  const hasFailedModels = uploadedFiles.some(f => f.status === 'failed');
  const hasMultipleModels = uploadedFiles.length > 1;



  return (
    <div className="min-h-screen bg-background">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleFilesUploaded({ file }));
        }}
        style={{ display: 'none' }}
        multiple
        accept=".stl,.obj,.3mf"
      />

      <div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <button onClick={() => navigate('/customer-dashboard')} className="hover:text-foreground transition-colors">
                Dashboard
              </button>
              <Icon name="ChevronRight" size={16} />
              <span className="text-foreground">Nahrání modelu</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nahrání 3D modelu</h1>
            <p className="text-muted-foreground">
              Nahrajte své 3D modely a nakonfigurujte parametry tisku.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.id
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon name={step.icon} size={20} />
                      </div>
                      <div className="mt-2 text-center">
                        <p
                          className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-24 h-0.5 mx-4 transition-colors ${currentStep > step.id ? 'bg-primary' : 'bg-border'
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Calculation buttons - inline with stepper */}
              {uploadedFiles.length > 0 && selectedFile && (
                <div className="flex flex-col items-end gap-1.5 ml-6">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <GenerateButton
                      size="compact"
                      label="Spočítat cenu"
                      onClick={handleSliceSelected}
                      loading={selectedFile.status === 'processing'}
                      disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllProcessing}
                    />

                    {hasMultipleModels && (
                      <GenerateButton
                        size="compact"
                        label="Spočítat vše"
                        onClick={handleSliceAll}
                        loading={sliceAllProcessing && batchProgress.mode === 'all'}
                        disabled={sliceAllProcessing || uploadedFiles.some(f => f.status === 'processing')}
                      />
                    )}

                    {hasFailedModels && (
                      <GenerateButton
                        size="compact"
                        label="Reslice failed"
                        onClick={handleResliceFailed}
                        loading={sliceAllProcessing && batchProgress.mode === 'failed'}
                        disabled={sliceAllProcessing || uploadedFiles.some(f => f.status === 'processing')}
                      />
                    )}
                  </div>

                  {sliceAllProcessing && batchProgress.total > 0 && (
                    <div className="flex items-center gap-2 w-full max-w-[220px]">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {batchProgress.done}/{batchProgress.total}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {uploadedFiles.length === 0 && currentStep === 1 && (
                <FileUploadZone onFilesUploaded={handleFilesUploaded} />
              )}

              {uploadedFiles.length > 0 && (
                <>
                  {/* Keep the left configuration visible even on step 3 (after slicing) */}
                  <div className={selectedFile ? 'block' : 'hidden'}>
                    <PrintConfiguration
                      key={selectedFile ? selectedFile.id : 'empty'}
                      selectedFile={selectedFile}
                      onConfigChange={handleConfigChange}
                      initialConfig={currentConfig}
                      availablePresets={availablePresets}
                      defaultPresetId={defaultPresetId}
                      selectedPresetId={selectedPresetId}
                      onPresetChange={setSelectedPresetId}
                      presetsLoading={presetsLoading}
                      presetsError={presetsError}
                      pricingConfig={pricingConfig}
                      feesConfig={feesConfig}
                      feeSelections={feeSelections}
                      onFeeSelectionsChange={setFeeSelections}
                      uploadedFiles={uploadedFiles}
                      disabled={uploadedFiles.some(f => f.status === 'processing')}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <ErrorBoundary>
            <ModelViewer
              selectedFile={selectedFile}
              onRemove={handleFileDelete}
              onSurfaceComputed={handleSurfaceComputed}
            />
              </ErrorBoundary>
              {/* Metrics + price card (right column) */}
              {uploadedFiles.length > 0 && (
                <PricingCalculator
                  selectedFile={selectedFile}
                  onSlice={handleSliceSelected}
                  totalModels={uploadedFiles.length}
                  onSliceAll={handleSliceAll}
                  sliceAllLoading={sliceAllProcessing}
                  uploadedFiles={uploadedFiles}
                  printConfigs={printConfigs}
                  pricingConfig={pricingConfig}
                  feesConfig={feesConfig}
                  feeSelections={feeSelections}
                />
              )}
              {uploadedFiles.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Nahrané modely</h3>
                    <Button variant="ghost" size="icon" onClick={handleAddModelClick}>
                      <Icon name="Plus" size={16} />
                      <span className="sr-only">Přidání Modelu</span>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex flex-col">
                        <Button
                          variant={selectedFile && selectedFile.id === file.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedFileId(file.id)}
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          title={statusTooltips[file.status] || 'Neznámý stav'}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {file.status === 'processing' && (
                              <Icon name="Loader" size={14} className="animate-spin flex-shrink-0" />
                            )}
                            {file.status === 'pending' && <Icon name="Clock" size={14} className="flex-shrink-0 text-muted-foreground" />}
                            {file.status === 'completed' && (
                              <Icon name="CheckCircle" size={14} className="text-green-500 flex-shrink-0" />
                            )}
                            {file.status === 'failed' && (
                              <Icon name="XCircle" size={14} className="text-red-500 flex-shrink-0" />
                            )}
                            <span className="truncate flex-grow text-left">{file.name}</span>
                            {file.status === 'completed' && file.result?.metrics && (
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-auto">
                                {Math.round((file.result.metrics.estimatedTimeSeconds || 0) / 60)} min
                              </span>
                            )}
                          </div>
                        </Button>
                        {file.status === 'processing' && (
                          <div className="mx-3 mt-1">
                            <div className="h-1 bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Vypočítávám…</p>
                          </div>
                        )}
                        {file.status === 'failed' && file.error && (
                          <div className="mt-1 mx-3">
                            <p className={`text-[10px] ${file.errorSeverity === 'warning' ? 'text-amber-500' : 'text-red-500'}`} title={file.errorRaw || file.error}>
                              {file.error}
                            </p>
                            {file.errorCategory && file.errorCategory !== 'UNKNOWN' && (
                              <span className="text-[9px] text-muted-foreground">{file.errorCategory}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              iconName="ChevronLeft"
              iconPosition="left"
            >
              Zpět
            </Button>
            <div className="flex items-center space-x-4">
              {currentStep < 3 ? (
                <Button
                  variant="default"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  iconName="ChevronRight"
                  iconPosition="right"
                >
                  Pokračovat
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleProceedToCheckout}
                  disabled={!canProceed() || isProcessing}
                  loading={isProcessing}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  {isProcessing ? 'Zpracovávám...' : 'Přejít k výběru tiskárny'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestKalkulacka;
