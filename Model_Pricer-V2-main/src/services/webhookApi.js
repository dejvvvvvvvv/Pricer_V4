// src/services/webhookApi.js
// API client for webhook management (backend-local).
// Uses apiClient (axios) with automatic tenant-id and auth headers.

import apiClient from '@/lib/apiClient';

/**
 * List all registered webhooks for the current tenant.
 * @returns {Promise<Object>}
 */
export async function getWebhooks() {
  const res = await apiClient.get('/webhooks');
  return res.data;
}

/**
 * Register a new webhook endpoint.
 * @param {{ url: string, events: string[], secret?: string }} config
 * @returns {Promise<Object>}
 */
export async function createWebhook(config) {
  const res = await apiClient.post('/webhooks', config);
  return res.data;
}

/**
 * Update an existing webhook.
 * @param {string} id
 * @param {{ url?: string, events?: string[], active?: boolean, secret?: string }} updates
 * @returns {Promise<Object>}
 */
export async function updateWebhook(id, updates) {
  const res = await apiClient.patch(`/webhooks/${encodeURIComponent(id)}`, updates);
  return res.data;
}

/**
 * Delete a webhook by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function deleteWebhook(id) {
  const res = await apiClient.delete(`/webhooks/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Send a test event to a webhook endpoint.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function testWebhook(id) {
  const res = await apiClient.post(`/webhooks/${encodeURIComponent(id)}/test`);
  return res.data;
}

/**
 * Get delivery log for a webhook.
 * @param {string} id
 * @param {{ limit?: number, offset?: number }} [params]
 * @returns {Promise<Object>}
 */
export async function getWebhookDeliveries(id, params = {}) {
  const res = await apiClient.get(`/webhooks/${encodeURIComponent(id)}/deliveries`, { params });
  return res.data;
}

/**
 * Retry a failed webhook delivery.
 * @param {string} webhookId
 * @param {string} deliveryId
 * @returns {Promise<Object>}
 */
export async function retryDelivery(webhookId, deliveryId) {
  const res = await apiClient.post(
    `/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`
  );
  return res.data;
}

/**
 * Regenerate the signing secret for a webhook.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function regenerateSecret(id) {
  const res = await apiClient.post(`/webhooks/${encodeURIComponent(id)}/regenerate-secret`);
  return res.data;
}
