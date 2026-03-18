import React from 'react';
import { debug } from '@/lib/debug';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../../components/AppIcon';
import StorageStatusBadge from './StorageStatusBadge';
import { downloadFile, createZip } from '../../../../services/storageApi';
import { round2 } from '../../../../utils/adminOrdersStorage';
import { formatMoney, formatTime, formatSize } from '../../../../utils/formatters';

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
    createZip([storage.storagePath]).catch((err) => debug('[TabItemsFiles] ZIP download failed:', err));
  };

  const handleDownloadFile = async (filePath) => {
    try {
      // Defense-in-depth: sanitize path before passing to downloadFile
      // Reject null bytes, backslashes, and ".." path traversal segments
      const sanitized = String(filePath || '')
        .replace(/\\/g, '/')
        .replace(/\0/g, '')
        .split('/')
        .filter(seg => seg !== '..' && seg !== '.')
        .join('/');
      if (!sanitized) {
        debug('[TabItemsFiles] Invalid file path rejected');
        return;
      }
      const filename = sanitized.split('/').pop() || 'download';
      const blobUrl = await downloadFile(sanitized);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      debug('[TabItemsFiles] Download failed:', err);
    }
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
                  <td style={{ padding: '10px', color: 'var(--forge-text-secondary)' }}>
                    {material}
                    {model?.material_snapshot?.price_per_gram != null && Number(model.material_snapshot.price_per_gram) > 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--forge-font-tech)',
                        color: 'var(--forge-text-muted)',
                        marginLeft: '4px',
                      }}>
                        ({round2(model.material_snapshot.price_per_gram)} Kc/g)
                      </span>
                    )}
                  </td>
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

      {/* Per-model fees detail */}
      {models.some(m => {
        const fd = m?.price_breakdown_snapshot?.fees_detail;
        return Array.isArray(fd) && fd.length > 0;
      }) && (
        <div>
          <h4 style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Fees Breakdown per Model</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {models.map((model) => {
              const fd = model?.price_breakdown_snapshot?.fees_detail;
              if (!Array.isArray(fd) || fd.length === 0) return null;
              const filename = model?.file_snapshot?.filename || 'unknown';
              return (
                <div key={model.id} style={{
                  padding: '10px 14px',
                  background: 'var(--forge-bg-elevated)',
                  borderRadius: 'var(--forge-radius-sm)',
                  border: '1px solid var(--forge-border-default)',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-primary)',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}>{filename}</div>
                  {fd.map((fee, fi) => (
                    <div key={fee.id || fi} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 0',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--forge-font-body)',
                        color: 'var(--forge-text-muted)',
                      }}>{fee.name || `Fee #${fi + 1}`}{fee.type ? ` (${fee.type})` : ''}</span>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--forge-font-tech)',
                        color: 'var(--forge-text-primary)',
                      }}>{formatMoney(Number(fee.amount) || 0)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  color: 'var(--forge-bg-void)',
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
