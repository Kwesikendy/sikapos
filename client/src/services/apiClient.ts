import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';

// Storage key used across the application
export const AUTH_TOKEN_KEY = 'sikapos_token';

// In-memory token cache
let inMemoryToken: string | null = null;

/**
 * Retrieve the current authentication token from memory or browser storage.
 */
export function getAuthToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (sessionToken) {
      inMemoryToken = sessionToken;
      return sessionToken;
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const localToken =
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.localStorage.getItem('token');
    if (localToken) {
      inMemoryToken = localToken;
      return localToken;
    }
  }
  return null;
}

/**
 * Set or clear the authentication token across memory, storage, and default headers.
 */
export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      if (window.localStorage) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem('token');
      }
    }
  }

  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

/**
 * Clear authentication token and state.
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * Standardized API error structure for centralized handling.
 */
export interface ApiClientErrorDetails {
  status: number;
  code: string;
  message: string;
  remainingCooldownSeconds?: number;
  tenants?: Array<{ id: string; businessName: string; legalName: string }>;
  details?: unknown;
  raw?: unknown;
}

/**
 * Custom Error class that preserves HTTP status, business error code, and error details.
 */
export class ApiServiceError extends Error implements ApiClientErrorDetails {
  public status: number;
  public code: string;
  public remainingCooldownSeconds?: number;
  public tenants?: Array<{ id: string; businessName: string; legalName: string }>;
  public details?: unknown;
  public raw?: unknown;

  constructor(payload: ApiClientErrorDetails) {
    super(payload.message);
    this.name = 'ApiServiceError';
    this.status = payload.status;
    this.code = payload.code;
    this.remainingCooldownSeconds = payload.remainingCooldownSeconds;
    this.tenants = payload.tenants;
    this.details = payload.details;
    this.raw = payload.raw;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiServiceError.prototype);
  }
}

/**
 * Configured Axios instance with base URL '/api/v1'
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Initialize default Authorization header if token is already present
const initialToken = getAuthToken();
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

/**
 * Request Interceptor:
 * Injects authentication header if an active token is stored and not already specified.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers['Authorization'] && !config.headers.has?.('Authorization')) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Centralized error handler that extracts server errors, normalizes status/code/message,
 * cleans up expired credentials on 401 Unauthorized, and maps network failures.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{
        error?: {
          code?: string;
          message?: string;
          remainingCooldownSeconds?: number;
          tenants?: Array<{ id: string; businessName: string; legalName: string }>;
          details?: unknown;
        };
        message?: string;
      }>;

      // Server responded with an HTTP status code outside of 2xx range
      if (axiosErr.response) {
        const status = axiosErr.response.status;
        const responseData = axiosErr.response.data;
        const serverError = responseData?.error;

        let code = serverError?.code;
        if (!code) {
          switch (status) {
            case 400:
              code = 'BAD_REQUEST';
              break;
            case 401:
              code = 'UNAUTHORIZED';
              break;
            case 403:
              code = 'FORBIDDEN';
              break;
            case 404:
              code = 'NOT_FOUND';
              break;
            case 409:
              code = 'CONFLICT';
              break;
            case 422:
              code = 'VALIDATION_FAILED';
              break;
            case 429:
              code = 'RATE_LIMITED';
              break;
            case 500:
              code = 'INTERNAL_SERVER_ERROR';
              break;
            default:
              code = 'REQUEST_FAILED';
          }
        }

        const message =
          serverError?.message ||
          responseData?.message ||
          axiosErr.message ||
          'An unexpected error occurred.';

        // Handle expired or invalid session token on 401
        if (status === 401) {
          clearAuthToken();
        }

        const normalizedError = new ApiServiceError({
          status,
          code,
          message,
          remainingCooldownSeconds: serverError?.remainingCooldownSeconds,
          tenants: serverError?.tenants,
          details: serverError?.details,
          raw: responseData,
        });

        return Promise.reject(normalizedError);
      }

      // Request was made but no response was received (Network error or timeout)
      if (axiosErr.request) {
        const isTimeout =
          axiosErr.code === 'ECONNABORTED' ||
          axiosErr.message?.toLowerCase().includes('timeout');

        const normalizedError = new ApiServiceError({
          status: 0,
          code: isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          message: isTimeout
            ? 'Request timed out. Please verify your connection and try again.'
            : 'Could not connect to server. Please check your internet connection.',
          raw: axiosErr,
        });

        return Promise.reject(normalizedError);
      }
    }

    // Generic unhandled error
    const genericError = new ApiServiceError({
      status: 0,
      code: 'UNEXPECTED_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected application error occurred.',
      raw: error,
    });

    return Promise.reject(genericError);
  }
);

export default apiClient;
