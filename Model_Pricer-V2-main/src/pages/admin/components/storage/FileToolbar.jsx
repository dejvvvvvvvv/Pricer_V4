import React, { useState, useRef } from 'react';
import Icon from '../../../../components/AppIcon';

export default function FileToolbar({
  searchQuery,
  onSearch,
  onUpload,
  onNewFolder,
  onRefresh,
  currentPath,
  selection,
  onDeleteSelected,
  onDownloadSelected,
}) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const fileInputRef = useRef(null);

  const handleNewFolder = () => {
    if (folderName.trim()) {
      onNewFolder(folderName.trim());
      setFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
    e.target.value = '';
  };

  const isLibrary = currentPath?.startsWith('CompanyLibrary');
  const selectedCount = selection?.size || 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
      flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flex: '1 1 200px',
        minWidth: '180px',
        maxWidth: '320px',
        background: 'var(--forge-bg-elevated)',
        border: '1px solid var(--forge-border-default)',
        borderRadius: 'var(--forge-radius-md)',
        padding: '0 10px',
        height: '36px',
      }}>
        <Icon name="Search" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search files..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            fontFamily: 'var(--forge-font-body)',
            color: 'var(--forge-text-primary)',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: 'var(--forge-bg-elevated)',
          borderRadius: 'var(--forge-radius-md)',
          border: '1px solid var(--forge-border-default)',
        }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
          }}>{selectedCount} selected</span>
          <ToolbarBtn icon="Download" label="Download" onClick={onDownloadSelected} />
          <ToolbarBtn icon="Trash2" label="Delete" onClick={onDeleteSelected} danger />
        </div>
      )}

      {/* Upload (only in library folders) */}
      {isLibrary && (
        <>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} />
          <ToolbarBtn icon="Upload" label="Upload" onClick={() => fileInputRef.current?.click()} />
        </>
      )}

      {/* New folder */}
      {isLibrary && !showNewFolder && (
        <ToolbarBtn icon="FolderPlus" label="New Folder" onClick={() => setShowNewFolder(true)} />
      )}

      {showNewFolder && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            autoFocus
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNewFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
            placeholder="Folder name..."
            style={{
              width: '140px',
              height: '32px',
              padding: '0 8px',
              fontSize: '12px',
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-text-primary)',
              background: 'var(--forge-bg-elevated)',
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-sm)',
              outline: 'none',
            }}
          />
          <ToolbarBtn icon="Check" label="Create" onClick={handleNewFolder} />
          <ToolbarBtn icon="X" label="Cancel" onClick={() => { setShowNewFolder(false); setFolderName(''); }} />
        </div>
      )}

      {/* Refresh */}
      <ToolbarBtn icon="RefreshCw" label="Refresh" onClick={onRefresh} />
    </div>
  );
}

function ToolbarBtn({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: 'var(--forge-radius-sm)',
        border: '1px solid var(--forge-border-default)',
        background: 'var(--forge-bg-surface)',
        color: danger ? 'var(--forge-error)' : 'var(--forge-text-secondary)',
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: 'var(--forge-font-body)',
        fontWeight: 500,
        transition: 'all 120ms ease',
      }}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}
