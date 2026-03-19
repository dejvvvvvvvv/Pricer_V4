// src/pages/model-upload/index.jsx
// Public Model Upload page — upload 3D models, preview, then navigate to calculator.
import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import * as THREE from 'three';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './ModelUpload.css';

/* ── Constants ─────────────────────────────────────────────────────────── */
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_EXTENSIONS = ['.stl', '.obj', '.3mf'];
const SESSION_KEY = 'modelpricer:upload-history';
const TEAL = { color: '#00D4AA', metalness: 0.15, roughness: 0.45 };

/* ── Supported formats config ──────────────────────────────────────────── */
const FORMATS = [
  { ext: 'STL', supported: true, icon: 'Box', desc: 'Stereolithography' },
  { ext: '3MF', supported: true, icon: 'Package', desc: '3D Manufacturing' },
  { ext: 'OBJ', supported: true, icon: 'Shapes', desc: 'Wavefront OBJ' },
  { ext: 'STEP', supported: false, icon: 'Cog', desc: 'CAD Exchange' },
];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function getFileExt(name) {
  return String(name || '').split('.').pop()?.toLowerCase() || '';
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('cs-CZ');
}

/** Validate a single file. Returns { valid, reason } */
function validateFile(file, cs) {
  const ext = getFileExt(file.name);
  const supportedExts = ACCEPTED_EXTENSIONS.map((e) => e.replace('.', ''));

  if (!supportedExts.includes(ext)) {
    return {
      valid: false,
      reason: cs
        ? `Nepodporovany format .${ext}. Pouzijte STL, OBJ nebo 3MF.`
        : `Unsupported format .${ext}. Use STL, OBJ, or 3MF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: cs
        ? `Soubor je prilis velky (${formatFileSize(file.size)}). Maximum je ${formatFileSize(MAX_FILE_SIZE)}.`
        : `File is too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      reason: cs ? 'Soubor je prazdny.' : 'File is empty.',
    };
  }

  return { valid: true, reason: null };
}

/** Load and save session upload history via sessionStorage. */
function loadHistory() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    const trimmed = items.slice(0, 20);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

/* ── Lightweight 3D Model Components ───────────────────────────────────── */

function STLPreview({ url, onInfo }) {
  const geometry = useLoader(STLLoader, url);

  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }, [geometry]);

  useEffect(() => {
    if (!geometry || typeof onInfo !== 'function') return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box?.getSize(size);
    const pos = geometry.attributes?.position;
    const vertexCount = pos?.count || 0;
    const idx = geometry.getIndex?.() || geometry.index;
    const triangleCount = idx?.array
      ? Math.floor(idx.array.length / 3)
      : Math.floor(vertexCount / 3);
    onInfo({
      dimX: size.x,
      dimY: size.y,
      dimZ: size.z,
      triangleCount,
      vertexCount,
    });
  }, [geometry, onInfo]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial {...TEAL} />
    </mesh>
  );
}

function GroupPreview({ url, LoaderClass, onInfo }) {
  const group = useLoader(LoaderClass, url);

  const processed = useMemo(() => {
    if (!group) return null;
    const cloned = group.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.translate(-center.x, -center.y, -center.z);
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        child.material = new THREE.MeshStandardMaterial(TEAL);
      }
    });
    return cloned;
  }, [group]);

  useEffect(() => {
    if (!processed || typeof onInfo !== 'function') return;
    const box = new THREE.Box3().setFromObject(processed);
    const size = new THREE.Vector3();
    box.getSize(size);
    let totalTriangles = 0;
    let totalVertices = 0;
    processed.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const pos = child.geometry.attributes?.position;
        if (pos) {
          totalVertices += pos.count || 0;
          const idx = child.geometry.getIndex?.() || child.geometry.index;
          totalTriangles += idx?.array
            ? Math.floor(idx.array.length / 3)
            : Math.floor((pos.count || 0) / 3);
        }
      }
    });
    onInfo({
      dimX: size.x,
      dimY: size.y,
      dimZ: size.z,
      triangleCount: totalTriangles,
      vertexCount: totalVertices,
    });
  }, [processed, onInfo]);

  if (!processed) return null;
  return <primitive object={processed} />;
}

