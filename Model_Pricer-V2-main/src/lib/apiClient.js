import axios from 'axios';
import { getTenantId } from '@/utils/adminTenantStorage';
import { emitNetworkError } from '@/lib/networkEvents';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor — attach auth token OR tenant ID header (never both)
// Authenticated requests: tenant is derived from JWT on the backend — no header needed.
// Unauthenticated/public requests: send tenant via x-tenant-id header.
apiClient.interceptors.request.use(async (config) => {
  let token = null;

  if (typeof window.__authGetToken === 'function') {
    try {
      token = await window.__authGetToken();
    } catch {
      // Token fetch failed — fall through to unauthenticated path
    }
  }

  if (token) {
    // Authenticated request — backend reads tenant from JWT
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Unauthenticated/public request — send tenant via header
    config.headers['x-tenant-id'] = getTenantId();
  }

  return config;
});

// Response interceptor — on 401 refresh token and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      if (window.__authRefreshToken) {
        try {
          const newToken = await window.__authRefreshToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            // Remove x-tenant-id if present — authenticated retries use JWT for tenant
            delete error.config.headers['x-tenant-id'];
            return apiClient(error.config);
          }
        } catch {
          // Refresh failed — let error propagate
        }
      }
    }
    // Network error (no response from server) — notify user
    if (!error.response) {
      emitNetworkError({
        message: error.code === 'ECONNABORTED'
          ? 'Request timed out. Please try again.'
          : 'Network error. Please check your connection.',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
