/**
 * blockLibrary.js — Custom block types available in the Widget Builder.
 *
 * These are user-addable content blocks that can be dragged from the
 * block palette into the widget layout.
 */

export const BLOCK_TYPES = {
  text: {
    type: 'text',
    label: { cs: 'Textovy blok', en: 'Text Block' },
    icon: 'Type',
    category: 'content',
    defaultProps: {
      content: 'Vas text zde...',
      fontSize: 14,
      fontWeight: '400',
      color: '#374151',
      bgColor: 'transparent',
      padding: 12,
      textAlign: 'left',
      borderRadius: 8,
    },
  },
  image: {
    type: 'image',
    label: { cs: 'Obrazek', en: 'Image' },
    icon: 'Image',
    category: 'content',
    defaultProps: {
      src: '',
      alt: '',
      maxWidth: '100%',
      borderRadius: 8,
      padding: 0,
    },
  },
  divider: {
    type: 'divider',
    label: { cs: 'Oddelovac', en: 'Divider' },
    icon: 'Minus',
    category: 'layout',
    defaultProps: {
      color: '#E5E7EB',
      thickness: 1,
      style: 'solid',
      marginY: 16,
    },
  },
  spacer: {
    type: 'spacer',
    label: { cs: 'Mezera', en: 'Spacer' },
    icon: 'MoveVertical',
    category: 'layout',
    defaultProps: {
      height: 24,
    },
  },
  infobox: {
    type: 'infobox',
    label: { cs: 'Info box', en: 'Info Box' },
    icon: 'AlertCircle',
    category: 'content',
    defaultProps: {
      title: 'Dulezita informace',
      text: 'Text informacniho boxu...',
      variant: 'info',
      padding: 16,
      borderRadius: 8,
    },
  },
  badge: {
    type: 'badge',
    label: { cs: 'Stitek', en: 'Badge' },
    icon: 'Tag',
    category: 'content',
    defaultProps: {
      text: 'Novinka',
      color: '#00D4AA',
      bgColor: '#ECFDF5',
      fontSize: 12,
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: 20,
      textAlign: 'center',
    },
  },
};

/** Ordered list of block types for the palette */
export const BLOCK_TYPE_ORDER = ['text', 'image', 'divider', 'spacer', 'infobox', 'badge'];

/** Block categories for grouping in the palette */
export const BLOCK_CATEGORIES = {
  content: { label: { cs: 'Obsah', en: 'Content' } },
  layout: { label: { cs: 'Rozlozeni', en: 'Layout' } },
};

/**
 * Create a new custom block instance.
 * @param {string} blockType - Type from BLOCK_TYPES
 * @param {number} position - Position in element order
 * @returns {object} New block instance
 */
export function createCustomBlock(blockType, position) {
  const def = BLOCK_TYPES[blockType];
  if (!def) return null;

  return {
    id: `cb_${crypto.randomUUID()}`,
    type: blockType,
    position,
    props: { ...def.defaultProps },
    visible: true,
  };
}
