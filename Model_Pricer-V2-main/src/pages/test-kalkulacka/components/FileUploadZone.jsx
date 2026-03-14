import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { SAMPLE_MODELS } from '../../../lib/sampleModels';
import { useLanguage } from '../../../contexts/LanguageContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_EXTENSIONS = ['.stl', '.obj', '.3mf'];

// --- Helpers ---

function isElementInViewport(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right > 0
  );
}

// --- Inline SVG icons for file types ---

const FileTypeIcon = ({ type }) => {
  const label = type.toUpperCase();
  const colors = {
    stl: 'var(--forge-accent-primary)',
    obj: 'var(--forge-accent-secondary, #F59E0B)',
    '3mf': 'var(--forge-info, #6366F1)',
  };
  const color = colors[type] || 'var(--forge-text-muted)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
        <path
          d="M2 4C2 2.89543 2.89543 2 4 2H17L26 11V28C26 29.1046 25.1046 30 24 30H4C2.89543 30 2 29.1046 2 28V4Z"
          fill="var(--forge-bg-elevated)"
          stroke={color}
          strokeWidth="1.5"
        />
        <path
          d="M17 2L26 11H19C17.8954 11 17 10.1046 17 9V2Z"
          fill={color}
          opacity="0.2"
        />
        <text
          x="14"
          y="23"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fontFamily="var(--forge-font-mono)"
          fill={color}
        >
          {label}
        </text>
      </svg>
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'var(--forge-font-mono)',
          color: 'var(--forge-text-muted)',
          letterSpacing: '0.04em',
        }}
      >
        .{type}
      </span>
    </div>
  );
};

// --- SVG icons for sample shapes ---

const ShapeIcon = ({ shape }) => {
  const color = 'var(--forge-accent-primary)';
  const muted = 'var(--forge-text-muted)';

  if (shape === 'cube') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M16 28V16M4 10L16 16M28 10L16 16" stroke={muted} strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }

  if (shape === 'cylinder') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <ellipse cx="16" cy="8" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M6 8V24C6 26.2 10.5 28 16 28C21.5 28 26 26.2 26 24V8" stroke={color} strokeWidth="1.5" fill="none" />
        <ellipse cx="16" cy="24" rx="10" ry="4" stroke={muted} strokeWidth="0.75" opacity="0.3" fill="none" />
      </svg>
    );
  }

  if (shape === 'sphere') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill="none" />
        <ellipse cx="16" cy="16" rx="6" ry="12" stroke={muted} strokeWidth="0.75" opacity="0.4" fill="none" />
        <ellipse cx="16" cy="16" rx="12" ry="4" stroke={muted} strokeWidth="0.75" opacity="0.4" fill="none" />
      </svg>
    );
  }

  return null;
};

// --- Styles ---

const forgeStyles = {
  uploadZone: {
    background: 'var(--forge-bg-void)',
    border: '2px dashed var(--forge-border-active)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s var(--forge-ease-out-expo)',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadZoneActive: {
    border: '2px solid var(--forge-accent-primary)',
    background: 'rgba(0, 212, 170, 0.06)',
    transform: 'scale(1.02)',
    boxShadow: '0 0 0 4px rgba(0, 212, 170, 0.1)',
  },
  uploadZoneSuccess: {
    border: '2px solid var(--forge-success)',
    background: 'rgba(16, 185, 129, 0.06)',
  },
  uploadZoneError: {
    border: '2px solid var(--forge-error, #EF4444)',
    background: 'rgba(239, 68, 68, 0.04)',
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
    transition: 'all 0.3s',
  },
  iconCircleActive: {
    background: 'var(--forge-accent-primary)',
    color: '#08090C',
    transform: 'scale(1.1)',
  },
  iconCircleSuccess: {
    background: 'var(--forge-success)',
    color: '#08090C',
    transform: 'scale(1.1)',
  },
  heading: {
    fontSize: 'var(--forge-text-xl)',
    fontFamily: 'var(--forge-font-heading)',
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
  // Validation error messages
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--forge-radius-md)',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-error, #EF4444)',
    fontFamily: 'var(--forge-font-body)',
  },
  // Sample models section
  sampleSection: {
    borderTop: '1px solid var(--forge-border-default)',
    paddingTop: '1rem',
    marginTop: '0.5rem',
  },
  sampleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.75rem',
    background: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '5.5rem',
  },
  sampleCardHover: {
    borderColor: 'var(--forge-accent-primary)',
    background: 'rgba(0, 212, 170, 0.04)',
  },
};

