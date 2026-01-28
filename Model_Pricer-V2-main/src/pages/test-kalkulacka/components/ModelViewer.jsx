import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ErrorBoundary from './ErrorBoundary';

// ─────────────────────────────────────────────────────────────────────────────
// Surface area (STL) – frontend-only with guardrails
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

  // Center geometry (cheap & safe) – prevents model being out of view.
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
      <meshStandardMaterial color="#1E90FF" metalness={0.1} roughness={0.5} />
    </mesh>
  );
}

// Fullscreen Modal (1:1 z OLD verze; pouze vyšší z-index, aby překryl navbar)
const FullScreenModel = ({ url }) => {
  const geom = useLoader(STLLoader, url);
  const mesh = useMemo(() => {
    geom.computeVertexNormals();
    return new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: '#1E90FF',
        metalness: 0.1,
        roughness: 0.5,
      })
    );
  }, [geom]);
  return <primitive object={mesh} />;
};

const FullScreenViewer = ({ fileUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] h-[90vh] bg-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Zavřít celé okno"
            className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white/90 hover:text-white transition-colors"
          >
            <Icon name="Minimize" size={28} />
          </Button>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-full">
              <Icon name="Loader2" className="animate-spin text-primary" size={32} />
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
    <div ref={canvasWrapRef} className="w-full h-full bg-muted/30 rounded-xl overflow-hidden">
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
 * Stabilnější (lehčí) 3D viewer pro /test-kalkulacka.
 * - žádné výpočty objemu v prohlížeči (to dělá backend slicer)
 * - guard na velké soubory + nepodporované formáty
 * - ErrorBoundary kolem Canvas, aby stránka nespadla (white-screen)
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
      <div className="bg-card border border-border rounded-xl aspect-square flex flex-col items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Icon name="Scan" size={40} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Náhled modelu</h3>
          <p className="text-sm text-muted-foreground">
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
      <div className="relative bg-card border border-border rounded-xl aspect-square flex flex-col p-2">
        <div className="absolute top-2 right-2 z-10 flex space-x-1">
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

        <div className="flex-1 min-h-0">
          <ErrorBoundary>
            {(!fileObj || !previewSupported) ? (
              <div className="w-full h-full bg-muted/30 rounded-xl flex items-center justify-center p-4 text-sm text-muted-foreground text-center">
                Náhled je dostupný jen pro STL soubory.
                <br />
                Pro data použijte „Metriky ze sliceru“.
              </div>
            ) : tooLargeForPreview ? (
              <div className="w-full h-full bg-muted/30 rounded-xl flex items-center justify-center p-4 text-sm text-muted-foreground text-center">
                Náhled je vypnutý (velký soubor ~{sizeMb.toFixed(1)} MB).
                <br />
                Pro data použijte „Metriky ze sliceru“.
              </div>
            ) : (
          <STLCanvas file={fileObj} computeSurface={canComputeSurfaceSafe} onSurfaceComputed={handleSurfaceComputed} />
            )}
          </ErrorBoundary>
        </div>

        <div className="mt-2 p-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border">
          <div className="flex items-center justify-center mb-2">
            <p
              className="text-sm font-medium text-foreground truncate text-center w-full"
              title={selectedFile.name}
            >
              {selectedFile.name}
            </p>
          </div>

          {/* Backend metrics */}
          {(dims?.x || dims?.y || dims?.z || volumeCm3 != null || metrics) && (
            <div className="space-y-2">
              {(dims?.x || dims?.y || dims?.z || volumeCm3 != null) && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-muted-foreground">Rozměry:</div>
                  <div className="text-foreground">
                    {Number(dims?.x || 0).toFixed(2)} × {Number(dims?.y || 0).toFixed(2)} × {Number(dims?.z || 0).toFixed(2)} mm
                  </div>
                  {volumeCm3 != null && (
                    <>
                      <div className="text-muted-foreground">Objem:</div>
                      <div className="text-foreground">{volumeCm3.toFixed(2)} cm³</div>
                    </>
                  )}
                  {surfaceCm2 != null && (
                    <>
                      <div className="text-muted-foreground">Povrch:</div>
                      <div className="text-foreground">{surfaceCm2.toFixed(2)} cm²</div>
                    </>
                  )}
                </div>
              )}

              {metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="font-bold text-foreground">{formatDuration(metrics?.estimatedTimeSeconds)}</p>
                    <p className="text-muted-foreground">Čas tisku</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="font-bold text-foreground">
                      {Number.isFinite(Number(metrics?.filamentGrams)) ? `${Number(metrics.filamentGrams).toFixed(1)} g` : '-'}
                    </p>
                    <p className="text-muted-foreground">Materiál</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile?.status === 'failed' && selectedFile?.error && (
            <div className="mt-2 text-xs text-destructive">
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
