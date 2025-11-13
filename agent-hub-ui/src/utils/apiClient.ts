/**
 * Centralized API Client
 * Handles authentication and common request configuration
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || 'agenthub2024';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetch wrapper that automatically includes authentication
 */
export const apiClient = async (
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> => {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add demo password for authentication unless explicitly skipped
  if (!skipAuth) {
    requestHeaders['x-demo-password'] = DEMO_PASSWORD;
  }

  return fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),

  patch: (endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export default api;
