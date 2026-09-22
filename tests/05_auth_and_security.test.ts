import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../src/app.ts';
import { initializeDatabase } from '../src/db/init.ts';
import { TenantService } from '../src/services/tenant.service.ts';
import { AuthService } from '../src/services/auth.service.ts';
import { OtpService } from '../src/services/otp.service.ts';

const db = initializeDatabase();
const tenantService = new TenantService(db);
const authService = new AuthService(db);
const otpService = new OtpService(db);
const app = createApp();

function httpRequest(server: http.Server, options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') return reject(new Error('Server not ready'));

    const reqData = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request({
      hostname: '127.0.0.1',
      port: addr.port,
      path: options.path,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(reqData ? { 'Content-Length': Buffer.byteLength(reqData) } : {}),
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, json: { raw: data } });
        }
      });
    });

    req.on('error', reject);
    if (reqData) req.write(reqData);
    req.end();
  });
}

test('Verification 9: Unauthorized access is rejected with 401', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 1. Missing Authorization header
    const noToken = await httpRequest(server, { method: 'GET', path: '/api/v1/tenants/current' });
    assert.strictEqual(noToken.status, 401);
    assert.strictEqual(noToken.json.error.code, 'UNAUTHORIZED');

    // 2. Bogus Authorization header
    const badToken = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/current',
      headers: { Authorization: 'Bearer invalid_token_12345' }
    });
    assert.strictEqual(badToken.status, 401);
    assert.strictEqual(badToken.json.error.code, 'INVALID_TOKEN');
  } finally {
    server.close();
  }
});

test('Verification 10: Invalid input is strictly rejected with 400', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 1. Invalid phone number format
    const badPhone = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/signup-otp/request',
      body: { phoneNumber: 'not-a-phone-number' }
    });
    assert.strictEqual(badPhone.status, 400);
    assert.strictEqual(badPhone.json.error.code, 'VALIDATION_ERROR');

    // 2. Invalid cashier PIN (must be exactly 4 digits)
    const badPin = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/login-pin',
      body: {
        tenantId: 'some-tenant',
        cashierId: 'some-cashier',
        pin: '123' // 3 digits only
      }
    });
    assert.strictEqual(badPin.status, 400);
    assert.strictEqual(badPin.json.error.code, 'VALIDATION_ERROR');
  } finally {
    server.close();
  }
});

test('Verification 11: Secrets and password hashes are never exposed', async () => {
  const { tenant } = tenantService.createTenant({
    legalName: 'Security Check Ltd',
    businessName: 'Secure Store',
    tradeCategory: 'pharmacy',
    primaryBranch: {
      name: 'Main',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-500-6000',
      physicalAddress: 'Airport Residential',
      phone: '+233245006000'
    }
  });

  const owner = authService.registerOwner({
    tenantId: tenant.id,
    fullName: 'Secure Owner',
    email: 'sec@securestore.com',
    phoneNumber: '+233245006000',
    password: 'SecurePassword1!'
  });

  // Verify UserSummary shape
  assert.strictEqual((owner as any).password_hash, undefined);
  assert.strictEqual((owner as any).salt, undefined);
  assert.strictEqual((owner as any).pin_hash, undefined);
  assert.strictEqual((owner as any).pin_salt, undefined);
});

test('Decoupled OTP lifecycle: Request, Sandbox delivery, and Verification', async () => {
  const phone = '+233247008000';
  const requestResult = await otpService.requestOtp(phone, 'merchant_signup');

  assert.strictEqual(requestResult.success, true);
  assert.ok(requestResult.expiresAt);
  assert.ok(requestResult.debugCode, 'Sandbox provider provides debugCode for verification');

  // Verify correct code
  const verifyResult = otpService.verifyOtp(phone, requestResult.debugCode!, 'merchant_signup');
  assert.strictEqual(verifyResult.valid, true);

  // Attempting to re-use or verify already verified OTP fails
  const reVerifyResult = otpService.verifyOtp(phone, requestResult.debugCode!, 'merchant_signup');
  assert.strictEqual(reVerifyResult.valid, false);
});
