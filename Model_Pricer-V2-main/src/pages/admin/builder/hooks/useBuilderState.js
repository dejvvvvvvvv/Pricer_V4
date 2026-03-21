import { useState, useEffect, useCallback, useRef } from 'react';
import { debug } from '@/lib/debug';

import { getWidgets, updateWidget } from '@/utils/adminBrandingWidgetStorage';
import { getDefaultWidgetTheme } from '@/utils/widgetThemeStorage';

import useUndoRedo from './useUndoRedo';
import useElementSelection from './useElementSelection';
import useLayoutState from './useLayoutState';

/**
 * useBuilderState -- top-level composition hook for the Widget Builder (VvvebJs edition).
 *
 * Combines:
 *  - useUndoRedo       (theme history with undo/redo)
 *  - useElementSelection (selected / hovered element, keyboard nav)
 *  - useLayoutState    (element ordering, visibility, custom blocks, presets)
 *  - local UI state    (device mode, panel tabs, inline text editing, zoom, panels)
 *  - widget metadata   (name, full widget object)
 *  - persistence       (load from localStorage on mount, auto-save with debounce)
 *  - keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+S / Escape / Delete / Arrow keys)
 *  - import/export     (layout as JSON)
 *
 * @param {string} widgetId   Internal widget ID (e.g. "w_abc123").
 * @param {string} tenantId   Tenant ID from getTenantId().
 */