function ModelPreviewScene({ url, ext, onInfo }) {
  switch (ext) {
    case 'stl':
      return <STLPreview url={url} onInfo={onInfo} />;
    case 'obj':
      return <GroupPreview url={url} LoaderClass={OBJLoader} onInfo={onInfo} />;
    case '3mf':
      return <GroupPreview url={url} LoaderClass={ThreeMFLoader} onInfo={onInfo} />;
    default:
      return null;
  }
}

/* ── File Type Icon SVG ────────────────────────────────────────────────── */
function FileTypeIcon({ ext, size = 40 }) {
  const colors = {
    stl: '#00D4AA',
    '3mf': '#6C63FF',
    obj: '#FF6B35',
    step: '#FFB547',
  };
  const color = colors[ext?.toLowerCase()] || '#7A8291';

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="24" height="32" rx="3" fill="currentColor" opacity="0.08" stroke={color} strokeWidth="1.5" />
      <path d="M22 2v8a2 2 0 0 0 2 2h6" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="8" y="22" width="16" height="8" rx="2" fill={color} opacity="0.15" />
      <text x="16" y="28.5" textAnchor="middle" fill={color} fontSize="6" fontWeight="700" fontFamily="monospace">
        {(ext || '').toUpperCase()}
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * FILE LIST ITEM — individual file in the multi-file queue
 * ══════════════════════════════════════════════════════════════════════════ */
function FileListItem({ item, cs, isActive, onSelect, onRemove, onRetry, labels = {} }) {
  const statusClass = item.status === 'error'
    ? 'mu-file-item--error'
    : item.status === 'done'
      ? 'mu-file-item--done'
      : item.status === 'uploading'
        ? 'mu-file-item--uploading'
        : '';

  return (
    <div
      className={`mu-file-item ${statusClass} ${isActive ? 'mu-file-item--active' : ''}`}
      role="listitem"
    >
      <button
        className="mu-file-item__main"
        onClick={() => item.status === 'done' && onSelect(item)}
        type="button"
        disabled={item.status !== 'done'}
        aria-label={`${item.file.name} — ${formatFileSize(item.file.size)}`}
      >
        <div className="mu-file-item__icon">
          <FileTypeIcon ext={getFileExt(item.file.name)} size={32} />
        </div>
        <div className="mu-file-item__info">
          <div className="mu-file-item__name" title={item.file.name}>
            {item.file.name}
          </div>
          <div className="mu-file-item__meta">
            {getFileExt(item.file.name).toUpperCase()} &middot; {formatFileSize(item.file.size)}
          </div>
        </div>
        <div className="mu-file-item__status">
          {item.status === 'uploading' && (
            <Icon name="Loader2" size={16} className="mu-spin" style={{ color: 'var(--forge-accent-primary)' }} />
          )}
          {item.status === 'done' && (
            <Icon name="CheckCircle2" size={16} style={{ color: 'var(--forge-success, #00D4AA)' }} />
          )}
          {item.status === 'error' && (
            <Icon name="XCircle" size={16} style={{ color: 'var(--forge-error, #FF4757)' }} />
          )}
        </div>
      </button>

      {/* Progress bar for uploading state */}
      {item.status === 'uploading' && (
        <div className="mu-file-item__progress" role="progressbar" aria-valuenow={Math.round(item.progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="mu-file-item__progress-fill" style={{ width: `${item.progress}%` }} />
        </div>
      )}

      {/* Error reason + retry */}
      {item.status === 'error' && item.reason && (
        <div className="mu-file-item__error">
          <Icon name="AlertCircle" size={12} />
          <span>{item.reason}</span>
          {onRetry && (
            <button
              className="mu-file-item__retry"
              onClick={(e) => { e.stopPropagation(); onRetry(item); }}
              type="button"
              aria-label={labels.retryLabel || (cs ? 'Zkusit znovu' : 'Retry')}
            >
              <Icon name="RotateCcw" size={11} />
              {labels.retry || (cs ? 'Znovu' : 'Retry')}
            </button>
          )}
        </div>
      )}

      <button
        className="mu-file-item__remove"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        type="button"
        aria-label={labels.removeLabel || (cs ? 'Odebrat soubor' : 'Remove file')}
        title={labels.removeTitle || (cs ? 'Odebrat' : 'Remove')}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════════ */

let fileIdCounter = 0;

const ModelUpload = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const cs = language === 'cs';

  useDocumentTitle(t('modelUpload.title'));

  // File queue: { id, file, status: 'pending'|'uploading'|'done'|'error', progress, reason, objectUrl }
  const [fileQueue, setFileQueue] = useState([]);
  // Currently selected/previewed file id
  const [selectedFileId, setSelectedFileId] = useState(null);
  // Model info from Three.js
  const [modelInfo, setModelInfo] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  // Success link visible
  const [showSuccessLink, setShowSuccessLink] = useState(false);
  // Session history
  const [history, setHistory] = useState(() => loadHistory());

  // Upload intervals ref for cleanup
  const intervalsRef = useRef({});

  // Selected file from queue
  const selectedItem = useMemo(
    () => fileQueue.find((f) => f.id === selectedFileId) || null,
    [fileQueue, selectedFileId]
  );
  const selectedFile = selectedItem?.file || null;
  const fileExt = selectedFile ? getFileExt(selectedFile.name) : '';

  // Object URL for selected file
  const objectUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch { /* ignore */ }
      }
    };
  }, [objectUrl]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  // Count summary
  const acceptedCount = fileQueue.filter((f) => f.status === 'done').length;
  const rejectedCount = fileQueue.filter((f) => f.status === 'error').length;
  const uploadingCount = fileQueue.filter((f) => f.status === 'uploading').length;

  // Simulate upload progress for a file entry
  const simulateUpload = useCallback((entry) => {
    const totalSteps = 20;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min((step / totalSteps) * 100, 100);

      setFileQueue((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, progress } : f))
      );

      if (step >= totalSteps) {
        clearInterval(interval);
        delete intervalsRef.current[entry.id];

        setFileQueue((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: 'done', progress: 100 } : f))
        );

        // Add to session history
        const histEntry = {
          name: entry.file.name,
          size: entry.file.size,
          ext: getFileExt(entry.file.name),
          timestamp: Date.now(),
        };
        setHistory((prev) => {
          const filtered = prev.filter(
            (h) => !(h.name === histEntry.name && h.size === histEntry.size)
          );
          const next = [histEntry, ...filtered];
          saveHistory(next);
          return next;
        });
      }
    }, 40);

    intervalsRef.current[entry.id] = interval;
  }, []);

  // Process new files (from drop or file picker)
  const processFiles = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      const newEntries = [];

      for (const file of files) {
        const validation = validateFile(file, cs);
        const id = ++fileIdCounter;

        if (!validation.valid) {
          newEntries.push({
            id,
            file,
            status: 'error',
            progress: 0,
            reason: validation.reason,
          });
        } else {
          // Check for duplicate by name+size
          const isDuplicate = fileQueue.some(
            (f) => f.file.name === file.name && f.file.size === file.size && f.status !== 'error'
          );
          if (isDuplicate) {
            newEntries.push({
              id,
              file,
              status: 'error',
              progress: 0,
              reason: cs ? 'Soubor je jiz v seznamu.' : 'File already in the list.',
            });
          } else {
            newEntries.push({
              id,
              file,
              status: 'uploading',
              progress: 0,
              reason: null,
            });
          }
        }
      }

      setFileQueue((prev) => [...prev, ...newEntries]);

      // Start upload simulation for valid entries
      for (const entry of newEntries) {
        if (entry.status === 'uploading') {
          simulateUpload(entry);
        }
      }

      // Show success link after all done
      setShowSuccessLink(true);
    },
    [cs, fileQueue, simulateUpload]
  );

  // Dropzone configuration — multiple files
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      const allFiles = [...(acceptedFiles || [])];

      // Add rejected files too, so we can show them with reasons
      if (rejectedFiles && rejectedFiles.length > 0) {
        for (const rej of rejectedFiles) {
          allFiles.push(rej.file);
        }
      }

      processFiles(allFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'model/stl': ['.stl'],
      'application/sla': ['.stl'],
      'model/obj': ['.obj'],
      'application/x-tgif': ['.obj'],
      'model/3mf': ['.3mf'],
      'application/vnd.ms-package.3dmanufacturing-3dmodel+xml': ['.3mf'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  // Handle model info callback from Three.js
  const handleModelInfo = useCallback((info) => {
    setModelInfo(info);
    setViewerReady(true);
  }, []);

  // Select a file from the queue for preview
  const handleSelectFile = useCallback((item) => {
    setSelectedFileId(item.id);
    setModelInfo(null);
    setViewerReady(false);
    setTimeout(() => {
      document.getElementById('mu-preview')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Remove a file from the queue
  const handleRemoveFile = useCallback((id) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    setFileQueue((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
      setModelInfo(null);
      setViewerReady(false);
    }
  }, [selectedFileId]);

  // Navigate to calculator with preloaded file
  const handleCalculatePrice = useCallback(() => {
    if (!selectedFile) return;
    navigate('/test-kalkulacka', {
      state: { preloadedFile: selectedFile },
    });
  }, [selectedFile, navigate]);

  // Retry a failed file — re-validate and re-upload
  const handleRetryFile = useCallback((item) => {
    const validation = validateFile(item.file, cs);
    if (!validation.valid) {
      // Still invalid (e.g. size), keep error but refresh message
      setFileQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, reason: validation.reason } : f))
      );
      return;
    }
    // Reset to uploading and start simulation
    setFileQueue((prev) =>
      prev.map((f) =>
        f.id === item.id ? { ...f, status: 'uploading', progress: 0, reason: null } : f
      )
    );
    simulateUpload(item);
  }, [cs, simulateUpload]);

  // Clear all files
  const handleClearAll = useCallback(() => {
    Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
    setFileQueue([]);
    setSelectedFileId(null);
    setModelInfo(null);
    setViewerReady(false);
    setShowSuccessLink(false);
  }, []);

  // Click history item
  const handleHistoryClick = useCallback(
    (item) => {
      // If the selected file matches, scroll to preview
      if (
        selectedFile &&
        selectedFile.name === item.name &&
        selectedFile.size === item.size
      ) {
        document.getElementById('mu-preview')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      // Otherwise prompt to upload the file again
      setTimeout(() => open(), 100);
    },
    [selectedFile, open]
  );

  const hasFiles = fileQueue.length > 0;
  const allDone = hasFiles && uploadingCount === 0;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mu-page">
      <div className="mu-container">
        {/* Header */}
        <header className="mu-header">
          <h1 className="mu-header__title">
            {t('modelUpload.title')}
          </h1>
          <p className="mu-header__subtitle">
            {t('modelUpload.subtitle')}
          </p>
        </header>

        {/* Drop Zone — always shown */}
        <div
          {...getRootProps({
            className: `mu-dropzone${isDragActive ? ' mu-dropzone--active' : ''}${hasFiles ? ' mu-dropzone--compact' : ''}`,
            role: 'button',
            'aria-label': t('modelUpload.dropzone.label'),
            tabIndex: 0,
          })}
        >
          <input {...getInputProps()} aria-label={t('modelUpload.dropzone.inputLabel')} />

          {/* Animated border on drag */}
          <div className="mu-dropzone__border-anim" aria-hidden="true" />

          <div className="mu-dropzone__icon">
            <Icon
              name={isDragActive ? 'Download' : 'Upload'}
              size={hasFiles ? 22 : 28}
              style={{ color: 'var(--forge-accent-primary, #00D4AA)' }}
            />
          </div>

          <h2 className="mu-dropzone__title">
            {isDragActive
              ? t('modelUpload.dropzone.active')
              : t('modelUpload.dropzone.idle')}
          </h2>

          {!hasFiles && (
            <>
              <p className="mu-dropzone__text">
                {t('modelUpload.dropzone.or')}{' '}
                <span className="mu-dropzone__browse">
                  {t('modelUpload.dropzone.browse')}
                </span>
              </p>

              {/* Supported formats with file type icons */}
              <div className="mu-dropzone__formats" aria-label={t('modelUpload.dropzone.formatsLabel')}>
                {FORMATS.map((f) => (
                  <div
                    key={f.ext}
                    className={`mu-format-card${f.supported ? '' : ' mu-format-card--soon'}`}
                  >
                    <FileTypeIcon ext={f.ext.toLowerCase()} size={36} />
                    <div className="mu-format-card__label">
                      .{f.ext.toLowerCase()}
                    </div>
                    <div className="mu-format-card__desc">
                      {f.desc}
                    </div>
                    {!f.supported && (
                      <span className="mu-format-card__badge">
                        {t('modelUpload.dropzone.soon')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mu-dropzone__meta">
                <Icon name="HardDrive" size={12} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                {`Max ${formatFileSize(MAX_FILE_SIZE)} ${t('modelUpload.dropzone.maxSize')}`}
              </p>
            </>
          )}

          {hasFiles && (
            <p className="mu-dropzone__text mu-dropzone__text--compact">
              {t('modelUpload.dropzone.addMore')}
            </p>
          )}
        </div>

        {/* File Queue List */}
        {hasFiles && (
          <section className="mu-filelist" aria-label={t('modelUpload.files.label')}>
            <div className="mu-filelist__header">
              <h2 className="mu-filelist__title">
                <Icon name="Files" size={16} />
                {t('modelUpload.files.title')}
                <span className="mu-filelist__count">{fileQueue.length}</span>
              </h2>

              {/* Summary badges */}
              <div className="mu-filelist__summary">
                {acceptedCount > 0 && (
                  <span className="mu-badge mu-badge--success">
                    <Icon name="CheckCircle2" size={12} />
                    {acceptedCount} {t('modelUpload.files.ok')}
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="mu-badge mu-badge--error">
                    <Icon name="XCircle" size={12} />
                    {rejectedCount} {t('modelUpload.files.failed')}
                  </span>
                )}
                {uploadingCount > 0 && (
                  <span className="mu-badge mu-badge--uploading">
                    <Icon name="Loader2" size={12} className="mu-spin" />
                    {uploadingCount} {t('modelUpload.files.uploading')}
                  </span>
                )}
              </div>

              <button
                className="mu-filelist__clear"
                onClick={handleClearAll}
                type="button"
                aria-label={t('modelUpload.files.clearAllLabel')}
              >
                <Icon name="Trash2" size={14} />
                {t('modelUpload.files.clearAll')}
              </button>
            </div>

            <div className="mu-filelist__list" role="list">
              {fileQueue.map((item) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  cs={cs}
                  isActive={item.id === selectedFileId}
                  onSelect={handleSelectFile}
                  onRemove={handleRemoveFile}
                  onRetry={item.status === 'error' ? handleRetryFile : undefined}
                  labels={{
                    retry: t('modelUpload.file.retry'),
                    retryLabel: t('modelUpload.file.retryLabel'),
                    removeLabel: t('modelUpload.file.removeLabel'),
                    removeTitle: t('modelUpload.file.removeTitle'),
                  }}
                />
              ))}
            </div>

            {/* Success link to calculator — shown when at least 1 file is done */}
            {allDone && acceptedCount > 0 && showSuccessLink && (
              <div className="mu-success-cta" role="status">
                <div className="mu-success-cta__text">
                  <Icon name="CheckCircle2" size={18} style={{ color: 'var(--forge-success)' }} />
                  <span>
                    {cs
                      ? `${acceptedCount} ${acceptedCount === 1 ? t('modelUpload.success.uploaded') : t('modelUpload.success.uploadedPlural')} ${t('modelUpload.success.uploadedSuffix')}`
                      : `${acceptedCount} ${acceptedCount !== 1 ? t('modelUpload.success.uploadedPlural') : t('modelUpload.success.uploaded')} ${t('modelUpload.success.uploadedSuffix')}`}
                  </span>
                </div>
                <div className="mu-success-cta__actions">
                  {selectedFile ? (
                    <button
                      className="mu-btn mu-btn--primary"
                      onClick={handleCalculatePrice}
                      type="button"
                    >
                      <Icon name="Calculator" size={16} />
                      {t('modelUpload.success.calculateBtn')}
                    </button>
                  ) : (
                    <p className="mu-success-cta__hint">
                      <Icon name="MousePointerClick" size={14} />
                      {t('modelUpload.success.hint')}
                    </p>
                  )}
                  <Link
                    to="/test-kalkulacka"
                    className="mu-btn mu-btn--ghost"
                  >
                    <Icon name="ArrowRight" size={16} />
                    {t('modelUpload.success.goCalc')}
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Preview Section — shown when a file is selected */}
        {selectedFile && (
          <div className="mu-preview" id="mu-preview">
            <div className="mu-preview__card">
              {/* 3D Viewer */}
              <div className="mu-preview__viewer">
                {objectUrl && ACCEPTED_EXTENSIONS.includes(`.${fileExt}`) ? (
                  <Suspense
                    fallback={
                      <div className="mu-preview__loading">
                        <Icon
                          name="Loader2"
                          size={28}
                          className="mu-spin"
                          style={{ color: 'var(--forge-accent-primary)' }}
                        />
                        <span>{t('modelUpload.preview.loading')}</span>
                      </div>
                    }
                  >
                    <Canvas
                      camera={{ position: [0, 0, 100], fov: 50 }}
                      dpr={[1, 1.5]}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <ambientLight intensity={0.9} />
                      <directionalLight position={[10, 10, 10]} intensity={0.9} />
                      <directionalLight position={[-8, -4, -8]} intensity={0.4} />
                      <Center>
                        <ModelPreviewScene
                          url={objectUrl}
                          ext={fileExt}
                          onInfo={handleModelInfo}
                        />
                      </Center>
                      <OrbitControls
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={0.6}
                      />
                    </Canvas>
                  </Suspense>
                ) : (
                  <div className="mu-preview__loading">
                    <Icon name="FileQuestion" size={32} style={{ color: 'var(--forge-text-muted)' }} />
                    <span>{t('modelUpload.preview.unavailable')}</span>
                  </div>
                )}
              </div>

              {/* Model info bar */}
              <div className="mu-preview__info">
                <div className="mu-preview__info-header">
                  <div className="mu-preview__file-icon">
                    <FileTypeIcon ext={fileExt} size={36} />
                  </div>
                  <div>
                    <h3 className="mu-preview__filename" title={selectedFile.name}>
                      {selectedFile.name}
                    </h3>
                    <div className="mu-preview__filename-sub">
                      {fileExt.toUpperCase()} &middot; {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>

                <div className="mu-preview__stats">
                  <div className="mu-stat">
                    <div className="mu-stat__label">
                      {t('modelUpload.preview.size')}
                    </div>
                    <div className="mu-stat__value">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <div className="mu-stat">
                    <div className="mu-stat__label">Format</div>
                    <div className="mu-stat__value">
                      {fileExt.toUpperCase()}
                    </div>
                  </div>
                  {modelInfo?.dimX != null && (
                    <div className="mu-stat">
                      <div className="mu-stat__label">
                        {t('modelUpload.preview.dimensions')}
                      </div>
                      <div className="mu-stat__value">
                        {modelInfo.dimX.toFixed(1)} x {modelInfo.dimY.toFixed(1)} x{' '}
                        {modelInfo.dimZ.toFixed(1)} mm
                      </div>
                    </div>
                  )}
                  {modelInfo?.triangleCount != null && (
                    <div className="mu-stat">
                      <div className="mu-stat__label">
                        {t('modelUpload.preview.triangles')}
                      </div>
                      <div className="mu-stat__value">
                        {formatNumber(modelInfo.triangleCount)}
                      </div>
                    </div>
                  )}
                  {modelInfo?.vertexCount != null && (
                    <div className="mu-stat">
                      <div className="mu-stat__label">
                        {t('modelUpload.preview.vertices')}
                      </div>
                      <div className="mu-stat__value">
                        {formatNumber(modelInfo.vertexCount)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mu-preview__actions">
                  <button
                    className="mu-btn mu-btn--primary mu-btn--flex"
                    onClick={handleCalculatePrice}
                    type="button"
                  >
                    <Icon name="Calculator" size={18} />
                    {t('modelUpload.preview.calculate')}
                  </button>

                  <button
                    className="mu-btn mu-btn--outline"
                    onClick={() => {
                      setSelectedFileId(null);
                      setModelInfo(null);
                      setViewerReady(false);
                    }}
                    type="button"
                  >
                    <Icon name="Eye" size={18} />
                    {t('modelUpload.preview.close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Upload History */}
        {history.length > 0 && (
          <section className="mu-history" aria-label={t('modelUpload.history.label')}>
            <h2 className="mu-history__title">
              <Icon name="Clock" size={14} />
              {t('modelUpload.history.title')}
            </h2>
            <div className="mu-history__list">
              {history.map((item) => {
                const isActive =
                  selectedFile &&
                  selectedFile.name === item.name &&
                  selectedFile.size === item.size;
                return (
                  <button
                    key={`${item.name}-${item.timestamp}`}
                    className={`mu-history__item${isActive ? ' mu-history__item--active' : ''}`}
                    onClick={() => handleHistoryClick(item)}
                    type="button"
                    aria-label={`${item.name} — ${formatFileSize(item.size)}`}
                  >
                    <div className="mu-history__item-icon">
                      <FileTypeIcon ext={item.ext} size={28} />
                    </div>
                    <div className="mu-history__item-info">
                      <div className="mu-history__item-name">{item.name}</div>
                      <div className="mu-history__item-meta">
                        {item.ext?.toUpperCase()} &middot; {formatFileSize(item.size)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ModelUpload;
