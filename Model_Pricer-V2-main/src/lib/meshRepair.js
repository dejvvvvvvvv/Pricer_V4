// src/lib/meshRepair.js
// Client-side mesh analysis, repair, and export utilities for Three.js BufferGeometry (STL).
// All processing is browser-only - no backend needed.

import * as THREE from 'three';

/* -- Performance guards -------------------------------------------------- */
const MAX_VERTICES = 2_000_000;
const MAX_TRIANGLES = 1_000_000;
const TIME_BUDGET_MS = 5_000;
const DEGENERATE_AREA_THRESHOLD = 1e-10;
const VERTEX_MERGE_TOLERANCE = 1e-6;
const HOLE_FILL_MAX_EDGES = 50;

/* -- Helpers -------------------------------------------------------------- */

function now() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function checkTimeBudget(t0, budget = TIME_BUDGET_MS) {
  if (now() - t0 > budget) {
    throw new Error('TIME_BUDGET_EXCEEDED');
  }
}

function extractTriangleData(geometry) {
  const position = geometry?.attributes?.position;
  if (!position || !position.array) {
    throw new Error('Geometry has no position attribute');
  }
  const vertexCount = position.count;
  const index = geometry.getIndex?.() || geometry.index;
  const indexArray = index?.array || null;
  const triangleCount = indexArray
    ? Math.floor(indexArray.length / 3)
    : Math.floor(vertexCount / 3);

  if (vertexCount > MAX_VERTICES) {
    throw new Error('Too many vertices: ' + vertexCount + ' (max ' + MAX_VERTICES + ')');
  }
  if (triangleCount > MAX_TRIANGLES) {
    throw new Error('Too many triangles: ' + triangleCount + ' (max ' + MAX_TRIANGLES + ')');
  }
  return { positions: position.array, indices: indexArray, vertexCount, triangleCount };
}

function edgeKey(a, b) {
  return a < b ? a + '_' + b : b + '_' + a;
}

function directedEdgeKey(a, b) {
  return a + '_' + b;
}

function getTriangleIndices(t, indices) {
  if (indices) return [indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]];
  return [t * 3, t * 3 + 1, t * 3 + 2];
}

