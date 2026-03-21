import { useState, useCallback, useRef } from 'react';

/**
 * useDragAndDrop -- HTML5 Drag and Drop for the VvvebJs-style builder.
 *
 * Two drag modes:
 *   1. "palette"  -- drag a new block type from the left panel onto the canvas
 *   2. "reorder"  -- drag an existing element within the canvas to reorder
 *
 * No external library -- uses native HTML5 Drag and Drop API.
 *
 * @param {object} layoutState - From useLayoutState (provides moveElement, addCustomBlock, elementOrder)
 * @returns {object} DnD state and handlers
 */
export default function useDragAndDrop(layoutState) {
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null); // 'palette' | 'reorder'
  const [overId, setOverId] = useState(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState(-1);

  // Keep a ref to layoutState to avoid stale closure
  const layoutRef = useRef(layoutState);
  layoutRef.current = layoutState;

  // -----------------------------------------------------------------------
  // Palette drag (from left panel block library)
  // -----------------------------------------------------------------------

  /**
   * Call this to start dragging a block type from the palette.
   * Sets up the dataTransfer on the native drag event.
   *
   * @param {DragEvent} e
   * @param {string} blockType - The block type ID (e.g. 'cb_text', 'cb_image')
   * @param {object} blockData - Full block definition to add
   */
  const handlePaletteDragStart = useCallback((e, blockType, blockData) => {
    setActiveId(blockType);
    setActiveType('palette');

    // Store block data in dataTransfer for the drop handler
    e.dataTransfer.setData('application/builder-block', JSON.stringify(blockData));
    e.dataTransfer.effectAllowed = 'copy';

    // Ghost image
    if (e.target && e.dataTransfer.setDragImage) {
      const ghost = e.target.cloneNode(true);
      ghost.style.opacity = '0.7';
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      requestAnimationFrame(() => document.body.removeChild(ghost));
    }
  }, []);

  // -----------------------------------------------------------------------
  // Canvas reorder drag (existing elements)
  // -----------------------------------------------------------------------

  /**
   * Call this on dragStart for canvas elements.
   *
   * @param {DragEvent} e
   * @param {string} elementId
   */
  const handleCanvasDragStart = useCallback((e, elementId) => {
    setActiveId(elementId);
    setActiveType('reorder');
    e.dataTransfer.setData('text/plain', elementId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // -----------------------------------------------------------------------
  // Canvas drop zone handlers
  // -----------------------------------------------------------------------

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = activeType === 'palette' ? 'copy' : 'move';

    // Calculate drop position based on mouse Y relative to elements
    const canvas = e.currentTarget;
    if (!canvas) return;

    const elements = canvas.querySelectorAll('[data-element-id]');
    let closestIndex = -1;
    let closestDistance = Infinity;

    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const distance = Math.abs(e.clientY - midY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
        // If mouse is below midpoint, insert after this element
        if (e.clientY > midY) {
          closestIndex = idx + 1;
        }
      }
    });

    setDropIndicatorIndex(closestIndex);
  }, [activeType]);

  const handleCanvasDragEnter = useCallback((e, elementId) => {
    e.preventDefault();
    setOverId(elementId);
  }, []);

  const handleCanvasDragLeave = useCallback((e) => {
    // Only clear if we actually left the canvas (not just entered a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOverId(null);
      setDropIndicatorIndex(-1);
    }
  }, []);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const ls = layoutRef.current;

    if (activeType === 'palette') {
      // Add new block from palette
      const blockDataStr = e.dataTransfer.getData('application/builder-block');
      if (blockDataStr) {
        try {
          const blockData = JSON.parse(blockDataStr);
          const position = dropIndicatorIndex >= 0
            ? dropIndicatorIndex
            : ls.elementOrder.length;
          ls.addCustomBlock({ ...blockData, position });
        } catch {
          // Invalid data, ignore
        }
      }
    } else if (activeType === 'reorder' && activeId) {
      // Reorder existing element
      const oldIndex = ls.elementOrder.indexOf(activeId);
      if (oldIndex !== -1 && dropIndicatorIndex >= 0) {
        const adjustedIndex = dropIndicatorIndex > oldIndex
          ? dropIndicatorIndex - 1
          : dropIndicatorIndex;
        if (adjustedIndex !== oldIndex) {
          ls.moveElement(activeId, oldIndex, adjustedIndex);
        }
      }
    }

    // Reset
    setActiveId(null);
    setActiveType(null);
    setOverId(null);
    setDropIndicatorIndex(-1);
  }, [activeId, activeType, dropIndicatorIndex]);

  const handleDragEnd = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    setOverId(null);
    setDropIndicatorIndex(-1);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    setOverId(null);
    setDropIndicatorIndex(-1);
  }, []);

  return {
    // State
    activeId,
    activeType,
    overId,
    dropIndicatorIndex,
    isDragging: activeId !== null,
    isPaletteDrag: activeType === 'palette',

    // Palette handlers
    handlePaletteDragStart,

    // Canvas element handlers
    handleCanvasDragStart,

    // Canvas drop zone handlers
    handleCanvasDragOver,
    handleCanvasDragEnter,
    handleCanvasDragLeave,
    handleCanvasDrop,

    // Common
    handleDragEnd,
    handleDragCancel,
  };
}
