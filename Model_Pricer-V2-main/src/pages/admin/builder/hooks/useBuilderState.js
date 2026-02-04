import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { getWidgets, updateWidget } from '@/utils/adminBrandingWidgetStorage';
import { getDefaultWidgetTheme } from '@/utils/widgetThemeStorage';

import useUndoRedo from './useUndoRedo';
import useElementSelection from './useElementSelection';

/**
 * useBuilderState -- top-level composition hook for the Widget Builder V3.
 *
 * Combines:
 *  - useUndoRedo   (theme history with undo/redo)
 *  - useElementSelection (selected / hovered element tracking)
 *  - local UI state (device mode, active tab, inline text editing)
 *  - widget metadata (name, full widget object)
 *  - persistence   (load from localStorage on mount, save back)
 *  - keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
 *
 * @param {string} widgetId   Internal widget ID (e.g. "w_abc123").
 * @param {string} tenantId   Tenant ID from getTenantId().
 *
 * @returns {{
 *   theme: object,
 *   updateThemeProperty: (key: string, value: any) => void,
 *   undo: () => void,
 *   redo: () => void,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   isDirty: boolean,
 *   resetToOriginal: () => void,
 *   resetToDefaults: () => void,
 *
 *   selectedElementId: string | null,
 *   hoveredElementId: string | null,
 *   selectElement: (id: string | null) => void,
 *   hoverElement: (id: string | null) => void,
 *   clearSelection: () => void,
 *   isSelected: (id: string) => boolean,
 *   isHovered: (id: string) => boolean,
 *
 *   deviceMode: 'mobile' | 'tablet' | 'desktop',
 *   setDeviceMode: (mode: string) => void,
 *
 *   activeTab: 'style' | 'elements' | 'global',
 *   setActiveTab: (tab: string) => void,
 *
 *   editingTextId: string | null,
 *   setEditingTextId: (id: string | null) => void,
 *
 *   widget: object | null,
 *   widgetName: string,
 *   setWidgetName: (name: string) => void,
 *
 *   save: () => void,
 *   saving: boolean,
 *
 *   loading: boolean,
 * }}
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
  // Theme via useUndoRedo.
  // We initialise with defaults; the real value is set once the widget loads.
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

  // Keep a ref to the originally-loaded theme so we can resetToOriginal even
  // after the user has made many changes.
  const loadedThemeRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Element selection
  // ---------------------------------------------------------------------------
  const selection = useElementSelection();

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  /** @type {'mobile' | 'tablet' | 'desktop'} */
  const [deviceMode, setDeviceMode] = useState('desktop');

  /** @type {'style' | 'elements' | 'global'} */
  const [activeTab, setActiveTab] = useState('style');

  /** ID of the text element currently being inline-edited, or null. */
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

    // Merge stored theme with defaults so newly-added keys always exist.
    const resolvedTheme = {
      ...getDefaultWidgetTheme(),
      ...(found.themeConfig || {}),
    };

    setWidget(found);
    setWidgetName(found.name || '');
    loadedThemeRef.current = resolvedTheme;

    // Initialise undoRedo -- reset clears stacks and sets original.
    resetUndoRedo(resolvedTheme);

    setLoading(false);
    // We intentionally only run this on mount (widgetId / tenantId change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, tenantId]);

  // ---------------------------------------------------------------------------
  // updateThemeProperty -- convenience to update a single key.
  // ---------------------------------------------------------------------------
  const updateThemeProperty = useCallback(
    /**
     * @param {string} key   Theme property key (e.g. "buttonPrimaryColor").
     * @param {any}    value New value for the property.
     */
    (key, value) => {
      setThemeState({ ...theme, [key]: value });
    },
    [theme, setThemeState],
  );

  // ---------------------------------------------------------------------------
  // setThemeBulk -- replace entire theme at once (single undo entry).
  // Used by Quick Themes to avoid 56 individual undo records.
  // ---------------------------------------------------------------------------
  const setThemeBulk = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
    },
    [setThemeState],
  );

  // ---------------------------------------------------------------------------
  // updateThemePropertyDebounced -- instant visual update + debounced undo entry.
  // Used by sliders to avoid flooding the undo stack.
  // ---------------------------------------------------------------------------
  const debounceRef = useRef(null);

  const updateThemePropertyDebounced = useCallback(
    (key, value, ms = 300) => {
      // Immediate visual update (no undo record)
      if (undoRedo.setWithoutHistory) {
        undoRedo.setWithoutHistory((prev) => ({ ...prev, [key]: value }));
      }
      // Debounced undo entry
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setThemeState({ ...theme, [key]: value });
      }, ms);
    },
    [theme, setThemeState, undoRedo],
  );

  // ---------------------------------------------------------------------------
  // resetToOriginal -- restore theme to what was loaded from storage.
  // ---------------------------------------------------------------------------
  const resetToOriginal = useCallback(() => {
    if (!loadedThemeRef.current) return;
    resetUndoRedo(loadedThemeRef.current);
  }, [resetUndoRedo]);

  // ---------------------------------------------------------------------------
  // resetToDefaults -- load factory defaults from getDefaultWidgetTheme().
  // This is a forward edit (pushes onto undo stack) so the user can still
  // undo back to their previous state.
  // ---------------------------------------------------------------------------
  const resetToDefaults = useCallback(() => {
    setThemeState(getDefaultWidgetTheme());
  }, [setThemeState]);

  // ---------------------------------------------------------------------------
  // save -- persist theme + name to localStorage via storage helpers.
  // ---------------------------------------------------------------------------
  const save = useCallback(async () => {
    if (!widget || !tenantId) return { ok: false };

    setSaving(true);
    try {
      const updated = updateWidget(tenantId, widget.id, {
        themeConfig: theme,
        name: widgetName,
      });

      // Advance the "original" reference so isDirty resets to false.
      loadedThemeRef.current = theme;
      resetUndoRedo(theme);

      // Keep the local widget object in sync.
      if (updated) {
        setWidget(updated);
      }
      return { ok: true };
    } catch (err) {
      console.error('[useBuilderState] save failed:', err);
      return { ok: false, error: err.message || 'Ulozeni se nezdarilo' };
    } finally {
      setSaving(false);
    }
  }, [widget, tenantId, theme, widgetName, resetUndoRedo]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /**
     * @param {KeyboardEvent} e
     */
    function handleKeyDown(e) {
      // Ignore shortcuts when user is typing in an input / textarea / contenteditable.
      const tag = (e.target && e.target.tagName) || '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target && e.target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+Z  OR  Ctrl+Y  ->  Redo
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

      // Ctrl+Z  ->  Undo
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
    canUndo,
    canRedo,
    isDirty,
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

    // Device preview
    deviceMode,
    setDeviceMode,

    // Tab navigation
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

    // Loading
    loading,
  };
}
