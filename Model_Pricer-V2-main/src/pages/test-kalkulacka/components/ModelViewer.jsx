import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import * as THREE from 'three';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ErrorBoundary from './ErrorBoundary';

/* ── File format helpers ──────────────────────────────────────────────────── */
const SUPPORTED_PREVIEW_EXTS = ['stl', 'obj', '3mf'];

function getFileExt(name) {
  return String(name || '').split('.').pop()?.toLowerCase() || '';
}

function getLoaderForExt(ext) {
  switch (ext) {
    case 'stl': return STLLoader;
    case 'obj': return OBJLoader;
    case '3mf': return ThreeMFLoader;
    default: return null;
  }
}

/**
 * Extract all BufferGeometry instances from a loaded object.
 * STLLoader returns a BufferGeometry directly.
 * OBJLoader and ThreeMFLoader return a Group containing Mesh children.
 */
function extractGeometries(loaded) {
  if (!loaded) return [];
  // STLLoader returns BufferGeometry directly
  if (loaded.isBufferGeometry) return [loaded];
  // Group (OBJ/3MF) — traverse and collect mesh geometries
  const geometries = [];
  loaded.traverse?.((child) => {
    if (child.isMesh && child.geometry) {
      geometries.push(child.geometry);
    }
  });
  return geometries;
}

/**
 * Compute combined surface area from multiple geometries.
 */
function computeSurfaceFromGeometries(geometries, opts) {
  let totalMm2 = 0;
  let totalVertices = 0;
  let totalTriangles = 0;
  for (const geom of geometries) {
    const res = computeSurfaceMm2FromGeometry(geom, opts);
    if (res.reason !== 'ok' || res.surfaceMm2 == null) {
      return res; // propagate first failure
    }
    totalMm2 += res.surfaceMm2;
    totalVertices += res.vertexCount || 0;
    totalTriangles += res.triangleCount || 0;
  }
  return { surfaceMm2: totalMm2, reason: 'ok', vertexCount: totalVertices, triangleCount: totalTriangles };
}

