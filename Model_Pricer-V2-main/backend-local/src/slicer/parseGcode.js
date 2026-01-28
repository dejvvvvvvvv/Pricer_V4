export function parseGcodeMetrics(gcodeText) {
  const lines = gcodeText.split(/\r?\n/);
  // PrusaSlicer writes a *lot* of config keys into the G-code header.
  // For some profiles, the interesting summary lines (filament/time) can end up
  // far beyond the first couple thousand lines.
  // We therefore scan a larger head chunk, and also include a tail chunk as a fallback.
  const HEAD_LINES = 20000;
  const TAIL_LINES = 20000;
  const head = lines.slice(0, HEAD_LINES).join("\n");
  const tail = lines.length > TAIL_LINES ? lines.slice(Math.max(0, lines.length - TAIL_LINES)).join("\n") : "";
  const joined = tail ? `${head}\n\n${tail}` : head;

  const timeSeconds = parseEstimatedTimeSeconds(joined);
  const filamentGrams = parseFilamentGrams(joined);
  const filamentMm = parseFilamentMm(joined);

  return {
    estimatedTimeSeconds: timeSeconds,
    filamentGrams,
    filamentMm
  };
}

function parseEstimatedTimeSeconds(text) {
  // PrusaSlicer/Slic3r typically writes one of these into the G-code header:
  // ; estimated printing time (normal mode) = 1h 2m 3s
  // ; estimated printing time (silent mode) = 00:12:34
  // ; printing time = 12m 34s
  // Sometimes other slicers include Cura-like: ;TIME:1234

  // 1) Cura-like TIME in seconds (rare for PrusaSlicer, but easy win)
  {
    const m = text.match(/^\s*;\s*TIME\s*:\s*(\d+)\s*$/im);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && v > 0) return v;
    }
  }

  // 2) PrusaSlicer-style "estimated printing time" variants
  {
    const re = /(?:estimated\s+printing\s+time|printing\s+time)(?:\s*\([^\)]*\))?\s*(?:=|:)\s*([^\n\r;]+)/i;
    const m = text.match(re);
    if (m) {
      const sec = timeToSeconds(m[1].trim());
      if (sec != null) return sec;
    }
  }

  return null;
}

function timeToSeconds(raw) {
  // Accept "HH:MM:SS" or "MM:SS"
  const colon = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (colon) {
    const a = Number(colon[1]);
    const b = Number(colon[2]);
    const c = colon[3] != null ? Number(colon[3]) : null;
    if (Number.isNaN(a) || Number.isNaN(b) || (c != null && Number.isNaN(c))) return null;
    if (c == null) {
      // MM:SS
      return a * 60 + b;
    }
    // HH:MM:SS
    return a * 3600 + b * 60 + c;
  }

  // Accept tokens like "1d 2h 3m 4s" or "2h 10m" or "45m 12s"
  // Also accept "1h02m03s" (no spaces)
  const norm = raw.replace(/,/g, ".");
  const unitRe = /(?:(\d+(?:\.\d+)?)\s*d)?\s*(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?\s*(?:(\d+(?:\.\d+)?)\s*s)?/i;
  const u = norm.match(unitRe);
  if (u) {
    const days = u[1] ? Number(u[1]) : 0;
    const hours = u[2] ? Number(u[2]) : 0;
    const mins = u[3] ? Number(u[3]) : 0;
    const secs = u[4] ? Number(u[4]) : 0;
    const total = days * 86400 + hours * 3600 + mins * 60 + secs;
    if (total > 0) return Math.round(total);
  }

  return null;
}

function parseFilamentGrams(text) {
  // Examples:
  // ; filament used [g] = 12.34
  // ; filament used [g] = 12.34, 0.00  (multi-extruder)
  // ; total filament used [g] = 12.34
  // ; filament used = 1234.5 mm (12.34 g)

  // 1) Preferred: explicit [g] line (sum if multiple values)
  {
    const re = /(?:total\s+)?filament\s+used\s*\[g\]\s*(?:=|:)\s*([^\n\r;]+)/i;
    const m = text.match(re);
    if (m) {
      const sum = sumNumbersFromText(m[1]);
      if (sum != null) return sum;
    }
  }

  // 2) Alternative: "(12.34 g)" inline
  {
    const re = /filament\s+used\s*=\s*[^\n\r;]*\(\s*([0-9]+(?:[\.,][0-9]+)?)\s*g\s*\)/i;
    const m = text.match(re);
    if (m) {
      const v = Number(m[1].replace(",", "."));
      return Number.isFinite(v) ? v : null;
    }
  }

  // 3) Some headers may use "filament used [g]:" formatting
  {
    const re = /filament\s+used\s*\[g\]\s*:\s*([^\n\r;]+)/i;
    const m = text.match(re);
    if (m) {
      const sum = sumNumbersFromText(m[1]);
      if (sum != null) return sum;
    }
  }

  return null;
}

function parseFilamentMm(text) {
  // Examples:
  // ; filament used [mm] = 1234.5
  // ; filament used [mm] = 1234.5, 0.0 (multi-extruder)
  // ; total filament used [mm] = 1234.5
  // ; filament used = 1234.5 mm (12.34 g)

  // 1) Preferred: explicit [mm] line (sum if multiple values)
  {
    const re = /(?:total\s+)?filament\s+used\s*\[mm\]\s*(?:=|:)\s*([^\n\r;]+)/i;
    const m = text.match(re);
    if (m) {
      const sum = sumNumbersFromText(m[1]);
      if (sum != null) return sum;
    }
  }

  // 2) Alternative: inline "= 1234.5 mm"
  {
    const re = /filament\s+used\s*=\s*([0-9]+(?:[\.,][0-9]+)?)\s*mm\b/i;
    const m = text.match(re);
    if (m) {
      const v = Number(m[1].replace(",", "."));
      return Number.isFinite(v) ? v : null;
    }
  }

  // 3) Some headers may use "filament used [mm]:" formatting
  {
    const re = /filament\s+used\s*\[mm\]\s*:\s*([^\n\r;]+)/i;
    const m = text.match(re);
    if (m) {
      const sum = sumNumbersFromText(m[1]);
      if (sum != null) return sum;
    }
  }

  return null;
}

function sumNumbersFromText(raw) {
  // Accept: "12.34", "12,34", "12.34, 0.00", "12.34 0" etc.
  const parts = String(raw)
    .trim()
    .split(/[^0-9\.,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s.replace(",", ".")))
    .filter((n) => Number.isFinite(n));

  if (!parts.length) return null;
  const sum = parts.reduce((a, b) => a + b, 0);
  return sum > 0 ? sum : null;
}
