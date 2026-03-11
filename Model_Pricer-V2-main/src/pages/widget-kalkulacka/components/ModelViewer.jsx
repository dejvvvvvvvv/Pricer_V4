import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ErrorBoundary from './ErrorBoundary';
import { analyzeMesh, repairMesh, exportSTL } from '../../../lib/meshRepair';

// Surface area (STL) – frontend-only with guardrails
const MAX_PREVIEW_MB = 12;
const MAX_SURFACE_VERTICES = 2_000_000;
const MAX_SURFACE_TRIANGLES = 1_000_000;
const MAX_SURFACE_TIME_MS = 140;

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
      let ia, ib, ic;
      if (indexArray) {
        ia = indexArray[t * 3] * 3;
        ib = indexArray[t * 3 + 1] * 3;
        ic = indexArray[t * 3 + 2] * 3;
      } else {
        ia = t * 9;
        ib = t * 9 + 3;
        ic = t * 9 + 6;
      }

      const ax = arr[ia], ay = arr[ia + 1], az = arr[ia + 2];
      const bx = arr[ib], by = arr[ib + 1], bz = arr[ib + 2];
      const cx = arr[ic], cy = arr[ic + 1], cz = arr[ic + 2];

      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;

      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;

      areaMm2 += 0.5 * Math.sqrt((crossX * crossX) + (crossY * crossY) + (crossZ * crossZ));

      if (t > 0 && (t % checkEvery === 0)) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if ((now - t0) > maxMs) {
          return { surfaceMm2: null, reason: 'time_budget_exceeded', vertexCount, triangleCount, ms: now - t0 };
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

  useMemo(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }, [geometry]);

  // Notify parent when geometry is loaded
  useEffect(() => {
    if (geometry && typeof onGeometryLoaded === 'function') {
      onGeometryLoaded(geometry);
    }
  }, [geometry, onGeometryLoaded]);

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

const FullScreenModel = ({ url }) => {
  const geom = useLoader(STLLoader, url);
  const mesh = useMemo(() => {
    geom.computeVertexNormals();
    return new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({ color: '#1E90FF', metalness: 0.1, roughness: 0.5 })
    );
  }, [geom]);
  return <primitive object={mesh} />;
};

