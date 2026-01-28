import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

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
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon name="Upload" size={24} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isDragActive ? 'Pusťte soubory zde' : 'Nahrajte 3D modely'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Přetáhněte STL nebo OBJ soubory nebo klikněte pro výběr
            </p>
            <p className="text-xs text-muted-foreground">Maximální velikost: 50MB na soubor</p>
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
          <h4 className="text-sm font-medium text-foreground">Nahrávání souborů</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Nahrávání...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Nahrané soubory ({uploadedFiles.length})</h4>
            <Button variant="ghost" size="sm">
              <Icon name="MoreHorizontal" size={16} />
            </Button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file?.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="Box" size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{file?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file?.size)} • {file?.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-success">
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
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Podporované formáty</p>
            <p className="text-xs text-muted-foreground">
              STL, OBJ soubory • Maximální velikost 50MB • Více souborů najednou
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;