/** Teal material shared across all model types */
const TEAL_MATERIAL_PROPS = { color: '#00D4AA', metalness: 0.15, roughness: 0.45 };

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
  /* ── Tab styles ─────────────────────────────────────────────────────────── */
  tabBar: {
    display: 'flex',
    gap: '2px',
    marginBottom: '0.5rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '2px',
  },
  tab: {
    flex: 1,
    padding: '0.4rem 0.5rem',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    border: 'none',
    borderRadius: 'var(--forge-radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'var(--forge-bg-surface)',
    color: '#00D4AA',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  tabInactive: {
    background: 'transparent',
    color: 'var(--forge-text-muted)',
  },
  /* ── Build plate toolbar ────────────────────────────────────────────────── */
  buildPlateToolbar: {
    position: 'absolute',
    bottom: '0.75rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    gap: '0.5rem',
  },
  buildPlateBtn: {
    padding: '0.35rem 0.75rem',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: '1px solid rgba(0, 212, 170, 0.3)',
    borderRadius: 'var(--forge-radius-sm)',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    color: '#00D4AA',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
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

function STLModel({ url, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
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

  // Notify parent when geometry is loaded successfully.
  useEffect(() => {
    if (geometry && typeof onGeometryLoaded === 'function') {
      onGeometryLoaded(geometry);
    }
  }, [geometry, onGeometryLoaded]);

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

/**
 * OBJModel: loads an OBJ file and renders all meshes with teal material.
 * OBJ files may contain multiple meshes and may lack normals.
 */
function OBJModel({ url, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
  const group = useLoader(OBJLoader, url);

  // Process: center, compute normals if missing, apply teal material
  const processedGroup = useMemo(() => {
    if (!group) return null;
    const cloned = group.clone(true);

    // Compute combined bounding box for centering
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);

    cloned.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Center geometry
        child.geometry.translate(-center.x, -center.y, -center.z);
        // Compute normals if missing
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        // Apply teal material
        child.material = new THREE.MeshStandardMaterial(TEAL_MATERIAL_PROPS);
      }
    });

    return cloned;
  }, [group]);

  // Notify parent when geometry is loaded
  useEffect(() => {
    if (processedGroup && typeof onGeometryLoaded === 'function') {
      const geometries = extractGeometries(processedGroup);
      if (geometries.length > 0) onGeometryLoaded(geometries[0]);
    }
  }, [processedGroup, onGeometryLoaded]);

  // Compute surface area across all meshes
  useEffect(() => {
    if (!computeSurface || !processedGroup || typeof onSurfaceComputed !== 'function') return undefined;
    let cancelled = false;
    const handle = scheduleIdle(() => {
      if (cancelled) return;
      const geometries = extractGeometries(processedGroup);
      const res = computeSurfaceFromGeometries(geometries, {
        maxVertices: MAX_SURFACE_VERTICES,
        maxTriangles: MAX_SURFACE_TRIANGLES,
        maxMs: MAX_SURFACE_TIME_MS,
      });
      if (cancelled) return;
      const mm2 = res?.surfaceMm2;
      onSurfaceComputed({
        surfaceMm2: Number.isFinite(mm2) ? mm2 : null,
        surfaceCm2: Number.isFinite(mm2) ? (mm2 / 100) : null,
        meta: { reason: res?.reason, vertexCount: res?.vertexCount, triangleCount: res?.triangleCount, ms: res?.ms },
      });
    });
    return () => { cancelled = true; cancelIdle(handle); };
  }, [computeSurface, processedGroup, onSurfaceComputed]);

  if (!processedGroup) return null;
  return <primitive object={processedGroup} />;
}

/**
 * ThreeMFModel: loads a 3MF file and renders all objects with teal material.
 * 3MF files are ZIP archives; ThreeMFLoader handles decompression internally.
 */
function ThreeMFModel({ url, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
  const group = useLoader(ThreeMFLoader, url);

  const processedGroup = useMemo(() => {
    if (!group) return null;
    const cloned = group.clone(true);

    // Compute combined bounding box for centering
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);

    cloned.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.translate(-center.x, -center.y, -center.z);
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        // Apply teal material (override any embedded materials for consistency)
        child.material = new THREE.MeshStandardMaterial(TEAL_MATERIAL_PROPS);
      }
    });

    return cloned;
  }, [group]);

  useEffect(() => {
    if (processedGroup && typeof onGeometryLoaded === 'function') {
      const geometries = extractGeometries(processedGroup);
      if (geometries.length > 0) onGeometryLoaded(geometries[0]);
    }
  }, [processedGroup, onGeometryLoaded]);

  useEffect(() => {
    if (!computeSurface || !processedGroup || typeof onSurfaceComputed !== 'function') return undefined;
    let cancelled = false;
    const handle = scheduleIdle(() => {
      if (cancelled) return;
      const geometries = extractGeometries(processedGroup);
      const res = computeSurfaceFromGeometries(geometries, {
        maxVertices: MAX_SURFACE_VERTICES,
        maxTriangles: MAX_SURFACE_TRIANGLES,
        maxMs: MAX_SURFACE_TIME_MS,
      });
      if (cancelled) return;
      const mm2 = res?.surfaceMm2;
      onSurfaceComputed({
        surfaceMm2: Number.isFinite(mm2) ? mm2 : null,
        surfaceCm2: Number.isFinite(mm2) ? (mm2 / 100) : null,
        meta: { reason: res?.reason, vertexCount: res?.vertexCount, triangleCount: res?.triangleCount, ms: res?.ms },
      });
    });
    return () => { cancelled = true; cancelIdle(handle); };
  }, [computeSurface, processedGroup, onSurfaceComputed]);

  if (!processedGroup) return null;
  return <primitive object={processedGroup} />;
}

/**
 * ModelScene: routes to the correct model component based on file extension.
 */
function ModelScene({ url, ext, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
  switch (ext) {
    case 'stl':
      return <STLModel url={url} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />;
    case 'obj':
      return <OBJModel url={url} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />;
    case '3mf':
      return <ThreeMFModel url={url} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />;
    default:
      return null;
  }
}

// Fullscreen Modal — supports STL, OBJ, 3MF
const FullScreenModel = ({ url, ext }) => {
  const LoaderClass = getLoaderForExt(ext) || STLLoader;
  const loaded = useLoader(LoaderClass, url);

  const scene = useMemo(() => {
    if (!loaded) return null;

    // STLLoader returns BufferGeometry
    if (loaded.isBufferGeometry) {
      loaded.computeVertexNormals();
      return new THREE.Mesh(loaded, new THREE.MeshStandardMaterial(TEAL_MATERIAL_PROPS));
    }

    // OBJ/3MF return Group
    const cloned = loaded.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        child.material = new THREE.MeshStandardMaterial(TEAL_MATERIAL_PROPS);
      }
    });
    return cloned;
  }, [loaded]);

  if (!scene) return null;
  return <primitive object={scene} />;
};

