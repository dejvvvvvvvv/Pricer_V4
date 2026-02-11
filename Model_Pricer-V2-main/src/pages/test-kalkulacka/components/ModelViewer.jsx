import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ErrorBoundary from './ErrorBoundary';

/* ── FORGE style objects ─────────────────────────────────────────────────── */
const fg = {
  container: {
    position: 'relative',
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem',
  },
  emptyContainer: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '5rem',
    height: '5rem',
    borderRadius: '50%',
    background: 'var(--forge-bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  emptyTitle: {
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '1rem',
  },
  emptyText: {
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    marginTop: '0.5rem',
  },
  toolbar: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    zIndex: 10,
    display: 'flex',
    gap: '0.25rem',
  },
  canvasWrap: {
    background: 'var(--forge-bg-void)',
    borderRadius: 'var(--forge-radius-xl)',
    overflow: 'hidden',
  },
  fallbackWrap: {
    width: '100%',
    height: '100%',
    background: 'var(--forge-bg-void)',
    borderRadius: 'var(--forge-radius-xl)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    textAlign: 'center',
  },
  infoBar: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-xl)',
    border: '1px solid var(--forge-border-default)',
  },
  fileName: {
    fontSize: 'var(--forge-text-sm)',
    fontWeight: 500,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    width: '100%',
  },
  metricLabel: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-mono)',
  },
  metricCard: {
    textAlign: 'center',
    padding: '0.5rem',
    background: 'var(--forge-bg-surface)',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
  },
  metricCardValue: {
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-mono)',
    fontSize: 'var(--forge-text-xs)',
  },
  metricCardLabel: {
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  errorText: {
    marginTop: '0.5rem',
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-error)',
    fontFamily: 'var(--forge-font-mono)',
  },
  fullscreenOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(8, 9, 12, 0.85)',
    backdropFilter: 'blur(8px)',
  },
  fullscreenInner: {
    position: 'relative',
    width: '90vw',
    height: '90vh',
    background: 'transparent',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    paddingTop: '0.5rem',
  },
  fullscreenBtn: {
    height: '3rem',
    width: '3rem',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid var(--forge-border-active)',
    color: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Surface area (STL) -- frontend-only with guardrails
// NOTE: We do NOT compute volume in browser (backend slicer is source of truth).
// Surface is generally safe, but still protect the UI from huge meshes.
const MAX_PREVIEW_MB = 12;
const MAX_SURFACE_VERTICES = 2_000_000; // ~2M vertices
const MAX_SURFACE_TRIANGLES = 1_000_000; // ~1M triangles
const MAX_SURFACE_TIME_MS = 140; // time budget in one idle job

function scheduleIdle(fn) {
  if (typeof window === 'undefined') return null;
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(() => fn());
  }
  return window.setTimeout(fn, 0);
}

function cancelIdle(handle) {
  if (handle == null || typeof window === 'undefined') return;
  if (typeof window.cancelIdleCallback === 'function') {
    try { window.cancelIdleCallback(handle); } catch { /* ignore */ }
    return;
  }
  try { window.clearTimeout(handle); } catch { /* ignore */ }
}