const FullScreenViewer = ({ fileUrl, onClose }) => {
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-[90vw] h-[90vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Zavrit cele okno"
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

function STLCanvas({ file, computeSurface, onSurfaceComputed, onGeometryLoaded }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const canvasWrapRef = useRef(null);

  useEffect(() => {
    return () => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    };
  }, [url]);

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
        <STLModel url={url} computeSurface={computeSurface} onSurfaceComputed={onSurfaceComputed} onGeometryLoaded={onGeometryLoaded} />
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 * BUILD PLATE VIEWER — 3D print bed visualization (ported from test-kalkulacka)
 * Uses widget CSS vars instead of Forge tokens.
 * ══════════════════════════════════════════════════════════════════════════════ */

// Default build plate size: Prusa MK3S+ (250 x 210 mm)
const BUILD_PLATE_W = 250;
const BUILD_PLATE_D = 210;
const GRID_STEP = 10; // grid lines every 10mm

/**
 * Auto-orient: find the largest flat face of the mesh and compute a rotation
 * quaternion that orients that face downward (-Y).
 */
function computeAutoOrientQuaternion(geometry) {
  const position = geometry?.attributes?.position;
  if (!position || !position.array) return new THREE.Quaternion();

  const index = geometry.getIndex?.() || geometry.index;
  const indexArray = index?.array || null;
  const vertexCount = position.count || 0;
  const triangleCount = indexArray
    ? Math.floor((indexArray.length || 0) / 3)
    : Math.floor(vertexCount / 3);

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  // Fibonacci sphere bins for robust dominant-face detection
  const BIN_COUNT = 42;
  const bins = [];
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

  let maxBinArea = 0;
  let dominantDir = new THREE.Vector3(0, -1, 0);
  for (let b = 0; b < BIN_COUNT; b++) {
    if (bins[b].totalArea > maxBinArea) {
      maxBinArea = bins[b].totalArea;
      dominantDir = bins[b].dir.clone();
    }
  }

  const targetDir = new THREE.Vector3(0, -1, 0);
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(dominantDir, targetDir);

  return quat;
}

/**
 * BuildPlateGrid: renders the rectangular grid surface representing the print bed.
 * Uses widget accent color (via CSS var read at render time).
 */
function BuildPlateGrid({ accentColor }) {
  const gridRef = useRef();
  const borderColor = new THREE.Color(accentColor || '#1E90FF');

  const { gridLines, borderLines } = useMemo(() => {
    const lines = [];
    const halfW = BUILD_PLATE_W / 2;
    const halfD = BUILD_PLATE_D / 2;

    for (let x = -halfW; x <= halfW; x += GRID_STEP) {
      lines.push(new THREE.Vector3(x, 0, -halfD));
      lines.push(new THREE.Vector3(x, 0, halfD));
    }
    for (let z = -halfD; z <= halfD; z += GRID_STEP) {
      lines.push(new THREE.Vector3(-halfW, 0, z));
      lines.push(new THREE.Vector3(halfW, 0, z));
    }

    const gridGeom = new THREE.BufferGeometry().setFromPoints(lines);

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
        <meshStandardMaterial color="#1a1d24" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Grid lines */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color="#2a2d35" transparent opacity={0.5} />
      </lineSegments>

      {/* Border */}
      <line geometry={borderLines}>
        <lineBasicMaterial color={borderColor} transparent opacity={0.35} linewidth={1} />
      </line>

      {/* Center crosshair */}
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
        <lineBasicMaterial color={borderColor} transparent opacity={0.5} />
      </lineSegments>

      {/* Dimension labels at edges */}
      <BuildPlateDimensionLabels />
    </group>
  );
}

/**
 * Small text labels showing the build plate dimensions (250mm x 210mm).
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
 * BuildPlateModel: the STL model positioned on top of the build plate.
 */
function BuildPlateModel({ url, orientQuat, onBoundsComputed }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef();

  const processedGeometry = useMemo(() => {
    if (!geometry) return null;

    const cloned = geometry.clone();
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
    if (newBox) {
      cloned.translate(0, -newBox.min.y, 0);
    }

    cloned.computeVertexNormals();
    return cloned;
  }, [geometry, orientQuat]);

  useEffect(() => {
    if (!processedGeometry || typeof onBoundsComputed !== 'function') return;
    processedGeometry.computeBoundingBox();
    const box = processedGeometry.boundingBox;
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
  }, [processedGeometry, onBoundsComputed]);

  useEffect(() => {
    return () => {
      if (processedGeometry && processedGeometry !== geometry) {
        processedGeometry.dispose();
      }
    };
  }, [processedGeometry, geometry]);

  if (!processedGeometry) return null;

  return (
    <mesh ref={meshRef} geometry={processedGeometry} castShadow receiveShadow>
      <meshStandardMaterial color="#1E90FF" metalness={0.2} roughness={0.35} />
    </mesh>
  );
}

/**
 * ModelDimensionLabels: dimension lines and labels around the model bounding box.
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
  border: '1px solid rgba(30, 144, 255, 0.4)',
};

function ModelDimensionLabels({ bounds, accentColor }) {
  if (!bounds) return null;

  const { min, max, size } = bounds;
  const OFFSET = 8;
  const TICK = 4;
  const dimColor = new THREE.Color(accentColor || '#1E90FF');
  const dimOpacity = 0.5;

  const widthLinePoints = useMemo(() => {
    const z = min.z - OFFSET;
    const y = min.y;
    return new Float32Array([
      min.x, y, z, max.x, y, z,
      min.x, y, z - TICK, min.x, y, z + TICK,
      max.x, y, z - TICK, max.x, y, z + TICK,
    ]);
  }, [min, max]);

  const heightLinePoints = useMemo(() => {
    const x = max.x + OFFSET;
    const z = min.z - OFFSET;
    return new Float32Array([
      x, min.y, z, x, max.y, z,
      x - TICK, min.y, z, x + TICK, min.y, z,
      x - TICK, max.y, z, x + TICK, max.y, z,
    ]);
  }, [min, max]);

  const depthLinePoints = useMemo(() => {
    const x = max.x + OFFSET;
    const y = min.y;
    return new Float32Array([
      x, y, min.z, x, y, max.z,
      x - TICK, y, min.z, x + TICK, y, min.z,
      x - TICK, y, max.z, x + TICK, y, max.z,
    ]);
  }, [min, max]);

  const widthLabelPos = useMemo(() => [(min.x + max.x) / 2, min.y, min.z - OFFSET], [min, max]);
  const heightLabelPos = useMemo(() => [max.x + OFFSET, (min.y + max.y) / 2, min.z - OFFSET], [min, max]);
  const depthLabelPos = useMemo(() => [max.x + OFFSET, min.y, (min.z + max.z) / 2], [min, max]);

  const fmtDim = (val) => `${val.toFixed(1)} mm`;

  return (
    <group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={widthLinePoints} count={widthLinePoints.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>
      <group position={widthLabelPos}>
        <Html center distanceFactor={250} style={{ pointerEvents: 'none' }}>
          <div style={DIMENSION_LABEL_STYLE}>{fmtDim(size.x)}</div>
        </Html>
      </group>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={heightLinePoints} count={heightLinePoints.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>
      <group position={heightLabelPos}>
        <Html center distanceFactor={250} style={{ pointerEvents: 'none' }}>
          <div style={DIMENSION_LABEL_STYLE}>{fmtDim(size.y)}</div>
        </Html>
      </group>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={depthLinePoints} count={depthLinePoints.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={dimColor} transparent opacity={dimOpacity} />
      </lineSegments>
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
function BuildPlateScene({ url, orientQuat, showDimensions, onBoundsComputed, modelBounds, accentColor }) {
  return (
    <>
      <ambientLight intensity={0.4} />
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
      <directionalLight position={[-100, 80, -80]} intensity={0.5} />
      <directionalLight position={[0, 50, -150]} intensity={0.3} />

      <BuildPlateGrid accentColor={accentColor} />

      <Suspense fallback={null}>
        <BuildPlateModel url={url} orientQuat={orientQuat} onBoundsComputed={onBoundsComputed} />
      </Suspense>

      {showDimensions && modelBounds && (
        <ModelDimensionLabels bounds={modelBounds} accentColor={accentColor} />
      )}
    </>
  );
}

/**
 * BuildPlateCanvas: wrapper with Canvas, controls, and auto-orient button.
 * Styled with widget CSS vars.
 */
function BuildPlateCanvas({ file, accentColor }) {
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
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    };
  }, [url]);

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
    const loader = new STLLoader();
    loader.load(url, (geometry) => {
      const quat = computeAutoOrientQuaternion(geometry);
      geometry.dispose();
      setOrientQuat(quat);
      setIsOrienting(false);
    }, undefined, () => {
      setIsOrienting(false);
    });
  }, [url]);

  const camPos = useMemo(() => [200, 180, 260], []);

  // Button style using widget accent color
  const btnBaseStyle = {
    padding: '0.35rem 0.75rem',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: `1px solid ${accentColor || '#1E90FF'}4D`,
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    color: accentColor || '#1E90FF',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  };

  return (
    <div ref={canvasWrapRef} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: camPos, fov: 45, near: 1, far: 2000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <BuildPlateScene url={url} orientQuat={orientQuat} showDimensions={showDimensions} onBoundsComputed={handleBoundsComputed} modelBounds={modelBounds} accentColor={accentColor} />
        <OrbitControls
          target={[0, 30, 0]}
          enablePan
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={50}
          maxDistance={600}
        />
      </Canvas>

      {/* Auto-orient button overlay */}
      <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleAutoOrient}
          disabled={isOrienting}
          style={{
            ...btnBaseStyle,
            opacity: isOrienting ? 0.5 : 1,
            cursor: isOrienting ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isOrienting) {
              e.currentTarget.style.background = `${accentColor || '#1E90FF'}26`;
              e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}99`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}4D`;
          }}
          aria-label="Automaticky orientovat model na tiskovou desku"
        >
          <Icon name="RotateCcw" size={13} />
          {isOrienting ? 'Orientuji...' : 'Auto polozeni'}
        </button>

        {orientQuat && (
          <button
            type="button"
            onClick={() => setOrientQuat(null)}
            style={btnBaseStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${accentColor || '#1E90FF'}26`;
              e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}99`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}4D`;
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
            ...btnBaseStyle,
            ...(showDimensions
              ? { background: `${accentColor || '#1E90FF'}26`, borderColor: `${accentColor || '#1E90FF'}99` }
              : {}),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accentColor || '#1E90FF'}26`;
            e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}99`;
          }}
          onMouseLeave={(e) => {
            if (showDimensions) {
              e.currentTarget.style.background = `${accentColor || '#1E90FF'}26`;
              e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}99`;
            } else {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = `${accentColor || '#1E90FF'}4D`;
            }
          }}
          aria-label={showDimensions ? 'Skryt rozmery modelu' : 'Zobrazit rozmery modelu'}
        >
          <Icon name="Ruler" size={13} />
          Rozmery
        </button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
 * TAB BAR — "3D Nahled" / "Tiskova deska"
 * Styled with widget CSS vars.
 * ══════════════════════════════════════════════════════════════════════════════ */

