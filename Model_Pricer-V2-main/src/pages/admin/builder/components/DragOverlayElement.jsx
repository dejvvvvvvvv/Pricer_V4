/**
 * DragOverlayElement — ghost preview shown during drag operation.
 *
 * Displays a simplified representation of the dragged element.
 */
import React from 'react';
import { ELEMENT_REGISTRY, isCustomBlock } from '../config/elementRegistry';

export default function DragOverlayElement({ id }) {
  const isCustom = isCustomBlock(id);
  const element = isCustom ? null : ELEMENT_REGISTRY[id];
  const label = element?.label?.cs || id;

  return (
    <div style={overlayStyle}>
      <span style={labelStyle}>{isCustom ? 'Vlastni blok' : label}</span>
    </div>
  );
}

const overlayStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 24px',
  background: 'var(--builder-bg-elevated, #1E2128)',
  border: '2px solid var(--builder-accent-primary, #3B82F6)',
  borderRadius: 'var(--builder-radius-md, 8px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  minWidth: 160,
  opacity: 0.9,
};

const labelStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--builder-text-primary, #F1F5F9)',
};
