import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/api/types';

/**
 * Axios instance configured for the backend API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Retry configuration for automatic request retries
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second base delay
  maxDelay: 5000, // Max 5 seconds between retries
};

/**
 * Request interceptor to add JWT Bearer token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Log warning if making authenticated request without token
      // (Some endpoints are public and don't require auth)
      if (!config.url?.includes('/dev-auth/') && !config.url?.includes('/health')) {
        console.warn('API request made without authentication token:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and automatic retries
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse | Blob>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

    // Initialize retry count if not present
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Determine if we should retry this request
    const shouldRetry =
      originalRequest._retryCount < RETRY_CONFIG.maxRetries &&
      (!error.response || (error.response.status >= 500 && error.response.status < 600));

    // If should retry, attempt the request again with exponential backoff
    if (shouldRetry) {
      originalRequest._retryCount += 1;

      // Calculate exponential backoff delay with max cap
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, originalRequest._retryCount - 1),
        RETRY_CONFIG.maxDelay
      );

      console.warn(
        `Retrying request (attempt ${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries}) after ${delay}ms:`,
        originalRequest.url
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(originalRequest);
    }

    // Handle 401 Unauthorized - redirect to login (no retry)
    if (error.response?.status === 401) {
      const token = localStorage.getItem('auth_token');

      // Log detailed error for debugging
      console.error('401 Unauthorized error:', {
        url: error.config?.url,
        hasToken: !!token,
        tokenLength: token?.length,
        errorMessage: error.response?.data,
      });

      // Clear token
      localStorage.removeItem('auth_token');

      // Redirect to login (will be handled by auth hook)
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // Handle other errors
    if (error.response?.data) {
      // If response is a Blob (e.g., from blob requests that failed), try to parse as JSON
      if (error.response.data instanceof Blob) {
        try {
          // Clone the blob before reading (blobs can only be read once)
          const clonedBlob = error.response.data.slice();
          const text = await clonedBlob.text();
          const jsonError = JSON.parse(text) as ApiErrorResponse;
          console.error('API Error:', jsonError);
          // Replace the original blob with the parsed error for easier access
          (error.response as any).data = jsonError;
        } catch {
          // If parsing fails, it's not JSON - log the blob info
          console.error('API Error: Blob response', {
            size: error.response.data.size,
            type: error.response.data.type,
            status: error.response.status,
          });
        }
      } else {
        // Regular JSON error response
        const apiError = error.response.data as ApiErrorResponse;
        console.error('API Error:', apiError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to handle API errors
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse;
    if (apiError?.message) {
      return Array.isArray(apiError.message)
        ? apiError.message.join(', ')
        : apiError.message;
    }
    return error.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}

export default apiClient;
