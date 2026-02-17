/**
 * BlockLibrary — palette of custom blocks that can be added to the layout.
 *
 * Displays block types grouped by category. Click to add at the end
 * of the current layout.
 */
import React from 'react';
import {
  Type, Image, Minus, MoveVertical, AlertCircle, Tag,
} from 'lucide-react';
import {
  BLOCK_TYPES, BLOCK_TYPE_ORDER, BLOCK_CATEGORIES, createCustomBlock,
} from '../config/blockLibrary';

const ICON_MAP = {
  Type, Image, Minus, MoveVertical, AlertCircle, Tag,
};

export default function BlockLibrary({ elementOrder, onAddBlock }) {
  const handleAddBlock = (blockType) => {
    const position = elementOrder.length;
    const block = createCustomBlock(blockType, position);
    if (block) {
      onAddBlock(block);
    }
  };

  // Group blocks by category
  const categories = {};
  for (const typeId of BLOCK_TYPE_ORDER) {
    const def = BLOCK_TYPES[typeId];
    if (!def) continue;
    const cat = def.category || 'other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(def);
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>BLOKY</div>
      <div style={descStyle}>
        Kliknete pro pridani bloku do rozlozeni widgetu.
      </div>

      {Object.entries(categories).map(([catId, blocks]) => {
        const catDef = BLOCK_CATEGORIES[catId];
        return (
          <div key={catId} style={categoryStyle}>
            <div style={catHeaderStyle}>
              {catDef?.label?.cs || catId}
            </div>
            <div style={gridStyle}>
              {blocks.map((block) => {
                const IconComp = ICON_MAP[block.icon] || Tag;
                return (
                  <button
                    key={block.type}
                    type="button"
                    onClick={() => handleAddBlock(block.type)}
                    style={blockItemStyle}
                    title={block.label.cs}
                  >
                    <IconComp
                      size={20}
                      color="var(--builder-text-secondary)"
                    />
                    <span style={blockLabelStyle}>{block.label.cs}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const headerStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--builder-text-muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  paddingBottom: 8,
  borderBottom: '1px solid var(--builder-border-subtle)',
};

const descStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 12,
  color: 'var(--builder-text-muted)',
  lineHeight: 1.4,
};

const categoryStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const catHeaderStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--builder-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
};

const blockItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '12px 8px',
  background: 'var(--builder-bg-elevated, #1E2128)',
  border: '1px solid var(--builder-border-default, #2E3340)',
  borderRadius: 'var(--builder-radius-md, 8px)',
  cursor: 'pointer',
  transition: 'background 150ms ease, border-color 150ms ease',
};

const blockLabelStyle = {
  fontFamily: 'var(--builder-font-body)',
  fontSize: 11,
  color: 'var(--builder-text-secondary)',
  textAlign: 'center',
  lineHeight: 1.2,
};
