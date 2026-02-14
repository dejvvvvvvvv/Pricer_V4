import React, { useState, useCallback } from 'react';
import Icon from '../../../../components/AppIcon';

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

export default function FileListPanel({
  items,
  loading,
  error,
  selection,
  onNavigate,
  onSelect,
  onSelectItem,
  onContextMenu,
  isTrash,
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
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--forge-font-body)', flex: 1 }}>
        <Icon name="AlertTriangle" size={32} style={{ marginBottom: '12px', color: 'var(--forge-error)', opacity: 0.7 }} />
        <p style={{ color: 'var(--forge-error)', fontSize: '14px', marginBottom: '8px' }}>{error}</p>
        <p style={{ color: 'var(--forge-text-muted)', fontSize: '12px' }}>
          Make sure the backend server is running: <code style={{ fontFamily: 'var(--forge-font-tech)', background: 'var(--forge-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>cd backend-local && node src/index.js</code>
        </p>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
        <Icon name="FolderOpen" size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
        <p>No files</p>
      </div>
    );
  }

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
            <SortHeader label="Name" sortField="name" />
            <SortHeader label="Size" sortField="size" />
            <SortHeader label="Modified" sortField="modified" />
            <SortHeader label="Type" sortField="type" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const isSelected = selection?.has(item.path);
            const isFolder = item.type === 'folder';
            const ext = isFolder ? 'folder' : (item.name || '').split('.').pop().toLowerCase();

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
                <td style={{ padding: '8px 10px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase' }}>
                  {ext}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
