/**
 * LayersPanel — element tree with drag-and-drop reorder, visibility toggles.
 *
 * Shows all elements from the layout in their current order.
 * Clicking a row selects the element. Eye icon toggles visibility.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Layout, Type, ListOrdered, Upload, Box, Settings,
  Receipt, DollarSign, MousePointerClick, PanelBottom,
  Eye, EyeOff, GripVertical, Trash2, Tag,
} from 'lucide-react';
import {
  ELEMENT_REGISTRY, HIDEABLE_ELEMENTS, isCustomBlock,
} from '../config/elementRegistry';

const ICON_MAP = {
  Layout, Type, ListOrdered, Upload, Box, Settings,
  Receipt, DollarSign, MousePointerClick, PanelBottom,
};

function SortableLayerRow({
  elementId,
  isSelected,
  isVisible,
  isHideable,
  isDeletable,
  onSelect,
  onToggleVisibility,
  onDelete,
}) {
  const isCustom = isCustomBlock(elementId);
  const element = isCustom ? null : ELEMENT_REGISTRY[elementId];
  const label = element?.label?.cs || (isCustom ? 'Vlastni blok' : elementId);
  const iconName = element?.icon;
  const IconComponent = iconName ? (ICON_MAP[iconName] || Box) : Tag;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: elementId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isVisible ? 1 : 0.4,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...rowStyle, ...style, ...(isSelected ? rowActiveStyle : {}) }}
      {...attributes}
    >
      {/* Drag handle */}
      <div {...listeners} style={handleStyle}>
        <GripVertical size={12} color="var(--builder-text-muted)" />
      </div>

      {/* Click to select */}
      <button
        type="button"
        onClick={() => onSelect(elementId)}
        style={labelBtnStyle}
      >
        <IconComponent
          size={14}
          color={isSelected ? 'var(--builder-text-primary)' : 'var(--builder-text-secondary)'}
        />
        <span style={{
          ...labelTextStyle,
          color: isSelected ? 'var(--builder-text-primary)' : 'var(--builder-text-secondary)',
        }}>
          {label}
        </span>
      </button>

      {/* Visibility toggle */}
      {isHideable && (
        <button
          type="button"
          onClick={() => onToggleVisibility(elementId)}
          style={iconBtnStyle}
          title={isVisible ? 'Skryt' : 'Zobrazit'}
          aria-label={isVisible ? 'Skryt element' : 'Zobrazit element'}
        >
          {isVisible
            ? <Eye size={13} color="var(--builder-text-muted)" />
            : <EyeOff size={13} color="var(--builder-text-muted)" />
          }
        </button>
      )}

      {/* Delete (only custom blocks) */}
      {isDeletable && (
        <button
          type="button"
          onClick={() => onDelete(elementId)}
          style={iconBtnStyle}
          title="Smazat"
          aria-label="Smazat blok"
        >
          <Trash2 size={13} color="var(--builder-accent-error)" />
        </button>
      )}
    </div>
  );
}

export default function LayersPanel({
  elementOrder,
  selectedElementId,
  hiddenElements,
  onSelectElement,
  onToggleVisibility,
  onDeleteBlock,
}) {
  const hiddenSet = new Set(hiddenElements || []);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>VRSTVY</div>
      <div style={listStyle}>
        {elementOrder.map((elementId) => {
          const isCustom = isCustomBlock(elementId);
          return (
            <SortableLayerRow
              key={elementId}
              elementId={elementId}
              isSelected={selectedElementId === elementId}
              isVisible={!hiddenSet.has(elementId)}
              isHideable={HIDEABLE_ELEMENTS.has(elementId)}
              isDeletable={isCustom}
              onSelect={onSelectElement}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDeleteBlock}
            />
          );
        })}
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const headerStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--builder-text-muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  paddingBottom: 8,
  marginBottom: 4,
  borderBottom: '1px solid var(--builder-border-subtle)',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 6px',
  borderRadius: 'var(--builder-radius-sm, 6px)',
  transition: 'background var(--builder-transition-fast, 150ms ease)',
};

const rowActiveStyle = {
  backgroundColor: 'var(--builder-hover-bg, #262A33)',
};

const handleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  cursor: 'grab',
  flexShrink: 0,
};

const labelBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: 1,
  background: 'none',
  border: 'none',
  padding: '2px 4px',
  cursor: 'pointer',
  minWidth: 0,
  textAlign: 'left',
};

const labelTextStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const iconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 3,
  flexShrink: 0,
  transition: 'background var(--builder-transition-fast, 150ms ease)',
};
