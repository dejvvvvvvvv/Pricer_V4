import React, { useState, useCallback } from 'react';
import Icon from '../../../../components/AppIcon';
import { getPreviewUrl } from '../../../../services/storageApi';

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDateShort(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getFileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const map = {
    stl: 'Box', obj: 'Box', '3mf': 'Box', amf: 'Box', step: 'Box', stp: 'Box',
    gcode: 'FileText', ini: 'Settings', json: 'FileJson',
    png: 'Image', jpg: 'Image', jpeg: 'Image',
    pdf: 'FileText', zip: 'Archive',
  };
  return map[ext] || 'File';
}

function getFileExt(name) {
  return (name || '').split('.').pop().toLowerCase();
}

function isImageFile(name) {
  const ext = getFileExt(name);
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
}

function is3DFile(name) {
  const ext = getFileExt(name);
  return ['stl', 'obj', '3mf', 'amf', 'step', 'stp'].includes(ext);
}

/** Color-coded badge for file type */
const TYPE_COLORS = {
  stl: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  obj: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  '3mf': { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  amf: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  step: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  stp: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00D4AA' },
  gcode: { bg: 'rgba(255, 165, 0, 0.15)', text: '#FFA500' },
  png: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  jpg: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  jpeg: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  gif: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  webp: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  pdf: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  zip: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
  json: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF' },
  ini: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF' },
  folder: { bg: 'rgba(0, 212, 170, 0.10)', text: 'var(--forge-accent-primary)' },
};

function TypeBadge({ ext }) {
  const colors = TYPE_COLORS[ext] || { bg: 'rgba(156, 163, 175, 0.12)', text: 'var(--forge-text-muted)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '9px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: colors.bg,
      color: colors.text,
      lineHeight: '14px',
    }}>
      {ext}
    </span>
  );
}

