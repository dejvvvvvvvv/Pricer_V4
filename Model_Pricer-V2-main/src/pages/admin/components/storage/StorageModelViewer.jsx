import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Bounds, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import * as THREE from 'three';

const SUPPORTED_3D_EXTS = ['stl', 'obj', '3mf'];

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

/** Renders the loaded 3D geometry/group */
function ModelMesh({ url, ext }) {
  const LoaderClass = getLoaderForExt(ext);
  const loaded = useLoader(LoaderClass, url);

  if (!loaded) return null;

  // STLLoader returns a BufferGeometry directly
  if (loaded.isBufferGeometry) {
    return (
      <mesh geometry={loaded} castShadow receiveShadow>
        <meshStandardMaterial color="#00D4AA" metalness={0.15} roughness={0.45} />
      </mesh>
    );
  }

  // OBJ/3MF return a Group — apply material to all meshes
  const group = loaded.clone();
  group.traverse?.((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: '#00D4AA',
        metalness: 0.15,
        roughness: 0.45,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={group} />;
}

/** Auto-fit camera to the loaded model */
function CameraFit() {
  const { camera, scene } = useThree();
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.8;
    camera.position.set(center.x + distance * 0.5, center.y + distance * 0.4, center.z + distance * 0.6);
    camera.lookAt(center);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
  }, [camera, scene]);
  return null;
}

/**
 * Interactive 3D model viewer for the Storage preview panel.
 * Accepts a blob URL (from getPreviewBlob) and file name.
 *
 * @param {{ blobUrl: string|null, fileName: string }} props
 */
export default function StorageModelViewer({ blobUrl, fileName }) {
  const ext = getFileExt(fileName);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
    setKey((k) => k + 1);
  }, [blobUrl]);

  if (!blobUrl || !SUPPORTED_3D_EXTS.includes(ext)) {
    return null;
  }

  if (hasError) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--forge-text-muted)',
        fontFamily: 'var(--forge-font-body)',
        fontSize: '12px',
        gap: '8px',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span>Failed to load 3D preview</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        key={key}
        camera={{ fov: 45, near: 0.1, far: 10000 }}
        shadows
        style={{ background: 'transparent' }}
        onError={() => setHasError(true)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />

        <Suspense fallback={
          <Html center>
            <div style={{
              color: 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '12px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              Loading 3D model...
            </div>
          </Html>
        }>
          <Bounds fit clip observe margin={1.3}>
            <ModelMesh url={blobUrl} ext={ext} />
          </Bounds>
        </Suspense>

        <CameraFit />
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={0.5}
          maxDistance={1000}
        />
      </Canvas>

      {/* Interaction hint */}
      <div style={{
        position: 'absolute',
        bottom: '6px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        color: 'var(--forge-text-muted)',
        opacity: 0.6,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        Drag to rotate | Scroll to zoom
      </div>
    </div>
  );
}
