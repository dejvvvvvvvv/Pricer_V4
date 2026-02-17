import { useState, useCallback, useRef } from 'react';

/**
 * useDragAndDrop — manages drag-and-drop state for the builder.
 *
 * Provides drag start/end handlers, active item tracking,
 * and integration with the layout state for reordering.
 *
 * @param {object} layoutState - From useLayoutState
 * @returns {object} DnD state and handlers
 */
export default function useDragAndDrop(layoutState) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  // Keep a ref to layoutState to avoid stale closure in handleDragEnd
  const layoutRef = useRef(layoutState);
  layoutRef.current = layoutState;

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event) => {
    setOverId(event.over?.id || null);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const ls = layoutRef.current;
    const oldIndex = ls.elementOrder.indexOf(active.id);
    const newIndex = ls.elementOrder.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    ls.moveElement(active.id, oldIndex, newIndex);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  return {
    activeId,
    overId,
    isDragging: activeId !== null,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