function triangleArea(positions, ia, ib, ic) {
  const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
  const bx = positions[ib * 3], by = positions[ib * 3 + 1], bz = positions[ib * 3 + 2];
  const cx = positions[ic * 3], cy = positions[ic * 3 + 1], cz = positions[ic * 3 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const crossX = aby * acz - abz * acy;
  const crossY = abz * acx - abx * acz;
  const crossZ = abx * acy - aby * acx;
  return 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
}

function triangleNormal(positions, ia, ib, ic) {
  const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
  const bx = positions[ib * 3], by = positions[ib * 3 + 1], bz = positions[ib * 3 + 2];
  const cx = positions[ic * 3], cy = positions[ic * 3 + 1], cz = positions[ic * 3 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  return {
    x: aby * acz - abz * acy,
    y: abz * acx - abx * acz,
    z: abx * acy - aby * acx,
  };
}

/* -- analyzeMesh ---------------------------------------------------------- */

/**
 * Analyze a Three.js BufferGeometry and return detected issues.
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {{
 *   issues: Array<{ type: string, severity: string, message: string, messageEn: string, count?: number }>,
 *   isWatertight: boolean,
 *   triangleCount: number,
 *   vertexCount: number,
 *   boundingBox: { min: {x,y,z}, max: {x,y,z}, size: {x,y,z} } | null,
 *   volume: number|null,
 *   surfaceArea: number|null,
 *   ms: number,
 * }}
 */
export function analyzeMesh(geometry) {
  const t0 = now();
  const issues = [];

  try {
    const { positions, indices, vertexCount, triangleCount } = extractTriangleData(geometry);

    geometry.computeBoundingBox();
    const bb = geometry.boundingBox;
    const bbMin = { x: bb.min.x, y: bb.min.y, z: bb.min.z };
    const bbMax = { x: bb.max.x, y: bb.max.y, z: bb.max.z };
    const bbSize = { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y, z: bb.max.z - bb.min.z };

    const edgeFaceCount = new Map();
    const directedEdges = new Map();
    let degenerateCount = 0;
    let surfaceArea = 0;
    let signedVolume = 0;
    let inconsistentNormals = 0;
    const checkInterval = 5000;

    for (let t = 0; t < triangleCount; t++) {
      if (t > 0 && t % checkInterval === 0) checkTimeBudget(t0);
      const [ia, ib, ic] = getTriangleIndices(t, indices);
      const area = triangleArea(positions, ia, ib, ic);
      if (area < DEGENERATE_AREA_THRESHOLD) { degenerateCount++; continue; }
      surfaceArea += area;

      const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
      const bx = positions[ib * 3], by = positions[ib * 3 + 1], bz = positions[ib * 3 + 2];
      const cx = positions[ic * 3], cy = positions[ic * 3 + 1], cz = positions[ic * 3 + 2];
      signedVolume += (ax * (by * cz - bz * cy) + bx * (cy * az - cz * ay) + cx * (ay * bz - az * by)) / 6.0;

      const edges = [[ia, ib], [ib, ic], [ic, ia]];
      for (const [ea, eb] of edges) {
        const ek = edgeKey(ea, eb);
        edgeFaceCount.set(ek, (edgeFaceCount.get(ek) || 0) + 1);
        const dk = directedEdgeKey(ea, eb);
        directedEdges.set(dk, (directedEdges.get(dk) || 0) + 1);
      }
    }

    checkTimeBudget(t0);

    let nonManifoldCount = 0;
    let boundaryCount = 0;
    for (const [, count] of edgeFaceCount) {
      if (count === 1) boundaryCount++;
      else if (count > 2) nonManifoldCount++;
    }

    for (const [ek, count] of edgeFaceCount) {
      if (count !== 2) continue;
      const parts = ek.split('_');
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      const fwd = directedEdges.get(directedEdgeKey(a, b)) || 0;
      const rev = directedEdges.get(directedEdgeKey(b, a)) || 0;
      if (fwd !== 1 || rev !== 1) inconsistentNormals++;
    }

    checkTimeBudget(t0);

    if (degenerateCount > 0) {
      issues.push({
        type: 'DEGENERATE_TRIANGLES', severity: 'warning',
        message: 'Nalezeno ' + degenerateCount + ' degenerovan\u00FDch troj\u00FAheln\u00EDk\u016F (nulov\u00E1 plocha).',
        messageEn: 'Found ' + degenerateCount + ' degenerate triangles (zero area).',
        count: degenerateCount,
      });
    }
    if (nonManifoldCount > 0) {
      issues.push({
        type: 'NON_MANIFOLD', severity: 'error',
        message: 'Nalezeno ' + nonManifoldCount + ' non-manifold hran.',
        messageEn: 'Found ' + nonManifoldCount + ' non-manifold edges.',
        count: nonManifoldCount,
      });
    }
    if (boundaryCount > 0) {
      issues.push({
        type: 'HOLES', severity: 'error',
        message: 'Nalezeno ' + boundaryCount + ' hrani\u010Dn\u00EDch hran \u2014 mesh m\u00E1 d\u00EDry.',
        messageEn: 'Found ' + boundaryCount + ' boundary edges \u2014 mesh has holes.',
        count: boundaryCount,
      });
    }
    if (inconsistentNormals > 0) {
      issues.push({
        type: 'INCONSISTENT_NORMALS', severity: 'warning',
        message: 'Nalezeno ' + inconsistentNormals + ' hran s nekonzistentn\u00ED orientac\u00ED norm\u00E1l.',
        messageEn: 'Found ' + inconsistentNormals + ' edges with inconsistent normal orientation.',
        count: inconsistentNormals,
      });
    }

    const selfHits = detectSelfIntersectionsSampled(positions, indices, triangleCount, t0);
    if (selfHits > 0) {
      issues.push({
        type: 'SELF_INTERSECTING', severity: 'warning',
        message: 'Detekov\u00E1no ~' + selfHits + ' potenci\u00E1ln\u00EDch self-intersections.',
        messageEn: 'Detected ~' + selfHits + ' potential self-intersections.',
        count: selfHits,
      });
    }

    if (issues.length === 0) {
      issues.push({
        type: 'OK', severity: 'info',
        message: 'Mesh vypad\u00E1 v po\u0159\u00E1dku. \u017D\u00E1dn\u00E9 probl\u00E9my nebyly nalezeny.',
        messageEn: 'Mesh looks good. No issues found.',
      });
    }

    const isWatertight = boundaryCount === 0 && nonManifoldCount === 0;
    const volume = isWatertight ? Math.abs(signedVolume) : null;

    return {
      issues, isWatertight, triangleCount, vertexCount,
      boundingBox: { min: bbMin, max: bbMax, size: bbSize },
      volume, surfaceArea, ms: now() - t0,
    };
  } catch (e) {
    if (e.message === 'TIME_BUDGET_EXCEEDED') {
      issues.push({
        type: 'TIMEOUT', severity: 'warning',
        message: 'Anal\u00FDza p\u0159ekro\u010Dila \u010Dasov\u00FD limit.',
        messageEn: 'Analysis exceeded time budget.',
      });
    } else {
      issues.push({
        type: 'ERROR', severity: 'error',
        message: 'Chyba anal\u00FDzy: ' + e.message,
        messageEn: 'Analysis error: ' + e.message,
      });
    }
    return {
      issues, isWatertight: false, triangleCount: 0, vertexCount: 0,
      boundingBox: null, volume: null, surfaceArea: null, ms: now() - t0,
    };
  }
}

function detectSelfIntersectionsSampled(positions, indices, triangleCount, t0) {
  if (triangleCount > 200_000) return 0;
  const sampleSize = Math.min(triangleCount, 5000);
  const step = Math.max(1, Math.floor(triangleCount / sampleSize));
  let hits = 0;

  const sampledTriangles = [];
  for (let t = 0; t < triangleCount; t += step) {
    const [ia, ib, ic] = getTriangleIndices(t, indices);
    const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
    const bx = positions[ib * 3], by = positions[ib * 3 + 1], bz = positions[ib * 3 + 2];
    const cx = positions[ic * 3], cy = positions[ic * 3 + 1], cz = positions[ic * 3 + 2];
    sampledTriangles.push({
      idx: t,
      minX: Math.min(ax, bx, cx), minY: Math.min(ay, by, cy), minZ: Math.min(az, bz, cz),
      maxX: Math.max(ax, bx, cx), maxY: Math.max(ay, by, cy), maxZ: Math.max(az, bz, cz),
      ia, ib, ic,
    });
  }

  const len = sampledTriangles.length;
  const maxPairs = 50_000;
  let pairCount = 0;

  for (let i = 0; i < len && pairCount < maxPairs; i++) {
    const a = sampledTriangles[i];
    for (let j = i + 1; j < len && pairCount < maxPairs; j++) {
      pairCount++;
      const b = sampledTriangles[j];
      if (a.ia === b.ia || a.ia === b.ib || a.ia === b.ic ||
          a.ib === b.ia || a.ib === b.ib || a.ib === b.ic ||
          a.ic === b.ia || a.ic === b.ib || a.ic === b.ic) continue;
      if (a.maxX < b.minX || a.minX > b.maxX) continue;
      if (a.maxY < b.minY || a.minY > b.maxY) continue;
      if (a.maxZ < b.minZ || a.minZ > b.maxZ) continue;
      hits++;
    }
    if (i % 500 === 0) {
      try { checkTimeBudget(t0); } catch { return hits > 10 ? Math.round(hits * 0.1) : 0; }
    }
  }
  return hits > 10 ? Math.round(hits * 0.1) : 0;
}

/* -- repairMesh ----------------------------------------------------------- */

/**
 * Auto-repair common mesh issues. Does NOT modify the input geometry.
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {{ mergeVertices?: boolean, removeDegenerates?: boolean, fixNormals?: boolean, fillHoles?: boolean }} options
 * @returns {{ repairedGeometry: THREE.BufferGeometry, repairsApplied: string[], issuesBefore: object, issuesAfter: object, ms: number }}
 */
export function repairMesh(geometry, options = {}) {
  const t0 = now();
  const {
    mergeVertices = true,
    removeDegenerates = true,
    fixNormals = true,
    fillHoles = true,
  } = options;

  const repairsApplied = [];
  const issuesBefore = analyzeMesh(geometry);

  let geo = geometry.clone();
  if (!geo.index && mergeVertices) {
    geo = geo.toNonIndexed();
  }

  try {
    if (mergeVertices) {
      checkTimeBudget(t0, TIME_BUDGET_MS * 2);
      const before = geo.attributes.position.count;
      geo = mergeCloseVertices(geo, VERTEX_MERGE_TOLERANCE);
      const after = geo.attributes.position.count;
      if (after < before) {
        repairsApplied.push('Slou\u010Deno ' + (before - after) + ' duplicitn\u00EDch vertex\u016F');
      }
    }

    if (removeDegenerates) {
      checkTimeBudget(t0, TIME_BUDGET_MS * 2);
      const result = removeDegenTriangles(geo);
      geo = result.geometry;
      if (result.removed > 0) {
        repairsApplied.push('Odstran\u011Bno ' + result.removed + ' degenerovan\u00FDch troj\u00FAheln\u00EDk\u016F');
      }
    }

    if (fixNormals) {
      checkTimeBudget(t0, TIME_BUDGET_MS * 2);
      const flipped = fixWindingOrder(geo);
      if (flipped > 0) {
        repairsApplied.push('Opravena orientace ' + flipped + ' troj\u00FAheln\u00EDk\u016F');
      }
    }

    if (fillHoles) {
      checkTimeBudget(t0, TIME_BUDGET_MS * 2);
      const filled = fillSmallHoles(geo);
      if (filled > 0) {
        repairsApplied.push('Zapln\u011Bno ' + filled + ' mal\u00FDch d\u011Br');
      }
    }

    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    if (repairsApplied.length === 0) {
      repairsApplied.push('\u017D\u00E1dn\u00E9 opravy nebyly pot\u0159eba');
    }

    return {
      repairedGeometry: geo, repairsApplied,
      issuesBefore, issuesAfter: analyzeMesh(geo), ms: now() - t0,
    };
  } catch (e) {
    if (e.message === 'TIME_BUDGET_EXCEEDED') {
      repairsApplied.push('Oprava p\u0159eru\u0161ena \u2014 p\u0159ekro\u010Den \u010Dasov\u00FD limit');
    } else {
      repairsApplied.push('Chyba opravy: ' + e.message);
    }
    geo.computeVertexNormals();
    return {
      repairedGeometry: geo, repairsApplied,
      issuesBefore, issuesAfter: analyzeMesh(geo), ms: now() - t0,
    };
  }
}

function mergeCloseVertices(geometry, tolerance) {
  const positions = geometry.attributes.position.array;
  const vertexCount = geometry.attributes.position.count;
  const cellSize = tolerance * 10;
  const vertexMap = new Map();
  const remap = new Int32Array(vertexCount);
  const uniquePositions = [];
  let uniqueCount = 0;

  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const cx = Math.floor(x / cellSize), cy = Math.floor(y / cellSize), cz = Math.floor(z / cellSize);
    let merged = false;

    for (let dx = -1; dx <= 1 && !merged; dx++) {
      for (let dy = -1; dy <= 1 && !merged; dy++) {
        for (let dz = -1; dz <= 1 && !merged; dz++) {
          const key = (cx + dx) + '_' + (cy + dy) + '_' + (cz + dz);
          const bucket = vertexMap.get(key);
          if (!bucket) continue;
          for (const ui of bucket) {
            const ux = uniquePositions[ui * 3], uy = uniquePositions[ui * 3 + 1], uz = uniquePositions[ui * 3 + 2];
            const dist = Math.sqrt((x - ux) ** 2 + (y - uy) ** 2 + (z - uz) ** 2);
            if (dist <= tolerance) { remap[i] = ui; merged = true; break; }
          }
        }
      }
    }

    if (!merged) {
      remap[i] = uniqueCount;
      uniquePositions.push(x, y, z);
      const key = cx + '_' + cy + '_' + cz;
      if (!vertexMap.has(key)) vertexMap.set(key, []);
      vertexMap.get(key).push(uniqueCount);
      uniqueCount++;
    }
  }

  const newPositions = new Float32Array(uniquePositions);
  const index = geometry.index;
  let newIndices;
  if (index) {
    newIndices = new Uint32Array(index.count);
    for (let i = 0; i < index.count; i++) newIndices[i] = remap[index.array[i]];
  } else {
    newIndices = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) newIndices[i] = remap[i];
  }

  const newGeo = new THREE.BufferGeometry();
  newGeo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
  newGeo.setIndex(new THREE.BufferAttribute(newIndices, 1));
  return newGeo;
}

