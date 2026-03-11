import React, { useState, useEffect } from 'react';
import Icon from '../../../../components/AppIcon';
import { browseFolder } from '../../../../services/storageApi';

function TreeItem({ name, path, icon, currentPath, onNavigate, depth = 0, alwaysExpandable = false }) {
  const isActive = currentPath === path || (currentPath && currentPath.startsWith(path + '/'));
  const [expanded, setExpanded] = useState(isActive);
  const [subFolders, setSubFolders] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isActive && !expanded) setExpanded(true);
  }, [isActive]);

  const loadSubFolders = async (force = false) => {
    if (loaded && !force) return;
    setLoadError(false);
    setLoaded(false);
    try {
      const result = await browseFolder(path);
      const folders = (result.items || []).filter((i) => i.type === 'folder');
      setSubFolders(folders);
      setLoaded(true);
    } catch {
      setSubFolders([]);
      setLoaded(true);
      setLoadError(true);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!expanded) {
      if (!loaded || loadError) loadSubFolders(loadError);
    }
    setExpanded(!expanded);
  };

  const handleClick = () => {
    if (!loaded || loadError) loadSubFolders(loadError);
    setExpanded(true);
    onNavigate(path);
  };

  // Always show arrow for folders — they are all expandable/collapsible in the tree.
  // Even if a folder has no sub-folders, the arrow serves as a visual indicator
  // that the folder has been explored and allows toggling the expanded state.
  const showArrow = true;

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          paddingLeft: `${12 + depth * 16}px`,
          cursor: 'pointer',
          borderRadius: 'var(--forge-radius-sm)',
          backgroundColor: currentPath === path ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
          color: currentPath === path ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
          transition: 'background-color 120ms ease',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          fontWeight: currentPath === path ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (currentPath !== path) e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
        }}
        onMouseLeave={(e) => {
          if (currentPath !== path) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          onClick={handleToggle}
          style={{ display: 'inline-flex', width: '14px', flexShrink: 0 }}
        >
          {showArrow && (
            <Icon name={expanded ? 'ChevronDown' : 'ChevronRight'} size={12} />
          )}
        </span>
        <Icon name={icon || 'Folder'} size={14} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>

      {expanded && subFolders && subFolders.map((f) => (
        <TreeItem
          key={f.path}
          name={f.name}
          path={f.path}
          icon="Folder"
          currentPath={currentPath}
          onNavigate={onNavigate}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function FolderTreePanel({ currentPath, onNavigate }) {
  return (
    <div style={{
      width: '240px',
      minWidth: '240px',
      borderRight: '1px solid var(--forge-border-default)',
      backgroundColor: 'var(--forge-bg-surface)',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      padding: '8px 0',
    }}>
      <div style={{
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        color: 'var(--forge-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '8px 12px 4px',
      }}>
        Storage
      </div>

      <TreeItem
        name="Orders"
        path="Orders"
        icon="ShoppingCart"
        currentPath={currentPath}
        onNavigate={onNavigate}
        alwaysExpandable
      />
      <TreeItem
        name="Company Library"
        path="CompanyLibrary"
        icon="Library"
        currentPath={currentPath}
        onNavigate={onNavigate}
        alwaysExpandable
      />

      <div style={{ height: '1px', background: 'var(--forge-border-default)', margin: '8px 12px' }} />

      <TreeItem
        name="Trash"
        path=".trash"
        icon="Trash2"
        currentPath={currentPath}
        onNavigate={onNavigate}
        alwaysExpandable
      />
    </div>
  );
}
