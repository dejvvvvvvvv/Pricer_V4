// src/services/webhookApi.js
// API client for webhook management (backend-local).
// Uses apiClient (axios) with automatic tenant-id and auth headers.

import apiClient from '@/lib/apiClient';

/**
 * List all registered webhooks for the current tenant.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function getWebhooks() {
  const res = await apiClient.get('/webhooks');
  return res.data;
}

/**
 * Register a new webhook endpoint.
 * @param {{ url: string, events: string[], secret: string }} config
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function createWebhook(config) {
  const res = await apiClient.post('/webhooks', config);
  return res.data;
}

/**
 * Delete a webhook by ID.
 * @param {string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function deleteWebhook(id) {
  const res = await apiClient.delete(`/webhooks/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Send a test event to a webhook endpoint.
 * @param {string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function testWebhook(id) {
  const res = await apiClient.post(`/webhooks/${encodeURIComponent(id)}/test`);
  return res.data;
}