function removeDegenTriangles(geometry) {
  const positions = geometry.attributes.position.array;
  const index = geometry.getIndex?.() || geometry.index;

  if (!index) {
    const vertexCount = geometry.attributes.position.count;
    const triCount = Math.floor(vertexCount / 3);
    const keepTriangles = [];
    for (let t = 0; t < triCount; t++) {
      if (triangleArea(positions, t * 3, t * 3 + 1, t * 3 + 2) >= DEGENERATE_AREA_THRESHOLD) {
        keepTriangles.push(t);
      }
    }
    if (keepTriangles.length === triCount) return { geometry, removed: 0 };
    const newPositions = new Float32Array(keepTriangles.length * 9);
    for (let i = 0; i < keepTriangles.length; i++) {
      const t = keepTriangles[i];
      for (let v = 0; v < 9; v++) newPositions[i * 9 + v] = positions[t * 9 + v];
    }
    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    return { geometry: newGeo, removed: triCount - keepTriangles.length };
  }

  const indexArray = index.array;
  const triCount = Math.floor(indexArray.length / 3);
  const keepIndices = [];
  let removed = 0;
  for (let t = 0; t < triCount; t++) {
    const ia = indexArray[t * 3], ib = indexArray[t * 3 + 1], ic = indexArray[t * 3 + 2];
    if (triangleArea(positions, ia, ib, ic) >= DEGENERATE_AREA_THRESHOLD) {
      keepIndices.push(ia, ib, ic);
    } else { removed++; }
  }
  if (removed === 0) return { geometry, removed: 0 };
  const newGeo = geometry.clone();
  newGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(keepIndices), 1));
  return { geometry: newGeo, removed };
}

