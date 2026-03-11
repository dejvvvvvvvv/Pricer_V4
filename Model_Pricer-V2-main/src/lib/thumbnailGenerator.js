/**
 * Thumbnail Generator for 3D STL Models
 *
 * Renders a small PNG preview from an STL file using an offscreen Three.js
 * WebGLRenderer. Thumbnails are cached in IndexedDB (via the `idb` library)
 * so repeat requests for the same file are instant.
 *
 * Key design decisions:
 * - A **single shared renderer** is reused across all calls to avoid hitting
 *   browser WebGL context limits (typically 8-16 per page).
 * - The renderer, scene, camera, lights, material, and geometry are all
 *   created / disposed inside a tight scope so nothing leaks.
 * - The public entry point is `getOrGenerateThumbnail(file, options)`.
 */

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { openDB } from 'idb';

/* ── IndexedDB cache ────────────────────────────────────────────────────── */

const DB_NAME = 'modelpricer-thumbnails';
const DB_VERSION = 1;
const STORE_NAME = 'thumbnails';

let _dbPromise = null;

function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return _dbPromise;
}

/**
 * Retrieve a cached thumbnail data-URL from IndexedDB.
 * @param {string} fileHash
 * @returns {Promise<string|undefined>}
 */
export async function getCachedThumbnail(fileHash) {
  try {
    const db = await getDB();
    return await db.get(STORE_NAME, fileHash);
  } catch {
    return undefined;
  }
}

/**
 * Store a thumbnail data-URL in IndexedDB.
 * @param {string} fileHash
 * @param {string} dataUrl  base64 PNG data URL
 */
export async function cacheThumbnail(fileHash, dataUrl) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, dataUrl, fileHash);
  } catch {
    // Silently ignore cache write failures (quota, private mode, etc.)
  }
}

/* ── File hashing ───────────────────────────────────────────────────────── */

/**
 * Quick deterministic hash derived from file metadata.
 * This is NOT a cryptographic hash — it is meant only for cache-key
 * purposes and is intentionally cheap (no file content reading).
 *
 * @param {File} file
 * @returns {string}
 */
export function generateFileHash(file) {
  if (!file) return '';
  return `thumb_${file.name}_${file.size}_${file.lastModified}`;
}

/* ── Shared renderer singleton ──────────────────────────────────────────── */

let _renderer = null;

/**
 * Get (or lazily create) the shared offscreen WebGLRenderer.
 * The canvas is never appended to the DOM.
 */
function getRenderer(width, height) {
  if (_renderer) {
    _renderer.setSize(width, height, false);
    return _renderer;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  _renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  _renderer.setSize(width, height, false);
  _renderer.setPixelRatio(1); // Fixed 1x — thumbnails don't need retina
  _renderer.outputColorSpace = THREE.SRGBColorSpace;

  return _renderer;
}

/**
 * Explicitly destroy the shared renderer. Call this if you need to free
 * the WebGL context (e.g. on page unload or route change).
 */
export function disposeRenderer() {
  if (_renderer) {
    _renderer.dispose();
    _renderer.forceContextLoss();
    _renderer = null;
  }
}

/* ── Thumbnail generation ───────────────────────────────────────────────── */

const DEFAULT_OPTIONS = {
  width: 128,
  height: 128,
  background: '#1a1a2e',
  modelColor: '#00D4AA',
};

/**
 * Generate a PNG data-URL thumbnail from a raw STL File / Blob.
 *
 * @param {File|Blob} stlFile
 * @param {object}    [options]
 * @param {number}    [options.width=128]
 * @param {number}    [options.height=128]
 * @param {string}    [options.background='#1a1a2e']
 * @param {string}    [options.modelColor='#00D4AA']
 * @returns {Promise<string>} base64 PNG data URL
 */
export async function generateThumbnail(stlFile, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Read the file into an ArrayBuffer
  const arrayBuffer = await stlFile.arrayBuffer();

  // 2. Parse with STLLoader
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);

  // 3. Center the geometry and compute normals
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  // 4. Build a minimal scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background);

  const material = new THREE.MeshStandardMaterial({
    color: opts.modelColor,
    metalness: 0.15,
    roughness: 0.45,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lights — match the ModelViewer setup
  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight1.position.set(10, 10, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight2.position.set(-10, -5, -10);
  scene.add(dirLight2);

  // 5. Camera — isometric-ish angle (slightly above and to the right)
  const camera = new THREE.PerspectiveCamera(50, opts.width / opts.height, 0.1, 10000);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  const dist = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.35; // 1.35x padding

  // Position: upper-right-front (isometric feel)
  camera.position.set(dist * 0.7, dist * 0.5, dist * 0.7);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  // 6. Render to the offscreen canvas
  const renderer = getRenderer(opts.width, opts.height);
  renderer.setClearColor(new THREE.Color(opts.background), 1);
  renderer.render(scene, camera);

  // 7. Extract data URL
  const dataUrl = renderer.domElement.toDataURL('image/png');

  // 8. Dispose scene-local resources (NOT the shared renderer)
  geometry.dispose();
  material.dispose();
  scene.clear();

  return dataUrl;
}

/**
 * Get a thumbnail for a File — from cache if available, otherwise generate
 * and cache it.
 *
 * @param {File}   file
 * @param {object} [options]  Same options as `generateThumbnail`
 * @returns {Promise<string>} base64 PNG data URL
 */
export async function getOrGenerateThumbnail(file, options = {}) {
  const hash = generateFileHash(file);

  // Try cache first
  const cached = await getCachedThumbnail(hash);
  if (cached) return cached;

  // Generate
  const dataUrl = await generateThumbnail(file, options);

  // Cache (fire-and-forget)
  cacheThumbnail(hash, dataUrl).catch(() => {});

  return dataUrl;
}