function computeSurfaceMm2FromGeometry(geometry, opts) {
  try {
    const position = geometry?.attributes?.position;
    if (!position || !position.array) {
      return { surfaceMm2: null, reason: 'no_position' };
    }

    const vertexCount = position.count || 0;
    const index = geometry.getIndex?.() || geometry.index;
    const indexArray = index?.array || null;
    const triangleCount = indexArray ? Math.floor((indexArray.length || 0) / 3) : Math.floor(vertexCount / 3);

    const maxVertices = opts?.maxVertices ?? MAX_SURFACE_VERTICES;
    const maxTriangles = opts?.maxTriangles ?? MAX_SURFACE_TRIANGLES;
    const maxMs = opts?.maxMs ?? MAX_SURFACE_TIME_MS;

    if (vertexCount > maxVertices || triangleCount > maxTriangles) {
      return { surfaceMm2: null, reason: 'too_many_vertices', vertexCount, triangleCount };
    }

    const arr = position.array;
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let areaMm2 = 0;

    const checkEvery = 10_000;
    const triLen = triangleCount;

    for (let t = 0; t < triLen; t += 1) {
      let ia;
      let ib;
      let ic;
      if (indexArray) {
        ia = indexArray[t * 3] * 3;
        ib = indexArray[t * 3 + 1] * 3;
        ic = indexArray[t * 3 + 2] * 3;
      } else {
        ia = t * 9;
        ib = t * 9 + 3;
        ic = t * 9 + 6;
      }

      const ax = arr[ia];
      const ay = arr[ia + 1];
      const az = arr[ia + 2];

      const bx = arr[ib];
      const by = arr[ib + 1];
      const bz = arr[ib + 2];

      const cx = arr[ic];
      const cy = arr[ic + 1];
      const cz = arr[ic + 2];

      const abx = bx - ax;
      const aby = by - ay;
      const abz = bz - az;

      const acx = cx - ax;
      const acy = cy - ay;
      const acz = cz - az;

      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;

      areaMm2 += 0.5 * Math.sqrt((crossX * crossX) + (crossY * crossY) + (crossZ * crossZ));

      if (t > 0 && (t % checkEvery === 0)) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if ((now - t0) > maxMs) {
          return {
            surfaceMm2: null,
            reason: 'time_budget_exceeded',
            vertexCount,
            triangleCount,
            ms: now - t0,
          };
        }
      }
    }

    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (!Number.isFinite(areaMm2) || areaMm2 <= 0) {
      return { surfaceMm2: null, reason: 'bad_result', vertexCount, triangleCount, ms: t1 - t0 };
    }

    return { surfaceMm2: areaMm2, reason: 'ok', vertexCount, triangleCount, ms: t1 - t0 };
  } catch (e) {
    return { surfaceMm2: null, reason: 'exception', error: String(e?.message || e) };
  }
}

function STLModel({ url, computeSurface, onSurfaceComputed }) {
  const geometry = useLoader(STLLoader, url);

  // Center geometry (cheap & safe) -- prevents model being out of view.
  useMemo(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }, [geometry]);

  // Compute mesh surface (mm^2) with guardrails (idle + time budget).
  useEffect(() => {
    if (!computeSurface || !geometry || typeof onSurfaceComputed !== 'function') return undefined;

    let cancelled = false;
    const handle = scheduleIdle(() => {
      if (cancelled) return;
      const res = computeSurfaceMm2FromGeometry(geometry, {
        maxVertices: MAX_SURFACE_VERTICES,
        maxTriangles: MAX_SURFACE_TRIANGLES,
        maxMs: MAX_SURFACE_TIME_MS,
      });
      if (cancelled) return;

      const mm2 = res?.surfaceMm2;
      const payload = {
        surfaceMm2: Number.isFinite(mm2) ? mm2 : null,
        surfaceCm2: Number.isFinite(mm2) ? (mm2 / 100) : null,
        meta: {
          reason: res?.reason,
          vertexCount: res?.vertexCount,
          triangleCount: res?.triangleCount,
          ms: res?.ms,
        },
      };
      onSurfaceComputed(payload);
    });

    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, [computeSurface, geometry, onSurfaceComputed]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#00D4AA" metalness={0.15} roughness={0.45} />
    </mesh>
  );
}

// Fullscreen Modal
const FullScreenModel = ({ url }) => {
  const geom = useLoader(STLLoader, url);
  const mesh = useMemo(() => {
    geom.computeVertexNormals();
    return new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: '#00D4AA',
        metalness: 0.15,
        roughness: 0.45,
      })
    );
  }, [geom]);
  return <primitive object={mesh} />;
};