function fixWindingOrder(geometry) {
  const index = geometry.getIndex?.() || geometry.index;
  if (!index) return 0;
  const indexArray = index.array;
  const triCount = Math.floor(indexArray.length / 3);
  if (triCount === 0) return 0;

  const edgeToTris = new Map();
  for (let t = 0; t < triCount; t++) {
    const ia = indexArray[t * 3], ib = indexArray[t * 3 + 1], ic = indexArray[t * 3 + 2];
    for (const [ea, eb] of [[ia, ib], [ib, ic], [ic, ia]]) {
      const ek = edgeKey(ea, eb);
      if (!edgeToTris.has(ek)) edgeToTris.set(ek, []);
      edgeToTris.get(ek).push(t);
    }
  }

  const visited = new Uint8Array(triCount);
  let totalFlipped = 0;

  for (let start = 0; start < triCount; start++) {
    if (visited[start]) continue;
    visited[start] = 1;
    const queue = [start];

    while (queue.length > 0) {
      const ct = queue.shift();
      const ia = indexArray[ct * 3], ib = indexArray[ct * 3 + 1], ic = indexArray[ct * 3 + 2];

      for (const [ea, eb] of [[ia, ib], [ib, ic], [ic, ia]]) {
        const ek = edgeKey(ea, eb);
        const tris = edgeToTris.get(ek);
        if (!tris) continue;

        for (const nt of tris) {
          if (nt === ct || visited[nt]) continue;
          visited[nt] = 1;

          const na = indexArray[nt * 3], nb = indexArray[nt * 3 + 1], nc = indexArray[nt * 3 + 2];
          const neighborEdges = [[na, nb], [nb, nc], [nc, na]];
          let needsFlip = false;

          for (const [nea, neb] of neighborEdges) {
            if ((nea === ea && neb === eb) || (nea === eb && neb === ea)) {
              needsFlip = (nea === ea && neb === eb);
              break;
            }
          }

          if (needsFlip) {
            const tmp = indexArray[nt * 3 + 1];
            indexArray[nt * 3 + 1] = indexArray[nt * 3 + 2];
            indexArray[nt * 3 + 2] = tmp;
            totalFlipped++;
          }
          queue.push(nt);
        }
      }
    }
  }

  if (totalFlipped > 0) geometry.index.needsUpdate = true;
  return totalFlipped;
}