const TAB_PREVIEW = 'preview';
const TAB_BUILD_PLATE = 'buildplate';

function ViewerTabBar({ activeTab, onTabChange, disabled, accentColor, borderRadius }) {
  const tabBarStyle = {
    display: 'flex',
    gap: '2px',
    marginBottom: '0.5rem',
    background: 'var(--widget-card, #F3F4F6)',
    borderRadius: borderRadius || '8px',
    padding: '2px',
  };

  const tabBase = {
    flex: 1,
    padding: '0.4rem 0.5rem',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    border: 'none',
    borderRadius: borderRadius ? `calc(${borderRadius} - 2px)` : '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
  };

  const tabActiveStyle = {
    background: 'var(--widget-bg, #FFFFFF)',
    color: accentColor || '#1E90FF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const tabInactiveStyle = {
    background: 'transparent',
    color: 'var(--widget-muted, #6B7280)',
  };

  return (
    <div style={tabBarStyle} role="tablist" aria-label="Rezim zobrazeni modelu">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === TAB_PREVIEW}
        disabled={disabled}
        onClick={() => !disabled && onTabChange(TAB_PREVIEW)}
        style={{
          ...tabBase,
          ...(activeTab === TAB_PREVIEW ? tabActiveStyle : tabInactiveStyle),
        }}
      >
        <Icon name="Eye" size={13} />
        3D Nahled
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === TAB_BUILD_PLATE}
        disabled={disabled}
        onClick={() => !disabled && onTabChange(TAB_BUILD_PLATE)}
        style={{
          ...tabBase,
          ...(activeTab === TAB_BUILD_PLATE ? tabActiveStyle : tabInactiveStyle),
        }}
      >
        <Icon name="Grid3x3" size={13} />
        Tiskova deska
      </button>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
 * MESH REPAIR PANEL — lightweight collapsible section
 * Only visible when NOT in builder mode. Uses shared meshRepair.js lib.
 * ══════════════════════════════════════════════════════════════════════════════ */

