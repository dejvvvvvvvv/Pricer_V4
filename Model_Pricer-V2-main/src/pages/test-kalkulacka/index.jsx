// src/pages/test-kalkulacka/index.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FileUploadZone from './components/FileUploadZone';
import ModelViewer from './components/ModelViewer';
import MeshRepairPanel from './components/MeshRepairPanel';
import ModelInfoPanel from './components/ModelInfoPanel';
import PrintConfiguration from './components/PrintConfiguration';
import PricingCalculator from './components/PricingCalculator';
import GenerateButton from './components/GenerateButton';
import ErrorBoundary from './components/ErrorBoundary';
import SortableFileList from './components/SortableFileList';
import CheckoutForm from './components/CheckoutForm';
import OrderConfirmation from './components/OrderConfirmation';
import ShopifyCartButton from '../widget-kalkulacka/components/ShopifyCartButton';
import { sliceModelLocal } from '../../services/slicerApi';
import { fetchWidgetPresets } from '../../services/presetsApi';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';
import { loadFeesConfigV3 } from '../../utils/adminFeesStorage';
import { loadExpressConfigV1 } from '../../utils/adminExpressStorage';
import { loadShippingConfigV1 } from '../../utils/adminShippingStorage';
import { loadCouponsConfigV1 } from '../../utils/adminCouponStorage';
import { getShopifyConfig } from '../../utils/adminEcommerceStorage';
import { getBranding } from '../../utils/adminBrandingWidgetStorage';
import { getTenantId } from '../../utils/adminTenantStorage';
import { calculateOrderQuote } from '../../lib/pricing/pricingEngineV3';
import { parseSlicerError } from '../../utils/slicerErrorClassifier';
import useDebouncedRecalculation from './hooks/useDebouncedRecalculation';
import { debug } from '@/lib/debug';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useIsMobile } from '../../hooks/useMediaQuery';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import OnboardingTour, { TOUR_STEPS } from './components/OnboardingTour';
import { useOnboardingTour } from '../../hooks/useOnboardingTour';
import SlicingProgressContainer, { useSlicingToasts } from './components/SlicingProgressToast';
import { addNotification } from '../../utils/adminNotificationStorage';
import { useAutoSaveConfig } from '../../hooks/useAutoSaveConfig';
import { useThemeToggle } from '../../hooks/useThemeToggle';
import { useUrlState } from '../../hooks/useUrlState';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import ShareConfigButton from './components/ShareConfigButton';
import UndoRedoButtons from './components/UndoRedoButtons';
import { SAMPLE_MODELS } from '../../lib/sampleModels';
import '../../styles/responsive-kalkulacka.css';
import '../../styles/animations.css';
import '../../styles/light-theme-kalkulacka.css';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Micro-UX: count-up animation hook for price display ---
function useCountUp(targetValue, duration = 500) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef({ value: 0, time: 0 });

  useEffect(() => {
    const target = Number.isFinite(targetValue) ? targetValue : 0;
    if (target === displayValue && rafRef.current == null) return;

    const startValue = displayValue;
    const startTime = performance.now();
    startRef.current = { value: startValue, time: startTime };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;
      setDisplayValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue, duration]);

  return displayValue;
}

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
  const { t } = useLanguage();
  // Branding — načtení konfigurace z AdminBranding (musí být před useDocumentTitle)
  const [branding, setBranding] = useState(() => getBranding(getTenantId()));
  useDocumentTitle(branding?.businessName || 'Calculator');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const themeContainerRef = useRef(null);
  const isMobile = useIsMobile();
  const { theme, toggleTheme, isDark } = useThemeToggle(themeContainerRef);

  const [currentStep, setCurrentStepRaw] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [printConfigs, setPrintConfigs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliceAllProcessing, setSliceAllProcessing] = useState(false);

  // Wrapper: track highest step reached for breadcrumb navigation
  const setCurrentStep = useCallback((step) => {
    const nextStep = typeof step === 'function' ? step(currentStep) : step;
    setCurrentStepRaw(nextStep);
    setHighestStepReached(prev => Math.max(prev, nextStep));
  }, [currentStep]);

  // Navigate to a previously completed step (preserves all data)
  const handleStepClick = useCallback((stepId) => {
    // Can only navigate to steps that have been reached before (completed or current)
    if (stepId <= highestStepReached && stepId !== currentStep) {
      setCurrentStepRaw(stepId);
    }
  }, [highestStepReached, currentStep]);

  // Auto-save hook — persists print config to sessionStorage
  const { savedConfig, saveConfig, clearConfig, lastSaved, isRestored, markRestored } = useAutoSaveConfig();

  // Undo/redo for print configs (per-file history)
  const configUndoRedo = useUndoRedo({ maxHistory: 30, debounceMs: 400 });

  // URL state sharing — encode/decode calculator config in URL search params
  const currentConfigForUrl = selectedFileId ? (printConfigs[selectedFileId] || null) : null;
  const { initialUrlConfig, getShareableUrl } = useUrlState(currentConfigForUrl, { debounceMs: 300 });

  // Apply URL-provided config to the first uploaded model (once)
  const urlConfigAppliedRef = useRef(false);
  useEffect(() => {
    if (urlConfigAppliedRef.current || !initialUrlConfig) return;
    if (!selectedFileId) return;

    // Only apply if the model still has default config (user hasn't changed it yet)
    const existing = printConfigs[selectedFileId];
    if (!existing) return;

    urlConfigAppliedRef.current = true;
    const merged = { ...existing, ...initialUrlConfig };
    setPrintConfigs(prev => ({ ...prev, [selectedFileId]: merged }));
    debug('[test-kalkulacka] Applied URL config:', initialUrlConfig);
  }, [initialUrlConfig, selectedFileId, printConfigs]);

  // Tenant-scoped pricing + fees (AdminPricing/AdminFees)
  const [pricingConfig, setPricingConfig] = useState(() => loadPricingConfigV3());
  const [feesConfig, setFeesConfig] = useState(() => loadFeesConfigV3());

  // Fee selections in calculator UI (optional selectable fees + apply targets)
  const [feeSelections, setFeeSelections] = useState(() => ({
    selectedFeeIds: new Set(),
    feeTargetsById: {},
  }));

  // S09: Express pricing — auto-select default tier
  const [expressConfig, setExpressConfig] = useState(() => loadExpressConfigV1());
  const [selectedExpressTierId, setSelectedExpressTierId] = useState(() => {
    const ec = loadExpressConfigV1();
    if (!ec?.enabled || !Array.isArray(ec.tiers)) return null;
    const activeTiers = ec.tiers.filter(t => t.active !== false);
    const defaultTier = activeTiers.find(t => t.is_default);
    return defaultTier?.id || activeTiers[0]?.id || null;
  });

  // S04: Shipping — auto-select first active method
  const [shippingConfig, setShippingConfig] = useState(() => loadShippingConfigV1());
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState(() => {
    const sc = loadShippingConfigV1();
    if (!sc?.enabled || !Array.isArray(sc.methods)) return null;
    const activeMethods = sc.methods.filter(m => m.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return activeMethods[0]?.id || null;
  });

  // S10: Coupons
  const [couponsConfig, setCouponsConfig] = useState(() => loadCouponsConfigV1());
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  const [batchProgress, setBatchProgress] = useState({ mode: null, done: 0, total: 0 });

  // Slicing progress toasts
  const slicingToasts = useSlicingToasts();

  // Ref for auto-scroll to pricing results after slicing completes
  const pricingResultsRef = useRef(null);
  // Track last completed file to trigger auto-scroll only on new completions
  const lastCompletedCountRef = useRef(0);

  // Compute total price for sticky bar + count-up animation
  const stickyTotalPrice = useMemo(() => {
    try {
      if (uploadedFiles.length === 0) return null;
      const readyFiles = uploadedFiles.filter(f => f.status === 'completed' && f.result);
      if (readyFiles.length === 0) return null;
      const quote = calculateOrderQuote({
        uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections,
        expressConfig, selectedExpressTierId,
        couponsConfig, appliedCouponCode,
        shippingConfig, selectedShippingMethodId,
      });
      return Number.isFinite(quote?.grandTotal) ? quote.grandTotal
        : Number.isFinite(quote?.total) ? quote.total : null;
    } catch {
      return null;
    }
  }, [uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections,
      expressConfig, selectedExpressTierId, couponsConfig, appliedCouponCode,
      shippingConfig, selectedShippingMethodId]);

  const animatedPrice = useCountUp(stickyTotalPrice ?? 0, 500);

  // Auto-scroll to pricing results when a model finishes slicing
  useEffect(() => {
    const completedCount = uploadedFiles.filter(f => f.status === 'completed').length;
    if (completedCount > lastCompletedCountRef.current && completedCount > 0) {
      // A new model just completed — scroll to pricing results
      setTimeout(() => {
        pricingResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
    lastCompletedCountRef.current = completedCount;
  }, [uploadedFiles]);

  // Handler: load a sample model
  const handleLoadSample = useCallback((sampleModel) => {
    try {
      const file = sampleModel.generate();
      handleFilesUploaded({ file });
    } catch (err) {
      debug('[test-kalkulacka] Failed to generate sample model:', err);
    }
  // handleFilesUploaded is not wrapped in useCallback so we skip it in deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mesh repair panel state
  const [modelGeometry, setModelGeometry] = useState(null);
  const [meshRepairOpen, setMeshRepairOpen] = useState(false);

  // Keep calculator configs synced with localStorage changes (best-effort; storage events fire across tabs).
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key) return;
      if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3());
      if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3());
      if (e.key.includes('express:v1')) setExpressConfig(loadExpressConfigV1());
      if (e.key.includes('shipping:v1')) setShippingConfig(loadShippingConfigV1());
      if (e.key.includes('coupons:v1')) setCouponsConfig(loadCouponsConfigV1());
      if (e.key && e.key.includes('branding')) setBranding(getBranding(getTenantId()));
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
  // Bug 2 fix: per-model preset selection (keyed by fileId)
  const [selectedPresetIds, setSelectedPresetIds] = useState({});
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState(null);

  // Restore saved config from sessionStorage on mount (auto-save recovery)
  useEffect(() => {
    if (!savedConfig || isRestored) return;
    markRestored();

    if (savedConfig.printConfigs && Object.keys(savedConfig.printConfigs).length > 0) {
      setPrintConfigs(prev => ({ ...prev, ...savedConfig.printConfigs }));
      debug('[test-kalkulacka] Restored printConfigs from session');
    }
    if (savedConfig.selectedPresetIds && Object.keys(savedConfig.selectedPresetIds).length > 0) {
      setSelectedPresetIds(prev => ({ ...prev, ...savedConfig.selectedPresetIds }));
      debug('[test-kalkulacka] Restored selectedPresetIds from session');
    }
    if (savedConfig.feeSelections) {
      setFeeSelections(savedConfig.feeSelections);
      debug('[test-kalkulacka] Restored feeSelections from session');
    }
  }, [savedConfig, isRestored, markRestored]);

  // Auto-save config to sessionStorage on changes (debounced)
  useEffect(() => {
    // Don't save until restoration is complete (avoid overwriting saved data with empty state)
    if (!isRestored && savedConfig) return;
    // Only save if there's something meaningful to save
    if (Object.keys(printConfigs).length === 0) return;

    saveConfig({
      printConfigs,
      selectedPresetIds,
      feeSelections,
    });
  }, [printConfigs, selectedPresetIds, feeSelections, saveConfig, isRestored, savedConfig]);

  // Shopify integration
  const [shopifyConfig] = useState(() => {
    const cfg = getShopifyConfig();
    return (cfg?.enabled && cfg?.shop_domain) ? cfg : null;
  });

  // S02: Checkout state
  const [lastOrderResult, setLastOrderResult] = useState(null);

  // Keyboard shortcuts help overlay
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Onboarding tour
  const onboarding = useOnboardingTour(TOUR_STEPS);

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

  // Callback for when ModelViewer loads STL geometry — used by MeshRepairPanel.
  const handleGeometryLoaded = useCallback((geometry) => {
    setModelGeometry(geometry);
  }, []);

  // Reset geometry when selected file changes.
  useEffect(() => {
    setModelGeometry(null);
    setMeshRepairOpen(false);
  }, [selectedFileId]);

  // Bug 1 fix: auto-recalculation when config changes
  const doRecalc = useCallback((fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file?.file) return;
    if (file.status === 'processing') return;

    const presetId = selectedPresetIds[fileId] ?? null;

    updateModelStatus(fileId, { status: 'processing', error: null });

    const trySliceWithFallback = async (pid) => {
      try {
        return await sliceModelLocal(file.file, { presetId: pid });
      } catch (e) {
        if (pid) {
          debug('[test-kalkulacka] Auto-recalc failed with presetId, retrying without:', pid, e);
          setSelectedPresetIds(prev => ({ ...prev, [fileId]: null }));
          return await sliceModelLocal(file.file, { presetId: null });
        }
        throw e;
      }
    };

    trySliceWithFallback(presetId)
      .then(res => {
        const ok = (res?.ok ?? res?.success ?? true);
        if (!ok) throw new Error(res?.error || res?.message || 'Slicovani selhalo');
        updateModelStatus(fileId, { status: 'completed', result: res, error: null });
      })
      .catch(err => {
        debug('[test-kalkulacka] Auto-recalc failed:', err);
        const classified = parseSlicerError(err);
        updateModelStatus(fileId, {
          status: 'failed',
          error: classified.userMessage,
          errorCategory: classified.category,
          errorSeverity: classified.severity,
          errorRaw: classified.raw,
        });
      });
  }, [uploadedFiles, selectedPresetIds, updateModelStatus]);

  const { trigger: triggerRecalc, triggerSlider: triggerRecalcSlider, cancel: cancelRecalc } = useDebouncedRecalculation(doRecalc);

  // Cancel pending recalc on unmount
  useEffect(() => cancelRecalc, [cancelRecalc]);

  const handleConfigChange = useCallback((newConfig, { isSlider } = {}) => {
    if (selectedFileId === null) return;

    // Record state for undo/redo (debounced internally — rapid slider drags
    // are batched into one undo step)
    configUndoRedo.recordState(selectedFileId, newConfig);

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
        // Bug 1 fix: trigger auto-recalculation after debounce
        if (isSlider) {
          triggerRecalcSlider(selectedFileId);
        } else {
          triggerRecalc(selectedFileId);
        }
      }

      return { ...prev, [selectedFileId]: newConfig };
    });
  }, [selectedFileId, updateModelStatus, triggerRecalc, triggerRecalcSlider, configUndoRedo]);

  // Undo handler — restore previous config for current file
  const handleUndo = useCallback(() => {
    if (selectedFileId === null) return;
    const restored = configUndoRedo.undo(selectedFileId);
    if (restored) {
      setPrintConfigs(prev => ({ ...prev, [selectedFileId]: restored }));
      updateModelStatus(selectedFileId, { status: 'pending', result: null, error: null });
      triggerRecalc(selectedFileId);
    }
  }, [selectedFileId, configUndoRedo, updateModelStatus, triggerRecalc]);

  // Redo handler — restore next config for current file
  const handleRedo = useCallback(() => {
    if (selectedFileId === null) return;
    const restored = configUndoRedo.redo(selectedFileId);
    if (restored) {
      setPrintConfigs(prev => ({ ...prev, [selectedFileId]: restored }));
      updateModelStatus(selectedFileId, { status: 'pending', result: null, error: null });
      triggerRecalc(selectedFileId);
    }
  }, [selectedFileId, configUndoRedo, updateModelStatus, triggerRecalc]);

  // Keyboard shortcut for Ctrl+Z: skip if Shift is also pressed (that's redo)
  const handleUndoKeyboard = useCallback((e) => {
    if (e.shiftKey) return; // Ctrl+Shift+Z is redo, not undo
    handleUndo();
  }, [handleUndo]);

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
  useKeyboardShortcut('z', handleUndoKeyboard, { ctrlKey: true, allowInInputs: true });
  useKeyboardShortcut('y', handleRedo, { ctrlKey: true, allowInInputs: true });
  useKeyboardShortcut('z', handleRedo, { ctrlKey: true, shiftKey: true, allowInInputs: true });

  // Apply a config from pricing history to the currently selected model
  const handleApplyHistoryConfig = useCallback((historyConfig) => {
    if (selectedFileId === null || !historyConfig) return;
    const newConfig = {
      material: historyConfig.material || 'pla',
      quality: historyConfig.quality || 'standard',
      infill: historyConfig.infill ?? 20,
      supports: !!historyConfig.supports,
      quantity: historyConfig.quantity ?? 1,
    };
    handleConfigChange(newConfig);
  }, [selectedFileId, handleConfigChange]);

  const steps = [
    { id: 1, title: t('calculator.step.upload'), icon: 'Upload', description: t('calculator.step.upload.desc') },
    { id: 2, title: t('calculator.step.config'), icon: 'Settings', description: t('calculator.step.config.desc') },
    { id: 3, title: t('calculator.step.review'), icon: 'Calculator', description: t('calculator.step.review.desc') },
    { id: 4, title: t('calculator.step.order'), icon: 'ShoppingCart', description: t('calculator.step.order.desc') },
    { id: 5, title: t('calculator.step.confirm'), icon: 'CheckCircle', description: t('calculator.step.confirm.desc') },
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

  // Bug 3 fix: Extract preset loading into callable function with retry support
  const cancelledRef = useRef(false);

  const loadPresets = useCallback(async () => {
    setPresetsLoading(true);
    setPresetsError(null);
    try {
      const res = await fetchWidgetPresets();
      if (cancelledRef.current) return;

      if (!res?.ok) {
        throw new Error(res?.message || 'Failed to load presets');
      }

      const payload = res.data || {};
      const presets = Array.isArray(payload?.presets) ? payload.presets : [];
      const defId = typeof payload?.defaultPresetId === 'string' && payload.defaultPresetId ? payload.defaultPresetId : null;

      setAvailablePresets(presets);
      setDefaultPresetId(defId);

      // Preselect default preset for all current models that don't have one yet
      const preselected = (defId && presets.some(p => p?.id === defId))
        ? defId
        : (presets?.[0]?.id || null);

      if (preselected) {
        setSelectedPresetIds(prev => {
          const next = { ...prev };
          // Only set for models that don't have a preset yet
          for (const f of uploadedFiles) {
            if (next[f.id] == null) next[f.id] = preselected;
          }
          // Also set a default for future models
          next.__default = preselected;
          return next;
        });
      }
    } catch (e) {
      if (cancelledRef.current) return;
      setAvailablePresets([]);
      setDefaultPresetId(null);
      setPresetsError(e || new Error('Failed to load presets'));
    } finally {
      if (!cancelledRef.current) setPresetsLoading(false);
    }
  }, [uploadedFiles]);

  // Load presets on mount
  useEffect(() => {
    cancelledRef.current = false;
    loadPresets();
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Bug 2 fix: use per-model preset
    const presetId = selectedPresetIds[selectedFile.id] ?? null;

    try {
      updateModelStatus(selectedFile.id, { status: 'processing', error: null });
      slicingToasts.startSlice(selectedFile.id, selectedFile.name);

      debug('[test-kalkulacka] Slicing (local) file:', selectedFile.name, 'config:', cfg);

      const trySliceWithFallback = async (pid) => {
        try {
          return await sliceModelLocal(selectedFile.file, { presetId: pid });
        } catch (e) {
          // Fallback: if preset-based slicing fails, drop presetId and retry once.
          if (pid) {
            debug('[test-kalkulacka] Slice failed with presetId, retrying without presetId:', pid, e);
            setSelectedPresetIds(prev => ({ ...prev, [selectedFile.id]: null }));
            return await sliceModelLocal(selectedFile.file, { presetId: null });
          }
          throw e;
        }
      };

      const res = await trySliceWithFallback(presetId);
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
      slicingToasts.completeSlice(selectedFile.id);

      // Log to admin notification storage
      addNotification({ type: 'slicing', title: `Slicovani dokonceno: ${selectedFile.name}` });

      // After successful slice, it's useful to show the price step.
      if (currentStep < 3) setCurrentStep(3);
    } catch (err) {
      debug('[test-kalkulacka] Slice failed:', err);
      const classified = parseSlicerError(err);
      updateModelStatus(selectedFile.id, {
        status: 'failed',
        error: classified.userMessage,
        errorCategory: classified.category,
        errorSeverity: classified.severity,
        errorRaw: classified.raw,
      });
      slicingToasts.failSlice(selectedFile.id, classified.userMessage);

      // Log error to admin notification storage
      addNotification({ type: 'error', title: `Slicovani selhalo: ${selectedFile.name}`, description: classified.userMessage });
    }
  }, [selectedFile, printConfigs, updateModelStatus, currentStep, selectedPresetIds, slicingToasts]);

  const runBatchSlice = useCallback(async (targets, mode) => {
    if (!Array.isArray(targets) || targets.length === 0) return;

    setSliceAllProcessing(true);
    setBatchProgress({ mode, done: 0, total: targets.length });

    const batchId = slicingToasts.startBatch(
      targets.length,
      targets.map(f => f.name)
    );
    let hasErrors = false;

    try {
      if (currentStep < 3) setCurrentStep(3);

      let done = 0;
      for (const fileItem of targets) {
        if (!fileItem?.file) {
          done += 1;
          setBatchProgress(prev => ({ ...prev, done }));
          slicingToasts.updateBatch(batchId, done, fileItem?.name);
          continue;
        }

        // Bug 2 fix: use per-model preset
        let effectivePresetId = selectedPresetIds[fileItem.id] ?? null;

        try {
          updateModelStatus(fileItem.id, { status: 'processing', error: null });
          slicingToasts.updateBatch(batchId, done, fileItem.name);
          debug('[test-kalkulacka] Batch slicing (local):', fileItem.name);

          const trySliceWithFallback = async (presetId) => {
            try {
              return await sliceModelLocal(fileItem.file, { presetId });
            } catch (e) {
              if (presetId) {
                debug('[test-kalkulacka] Batch slice failed with presetId, retrying without presetId:', presetId, e);
                effectivePresetId = null;
                setSelectedPresetIds(prev => ({ ...prev, [fileItem.id]: null }));
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
          hasErrors = true;
          debug('[test-kalkulacka] Batch slice failed:', fileItem.name, err);
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
          slicingToasts.updateBatch(batchId, done, fileItem.name);
        }
      }
    } finally {
      setSliceAllProcessing(false);
      slicingToasts.completeBatch(batchId, hasErrors);

      // Log batch result to admin notification storage
      const resultLabel = hasErrors ? 's chybami' : 'uspesne';
      addNotification({
        type: hasErrors ? 'error' : 'slicing',
        title: `Davkove slicovani dokonceno ${resultLabel} (${targets.length} souboru)`,
      });
    }
  }, [currentStep, selectedPresetIds, updateModelStatus, slicingToasts]);

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
      const newId = crypto.randomUUID();
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

      // Bug 2 fix: assign default preset to new model
      setSelectedPresetIds(prev => {
        if (prev[newId] != null) return prev;
        const defPreset = prev.__default ?? defaultPresetId ?? (availablePresets?.[0]?.id || null);
        return { ...prev, [newId]: defPreset };
      });
    }
  };

  const handleAddModelClick = () => fileInputRef.current?.click();

  // Drag-and-drop reorder: receives the already-reordered array from SortableFileList.
  const handleReorderFiles = useCallback((reorderedFiles) => {
    setUploadedFiles(reorderedFiles);
    // selectedFileId stays the same — it references by id, not index.
  }, []);

  const handleResetUpload = () => {
    setUploadedFiles([]);
    setSelectedFileId(null);
    setPrintConfigs({});
    setSelectedPresetIds(prev => ({ __default: prev.__default }));
    setCurrentStepRaw(1);
    setHighestStepReached(1);
    setLastOrderResult(null);
    setSelectedExpressTierId(null);
    setSelectedShippingMethodId(null);
    setAppliedCouponCode('');
    clearConfig(); // Clear auto-saved config on reset
    configUndoRedo.clearAll(); // Clear undo/redo history on full reset
  };

  const handleFileDelete = (fileToDelete) => {
    const newUploadedFiles = uploadedFiles.filter(file => file.id !== fileToDelete.id);
    const newPrintConfigs = { ...printConfigs };
    delete newPrintConfigs[fileToDelete.id];

    setUploadedFiles(newUploadedFiles);
    setPrintConfigs(newPrintConfigs);
    configUndoRedo.clearHistory(fileToDelete.id);

    // Bug 2 fix: clean up per-model preset
    setSelectedPresetIds(prev => {
      const next = { ...prev };
      delete next[fileToDelete.id];
      return next;
    });

    if (selectedFileId !== null && selectedFileId === fileToDelete.id) {
      setSelectedFileId(newUploadedFiles.length > 0 ? newUploadedFiles[0].id : null);
    }
    if (newUploadedFiles.length === 0) {
      handleResetUpload();
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // S02: Called when checkout form is submitted successfully
  const handleCheckoutComplete = useCallback((orderResult) => {
    setLastOrderResult(orderResult);
    setCurrentStep(5);
    clearConfig(); // Clear auto-saved config after successful order
  }, [clearConfig, setCurrentStep]);

  // S02: Called from confirmation page to start fresh
  const handleStartNewOrder = useCallback(() => {
    handleResetUpload();
  }, []);

  const currentConfig = selectedFile ? (printConfigs[selectedFile.id] || {}) : {};

  const canProceed = () => {
    switch (currentStep) {
      case 1: return uploadedFiles.length > 0;
      case 2: return !!currentConfig && !!selectedFile;
      case 3: return uploadedFiles.every(f => f.status === 'completed');
      case 4: return false; // Checkout form handles its own submit
      case 5: return false; // Confirmation, no further step
      default: return false;
    }
  };

  const hasFailedModels = uploadedFiles.some(f => f.status === 'failed');
  const hasMultipleModels = uploadedFiles.length > 1;

  // Retry handler for a specific failed model
  const handleRetryModel = useCallback((modelId) => {
    const file = uploadedFiles.find(f => f.id === modelId);
    if (!file?.file || file.status === 'processing') return;
    updateModelStatus(modelId, { status: 'processing', error: null, errorCategory: null, errorSeverity: null, errorRaw: null });
    const presetId = selectedPresetIds[modelId] ?? null;
    sliceModelLocal(file.file, { presetId })
      .then(res => {
        const ok = (res?.ok ?? res?.success ?? true);
        if (!ok) throw new Error(res?.error || res?.message || 'Slicovani selhalo');
        updateModelStatus(modelId, { status: 'completed', result: res, error: null });
      })
      .catch(err => {
        const classified = parseSlicerError(err);
        updateModelStatus(modelId, {
          status: 'failed',
          error: classified.userMessage,
          errorCategory: classified.category,
          errorSeverity: classified.severity,
          errorRaw: classified.raw,
        });
      });
  }, [uploadedFiles, selectedPresetIds, updateModelStatus]);

  // --- Keyboard shortcuts ---

  // Ctrl+Enter: Trigger slicing (same as Generate/Slice button)
  useKeyboardShortcut('Enter', useCallback(() => {
    if (shortcutsHelpOpen) return;
    if (selectedFile && selectedFile.status !== 'processing' && !sliceAllProcessing) {
      handleSliceSelected();
    }
  }, [selectedFile, sliceAllProcessing, handleSliceSelected, shortcutsHelpOpen]), { ctrlKey: true });

  // Escape: Close shortcuts help -> close checkout -> cancel operation
  useKeyboardShortcut('Escape', useCallback(() => {
    if (shortcutsHelpOpen) {
      setShortcutsHelpOpen(false);
      return;
    }
    // If on checkout step, go back to step 3
    if (currentStep === 4) {
      setCurrentStep(3);
      return;
    }
    // If on confirmation step, do nothing (order is already placed)
    if (currentStep === 5) return;
    // Otherwise cancel pending recalc if any
    cancelRecalc();
  }, [shortcutsHelpOpen, currentStep, cancelRecalc]), { allowInInputs: true });

  // Ctrl+S: Export pricing summary as JSON
  useKeyboardShortcut('s', useCallback(() => {
    if (shortcutsHelpOpen) return;
    if (uploadedFiles.length === 0) return;

    try {
      const summary = uploadedFiles.map(f => ({
        name: f.name,
        status: f.status,
        metrics: f.result?.metrics || null,
      }));

      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pricing-summary.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      debug('[test-kalkulacka] Export failed:', err);
    }
  }, [uploadedFiles, shortcutsHelpOpen]), { ctrlKey: true });

  // Ctrl+U: Focus file upload / trigger file picker
  useKeyboardShortcut('u', useCallback(() => {
    if (shortcutsHelpOpen) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [shortcutsHelpOpen]), { ctrlKey: true });

  // ? key: Show keyboard shortcuts help
  useKeyboardShortcut('?', useCallback(() => {
    setShortcutsHelpOpen(prev => !prev);
  }, []));

  // F1: Also show keyboard shortcuts help
  useKeyboardShortcut('F1', useCallback(() => {
    setShortcutsHelpOpen(prev => !prev);
  }, []));

  return (
    <div
      ref={themeContainerRef}
      className="min-h-screen"
      role="main"
      aria-label="3D model pricing calculator"
      style={{
        backgroundColor: 'var(--forge-bg-void)',
        color: 'var(--forge-text-primary)',
        minHeight: '100vh',
        fontFamily: 'var(--forge-font-body)',
        position: 'relative',
      }}
    >
      {/* Screen reader live region for price announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        id="tk-price-announcer"
      />
      {/* Theme toggle button */}
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={isDark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
        aria-label={isDark ? 'Přepnout na světlý motiv' : 'Přepnout na tmavý motiv'}
      >
        <span className="theme-toggle-icon">
          <Icon name={isDark ? 'Sun' : 'Moon'} size={18} />
        </span>
      </button>
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
        aria-label="Vybrat 3D modely pro nahrani"
        tabIndex={-1}
      />

      <div>
        <div className="max-w-7xl mx-auto px-6 py-8 tk-page-container">
          <div className="mb-8">
            <div
              className="flex items-center space-x-2 text-sm mb-2 tk-breadcrumb"
              style={{ color: 'var(--forge-text-muted)' }}
            >
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="transition-colors"
                style={{ color: 'var(--forge-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--forge-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--forge-text-muted)'}
                aria-label="Prejit na Dashboard"
              >
                Dashboard
              </button>
              <Icon name="ChevronRight" size={16} />
              <span style={{ color: 'var(--forge-text-primary)' }}>Nahrání modelu</span>
            </div>
            {/* Branding: logo + název firmy */}
            {branding?.showLogo && branding?.logo && (
              <div className="mb-3" style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={branding.logo}
                  alt={branding.businessName || 'Logo'}
                  style={{ maxHeight: 48, maxWidth: 180, objectFit: 'contain' }}
                />
              </div>
            )}
            <h1
              className="text-3xl font-bold mb-2 tk-page-title"
              style={{ color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' }}
            >
              {branding?.showBusinessName && branding?.businessName
                ? branding.businessName
                : 'Nahrání 3D modelu'}
            </h1>
            <p className="tk-page-subtitle" style={{ color: 'var(--forge-text-secondary)' }}>
              {branding?.showTagline && branding?.tagline
                ? branding.tagline
                : 'Nahrajte své 3D modely a nakonfigurujte parametry tisku.'}
            </p>
          </div>

          <div className="mb-8">
            {/* Breadcrumb text path */}
            <nav
              aria-label="Breadcrumb"
              className="tk-breadcrumb-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                fontSize: '0.8125rem',
                color: 'var(--forge-text-muted, #7A8291)',
                fontFamily: 'var(--forge-font-body)',
              }}
            >
              <span style={{ color: 'var(--forge-text-muted)' }}>Kalkulačka</span>
              <span aria-hidden="true" style={{ color: 'var(--forge-text-muted)', opacity: 0.5, userSelect: 'none' }}>/</span>
              <span style={{ color: 'var(--forge-text-primary, #E8EAED)' }} aria-current="step">
                {steps.find(s => s.id === currentStep)?.title || ''}
              </span>
            </nav>

            <div className="flex items-center justify-between" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '0.75rem' : '0' }}>
              <div className="tk-stepper" role="navigation" aria-label="Kroky objednavky" aria-describedby="tk-stepper-progress">
                {steps.map((step, index) => {
                  const isCompleted = step.id < currentStep || (step.id <= highestStepReached && step.id !== currentStep);
                  const isCurrent = step.id === currentStep;
                  const isReachable = step.id <= highestStepReached;
                  const isFuture = step.id > highestStepReached;
                  const isClickable = isReachable && !isCurrent;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          className={`flex items-center justify-center transition-colors tk-stepper-step-circle${isClickable ? ' tk-stepper-clickable' : ''}`}
                          onClick={isClickable ? () => handleStepClick(step.id) : undefined}
                          disabled={!isClickable}
                          aria-current={isCurrent ? 'step' : undefined}
                          aria-label={`${step.title}${isCompleted ? ' (dokončeno)' : isCurrent ? ' (aktuální krok)' : ''}`}
                          title={isClickable ? `Přejít na: ${step.title}` : isFuture ? step.title : undefined}
                          style={{
                            width: isMobile ? 32 : 40,
                            height: isMobile ? 32 : 40,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: isCurrent
                              ? 'var(--forge-accent-primary)'
                              : isReachable
                                ? 'var(--forge-accent-primary)'
                                : 'var(--forge-border-active)',
                            backgroundColor: isCurrent
                              ? 'var(--forge-accent-primary)'
                              : isCompleted
                                ? 'var(--forge-accent-primary)'
                                : 'transparent',
                            color: isCurrent || isCompleted
                              ? 'var(--forge-bg-void)'
                              : 'var(--forge-text-muted)',
                            cursor: isClickable ? 'pointer' : isFuture ? 'not-allowed' : 'default',
                            opacity: isFuture ? 0.5 : 1,
                            padding: 0,
                          }}
                        >
                          {isCompleted && !isCurrent ? (
                            <Icon name="Check" size={isMobile ? 14 : 18} />
                          ) : (
                            <Icon name={step.icon} size={isMobile ? 14 : 18} />
                          )}
                        </button>
                        <div className="mt-2 text-center">
                          <p
                            className="tk-stepper-step-label"
                            style={{
                              fontFamily: 'var(--forge-font-tech)',
                              fontSize: '11px',
                              fontWeight: isCurrent ? 600 : 500,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: isCurrent
                                ? 'var(--forge-text-primary)'
                                : isReachable
                                  ? 'var(--forge-text-secondary, #B0B7C3)'
                                  : 'var(--forge-text-muted)',
                              cursor: isClickable ? 'pointer' : 'default',
                            }}
                            onClick={isClickable ? () => handleStepClick(step.id) : undefined}
                          >
                            {step.title}
                          </p>
                          <p
                            className="text-xs tk-stepper-step-desc"
                            style={{
                              color: 'var(--forge-text-muted)',
                              fontSize: '10px',
                              opacity: isFuture ? 0.5 : 1,
                            }}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className="mx-4 transition-colors tk-stepper-connector"
                          style={{
                            width: isMobile ? '1.5rem' : '4rem',
                            height: 0,
                            borderTop: step.id < currentStep || (isCompleted && step.id < highestStepReached)
                              ? '2px solid var(--forge-accent-primary)'
                              : '2px dashed var(--forge-border-active)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calculation buttons - inline with stepper (hidden on mobile, shown in sticky bar) */}
              {uploadedFiles.length > 0 && selectedFile && (
                <div className="flex flex-col items-end gap-1.5 ml-6 tk-generate-area" data-tour="generate-btn">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <GenerateButton
                        size="compact"
                        label="Spočítat cenu"
                        onClick={handleSliceSelected}
                        loading={selectedFile.status === 'processing'}
                        disabled={!selectedFile || selectedFile.status === 'processing' || sliceAllProcessing}
                      />
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--forge-text-muted)',
                        fontFamily: 'var(--forge-font-tech, monospace)',
                        letterSpacing: '0.03em',
                        opacity: 0.7,
                      }}>
                        {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '\u2318' : 'Ctrl'}+Enter
                      </span>
                    </div>

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
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{ height: '6px', backgroundColor: 'var(--forge-bg-elevated)' }}
                        role="progressbar"
                        aria-valuenow={batchProgress.done}
                        aria-valuemin={0}
                        aria-valuemax={batchProgress.total}
                        aria-label={`Davkove zpracovani: ${batchProgress.done} z ${batchProgress.total}`}
                      >
                        <div
                          className="rounded-full transition-all duration-300"
                          style={{
                            height: '100%',
                            backgroundColor: 'var(--forge-accent-primary)',
                            width: `${(batchProgress.done / batchProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className="whitespace-nowrap"
                        style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}
                      >
                        {batchProgress.done}/{batchProgress.total}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* S02: Checkout step (step 4) — Shopify mode replaces standard checkout */}
          {currentStep === 4 && shopifyConfig ? (
            <div className="page-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setCurrentStep(3)}
                  aria-label="Zpet na krok Kontrola a cena"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--forge-text-secondary)', fontSize: '14px',
                    fontFamily: 'var(--forge-font-body)',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                >
                  <Icon name="ArrowLeft" size={16} />
                  Back
                </button>
              </div>
              <h2 style={{
                fontFamily: 'var(--forge-font-heading)',
                fontSize: '20px', fontWeight: 600,
                color: 'var(--forge-text-primary)', marginBottom: '16px',
              }}>
                Complete on Shopify
              </h2>
              <p style={{
                fontSize: '14px', color: 'var(--forge-text-secondary)', marginBottom: '24px',
              }}>
                Your order will be processed through the Shopify store.
                Payment and shipping are handled by Shopify.
              </p>
              <ShopifyCartButton
                quoteResult={(() => {
                  try {
                    return calculateOrderQuote({
                      uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections,
                      expressConfig, selectedExpressTierId,
                      couponsConfig, appliedCouponCode,
                      shippingConfig, selectedShippingMethodId,
                    });
                  } catch { return null; }
                })()}
                shopifyConfig={shopifyConfig}
                uploadedFiles={uploadedFiles}
                embedded={false}
              />
            </div>
          ) : currentStep === 4 && (
            <CheckoutForm
              uploadedFiles={uploadedFiles}
              printConfigs={printConfigs}
              pricingConfig={pricingConfig}
              feesConfig={feesConfig}
              feeSelections={feeSelections}
              expressConfig={expressConfig}
              selectedExpressTierId={selectedExpressTierId}
              shippingConfig={shippingConfig}
              selectedShippingMethodId={selectedShippingMethodId}
              couponsConfig={couponsConfig}
              appliedCouponCode={appliedCouponCode}
              onComplete={handleCheckoutComplete}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {/* S02: Confirmation step (step 5) */}
          {currentStep === 5 && lastOrderResult && (
            <div className="scale-fade-in"><OrderConfirmation
              order={lastOrderResult}
              onStartNew={handleStartNewOrder}
            /></div>
          )}

          {/* Main grid — visible on steps 1-3 */}
          {currentStep <= 3 && (
          <div key={`step-${currentStep}`} className="grid grid-cols-1 lg:grid-cols-3 gap-8 tk-main-grid page-fade-in" style={isMobile ? { gap: '1rem' } : undefined}>
            <div className="lg:col-span-2 space-y-8" role="region" aria-label="Konfigurace tisku" style={isMobile ? { gap: '1rem' } : undefined}>
              {uploadedFiles.length === 0 && currentStep === 1 && (
                <div data-tour="upload-zone">
                  <FileUploadZone onFilesUploaded={handleFilesUploaded} />
                  {/* Enhanced empty state: sample models */}
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    borderRadius: 'var(--forge-radius-xl)',
                    border: '1px dashed var(--forge-border-default)',
                    background: 'var(--forge-bg-elevated)',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Icon name="Box" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'var(--forge-font-heading)',
                        color: 'var(--forge-text-primary)',
                      }}>
                        Nemáte model? Vyzkoušejte ukázkový
                      </span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--forge-text-muted)',
                      marginBottom: '0.75rem',
                      fontFamily: 'var(--forge-font-body)',
                    }}>
                      Načtěte předpřipravený 3D model a prozkoumejte kalkulačku bez vlastního souboru.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {SAMPLE_MODELS.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleLoadSample(sample)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 0.875rem',
                            borderRadius: 'var(--forge-radius-md)',
                            border: '1px solid var(--forge-border-default)',
                            background: 'var(--forge-bg-surface)',
                            color: 'var(--forge-text-primary)',
                            fontSize: '12px',
                            fontFamily: 'var(--forge-font-tech)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background 0.2s',
                            minHeight: '36px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                            e.currentTarget.style.background = 'var(--forge-bg-elevated)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                            e.currentTarget.style.background = 'var(--forge-bg-surface)';
                          }}
                          aria-label={`Nacist ukazkovy model: ${sample.name} (${sample.description})`}
                        >
                          <Icon name="Box" size={14} style={{ color: 'var(--forge-accent-primary)' }} />
                          {sample.name}
                          <span style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>({sample.description})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <>
                  {/* Keep the left configuration visible even on step 3 (after slicing) */}
                  <div className={selectedFile ? 'block' : 'hidden'} data-tour="print-config">
                    {/* Auto-save indicator + share button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        minHeight: '24px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShareConfigButton
                          getShareableUrl={getShareableUrl}
                          compact={isMobile}
                        />
                        <UndoRedoButtons
                          canUndo={configUndoRedo.canUndo(selectedFileId)}
                          canRedo={configUndoRedo.canRedo(selectedFileId)}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          undoTooltip={configUndoRedo.getUndoDescription(selectedFileId)}
                          redoTooltip={configUndoRedo.getRedoDescription(selectedFileId)}
                        />
                      </div>
                      {lastSaved && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '11px',
                            fontFamily: 'var(--forge-font-mono)',
                            color: 'var(--forge-text-muted)',
                            opacity: 0.7,
                            transition: 'opacity 0.3s ease',
                          }}
                        >
                          <Icon name="Check" size={12} style={{ color: 'var(--forge-success, #10B981)' }} />
                          <span>Automaticky ulozeno</span>
                        </div>
                      )}
                    </div>
                    <PrintConfiguration
                      key={selectedFile ? selectedFile.id : 'empty'}
                      selectedFile={selectedFile}
                      onConfigChange={handleConfigChange}
                      initialConfig={currentConfig}
                      availablePresets={availablePresets}
                      defaultPresetId={defaultPresetId}
                      selectedPresetId={selectedPresetIds[selectedFileId] ?? null}
                      onPresetChange={(presetId) => setSelectedPresetIds(prev => ({ ...prev, [selectedFileId]: presetId }))}
                      presetsLoading={presetsLoading}
                      presetsError={presetsError}
                      onPresetsRetry={loadPresets}
                      pricingConfig={pricingConfig}
                      feesConfig={feesConfig}
                      feeSelections={feeSelections}
                      onFeeSelectionsChange={setFeeSelections}
                      uploadedFiles={uploadedFiles}
                      disabled={uploadedFiles.some(f => f.status === 'processing')}
                      printConfigs={printConfigs}
                      expressConfig={expressConfig}
                      selectedExpressTierId={selectedExpressTierId}
                      onExpressTierChange={setSelectedExpressTierId}
                      couponsConfig={couponsConfig}
                      appliedCouponCode={appliedCouponCode}
                      shippingConfig={shippingConfig}
                      selectedShippingMethodId={selectedShippingMethodId}
                      onShippingMethodChange={setSelectedShippingMethodId}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4" role="region" aria-label="Nahled modelu a cena">
              <ErrorBoundary>
            <div data-tour="model-viewer">
            <ModelViewer
              selectedFile={selectedFile}
              onRemove={handleFileDelete}
              onSurfaceComputed={handleSurfaceComputed}
              onGeometryLoaded={handleGeometryLoaded}
            />
            </div>
              </ErrorBoundary>

              {/* Mesh repair collapsible panel */}
              {selectedFile && modelGeometry && (
                <div
                  data-tour="mesh-repair"
                  style={{
                    borderRadius: 'var(--forge-radius-xl)',
                    border: '1px solid var(--forge-border-default)',
                    background: 'var(--forge-bg-surface)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMeshRepairOpen(prev => !prev)}
                    aria-expanded={meshRepairOpen}
                    aria-controls="mesh-repair-panel"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--forge-text-primary)',
                      fontFamily: 'var(--forge-font-heading)',
                      fontWeight: 600,
                      fontSize: 'var(--forge-text-sm)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="Wrench" size={15} style={{ color: 'var(--forge-accent-primary)' }} />
                      Oprava mesh
                    </span>
                    <Icon
                      name="ChevronDown"
                      size={16}
                      style={{
                        color: 'var(--forge-text-muted)',
                        transition: 'transform 0.2s ease',
                        transform: meshRepairOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  <div
                    id="mesh-repair-panel"
                    style={{
                      maxHeight: meshRepairOpen ? '800px' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}
                  >
                    <div style={{ padding: '0 0.5rem 0.5rem 0.5rem' }}>
                      <MeshRepairPanel
                        geometry={modelGeometry}
                        fileName={selectedFile?.name || 'model.stl'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Model info panel — detailed stats, build plate fit, scale suggestions */}
              {selectedFile && (
                <ModelInfoPanel
                  selectedFile={selectedFile}
                  modelGeometry={modelGeometry}
                />
              )}

              {/* Metrics + price card (right column) */}
              {uploadedFiles.length > 0 && (
                <div data-tour="pricing-results" ref={pricingResultsRef}>
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
                  expressConfig={expressConfig}
                  selectedExpressTierId={selectedExpressTierId}
                  shippingConfig={shippingConfig}
                  selectedShippingMethodId={selectedShippingMethodId}
                  couponsConfig={couponsConfig}
                  appliedCouponCode={appliedCouponCode}
                  onApplyCoupon={setAppliedCouponCode}
                  onRemoveCoupon={() => setAppliedCouponCode('')}
                  onApplyHistoryConfig={handleApplyHistoryConfig}
                  getShareableUrl={getShareableUrl}
                />
                </div>
              )}
              <SortableFileList
                uploadedFiles={uploadedFiles}
                selectedFileId={selectedFileId}
                onSelectFile={setSelectedFileId}
                onRemoveFile={handleFileDelete}
                onReorderFiles={handleReorderFiles}
                onAddModel={handleAddModelClick}
              />
            </div>
          </div>
          )}

          {/* Bottom navigation — hidden on step 5 (confirmation) */}
          {currentStep < 5 && (
            <div
              className="flex items-center justify-between mt-8 pt-6 tk-bottom-nav"
              style={{ borderTop: '1px solid var(--forge-border-default)' }}
            >
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                iconName="ChevronLeft"
                iconPosition="left"
              >
                {currentStep > 1
                  ? `Zpět na: ${steps.find(s => s.id === currentStep - 1)?.title || 'Zpět'}`
                  : 'Zpět'}
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
                ) : currentStep === 3 ? (
                  <Button
                    variant="default"
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceed()}
                    iconName="ShoppingCart"
                    iconPosition="right"
                  >
                    Přejít k objednávce
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating keyboard shortcuts button */}
      <button
        type="button"
        onClick={() => setShortcutsHelpOpen(true)}
        aria-label="Zobrazit kl\u00e1vesov\u00e9 zkratky"
        title="Kl\u00e1vesov\u00e9 zkratky (?)"
        className="tk-floating-shortcuts-btn"
        style={{
          position: 'fixed',
          bottom: isMobile ? '70px' : '20px',
          right: '20px',
          width: isMobile ? '44px' : '36px',
          height: isMobile ? '44px' : '36px',
          borderRadius: '8px',
          border: '1px solid var(--forge-border-default)',
          backgroundColor: 'var(--forge-bg-surface)',
          color: 'var(--forge-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontFamily: 'var(--forge-font-tech, monospace)',
          fontWeight: 600,
          opacity: 0.6,
          transition: 'opacity 0.2s, border-color 0.2s',
          zIndex: 50,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = 'var(--forge-border-active)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.borderColor = 'var(--forge-border-default)';
        }}
      >
        ?
      </button>

      {/* Sticky mobile bottom bar with Generate button */}
      {isMobile && uploadedFiles.length > 0 && selectedFile && currentStep <= 3 && (
        <div className="tk-sticky-bottom">
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
              label="Vše"
              onClick={handleSliceAll}
              loading={sliceAllProcessing && batchProgress.mode === 'all'}
              disabled={sliceAllProcessing || uploadedFiles.some(f => f.status === 'processing')}
            />
          )}
          {currentStep === 3 && (
            <Button
              variant="default"
              onClick={() => setCurrentStep(4)}
              disabled={!canProceed()}
              className="tk-sticky-btn"
              style={{ minHeight: '44px' }}
            >
              <Icon name="ShoppingCart" size={16} />
            </Button>
          )}
        </div>
      )}

      {/* Keyboard shortcuts help overlay */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
        onStartTour={() => {
          setShortcutsHelpOpen(false);
          onboarding.resetTour();
          onboarding.startTour();
        }}
      />

      {/* Onboarding tour */}
      <OnboardingTour
        active={onboarding.active}
        currentStepIndex={onboarding.currentStepIndex}
        currentStep={onboarding.currentStep}
        totalSteps={onboarding.totalSteps}
        doNotShowAgain={onboarding.doNotShowAgain}
        onDoNotShowAgainChange={onboarding.setDoNotShowAgain}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onFinish={onboarding.finishTour}
      />

      {/* Slicing progress toasts */}
      <SlicingProgressContainer
        toasts={slicingToasts.toasts}
        onDismiss={slicingToasts.dismiss}
      />
    </div>
  );
};

export default TestKalkulacka;
