/**
 * ElementToolbar — floating toolbar above the selected element in the canvas.
 *
 * Shows actions: move up, move down, duplicate (future), delete.
 * Position is calculated from the element's bounding rect.
 */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, GripVertical } from 'lucide-react';
import { ELEMENT_REGISTRY, isDeletable, HIDEABLE_ELEMENTS } from '../config/elementRegistry';

export default function ElementToolbar({
  selectedElementId,
  elementOrder,
  onMoveUp,
  onMoveDown,
  onDelete,
  canvasRef,
}) {
  const [position, setPosition] = useState(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (!selectedElementId || !canvasRef?.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const el = canvasRef.current.querySelector(
        `[data-element-id="${selectedElementId}"]`
      );
      if (!el) {
        setPosition(null);
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      setPosition({
        top: elRect.top - canvasRect.top - 36,
        left: elRect.left - canvasRect.left + elRect.width / 2,
      });
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, [selectedElementId, canvasRef]);

  if (!position || !selectedElementId) return null;

  const element = ELEMENT_REGISTRY[selectedElementId];
  const label = element?.label?.cs || selectedElementId;
  const canDelete = isDeletable(selectedElementId) || HIDEABLE_ELEMENTS.has(selectedElementId);
  const currentIndex = elementOrder.indexOf(selectedElementId);
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < elementOrder.length - 1;

  return (
    <div
      ref={toolbarRef}
      style={{
        ...toolbarStyle,
        top: Math.max(0, position.top),
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <span style={labelStyle}>{label}</span>

      <span style={dividerStyle} />

      <button
        onClick={onMoveUp}
        disabled={!canMoveUp}
        style={{ ...btnStyle, ...(canMoveUp ? {} : disabledStyle) }}
        title="Posunout nahoru"
        aria-label="Posunout nahoru"
      >
        <ChevronUp size={14} />
      </button>

      <button
        onClick={onMoveDown}
        disabled={!canMoveDown}
        style={{ ...btnStyle, ...(canMoveDown ? {} : disabledStyle) }}
        title="Posunout dolu"
        aria-label="Posunout dolu"
      >
        <ChevronDown size={14} />
      </button>

      {canDelete && (
        <>
          <span style={dividerStyle} />
          <button
            onClick={onDelete}
            style={{ ...btnStyle, color: 'var(--builder-accent-error, #EF4444)' }}
            title="Skryt / Smazat"
            aria-label="Smazat element"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

const toolbarStyle = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '4px 8px',
  background: 'var(--builder-bg-topbar, #12141A)',
  border: '1px solid var(--builder-border-default, #2E3340)',
  borderRadius: 'var(--builder-radius-md, 8px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  zIndex: 50,
  pointerEvents: 'auto',
};

const labelStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--builder-text-secondary)',
  whiteSpace: 'nowrap',
  padding: '0 4px',
};

const dividerStyle = {
  width: 1,
  height: 16,
  background: 'var(--builder-border-default)',
  flexShrink: 0,
  margin: '0 2px',
};

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--builder-text-secondary)',
  borderRadius: 4,
  transition: 'background 150ms ease',
};

const disabledStyle = {
  opacity: 0.3,
  cursor: 'not-allowed',
};