function fillSmallHoles(geometry) {
  const index = geometry.getIndex?.() || geometry.index;
  if (!index) return 0;

  const positions = geometry.attributes.position.array;
  const indexArray = Array.from(index.array);
  const triCount = Math.floor(indexArray.length / 3);

  const edgeFaceCount = new Map();
  for (let t = 0; t < triCount; t++) {
    const ia = indexArray[t * 3], ib = indexArray[t * 3 + 1], ic = indexArray[t * 3 + 2];
    for (const [ea, eb] of [[ia, ib], [ib, ic], [ic, ia]]) {
      const ek = edgeKey(ea, eb);
      edgeFaceCount.set(ek, (edgeFaceCount.get(ek) || 0) + 1);
    }
  }

  const boundaryEdgesDirected = [];
  for (let t = 0; t < triCount; t++) {
    const ia = indexArray[t * 3], ib = indexArray[t * 3 + 1], ic = indexArray[t * 3 + 2];
    for (const [ea, eb] of [[ia, ib], [ib, ic], [ic, ia]]) {
      if (edgeFaceCount.get(edgeKey(ea, eb)) === 1) {
        boundaryEdgesDirected.push([ea, eb]);
      }
    }
  }

  if (boundaryEdgesDirected.length === 0) return 0;

  const nextVertex = new Map();
  for (const [a, b] of boundaryEdgesDirected) nextVertex.set(a, b);

  const visited = new Set();
  const loops = [];

  for (const [start] of boundaryEdgesDirected) {
    if (visited.has(start)) continue;
    const loop = [];
    let current = start;
    let steps = 0;
    while (!visited.has(current) && steps < HOLE_FILL_MAX_EDGES + 1) {
      visited.add(current);
      loop.push(current);
      current = nextVertex.get(current);
      if (current === undefined) break;
      steps++;
    }
    if (loop.length >= 3 && loop.length <= HOLE_FILL_MAX_EDGES && current === start) {
      loops.push(loop);
    }
  }

  if (loops.length === 0) return 0;

  const posArray = Array.from(positions);
  let newVertexIndex = Math.floor(posArray.length / 3);
  const newIndices = [...indexArray];

  for (const loop of loops) {
    let cx = 0, cy = 0, cz = 0;
    for (const vi of loop) {
      cx += positions[vi * 3];
      cy += positions[vi * 3 + 1];
      cz += positions[vi * 3 + 2];
    }
    cx /= loop.length; cy /= loop.length; cz /= loop.length;
    posArray.push(cx, cy, cz);
    const centroidIdx = newVertexIndex++;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      newIndices.push(b, a, centroidIdx);
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArray), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  return loops.length;
}

