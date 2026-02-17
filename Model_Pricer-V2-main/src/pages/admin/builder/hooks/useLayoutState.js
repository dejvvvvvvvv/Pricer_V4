import { useState, useCallback, useRef } from 'react';
import { DEFAULT_LAYOUT_ORDER, HIDEABLE_ELEMENTS, isCustomBlock } from '../config/elementRegistry';
import { getDefaultLayoutConfig, getPresetLayout } from '../config/presetLayouts';

/**
 * useLayoutState — manages the widget layout configuration.
 *
 * Tracks element ordering, visibility, custom blocks, size overrides,
 * and preset application. Provides its own undo/redo stack (separate
 * from the theme undo/redo).
 *
 * @param {object|null} initialLayout - Saved layout config, or null for defaults
 * @returns {object} Layout state and mutation functions
 */
export default function useLayoutState(initialLayout) {
  const defaultLayout = getDefaultLayoutConfig();
  const resolved = initialLayout && initialLayout.elementOrder
    ? { ...defaultLayout, ...initialLayout }
    : defaultLayout;

  const [layout, setLayout] = useState(resolved);
  const originalRef = useRef(resolved);

  // Simple undo stack (capped at 30)
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const [, bump] = useState(0);

  // pushState with functional updater to avoid stale closures
  const pushLayout = useCallback((updater) => {
    setLayout((prev) => {
      pastRef.current = [...pastRef.current, prev].slice(-30);
      futureRef.current = [];
      return typeof updater === 'function' ? updater(prev) : updater;
    });
    bump((n) => n + 1);
  }, []);

  // --- Element ordering ---
  const moveElement = useCallback((elementId, fromIndex, toIndex) => {
    pushLayout((prev) => {
      const order = [...prev.elementOrder];
      const [removed] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, removed);
      return { ...prev, elementOrder: order, activePresetId: null };
    });
  }, [pushLayout]);

  // --- Visibility ---
  const toggleElementVisibility = useCallback((elementId) => {
    if (!HIDEABLE_ELEMENTS.has(elementId)) return;

    pushLayout((prev) => {
      const hidden = new Set(prev.hiddenElements || []);
      if (hidden.has(elementId)) {
        hidden.delete(elementId);
      } else {
        hidden.add(elementId);
      }
      return { ...prev, hiddenElements: [...hidden], activePresetId: null };
    });
  }, [pushLayout]);

  const isElementVisible = useCallback((elementId) => {
    const hidden = layout.hiddenElements || [];
    return !hidden.includes(elementId);
  }, [layout]);

  // --- Custom blocks ---
  const addCustomBlock = useCallback((block) => {
    pushLayout((prev) => {
      const order = [...prev.elementOrder];
      const pos = block.position != null ? block.position : order.length;
      order.splice(pos, 0, block.id);
      return {
        ...prev,
        elementOrder: order,
        customBlocks: [...(prev.customBlocks || []), block],
        activePresetId: null,
      };
    });
  }, [pushLayout]);

  const removeCustomBlock = useCallback((blockId) => {
    if (!isCustomBlock(blockId)) return;

    pushLayout((prev) => ({
      ...prev,
      elementOrder: prev.elementOrder.filter((id) => id !== blockId),
      customBlocks: (prev.customBlocks || []).filter((b) => b.id !== blockId),
      activePresetId: null,
    }));
  }, [pushLayout]);

  const updateCustomBlock = useCallback((blockId, propsPatch) => {
    pushLayout((prev) => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).map((b) =>
        b.id === blockId ? { ...b, props: { ...b.props, ...propsPatch } } : b
      ),
      activePresetId: null,
    }));
  }, [pushLayout]);

  // --- Size overrides ---
  const setSizeOverride = useCallback((elementId, dimension, value) => {
    pushLayout((prev) => ({
      ...prev,
      sizeOverrides: {
        ...(prev.sizeOverrides || {}),
        [elementId]: {
          ...((prev.sizeOverrides || {})[elementId] || {}),
          [dimension]: value,
        },
      },
      activePresetId: null,
    }));
  }, [pushLayout]);

  // --- Preset application ---
  const applyPreset = useCallback((presetId) => {
    const preset = getPresetLayout(presetId);
    if (!preset) return;

    pushLayout((prev) => ({
      ...prev,
      elementOrder: [...preset.layout.elementOrder],
      hiddenElements: [...preset.layout.hiddenElements],
      customBlocks: [],
      sizeOverrides: { ...(preset.layout.sizeOverrides || {}) },
      activePresetId: presetId,
    }));
  }, [pushLayout]);

  // --- Undo / Redo ---
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    setLayout((prev) => {
      const past = [...pastRef.current];
      const previous = past.pop();
      pastRef.current = past;
      futureRef.current = [prev, ...futureRef.current];
      return previous;
    });
    bump((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setLayout((prev) => {
      const future = [...futureRef.current];
      const next = future.shift();
      futureRef.current = future;
      pastRef.current = [...pastRef.current, prev];
      return next;
    });
    bump((n) => n + 1);
  }, []);

  const canUndoLayout = pastRef.current.length > 0;
  const canRedoLayout = futureRef.current.length > 0;
  const isLayoutDirty = JSON.stringify(layout) !== JSON.stringify(originalRef.current);

  // --- Reset ---
  const resetLayout = useCallback((newLayout) => {
    const resolved = newLayout || getDefaultLayoutConfig();
    pastRef.current = [];
    futureRef.current = [];
    originalRef.current = resolved;
    setLayout(resolved);
    bump((n) => n + 1);
  }, []);

  return {
    layout,

    // Element ordering
    elementOrder: layout.elementOrder || DEFAULT_LAYOUT_ORDER,
    moveElement,

    // Visibility
    hiddenElements: layout.hiddenElements || [],
    toggleElementVisibility,
    isElementVisible,

    // Custom blocks
    customBlocks: layout.customBlocks || [],
    addCustomBlock,
    removeCustomBlock,
    updateCustomBlock,

    // Size overrides
    sizeOverrides: layout.sizeOverrides || {},
    setSizeOverride,

    // Presets
    activePresetId: layout.activePresetId || null,
    applyPreset,

    // Undo/redo
    canUndoLayout,
    canRedoLayout,
    undoLayout: undo,
    redoLayout: redo,

    // Dirty
    isLayoutDirty,
    resetLayout,
  };
}
