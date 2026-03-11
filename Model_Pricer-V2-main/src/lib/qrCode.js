/**
 * Minimal QR Code generator — pure JavaScript, no external dependencies.
 *
 * Supports only alphanumeric / byte mode, error correction level L,
 * and versions 1-10 (up to ~271 bytes). This is sufficient for URLs.
 *
 * Returns a data-URL (PNG) via an offscreen <canvas>.
 */

// ── Galois Field GF(256) arithmetic ──────────────────────────────────────────

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

function polyMul(a, b) {
  const r = new Uint8Array(a.length + b.length - 1);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      r[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return r;
}

function polyRemainder(dividend, generator) {
  const result = new Uint8Array(dividend);
  for (let i = 0; i < dividend.length - generator.length + 1; i++) {
    if (result[i] === 0) continue;
    const coef = result[i];
    for (let j = 0; j < generator.length; j++) {
      result[i + j] ^= gfMul(generator[j], coef);
    }
  }
  return result.slice(dividend.length - generator.length + 1);
}

function generatorPoly(n) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < n; i++) {
    g = polyMul(g, new Uint8Array([1, EXP[i]]));
  }
  return g;
}

// ── QR Code version / capacity tables (EC level L only) ──────────────────────

// Total codewords, EC codewords per block, number of blocks
const VERSION_TABLE = [
  null, // 0 — unused
  { total: 26, ecPerBlock: 7, blocks: 1 },   // v1
  { total: 44, ecPerBlock: 10, blocks: 1 },  // v2
  { total: 70, ecPerBlock: 15, blocks: 1 },  // v3
  { total: 100, ecPerBlock: 20, blocks: 1 }, // v4
  { total: 134, ecPerBlock: 26, blocks: 1 }, // v5
  { total: 172, ecPerBlock: 18, blocks: 2 }, // v6
  { total: 196, ecPerBlock: 20, blocks: 2 }, // v7
  { total: 230, ecPerBlock: 24, blocks: 2 }, // v8
  { total: 271, ecPerBlock: 30, blocks: 2 }, // v9
  { total: 313, ecPerBlock: 18, blocks: 4 }, // v10
];

function chooseVersion(byteLen) {
  for (let v = 1; v <= 10; v++) {
    const info = VERSION_TABLE[v];
    const dataCodewords = info.total - info.ecPerBlock * info.blocks;
    // byte mode: 4-bit mode indicator + 8/16-bit length + data + 4-bit terminator
    const headerBits = 4 + (v <= 9 ? 8 : 16);
    const available = dataCodewords * 8 - headerBits;
    if (byteLen * 8 <= available) return v;
  }
  throw new Error('QR: data too long (max ~271 bytes for version 10-L)');
}

// ── Bit stream helpers ───────────────────────────────────────────────────────

class BitStream {
  constructor() {
    this.data = [];
    this.bitLength = 0;
  }
  append(value, length) {
    for (let i = length - 1; i >= 0; i--) {
      this.data.push((value >> i) & 1);
    }
    this.bitLength += length;
  }
  toCodewords(totalCodewords) {
    // terminator
    const cap = totalCodewords * 8;
    const termBits = Math.min(4, cap - this.bitLength);
    this.append(0, termBits);
    // pad to byte
    while (this.bitLength % 8 !== 0) this.append(0, 1);
    // pad codewords
    const pads = [0xec, 0x11];
    let pi = 0;
    while (this.bitLength < cap) {
      this.append(pads[pi], 8);
      pi ^= 1;
    }
    const out = new Uint8Array(totalCodewords);
    for (let i = 0; i < totalCodewords; i++) {
      let byte = 0;
      for (let b = 0; b < 8; b++) {
        byte = (byte << 1) | (this.data[i * 8 + b] || 0);
      }
      out[i] = byte;
    }
    return out;
  }
}

// ── Error correction ─────────────────────────────────────────────────────────

function addErrorCorrection(data, version) {
  const info = VERSION_TABLE[version];
  const ecPerBlock = info.ecPerBlock;
  const totalBlocks = info.blocks;
  const totalDataCodewords = info.total - ecPerBlock * totalBlocks;
  const shortBlockSize = Math.floor(totalDataCodewords / totalBlocks);
  const longBlocks = totalDataCodewords - shortBlockSize * totalBlocks;

  const gen = generatorPoly(ecPerBlock);
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;

  for (let b = 0; b < totalBlocks; b++) {
    const blockLen = shortBlockSize + (b >= totalBlocks - longBlocks ? 1 : 0);
    const block = data.slice(offset, offset + blockLen);
    offset += blockLen;
    dataBlocks.push(block);

    // compute EC
    const padded = new Uint8Array(blockLen + ecPerBlock);
    padded.set(block);
    const ec = polyRemainder(padded, gen);
    ecBlocks.push(ec);
  }

  // interleave
  const result = [];
  const maxDataLen = shortBlockSize + (longBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) result.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      result.push(ecBlocks[b][i]);
    }
  }
  return new Uint8Array(result);
}

// ── Matrix placement ─────────────────────────────────────────────────────────

