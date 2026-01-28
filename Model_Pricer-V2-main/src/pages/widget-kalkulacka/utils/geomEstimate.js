export function estimateWeightFromVolume({
  modelVolumeMm3,
  layerHeight = 0.2,
  lineWidth = 0.4,
  wallLineCount = 2,
  topLayers = 5,
  bottomLayers = 5,
  infillDensity = 20,
  density_g_cm3 = 1.24
}) {
  // Efektivni plnost = perimetry + top/bottom + infill
  // Jednoduchy model: pridej 10-25 % za perimetry/top/bottom (u malych dilu vic)
  const perimeterFactor = Math.min(0.35, 0.12 + 0.02 * wallLineCount + 0.01 * (topLayers + bottomLayers));
  const effFill = Math.min(1, (infillDensity/100) * 0.9 + perimeterFactor);

  const effectiveVolume = modelVolumeMm3 * effFill; // mm3
  const grams = (effectiveVolume / 1000) * density_g_cm3; // g
  return { effFill, grams };
}