function MeshRepairPanel({ geometry, fileName, accentColor, borderRadius }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);

  // Reset state when geometry changes
  useEffect(() => {
    setAnalysisResult(null);
    setRepairResult(null);
    setIsOpen(false);
  }, [geometry]);

  const handleAnalyze = useCallback(() => {
    if (!geometry || isAnalyzing) return;
    setIsAnalyzing(true);
    setRepairResult(null);
    try {
      const result = analyzeMesh(geometry);
      setAnalysisResult(result);
    } catch (e) {
      setAnalysisResult({ issues: [{ type: 'ERROR', severity: 'error', message: 'Analyza selhala: ' + (e?.message || e) }], isWatertight: false });
    } finally {
      setIsAnalyzing(false);
    }
  }, [geometry, isAnalyzing]);

  const handleRepair = useCallback(() => {
    if (!geometry || isRepairing) return;
    setIsRepairing(true);
    try {
      const result = repairMesh(geometry);
      setRepairResult(result);
      setAnalysisResult(result.issuesAfter);
    } catch (e) {
      setRepairResult({ repairsApplied: ['Oprava selhala: ' + (e?.message || e)] });
    } finally {
      setIsRepairing(false);
    }
  }, [geometry, isRepairing]);

  const handleDownload = useCallback(() => {
    if (!repairResult?.repairedGeometry) return;
    const baseName = (fileName || 'model').replace(/\.[^.]+$/, '');
    exportSTL(repairResult.repairedGeometry, `${baseName}_repaired.stl`);
  }, [repairResult, fileName]);

  if (!geometry) return null;

  const accent = accentColor || '#1E90FF';
  const rad = borderRadius || '12px';

  const hasErrors = analysisResult?.issues?.some(i => i.severity === 'error');
  const hasWarnings = analysisResult?.issues?.some(i => i.severity === 'warning');
  const isOk = analysisResult && !hasErrors && !hasWarnings;

  const severityIcon = (sev) => {
    if (sev === 'error') return 'AlertTriangle';
    if (sev === 'warning') return 'AlertCircle';
    return 'CheckCircle';
  };
  const severityColor = (sev) => {
    if (sev === 'error') return '#EF4444';
    if (sev === 'warning') return '#F59E0B';
    return '#22C55E';
  };

  // Small action button style
  const actionBtnStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 600,
    border: `1px solid ${accent}4D`,
    borderRadius: '6px',
    background: 'var(--widget-bg, #FFFFFF)',
    color: accent,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      style={{
        marginTop: '8px',
        border: '1px solid var(--widget-border, #E5E7EB)',
        borderRadius: rad,
        overflow: 'hidden',
      }}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--widget-card, #F9FAFB)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--widget-header, #1F2937)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="Wrench" size={14} style={{ color: 'var(--widget-muted, #6B7280)' }} />
          Mesh Repair
          {analysisResult && (
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: hasErrors ? '#EF4444' : hasWarnings ? '#F59E0B' : '#22C55E',
                marginLeft: 4,
              }}
              title={hasErrors ? 'Nalezeny chyby' : hasWarnings ? 'Nalezena varovani' : 'Mesh OK'}
            />
          )}
        </span>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={14}
          style={{ color: 'var(--widget-muted, #6B7280)' }}
        />
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--widget-bg, #FFFFFF)',
            borderTop: '1px solid var(--widget-border, #E5E7EB)',
          }}
        >
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: analysisResult ? '10px' : 0 }}>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              style={{
                ...actionBtnStyle,
                opacity: isAnalyzing ? 0.6 : 1,
                cursor: isAnalyzing ? 'wait' : 'pointer',
              }}
            >
              {isAnalyzing ? (
                <Icon name="Loader2" size={12} className="animate-spin" />
              ) : (
                <Icon name="Search" size={12} />
              )}
              {isAnalyzing ? 'Analyzuji...' : 'Analyzovat'}
            </button>

            {analysisResult && (hasErrors || hasWarnings) && (
              <button
                type="button"
                onClick={handleRepair}
                disabled={isRepairing}
                style={{
                  ...actionBtnStyle,
                  opacity: isRepairing ? 0.6 : 1,
                  cursor: isRepairing ? 'wait' : 'pointer',
                }}
              >
                {isRepairing ? (
                  <Icon name="Loader2" size={12} className="animate-spin" />
                ) : (
                  <Icon name="Wrench" size={12} />
                )}
                {isRepairing ? 'Opravuji...' : 'Auto oprava'}
              </button>
            )}

            {repairResult?.repairedGeometry && (
              <button
                type="button"
                onClick={handleDownload}
                style={actionBtnStyle}
              >
                <Icon name="Download" size={12} />
                Stahnout
              </button>
            )}
          </div>

          {/* Analysis results */}
          {analysisResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {analysisResult.issues?.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--widget-text, #374151)',
                    padding: '4px 0',
                  }}
                >
                  <Icon
                    name={severityIcon(issue.severity)}
                    size={13}
                    style={{ color: severityColor(issue.severity), flexShrink: 0, marginTop: 1 }}
                  />
                  <span>{issue.message}</span>
                </div>
              ))}

              {/* Summary stats */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '6px 8px',
                  background: 'var(--widget-card, #F9FAFB)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  color: 'var(--widget-muted, #6B7280)',
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <span>Trojuhelniky: {analysisResult.triangleCount?.toLocaleString() ?? '?'}</span>
                <span>Vertexy: {analysisResult.vertexCount?.toLocaleString() ?? '?'}</span>
                <span>Vodotesny: {analysisResult.isWatertight ? 'Ano' : 'Ne'}</span>
                {analysisResult.ms != null && <span>{analysisResult.ms.toFixed(0)} ms</span>}
              </div>
            </div>
          )}

          {/* Repair results */}
          {repairResult && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: 'var(--widget-card, #F9FAFB)',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--widget-header, #1F2937)', marginBottom: '4px' }}>
                Provedene opravy:
              </div>
              {repairResult.repairsApplied?.map((r, idx) => (
                <div key={idx} style={{ color: 'var(--widget-text, #374151)', padding: '2px 0' }}>
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════ */

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
 * Reads the computed --widget-btn-bg or --widget-btn-primary CSS var from the
 * widget container, falling back to #1E90FF. This is called once when the
 * component mounts (or when theme changes) so the 3D scene can use a concrete
 * hex color value.
 */
function resolveAccentColor(containerEl) {
  if (!containerEl || typeof getComputedStyle !== 'function') return '#1E90FF';
  const styles = getComputedStyle(containerEl);
  const btnBg = styles.getPropertyValue('--widget-btn-bg')?.trim();
  if (btnBg && btnBg !== '') return btnBg;
  const btnPrimary = styles.getPropertyValue('--widget-btn-primary')?.trim();
  if (btnPrimary && btnPrimary !== '') return btnPrimary;
  return '#1E90FF';
}

const ModelViewer = ({ selectedFile, onRemove, onSurfaceComputed, theme, builderMode = false }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_PREVIEW);
  const [loadedGeometry, setLoadedGeometry] = useState(null);
  const [accentColor, setAccentColor] = useState('#1E90FF');
  const viewerContainerRef = useRef(null);

  const fileObj = selectedFile?.file instanceof File ? selectedFile.file : null;
  const ext = String(selectedFile?.name || '').split('.').pop()?.toLowerCase();
  const sizeMb = (selectedFile?.size || fileObj?.size || 0) / (1024 * 1024);
  const fileId = selectedFile?.id;

  const tooLargeForPreview = sizeMb > MAX_PREVIEW_MB;
  const previewSupported = ext === 'stl';
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

  const handleGeometryLoaded = useCallback((geo) => {
    setLoadedGeometry(geo);
  }, []);

  useEffect(() => {
    if (!canFullscreen || !fileObj) {
      setIsFullScreen(false);
      setFileUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(fileObj);
    setFileUrl(url);
    return () => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    };
  }, [fileObj, canFullscreen]);

  // Reset to preview tab and clear geometry when file changes
  useEffect(() => {
    setActiveTab(TAB_PREVIEW);
    setLoadedGeometry(null);
  }, [fileId]);

  // Resolve accent color from CSS vars on the widget container
  useEffect(() => {
    const el = viewerContainerRef.current;
    if (!el) return;
    // Small delay to let CSS vars propagate
    const timer = setTimeout(() => {
      setAccentColor(resolveAccentColor(el));
    }, 50);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleRemove = () => {
    setIsFullScreen(false);
    onRemove?.(selectedFile);
  };

  const borderRadius = theme?.cornerRadius ? `${theme.cornerRadius}px` : '12px';

  if (!selectedFile) {
    return (
      <div
        className="aspect-square flex flex-col items-center justify-center p-4 text-center"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        <div className="space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--widget-card, #F9FAFB)' }}
          >
            <Icon name="Scan" size={40} style={{ color: 'var(--widget-muted, #6B7280)' }} />
          </div>
          <h3 className="font-semibold" style={{ color: 'var(--widget-header, #1F2937)' }}>
            Nahled modelu
          </h3>
          <p className="text-sm" style={{ color: 'var(--widget-muted, #6B7280)' }}>
            Po nahrani souboru se zde zobrazi nahled a metriky ze sliceru.
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
      <div
        ref={viewerContainerRef}
        className="relative aspect-square flex flex-col p-2"
        style={{
          backgroundColor: 'var(--widget-card, #F9FAFB)',
          border: '1px solid var(--widget-border, #E5E7EB)',
          borderRadius,
        }}
      >
        {/* Tab bar — show when STL preview is possible */}
        {canShowBuildPlate && (
          <ViewerTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={builderMode}
            accentColor={accentColor}
            borderRadius={borderRadius}
          />
        )}

        <div className="absolute top-2 right-2 z-10 flex space-x-1">
          {canFullscreen && activeTab === TAB_PREVIEW && (
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(true)} aria-label="Cela obrazovka">
              <Icon name="Expand" size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleRemove} aria-label="Odstranit model">
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div className="flex-1 min-h-0">
          <ErrorBoundary>
            {(!fileObj || !previewSupported) ? (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center p-4 text-sm text-center"
                style={{ backgroundColor: 'var(--widget-card, #F9FAFB)30', color: 'var(--widget-muted, #6B7280)' }}
              >
                Nahled je dostupny jen pro STL soubory.
                <br />
                Pro data pouzijte „Metriky ze sliceru".
              </div>
            ) : tooLargeForPreview ? (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center p-4 text-sm text-center"
                style={{ backgroundColor: 'var(--widget-card, #F9FAFB)30', color: 'var(--widget-muted, #6B7280)' }}
              >
                Nahled je vypnuty (velky soubor ~{sizeMb.toFixed(1)} MB).
                <br />
                Pro data pouzijte „Metriky ze sliceru".
              </div>
            ) : activeTab === TAB_PREVIEW ? (
              <STLCanvas file={fileObj} computeSurface={canComputeSurfaceSafe} onSurfaceComputed={handleSurfaceComputed} onGeometryLoaded={handleGeometryLoaded} />
            ) : (
              <BuildPlateCanvas file={fileObj} accentColor={accentColor} />
            )}
          </ErrorBoundary>
        </div>

        <div
          className="mt-2 p-3 backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--widget-card, #F9FAFB)80',
            border: '1px solid var(--widget-border, #E5E7EB)',
            borderRadius,
          }}
        >
          <div className="flex items-center justify-center mb-2">
            <p
              className="text-sm font-medium truncate text-center w-full"
              style={{ color: 'var(--widget-header, #1F2937)' }}
              title={selectedFile.name}
            >
              {selectedFile.name}
            </p>
          </div>

          {(dims?.x || dims?.y || dims?.z || volumeCm3 != null || metrics) && (
            <div className="space-y-2">
              {(dims?.x || dims?.y || dims?.z || volumeCm3 != null) && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div style={{ color: 'var(--widget-muted, #6B7280)' }}>Rozmery:</div>
                  <div style={{ color: 'var(--widget-text, #374151)' }}>
                    {Number(dims?.x || 0).toFixed(2)} x {Number(dims?.y || 0).toFixed(2)} x {Number(dims?.z || 0).toFixed(2)} mm
                  </div>
                  {volumeCm3 != null && (
                    <>
                      <div style={{ color: 'var(--widget-muted, #6B7280)' }}>Objem:</div>
                      <div style={{ color: 'var(--widget-text, #374151)' }}>{volumeCm3.toFixed(2)} cm3</div>
                    </>
                  )}
                  {surfaceCm2 != null && (
                    <>
                      <div style={{ color: 'var(--widget-muted, #6B7280)' }}>Povrch:</div>
                      <div style={{ color: 'var(--widget-text, #374151)' }}>{surfaceCm2.toFixed(2)} cm2</div>
                    </>
                  )}
                </div>
              )}

              {metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className="text-center p-2 rounded-md"
                    style={{ backgroundColor: 'var(--widget-card, #F9FAFB)50' }}
                  >
                    <p className="font-bold" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      {formatDuration(metrics?.estimatedTimeSeconds)}
                    </p>
                    <p style={{ color: 'var(--widget-muted, #6B7280)' }}>Cas tisku</p>
                  </div>
                  <div
                    className="text-center p-2 rounded-md"
                    style={{ backgroundColor: 'var(--widget-card, #F9FAFB)50' }}
                  >
                    <p className="font-bold" style={{ color: 'var(--widget-header, #1F2937)' }}>
                      {Number.isFinite(Number(metrics?.filamentGrams)) ? `${Number(metrics.filamentGrams).toFixed(1)} g` : '-'}
                    </p>
                    <p style={{ color: 'var(--widget-muted, #6B7280)' }}>Material</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile?.status === 'failed' && selectedFile?.error && (
            <div className="mt-2 text-xs text-red-600">
              {selectedFile.error}
            </div>
          )}
        </div>

        {/* Mesh Repair Panel — collapsible, hidden in builder mode */}
        {!builderMode && previewSupported && !tooLargeForPreview && loadedGeometry && (
          <MeshRepairPanel
            geometry={loadedGeometry}
            fileName={selectedFile?.name}
            accentColor={accentColor}
            borderRadius={borderRadius}
          />
        )}
      </div>

      {isFullScreen && fileUrl && (
        <FullScreenViewer fileUrl={fileUrl} onClose={() => setIsFullScreen(false)} />
      )}
    </>
  );
};

export default ModelViewer;
