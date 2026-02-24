import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(async (config) => {
  if (window.__authGetToken) {
    try {
      const token = await window.__authGetToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token fetch failed — continue without auth
    }
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
            return apiClient(error.config);
          }
        } catch {
          // Refresh failed — let error propagate
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
