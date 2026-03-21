import axios from 'axios';
import { getTenantId } from '@/utils/adminTenantStorage';
import { emitNetworkError } from '@/lib/networkEvents';

// In production, VITE_API_BASE_URL points to the Cloud Run backend service.
// In development, Vite proxy handles /api -> localhost:3001, so base is just '/api'.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
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

// Response interceptor — on 401 refresh token and retry once,
// then transform common error statuses into structured errors.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // --- 401: try silent token refresh first ---
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
          // Refresh failed — fall through to structured error below
        }
      }
    }

    // --- Network error (no response from server) ---
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED';
      const networkError = new Error(
        isTimeout
          ? 'Server neodpovídá. Zkuste to znovu.'
          : 'Server není dostupný. Zkontrolujte připojení k internetu.'
      );
      networkError.code = 'NETWORK_ERROR';
      networkError.isNetworkError = true;
      networkError.originalError = error;

      emitNetworkError({
        message: networkError.message,
      });

      return Promise.reject(networkError);
    }

    // --- 401 Unauthorized (after failed refresh) ---
    if (error.response.status === 401) {
      const authError = new Error('Platnost přihlášení vypršela. Přihlaste se znovu.');
      authError.code = 'AUTH_EXPIRED';
      authError.isAuthError = true;
      authError.status = 401;
      authError.originalError = error;
      return Promise.reject(authError);
    }

    // --- 403 Forbidden ---
    if (error.response.status === 403) {
      const forbidError = new Error('K této akci nemáte oprávnění.');
      forbidError.code = 'FORBIDDEN';
      forbidError.status = 403;
      forbidError.originalError = error;
      return Promise.reject(forbidError);
    }

    // --- 429 Rate Limited ---
    if (error.response.status === 429) {
      const rateError = new Error('Příliš mnoho požadavků. Zkuste to za chvíli.');
      rateError.code = 'RATE_LIMITED';
      rateError.status = 429;
      rateError.originalError = error;
      return Promise.reject(rateError);
    }

    // --- 500+ Server Error ---
    if (error.response.status >= 500) {
      const serverError = new Error('Chyba serveru. Zkuste to znovu později.');
      serverError.code = 'SERVER_ERROR';
      serverError.status = error.response.status;
      serverError.originalError = error;
      return Promise.reject(serverError);
    }

    // --- Other errors: pass through unchanged ---
    return Promise.reject(error);
  }
);

/**
 * Check if the backend API is reachable.
 * Uses the /api/health endpoint with a 5 s timeout.
 * @returns {Promise<boolean>}
 */
export async function isApiReachable() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default apiClient;
