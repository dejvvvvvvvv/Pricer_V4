import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FileUploadZone = ({ onFilesUploaded, uploadedFiles, onRemoveFile, theme }) => {
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles?.length > 0) {
        rejectedFiles.forEach((file) => {
          console.error(`File ${file?.file?.name} was rejected:`, file?.errors);
        });
      }

      acceptedFiles?.forEach((file) => {
        const fileId = Date.now() + Math.random();
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;

          if (progress >= 100) {
            clearInterval(interval);
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });

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
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const borderRadius = theme?.cornerRadius ? `${theme.cornerRadius}px` : '12px';

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className="relative border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200"
        style={{
          borderRadius,
          borderColor: isDragActive ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-border, #E5E7EB)',
          backgroundColor: isDragActive ? 'var(--widget-btn-primary, #2563EB)10' : 'transparent',
        }}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isDragActive ? 'var(--widget-btn-primary, #2563EB)' : 'var(--widget-card, #F9FAFB)',
              color: isDragActive ? 'var(--widget-btn-text, #FFFFFF)' : 'var(--widget-muted, #6B7280)',
            }}
          >
            <Icon name="Upload" size={24} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
              {isDragActive ? 'Pustte soubory zde' : 'Nahrajte 3D modely'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              Pretahnete STL nebo OBJ soubory nebo kliknete pro vyber
            </p>
            <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              Maximalni velikost: 50MB na soubor
            </p>
          </div>

          <Button variant="outline" size="sm">
            <Icon name="FolderOpen" size={16} className="mr-2" />
            Vybrat soubory
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
            Nahravani souboru
          </h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div
              key={fileId}
              className="p-4"
              style={{
                backgroundColor: 'var(--widget-card, #F9FAFB)',
                border: '1px solid var(--widget-border, #E5E7EB)',
                borderRadius,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--widget-text, #374151)' }}>Nahravani...</span>
                <span className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--widget-card, #F9FAFB)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: 'var(--widget-btn-primary, #2563EB)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
              Nahrane soubory ({uploadedFiles.length})
            </h4>
            <Button variant="ghost" size="sm">
              <Icon name="MoreHorizontal" size={16} />
            </Button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file?.id}
                className="p-4"
                style={{
                  backgroundColor: 'var(--widget-card, #F9FAFB)',
                  border: '1px solid var(--widget-border, #E5E7EB)',
                  borderRadius,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--widget-btn-primary, #2563EB)20' }}
                    >
                      <Icon name="Box" size={20} style={{ color: 'var(--widget-btn-primary, #2563EB)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
                        {file?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
                        {formatFileSize(file?.size)} • {file?.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-green-600">
                      <Icon name="CheckCircle" size={16} />
                      <span className="text-xs">Hotovo</span>
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
      <div
        className="p-4"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)30',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} style={{ color: 'var(--widget-btn-primary, #2563EB)', marginTop: '2px' }} />
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: 'var(--widget-header, #1F2937)' }}>
              Podporovane formaty
            </p>
            <p className="text-xs" style={{ color: 'var(--widget-muted, #6B7280)' }}>
              STL, OBJ soubory • Maximalni velikost 50MB • Vice souboru najednou
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;
