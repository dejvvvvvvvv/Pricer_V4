import { useState, useCallback } from 'react';

/**
 * useElementSelection -- tracks which builder element is selected and/or
 * hovered in the visual preview pane.
 *
 * Both values are plain string IDs (or null when nothing is active).
 * The hook is intentionally simple -- it exists as a standalone unit so the
 * selection concern is isolated and easily testable.
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
export default function useElementSelection() {
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);

  /**
   * Select an element by its ID, or pass null to clear the selection.
   * @param {string | null} id
   */
  const selectElement = useCallback((id) => {
    setSelectedElementId(id ?? null);
  }, []);

  /**
   * Mark an element as hovered, or pass null to clear the hover state.
   * @param {string | null} id
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
   * @param {string} id
   * @returns {boolean}
   */
  const isSelected = useCallback(
    (id) => id != null && id === selectedElementId,
    [selectedElementId],
  );

  /**
   * Check whether the given element is currently hovered.
   * @param {string} id
   * @returns {boolean}
   */
  const isHovered = useCallback(
    (id) => id != null && id === hoveredElementId,
    [hoveredElementId],
  );

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
