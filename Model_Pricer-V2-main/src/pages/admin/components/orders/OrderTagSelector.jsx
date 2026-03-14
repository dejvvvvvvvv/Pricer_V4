/**
 * OrderTagSelector — reusable tag chip display + selector dropdown
 *
 * Usage:
 *   <OrderTagSelector
 *     orderId="..."
 *     onTagsChange={(newTagIds) => ...}
 *     compact={false}
 *   />
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debug } from '@/lib/debug';
import Icon from '../../../../components/AppIcon';
import {
  loadTags,
  getOrderTags,
  addOrderTag,
  removeOrderTag,
  createTag,
  deleteTag,
} from '../../../../utils/adminOrderTagsStorage';

// ── Tag Chip ──
export function TagChip({ tag, onRemove, size = 'normal' }) {
  const [hovered, setHovered] = useState(false);
  const isSmall = size === 'small';
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '3px' : '4px',
        padding: isSmall ? '1px 6px' : '2px 8px',
        borderRadius: '999px',
        fontSize: isSmall ? '9px' : '11px',
        fontFamily: 'var(--forge-font-tech)',
        fontWeight: 700,
        letterSpacing: '0.03em',
        backgroundColor: `${tag.color}18`,
        color: tag.color,
        border: `1px solid ${tag.color}40`,
        whiteSpace: 'nowrap',
        transition: 'all 100ms ease',
      }}
    >
      <span style={{
        width: isSmall ? '5px' : '6px',
        height: isSmall ? '5px' : '6px',
        borderRadius: '50%',
        background: tag.color,
        flexShrink: 0,
      }} />
      {tag.label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag.id); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 1px',
            cursor: 'pointer',
            color: hovered ? tag.color : `${tag.color}80`,
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1,
          }}
          title={`Odebrat stitek "${tag.label}"`}
        >
          <Icon name="X" size={isSmall ? 8 : 10} />
        </button>
      )}
    </span>
  );
}

// ── Inline tag chips (for table rows) ──
export function OrderTagChips({ orderId, allTags, assignments, size = 'small', onRemove }) {
  const tagIds = assignments?.[orderId] || [];
  if (tagIds.length === 0) return null;

  const resolvedTags = tagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean);

  if (resolvedTags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
      {resolvedTags.slice(0, 4).map((tag) => (
        <TagChip key={tag.id} tag={tag} size={size} onRemove={onRemove} />
      ))}
      {resolvedTags.length > 4 && (
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          alignSelf: 'center',
        }}>
          +{resolvedTags.length - 4}
        </span>
      )}
    </div>
  );
}

// ── Color Presets for custom tags ──
const COLOR_PRESETS = [
  '#FF4757', '#FF6B35', '#FFB547', '#FBBF24',
  '#00D4AA', '#2DD4BF', '#5B8DEF', '#4A9EFF',
  '#A855F7', '#EC4899', '#6B7280', '#94A3B8',
];

// ── Full Tag Selector (dropdown) ──
export default function OrderTagSelector({ orderId, onTagsChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState(() => loadTags());
  const [orderTagIds, setOrderTagIds] = useState(() => getOrderTags(orderId));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#5B8DEF');
  const dropdownRef = useRef(null);

  // Refresh when orderId changes
  useEffect(() => {
    setOrderTagIds(getOrderTags(orderId));
    setAllTags(loadTags());
  }, [orderId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAddTag = useCallback((tagId) => {
    addOrderTag(orderId, tagId);
    const updated = getOrderTags(orderId);
    setOrderTagIds(updated);
    onTagsChange?.(updated);
  }, [orderId, onTagsChange]);

  const handleRemoveTag = useCallback((tagId) => {
    removeOrderTag(orderId, tagId);
    const updated = getOrderTags(orderId);
    setOrderTagIds(updated);
    onTagsChange?.(updated);
  }, [orderId, onTagsChange]);

  const handleCreateTag = useCallback(() => {
    const label = newTagLabel.trim();
    if (!label) return;
    try {
      const newTag = createTag(label, newTagColor);
      setAllTags(loadTags());
      handleAddTag(newTag.id);
      setNewTagLabel('');
      setNewTagColor('#5B8DEF');
      setShowCreateForm(false);
    } catch (e) {
      debug('[OrderTagSelector] Failed to create tag', e);
    }
  }, [newTagLabel, newTagColor, handleAddTag]);

  const handleDeleteCustomTag = useCallback((tagId) => {
    try {
      deleteTag(tagId);
      setAllTags(loadTags());
      // Read once and reuse to avoid double storage call
      const updated = getOrderTags(orderId);
      setOrderTagIds(updated);
      onTagsChange?.(updated);
    } catch (e) {
      debug('[OrderTagSelector] Failed to delete tag', e);
    }
  }, [orderId, onTagsChange]);

  const resolvedTags = orderTagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Current tags display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {resolvedTags.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={handleRemoveTag} />
        ))}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            border: '1px dashed var(--forge-border-default)',
            background: 'transparent',
            color: 'var(--forge-text-muted)',
            borderRadius: '999px',
            padding: compact ? '1px 6px' : '2px 8px',
            fontSize: compact ? '9px' : '11px',
            fontFamily: 'var(--forge-font-tech)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 100ms ease',
          }}
          title="Pridat stitek"
        >
          <Icon name="Plus" size={compact ? 8 : 10} />
          {!compact && 'Stitek'}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 60,
          minWidth: '240px',
          maxWidth: '320px',
          background: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg)',
          boxShadow: 'var(--forge-shadow-lg)',
          padding: '4px 0',
        }}>
          <div style={{
            padding: '6px 12px',
            fontSize: '10px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid var(--forge-border-default)',
          }}>
            Stitky
          </div>

          <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '4px 0' }}>
            {allTags.map((tag) => {
              const isActive = orderTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'background 80ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <button
                    type="button"
                    onClick={() => isActive ? handleRemoveTag(tag.id) : handleAddTag(tag.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isActive ? `2px solid ${tag.color}` : '2px solid var(--forge-border-default)',
                      background: isActive ? tag.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 100ms ease',
                    }}>
                      {isActive && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: tag.color,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontFamily: 'var(--forge-font-body)',
                      color: 'var(--forge-text-primary)',
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      {tag.label}
                    </span>
                  </button>
                  {!tag.predefined && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCustomTag(tag.id); }}
                      title="Smazat vlastni stitek"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--forge-text-muted)',
                        padding: '2px',
                        display: 'inline-flex',
                        opacity: 0.5,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--forge-error)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
                    >
                      <Icon name="Trash2" size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create custom tag */}
          <div style={{ borderTop: '1px solid var(--forge-border-default)', padding: '4px 0' }}>
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '6px 12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-accent-primary)',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name="Plus" size={12} />
                Vytvorit novy stitek
              </button>
            ) : (
              <div style={{ padding: '8px 12px' }}>
                <input
                  autoFocus
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    if (e.key === 'Escape') { setShowCreateForm(false); setNewTagLabel(''); }
                  }}
                  placeholder="Nazev stitku..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontFamily: 'var(--forge-font-body)',
                    border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-md)',
                    background: 'var(--forge-bg-elevated)',
                    color: 'var(--forge-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '6px',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--forge-accent-primary)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--forge-border-default)'; }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTagColor(c)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: c,
                        border: newTagColor === c ? '2px solid var(--forge-text-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'border-color 100ms ease',
                      }}
                      title={c}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagLabel.trim()}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: '1px solid var(--forge-accent-primary)',
                      background: 'var(--forge-accent-primary)',
                      color: '#08090C',
                      borderRadius: 'var(--forge-radius-md)',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: newTagLabel.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--forge-font-body)',
                      opacity: newTagLabel.trim() ? 1 : 0.5,
                    }}
                  >
                    <Icon name="Check" size={10} /> Vytvorit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setNewTagLabel(''); }}
                    style={{
                      border: '1px solid var(--forge-border-default)',
                      background: 'var(--forge-bg-elevated)',
                      color: 'var(--forge-text-secondary)',
                      borderRadius: 'var(--forge-radius-md)',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--forge-font-body)',
                    }}
                  >
                    Zrusit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
