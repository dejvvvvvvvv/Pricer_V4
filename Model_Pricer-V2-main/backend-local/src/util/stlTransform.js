/**
 * STL Transform Utility
 *
 * Applies quaternion rotations and Z-plate alignment to binary and ASCII STL files.
 * Zero external dependencies — uses only Node.js built-ins (fs, path, Buffer).
 *
 * Binary STL layout:
 *   [0..79]   80-byte header
 *   [80..83]  uint32 LE triangle count
 *   Per triangle (50 bytes):
 *     - 3x float32 LE  normal vector  (12 bytes)
 *     - 3x float32 LE  vertex 1       (12 bytes)
 *     - 3x float32 LE  vertex 2       (12 bytes)
 *     - 3x float32 LE  vertex 3       (12 bytes)
 *     - uint16 LE       attribute      (2 bytes)
 *
 * @module stlTransform
 */

import { readFile, writeFile } from 'fs/promises';
import { parse, format, dirname, basename, extname } from 'path';

// ─── Constants ───────────────────────────────────────────────────────────────

const HEADER_SIZE = 80;
const TRIANGLE_COUNT_SIZE = 4;
const TRIANGLE_SIZE = 50; // 12 (normal) + 36 (3 vertices) + 2 (attr)
const FLOAT32_SIZE = 4;
const QUATERNION_NORM_TOLERANCE = 0.01;

// ─── Quaternion → Rotation Matrix ────────────────────────────────────────────

/**
 * Converts a unit quaternion to a 3x3 rotation matrix (flat array, row-major).
 *
 * @param {{ x: number, y: number, z: number, w: number }} q
 * @returns {number[]} 9-element array [r00, r01, r02, r10, r11, r12, r20, r21, r22]
 */
function quaternionToMatrix(q) {
  const { x, y, z, w } = q;

  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;

  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    1 - (yy + zz), xy - wz,       xz + wy,       // row 0
    xy + wz,       1 - (xx + zz), yz - wx,       // row 1
    xz - wy,       yz + wx,       1 - (xx + yy), // row 2
  ];
}

/**
 * Applies a 3x3 rotation matrix to a 3D vector, writing the result back in-place.
 *
 * @param {number[]} m  9-element rotation matrix (row-major)
 * @param {number} vx
 * @param {number} vy
 * @param {number} vz
 * @returns {{ x: number, y: number, z: number }}
 */