const FullScreenViewer = ({ fileUrl, ext, onClose }) => {
  const overlayRef = useRef(null);

  // Lock body scroll and listen for Escape key while fullscreen is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Prevent wheel events on the overlay from scrolling the page behind
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return createPortal(
    <div
      ref={overlayRef}
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
              <FullScreenModel url={fileUrl} ext={ext} />
            </Center>
            <OrbitControls autoRotate autoRotateSpeed={1.0} />
          </Canvas>
        </Suspense>
      </div>
    </div>,
    document.body
  );
};


function ModelCanvas({ file, ext, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
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
      <Canvas camera={{ position: [0, 0, 100], fov: 50 }} dpr={[1, 1.5]} frameloop="demand">
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <ModelScene url={url} ext={ext} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 * BUILD PLATE VIEWER — 3D print bed visualization with the model placed on it
 * ══════════════════════════════════════════════════════════════════════════════ */

// Default build plate size: Prusa MK3S+ (250 x 210 mm)
const BUILD_PLATE_W = 250;
const BUILD_PLATE_D = 210;
const GRID_STEP = 10; // grid lines every 10mm

/**
 * Auto-orient: find the largest flat face of the mesh and compute a rotation
 * quaternion that orients that face downward (-Y).
 *
 * Algorithm:
 * 1. Iterate all triangles, compute normal and area.
 * 2. Find the triangle with the largest area (the "flattest" prominent face).
 * 3. Compute a quaternion that rotates that normal to point downward (0, -1, 0).
 */
function computeAutoOrientQuaternion(geometry) {
  const position = geometry?.attributes?.position;
  if (!position || !position.array) return new THREE.Quaternion();

  const arr = position.array;
  const index = geometry.getIndex?.() || geometry.index;
  const indexArray = index?.array || null;
  const vertexCount = position.count || 0;
  const triangleCount = indexArray
    ? Math.floor((indexArray.length || 0) / 3)
    : Math.floor(vertexCount / 3);

  // Accumulate normals weighted by area into buckets to find the dominant face direction.
  // For simplicity, we just track the single largest-area triangle's normal.
  let bestArea = 0;
  const bestNormal = new THREE.Vector3(0, -1, 0);

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  // We also accumulate normals by approximate direction (binning) for a more robust result.
  // Group normals into an icosphere of ~20 bins and pick the one with the largest total area.
  const bins = [];
  const BIN_COUNT = 42;
  // Generate roughly uniform directions using the Fibonacci sphere.
  for (let i = 0; i < BIN_COUNT; i++) {
    const y = 1 - (2 * i) / (BIN_COUNT - 1);
    const radius = Math.sqrt(1 - y * y);
    const theta = ((2 * Math.PI) / ((1 + Math.sqrt(5)) / 2)) * i;
    bins.push({
      dir: new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).normalize(),
      totalArea: 0,
    });
  }

  for (let t = 0; t < triangleCount; t++) {
    let ia, ib, ic;
    if (indexArray) {
      ia = indexArray[t * 3];
      ib = indexArray[t * 3 + 1];
      ic = indexArray[t * 3 + 2];
    } else {
      ia = t * 3;
      ib = t * 3 + 1;
      ic = t * 3 + 2;
    }

    vA.fromBufferAttribute(position, ia);
    vB.fromBufferAttribute(position, ib);
    vC.fromBufferAttribute(position, ic);

    ab.subVectors(vB, vA);
    ac.subVectors(vC, vA);
    cross.crossVectors(ab, ac);

    const areaX2 = cross.length();
    if (areaX2 < 1e-10) continue;

    const normal = cross.normalize();

    // Find closest bin
    let bestDot = -Infinity;
    let bestBin = 0;
    for (let b = 0; b < BIN_COUNT; b++) {
      const d = normal.dot(bins[b].dir);
      if (d > bestDot) {
        bestDot = d;
        bestBin = b;
      }
    }
    bins[bestBin].totalArea += areaX2 * 0.5;
  }

  // Find the bin with the largest total area — this is the dominant face direction.
  let maxBinArea = 0;
  let dominantDir = new THREE.Vector3(0, -1, 0);
  for (let b = 0; b < BIN_COUNT; b++) {
    if (bins[b].totalArea > maxBinArea) {
      maxBinArea = bins[b].totalArea;
      dominantDir = bins[b].dir.clone();
    }
  }

  // We want to rotate so that the dominant face normal points DOWN (-Y).
  // That means the face will rest on the build plate.
  const targetDir = new THREE.Vector3(0, -1, 0);
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(dominantDir, targetDir);

  return quat;
}

/**
 * BuildPlateGrid: renders the rectangular grid surface representing the print bed.
 */
function BuildPlateGrid() {
  const gridRef = useRef();

  const { gridLines, borderLines } = useMemo(() => {
    const lines = [];
    const halfW = BUILD_PLATE_W / 2;
    const halfD = BUILD_PLATE_D / 2;

    // Grid lines along X axis (width)
    for (let x = -halfW; x <= halfW; x += GRID_STEP) {
      lines.push(new THREE.Vector3(x, 0, -halfD));
      lines.push(new THREE.Vector3(x, 0, halfD));
    }
    // Grid lines along Z axis (depth)
    for (let z = -halfD; z <= halfD; z += GRID_STEP) {
      lines.push(new THREE.Vector3(-halfW, 0, z));
      lines.push(new THREE.Vector3(halfW, 0, z));
    }

    const gridGeom = new THREE.BufferGeometry().setFromPoints(lines);

    // Border (thicker outline)
    const border = [
      new THREE.Vector3(-halfW, 0, -halfD),
      new THREE.Vector3(halfW, 0, -halfD),
      new THREE.Vector3(halfW, 0, halfD),
      new THREE.Vector3(-halfW, 0, halfD),
      new THREE.Vector3(-halfW, 0, -halfD),
    ];
    const borderGeom = new THREE.BufferGeometry().setFromPoints(border);

    return { gridLines: gridGeom, borderLines: borderGeom };
  }, []);

  // Cleanup geometries on unmount
  useEffect(() => {
    return () => {
      gridLines.dispose();
      borderLines.dispose();
    };
  }, [gridLines, borderLines]);

  return (
    <group>
      {/* Solid bed surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[BUILD_PLATE_W, BUILD_PLATE_D]} />
        <meshStandardMaterial
          color="#1a1d24"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Grid lines */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color="#2a2d35" transparent opacity={0.5} />
      </lineSegments>

      {/* Border */}
      <line geometry={borderLines}>
        <lineBasicMaterial color="#00D4AA" transparent opacity={0.35} linewidth={1} />
      </line>

      {/* Center crosshair — subtle */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              -8, 0.05, 0, 8, 0.05, 0,
              0, 0.05, -8, 0, 0.05, 8,
            ])}
            count={4}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00D4AA" transparent opacity={0.5} />
      </lineSegments>

      {/* Dimension labels at edges */}
      <BuildPlateDimensionLabels />
    </group>
  );
}

