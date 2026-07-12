// =============================================================================
// API Configuration — Axios Instance
// =============================================================================
// Centralized Axios instance pre-configured with the API Gateway base URL.
// All REST API calls throughout the app should use this instance to ensure
// consistent headers, interceptors, and error handling.
//
// USAGE:
//   import api from '../config/api';
//   const response = await api.get('/orders');
// =============================================================================

import axios from 'axios';

/**
 * Pre-configured Axios instance pointing to the API Gateway.
 *
 * The base URL is read from environment variables (set in .env).
 * Vite replaces `import.meta.env.VITE_*` at build time.
 */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_GATEWAY_URL}/api/v1`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Response Interceptor — Centralized Error Handling
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging (will be replaced with toast notifications)
    console.error('[API Error]', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
