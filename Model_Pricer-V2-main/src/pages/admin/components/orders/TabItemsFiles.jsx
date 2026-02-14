import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../../components/AppIcon';
import StorageStatusBadge from './StorageStatusBadge';
import { getDownloadUrl, createZip } from '../../../../services/storageApi';
import { round2 } from '../../../../utils/adminOrdersStorage';

function formatMoney(amount) {
  return `${round2(amount).toFixed(2)} Kc`;
}

function formatTime(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r}m`;
  return `${h}h ${r}m`;
}

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TabItemsFiles({ order, onClose }) {
  const navigate = useNavigate();
  const models = order?.models || [];
  const storage = order?.storage || {};
  const storageStatus = storage.status || 'pending';
  const hasStorage = storageStatus === 'complete' && storage.storagePath;

  const handleOpenFolder = () => {
    onClose?.();
    const folderPath = storage.storagePath || '';
    navigate(`/admin/model-storage?path=${encodeURIComponent(folderPath)}`);
  };

  const handleDownloadZip = () => {
    if (!hasStorage) return;
    createZip([storage.storagePath]).catch(console.error);
  };

  const handleDownloadFile = (filePath) => {
    const url = getDownloadUrl(filePath);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Models table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '13px',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--forge-border-default)' }}>
              {['Model', 'Material', 'Qty', 'Time', 'Weight', 'Price', 'Actions'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontWeight: 600,
                  color: 'var(--forge-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const filename = model?.file_snapshot?.filename || 'unknown';
              const material = model?.material_snapshot?.name || '-';
              const qty = model?.quantity || 1;
              // Slicer returns estimatedTimeSeconds (seconds) and filamentGrams (grams)
              const slicer = model?.slicer_snapshot || {};
              const timeSec = slicer.estimatedTimeSeconds ?? slicer.time_min_raw ?? null;
              const timeMin = timeSec != null ? timeSec / 60 : (slicer.time_min ?? null);
              const weightG = slicer.filamentGrams ?? slicer.weight_g ?? null;
              // Per-model price from totals or config snapshot
              const price = model?.price_breakdown_snapshot?.model_total
                ?? model?.config_snapshot?.totalPrice ?? 0;

              // Try to find the file in the manifest
              const manifestEntry = (storage.fileManifest || []).find(
                (f) => f.type === 'model' && (f.filename === filename || f.filename === filename.replace(/[^a-zA-Z0-9._-]/g, '_'))
              );

              return (
                <tr key={model.id} style={{ borderBottom: '1px solid var(--forge-border-default)' }}>
                  <td style={{ padding: '10px', color: 'var(--forge-text-primary)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="Box" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {filename}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', color: 'var(--forge-text-secondary)' }}>{material}</td>
                  <td style={{ padding: '10px', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-tech)' }}>{qty}</td>
                  <td style={{ padding: '10px', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-tech)' }}>
                    {timeMin != null ? formatTime(timeMin) : '-'}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-tech)' }}>
                    {weightG != null ? `${round2(weightG)}g` : '-'}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-tech)', fontWeight: 600 }}>
                    {formatMoney(price)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {hasStorage && manifestEntry && (
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(`${storage.storagePath}models/${manifestEntry.filename}`)}
                        title="Download model"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--forge-accent-primary)',
                          padding: '4px',
                        }}
                      >
                        <Icon name="Download" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Storage status + actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-md)',
        border: '1px solid var(--forge-border-default)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>Storage:</span>
          <StorageStatusBadge status={storageStatus} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasStorage && (
            <>
              <button
                type="button"
                onClick={handleOpenFolder}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--forge-radius-md)',
                  border: '1px solid var(--forge-border-default)',
                  background: 'var(--forge-bg-surface)',
                  color: 'var(--forge-text-secondary)',
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                <Icon name="FolderOpen" size={14} />
                Open Folder
              </button>

              <button
                type="button"
                onClick={handleDownloadZip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
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
                Download ZIP
              </button>
            </>
          )}
        </div>
      </div>

      {/* File manifest details */}
      {hasStorage && storage.fileManifest?.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>File Manifest ({storage.fileManifest.length} files)</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {storage.fileManifest.map((file, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 'var(--forge-radius-sm)',
                background: idx % 2 === 0 ? 'transparent' : 'var(--forge-bg-elevated)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)',
                    color: 'var(--forge-accent-primary)',
                    textTransform: 'uppercase',
                    minWidth: '48px',
                  }}>{file.type}</span>
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-primary)',
                  }}>{file.filename}</span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)',
                }}>{formatSize(file.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