// --- CSS keyframes injected once ---
const STYLE_ID = 'tk-upload-zone-keyframes';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes tk-drag-pulse {
      0%, 100% { border-color: rgba(0, 212, 170, 0.4); }
      50% { border-color: rgba(0, 212, 170, 1); }
    }
    @keyframes tk-success-flash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    .tk-upload-zone-dragging {
      animation: tk-drag-pulse 1s ease-in-out infinite !important;
    }
    .tk-upload-success-overlay {
      position: absolute;
      inset: 0;
      background: rgba(16, 185, 129, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: tk-success-flash 1.2s ease-out forwards;
      pointer-events: none;
      border-radius: inherit;
    }
    .tk-upload-success-check {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--forge-success);
      color: #08090C;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes tk-paste-flash {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.15); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .tk-upload-zone-paste-flash {
      animation: tk-paste-flash 0.8s ease-out !important;
      border-color: var(--forge-success) !important;
    }
    .tk-paste-hint {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .tk-paste-hint:hover {
      opacity: 1;
    }
    @keyframes tk-url-progress-stripe {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }
    .tk-url-progress-bar {
      background-image: linear-gradient(
        45deg,
        rgba(255,255,255,0.1) 25%, transparent 25%,
        transparent 50%, rgba(255,255,255,0.1) 50%,
        rgba(255,255,255,0.1) 75%, transparent 75%
      );
      background-size: 40px 40px;
      animation: tk-url-progress-stripe 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

const FileUploadZone = ({ onFilesUploaded, uploadedFiles, onRemoveFile }) => {
  const { t } = useLanguage();
  const [uploadProgress, setUploadProgress] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredSample, setHoveredSample] = useState(null);
  const [generatingSample, setGeneratingSample] = useState(null);
  const [pasteFlash, setPasteFlash] = useState(false);
  const [urlDownloading, setUrlDownloading] = useState(null); // { url, progress, name }
  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);
  const pasteFlashTimerRef = useRef(null);
  const zoneRef = useRef(null);
  const urlAbortRef = useRef(null);
  const onDropRef = useRef(null);

  useEffect(() => {
    ensureKeyframes();
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (pasteFlashTimerRef.current) clearTimeout(pasteFlashTimerRef.current);
      if (urlAbortRef.current) urlAbortRef.current.abort();
    };
  }, []);

  // --- Validation ---

  const validateFile = useCallback(
    (file) => {
      const errors = [];
      const ext = file.name ? '.' + file.name.split('.').pop().toLowerCase() : '';

      // Check extension
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        errors.push({
          type: 'format',
          message: `"${file.name}" - ${t('calc.upload.errFormat')}: ${ACCEPTED_EXTENSIONS.join(', ')}`,
        });
      }

      // Check size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        errors.push({
          type: 'size',
          message: `"${file.name}" (${sizeMB} MB) - ${t('calc.upload.errSize')}`,
        });
      }

      // Check duplicate
      if (uploadedFiles?.some((f) => f.name === file.name)) {
        errors.push({
          type: 'duplicate',
          message: `"${file.name}" - ${t('calc.upload.errDuplicate')}`,
        });
      }

      return errors;
    },
    [uploadedFiles]
  );

  // --- Success flash ---

  const triggerSuccess = useCallback(() => {
    setShowSuccess(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setShowSuccess(false), 1200);
    // Announce to screen readers
    const announcer = document.getElementById('tk-upload-announcer');
    if (announcer) announcer.textContent = t('calc.upload.announceSuccess');
  }, []);

  // --- Show validation errors with auto-dismiss ---

  const showValidationErrors = useCallback((errors) => {
    setValidationErrors(errors);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setValidationErrors([]), 6000);
    // Announce errors to screen readers
    const announcer = document.getElementById('tk-upload-announcer');
    if (announcer && errors.length > 0) {
      announcer.textContent = errors.map(e => e.message).join('. ');
    }
  }, []);

  // --- Paste flash ---

  const triggerPasteFlash = useCallback(() => {
    setPasteFlash(true);
    if (pasteFlashTimerRef.current) clearTimeout(pasteFlashTimerRef.current);
    pasteFlashTimerRef.current = setTimeout(() => setPasteFlash(false), 1500);
  }, []);

  // --- URL file fetcher ---

  const fetchFileFromUrl = useCallback(
    async (url) => {
      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const fileName = urlPath.split('/').pop() || 'downloaded-model.stl';
      const ext = '.' + fileName.split('.').pop().toLowerCase();

      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        showValidationErrors([{
          type: 'format',
          message: `URL: "${fileName}" - ${t('calc.upload.errUrlFormat')}: ${ACCEPTED_EXTENSIONS.join(', ')}`,
        }]);
        return;
      }

      const controller = new AbortController();
      urlAbortRef.current = controller;
      setUrlDownloading({ url, progress: 0, name: fileName });

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

        if (totalSize > MAX_FILE_SIZE) {
          const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
          showValidationErrors([{
            type: 'size',
            message: `URL: "${fileName}" (${sizeMB} MB) - ${t('calc.upload.errUrlSize')}`,
          }]);
          setUrlDownloading(null);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          // Fallback: no streaming support
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: 'application/octet-stream' });
          setUrlDownloading(null);
          onDropRef.current?.([file], []);
          return;
        }

        const chunks = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;

          if (totalSize > 0) {
            const progress = Math.min(Math.round((receivedLength / totalSize) * 100), 99);
            setUrlDownloading((prev) => prev ? { ...prev, progress } : null);
          } else {
            // Unknown size: show indeterminate-ish progress
            setUrlDownloading((prev) => prev ? { ...prev, progress: Math.min(prev.progress + 2, 95) } : null);
          }

          // Check size during download
          if (receivedLength > MAX_FILE_SIZE) {
            controller.abort();
            const sizeMB = (receivedLength / (1024 * 1024)).toFixed(1);
            showValidationErrors([{
              type: 'size',
              message: `URL: "${fileName}" (${sizeMB}+ MB) - ${t('calc.upload.errUrlSize')}`,
            }]);
            setUrlDownloading(null);
            return;
          }
        }

        const blob = new Blob(chunks);
        const file = new File([blob], fileName, { type: 'application/octet-stream' });
        setUrlDownloading(null);
        onDropRef.current?.([file], []);
      } catch (err) {
        setUrlDownloading(null);
        if (err.name === 'AbortError') return;

        // CORS or network error
        const isCors = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
        showValidationErrors([{
          type: 'error',
          message: isCors
            ? t('calc.upload.errUrlCors')
            : `${t('calc.upload.errUrlGeneral')}: ${err.message}`,
        }]);
      }
    },
    [showValidationErrors]
    // Note: onDrop is added after it's defined, via the paste handler which calls processFiles
  );

  // --- File drop handler ---

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      const allErrors = [];

      // Handle rejected files (from react-dropzone built-in validation)
      if (rejectedFiles?.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const file = rejection?.file;
          if (!file) return;
          const fileErrors = validateFile(file);
          if (fileErrors.length > 0) {
            allErrors.push(...fileErrors);
          } else {
            // Generic rejection
            allErrors.push({
              type: 'rejected',
              message: `"${file.name}" ${t('calc.upload.errRejected')}`,
            });
          }
        });
      }

      // Validate accepted files for duplicates
      const filesToProcess = [];
      acceptedFiles?.forEach((file) => {
        const fileErrors = validateFile(file);
        const blockingErrors = fileErrors.filter((e) => e.type !== 'duplicate');
        if (blockingErrors.length > 0) {
          allErrors.push(...blockingErrors);
        } else if (fileErrors.some((e) => e.type === 'duplicate')) {
          allErrors.push(...fileErrors.filter((e) => e.type === 'duplicate'));
        } else {
          filesToProcess.push(file);
        }
      });

      if (allErrors.length > 0) {
        showValidationErrors(allErrors);
      }

      // Process valid files
      filesToProcess.forEach((file) => {
        const fileId = crypto.randomUUID();
        setUploadProgress((prev) => ({ ...prev, [fileId]: { progress: 0, name: file.name } }));

        let progress = 0;
        // Phase labels shown during the fake progress animation
        const phaseLabel = (pct) => {
          if (pct < 30) return t('calc.pricing.processingStepUpload') + '…';
          if (pct < 60) return t('calc.pricing.processingStepAnalyze') + '…';
          if (pct < 90) return t('calc.pricing.processingStepCalculate') + '…';
          return t('calc.pricing.processingStepCalculate') + '…';
        };
        const interval = setInterval(() => {
          progress += 10;

          if (progress >= 100) {
            clearInterval(interval);
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });

            triggerSuccess();

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

          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: { progress, name: file.name, phase: phaseLabel(progress) },
          }));
        }, 120);
      });
    },
    [onFilesUploaded, validateFile, triggerSuccess, showValidationErrors]
  );

  // Keep onDropRef in sync for async callers (fetchFileFromUrl)
  onDropRef.current = onDrop;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.stl'],
      'application/x-tgif': ['.obj'],
      'model/stl': ['.stl'],
      'model/obj': ['.obj'],
      'model/3mf': ['.3mf'],
      'application/vnd.ms-package.3dmanufacturing-3dmodel+xml': ['.3mf'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // --- Clipboard paste handler ---

  const handlePaste = useCallback(
    (event) => {
      // Only handle paste when the upload zone is visible on screen
      if (zoneRef.current && !isElementInViewport(zoneRef.current)) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Check for files in clipboard
      const files = Array.from(clipboardData.files || []);

      if (files.length > 0) {
        event.preventDefault();

        // Filter for accepted file types
        const validFiles = [];
        const invalidFiles = [];

        files.forEach((file) => {
          const ext = file.name ? '.' + file.name.split('.').pop().toLowerCase() : '';
          if (ACCEPTED_EXTENSIONS.includes(ext)) {
            validFiles.push(file);
          } else {
            invalidFiles.push(file);
          }
        });

        if (invalidFiles.length > 0 && validFiles.length === 0) {
          showValidationErrors([{
            type: 'format',
            message: `${t('calc.upload.errImage')}`,
          }]);
          return;
        }

        if (validFiles.length > 0) {
          triggerPasteFlash();
          onDrop(validFiles, invalidFiles.map((f) => ({ file: f, errors: [] })));
        }
        return;
      }

      // Check for URL text in clipboard
      const text = clipboardData.getData('text/plain')?.trim();
      if (text) {
        try {
          const url = new URL(text);
          // Only handle http(s) URLs that end with accepted extension
          if ((url.protocol === 'http:' || url.protocol === 'https:')) {
            const urlExt = '.' + url.pathname.split('.').pop().toLowerCase();
            if (ACCEPTED_EXTENSIONS.includes(urlExt)) {
              event.preventDefault();
              triggerPasteFlash();
              fetchFileFromUrl(text);
              return;
            }
          }
        } catch {
          // Not a valid URL — ignore, let default paste behavior work
        }
      }

      // If clipboard contains images or non-model data, show a hint
      if (clipboardData.types?.includes('image/png') || clipboardData.types?.includes('image/jpeg')) {
        // Don't prevent default for images — they might be pasted into other fields
        // But if the upload zone is focused, show a hint
        if (document.activeElement === zoneRef.current || zoneRef.current?.contains(document.activeElement)) {
          showValidationErrors([{
            type: 'format',
            message: t('calc.upload.errImage'),
          }]);
        }
      }
    },
    [onDrop, showValidationErrors, triggerPasteFlash, fetchFileFromUrl]
  );

  // --- Register paste listener on document ---

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // --- URL drag-and-drop handler ---

  const handleUrlDragDrop = useCallback(
    (event) => {
      // Check if text/uri-list or text/plain was dropped (URL drop)
      const text = event.dataTransfer?.getData('text/plain')?.trim() ||
                   event.dataTransfer?.getData('text/uri-list')?.trim();

      if (!text) return false;

      try {
        const url = new URL(text);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          const urlExt = '.' + url.pathname.split('.').pop().toLowerCase();
          if (ACCEPTED_EXTENSIONS.includes(urlExt)) {
            fetchFileFromUrl(text);
            return true;
          }
        }
      } catch {
        // Not a valid URL
      }
      return false;
    },
    [fetchFileFromUrl]
  );

  // --- Sample model handler ---

  const handleSampleModel = useCallback(
    (sample) => {
      setGeneratingSample(sample.id);
      // Use requestAnimationFrame to let the UI update before generating
      requestAnimationFrame(() => {
        try {
          const file = sample.generate();
          onDrop([file], []);
        } catch (err) {
          showValidationErrors([
            { type: 'error', message: `${t('calc.upload.errSampleGen')}: ${err.message}` },
          ]);
        } finally {
          setGeneratingSample(null);
        }
      });
    },
    [onDrop, showValidationErrors]
  );

  // --- Helpers ---

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Compute zone styles ---

  const zoneStyle = {
    ...forgeStyles.uploadZone,
    ...(isDragActive ? forgeStyles.uploadZoneActive : {}),
    ...(showSuccess ? forgeStyles.uploadZoneSuccess : {}),
    ...(validationErrors.length > 0 ? forgeStyles.uploadZoneError : {}),
  };

  const iconStyle = {
    ...forgeStyles.iconCircle,
    ...(isDragActive ? forgeStyles.iconCircleActive : {}),
    ...(showSuccess ? forgeStyles.iconCircleSuccess : {}),
  };

  const zoneClassName = [
    'tk-upload-zone',
    isDragActive ? 'tk-upload-zone-dragging' : '',
    pasteFlash ? 'tk-upload-zone-paste-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} role="region" aria-label={t('calc.upload.ariaRegion')}>
      {/* Screen reader announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        id="tk-upload-announcer"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
      {/* Upload Zone */}
      <div
        {...getRootProps({
          onDrop: (event) => {
            // Try URL drop first; if not a URL, let react-dropzone handle it
            handleUrlDragDrop(event);
          },
        })}
        ref={zoneRef}
        className={zoneClassName}
        style={zoneStyle}
        tabIndex={0}
        role="button"
        aria-label={t('calc.upload.ariaZone')}
      >
        <input {...getInputProps()} aria-label={t('calc.upload.ariaInput')} />

        {/* Success overlay */}
        {showSuccess && (
          <div className="tk-upload-success-overlay">
            <div className="tk-upload-success-check">
              <Icon name="Check" size={28} />
            </div>
          </div>
        )}

        {/* Paste flash overlay */}
        {pasteFlash && (
          <div className="tk-upload-success-overlay" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div className="tk-upload-success-check">
                <Icon name="Clipboard" size={22} />
              </div>
              <span style={{
                fontSize: 'var(--forge-text-sm)',
                color: 'var(--forge-success)',
                fontFamily: 'var(--forge-font-body)',
                fontWeight: 500,
              }}>
                {t('calc.upload.pasteSuccess')}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="tk-upload-zone-icon" style={iconStyle}>
            {showSuccess ? (
              <Icon name="CheckCircle" size={24} />
            ) : pasteFlash ? (
              <Icon name="Clipboard" size={24} />
            ) : isDragActive ? (
              <Icon name="Download" size={24} />
            ) : (
              <Icon name="Upload" size={24} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 className="tk-upload-zone-heading" style={forgeStyles.heading}>
              {showSuccess
                ? t('calc.upload.headingSuccess')
                : pasteFlash
                  ? t('calc.upload.headingPaste')
                  : isDragActive
                    ? t('calc.upload.headingDrag')
                    : t('calc.upload.heading')}
            </h3>
            <p className="tk-upload-zone-sub" style={forgeStyles.subText}>
              {isDragActive
                ? t('calc.upload.subDrag')
                : t('calc.upload.subDefault')}
            </p>
            <p style={forgeStyles.mutedText}>{t('calc.upload.maxSize')}</p>
            {/* Paste hint */}
            {!isDragActive && !showSuccess && !pasteFlash && (
              <p className="tk-paste-hint" style={{
                ...forgeStyles.mutedText,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                marginTop: '0.125rem',
              }}>
                <Icon name="Clipboard" size={12} />
                <span>{t('calc.upload.pasteHint')}</span>
              </p>
            )}
          </div>

          {/* File type icons */}
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
            <FileTypeIcon type="stl" />
            <FileTypeIcon type="obj" />
            <FileTypeIcon type="3mf" />
          </div>

          <Button variant="outline" size="sm" tabIndex={-1} aria-hidden="true">
            <Icon name="FolderOpen" size={16} className="mr-2" />
            {t('calc.upload.selectFiles')}
          </Button>

          {/* Sample Models Section */}
          <div style={forgeStyles.sampleSection}>
            <p
              style={{
                fontSize: 'var(--forge-text-xs)',
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-body)',
                marginBottom: '0.625rem',
              }}
            >
              {t('calc.upload.samplePrompt')}
            </p>
            <div
              style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {SAMPLE_MODELS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSampleModel(sample);
                  }}
                  onMouseEnter={() => setHoveredSample(sample.id)}
                  onMouseLeave={() => setHoveredSample(null)}
                  disabled={generatingSample === sample.id}
                  style={{
                    ...forgeStyles.sampleCard,
                    ...(hoveredSample === sample.id ? forgeStyles.sampleCardHover : {}),
                    opacity: generatingSample === sample.id ? 0.6 : 1,
                    border: '1px solid var(--forge-border-default)',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                  aria-label={`${t('calc.upload.ariaRegion')}: ${sample.name} (${sample.description})`}
                >
                  <ShapeIcon shape={sample.icon} />
                  <span
                    style={{
                      fontSize: 'var(--forge-text-xs)',
                      fontWeight: 500,
                      color: 'var(--forge-text-primary)',
                      fontFamily: 'var(--forge-font-body)',
                    }}
                  >
                    {sample.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--forge-text-muted)',
                      fontFamily: 'var(--forge-font-mono)',
                    }}
                  >
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {validationErrors.map((error, idx) => (
            <div key={idx} style={forgeStyles.errorMessage} role="alert">
              <Icon
                name={
                  error.type === 'size'
                    ? 'HardDrive'
                    : error.type === 'duplicate'
                      ? 'Copy'
                      : error.type === 'format'
                        ? 'FileX'
                        : 'AlertTriangle'
                }
                size={16}
                style={{ flexShrink: 0 }}
              />
              <span>{error.message}</span>
              <button
                type="button"
                onClick={() => {
                  setValidationErrors((prev) => prev.filter((_, i) => i !== idx));
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'var(--forge-error, #EF4444)',
                  cursor: 'pointer',
                  padding: '0.125rem',
                  display: 'flex',
                }}
                aria-label={t('calc.upload.closeError')}
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL Download Progress */}
      {urlDownloading && (
        <div style={forgeStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Icon name="Globe" size={16} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: 'var(--forge-text-sm)',
                  color: 'var(--forge-text-primary)',
                  fontFamily: 'var(--forge-font-body)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {t('calc.upload.downloading')}: {urlDownloading.name}
                </span>
                <span style={{
                  fontSize: 'var(--forge-text-sm)',
                  color: 'var(--forge-accent-primary)',
                  fontFamily: 'var(--forge-font-mono)',
                  marginLeft: '0.5rem',
                  flexShrink: 0,
                }}>
                  {urlDownloading.progress}%
                </span>
              </div>
              <div
                style={forgeStyles.progressBar}
                role="progressbar"
                aria-valuenow={urlDownloading.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('calc.upload.downloading')} ${urlDownloading.name}: ${urlDownloading.progress}%`}
              >
                <div
                  className="tk-url-progress-bar"
                  style={{ ...forgeStyles.progressFill, width: `${urlDownloading.progress}%` }}
                />
              </div>
              <p style={{
                fontSize: '10px',
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-mono)',
                marginTop: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {urlDownloading.url}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (urlAbortRef.current) urlAbortRef.current.abort();
                setUrlDownloading(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--forge-text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                flexShrink: 0,
              }}
              aria-label={t('calc.upload.cancelDownload')}
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={forgeStyles.sectionLabel}>{t('calc.upload.progressSection')}</h4>
          {Object.entries(uploadProgress).map(([fileId, data]) => (
            <div key={fileId} style={forgeStyles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {data.name || t('calc.upload.progressFallback')}
                </span>
                <span style={{ fontSize: 'var(--forge-text-sm)', color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-mono)', flexShrink: 0 }} aria-hidden="true">
                  {data.progress}%
                </span>
              </div>
              {data.phase && (
                <p style={{ fontSize: '10px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)', marginBottom: '0.375rem' }}>
                  {data.phase}
                </p>
              )}
              <div
                style={forgeStyles.progressBar}
                role="progressbar"
                aria-valuenow={data.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('calc.upload.progressSection')} ${data.name || ''}: ${data.progress}%`}
              >
                <div style={{ ...forgeStyles.progressFill, width: `${data.progress}%` }} />
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
              {t('calc.upload.uploadedSection')} ({uploadedFiles.length})
            </h4>
            <Button variant="ghost" size="sm" aria-label={t('calc.upload.ariaMoreOptions')}>
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
                        {formatFileSize(file?.size)} {'•'} {file?.type || file?.name?.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={forgeStyles.badge}>
                      <Icon name="CheckCircle" size={16} />
                      <span>Hotovo</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveFile(file?.id)} aria-label={`Odebrat soubor ${file?.name}`}>
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
              Podporovane formaty
            </p>
            <p style={{ fontSize: 'var(--forge-text-xs)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
              STL, OBJ, 3MF soubory {'•'} Maximalni velikost 50 MB {'•'} Vice souboru najednou {'•'} Ctrl+V pro vlozeni ze schranky
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;
