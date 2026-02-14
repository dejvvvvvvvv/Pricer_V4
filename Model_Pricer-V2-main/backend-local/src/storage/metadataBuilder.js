/**
 * Build order metadata files (order-meta.json, file-manifest.json, pricing-snapshot.json)
 * for persisting alongside stored order files.
 */

/**
 * Build order-meta.json content.
 * @param {object} orderData - Full order data from frontend
 * @returns {object} Order metadata object
 */
export function buildOrderMeta(orderData) {
  return {
    version: 1,
    orderNumber: orderData.id || orderData.orderNumber || null,
    orderFolderId: orderData.orderFolderId || null,
    createdAt: orderData.created_at || new Date().toISOString(),
    customer: orderData.customer_snapshot || null,
    shippingAddress: orderData.shipping_address || null,
    status: orderData.status || "NEW",
    modelCount: (orderData.models || []).length,
    notes: orderData.notes || [],
    flags: orderData.flags || [],
  };
}

/**
 * Build file-manifest.json content from saved files.
 * @param {Array<{type: string, filename: string, sha256: string, sizeBytes: number}>} files
 * @returns {object} File manifest object
 */
export function buildFileManifest(files) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    totalSizeBytes: files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0),
    files,
  };
}

/**
 * Build pricing-snapshot.json content.
 * @param {object} orderData - Order data with totals
 * @returns {object} Pricing snapshot
 */
export function buildPricingSnapshot(orderData) {
  return {
    version: 1,
    snapshotAt: new Date().toISOString(),
    totals: orderData.totals_snapshot || null,
    models: (orderData.models || []).map((m) => ({
      id: m.id,
      filename: m.file_snapshot?.filename || null,
      quantity: m.quantity || 1,
      material: m.material_snapshot?.name || null,
      priceBreakdown: m.price_breakdown_snapshot || null,
      slicerData: m.slicer_snapshot || null,
    })),
  };
}