/**
 * Small text labels showing the build plate dimensions (250mm x 210mm).
 * Uses simple sprite-based labels.
 */
function BuildPlateDimensionLabels() {
  const widthCanvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 128, 32);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#7A8291';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${BUILD_PLATE_W}mm`, 64, 16);
    return c;
  }, []);

  const depthCanvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 128, 32);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#7A8291';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${BUILD_PLATE_D}mm`, 64, 16);
    return c;
  }, []);

  const widthTex = useMemo(() => {
    const t = new THREE.CanvasTexture(widthCanvas);
    t.needsUpdate = true;
    return t;
  }, [widthCanvas]);

  const depthTex = useMemo(() => {
    const t = new THREE.CanvasTexture(depthCanvas);
    t.needsUpdate = true;
    return t;
  }, [depthCanvas]);

  useEffect(() => {
    return () => {
      widthTex.dispose();
      depthTex.dispose();
    };
  }, [widthTex, depthTex]);

  return (
    <group>
      <sprite position={[0, 0.5, BUILD_PLATE_D / 2 + 10]} scale={[40, 10, 1]}>
        <spriteMaterial map={widthTex} transparent depthTest={false} />
      </sprite>
      <sprite position={[BUILD_PLATE_W / 2 + 12, 0.5, 0]} scale={[40, 10, 1]}>
        <spriteMaterial map={depthTex} transparent depthTest={false} />
      </sprite>
    </group>
  );
}