export default function FileListPanel({
  items,
  loading,
  error,
  selection,
  onNavigate,
  onSelect,
  onSelectItem,
  onContextMenu,
  onDownload,
  onDelete,
  isTrash,
  viewMode = 'list',
}) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...(items || [])].sort((a, b) => {
    // Folders first
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

    let cmp = 0;
    if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
    else if (sortKey === 'size') cmp = (a.size || 0) - (b.size || 0);
    else if (sortKey === 'modified') cmp = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
    else if (sortKey === 'type') {
      const extA = (a.name || '').split('.').pop();
      const extB = (b.name || '').split('.').pop();
      cmp = extA.localeCompare(extB);
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleRowClick = useCallback((item, e) => {
    if (item.type === 'folder' && !isTrash) {
      onNavigate(item.path);
    } else {
      onSelectItem?.(item, e);
    }
  }, [onNavigate, onSelectItem, isTrash]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
        Nacitani...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--forge-font-body)', flex: 1 }}>
        <Icon name="AlertTriangle" size={32} style={{ marginBottom: '12px', color: 'var(--forge-error)', opacity: 0.7 }} />
        <p style={{ color: 'var(--forge-error)', fontSize: '14px', marginBottom: '8px' }}>{error}</p>
        <p style={{ color: 'var(--forge-text-muted)', fontSize: '12px' }}>
          Zkontrolujte, ze backend server bezi: <code style={{ fontFamily: 'var(--forge-font-tech)', background: 'var(--forge-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>cd backend-local && node src/index.js</code>
        </p>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
        <Icon name="FolderOpen" size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
        <p>Zadne soubory</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {/* Grid sort bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--forge-border-default)',
        }}>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Radit:
          </span>
          {[
            { key: 'name', label: 'Nazev' },
            { key: 'modified', label: 'Datum' },
            { key: 'size', label: 'Velikost' },
            { key: 'type', label: 'Typ' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSort(key)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: sortKey === key ? 700 : 400,
                color: sortKey === key ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {label}
              {sortKey === key && (
                <Icon name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={10} />
              )}
            </button>
          ))}
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
          }}>
            {sorted.length} polozek
          </span>
        </div>

        {/* Grid cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px',
        }}>
          {sorted.map((item) => (
            <GridCard
              key={item.path || item.name}
              item={item}
              isSelected={selection?.has(item.path)}
              isTrash={isTrash}
              onClick={handleRowClick}
              onContextMenu={onContextMenu}
              onSelect={onSelect}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── List view (original) ────────────────────────────────────────────────
  const SortHeader = ({ label, sortField }) => (
    <th
      onClick={() => handleSort(sortField)}
      style={{
        textAlign: 'left',
        padding: '8px 10px',
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        fontWeight: 600,
        color: sortKey === sortField ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {sortKey === sortField && (
        <Icon name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={10} style={{ marginLeft: '2px' }} />
      )}
    </th>
  );

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--forge-font-body)', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--forge-border-default)' }}>
            <th style={{ width: '32px', padding: '8px 4px' }} />
            <SortHeader label="Nazev" sortField="name" />
            <SortHeader label="Velikost" sortField="size" />
            <SortHeader label="Upraveno" sortField="modified" />
            <SortHeader label="Typ" sortField="type" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const isSelected = selection?.has(item.path);
            const isFolder = item.type === 'folder';
            const ext = isFolder ? 'folder' : getFileExt(item.name);

            return (
              <tr
                key={item.path || item.name}
                onClick={(e) => handleRowClick(item, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu?.(item, e);
                }}
                style={{
                  borderBottom: '1px solid var(--forge-border-default)',
                  cursor: isFolder ? 'pointer' : 'default',
                  backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'transparent',
                  transition: 'background-color 80ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                  {!isFolder && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelect?.(item.path, e.nativeEvent.shiftKey, e.nativeEvent.ctrlKey || e.nativeEvent.metaKey);
                      }}
                      style={{ accentColor: 'var(--forge-accent-primary)' }}
                    />
                  )}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon
                      name={isFolder ? 'Folder' : getFileIcon(item.name)}
                      size={16}
                      style={{ color: isFolder ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)', flexShrink: 0 }}
                    />
                    <span style={{
                      color: 'var(--forge-text-primary)',
                      fontWeight: isFolder ? 500 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {isTrash ? (item.originalPath || item.name) : item.name}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>
                  {isFolder ? '-' : formatSize(item.size)}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>
                  {formatDate(item.modified || item.deletedAt)}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <TypeBadge ext={ext} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Grid Card Component ──────────────────────────────────────────────────── */

function GridCard({ item, isSelected, isTrash, onClick, onContextMenu, onSelect, onDownload, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const isFolder = item.type === 'folder';
  const ext = isFolder ? 'folder' : getFileExt(item.name);
  const showImagePreview = !isFolder && isImageFile(item.name);
  const show3DIcon = !isFolder && is3DFile(item.name);

  return (
    <div
      onClick={(e) => onClick(item, e)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(item, e);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--forge-radius-md)',
        border: `1px solid ${isSelected ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.04)' : 'var(--forge-bg-elevated)',
        cursor: isFolder ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Thumbnail area */}
      <div style={{
        width: '100%',
        aspectRatio: '4 / 3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--forge-bg-surface)',
        borderBottom: '1px solid var(--forge-border-default)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isFolder ? (
          <Icon name="Folder" size={48} style={{ color: 'var(--forge-accent-primary)', opacity: 0.6 }} />
        ) : showImagePreview ? (
          <img
            src={getPreviewUrl(item.path)}
            alt={item.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7A8291" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
            }}
          />
        ) : show3DIcon ? (
          <div style={{ textAlign: 'center' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00D4AA"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5 }}
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        ) : (
          <Icon
            name={getFileIcon(item.name)}
            size={40}
            style={{ color: 'var(--forge-text-muted)', opacity: 0.35 }}
          />
        )}

        {/* Type badge overlay */}
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
        }}>
          <TypeBadge ext={ext} />
        </div>

        {/* Checkbox overlay */}
        {!isFolder && (hovered || isSelected) && (
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
          }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect?.(item.path, e.nativeEvent.shiftKey, e.nativeEvent.ctrlKey || e.nativeEvent.metaKey);
              }}
              style={{
                accentColor: 'var(--forge-accent-primary)',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px', flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          fontWeight: isFolder ? 500 : 400,
          color: 'var(--forge-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '6px',
        }}
          title={item.name}
        >
          {isTrash ? (item.originalPath || item.name) : item.name}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
          }}>
            {isFolder ? 'Slozka' : formatSize(item.size)}
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
          }}>
            {formatDateShort(item.modified || item.deletedAt)}
          </span>
        </div>
      </div>

      {/* Quick actions (visible on hover, files only) */}
      {!isFolder && hovered && (
        <div style={{
          display: 'flex',
          borderTop: '1px solid var(--forge-border-default)',
          backgroundColor: 'var(--forge-bg-surface)',
        }}>
          <GridActionBtn
            icon="Eye"
            label="Nahled"
            onClick={(e) => {
              e.stopPropagation();
              onClick(item, e);
            }}
          />
          <GridActionBtn
            icon="Download"
            label="Stahnout"
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.(item.path);
            }}
          />
          {!isTrash && (
            <GridActionBtn
              icon="Trash2"
              label="Smazat"
              danger
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(item.path);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function GridActionBtn({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px',
        border: 'none',
        background: hovered ? 'var(--forge-bg-elevated)' : 'transparent',
        color: danger ? 'var(--forge-error)' : 'var(--forge-text-muted)',
        cursor: 'pointer',
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        transition: 'background 80ms ease',
      }}
    >
      <Icon name={icon} size={12} />
      {label}
    </button>
  );
}
