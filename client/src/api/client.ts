import { ApiError } from '../types/auth.types';

const API_BASE = '/api/v1';

class HttpClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? sessionStorage.getItem('sikapos_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('sikapos_token', token);
      } else {
        sessionStorage.removeItem('sikapos_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorData = json?.error || {};
        const error: ApiError = {
          status: response.status,
          code: errorData.code || 'REQUEST_FAILED',
          message: errorData.message || response.statusText || 'An unexpected error occurred.',
          remainingCooldownSeconds: errorData.remainingCooldownSeconds,
          tenants: errorData.tenants,
        };
        throw error;
      }

      return json.data as T;
    } catch (err: unknown) {
      if ((err as ApiError).code) {
        throw err;
      }
      throw {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Could not connect to the server. Please check your internet connection.',
      } as ApiError;
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new HttpClient();