/* -- autoOrientForPrinting ------------------------------------------------ */

/**
 * Find optimal print orientation by detecting the largest flat face cluster.
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {{ quaternion: THREE.Quaternion, flatAreaMm2: number, clusterNormal: {x,y,z} }}
 */
export function autoOrientForPrinting(geometry) {
  const t0 = now();
  try {
    const { positions, indices, triangleCount } = extractTriangleData(geometry);
    const normals = [];
    const areas = [];

    for (let t = 0; t < triangleCount; t++) {
      if (t % 10000 === 0) checkTimeBudget(t0);
      const [ia, ib, ic] = getTriangleIndices(t, indices);
      const area = triangleArea(positions, ia, ib, ic);
      if (area < DEGENERATE_AREA_THRESHOLD) continue;
      const n = triangleNormal(positions, ia, ib, ic);
      const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
      if (len < 1e-12) continue;
      normals.push({ x: n.x / len, y: n.y / len, z: n.z / len });
      areas.push(area);
    }

    if (normals.length === 0) {
      return { quaternion: new THREE.Quaternion(), flatAreaMm2: 0, clusterNormal: { x: 0, y: 0, z: -1 } };
    }

    const ANGLE_THRESHOLD = 0.05;
    const clusters = [];

    for (let i = 0; i < normals.length; i++) {
      const n = normals[i];
      const a = areas[i];
      let bestCluster = -1;
      let bestDot = -Infinity;
      for (let c = 0; c < clusters.length; c++) {
        const cn = clusters[c].normal;
        const dot = n.x * cn.x + n.y * cn.y + n.z * cn.z;
        if (dot > (1 - ANGLE_THRESHOLD) && dot > bestDot) {
          bestDot = dot; bestCluster = c;
        }
      }
      if (bestCluster >= 0) {
        clusters[bestCluster].totalArea += a;
      } else {
        clusters.push({ normal: { ...n }, totalArea: a });
      }
    }

    let bestIdx = 0;
    for (let i = 1; i < clusters.length; i++) {
      if (clusters[i].totalArea > clusters[bestIdx].totalArea) bestIdx = i;
    }

    const bestNormal = clusters[bestIdx].normal;
    const bestArea = clusters[bestIdx].totalArea;
    const targetDir = new THREE.Vector3(0, 0, -1);
    const normalVec = new THREE.Vector3(bestNormal.x, bestNormal.y, bestNormal.z);
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(normalVec, targetDir);

    return { quaternion: quat, flatAreaMm2: bestArea, clusterNormal: bestNormal };
  } catch {
    return { quaternion: new THREE.Quaternion(), flatAreaMm2: 0, clusterNormal: { x: 0, y: 0, z: -1 } };
  }
}

