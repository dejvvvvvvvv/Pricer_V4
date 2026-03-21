import { useState, useCallback, useEffect } from 'react';
import { PROTECTED_ELEMENTS, isDeletable, HIDEABLE_ELEMENTS } from '../config/elementRegistry';

/**
 * useElementSelection -- tracks which builder element is selected and/or
 * hovered in the visual preview pane.
 *
 * Enhanced with keyboard navigation:
 *   - Escape: deselect current element
 *   - Delete/Backspace: remove element (if not locked)
 *   - ArrowUp/ArrowDown: navigate between elements
 *
 * @param {object} [options]
 * @param {string[]} [options.elementOrder] - Current element order for keyboard navigation
 * @param {Function} [options.onDeleteElement] - Callback when Delete is pressed on a deletable element
 * @param {Function} [options.onToggleVisibility] - Callback for toggling visibility on non-deletable elements
 *
 * @returns {{
 *   selectedElementId: string | null,
 *   hoveredElementId: string | null,
 *   selectElement: (id: string | null) => void,
 *   hoverElement: (id: string | null) => void,
 *   clearSelection: () => void,
 *   clearHover: () => void,
 *   isSelected: (id: string) => boolean,
 *   isHovered: (id: string) => boolean,
 * }}
 */
export default function useElementSelection(options = {}) {
  const {
    elementOrder = [],
    onDeleteElement,
    onToggleVisibility,
  } = options;

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);

  /**
   * Select an element by its ID, or pass null to clear the selection.
   */
  const selectElement = useCallback((id) => {
    setSelectedElementId(id ?? null);
  }, []);

  /**
   * Mark an element as hovered, or pass null to clear the hover state.
   */
  const hoverElement = useCallback((id) => {
    setHoveredElementId(id ?? null);
  }, []);

  /**
   * Clear the currently selected element.
   */
  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
  }, []);

  /**
   * Clear the currently hovered element.
   */
  const clearHover = useCallback(() => {
    setHoveredElementId(null);
  }, []);

  /**
   * Check whether the given element is currently selected.
   */
  const isSelected = useCallback(
    (id) => id != null && id === selectedElementId,
    [selectedElementId],
  );

  /**
   * Check whether the given element is currently hovered.
   */
  const isHovered = useCallback(
    (id) => id != null && id === hoveredElementId,
    [hoveredElementId],
  );

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts for element selection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore when user is typing in an input / textarea / contenteditable
      const tag = e.target?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }

      // Escape -> deselect
      if (e.key === 'Escape') {
        if (selectedElementId) {
          e.preventDefault();
          setSelectedElementId(null);
        }
        return;
      }

      // Delete / Backspace -> remove element if not protected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();

        if (selectedElementId.startsWith('cb_') && onDeleteElement) {
          // Custom blocks can be fully removed
          onDeleteElement(selectedElementId);
          setSelectedElementId(null);
        } else if (HIDEABLE_ELEMENTS.has(selectedElementId) && onToggleVisibility) {
          // Built-in hideable elements get toggled
          onToggleVisibility(selectedElementId);
          setSelectedElementId(null);
        }
        return;
      }

      // Arrow Up/Down -> navigate between elements
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && elementOrder.length > 0) {
        e.preventDefault();

        if (!selectedElementId) {
          // Nothing selected -> select first or last
          setSelectedElementId(
            e.key === 'ArrowDown' ? elementOrder[0] : elementOrder[elementOrder.length - 1]
          );
          return;
        }

        const currentIndex = elementOrder.indexOf(selectedElementId);
        if (currentIndex === -1) return;

        const nextIndex = e.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, elementOrder.length - 1)
          : Math.max(currentIndex - 1, 0);

        setSelectedElementId(elementOrder[nextIndex]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elementOrder, onDeleteElement, onToggleVisibility]);

  return {
    selectedElementId,
    hoveredElementId,
    selectElement,
    hoverElement,
    clearSelection,
    clearHover,
    isSelected,
    isHovered,
  };
}
