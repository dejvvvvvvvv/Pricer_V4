/**
 * DraggableElement — wrapper that makes an element sortable via @dnd-kit.
 *
 * Renders a drag handle and wraps children with sortable transform/transition.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export default function DraggableElement({
  id,
  children,
  disabled = false,
  showHandle = true,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {showHandle && !disabled && (
        <div
          {...listeners}
          style={handleStyle}
          title="Pretahnete pro zmenu poradi"
          aria-label="Drag handle"
        >
          <GripVertical size={14} color="var(--builder-text-muted)" />
        </div>
      )}
      {children}
    </div>
  );
}

const handleStyle = {
  position: 'absolute',
  top: 4,
  left: -20,
  width: 18,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  zIndex: 5,
  borderRadius: 3,
  opacity: 0,
  transition: 'opacity 150ms ease',
};