function createMatrix(version) {
  const size = version * 4 + 17;
  // 0 = white, 1 = black, -1 = reserved (not yet placed)
  const matrix = Array.from({ length: size }, () => new Int8Array(size));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  // finder patterns
  function finderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = r === -1 || r === 7 || c === -1 || c === 7;
        const inRing = r === 0 || r === 6 || c === 0 || c === 6;
        const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = (inRing || inCenter) && !inOuter ? 1 : 0;
        reserved[rr][cc] = 1;
      }
    }
  }

  finderPattern(0, 0);
  finderPattern(0, size - 7);
  finderPattern(size - 7, 0);

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = matrix[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = reserved[i][6] = 1;
  }

  // alignment patterns (v2+)
  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    for (const r of positions) {
      for (const c of positions) {
        // skip if overlapping finder
        if (reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const val = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0) ? 1 : 0;
            matrix[r + dr][c + dc] = val;
            reserved[r + dr][c + dc] = 1;
          }
        }
      }
    }
  }

  // reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = reserved[i][8] = 1;
    reserved[8][size - 1 - i] = reserved[size - 1 - i][8] = 1;
  }
  reserved[8][8] = 1;
  // dark module
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = 1;

  return { matrix, reserved, size };
}

function getAlignmentPositions(version) {
  if (version === 1) return [];
  const first = 6;
  const last = version * 4 + 10;
  const count = Math.floor(version / 7) + 2;
  if (count === 2) return [first, last];
  const step = Math.ceil((last - first) / (count - 1));
  const positions = [first];
  for (let i = 1; i < count - 1; i++) {
    positions.push(last - (count - 1 - i) * step);
  }
  positions.push(last);
  return positions;
}

function placeData(matrix, reserved, size, codewords) {
  let bitIndex = 0;
  const totalBits = codewords.length * 8;

  // Traverse right-to-left in 2-column strips, bottom-to-top then top-to-bottom
  let col = size - 1;
  while (col >= 0) {
    if (col === 6) col--; // skip timing column
    const upward = ((size - 1 - col) >> 1) % 2 === 0;
    for (let cnt = 0; cnt < size; cnt++) {
      const row = upward ? size - 1 - cnt : cnt;
      for (let dc = 0; dc <= 1; dc++) {
        const c = col - dc;
        if (c < 0) continue;
        if (reserved[row][c]) continue;
        if (bitIndex < totalBits) {
          const byteIdx = bitIndex >> 3;
          const bitIdx = 7 - (bitIndex & 7);
          matrix[row][c] = (codewords[byteIdx] >> bitIdx) & 1;
          bitIndex++;
        } else {
          matrix[row][c] = 0;
        }
      }
    }
    col -= 2;
  }
}

// ── Masking ──────────────────────────────────────────────────────────────────

const MASK_FUNCTIONS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
];

function applyMask(matrix, reserved, size, maskIndex) {
  const fn = MASK_FUNCTIONS[maskIndex];
  const result = matrix.map(row => new Int8Array(row));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && fn(r, c)) {
        result[r][c] ^= 1;
      }
    }
  }
  return result;
}

// Penalty scoring (simplified — enough for decent mask selection)
function penaltyScore(matrix, size) {
  let score = 0;
  // Rule 1 — runs of same color
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        run = 1;
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else {
        run = 1;
      }
    }
  }
  return score;
}

// Format info (EC level L = 01, mask pattern 0-7)
const FORMAT_BITS = [
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
];

function placeFormatInfo(matrix, size, maskIndex) {
  const bits = FORMAT_BITS[maskIndex];
  // Around top-left finder
  const positions = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions[i];
    matrix[r][c] = (bits >> (14 - i)) & 1;
  }
  // Around top-right and bottom-left finders
  for (let i = 0; i < 8; i++) {
    matrix[size - 1 - i][8] = (bits >> i) & 1;
  }
  for (let i = 8; i < 15; i++) {
    matrix[8][size - 15 + i] = (bits >> i) & 1;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a QR code matrix (2D boolean array) for the given text.
 * @param {string} text - The text / URL to encode.
 * @returns {{ modules: boolean[][], size: number }}
 */
export function generateQRMatrix(text) {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  const info = VERSION_TABLE[version];

  // Encode data
  const stream = new BitStream();
  stream.append(0b0100, 4); // byte mode
  stream.append(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) stream.append(b, 8);

  const totalDataCodewords = info.total - info.ecPerBlock * info.blocks;
  const dataCodewords = stream.toCodewords(totalDataCodewords);
  const codewords = addErrorCorrection(dataCodewords, version);

  // Build matrix
  const { matrix, reserved, size } = createMatrix(version);
  placeData(matrix, reserved, size, codewords);

  // Try all masks, pick best
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, reserved, size, m);
    placeFormatInfo(masked, size, m);
    const p = penaltyScore(masked, size);
    if (p < bestPenalty) {
      bestPenalty = p;
      bestMask = m;
    }
  }

  const finalMatrix = applyMask(matrix, reserved, size, bestMask);
  placeFormatInfo(finalMatrix, size, bestMask);

  // Convert to boolean[][]
  const modules = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(finalMatrix[r][c] === 1);
    }
    modules.push(row);
  }

  return { modules, size };
}

/**
 * Render a QR code to a canvas data-URL (PNG).
 *
 * @param {string} text - Text / URL to encode.
 * @param {Object} [options]
 * @param {number} [options.scale=8] - Pixels per module.
 * @param {number} [options.margin=4] - Quiet zone in modules.
 * @param {string} [options.foreground='#000000'] - Module color.
 * @param {string} [options.background='#FFFFFF'] - Background color.
 * @returns {string} PNG data-URL.
 */
export function generateQRDataURL(text, options = {}) {
  const {
    scale = 8,
    margin = 4,
    foreground = '#000000',
    background = '#FFFFFF',
  } = options;

  const { modules, size } = generateQRMatrix(text);
  const totalSize = (size + margin * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, totalSize, totalSize);

  // Modules
  ctx.fillStyle = foreground;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
