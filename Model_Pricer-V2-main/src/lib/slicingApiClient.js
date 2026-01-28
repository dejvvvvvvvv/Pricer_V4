// API client for backend slicing (PrusaSlicer on server)
// NOTE: This file intentionally contains NO legacy engine references.
import { API_BASE_URL } from '../config/api';

/**
 * @typedef {Object} SlicingConfig
 * @property {'nozzle_08'|'nozzle_06'|'nozzle_04'|'draft'|'standard'|'fine'|'ultra'} quality
 * @property {number} infill
 * @property {'pla'|'abs'|'petg'|'tpu'|'wood'|'carbon'} material
 * @property {boolean} supports
 */

/**
 * @typedef {Object} SlicingResult
 * @property {number} time Seconds
 * @property {number} material Grams
 * @property {number} [layers]
 * @property {boolean} success
 * @property {string} [message]
 */

function clamp(n, min, max) {
  const v = Number.isFinite(n) ? n : min;
  return Math.min(max, Math.max(min, v));
}

function demoEstimate(file, cfg) {
  const sizeMb = (file?.size || 0) / (1024 * 1024);

  // Rough base: small models still have a minimum print time.
  let timeMin = 30 + sizeMb * 90; // 30 min + 90 min per MB
  let grams = 10 + sizeMb * 35;   // 10 g + 35 g per MB

  // Infill affects both time + material.
  const infill = clamp(cfg?.infill ?? 20, 0, 100);
  const infillFactor = 0.6 + (infill / 100) * 0.9; // 0.6..1.5
  timeMin *= infillFactor;
  grams *= infillFactor;

  // Quality affects time mostly.
  const q = (cfg?.quality || 'standard').toLowerCase();
  const qFactor = (
    q === 'draft' ? 0.75 :
    q === 'fine' ? 1.35 :
    q === 'ultra' ? 1.7 :
    q === 'nozzle_08' ? 0.75 :
    q === 'nozzle_06' ? 0.9 :
    q === 'nozzle_04' ? 1.0 :
    1.0
  );
  timeMin *= qFactor;

  // Supports adds overhead.
  if (cfg?.supports) {
    timeMin *= 1.15;
    grams *= 1.10;
  }

  // Clamp to sane demo limits.
  timeMin = clamp(timeMin, 10, 24 * 60);
  grams = clamp(grams, 1, 5000);

  return {
    success: true,
    time: Math.round(timeMin * 60),
    material: Math.round(grams * 10) / 10,
    layers: Math.max(1, Math.round(timeMin / 2)),
    message: 'DEMO estimate (backend not reachable)',
  };
}

/**
 * Uploads a model file and returns estimated print time + material usage.
 * Backend endpoint: POST {API_BASE_URL}/api/slice
 *
 * In Varianta A (demo), if the backend is not reachable, we return a deterministic
 * local estimate so the UI stays usable for presentations.
 *
 * @param {File} file
 * @param {SlicingConfig} config
 * @returns {Promise<SlicingResult>}
 */
export async function sliceModel(file, config) {
  const formData = new FormData();
  formData.append('model', file);
  formData.append('config', JSON.stringify(config));

  try {
    const response = await fetch(`${API_BASE_URL}/api/slice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // For demo purposes we still fall back, because most local runs won't have the backend.
      // If you want strict behaviour later (Varianta B), change this to throw.
      console.warn('[slicingApiClient] Backend responded with error, using DEMO estimate:', response.status);
      return demoEstimate(file, config);
    }

    /** @type {SlicingResult} */
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('[slicingApiClient] Backend not reachable, using DEMO estimate:', err);
    return demoEstimate(file, config);
  }
}
