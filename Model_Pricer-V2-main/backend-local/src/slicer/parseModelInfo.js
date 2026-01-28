/**
 * Parses output of:
 *   prusa-slicer-console.exe --info model.stl
 * Example lines:
 *   size_x = 20.000000
 *   manifold = yes
 */
export function parseModelInfo(stdout) {
  const lines = String(stdout || "").split(/\r?\n/);

  const raw = {};
  for (const line of lines) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    const key = m[1];
    const valRaw = m[2].trim();

    // numeric?
    const num = Number(valRaw);
    if (!Number.isNaN(num) && /^-?\d+(?:\.\d+)?$/.test(valRaw)) {
      raw[key] = num;
    } else {
      raw[key] = valRaw;
    }
  }

  const info = {
    raw,
    sizeMm: pickXYZ(raw, "size_"),
    bboxMm: {
      min: pickXYZ(raw, "min_"),
      max: pickXYZ(raw, "max_")
    },
    volumeMm3: asNumber(raw.volume),
    facets: asNumber(raw.number_of_facets),
    parts: asNumber(raw.number_of_parts),
    manifold: asBoolYesNo(raw.manifold)
  };

  // Remove empty groups to keep API clean
  if (!hasAllXYZ(info.sizeMm)) delete info.sizeMm;
  if (!hasAllXYZ(info.bboxMm.min) || !hasAllXYZ(info.bboxMm.max)) delete info.bboxMm;
  if (info.volumeMm3 == null) delete info.volumeMm3;
  if (info.facets == null) delete info.facets;
  if (info.parts == null) delete info.parts;
  if (info.manifold == null) delete info.manifold;

  return info;
}

function pickXYZ(raw, prefix) {
  return {
    x: asNumber(raw[`${prefix}x`]),
    y: asNumber(raw[`${prefix}y`]),
    z: asNumber(raw[`${prefix}z`])
  };
}

function hasAllXYZ(v) {
  return v && [v.x, v.y, v.z].every((n) => typeof n === "number" && Number.isFinite(n));
}

function asNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asBoolYesNo(v) {
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "yes") return true;
    if (s === "no") return false;
  }
  return null;
}
