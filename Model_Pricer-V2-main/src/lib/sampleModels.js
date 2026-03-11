/**
 * sampleModels.js — Programmatic STL binary generation for sample 3D shapes.
 *
 * Generates minimal-triangle STL binary files for basic geometric shapes
 * (cube, cylinder, sphere). Returns File objects ready for the upload flow.
 *
 * STL binary format:
 *   80 bytes header
 *   4 bytes uint32 triangle count
 *   Per triangle (50 bytes each):
 *     12 bytes normal (3x float32)
 *     36 bytes vertices (3x3 float32)
 *     2 bytes attribute byte count (0)
 */

// --- Internal helpers ---

function writeFloat32(view, offset, value) {
  view.setFloat32(offset, value, true); // little-endian
  return offset + 4;
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
  return offset + 4;
}

function writeTriangle(view, offset, normal, v1, v2, v3) {
  offset = writeFloat32(view, offset, normal[0]);
  offset = writeFloat32(view, offset, normal[1]);
  offset = writeFloat32(view, offset, normal[2]);

  offset = writeFloat32(view, offset, v1[0]);
  offset = writeFloat32(view, offset, v1[1]);
  offset = writeFloat32(view, offset, v1[2]);

  offset = writeFloat32(view, offset, v2[0]);
  offset = writeFloat32(view, offset, v2[1]);
  offset = writeFloat32(view, offset, v2[2]);

  offset = writeFloat32(view, offset, v3[0]);
  offset = writeFloat32(view, offset, v3[1]);
  offset = writeFloat32(view, offset, v3[2]);

  // attribute byte count
  view.setUint16(offset, 0, true);
  offset += 2;

  return offset;
}

function buildSTLBinary(triangles) {
  const headerSize = 80;
  const countSize = 4;
  const triSize = 50; // 12 normal + 36 verts + 2 attr
  const bufferSize = headerSize + countSize + triangles.length * triSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Header (80 bytes, can be anything)
  const encoder = new TextEncoder();
  const headerText = encoder.encode('ModelPricer Sample STL');
  for (let i = 0; i < headerText.length && i < 80; i++) {
    view.setUint8(i, headerText[i]);
  }

  // Triangle count
  let offset = writeUint32(view, 80, triangles.length);

  // Write each triangle
  for (const tri of triangles) {
    offset = writeTriangle(view, offset, tri.normal, tri.v1, tri.v2, tri.v3);
  }

  return buffer;
}

function createFileFromBuffer(buffer, name) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  return new File([blob], name, { type: 'application/octet-stream' });
}

// --- Cross product for normals ---

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function computeNormal(v1, v2, v3) {
  return normalize(cross(sub(v2, v1), sub(v3, v1)));
}

// --- Shape generators ---

/**
 * Generate a cube STL centered at origin.
 * @param {number} size - Edge length in mm (default 20)
 * @returns {File}
 */
export function generateCubeSTL(size = 20) {
  const h = size / 2;

  // 8 vertices of a cube
  const v = [
    [-h, -h, -h], // 0
    [h, -h, -h],  // 1
    [h, h, -h],   // 2
    [-h, h, -h],  // 3
    [-h, -h, h],  // 4
    [h, -h, h],   // 5
    [h, h, h],    // 6
    [-h, h, h],   // 7
  ];

  // 12 triangles (2 per face, 6 faces)
  const faces = [
    // Bottom (z = -h)
    [v[0], v[2], v[1]], [v[0], v[3], v[2]],
    // Top (z = +h)
    [v[4], v[5], v[6]], [v[4], v[6], v[7]],
    // Front (y = -h)
    [v[0], v[1], v[5]], [v[0], v[5], v[4]],
    // Back (y = +h)
    [v[2], v[3], v[7]], [v[2], v[7], v[6]],
    // Left (x = -h)
    [v[0], v[4], v[7]], [v[0], v[7], v[3]],
    // Right (x = +h)
    [v[1], v[2], v[6]], [v[1], v[6], v[5]],
  ];

  const triangles = faces.map(([a, b, c]) => ({
    normal: computeNormal(a, b, c),
    v1: a,
    v2: b,
    v3: c,
  }));

  const buffer = buildSTLBinary(triangles);
  return createFileFromBuffer(buffer, `sample-cube-${size}mm.stl`);
}

/**
 * Generate a cylinder STL centered at origin.
 * @param {number} radius - Radius in mm (default 10)
 * @param {number} height - Height in mm (default 30)
 * @param {number} segments - Number of radial segments (default 16)
 * @returns {File}
 */