export default function useBuilderState(widgetId, tenantId) {
  // ---------------------------------------------------------------------------
  // Loading / saving flags
  // ---------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Widget metadata (full object + editable name)
  // ---------------------------------------------------------------------------
  const [widget, setWidget] = useState(null);
  const [widgetName, setWidgetName] = useState('');

  // ---------------------------------------------------------------------------
  // Theme via useUndoRedo
  // ---------------------------------------------------------------------------
  const undoRedo = useUndoRedo(getDefaultWidgetTheme());
  const {
    state: theme,
    setState: setThemeState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetUndoRedo,
    isDirty,
  } = undoRedo;

  // Keep a ref to the originally-loaded theme for resetToOriginal
  const loadedThemeRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Layout state (element ordering, visibility, custom blocks, presets)
  // ---------------------------------------------------------------------------
  const layoutState = useLayoutState(null);

  // ---------------------------------------------------------------------------
  // Element selection with keyboard integration
  // ---------------------------------------------------------------------------
  const selection = useElementSelection({
    elementOrder: layoutState.elementOrder,
    onDeleteElement: (id) => {
      if (id?.startsWith('cb_')) {
        layoutState.removeCustomBlock(id);
      }
    },
    onToggleVisibility: layoutState.toggleElementVisibility,
  });

  // ---------------------------------------------------------------------------
  // UI state: Device mode
  // ---------------------------------------------------------------------------
  const [deviceMode, setDeviceMode] = useState('desktop');

  // ---------------------------------------------------------------------------
  // UI state: Panel tabs
  // ---------------------------------------------------------------------------
  const [leftPanelTab, setLeftPanelTab] = useState('components');
  const [rightPanelTab, setRightPanelTab] = useState('content');

  // ---------------------------------------------------------------------------
  // UI state: Panel visibility & widths
  // ---------------------------------------------------------------------------
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);

  // ---------------------------------------------------------------------------
  // UI state: Step tabs (which calculator step is being edited 1-5)
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);

  // ---------------------------------------------------------------------------
  // UI state: Canvas zoom
  // ---------------------------------------------------------------------------
  const [zoom, setZoom] = useState(100);

  // ---------------------------------------------------------------------------
  // Legacy compat: activeTab (maps to leftPanelTab)
  // ---------------------------------------------------------------------------
  const activeTab = leftPanelTab === 'components' ? 'style'
    : leftPanelTab === 'blocks' ? 'blocks'
    : leftPanelTab === 'layers' ? 'layers'
    : 'global';

  const setActiveTab = useCallback((tab) => {
    const mapping = {
      style: 'components',
      blocks: 'blocks',
      layers: 'layers',
      global: 'components',
    };
    setLeftPanelTab(mapping[tab] || 'components');
  }, []);

  // ---------------------------------------------------------------------------
  // Text editing
  // ---------------------------------------------------------------------------
  const [editingTextId, setEditingTextId] = useState(null);

  // ---------------------------------------------------------------------------
  // Load widget on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!widgetId || !tenantId) {
      setLoading(false);
      return;
    }

    const widgets = getWidgets(tenantId);
    const found = widgets.find(
      (w) => w.id === widgetId || w.publicId === widgetId,
    );

    if (!found) {
      setLoading(false);
      return;
    }

    // Merge stored theme with defaults so newly-added keys always exist
    const resolvedTheme = {
      ...getDefaultWidgetTheme(),
      ...(found.themeConfig || {}),
    };

    setWidget(found);
    setWidgetName(found.name || '');
    loadedThemeRef.current = resolvedTheme;

    // Initialise undoRedo -- reset clears stacks and sets original
    resetUndoRedo(resolvedTheme);

    // Initialise layout state from saved config (if any)
    if (found.layoutConfig) {
      layoutState.resetLayout(found.layoutConfig);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, tenantId]);

  // ---------------------------------------------------------------------------
  // updateThemeProperty -- convenience to update a single key
  // ---------------------------------------------------------------------------
  const updateThemeProperty = useCallback(
    (key, value) => {
      setThemeState({ ...theme, [key]: value });
    },
    [theme, setThemeState],
  );

  // ---------------------------------------------------------------------------
  // setThemeBulk -- replace entire theme at once (single undo entry)
  // ---------------------------------------------------------------------------
  const setThemeBulk = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
    },
    [setThemeState],
  );

  // ---------------------------------------------------------------------------
  // updateThemePropertyDebounced -- instant visual + debounced undo entry
  // ---------------------------------------------------------------------------
  const debounceRef = useRef(null);

  const updateThemePropertyDebounced = useCallback(
    (key, value, ms = 300) => {
      if (undoRedo.setWithoutHistory) {
        undoRedo.setWithoutHistory((prev) => ({ ...prev, [key]: value }));
      }
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setThemeState({ ...theme, [key]: value });
      }, ms);
    },
    [theme, setThemeState, undoRedo],
  );

  // ---------------------------------------------------------------------------
  // resetToOriginal -- restore theme to what was loaded from storage
  // ---------------------------------------------------------------------------
  const resetToOriginal = useCallback(() => {
    if (!loadedThemeRef.current) return;
    resetUndoRedo(loadedThemeRef.current);
  }, [resetUndoRedo]);

  // ---------------------------------------------------------------------------
  // resetToDefaults -- load factory defaults
  // ---------------------------------------------------------------------------
  const resetToDefaults = useCallback(() => {
    setThemeState(getDefaultWidgetTheme());
  }, [setThemeState]);

  // ---------------------------------------------------------------------------
  // save -- persist theme + name to localStorage
  // ---------------------------------------------------------------------------
  const save = useCallback(async () => {
    if (!widget || !tenantId) return { ok: false };

    setSaving(true);
    try {
      const updated = updateWidget(tenantId, widget.id, {
        themeConfig: theme,
        layoutConfig: layoutState.layout,
        name: widgetName,
      });

      loadedThemeRef.current = theme;
      resetUndoRedo(theme);
      layoutState.resetLayout(layoutState.layout);

      if (updated) {
        setWidget(updated);
      }
      return { ok: true };
    } catch (err) {
      debug('[useBuilderState] save failed:', err);
      return { ok: false, error: err.message || 'Ulozeni se nezdarilo' };
    } finally {
      setSaving(false);
    }
  }, [widget, tenantId, theme, widgetName, resetUndoRedo, layoutState]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = (e.target && e.target.tagName) || '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target && e.target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+Z OR Ctrl+Y -> Redo
      if (isCtrlOrMeta && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }
      if (isCtrlOrMeta && !e.shiftKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }

      // Ctrl+Z -> Undo
      if (isCtrlOrMeta && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        e.stopPropagation();
        undo();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [undo, redo]);

  // ---------------------------------------------------------------------------
  // Combined isDirty (theme OR layout changed)
  // ---------------------------------------------------------------------------
  const combinedIsDirty = isDirty || layoutState.isLayoutDirty;

  // ---------------------------------------------------------------------------
  // Auto-save: debounced persistence on every change (2s debounce)
  // ---------------------------------------------------------------------------
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const autoSaveTimerRef = useRef(null);
  const autoSaveSavedTimerRef = useRef(null);
  const savedSnapshotRef = useRef(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (loading || !widget || !tenantId) return;
    if (isSavingRef.current) return;

    const snapshot = JSON.stringify({
      t: theme,
      n: widgetName,
      l: layoutState.layout,
    });

    // First render after load -- initialize snapshot, skip save
    if (savedSnapshotRef.current === null) {
      savedSnapshotRef.current = snapshot;
      return;
    }

    // Nothing changed since last save
    if (snapshot === savedSnapshotRef.current) return;

    clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      isSavingRef.current = true;
      setAutoSaveStatus('saving');

      setTimeout(() => {
        try {
          const updated = updateWidget(tenantId, widget.id, {
            themeConfig: theme,
            layoutConfig: layoutState.layout,
            name: widgetName,
          });
          if (updated) setWidget(updated);
          savedSnapshotRef.current = snapshot;

          clearTimeout(autoSaveSavedTimerRef.current);
          setAutoSaveStatus('saved');
          autoSaveSavedTimerRef.current = setTimeout(
            () => setAutoSaveStatus('idle'),
            2000,
          );
        } catch (err) {
          debug('[useBuilderState] auto-save failed:', err);
          setAutoSaveStatus('idle');
        } finally {
          isSavingRef.current = false;
        }
      }, 50);
    }, 2000);

    return () => clearTimeout(autoSaveTimerRef.current);
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(autoSaveTimerRef.current);
      clearTimeout(autoSaveSavedTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Ctrl+S -- force immediate save (bypass debounce)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleCtrlS(e) {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        clearTimeout(autoSaveTimerRef.current);
        if (!widget || !tenantId) return;

        isSavingRef.current = true;
        setAutoSaveStatus('saving');
        setTimeout(() => {
          try {
            const snapshot = JSON.stringify({
              t: theme,
              n: widgetName,
              l: layoutState.layout,
            });
            const updated = updateWidget(tenantId, widget.id, {
              themeConfig: theme,
              layoutConfig: layoutState.layout,
              name: widgetName,
            });
            if (updated) setWidget(updated);
            savedSnapshotRef.current = snapshot;

            clearTimeout(autoSaveSavedTimerRef.current);
            setAutoSaveStatus('saved');
            autoSaveSavedTimerRef.current = setTimeout(
              () => setAutoSaveStatus('idle'),
              2000,
            );
          } catch (err) {
            debug('[useBuilderState] manual save failed:', err);
            setAutoSaveStatus('idle');
          } finally {
            isSavingRef.current = false;
          }
        }, 50);
      }
    }

    window.addEventListener('keydown', handleCtrlS, true);
    return () => window.removeEventListener('keydown', handleCtrlS, true);
  }, [widget, tenantId, theme, widgetName, layoutState.layout]);

  // ---------------------------------------------------------------------------
  // Import/export layout as JSON
  // ---------------------------------------------------------------------------
  const exportLayoutJSON = useCallback(() => {
    return JSON.stringify({
      themeConfig: theme,
      layoutConfig: layoutState.layout,
      widgetName,
      exportedAt: new Date().toISOString(),
      version: 2,
    }, null, 2);
  }, [theme, layoutState.layout, widgetName]);

  const importLayoutJSON = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.themeConfig) {
        const merged = { ...getDefaultWidgetTheme(), ...data.themeConfig };
        setThemeState(merged);
      }
      if (data.layoutConfig) {
        layoutState.resetLayout(data.layoutConfig);
      }
      if (data.widgetName) {
        setWidgetName(data.widgetName);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [setThemeState, layoutState]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    // Theme (useUndoRedo)
    theme,
    updateThemeProperty,
    updateThemePropertyDebounced,
    setThemeBulk,
    undo,
    redo,
    canUndo: canUndo || layoutState.canUndoLayout,
    canRedo: canRedo || layoutState.canRedoLayout,
    isDirty: combinedIsDirty,
    resetToOriginal,
    resetToDefaults,

    // Selection (useElementSelection)
    selectedElementId: selection.selectedElementId,
    hoveredElementId: selection.hoveredElementId,
    selectElement: selection.selectElement,
    hoverElement: selection.hoverElement,
    clearSelection: selection.clearSelection,
    isSelected: selection.isSelected,
    isHovered: selection.isHovered,

    // Layout (useLayoutState)
    layout: layoutState,

    // Device preview
    deviceMode,
    setDeviceMode,

    // Step tabs
    currentStep,
    setCurrentStep,

    // Panel tabs
    leftPanelTab,
    setLeftPanelTab,
    rightPanelTab,
    setRightPanelTab,

    // Panel visibility & widths
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    leftPanelWidth,
    setLeftPanelWidth,
    rightPanelWidth,
    setRightPanelWidth,

    // Canvas zoom
    zoom,
    setZoom,

    // Legacy tab compat
    activeTab,
    setActiveTab,

    // Text editing
    editingTextId,
    setEditingTextId,

    // Widget metadata
    widget,
    widgetName,
    setWidgetName,

    // Persistence
    save,
    saving,
    autoSaveStatus,

    // Import/export
    exportLayoutJSON,
    importLayoutJSON,

    // Loading
    loading,
  };
}
