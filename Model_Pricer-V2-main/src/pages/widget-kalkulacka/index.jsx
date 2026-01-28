// src/pages/widget-kalkulacka/index.jsx
// Widget calculator - duplicated from test-kalkulacka with theme support
// NOTE: Do NOT modify test-kalkulacka - this is a separate implementation for embedding

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { themeToCssVars, getDefaultWidgetTheme } from '../../utils/widgetThemeStorage';

// Default config is used for newly uploaded models
const DEFAULT_PRINT_CONFIG = {
  material: 'pla',
  color: null,
  quality: 'standard',
  infill: 20,
  quantity: 1,
  supports: false,
};

/**
 * Widget Calculator - Embeddable version with theme support.
 *
 * Props:
 * - theme: Theme configuration object (optional, defaults to standard theme)
 * - builderMode: If true, enables click-to-style interactions
 * - onElementSelect: Callback when element is clicked in builder mode
 * - embedded: If true, removes navigation elements for iframe embedding
 * - publicWidgetId: Public ID for postMessage events
 * - onQuoteCalculated: Callback when quote is calculated
 */
const WidgetKalkulacka = ({
  theme = null,
  builderMode = false,
  onElementSelect,
  embedded = false,
  publicWidgetId = null,
  onQuoteCalculated,
}) => {
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [printConfigs, setPrintConfigs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliceAllProcessing, setSliceAllProcessing] = useState(false);

  // Tenant-scoped pricing + fees (AdminPricing/AdminFees)
  const [pricingConfig, setPricingConfig] = useState(() => loadPricingConfigV3());
  const [feesConfig, setFeesConfig] = useState(() => loadFeesConfigV3());

  // Fee selections
  const [feeSelections, setFeeSelections] = useState(() => ({
    selectedFeeIds: new Set(),
    feeTargetsById: {},
  }));

  const [batchProgress, setBatchProgress] = useState({ mode: null, done: 0, total: 0 });

  // Widget presets
  const [availablePresets, setAvailablePresets] = useState([]);
  const [defaultPresetId, setDefaultPresetId] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState(null);

  // Apply theme CSS variables
  const effectiveTheme = theme || getDefaultWidgetTheme();
  const cssVars = useMemo(() => themeToCssVars(effectiveTheme), [effectiveTheme]);

  // Apply CSS variables to container
  useEffect(() => {
    if (containerRef.current) {
      Object.entries(cssVars).forEach(([key, value]) => {
        containerRef.current.style.setProperty(key, value);
      });
    }
  }, [cssVars]);

  // PostMessage resize notification
  useEffect(() => {
    if (!embedded || typeof window === 'undefined') return;

    const sendResize = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'MODELPRICER_RESIZE',
        publicWidgetId,
        height,
      }, '*');
    };

    // Initial + on resize
    sendResize();
    const observer = new ResizeObserver(sendResize);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [embedded, publicWidgetId]);

  // PostMessage ready notification
  useEffect(() => {
    if (!embedded || typeof window === 'undefined') return;

    window.parent.postMessage({
      type: 'MODELPRICER_WIDGET_READY',
      publicWidgetId,
    }, '*');
  }, [embedded, publicWidgetId]);

  const selectedFile = selectedFileId
    ? (uploadedFiles.find(f => f.id === selectedFileId) || null)
    : null;

  const updateModelStatus = useCallback((modelId, newProps) => {
    setUploadedFiles(prevFiles =>
      prevFiles.map(file => {
        if (file.id !== modelId) return file;

        const next = { ...file, ...newProps };

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

        if (Object.prototype.hasOwnProperty.call(newProps, 'result')) {
          next.result = patchSurfaceIntoResult(newProps.result);
        } else if (mergedClientModelInfo && next.result) {
          next.result = patchSurfaceIntoResult(next.result);
        }

        return next;
      })
    );
  }, []);

  const handleSurfaceComputed = useCallback(
    (modelId, payload) => {
      if (!modelId || !payload) return;
      const surfaceMm2 = payload?.surfaceMm2;
      const surfaceCm2 = payload?.surfaceCm2;

      const clientModelInfo = {};
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

    setPrintConfigs(prev => ({ ...prev, [selectedFileId]: newConfig }));
    updateModelStatus(selectedFileId, { status: 'pending', result: null, error: null });
  }, [selectedFileId, updateModelStatus]);

  // Sync configs from storage
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key) return;
      if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3());
      if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Seed fee selections from config
  useEffect(() => {
    const fees = Array.isArray(feesConfig?.fees) ? feesConfig.fees : [];
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

  // Auto-select first file
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      if (selectedFileId !== null) setSelectedFileId(null);
      return;
    }
    const exists = selectedFileId !== null && uploadedFiles.some(f => f.id === selectedFileId);
    if (!exists) setSelectedFileId(uploadedFiles[0].id);
  }, [uploadedFiles, selectedFileId]);

  // Load presets
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
    return () => { cancelled = true; };
  }, []);

  // Ensure config exists for selected file
  useEffect(() => {
    if (!selectedFile) return;
    if (printConfigs[selectedFile.id]) return;

    setPrintConfigs(prev => ({
      ...prev,
      [selectedFile.id]: { ...DEFAULT_PRINT_CONFIG },
    }));
  }, [selectedFile, printConfigs]);

  // Auto-advance step
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

      const trySliceWithFallback = async (presetId) => {
        try {
          return await sliceModelLocal(selectedFile.file, { presetId });
        } catch (e) {
          if (presetId) {
            setSelectedPresetId(null);
            return await sliceModelLocal(selectedFile.file, { presetId: null });
          }
          throw e;
        }
      };

      const res = await trySliceWithFallback(selectedPresetId);
      const ok = (res?.ok ?? res?.success ?? true);
      if (!ok) throw new Error(res?.error || res?.message || 'Slicovani selhalo');

      updateModelStatus(selectedFile.id, {
        status: 'completed',
        result: res,
        error: null,
      });

      if (currentStep < 3) setCurrentStep(3);

      // Notify parent via postMessage
      if (embedded && onQuoteCalculated) {
        onQuoteCalculated(res);
      }
    } catch (err) {
      updateModelStatus(selectedFile.id, {
        status: 'failed',
        error: String(err?.message || err),
      });
    }
  }, [selectedFile, printConfigs, updateModelStatus, currentStep, selectedPresetId, embedded, onQuoteCalculated]);

  const runBatchSlice = useCallback(async (targets, mode) => {
    if (!Array.isArray(targets) || targets.length === 0) return;

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

          const trySliceWithFallback = async (presetId) => {
            try {
              return await sliceModelLocal(fileItem.file, { presetId });
            } catch (e) {
              if (presetId) {
                effectivePresetId = null;
                setSelectedPresetId(null);
                return await sliceModelLocal(fileItem.file, { presetId: null });
              }
              throw e;
            }
          };

          const res = await trySliceWithFallback(effectivePresetId);
          const ok = (res?.ok ?? res?.success ?? true);
          if (!ok) throw new Error(res?.error || res?.message || 'Slicovani selhalo');

          updateModelStatus(fileItem.id, {
            status: 'completed',
            result: res,
            error: null,
          });
        } catch (err) {
          updateModelStatus(fileItem.id, {
            status: 'failed',
            error: String(err?.message || err),
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

    const filesSnapshot = [...uploadedFiles];
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

  const currentConfig = selectedFile ? (printConfigs[selectedFile.id] || {}) : {};

  const steps = [
    { id: 1, title: 'Nahrani souboru', icon: 'Upload' },
    { id: 2, title: 'Konfigurace', icon: 'Settings' },
    { id: 3, title: 'Cena', icon: 'Calculator' }
  ];

  const statusTooltips = {
    pending: 'Ceka na zpracovani',
    processing: 'Vypocet...',
    completed: 'Hotovo',
    failed: 'Vypocet se nezdaril'
  };

  const hasFailedModels = uploadedFiles.some(f => f.status === 'failed');
  const hasMultipleModels = uploadedFiles.length > 1;

  // Wrapper for builder mode - click to select element
  const StyleableWrapper = ({ children, elementId, className = '' }) => {
    if (!builderMode) return children;

    return (
      <div
        className={`widget-styleable ${className}`}
        data-element-id={elementId}
        onClick={(e) => {
          e.stopPropagation();
          onElementSelect?.(elementId);
        }}
        style={{ cursor: 'pointer', outline: '2px dashed transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.outline = '2px dashed #3B82F6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.outline = '2px dashed transparent'; }}
      >
        {children}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="widget-kalkulacka min-h-screen"
      style={{
        backgroundColor: 'var(--widget-bg, #FFFFFF)',
        fontFamily: 'var(--widget-font, Inter, system-ui, sans-serif)',
      }}
    >
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

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header - hidden in embedded mode */}
        {!embedded && (
          <StyleableWrapper elementId="header">
            <div className="mb-6">
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--widget-header, #1F2937)' }}
              >
                3D Tisk Kalkulacka
              </h1>
              <p style={{ color: 'var(--widget-muted, #6B7280)' }}>
                Nahrajte 3D model a okamzite zjistete cenu tisku.
              </p>
            </div>
          </StyleableWrapper>
        )}

        {/* Steps indicator */}
        <StyleableWrapper elementId="steps">
          <div className="mb-6">
            <div className="flex items-center justify-between max-w-md">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors"
                      style={{
                        backgroundColor: currentStep >= step.id ? 'var(--widget-btn-primary, #2563EB)' : 'transparent',
                        borderColor: currentStep >= step.id ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-border, #E5E7EB)',
                        color: currentStep >= step.id ? 'var(--widget-btn-text, #FFFFFF)' : 'var(--widget-muted, #6B7280)',
                      }}
                    >
                      <Icon name={step.icon} size={18} />
                    </div>
                    <span
                      className="mt-1 text-xs font-medium"
                      style={{ color: currentStep >= step.id ? 'var(--widget-text, #374151)' : 'var(--widget-muted, #6B7280)' }}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-12 h-0.5 mx-2"
                      style={{
                        backgroundColor: currentStep > step.id ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-border, #E5E7EB)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </StyleableWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Upload & Config */}
          <div className="lg:col-span-2 space-y-6">
            {uploadedFiles.length === 0 && currentStep === 1 && (
              <StyleableWrapper elementId="upload">
                <FileUploadZone onFilesUploaded={handleFilesUploaded} theme={effectiveTheme} />
              </StyleableWrapper>
            )}

            {uploadedFiles.length > 0 && (
              <StyleableWrapper elementId="config">
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
                    theme={effectiveTheme}
                  />
                </div>
              </StyleableWrapper>
            )}
          </div>

          {/* Right column - Preview & Price */}
          <div className="space-y-4">
            {/* CTA buttons */}
            {uploadedFiles.length > 0 && selectedFile && (
              <StyleableWrapper elementId="cta">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <GenerateButton
                      size="top"
                      label="Spocitat cenu"
                      onClick={handleSliceSelected}
                      loading={selectedFile.status === 'processing'}
                      disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllProcessing}
                      theme={effectiveTheme}
                    />

                    {hasMultipleModels && (
                      <GenerateButton
                        size="top"
                        label="Spocitat vse"
                        onClick={handleSliceAll}
                        loading={sliceAllProcessing && batchProgress.mode === 'all'}
                        disabled={sliceAllProcessing || uploadedFiles.some(f => f.status === 'processing')}
                        theme={effectiveTheme}
                      />
                    )}

                    {hasFailedModels && (
                      <GenerateButton
                        size="top"
                        label="Reslice failed"
                        onClick={handleResliceFailed}
                        loading={sliceAllProcessing && batchProgress.mode === 'failed'}
                        disabled={sliceAllProcessing || uploadedFiles.some(f => f.status === 'processing')}
                        theme={effectiveTheme}
                      />
                    )}
                  </div>

                  {sliceAllProcessing && batchProgress.total > 0 && (
                    <div className="text-xs text-center" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                      {batchProgress.mode === 'failed' ? 'Reslice failed' : 'Spocitat vse'} – hotovo {batchProgress.done}/{batchProgress.total}
                    </div>
                  )}
                </div>
              </StyleableWrapper>
            )}

            {/* Model Viewer */}
            <StyleableWrapper elementId="viewer">
              <ErrorBoundary>
                <ModelViewer
                  selectedFile={selectedFile}
                  onRemove={handleFileDelete}
                  onSurfaceComputed={handleSurfaceComputed}
                  theme={effectiveTheme}
                />
              </ErrorBoundary>
            </StyleableWrapper>

            {/* Pricing Calculator */}
            {uploadedFiles.length > 0 && (
              <StyleableWrapper elementId="pricing">
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
                  theme={effectiveTheme}
                />
              </StyleableWrapper>
            )}

            {/* File list */}
            {uploadedFiles.length > 0 && (
              <StyleableWrapper elementId="filelist">
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'var(--widget-card, #F9FAFB)',
                    border: '1px solid var(--widget-border, #E5E7EB)',
                    borderRadius: 'var(--widget-radius, 12px)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      Nahrane modely
                    </h3>
                    <Button variant="ghost" size="icon" onClick={handleAddModelClick}>
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {uploadedFiles.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFile && selectedFile.id === file.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFileId(file.id)}
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        title={statusTooltips[file.status] || 'Neznamy stav'}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {file.status === 'processing' && (
                            <Icon name="Loader" size={14} className="animate-spin flex-shrink-0" />
                          )}
                          {file.status === 'pending' && <Icon name="Clock" size={14} className="flex-shrink-0" />}
                          {file.status === 'completed' && (
                            <Icon name="CheckCircle" size={14} className="text-green-500 flex-shrink-0" />
                          )}
                          {file.status === 'failed' && (
                            <Icon name="XCircle" size={14} className="text-red-500 flex-shrink-0" />
                          )}
                          <span className="truncate flex-grow text-left">{file.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </StyleableWrapper>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetKalkulacka;