export function generateCylinderSTL(radius = 10, height = 30, segments = 16) {
  const triangles = [];
  const hh = height / 2;

  for (let i = 0; i < segments; i++) {
    const a1 = (2 * Math.PI * i) / segments;
    const a2 = (2 * Math.PI * ((i + 1) % segments)) / segments;

    const x1 = radius * Math.cos(a1);
    const y1 = radius * Math.sin(a1);
    const x2 = radius * Math.cos(a2);
    const y2 = radius * Math.sin(a2);

    // Top cap
    const topCenter = [0, 0, hh];
    const topV1 = [x1, y1, hh];
    const topV2 = [x2, y2, hh];
    triangles.push({
      normal: [0, 0, 1],
      v1: topCenter,
      v2: topV1,
      v3: topV2,
    });

    // Bottom cap
    const botCenter = [0, 0, -hh];
    const botV1 = [x2, y2, -hh];
    const botV2 = [x1, y1, -hh];
    triangles.push({
      normal: [0, 0, -1],
      v1: botCenter,
      v2: botV1,
      v3: botV2,
    });

    // Side (2 triangles per segment)
    const sideNormal = normalize([(x1 + x2) / 2, (y1 + y2) / 2, 0]);

    triangles.push({
      normal: sideNormal,
      v1: [x1, y1, -hh],
      v2: [x2, y2, -hh],
      v3: [x2, y2, hh],
    });
    triangles.push({
      normal: sideNormal,
      v1: [x1, y1, -hh],
      v2: [x2, y2, hh],
      v3: [x1, y1, hh],
    });
  }

  const buffer = buildSTLBinary(triangles);
  return createFileFromBuffer(buffer, `sample-cylinder-${radius * 2}x${height}mm.stl`);
}

/**
 * Generate a sphere STL centered at origin using UV sphere tessellation.
 * @param {number} radius - Radius in mm (default 12.5)
 * @param {number} stacks - Latitude divisions (default 8)
 * @param {number} slices - Longitude divisions (default 12)
 * @returns {File}
 */
export function generateSphereSTL(radius = 12.5, stacks = 8, slices = 12) {
  const triangles = [];

  for (let i = 0; i < stacks; i++) {
    const phi1 = (Math.PI * i) / stacks;
    const phi2 = (Math.PI * (i + 1)) / stacks;

    for (let j = 0; j < slices; j++) {
      const theta1 = (2 * Math.PI * j) / slices;
      const theta2 = (2 * Math.PI * ((j + 1) % slices)) / slices;

      const toXYZ = (phi, theta) => [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ];

      const p1 = toXYZ(phi1, theta1);
      const p2 = toXYZ(phi1, theta2);
      const p3 = toXYZ(phi2, theta1);
      const p4 = toXYZ(phi2, theta2);

      // Top cap triangles (phi1 near pole)
      if (i === 0) {
        triangles.push({
          normal: computeNormal(p1, p4, p3),
          v1: p1,
          v2: p4,
          v3: p3,
        });
      } else if (i === stacks - 1) {
        // Bottom cap triangles
        triangles.push({
          normal: computeNormal(p1, p2, p4),
          v1: p1,
          v2: p2,
          v3: p4,
        });
      } else {
        // Two triangles per quad
        triangles.push({
          normal: computeNormal(p1, p2, p3),
          v1: p1,
          v2: p2,
          v3: p3,
        });
        triangles.push({
          normal: computeNormal(p2, p4, p3),
          v1: p2,
          v2: p4,
          v3: p3,
        });
      }
    }
  }

  const buffer = buildSTLBinary(triangles);
  return createFileFromBuffer(buffer, `sample-sphere-${radius * 2}mm.stl`);
}

/**
 * Available sample models with metadata for the UI.
 */
export const SAMPLE_MODELS = [
  {
    id: 'cube',
    name: 'Krychle',
    description: '20 mm',
    generate: () => generateCubeSTL(20),
    // Simple SVG path for cube icon
    icon: 'cube',
  },
  {
    id: 'cylinder',
    name: 'Valec',
    description: '20 x 30 mm',
    generate: () => generateCylinderSTL(10, 30, 16),
    icon: 'cylinder',
  },
  {
    id: 'sphere',
    name: 'Koule',
    description: '25 mm',
    generate: () => generateSphereSTL(12.5, 8, 12),
    icon: 'sphere',
  },
];
