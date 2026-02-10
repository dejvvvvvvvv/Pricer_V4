import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const forgeStyles = {
  uploadZone: {
    background: 'var(--forge-bg-void)',
    border: '2px dashed var(--forge-border-active)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s var(--forge-ease-out-expo)',
  },
  uploadZoneActive: {
    border: '2px solid var(--forge-accent-primary)',
    background: 'rgba(0, 212, 170, 0.04)',
    transform: 'scale(1.02)',
  },
  uploadZoneHover: {
    borderColor: 'rgba(0, 212, 170, 0.4)',
  },
  iconCircle: {
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-muted)',
    transition: 'all 0.2s',
  },
  iconCircleActive: {
    background: 'var(--forge-accent-primary)',
    color: '#08090C',
  },
  heading: {
    fontSize: 'var(--forge-text-xl)',
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  subText: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
  },
  mutedText: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
  },
  sectionLabel: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  card: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '1rem',
  },
  progressBar: {
    width: '100%',
    height: '0.5rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-sm)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--forge-accent-primary)',
    borderRadius: 'var(--forge-radius-sm)',
    transition: 'width 0.3s var(--forge-ease-out-expo)',
  },
  fileIcon: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 'var(--forge-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  },
  fileMeta: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-success)',
    fontFamily: 'var(--forge-font-mono)',
  },
  infoBox: {
    background: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '1rem',
  },
  pill: {
    display: 'inline-block',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-mono)',
    padding: '0.125rem 0.5rem',
    borderRadius: '999px',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-secondary)',
    border: '1px solid var(--forge-border-default)',
  },
};

const FileUploadZone = ({ onFilesUploaded, uploadedFiles, onRemoveFile }) => {
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles?.length > 0) {
        rejectedFiles.forEach((file) => {
          console.error(`File ${file?.file?.name} was rejected:`, file?.errors);
        });
      }

      // Process accepted files
      acceptedFiles?.forEach((file) => {
        const fileId = Date.now() + Math.random();
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;

          if (progress >= 100) {
            clearInterval(interval);
            // Remove from progress tracking
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });

            // Defer parent state update to avoid React warning (setState while rendering)
            setTimeout(() => {
              onFilesUploaded({
                id: fileId,
                name: file?.name,
                size: file?.size,
                type: file?.type,
                file,
                uploadedAt: new Date(),
              });
            }, 0);

            return;
          }

          setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
        }, 200);
      });
    },
    [onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.stl'],
      'application/x-tgif': ['.obj'],
      'model/stl': ['.stl'],
      'model/obj': ['.obj'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        style={{
          ...forgeStyles.uploadZone,
          ...(isDragActive ? forgeStyles.uploadZoneActive : {}),
        }}
      >
        <input {...getInputProps()} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              ...forgeStyles.iconCircle,
              ...(isDragActive ? forgeStyles.iconCircleActive : {}),
            }}
          >
            <Icon name="Upload" size={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={forgeStyles.heading}>
              {isDragActive ? 'Pus\u0165te soubory zde' : 'Nahrajte 3D modely'}
            </h3>
            <p style={forgeStyles.subText}>
              P\u0159et\u00e1hn\u011bte STL nebo OBJ soubory nebo klikn\u011bte pro v\u00fdb\u011br
            </p>
            <p style={forgeStyles.mutedText}>Maxim\u00e1ln\u00ed velikost: 50MB na soubor</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={forgeStyles.pill}>.STL</span>
            <span style={forgeStyles.pill}>.OBJ</span>
          </div>

          <Button variant="outline" size="sm">
            <Icon name="FolderOpen" size={16} className="mr-2" />
            Vybrat soubory
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={forgeStyles.sectionLabel}>Nahr\u00e1v\u00e1n\u00ed soubor\u016f</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} style={forgeStyles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--forge-text-base)', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>
                  Nahr\u00e1v\u00e1n\u00ed...
                </span>
                <span style={{ fontSize: 'var(--forge-text-base)', color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-mono)' }}>
                  {progress}%
                </span>
              </div>
              <div style={forgeStyles.progressBar}>
                <div style={{ ...forgeStyles.progressFill, width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={forgeStyles.sectionLabel}>
              Nahran\u00e9 soubory ({uploadedFiles.length})
            </h4>
            <Button variant="ghost" size="sm">
              <Icon name="MoreHorizontal" size={16} />
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {uploadedFiles.map((file) => (
              <div key={file?.id} style={forgeStyles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={forgeStyles.fileIcon}>
                      <Icon name="Box" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
                    </div>
                    <div>
                      <p style={forgeStyles.fileName}>{file?.name}</p>
                      <p style={forgeStyles.fileMeta}>
                        {formatFileSize(file?.size)} {'\u2022'} {file?.type}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={forgeStyles.badge}>
                      <Icon name="CheckCircle" size={16} />
                      <span>Hotovo</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveFile(file?.id)}>
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Format Info */}
      <div style={forgeStyles.infoBox}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Icon name="Info" size={16} style={{ color: 'var(--forge-accent-primary)', marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ fontSize: 'var(--forge-text-base)', fontWeight: 500, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>
              Podporovan\u00e9 form\u00e1ty
            </p>
            <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
              STL, OBJ soubory {'\u2022'} Maxim\u00e1ln\u00ed velikost 50MB {'\u2022'} V\u00edce soubor\u016f najednou
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;