/**
 * BuildPlateModel: the model positioned on top of the build plate.
 * Supports STL (BufferGeometry), OBJ and 3MF (Group).
 * Handles auto-orient rotation and places model so its bottom touches Y=0.
 */
function BuildPlateModel({ url, ext, orientQuat, onBoundsComputed }) {
  const LoaderClass = getLoaderForExt(ext) || STLLoader;
  const loaded = useLoader(LoaderClass, url);
  const meshRef = useRef();

  // Process the loaded data into a renderable object placed on the build plate.
  const processedObject = useMemo(() => {
    if (!loaded) return null;

    // Determine if we have a single geometry (STL) or a group (OBJ/3MF)
    const isGeometry = loaded.isBufferGeometry;

    if (isGeometry) {
      // STL path — same as before
      const cloned = loaded.clone();
      cloned.computeBoundingBox();
      const box = cloned.boundingBox;
      if (!box) return cloned;
      const cx = (box.min.x + box.max.x) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      const cy = (box.min.y + box.max.y) / 2;
      cloned.translate(-cx, -cy, -cz);

      if (orientQuat) {
        const mat = new THREE.Matrix4().makeRotationFromQuaternion(orientQuat);
        cloned.applyMatrix4(mat);
      }

      cloned.computeBoundingBox();
      const newBox = cloned.boundingBox;
      if (newBox) cloned.translate(0, -newBox.min.y, 0);
      cloned.computeVertexNormals();
      return { type: 'geometry', geometry: cloned };
    }

    // Group path (OBJ/3MF)
    const cloned = loaded.clone(true);

    // Center the group
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center);

    // Apply orient quaternion
    if (orientQuat) {
      cloned.quaternion.copy(orientQuat).multiply(cloned.quaternion);
    }

    // Update world matrix and recompute bounds
    cloned.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(cloned);
    cloned.position.y -= newBox.min.y;

    // Process children: compute normals, apply teal material
    cloned.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        child.material = new THREE.MeshStandardMaterial({ color: '#00D4AA', metalness: 0.2, roughness: 0.35 });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return { type: 'group', group: cloned };
  }, [loaded, orientQuat, ext]);

  // Report bounding box to parent for dimension labels
  useEffect(() => {
    if (!processedObject || typeof onBoundsComputed !== 'function') return;

    let box;
    if (processedObject.type === 'geometry') {
      processedObject.geometry.computeBoundingBox();
      box = processedObject.geometry.boundingBox;
    } else {
      processedObject.group.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(processedObject.group);
    }

    if (!box) return;
    onBoundsComputed({
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
      size: {
        x: box.max.x - box.min.x,
        y: box.max.y - box.min.y,
        z: box.max.z - box.min.z,
      },
    });
  }, [processedObject, onBoundsComputed]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      if (processedObject?.type === 'geometry' && processedObject.geometry !== loaded) {
        processedObject.geometry.dispose();
      }
    };
  }, [processedObject, loaded]);

  if (!processedObject) return null;

  if (processedObject.type === 'geometry') {
    return (
      <mesh ref={meshRef} geometry={processedObject.geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#00D4AA" metalness={0.2} roughness={0.35} />
      </mesh>
    );
  }

  return <primitive object={processedObject.group} />;
}

/**
 * ModelDimensionLabels: dimension lines and labels around the model bounding box.
 * Renders L-shaped bracket lines along X (width), Y (height), Z (depth) with
 * Html-based text labels showing the measurement in mm.
 */
const DIMENSION_LABEL_STYLE = {
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '3px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  border: '1px solid rgba(0, 212, 170, 0.4)',
};