const FullScreenViewer = ({ fileUrl, onClose }) => {
  return (
    <div
      style={fg.fullscreenOverlay}
      onClick={onClose}
    >
      <div
        style={fg.fullscreenInner}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={fg.fullscreenClose}>
          <button
            onClick={onClose}
            aria-label="Zavřít celé okno"
            style={fg.fullscreenBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'; }}
          >
            <Icon name="Minimize" size={28} />
          </button>
        </div>

        <Suspense
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Icon name="Loader2" className="animate-spin" size={32} style={{ color: 'var(--forge-accent-primary)' }} />
            </div>
          }
        >
          <Canvas shadows camera={{ position: [0, 0, 75], fov: 50 }} gl={{ alpha: true }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} />
            <directionalLight position={[-10, -5, -10]} intensity={1} />
            <Center>
              <FullScreenModel url={fileUrl} />
            </Center>
            <OrbitControls autoRotate autoRotateSpeed={1.0} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
};


function STLCanvas({ file, computeSurface, onSurfaceComputed }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const canvasWrapRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };
  }, [url]);

  // Prevent the page from scrolling when the user zooms the 3D view using the mouse wheel.
  // OrbitControls uses the wheel event for zoom, but browsers also scroll the page by default.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={canvasWrapRef} style={{ width: '100%', height: '100%', ...fg.canvasWrap }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <STLModel url={url} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} />
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

function formatDuration(totalSeconds) {
  const s = Number(totalSeconds);
  if (!Number.isFinite(s) || s <= 0) return '-';
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  let out = '';
  if (hours > 0) out += `${hours}h `;
  out += `${minutes}m`;
  return out.trim();
}

/**
 * Stabilnejsi (lehci) 3D viewer pro /test-kalkulacka.
 * - zadne vypocty objemu v prohlizeci (to dela backend slicer)
 * - guard na velke soubory + nepodporovane formaty
 * - ErrorBoundary kolem Canvas, aby stranka nespadla (white-screen)
 */
