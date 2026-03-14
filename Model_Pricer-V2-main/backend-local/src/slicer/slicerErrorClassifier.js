/**
 * slicerErrorClassifier.js — Classifies PrusaSlicer errors into user-friendly
 * error codes and messages based on stderr output, exit codes, and error types.
 *
 * Error classification hierarchy:
 *   1. Node.js-level errors (ENOENT, timeout)
 *   2. PrusaSlicer stderr pattern matching
 *   3. Exit code fallback
 *
 * All returned error codes use the MP_ prefix for consistency with the API layer.
 *
 * @module slicer/slicerErrorClassifier
 */

/**
 * @typedef {Object} ClassifiedError
 * @property {string} errorCode - MP_* error code for the API response
 * @property {string} message - User-friendly error message
 * @property {number} httpStatus - Suggested HTTP status code
 * @property {string} category - Internal category for logging/metrics
 * @property {string|null} hint - Optional hint for resolution (dev-only)
 */

/**
 * Known stderr patterns from PrusaSlicer mapped to error classifications.
 * Order matters: first match wins. More specific patterns should come first.
 */
const STDERR_PATTERNS = [
  // --- File / geometry issues ---
  {
    // Unsupported format must come before the generic "error reading file" rule
    // because PrusaSlicer prints this without an "error" prefix.
    pattern: /(?:unsupported\s+(?:file\s+)?format|unknown\s+(?:file\s+)?extension|cannot\s+(?:handle|process)\s+.*format)/i,
    errorCode: "MP_UNSUPPORTED_FORMAT",
    message: "The uploaded file format is not supported by PrusaSlicer. Use STL, OBJ, 3MF, or AMF.",
    httpStatus: 400,
    category: "invalid_input",
    hint: "Re-export the model as STL or 3MF from your CAD application.",
  },
  {
    pattern: /(?:error|failed)\s*(?:while|:)?\s*(?:reading|opening|loading|parsing)\s+(?:the\s+)?(?:file|model|mesh|input)/i,
    errorCode: "MP_INVALID_MODEL",
    message: "The uploaded model file could not be read. It may be corrupted or in an unsupported format.",
    httpStatus: 400,
    category: "invalid_input",
    hint: "Check the file is a valid STL/OBJ/3MF/AMF. Try re-exporting from your CAD software.",
  },
  {
    pattern: /(?:empty|zero[- ]?size|no\s+facets|no\s+triangles|degenerate)/i,
    errorCode: "MP_EMPTY_MODEL",
    message: "The model appears to be empty or contains no valid geometry (zero triangles).",
    httpStatus: 400,
    category: "invalid_input",
    hint: "The file has no renderable geometry. Re-export with mesh data included.",
  },
  {
    pattern: /(?:non[- ]?manifold|not\s+manifold|open\s+edges?|hole|self[- ]?intersect)/i,
    errorCode: "MP_MESH_NOT_MANIFOLD",
    message: "The model mesh has geometry issues (non-manifold edges or self-intersections). Try using /api/mesh/repair first.",
    httpStatus: 422,
    category: "mesh_issue",
    hint: "Run mesh repair before slicing, or fix the model in your CAD tool.",
  },
  {
    pattern: /(?:object\s+is\s+too\s+(?:big|large)|exceeds?\s+(?:the\s+)?(?:print|build)\s*(?:bed|volume|area|size))/i,
    errorCode: "MP_MODEL_TOO_LARGE",
    message: "The model exceeds the configured print bed dimensions and cannot be sliced with the current preset.",
    httpStatus: 422,
    category: "model_size",
    hint: "Scale the model down or use a preset with a larger print bed.",
  },

  // --- INI / config issues ---
  {
    pattern: /(?:unknown\s+(?:option|key|config)|invalid\s+(?:option|config|parameter|value)|(?:option|key)\s+.*not\s+(?:found|recognized))/i,
    errorCode: "MP_INVALID_PRESET",
    message: "The slicing preset (INI profile) contains invalid or unrecognized configuration options.",
    httpStatus: 400,
    category: "invalid_config",
    hint: "Re-export the INI profile from PrusaSlicer, or check for version compatibility.",
  },
  {
    pattern: /(?:can(?:'t|not)\s+(?:open|read|find|load)\s+.*\.ini|no\s+(?:such|valid)\s+(?:file|config|profile))/i,
    errorCode: "MP_PRESET_NOT_FOUND",
    message: "The slicing preset file could not be found or read.",
    httpStatus: 404,
    category: "missing_config",
    hint: "Ensure the preset INI file exists and is accessible.",
  },

  // --- Memory / resource issues ---
  {
    pattern: /(?:out\s+of\s+memory|cannot\s+allocate|bad_alloc|memory\s+(?:error|exhausted|limit))/i,
    errorCode: "MP_SLICER_OUT_OF_MEMORY",
    message: "PrusaSlicer ran out of memory while processing this model. The model may be too complex.",
    httpStatus: 507,
    category: "resource_exhaustion",
    hint: "Try reducing mesh complexity (decimate) or slicing with lower quality settings.",
  },
  {
    pattern: /(?:segmentation\s+fault|sigsegv|access\s+violation|fatal\s+error)/i,
    errorCode: "MP_SLICER_CRASH",
    message: "PrusaSlicer crashed while processing this model. This is typically caused by extremely complex geometry.",
    httpStatus: 500,
    category: "slicer_crash",
    hint: "Try simplifying the model or using a different preset. Report this if it persists.",
  },

  // --- General slicer errors ---
  {
    pattern: /(?:slicing\s+(?:error|failed)|error\s+(?:during|while)\s+slicing)/i,
    errorCode: "MP_SLICING_FAILED",
    message: "PrusaSlicer encountered an error during slicing. The model or preset may be incompatible.",
    httpStatus: 500,
    category: "slicing_error",
    hint: "Try a different preset or check the model for issues.",
  },
];

/**
 * Classify a PrusaSlicer error based on all available information.
 *
 * @param {Object} opts
 * @param {Error|null} [opts.error] - The Node.js Error object (if thrown)
 * @param {string} [opts.stderr] - PrusaSlicer's stderr output
 * @param {number|null} [opts.exitCode] - PrusaSlicer's exit code
 * @param {string} [opts.context] - Additional context (e.g., "repair", "slice", "info")
 * @returns {ClassifiedError}
 */
export function classifySlicerError({ error = null, stderr = "", exitCode = null, context = "slice" } = {}) {
  // 1. Node.js-level error classification (highest priority)
  if (error) {
    // Binary not found
    if (error.code === "ENOENT") {
      return {
        errorCode: "MP_SLICER_UNAVAILABLE",
        message: "PrusaSlicer binary not found at the configured path.",
        httpStatus: 503,
        category: "slicer_missing",
        hint: "Set PRUSA_SLICER_CMD in backend-local/.env or place portable in ../tools/prusaslicer",
      };
    }

    // Permission denied
    if (error.code === "EACCES" || error.code === "EPERM") {
      return {
        errorCode: "MP_SLICER_UNAVAILABLE",
        message: "Insufficient permissions to execute PrusaSlicer.",
        httpStatus: 503,
        category: "slicer_permission",
        hint: "Check file permissions on the PrusaSlicer executable.",
      };
    }

    // Timeout — check killed/signal flags first (set by Node child_process timeout),
    // then fall back to message string for wrappers that surface it differently.
    const isTimeout =
      error.killed === true ||
      error.signal === "SIGKILL" ||
      error.signal === "SIGTERM" ||
      error.message?.includes("timed out") ||
      error.message?.includes("timeout");
    if (isTimeout) {
      const timeoutMatch = error.message?.match(/(\d+)ms/);
      const seconds = timeoutMatch ? Math.round(Number(timeoutMatch[1]) / 1000) : "unknown";
      return {
        errorCode: "MP_SLICER_TIMEOUT",
        message: `PrusaSlicer ${context} operation timed out after ${seconds} seconds. The model may be too complex.`,
        httpStatus: 504,
        category: "timeout",
        hint: "Try a simpler model or increase the timeout setting.",
      };
    }

    // Spawn error (generic)
    if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      return {
        errorCode: "MP_SLICER_OUTPUT_TOO_LARGE",
        message: "PrusaSlicer produced too much output. The model may be unusually complex.",
        httpStatus: 500,
        category: "output_overflow",
        hint: null,
      };
    }
  }

  // 2. Pattern match against stderr (second priority)
  if (stderr) {
    for (const rule of STDERR_PATTERNS) {
      if (rule.pattern.test(stderr)) {
        return {
          errorCode: rule.errorCode,
          message: rule.message,
          httpStatus: rule.httpStatus,
          category: rule.category,
          hint: rule.hint,
        };
      }
    }
  }

  // 3. Exit code fallback (lowest priority)
  if (exitCode != null && exitCode !== 0) {
    return {
      errorCode: "MP_SLICING_FAILED",
      message: `PrusaSlicer ${context} exited with code ${exitCode}.`,
      httpStatus: 500,
      category: "unknown_exit_code",
      hint: "Check the slicer stderr logs for more details.",
    };
  }

  // 4. Absolute fallback
  return {
    errorCode: "MP_SLICER_ERROR",
    message: `An unexpected error occurred during ${context}.`,
    httpStatus: 500,
    category: "unknown",
    hint: null,
  };
}

/**
 * Helper: Given a raw Error from a slicer spawn, and the run result (if available),
 * produce a classified error suitable for API response.
 *
 * @param {Error} err - The caught error
 * @param {Object} [run] - The slicer run result (exitCode, stderr, stdout)
 * @param {string} [context] - Operation context
 * @returns {ClassifiedError}
 */
export function classifyFromCatch(err, run = null, context = "slice") {
  return classifySlicerError({
    error: err,
    stderr: run?.stderr || "",
    exitCode: run?.exitCode ?? null,
    context,
  });
}