/* -- exportSTL ------------------------------------------------------------ */

/**
 * Export a BufferGeometry as binary STL and trigger browser download.
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {string} [filename='repaired.stl']
 */
export function exportSTL(geometry, filename = 'repaired.stl') {
  const positions = geometry.attributes.position.array;
  const index = geometry.getIndex?.() || geometry.index;
  const indexArray = index?.array || null;
  const vertexCount = geometry.attributes.position.count;
  const triangleCount = indexArray
    ? Math.floor(indexArray.length / 3)
    : Math.floor(vertexCount / 3);

  const bufferSize = 80 + 4 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const headerStr = 'ModelPricer Mesh Repair Export';
  for (let i = 0; i < Math.min(headerStr.length, 80); i++) {
    view.setUint8(i, headerStr.charCodeAt(i));
  }
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let t = 0; t < triangleCount; t++) {
    let ia, ib, ic;
    if (indexArray) {
      ia = indexArray[t * 3]; ib = indexArray[t * 3 + 1]; ic = indexArray[t * 3 + 2];
    } else {
      ia = t * 3; ib = t * 3 + 1; ic = t * 3 + 2;
    }

    const n = triangleNormal(positions, ia, ib, ic);
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    const nx = len > 0 ? n.x / len : 0;
    const ny = len > 0 ? n.y / len : 0;
    const nz = len > 0 ? n.z / len : 0;

    view.setFloat32(offset, nx, true); offset += 4;
    view.setFloat32(offset, ny, true); offset += 4;
    view.setFloat32(offset, nz, true); offset += 4;

    view.setFloat32(offset, positions[ia * 3], true); offset += 4;
    view.setFloat32(offset, positions[ia * 3 + 1], true); offset += 4;
    view.setFloat32(offset, positions[ia * 3 + 2], true); offset += 4;

    view.setFloat32(offset, positions[ib * 3], true); offset += 4;
    view.setFloat32(offset, positions[ib * 3 + 1], true); offset += 4;
    view.setFloat32(offset, positions[ib * 3 + 2], true); offset += 4;

    view.setFloat32(offset, positions[ic * 3], true); offset += 4;
    view.setFloat32(offset, positions[ic * 3 + 1], true); offset += 4;
    view.setFloat32(offset, positions[ic * 3 + 2], true); offset += 4;

    view.setUint16(offset, 0, true); offset += 2;
  }

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}