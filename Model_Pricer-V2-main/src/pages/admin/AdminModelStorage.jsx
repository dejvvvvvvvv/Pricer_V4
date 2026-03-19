import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import useStorageBrowser from '../../hooks/useStorageBrowser';
import FolderTreePanel from './components/storage/FolderTreePanel';
import FileListPanel from './components/storage/FileListPanel';
import PreviewPanel from './components/storage/PreviewPanel';
import BreadcrumbBar from './components/storage/BreadcrumbBar';
import FileToolbar from './components/storage/FileToolbar';
import { downloadFile, createZip } from '../../services/storageApi';
import { debug } from '../../lib/debug';

export default function AdminModelStorage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPath = searchParams.get('path') || '';

  const {
    currentPath,
    items,
    loading,
    error,
    selection,
    searchQuery,
    isSearching,
    viewMode,
    navigateTo,
    navigateUp,
    refresh,
    loadFolder,
    doSearch,
    toggleSelection,
    clearSelection,
    setViewMode,
    doDelete,
    doRestore,
    doCreateFolder,
    doRename,
    doUpload,
    setError,
  } = useStorageBrowser(initialPath);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  // Restore view preference from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mp:storage:viewMode');
      if (saved === 'grid' || saved === 'list') setViewMode(saved);
    } catch { /* ignore */ }
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try { sessionStorage.setItem('mp:storage:viewMode', mode); } catch { /* ignore */ }
  }, [setViewMode]);

  // Load initial folder
  useEffect(() => {
    loadFolder(initialPath);
  }, [loadFolder, initialPath]);

  // Sync URL params with current path
  useEffect(() => {
    if (currentPath) {
      setSearchParams({ path: currentPath }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [currentPath, setSearchParams]);

  const handleNavigate = useCallback((folderPath) => {
    setSelectedItem(null);
    setContextMenu(null);
    navigateTo(folderPath);
  }, [navigateTo]);

  const handleSelectItem = useCallback((item, e) => {
    if (item.type === 'file') {
      setSelectedItem(item);
      toggleSelection(item.path, e?.shiftKey, e?.ctrlKey || e?.metaKey);
    }
  }, [toggleSelection]);

  const handleContextMenu = useCallback((item, e) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDownload = useCallback(async (filePath) => {
    try {
      const blobUrl = await downloadFile(filePath);
      const filename = filePath.split('/').pop() || 'download';
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      debug('Download failed:', e);
    }
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const count = selection.size ?? selection.length ?? 0;
    const ok = await confirm({
      title: 'Smazat soubory',
      message: `Opravdu smazat ${count} vybrany${count === 1 ? '' : 'ch'} soubor${count === 1 ? '' : 'u'}? Tato akce je nevratna.`,
      confirmLabel: 'Smazat',
      destructive: true,
    });
    if (!ok) return;
    for (const path of selection) {
      await doDelete(path);
    }
    setSelectedItem(null);
  }, [selection, doDelete, confirm]);

  const handleDownloadSelected = useCallback(async () => {
    const paths = Array.from(selection);
    if (paths.length === 1) {
      handleDownload(paths[0]);
    } else if (paths.length > 1) {
      try {
        await createZip(paths);
      } catch (e) {
        debug('ZIP download failed:', e);
      }
    }
  }, [selection, handleDownload]);

  const isTrash = currentPath === '.trash' || currentPath === 'Trash';

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  return (
    <div>
      <ConfirmDialog />
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontWeight: 700,
            fontSize: '22px',
            color: 'var(--forge-text-primary)',
            margin: 0,
          }}>
            Model Storage
          </h1>
          <p style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-muted)',
            marginTop: '4px',
          }}>
            Browse and manage order files, models, and company library
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? 'Hide preview' : 'Show preview'}
          style={{
            background: 'none',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-sm)',
            padding: '6px 10px',
            cursor: 'pointer',
            color: showPreview ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-body)',
          }}
        >
          <Icon name="Sidebar" size={14} />
          Preview
        </button>
      </div>

      {/* Main container */}
      <div style={{
        display: 'flex',
        border: '1px solid var(--forge-border-default)',
        borderRadius: 'var(--forge-radius-lg)',
        overflow: 'hidden',
        backgroundColor: 'var(--forge-bg-surface)',
        height: 'calc(100vh - 200px)',
        minHeight: '500px',
      }}>
        {/* Folder tree */}
        <FolderTreePanel
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar area */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--forge-border-default)' }}>
            <BreadcrumbBar currentPath={currentPath} onNavigate={handleNavigate} />
            <FileToolbar
              searchQuery={searchQuery}
              onSearch={doSearch}
              onUpload={doUpload}
              onNewFolder={doCreateFolder}
              onRefresh={refresh}
              currentPath={currentPath}
              selection={selection}
              onDeleteSelected={handleDeleteSelected}
              onDownloadSelected={handleDownloadSelected}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>

          {/* File list / grid */}
          <FileListPanel
            items={items}
            loading={loading}
            error={error}
            selection={selection}
            onNavigate={handleNavigate}
            onSelect={toggleSelection}
            onSelectItem={handleSelectItem}
            onContextMenu={handleContextMenu}
            onDownload={handleDownload}
            onDelete={doDelete}
            isTrash={isTrash}
            viewMode={viewMode}
          />
        </div>

        {/* Preview panel */}
        {showPreview && (
          <PreviewPanel
            selectedItem={selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={doDelete}
            onDownload={handleDownload}
          />
        )}
      </div>

      {/* Context menu */}
      {contextMenu && createPortal(
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 2000,
            backgroundColor: 'var(--forge-bg-surface)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-md)',
            boxShadow: 'var(--forge-shadow-lg)',
            padding: '4px 0',
            minWidth: '160px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.type === 'file' && (
            <ContextMenuItem
              icon="Download"
              label="Download"
              onClick={() => {
                handleDownload(contextMenu.item.path);
                handleCloseContextMenu();
              }}
            />
          )}
          {contextMenu.item.type === 'folder' && (
            <ContextMenuItem
              icon="FolderOpen"
              label="Open"
              onClick={() => {
                handleNavigate(contextMenu.item.path);
                handleCloseContextMenu();
              }}
            />
          )}
          {isTrash && (
            <ContextMenuItem
              icon="RotateCcw"
              label="Restore"
              onClick={() => {
                doRestore(contextMenu.item.name);
                handleCloseContextMenu();
              }}
            />
          )}
          {!isTrash && (
            <ContextMenuItem
              icon="Trash2"
              label="Delete"
              danger
              onClick={async () => {
                const itemName = contextMenu.item.name || contextMenu.item.path;
                handleCloseContextMenu();
                const ok = await confirm({
                  title: 'Smazat soubor',
                  message: `Opravdu smazat "${itemName}"? Tato akce je nevratna.`,
                  confirmLabel: 'Smazat',
                  destructive: true,
                });
                if (!ok) return;
                doDelete(contextMenu.item.path);
                setSelectedItem(null);
              }}
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function ContextMenuItem({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 14px',
        border: 'none',
        background: hovered ? 'var(--forge-bg-elevated)' : 'transparent',
        color: danger ? 'var(--forge-error)' : 'var(--forge-text-primary)',
        cursor: 'pointer',
        fontSize: '13px',
        fontFamily: 'var(--forge-font-body)',
        textAlign: 'left',
      }}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
