import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import {
  apiClient,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  ApiServiceError,
  AUTH_TOKEN_KEY,
} from '../client/src/services/apiClient.ts';

const { AxiosError } = axios;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Axios API Client - 1: Module exists in client/src/services and exports core utilities', () => {
  const filePath = path.join(rootDir, 'client', 'src', 'services', 'apiClient.ts');
  assert.ok(fs.existsSync(filePath), 'client/src/services/apiClient.ts exists');

  assert.ok(apiClient, 'apiClient instance is exported');
  assert.strictEqual(typeof apiClient.get, 'function', 'apiClient has HTTP get method');
  assert.strictEqual(typeof apiClient.post, 'function', 'apiClient has HTTP post method');
  assert.strictEqual(typeof setAuthToken, 'function', 'setAuthToken is exported');
  assert.strictEqual(typeof getAuthToken, 'function', 'getAuthToken is exported');
  assert.strictEqual(typeof clearAuthToken, 'function', 'clearAuthToken is exported');
  assert.strictEqual(typeof ApiServiceError, 'function', 'ApiServiceError class is exported');
});

test('Axios API Client - 2: Configures baseURL to /api/v1 and appropriate default headers', () => {
  assert.strictEqual(apiClient.defaults.baseURL, '/api/v1', 'Base URL is configured to /api/v1');
  assert.strictEqual(
    apiClient.defaults.headers['Content-Type'],
    'application/json',
    'Content-Type is application/json'
  );
  assert.strictEqual(
    apiClient.defaults.headers['Accept'],
    'application/json',
    'Accept is application/json'
  );
});

test('Axios API Client - 3: Request interceptor injects Authorization header when token is set', async () => {
  setAuthToken('test-bearer-jwt-token-12345');
  assert.strictEqual(getAuthToken(), 'test-bearer-jwt-token-12345');

  // Verify request interceptor
  const handlers = (apiClient.interceptors.request as any).handlers;
  assert.ok(handlers.length > 0, 'At least one request interceptor is registered');

  const requestInterceptor = handlers[0].fulfilled;
  const mockConfig: InternalAxiosRequestConfig = {
    headers: new axios.AxiosHeaders(),
  } as any;

  const resolvedConfig = await requestInterceptor(mockConfig);
  assert.strictEqual(
    resolvedConfig.headers.Authorization,
    'Bearer test-bearer-jwt-token-12345',
    'Request interceptor attached Bearer authorization header'
  );

  // Clean up
  clearAuthToken();
  assert.strictEqual(getAuthToken(), null, 'clearAuthToken resets token');
});

test('Axios API Client - 4: Response interceptor handles HTTP error responses and normalizes ApiServiceError', async () => {
  const handlers = (apiClient.interceptors.response as any).handlers;
  assert.ok(handlers.length > 0, 'At least one response interceptor is registered');

  const responseErrorInterceptor = handlers[0].rejected;

  // Simulate a 400 Bad Request error from backend
  const mockAxiosError = new AxiosError(
    'Request failed with status code 400',
    'ERR_BAD_REQUEST',
    {} as any,
    {} as any,
    {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
      data: {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'The password entered is incorrect.',
          remainingCooldownSeconds: 30,
        },
      },
    }
  );

  try {
    await responseErrorInterceptor(mockAxiosError);
    assert.fail('Interceptor should reject the promise on error response');
  } catch (err: any) {
    assert.ok(err instanceof ApiServiceError, 'Error is an instance of ApiServiceError');
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
    assert.strictEqual(err.message, 'The password entered is incorrect.');
    assert.strictEqual(err.remainingCooldownSeconds, 30);
  }
});

test('Axios API Client - 5: Response interceptor clears auth state on 401 Unauthorized', async () => {
  setAuthToken('expired-or-revoked-token');
  assert.strictEqual(getAuthToken(), 'expired-or-revoked-token');

  const handlers = (apiClient.interceptors.response as any).handlers;
  const responseErrorInterceptor = handlers[0].rejected;

  const mock401Error = new AxiosError(
    'Request failed with status code 401',
    'ERR_BAD_REQUEST',
    {} as any,
    {} as any,
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as any,
      data: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session has expired.',
        },
      },
    }
  );

  try {
    await responseErrorInterceptor(mock401Error);
    assert.fail('Should reject on 401');
  } catch (err: any) {
    assert.strictEqual(err.status, 401);
    assert.strictEqual(err.code, 'UNAUTHORIZED');
    assert.strictEqual(getAuthToken(), null, 'Auth token was cleared upon receiving 401');
  }
});

test('Axios API Client - 6: Response interceptor converts network and timeout failures', async () => {
  const handlers = (apiClient.interceptors.response as any).handlers;
  const responseErrorInterceptor = handlers[0].rejected;

  // Simulate network failure (request made, no response received)
  const mockNetworkError = new AxiosError(
    'Network Error',
    'ERR_NETWORK',
    {} as any,
    { readyState: 4 } as any
  );

  try {
    await responseErrorInterceptor(mockNetworkError);
    assert.fail('Should reject network error');
  } catch (err: any) {
    assert.strictEqual(err.status, 0);
    assert.strictEqual(err.code, 'NETWORK_ERROR');
    assert.ok(err.message.includes('internet connection'));
  }

  // Simulate timeout failure
  const mockTimeoutError = new AxiosError(
    'timeout of 15000ms exceeded',
    'ECONNABORTED',
    {} as any,
    { readyState: 4 } as any
  );

  try {
    await responseErrorInterceptor(mockTimeoutError);
    assert.fail('Should reject timeout error');
  } catch (err: any) {
    assert.strictEqual(err.status, 0);
    assert.strictEqual(err.code, 'REQUEST_TIMEOUT');
    assert.ok(err.message.includes('timed out'));
  }
});

test('Axios API Client - 7: Zero emojis and em dashes in services/apiClient.ts', () => {
  const filePath = path.join(rootDir, 'client', 'src', 'services', 'apiClient.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;
  assert.strictEqual(emojiRegex.test(content), false, 'No emojis in apiClient.ts');
  assert.strictEqual(content.includes('—'), false, 'No em dashes in apiClient.ts');
});