function applyMatrix(m, vx, vy, vz) {
  return {
    x: m[0] * vx + m[1] * vy + m[2] * vz,
    y: m[3] * vx + m[4] * vy + m[5] * vz,
    z: m[6] * vx + m[7] * vy + m[8] * vz,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validates that the quaternion is a unit quaternion within tolerance.
 *
 * @param {{ x: number, y: number, z: number, w: number }} q
 * @throws {Error} If quaternion is invalid or not unit-length
 */
function validateQuaternion(q) {
  if (!q || typeof q.x !== 'number' || typeof q.y !== 'number' ||
      typeof q.z !== 'number' || typeof q.w !== 'number') {
    throw Object.assign(
      new Error('Quaternion must be an object with numeric x, y, z, w properties'),
      { code: 'MP_INVALID_QUATERNION' }
    );
  }

  if (!Number.isFinite(q.x) || !Number.isFinite(q.y) ||
      !Number.isFinite(q.z) || !Number.isFinite(q.w)) {
    throw Object.assign(
      new Error('Quaternion components must be finite numbers'),
      { code: 'MP_INVALID_QUATERNION' }
    );
  }

  const norm = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (Math.abs(norm - 1.0) > QUATERNION_NORM_TOLERANCE) {
    throw Object.assign(
      new Error(`Quaternion is not unit-length: norm=${norm.toFixed(6)} (tolerance=${QUATERNION_NORM_TOLERANCE})`),
      { code: 'MP_INVALID_QUATERNION' }
    );
  }
}

/**
 * Validates that a buffer looks like a valid binary STL.
 *
 * @param {Buffer} buf
 * @throws {Error} If buffer is too small or triangle count does not match size
 */
function validateBinarySTL(buf) {
  if (!Buffer.isBuffer(buf)) {
    throw Object.assign(
      new Error('Expected a Buffer for binary STL'),
      { code: 'MP_INVALID_STL' }
    );
  }

  if (buf.length < HEADER_SIZE + TRIANGLE_COUNT_SIZE) {
    throw Object.assign(
      new Error(`STL buffer too small: ${buf.length} bytes (minimum ${HEADER_SIZE + TRIANGLE_COUNT_SIZE})`),
      { code: 'MP_INVALID_STL' }
    );
  }

  const triCount = buf.readUInt32LE(HEADER_SIZE);
  const expectedSize = HEADER_SIZE + TRIANGLE_COUNT_SIZE + triCount * TRIANGLE_SIZE;

  if (buf.length !== expectedSize) {
    throw Object.assign(
      new Error(`STL size mismatch: expected ${expectedSize} bytes for ${triCount} triangles, got ${buf.length}`),
      { code: 'MP_INVALID_STL' }
    );
  }
}

// ─── Format Detection ────────────────────────────────────────────────────────

/**
 * Detects whether an STL buffer is binary or ASCII format.
 *
 * Heuristic: read the triangle count from offset 80, compute expected binary
 * size, and compare with actual buffer length. If they match, it is binary.
 * Otherwise treat as ASCII.
 *
 * @param {Buffer} buffer
 * @returns {'binary' | 'ascii'}
 */
export function detectSTLFormat(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw Object.assign(
      new Error('Expected a Buffer for STL format detection'),
      { code: 'MP_INVALID_STL' }
    );
  }

  if (buffer.length < HEADER_SIZE + TRIANGLE_COUNT_SIZE) {
    // Too small for binary — try ASCII
    return 'ascii';
  }

  const triCount = buffer.readUInt32LE(HEADER_SIZE);
  const expectedSize = HEADER_SIZE + TRIANGLE_COUNT_SIZE + triCount * TRIANGLE_SIZE;

  if (buffer.length === expectedSize && triCount > 0) {
    return 'binary';
  }

  return 'ascii';
}

// ─── Binary STL Rotation (in-place) ─────────────────────────────────────────

/**
 * Applies a quaternion rotation IN-PLACE to all normals and vertices in a
 * binary STL buffer. Returns the same buffer reference (mutated).
 *
 * @param {Buffer} stlBuffer  Binary STL data
 * @param {{ x: number, y: number, z: number, w: number }} quaternion  Unit quaternion
 * @returns {Buffer} The same buffer, mutated in-place
 */
export function applyQuaternionToSTL(stlBuffer, quaternion) {
  validateQuaternion(quaternion);
  validateBinarySTL(stlBuffer);

  const m = quaternionToMatrix(quaternion);
  const triCount = stlBuffer.readUInt32LE(HEADER_SIZE);
  const dataStart = HEADER_SIZE + TRIANGLE_COUNT_SIZE;

  for (let i = 0; i < triCount; i++) {
    const triOffset = dataStart + i * TRIANGLE_SIZE;

    // Each triangle has 4 vectors: 1 normal + 3 vertices
    for (let v = 0; v < 4; v++) {
      const vecOffset = triOffset + v * 3 * FLOAT32_SIZE;

      const vx = stlBuffer.readFloatLE(vecOffset);
      const vy = stlBuffer.readFloatLE(vecOffset + FLOAT32_SIZE);
      const vz = stlBuffer.readFloatLE(vecOffset + 2 * FLOAT32_SIZE);

      const rotated = applyMatrix(m, vx, vy, vz);

      stlBuffer.writeFloatLE(rotated.x, vecOffset);
      stlBuffer.writeFloatLE(rotated.y, vecOffset + FLOAT32_SIZE);
      stlBuffer.writeFloatLE(rotated.z, vecOffset + 2 * FLOAT32_SIZE);
    }
  }

  return stlBuffer;
}

// ─── ASCII STL → Binary STL with Rotation ────────────────────────────────────

/**
 * Parses an ASCII STL, applies quaternion rotation, and returns a BINARY STL
 * buffer (smaller and faster to process downstream).
 *
 * @param {string | Buffer} input  ASCII STL content
 * @param {{ x: number, y: number, z: number, w: number }} quaternion  Unit quaternion
 * @returns {Buffer} New binary STL buffer with rotated geometry
 */
export function applyQuaternionToSTLAscii(input, quaternion) {
  validateQuaternion(quaternion);

  const text = Buffer.isBuffer(input) ? input.toString('utf-8') : String(input);
  const m = quaternionToMatrix(quaternion);

  // Parse all facets from ASCII STL
  const facetRegex =
    /facet\s+normal\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+outer\s+loop\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+endloop\s+endfacet/gi;

  const facets = [];
  let match;
  while ((match = facetRegex.exec(text)) !== null) {
    facets.push({
      normal: { x: parseFloat(match[1]), y: parseFloat(match[2]), z: parseFloat(match[3]) },
      v1:     { x: parseFloat(match[4]), y: parseFloat(match[5]), z: parseFloat(match[6]) },
      v2:     { x: parseFloat(match[7]), y: parseFloat(match[8]), z: parseFloat(match[9]) },
      v3:     { x: parseFloat(match[10]), y: parseFloat(match[11]), z: parseFloat(match[12]) },
    });
  }

  if (facets.length === 0) {
    throw Object.assign(
      new Error('No facets found in ASCII STL — file may be empty or malformed'),
      { code: 'MP_INVALID_STL' }
    );
  }

  // Allocate binary STL buffer
  const triCount = facets.length;
  const bufSize = HEADER_SIZE + TRIANGLE_COUNT_SIZE + triCount * TRIANGLE_SIZE;
  const buf = Buffer.alloc(bufSize);

  // Write header (80 bytes, zeros is fine)
  buf.write('binary STL converted by ModelPricer', 0, 'ascii');

  // Write triangle count
  buf.writeUInt32LE(triCount, HEADER_SIZE);

  const dataStart = HEADER_SIZE + TRIANGLE_COUNT_SIZE;

  for (let i = 0; i < triCount; i++) {
    const f = facets[i];
    const triOffset = dataStart + i * TRIANGLE_SIZE;

    // Rotate normal
    const rn = applyMatrix(m, f.normal.x, f.normal.y, f.normal.z);
    buf.writeFloatLE(rn.x, triOffset);
    buf.writeFloatLE(rn.y, triOffset + 4);
    buf.writeFloatLE(rn.z, triOffset + 8);

    // Rotate vertex 1
    const rv1 = applyMatrix(m, f.v1.x, f.v1.y, f.v1.z);
    buf.writeFloatLE(rv1.x, triOffset + 12);
    buf.writeFloatLE(rv1.y, triOffset + 16);
    buf.writeFloatLE(rv1.z, triOffset + 20);

    // Rotate vertex 2
    const rv2 = applyMatrix(m, f.v2.x, f.v2.y, f.v2.z);
    buf.writeFloatLE(rv2.x, triOffset + 24);
    buf.writeFloatLE(rv2.y, triOffset + 28);
    buf.writeFloatLE(rv2.z, triOffset + 32);

    // Rotate vertex 3
    const rv3 = applyMatrix(m, f.v3.x, f.v3.y, f.v3.z);
    buf.writeFloatLE(rv3.x, triOffset + 36);
    buf.writeFloatLE(rv3.y, triOffset + 40);
    buf.writeFloatLE(rv3.z, triOffset + 44);

    // Attribute byte count = 0
    buf.writeUInt16LE(0, triOffset + 48);
  }

  return buf;
}

// ─── Drop to Plate (Z=0 alignment, in-place) ────────────────────────────────

/**
 * Shifts all vertices so the lowest Z value sits at Z=0 (the print bed).
 * Normals are NOT modified (translation does not affect normals).
 * Mutates the buffer in-place.
 *
 * @param {Buffer} stlBuffer  Binary STL data
 * @returns {Buffer} The same buffer, mutated in-place
 */
export function dropToPlate(stlBuffer) {
  validateBinarySTL(stlBuffer);

  const triCount = stlBuffer.readUInt32LE(HEADER_SIZE);
  const dataStart = HEADER_SIZE + TRIANGLE_COUNT_SIZE;

  // Pass 1: find minimum Z across all vertices
  let minZ = Infinity;

  for (let i = 0; i < triCount; i++) {
    const triOffset = dataStart + i * TRIANGLE_SIZE;

    // Skip normal (first 12 bytes), read Z of each of 3 vertices
    for (let v = 0; v < 3; v++) {
      // Vertex starts at triOffset + 12 (after normal) + v * 12
      const zOffset = triOffset + 12 + v * 12 + 2 * FLOAT32_SIZE;
      const z = stlBuffer.readFloatLE(zOffset);
      if (z < minZ) {
        minZ = z;
      }
    }
  }

  // If minZ is already 0 (or no triangles), nothing to do
  if (triCount === 0 || Math.abs(minZ) < 1e-6) {
    return stlBuffer;
  }

  // Pass 2: shift all vertex Z values by -minZ
  for (let i = 0; i < triCount; i++) {
    const triOffset = dataStart + i * TRIANGLE_SIZE;

    for (let v = 0; v < 3; v++) {
      const zOffset = triOffset + 12 + v * 12 + 2 * FLOAT32_SIZE;
      const z = stlBuffer.readFloatLE(zOffset);
      stlBuffer.writeFloatLE(z - minZ, zOffset);
    }
  }

  return stlBuffer;
}

// ─── Orchestration: File-based transform ─────────────────────────────────────

/**
 * Reads an STL file, applies quaternion rotation + drop-to-plate, and writes
 * the result to a new file with `_oriented.stl` suffix. The original file is
 * never overwritten.
 *
 * @param {string} filePath      Absolute path to the source STL file
 * @param {{ x: number, y: number, z: number, w: number }} quaternion  Unit quaternion
 * @returns {Promise<string>}    Absolute path to the transformed STL file
 */
export async function transformSTLFile(filePath, quaternion) {
  validateQuaternion(quaternion);

  if (!filePath || typeof filePath !== 'string') {
    throw Object.assign(
      new Error('filePath must be a non-empty string'),
      { code: 'MP_INVALID_INPUT' }
    );
  }

  // Read source file
  const rawBuffer = await readFile(filePath);
  const fmt = detectSTLFormat(rawBuffer);

  let binaryBuffer;

  if (fmt === 'ascii') {
    // ASCII → rotate → outputs binary
    binaryBuffer = applyQuaternionToSTLAscii(rawBuffer, quaternion);
  } else {
    // Binary → rotate in-place
    applyQuaternionToSTL(rawBuffer, quaternion);
    binaryBuffer = rawBuffer;
  }

  // Drop model onto the print plate (Z=0)
  dropToPlate(binaryBuffer);

  // Build output path: /some/dir/model.stl → /some/dir/model_oriented.stl
  const parsed = parse(filePath);
  const outputPath = format({
    dir: parsed.dir,
    name: parsed.name + '_oriented',
    ext: '.stl',
  });

  await writeFile(outputPath, binaryBuffer);

  return outputPath;
}
