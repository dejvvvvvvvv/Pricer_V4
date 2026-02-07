// src/utils/slicerErrorClassifier.js
// Classifies PrusaSlicer errors into user-friendly categories.

/**
 * Error categories with severity levels and user-friendly messages.
 */
const ERROR_PATTERNS = [
  // Mesh / geometry issues
  {
    category: 'MESH_NON_MANIFOLD',
    severity: 'error',
    patterns: [/non[- ]?manifold/i, /not.*manifold/i, /open mesh/i],
    userMessage: 'Model obsahuje neuzavřený povrch (non-manifold). Zkuste model opravit v MeshMixer nebo Netfabb.',
    userMessageEn: 'Model has an open surface (non-manifold). Try repairing in MeshMixer or Netfabb.',
  },
  {
    category: 'MESH_ZERO_VOLUME',
    severity: 'error',
    patterns: [/zero[- ]?volume/i, /degenerate/i, /empty.*mesh/i, /no.*facet/i],
    userMessage: 'Model má nulový objem nebo neobsahuje žádné plochy. Soubor je pravděpodobně poškozený.',
    userMessageEn: 'Model has zero volume or no faces. The file is likely corrupted.',
  },
  {
    category: 'MESH_TOO_SMALL',
    severity: 'warning',
    patterns: [/too small/i, /below.*minimum/i, /tiny/i],
    userMessage: 'Model je příliš malý pro tisk. Zkontrolujte měřítko (mm vs inch).',
    userMessageEn: 'Model is too small to print. Check scale (mm vs inches).',
  },
  {
    category: 'MESH_TOO_LARGE',
    severity: 'warning',
    patterns: [/exceeds.*build.*volume/i, /too large/i, /outside.*print.*area/i, /object.*outside.*bed/i],
    userMessage: 'Model přesahuje tiskovou plochu. Zmenšete model nebo zkontrolujte orientaci.',
    userMessageEn: 'Model exceeds the print bed. Scale it down or check orientation.',
  },
  {
    category: 'MESH_SELF_INTERSECTING',
    severity: 'error',
    patterns: [/self[- ]?intersect/i, /overlapping/i],
    userMessage: 'Model obsahuje překrývající se plochy. Zkuste ho opravit v MeshMixer.',
    userMessageEn: 'Model has self-intersecting faces. Try repairing in MeshMixer.',
  },
  {
    category: 'MESH_INVERTED_NORMALS',
    severity: 'warning',
    patterns: [/inverted.*normal/i, /flipped.*normal/i, /inside[- ]?out/i],
    userMessage: 'Model má obrácené normály (povrch je "naruby"). Zkuste přepočítat normály.',
    userMessageEn: 'Model has inverted normals (surface is inside-out). Try recalculating normals.',
  },
  // File format issues
  {
    category: 'FILE_CORRUPT',
    severity: 'error',
    patterns: [/can'?t.*read/i, /failed to parse/i, /invalid.*file/i, /corrupt/i, /malformed/i, /unexpected.*eof/i],
    userMessage: 'Soubor je poškozený nebo neplatný. Zkuste ho znovu exportovat z modelovacího programu.',
    userMessageEn: 'File is corrupted or invalid. Try re-exporting from your 3D modeling software.',
  },
  {
    category: 'FILE_UNSUPPORTED',
    severity: 'error',
    patterns: [/unsupported.*format/i, /unknown.*file.*type/i],
    userMessage: 'Nepodporovaný formát souboru. Podporujeme STL, OBJ a 3MF.',
    userMessageEn: 'Unsupported file format. We support STL, OBJ and 3MF.',
  },
  // Slicer configuration issues
  {
    category: 'CONFIG_MISSING',
    severity: 'error',
    patterns: [/no.*\.ini/i, /profile.*not found/i, /missing.*config/i],
    userMessage: 'Chybí konfigurace sliceru. Kontaktujte administrátora.',
    userMessageEn: 'Slicer configuration is missing. Contact the administrator.',
  },
  {
    category: 'SLICER_NOT_FOUND',
    severity: 'error',
    patterns: [/not configured/i, /slicer.*not found/i, /ENOENT/i],
    userMessage: 'PrusaSlicer není nainstalovaný nebo nakonfigurovaný na serveru.',
    userMessageEn: 'PrusaSlicer is not installed or configured on the server.',
  },
  // Timeout / resource issues
  {
    category: 'TIMEOUT',
    severity: 'warning',
    patterns: [/timed? ?out/i, /timeout/i],
    userMessage: 'Výpočet trval příliš dlouho a byl přerušen. Model může být příliš složitý.',
    userMessageEn: 'Calculation took too long and was interrupted. The model may be too complex.',
  },
  // Network issues
  {
    category: 'NETWORK_ERROR',
    severity: 'error',
    patterns: [/fetch.*failed/i, /network.*error/i, /ERR_CONNECTION/i, /ECONNREFUSED/i, /failed to fetch/i],
    userMessage: 'Nepodařilo se spojit se serverem. Zkontrolujte, zda běží backend.',
    userMessageEn: 'Could not connect to the server. Check if the backend is running.',
  },
];

/**
 * Classifies a slicer error message into a user-friendly category.
 *
 * @param {string} errorMessage - Raw error message from backend or catch block
 * @param {string} [stderr] - PrusaSlicer stderr output (optional, from backend response)
 * @returns {{ category: string, severity: 'error'|'warning', userMessage: string, userMessageEn: string, raw: string }}
 */
export function classifySlicerError(errorMessage, stderr) {
  const combined = [errorMessage || '', stderr || ''].join(' ');

  for (const pattern of ERROR_PATTERNS) {
    for (const re of pattern.patterns) {
      if (re.test(combined)) {
        return {
          category: pattern.category,
          severity: pattern.severity,
          userMessage: pattern.userMessage,
          userMessageEn: pattern.userMessageEn,
          raw: errorMessage || '',
        };
      }
    }
  }

  // Unknown error fallback
  return {
    category: 'UNKNOWN',
    severity: 'error',
    userMessage: `Výpočet selhal: ${(errorMessage || 'Neznámá chyba').slice(0, 200)}`,
    userMessageEn: `Calculation failed: ${(errorMessage || 'Unknown error').slice(0, 200)}`,
    raw: errorMessage || '',
  };
}

/**
 * Extracts a short user-friendly error from a backend error response or exception.
 *
 * @param {Error|string|object} err - Error from catch block or backend JSON
 * @returns {{ userMessage: string, category: string, severity: string }}
 */
export function parseSlicerError(err) {
  if (!err) {
    return classifySlicerError('Unknown error');
  }

  // Backend JSON response with stderr
  if (typeof err === 'object' && err.stderr) {
    return classifySlicerError(err.error || err.message || '', err.stderr);
  }

  // Standard Error object
  if (err instanceof Error) {
    return classifySlicerError(err.message);
  }

  // String
  if (typeof err === 'string') {
    return classifySlicerError(err);
  }

  // Object with error/message field
  if (typeof err === 'object') {
    return classifySlicerError(err.error || err.message || JSON.stringify(err));
  }

  return classifySlicerError(String(err));
}
