import React, { Suspense, useMemo } from 'react';
import Icon from '../../../../components/AppIcon';
import { getPreviewUrl, getDownloadUrl } from '../../../../services/storageApi';

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function is3DFile(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  return ['stl', 'obj', '3mf'].includes(ext);
}

function isImageFile(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
}

function MetaRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--forge-border-default)',
    }}>
      <span style={{
        fontSize: '11px',
        fontFamily: 'var(--forge-font-tech)',
        color: 'var(--forge-text-muted)',
        textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontSize: '12px',
        fontFamily: 'var(--forge-font-body)',
        color: 'var(--forge-text-primary)',
        textAlign: 'right',
        maxWidth: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{value}</span>
    </div>
  );
}

export default function PreviewPanel({ selectedItem, onClose, onDelete, onDownload }) {
  if (!selectedItem || selectedItem.type === 'folder') {
    return (
      <div style={{
        width: '320px',
        minWidth: '320px',
        borderLeft: '1px solid var(--forge-border-default)',
        backgroundColor: 'var(--forge-bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', fontSize: '13px' }}>
          <Icon name="Eye" size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
          <p>Select a file to preview</p>
        </div>
      </div>
    );
  }

  const filename = selectedItem.name;
  const ext = (filename || '').split('.').pop().toLowerCase();
  const show3D = is3DFile(filename);
  const showImage = isImageFile(filename);

  return (
    <div style={{
      width: '320px',
      minWidth: '320px',
      borderLeft: '1px solid var(--forge-border-default)',
      backgroundColor: 'var(--forge-bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--forge-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '14px',
          fontFamily: 'var(--forge-font-body)',
          fontWeight: 600,
          color: 'var(--forge-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {filename}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--forge-text-muted)',
            padding: '4px',
          }}
        >
          <Icon name="X" size={14} />
        </button>
      </div>

      {/* Preview area */}
      <div style={{
        padding: '16px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--forge-bg-elevated)',
        margin: '16px',
        borderRadius: 'var(--forge-radius-md)',
        border: '1px solid var(--forge-border-default)',
      }}>
        {showImage ? (
          <img
            src={getPreviewUrl(selectedItem.path)}
            alt={filename}
            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }}
          />
        ) : show3D ? (
          <div style={{ textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', fontSize: '12px' }}>
            <Icon name="Box" size={48} style={{ marginBottom: '8px', opacity: 0.4, color: 'var(--forge-accent-primary)' }} />
            <p>3D Preview</p>
            <p style={{ fontSize: '10px' }}>({ext.toUpperCase()} file)</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', fontSize: '12px' }}>
            <Icon name="File" size={40} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p>{ext.toUpperCase()} file</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div style={{ padding: '0 16px 16px' }}>
        <MetaRow label="Filename" value={filename} />
        <MetaRow label="Size" value={formatSize(selectedItem.size)} />
        <MetaRow label="Modified" value={selectedItem.modified ? new Date(selectedItem.modified).toLocaleString() : '-'} />
        <MetaRow label="Type" value={ext.toUpperCase()} />
        <MetaRow label="Path" value={selectedItem.path} />
      </div>

      {/* Actions */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onDownload?.(selectedItem.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--forge-radius-md)',
            border: '1px solid var(--forge-accent-primary)',
            background: 'var(--forge-accent-primary)',
            color: '#08090C',
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Icon name="Download" size={14} />
          Download
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(selectedItem.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--forge-radius-md)',
            border: '1px solid var(--forge-border-default)',
            background: 'transparent',
            color: 'var(--forge-error)',
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Icon name="Trash2" size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