function ModelDimensionLabels({ bounds }) {
  if (!bounds) return null;

  const { min, max, size } = bounds;
  const OFFSET = 8; // offset from model surface for bracket lines
  const TICK = 4;   // tick mark length at bracket ends

  const dimColor = new THREE.Color('#00D4AA');
  const dimOpacity = 0.5;

  // Width line (X axis) — runs along the front-bottom edge (min.z - OFFSET, min.y)
  const widthLinePoints = useMemo(() => {
    const z = min.z - OFFSET;
    const y = min.y;
    return new Float32Array([
      // Main line
      min.x, y, z, max.x, y, z,
      // Left tick
      min.x, y, z - TICK, min.x, y, z + TICK,
      // Right tick
      max.x, y, z - TICK, max.x, y, z + TICK,
    ]);
  }, [min, max]);

  // Height line (Y axis) — runs along the front-right edge (max.x + OFFSET, min.z - OFFSET)
  const heightLinePoints = useMemo(() => {
    const x = max.x + OFFSET;
    const z = min.z - OFFSET;
    return new Float32Array([
      // Main line
      x, min.y, z, x, max.y, z,
      // Bottom tick
      x - TICK, min.y, z, x + TICK, min.y, z,
      // Top tick
      x - TICK, max.y, z, x + TICK, max.y, z,
    ]);
  }, [min, max]);

  // Depth line (Z axis) — runs along the right-bottom edge (max.x + OFFSET, min.y)
  const depthLinePoints = useMemo(() => {
    const x = max.x + OFFSET;
    const y = min.y;
    return new Float32Array([
      // Main line
      x, y, min.z, x, y, max.z,
      // Front tick
      x - TICK, y, min.z, x + TICK, y, min.z,
      // Back tick
      x - TICK, y, max.z, x + TICK, y, max.z,
    ]);
  }, [min, max]);

  // Label positions (midpoints of each dimension line)
  const widthLabelPos = useMemo(
    () => [(min.x + max.x) / 2, min.y, min.z - OFFSET],
    [min, max]
  );
  const heightLabelPos = useMemo(
    () => [max.x + OFFSET, (min.y + max.y) / 2, min.z - OFFSET],
    [min, max]
  );
  const depthLabelPos = useMemo(
    () => [max.x + OFFSET, min.y, (min.z + max.z) / 2],
    [min, max]
  );

  const fmtDim = (val) => `${val.toFixed(1)} mm`;

  return (
    <group>
      {/* Width (X) bracket */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={widthLinePoints}
            count={widthLinePoints.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>

      {/* Width label */}
      <group position={widthLabelPos}>
        <Html center distanceFactor={250} style={{ pointerEvents: 'none' }}>
          <div style={DIMENSION_LABEL_STYLE}>{fmtDim(size.x)}</div>
        </Html>
      </group>

      {/* Height (Y) bracket */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={heightLinePoints}
            count={heightLinePoints.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>

      {/* Height label */}
      <group position={heightLabelPos}>
        <Html center distanceFactor={250} style={{ pointerEvents: 'none' }}>
          <div style={DIMENSION_LABEL_STYLE}>{fmtDim(size.y)}</div>
        </Html>
      </group>

      {/* Depth (Z) bracket */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={depthLinePoints}
            count={depthLinePoints.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>

      {/* Depth label */}
      <group position={depthLabelPos}>
        <Html center distanceFactor={250} style={{ pointerEvents: 'none' }}>
          <div style={DIMENSION_LABEL_STYLE}>{fmtDim(size.z)}</div>
        </Html>
      </group>
    </group>
  );
}

/**
 * BuildPlateScene: the full scene with lighting, shadows, grid, and model.
 */
function BuildPlateScene({ url, ext, orientQuat, showDimensions, onBoundsComputed, modelBounds }) {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.4} />

      {/* Key light with shadows */}
      <directionalLight
        position={[150, 200, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Fill light */}
      <directionalLight position={[-100, 80, -80]} intensity={0.5} />

      {/* Rim/back light */}
      <directionalLight position={[0, 50, -150]} intensity={0.3} />

      {/* Build plate grid */}
      <BuildPlateGrid />

      {/* Model on the plate */}
      <Suspense fallback={null}>
        <BuildPlateModel url={url} ext={ext} orientQuat={orientQuat} onBoundsComputed={onBoundsComputed} />
      </Suspense>

      {/* Dimension labels overlay */}
      {showDimensions && modelBounds && (
        <ModelDimensionLabels bounds={modelBounds} />
      )}
    </>
  );
}

/**
 * BuildPlateCanvas: wrapper with Canvas, controls, and auto-orient button.
 */
function BuildPlateCanvas({ file, ext }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const canvasWrapRef = useRef(null);
  const [orientQuat, setOrientQuat] = useState(null);
  const [isOrienting, setIsOrienting] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [modelBounds, setModelBounds] = useState(null);

  const handleBoundsComputed = useCallback((bounds) => {
    setModelBounds(bounds);
  }, []);

  useEffect(() => {
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };
  }, [url]);

  // Prevent page scrolling on wheel
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

  const handleAutoOrient = useCallback(() => {
    setIsOrienting(true);

    // Load the geometry/group to compute the orientation.
    const LoaderClass = getLoaderForExt(ext) || STLLoader;
    const loader = new LoaderClass();
    loader.load(url, (loaded) => {
      // Extract geometries — for STL it's the geometry itself, for OBJ/3MF it's from children
      const geometries = extractGeometries(loaded);
      if (geometries.length > 0) {
        // Use the first (largest) geometry for auto-orient computation
        const quat = computeAutoOrientQuaternion(geometries[0]);
        setOrientQuat(quat);
      }
      // Dispose if it's a standalone geometry
      if (loaded.isBufferGeometry) loaded.dispose();
      setIsOrienting(false);
    }, undefined, () => {
      setIsOrienting(false);
    });
  }, [url, ext]);

  // Camera position: slightly above and angled for a nice perspective of the bed
  const camPos = useMemo(() => [200, 180, 260], []);

  return (
    <div ref={canvasWrapRef} style={{ width: '100%', height: '100%', position: 'relative', ...fg.canvasWrap }}>
      <Canvas
        shadows
        camera={{ position: camPos, fov: 45, near: 1, far: 2000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <BuildPlateScene url={url} ext={ext} orientQuat={orientQuat} showDimensions={showDimensions} onBoundsComputed={handleBoundsComputed} modelBounds={modelBounds} />
        <OrbitControls
          target={[0, 30, 0]}
          enablePan
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={50}
          maxDistance={600}
        />
      </Canvas>

      {/* Auto-orient button overlay */}
      <div style={fg.buildPlateToolbar}>
        <button
          type="button"
          onClick={handleAutoOrient}
          disabled={isOrienting}
          style={{
            ...fg.buildPlateBtn,
            opacity: isOrienting ? 0.5 : 1,
            cursor: isOrienting ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isOrienting) {
              e.currentTarget.style.background = 'rgba(0, 212, 170, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
          }}
          aria-label="Automaticky orientovat model na tiskovou desku"
        >
          <Icon name="RotateCcw" size={13} />
          {isOrienting ? 'Orientuji...' : 'Auto položení'}
        </button>

        {orientQuat && (
          <button
            type="button"
            onClick={() => setOrientQuat(null)}
            style={fg.buildPlateBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 170, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
            }}
            aria-label="Reset orientace"
          >
            <Icon name="Undo2" size={13} />
            Reset
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowDimensions((v) => !v)}
          style={{
            ...fg.buildPlateBtn,
            ...(showDimensions
              ? { background: 'rgba(0, 212, 170, 0.15)', borderColor: 'rgba(0, 212, 170, 0.6)' }
              : {}),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 212, 170, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.6)';
          }}
          onMouseLeave={(e) => {
            if (showDimensions) {
              e.currentTarget.style.background = 'rgba(0, 212, 170, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.6)';
            } else {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
            }
          }}
          aria-label={showDimensions ? 'Skrýt rozměry modelu' : 'Zobrazit rozměry modelu'}
        >
          <Icon name="Ruler" size={13} />
          Rozměry
        </button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
 * TAB BAR COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════ */

const TAB_PREVIEW = 'preview';
const TAB_BUILD_PLATE = 'buildplate';

function ViewerTabBar({ activeTab, onTabChange }) {
  return (
    <div style={fg.tabBar} role="tablist" aria-label="Režim zobrazení modelu">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === TAB_PREVIEW}
        onClick={() => onTabChange(TAB_PREVIEW)}
        style={{
          ...fg.tab,
          ...(activeTab === TAB_PREVIEW ? fg.tabActive : fg.tabInactive),
        }}
        onMouseEnter={(e) => {
          if (activeTab !== TAB_PREVIEW) {
            e.currentTarget.style.color = 'var(--forge-text-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== TAB_PREVIEW) {
            e.currentTarget.style.color = 'var(--forge-text-muted)';
          }
        }}
      >
        <Icon name="Eye" size={13} />
        3D Náhled
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === TAB_BUILD_PLATE}
        onClick={() => onTabChange(TAB_BUILD_PLATE)}
        style={{
          ...fg.tab,
          ...(activeTab === TAB_BUILD_PLATE ? fg.tabActive : fg.tabInactive),
        }}
        onMouseEnter={(e) => {
          if (activeTab !== TAB_BUILD_PLATE) {
            e.currentTarget.style.color = 'var(--forge-text-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== TAB_BUILD_PLATE) {
            e.currentTarget.style.color = 'var(--forge-text-muted)';
          }
        }}
      >
        <Icon name="Grid3x3" size={13} />
        Tisková deska
      </button>
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
 * - Tab system: "3D Náhled" (original) + "Tisková deska" (build plate viewer)
 */
const ModelViewer = ({ selectedFile, onRemove, onSurfaceComputed, onGeometryLoaded }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_PREVIEW);

  const fileObj = selectedFile?.file instanceof File ? selectedFile.file : null;
  const ext = String(selectedFile?.name || '').split('.').pop()?.toLowerCase();
  const sizeMb = (selectedFile?.size || fileObj?.size || 0) / (1024 * 1024);
  const fileId = selectedFile?.id;

  // Safety thresholds (stability > fancy preview)
  const tooLargeForPreview = sizeMb > MAX_PREVIEW_MB;
  const previewSupported = SUPPORTED_PREVIEW_EXTS.includes(ext);
  const canFullscreen = !!fileObj && previewSupported && !tooLargeForPreview;
  const canComputeSurface = !!fileObj && previewSupported && !tooLargeForPreview;
  const canShowBuildPlate = !!fileObj && previewSupported && !tooLargeForPreview;

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

  // Reset to preview tab when file changes
  useEffect(() => {
    setActiveTab(TAB_PREVIEW);
  }, [fileId]);

  const handleRemove = () => {
    setIsFullScreen(false);
    onRemove?.(selectedFile);
  };

  if (!selectedFile) {
    return (
      <div className="tk-model-viewer-empty" style={fg.emptyContainer}>
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
      <div className="tk-model-viewer" style={fg.container}>
        {/* Tab bar — only show when STL preview is possible */}
        {canShowBuildPlate && (
          <ViewerTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        <div className="tk-model-viewer-toolbar" style={fg.toolbar}>
          {canFullscreen && activeTab === TAB_PREVIEW && (
            <Button
              variant="ghost"
              size="icon"
              className="tk-model-viewer-fullscreen-btn"
              onClick={() => setIsFullScreen(true)}
              aria-label="Celá obrazovka"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Icon name="Expand" size={18} />
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
                Náhled je dostupný pro STL, OBJ a 3MF soubory.
                <br />
                Pro data použijte „Metriky ze sliceru".
              </div>
            ) : tooLargeForPreview ? (
              <div style={fg.fallbackWrap}>
                Náhled je vypnutý (velký soubor ~{sizeMb.toFixed(1)} MB).
                <br />
                Pro data použijte „Metriky ze sliceru".
              </div>
            ) : activeTab === TAB_PREVIEW ? (
              <ModelCanvas file={fileObj} ext={ext} computeSurface={canComputeSurfaceSafe} onSurfaceComputed={handleSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />
            ) : (
              <BuildPlateCanvas file={fileObj} ext={ext} />
            )}
          </ErrorBoundary>
        </div>

        <div className="tk-model-viewer-infobar" style={fg.infoBar}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <p style={fg.fileName} title={selectedFile.name}>
              {selectedFile.name}
            </p>
          </div>

          {/* Backend metrics */}
          {(dims?.x || dims?.y || dims?.z || volumeCm3 != null || metrics) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(dims?.x || dims?.y || dims?.z || volumeCm3 != null) && (
                <div className="tk-model-viewer-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem', fontSize: 'var(--forge-text-xs)' }}>
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
        <FullScreenViewer fileUrl={fileUrl} ext={ext} onClose={() => setIsFullScreen(false)} />
      )}
    </>
  );
};

export default ModelViewer;