const ModelViewer = ({ selectedFile, onRemove, onSurfaceComputed }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const fileObj = selectedFile?.file instanceof File ? selectedFile.file : null;
  const ext = String(selectedFile?.name || '').split('.').pop()?.toLowerCase();
  const sizeMb = (selectedFile?.size || fileObj?.size || 0) / (1024 * 1024);
  const fileId = selectedFile?.id;

  // Safety thresholds (stability > fancy preview)
  const tooLargeForPreview = sizeMb > MAX_PREVIEW_MB;
  const previewSupported = ext === 'stl';
  const canFullscreen = !!fileObj && previewSupported && !tooLargeForPreview;
  const canComputeSurface = !!fileObj && previewSupported && !tooLargeForPreview;

  const surfaceCm2 =
    Number.isFinite(selectedFile?.result?.modelInfo?.surfaceCm2)
      ? selectedFile.result.modelInfo.surfaceCm2
      : Number.isFinite(selectedFile?.clientModelInfo?.surfaceCm2)
        ? selectedFile.clientModelInfo.surfaceCm2
        : null;

  const surfaceAttempted = !!selectedFile?.clientModelInfoMeta?.surface?.reason;
  const canComputeSurfaceSafe = canComputeSurface && !(Number.isFinite(surfaceCm2) && surfaceCm2 > 0) && !surfaceAttempted;


  const handleSurfaceComputed = useCallback(
    (payload) => {
      if (!onSurfaceComputed || !fileId) return;
      onSurfaceComputed(fileId, payload);
    },
    [onSurfaceComputed, fileId]
  );

  useEffect(() => {
    if (!canFullscreen || !fileObj) {
      setIsFullScreen(false);
      setFileUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(fileObj);
    setFileUrl(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };
  }, [fileObj, canFullscreen]);

  const handleRemove = () => {
    setIsFullScreen(false);
    onRemove?.(selectedFile);
  };

  if (!selectedFile) {
    return (
      <div style={fg.emptyContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={fg.emptyIcon}>
            <Icon name="Scan" size={40} style={{ color: 'var(--forge-text-muted)' }} />
          </div>
          <h3 style={fg.emptyTitle}>Náhled modelu</h3>
          <p style={fg.emptyText}>
            Po nahrání souboru se zde zobrazí náhled a metriky ze sliceru.
          </p>
        </div>
      </div>
    );
  }

  const metrics = selectedFile?.result?.metrics;
  const modelInfo = selectedFile?.result?.modelInfo;

  const dims = modelInfo?.sizeMm;
  const volumeMm3 = modelInfo?.volumeMm3;
  const volumeCm3 = typeof volumeMm3 === 'number' ? volumeMm3 / 1000 : null;

  return (
    <>
      <div style={fg.container}>
        <div style={fg.toolbar}>
          {canFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(true)}
              aria-label="Celá obrazovka"
            >
              <Icon name="Expand" size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            aria-label="Odstranit model"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <ErrorBoundary>
            {(!fileObj || !previewSupported) ? (
              <div style={fg.fallbackWrap}>
                Náhled je dostupný jen pro STL soubory.
                <br />
                Pro data použijte „Metriky ze sliceru".
              </div>
            ) : tooLargeForPreview ? (
              <div style={fg.fallbackWrap}>
                Náhled je vypnutý (velký soubor ~{sizeMb.toFixed(1)} MB).
                <br />
                Pro data použijte „Metriky ze sliceru".
              </div>
            ) : (
          <STLCanvas file={fileObj} computeSurface={canComputeSurfaceSafe} onSurfaceComputed={handleSurfaceComputed} />
            )}
          </ErrorBoundary>
        </div>

        <div style={fg.infoBar}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <p style={fg.fileName} title={selectedFile.name}>
              {selectedFile.name}
            </p>
          </div>

          {/* Backend metrics */}
          {(dims?.x || dims?.y || dims?.z || volumeCm3 != null || metrics) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(dims?.x || dims?.y || dims?.z || volumeCm3 != null) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem', fontSize: 'var(--forge-text-xs)' }}>
                  <div style={fg.metricLabel}>Rozměry:</div>
                  <div style={fg.metricValue}>
                    {Number(dims?.x || 0).toFixed(2)} × {Number(dims?.y || 0).toFixed(2)} × {Number(dims?.z || 0).toFixed(2)} mm
                  </div>
                  {volumeCm3 != null && (
                    <>
                      <div style={fg.metricLabel}>Objem:</div>
                      <div style={fg.metricValue}>{volumeCm3.toFixed(2)} cm³</div>
                    </>
                  )}
                  {surfaceCm2 != null && (
                    <>
                      <div style={fg.metricLabel}>Povrch:</div>
                      <div style={fg.metricValue}>{surfaceCm2.toFixed(2)} cm²</div>
                    </>
                  )}
                </div>
              )}

              {metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={fg.metricCard}>
                    <p style={fg.metricCardValue}>{formatDuration(metrics?.estimatedTimeSeconds)}</p>
                    <p style={fg.metricCardLabel}>Čas tisku</p>
                  </div>
                  <div style={fg.metricCard}>
                    <p style={fg.metricCardValue}>
                      {Number.isFinite(Number(metrics?.filamentGrams)) ? `${Number(metrics.filamentGrams).toFixed(1)} g` : '-'}
                    </p>
                    <p style={fg.metricCardLabel}>Materiál</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile?.status === 'failed' && selectedFile?.error && (
            <div style={fg.errorText}>
              {selectedFile.error}
            </div>
          )}
        </div>
      </div>

      {isFullScreen && fileUrl && (
        <FullScreenViewer fileUrl={fileUrl} onClose={() => setIsFullScreen(false)} />
      )}
    </>
  );
};

export default ModelViewer;
