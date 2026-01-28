// Minimal .ini parser used for PrusaSlicer preset import.
// Supports lines like "key = value" with sections [..] and comments starting with ';' or '#'.

export function parseIniToKeyValue(text) {
  const lines = String(text || '').split(/\r?\n/);
  const out = {};

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;
    if (line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const valueRaw = line.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = valueRaw;
  }
  return out;
}

export function coerceIniValue(valueRaw, dataType) {
  if (valueRaw == null) return valueRaw;
  const v = String(valueRaw).trim();

  switch (dataType) {
    case 'boolean': {
      // PrusaSlicer typically uses 0/1, but also supports true/false in some contexts.
      if (v === '1' || v.toLowerCase() === 'true') return true;
      if (v === '0' || v.toLowerCase() === 'false') return false;
      return Boolean(v);
    }
    case 'number': {
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }
    default:
      return v;
  }
}
