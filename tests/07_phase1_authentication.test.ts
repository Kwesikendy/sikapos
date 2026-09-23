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
}): Promise<{ status: number; json: any; headers: http.IncomingHttpHeaders }> {
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
          resolve({ status: res.statusCode || 0, json: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 0, json: { raw: data }, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (reqData) req.write(reqData);
    req.end();
  });
}

const runId = Date.now();
const testEmail = `owner_${runId}@fashion.gh`;
let testTenantId = '';

// ============================================================================
// 1. AUTHENTICATION LIFECYCLE (Tests 1 - 15)
// ============================================================================

test('Phase 1 - Test 1: Signup identity creation', () => {
  const { tenant } = tenantService.createTenant({
    legalName: `Test Identity ${runId} Ltd`,
    businessName: `Identity Mart ${runId}`,
    tradeCategory: 'general_retail',
    primaryBranch: {
      name: 'Primary Branch',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-111-2222',
      physicalAddress: 'Spintex Road, Accra',
      phone: '0241000001'
    }
  });

  const owner = authService.registerOwner({
    tenantId: tenant.id,
    fullName: 'Identity Owner',
    email: `identity_${runId}@testmart.gh`,
    phoneNumber: '0241000001',
    password: 'SecurePass2025#'
  });

  assert.ok(owner.id);
  assert.strictEqual(owner.email, `identity_${runId}@testmart.gh`);
  assert.strictEqual(owner.full_name, 'Identity Owner');
  assert.strictEqual(owner.phone_verified, true);
  assert.ok(owner.roles.includes('Owner'));
});

test('Phase 1 - Test 2: OTP request', async () => {
  const customOtpService = new OtpService(db, undefined, 60);
  const result = await customOtpService.requestOtp(`024${Math.floor(1000000 + Math.random()*8999999)}`, 'merchant_signup');

  assert.strictEqual(result.success, true);
  assert.ok(result.expiresAt);
  assert.ok(result.debugCode); // Present in test sandbox mode
});

test('Phase 1 - Test 3: OTP resend cooldown (60 seconds)', async () => {
  const customOtpService = new OtpService(db, undefined, 60);
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;

  // First request succeeds
  await customOtpService.requestOtp(phone, 'merchant_signup');

  // Immediate second request within 60s must fail with cooldown error
  let caughtError: any = null;
  try {
    await customOtpService.requestOtp(phone, 'merchant_signup');
  } catch (err: any) {
    caughtError = err;
  }

  assert.ok(caughtError, 'Expected resend cooldown error');
  assert.strictEqual(caughtError.code, 'RESEND_COOLDOWN');
  assert.ok(caughtError.remainingSeconds > 0 && caughtError.remainingSeconds <= 60);
});

test('Phase 1 - Test 4: OTP successful verification', async () => {
  const customOtpService = new OtpService(db, undefined, 0); // 0s cooldown for immediate test
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;
  const req = await customOtpService.requestOtp(phone, 'merchant_signup');

  const verify = customOtpService.verifyOtp(phone, req.debugCode!, 'merchant_signup');
  assert.strictEqual(verify.valid, true);
});

test('Phase 1 - Test 5: OTP incorrect code', async () => {
  const customOtpService = new OtpService(db, undefined, 0);
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;
  await customOtpService.requestOtp(phone, 'merchant_signup');

  const verify = customOtpService.verifyOtp(phone, '000000', 'merchant_signup');
  assert.strictEqual(verify.valid, false);
  assert.strictEqual(verify.code, 'INCORRECT_CODE');
  assert.strictEqual(verify.remainingAttempts, 2);
});

test('Phase 1 - Test 6: OTP expired code', async () => {
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;
  const customOtpService = new OtpService(db, undefined, 0);
  await customOtpService.requestOtp(phone, 'merchant_signup');

  // Manually expire the code in the database
  const past = new Date(Date.now() - 60000).toISOString();
  db.prepare(`UPDATE otp_verifications SET expires_at = ? WHERE recipient = ?`).run(past, phone);

  const verify = customOtpService.verifyOtp(phone, '123456', 'merchant_signup');
  assert.strictEqual(verify.valid, false);
  assert.strictEqual(verify.code, 'EXPIRED_CODE');
});

test('Phase 1 - Test 7: OTP exhausted attempts (max 3)', async () => {
  const customOtpService = new OtpService(db, undefined, 0);
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;
  await customOtpService.requestOtp(phone, 'merchant_signup');

  // Attempt 1
  customOtpService.verifyOtp(phone, '111111', 'merchant_signup');
  // Attempt 2
  customOtpService.verifyOtp(phone, '222222', 'merchant_signup');
  // Attempt 3
  const third = customOtpService.verifyOtp(phone, '333333', 'merchant_signup');
  assert.strictEqual(third.valid, false);
  assert.strictEqual(third.code, 'MAX_ATTEMPTS_EXCEEDED');

  // Attempt 4 should immediately report max attempts exceeded
  const fourth = customOtpService.verifyOtp(phone, '444444', 'merchant_signup');
  assert.strictEqual(fourth.valid, false);
  assert.strictEqual(fourth.code, 'MAX_ATTEMPTS_EXCEEDED');
});

test('Phase 1 - Test 8: OTP replay prevention (single use)', async () => {
  const customOtpService = new OtpService(db, undefined, 0);
  const phone = `024${Math.floor(1000000 + Math.random()*8999999)}`;
  const req = await customOtpService.requestOtp(phone, 'merchant_signup');

  // First verification succeeds
  const first = customOtpService.verifyOtp(phone, req.debugCode!, 'merchant_signup');
  assert.strictEqual(first.valid, true);

  // Second verification with the exact same code must be rejected (single-use)
  const replay = customOtpService.verifyOtp(phone, req.debugCode!, 'merchant_signup');
  assert.strictEqual(replay.valid, false);
  assert.strictEqual(replay.code, 'ALREADY_USED');
});

test('Phase 1 - Test 9: Password registration', () => {
  const { tenant } = tenantService.createTenant({
    legalName: `Pass Test ${runId} Ltd`,
    businessName: `Pass Retail ${runId}`,
    tradeCategory: 'fashion',
    primaryBranch: {
      name: 'Osu Branch',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-222-3333',
      physicalAddress: 'Cantonments, Accra',
      phone: '0241000009'
    }
  });
  testTenantId = tenant.id;

  const user = authService.registerOwner({
    tenantId: tenant.id,
    fullName: 'Pass Merchant',
    email: testEmail,
    phoneNumber: '0241000009',
    password: 'OsuPass2025#'
  });

  assert.ok(user.id);
  assert.strictEqual(user.email, testEmail);
});

test('Phase 1 - Test 10: Successful password login', () => {
  const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);
  assert.ok(loginRes.token);
  assert.strictEqual(loginRes.user.email, testEmail);
  assert.strictEqual(loginRes.tenantId, testTenantId);
});

test('Phase 1 - Test 11: Invalid password rejection', () => {
  assert.throws(() => {
    authService.loginWithPassword(testEmail, 'WrongPassword123#', testTenantId);
  }, /Invalid email or password/);
});

test('Phase 1 - Test 12: Logout', () => {
  const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);
  assert.ok(loginRes.token);

  // Token is valid before logout
  const sessionBefore = authService.validateSession(loginRes.token);
  assert.ok(sessionBefore);

  // Logout
  authService.logout(loginRes.token);

  // Token is invalid after logout
  const sessionAfter = authService.validateSession(loginRes.token);
  assert.strictEqual(sessionAfter, null);
});

test('Phase 1 - Test 13: Session reuse after logout rejected', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);
    const token = loginRes.token;

    // Request succeeds with valid token
    const req1 = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(req1.status, 200);

    // Logout
    const logoutRes = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/logout',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(logoutRes.status, 200);

    // Reuse of the same session must now return 401
    const req2 = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(req2.status, 401);
    assert.strictEqual(req2.json.error.code, 'INVALID_TOKEN');
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 14: Expired session rejected', () => {
  const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);
  const tokenHash = authService.hashToken(loginRes.token);

  // Artificially expire the session
  const past = new Date(Date.now() - 3600000).toISOString();
  db.prepare('UPDATE auth_sessions SET expires_at = ? WHERE token_hash = ?').run(past, tokenHash);

  const session = authService.validateSession(loginRes.token);
  assert.strictEqual(session, null);
});

test('Phase 1 - Test 15: Invalid session rejected', () => {
  const session = authService.validateSession('completely_fabricated_token_99999');
  assert.strictEqual(session, null);
});

// ============================================================================
// 2. MULTI-TENANCY & DISAMBIGUATION (Tests 16 - 20)
// ============================================================================

const sharedEmail = `shared_${runId}@ghanamart.com`;
let multiTenantAId = '';
let multiTenantBId = '';

test('Phase 1 - Test 16: Same email in Tenant A and Tenant B', () => {
  const { tenant: tenantA } = tenantService.createTenant({
    legalName: `Tenant Alpha ${runId} Stores Ltd`,
    businessName: `Alpha Supermarket ${runId}`,
    tradeCategory: 'provision_supermarket',
    primaryBranch: {
      name: 'East Legon Branch',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-333-4444',
      physicalAddress: 'Boundary Road, East Legon',
      phone: '0241000016'
    }
  });
  multiTenantAId = tenantA.id;

  const { tenant: tenantB } = tenantService.createTenant({
    legalName: `Tenant Beta ${runId} Pharmacy Ltd`,
    businessName: `Beta Chemist ${runId}`,
    tradeCategory: 'pharmacy',
    primaryBranch: {
      name: 'Adum Branch',
      region: 'Ashanti',
      gpsDigitalAddress: 'AK-444-5555',
      physicalAddress: 'Adum Central, Kumasi',
      phone: '0241000017'
    }
  });
  multiTenantBId = tenantB.id;

  const userA = authService.registerOwner({
    tenantId: tenantA.id,
    fullName: 'Shared Owner A',
    email: sharedEmail,
    phoneNumber: '0241000016',
    password: 'AlphaPassword1#'
  });

  const userB = authService.registerOwner({
    tenantId: tenantB.id,
    fullName: 'Shared Owner B',
    email: sharedEmail,
    phoneNumber: '0241000017',
    password: 'BetaPassword2#'
  });

  assert.strictEqual(userA.email, userB.email);
  assert.notStrictEqual(userA.tenant_id, userB.tenant_id);
});

test('Phase 1 - Test 17: Tenant A authentication resolves to Tenant A', () => {
  const loginA = authService.loginWithPassword(sharedEmail, 'AlphaPassword1#', multiTenantAId);
  assert.strictEqual(loginA.tenantId, multiTenantAId);
  assert.strictEqual(loginA.user.tenant_id, multiTenantAId);
  assert.strictEqual(loginA.user.full_name, 'Shared Owner A');
});

test('Phase 1 - Test 18: Tenant B authentication resolves to Tenant B', () => {
  const loginB = authService.loginWithPassword(sharedEmail, 'BetaPassword2#', multiTenantBId);
  assert.strictEqual(loginB.tenantId, multiTenantBId);
  assert.strictEqual(loginB.user.tenant_id, multiTenantBId);
  assert.strictEqual(loginB.user.full_name, 'Shared Owner B');
});

test('Phase 1 - Test 19: Wrong tenant cannot authenticate as another tenant', () => {
  // Tenant B's password submitted with Tenant A's tenantId must fail
  assert.throws(() => {
    authService.loginWithPassword(sharedEmail, 'BetaPassword2#', multiTenantAId);
  }, /Invalid email or password/);

  // When no tenantId is supplied for an email in multiple tenants, MultipleTenantsError is thrown
  let caughtMultiError: any = null;
  try {
    authService.loginWithPassword(sharedEmail, 'AlphaPassword1#');
  } catch (err: any) {
    caughtMultiError = err;
  }
  assert.ok(caughtMultiError);
  assert.strictEqual(caughtMultiError.code, 'MULTIPLE_TENANTS_FOUND');
  assert.strictEqual(caughtMultiError.tenants.length, 2);
});

test('Phase 1 - Test 20: Session tenant context is strictly enforced', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const loginA = authService.loginWithPassword(sharedEmail, 'AlphaPassword1#', multiTenantAId);

    // Tenant A token cannot access with client x-tenant-id attempting to impersonate Tenant B
    const spoofAttempt = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/current',
      headers: {
        Authorization: `Bearer ${loginA.token}`,
        'x-tenant-id': multiTenantBId
      }
    });

    assert.strictEqual(spoofAttempt.status, 403);
    assert.strictEqual(spoofAttempt.json.error.code, 'TENANT_MISMATCH');
  } finally {
    server.close();
  }
});

// ============================================================================
// 3. CASHIER PIN AUTHENTICATION (Tests 21 - 25)
// ============================================================================

let cashierTenantId = '';
let cashierUserId = '';

test('Phase 1 - Test 21: Valid cashier PIN login', () => {
  const { tenant, primaryBranch } = tenantService.createTenant({
    legalName: `Cashier Store ${runId} Ltd`,
    businessName: `Cashier Mart ${runId}`,
    tradeCategory: 'general_retail',
    primaryBranch: {
      name: 'Main Counter',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-555-6666',
      physicalAddress: 'Osu Oxford Street',
      phone: '0241000021'
    }
  });
  cashierTenantId = tenant.id;

  const cashier = authService.registerCashier({
    tenantId: tenant.id,
    branchId: primaryBranch.id,
    fullName: `Abena Cashier ${runId}`,
    phoneNumber: '0241000021',
    pin: '1234'
  });
  cashierUserId = cashier.id;

  const pinLogin = authService.loginWithPin(tenant.id, cashier.id, '1234');
  assert.ok(pinLogin.token);
  assert.strictEqual(pinLogin.user.id, cashier.id);
  assert.strictEqual(pinLogin.tenantId, tenant.id);
  assert.ok(pinLogin.user.roles.includes('Cashier'));
});

test('Phase 1 - Test 22: Invalid cashier PIN rejection', () => {
  assert.throws(() => {
    authService.loginWithPin(cashierTenantId, cashierUserId, '9999');
  }, /Invalid cashier PIN/);
});

test('Phase 1 - Test 23: Cashier session has correct tenant context', () => {
  const loginRes = authService.loginWithPin(cashierTenantId, cashierUserId, '1234');

  const session = authService.validateSession(loginRes.token);
  assert.ok(session);
  assert.strictEqual(session.tenantId, cashierTenantId);
  assert.strictEqual(session.user.id, cashierUserId);
});

test('Phase 1 - Test 24: Cashier cannot access management-only endpoint', async () => {
  const loginRes = authService.loginWithPin(cashierTenantId, cashierUserId, '1234');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // Attempt to access management endpoint (/api/v1/tenants/branches requires settings.manage)
    const mgmtRes = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/tenants/branches',
      headers: { Authorization: `Bearer ${loginRes.token}` },
      body: {
        name: 'Unauthorized Branch',
        region: 'Greater Accra',
        gpsDigitalAddress: 'GA-000-0000',
        physicalAddress: 'Hackers Lane',
        phone: '0240000000'
      }
    });

    assert.strictEqual(mgmtRes.status, 403);
    assert.strictEqual(mgmtRes.json.error.code, 'FORBIDDEN');
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 25: Cashier cannot elevate privileges', async () => {
  const loginRes = authService.loginWithPin(cashierTenantId, cashierUserId, '1234');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // Attempt to access /api/v1/tenants/cashiers (requires employees.manage)
    const res = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/tenants/cashiers',
      headers: { Authorization: `Bearer ${loginRes.token}` },
      body: {
        fullName: 'Elevated Cashier',
        phone: '0240000099',
        branchId: 'some-branch',
        pin: '5678'
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.json.error.code, 'FORBIDDEN');
  } finally {
    server.close();
  }
});

// ============================================================================
// 4. SECURITY & CRYPTOGRAPHIC INTEGRITY (Tests 26 - 30)
// ============================================================================

test('Phase 1 - Test 26: No plaintext passwords stored', () => {
  const users = db.prepare('SELECT password_hash FROM users WHERE password_hash IS NOT NULL').all() as Array<{ password_hash: string }>;
  assert.ok(users.length > 0);

  for (const u of users) {
    // Password hash must be 128 hex chars (scrypt with 64 bytes)
    assert.strictEqual(u.password_hash.length, 128);
    assert.match(u.password_hash, /^[0-9a-f]+$/);
    assert.doesNotMatch(u.password_hash, /Password/i);
    assert.doesNotMatch(u.password_hash, /Secure/i);
  }
});

test('Phase 1 - Test 27: No plaintext OTPs stored', () => {
  const otps = db.prepare('SELECT otp_code_hash FROM otp_verifications').all() as Array<{ otp_code_hash: string }>;
  assert.ok(otps.length > 0);

  for (const o of otps) {
    // OTP code hash must be 64 hex chars (scrypt with 32 bytes)
    assert.strictEqual(o.otp_code_hash.length, 64);
    assert.match(o.otp_code_hash, /^[0-9a-f]+$/);
  }
});

test('Phase 1 - Test 28: No raw session tokens stored where prohibited', () => {
  const sessions = db.prepare('SELECT token_hash FROM auth_sessions').all() as Array<{ token_hash: string }>;
  assert.ok(sessions.length > 0);

  for (const s of sessions) {
    // Session token must be sha256 hash (64 hex characters)
    assert.strictEqual(s.token_hash.length, 64);
    assert.match(s.token_hash, /^[0-9a-f]+$/);
  }
});

test('Phase 1 - Test 29: Client tenant ID cannot override session tenant', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);

    // Attempt to pass forged tenant ID in header
    const res = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: {
        Authorization: `Bearer ${loginRes.token}`,
        'x-tenant-id': 'hacked_tenant_id_99999'
      }
    });

    // Tenant in response must match authenticated user's actual tenant, NOT the spoofed header
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.data.user.tenant_id, loginRes.tenantId);
    assert.notStrictEqual(res.json.data.user.tenant_id, 'hacked_tenant_id_99999');
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 30: Authentication errors do not expose sensitive internals', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const res = await httpRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: `nonexistent_${Date.now()}@ghanamart.com`, password: 'SomePassword123#' }
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.json.error.code, 'INVALID_CREDENTIALS');
    assert.strictEqual(res.json.error.message, 'Invalid email or password');
    assert.strictEqual(res.json.error.stack, undefined);
    assert.strictEqual(res.json.error.sql, undefined);
  } finally {
    server.close();
  }
});

// ============================================================================
// 5. STAGE 2 UI & ROUTE PRESERVATION (Tests 31 - 34)
// ============================================================================

test('Phase 1 - Test 31: Stage 2 signup route still loads', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const res = await httpRequest(server, { method: 'GET', path: '/merchant-signup' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.json.raw.includes('SikaPOS'));
    assert.ok(res.json.raw.includes('Akoma Commerce Cloud'));
    assert.ok(res.json.raw.includes('Create Account'));
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 32: Stage 2 cashier login route still loads', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const res = await httpRequest(server, { method: 'GET', path: '/cashier-login' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.json.raw.includes('Terminal #ACC-04'));
    assert.ok(res.json.raw.includes('SikaPOS Core'));
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 33: Authentication states work', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 1. Unauthenticated -> 401
    const unauth = await httpRequest(server, { method: 'GET', path: '/api/v1/auth/me' });
    assert.strictEqual(unauth.status, 401);

    // 2. Authenticated -> 200
    const loginRes = authService.loginWithPassword(testEmail, 'OsuPass2025#', testTenantId);
    const auth = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${loginRes.token}` }
    });
    assert.strictEqual(auth.status, 200);
    assert.strictEqual(auth.json.data.user.email, testEmail);

    // 3. Logged out -> 401
    authService.logout(loginRes.token);
    const afterLogout = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${loginRes.token}` }
    });
    assert.strictEqual(afterLogout.status, 401);
  } finally {
    server.close();
  }
});

test('Phase 1 - Test 34: Existing Stage 2 visual design remains intact', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const signupHtml = await httpRequest(server, { method: 'GET', path: '/merchant-signup' });
    // Check design tokens & elements
    assert.ok(signupHtml.json.raw.includes('#004328'), 'Primary emerald color preserved');
    assert.ok(signupHtml.json.raw.includes('#904d00') || signupHtml.json.raw.includes('#d97706') || signupHtml.json.raw.includes('secondary'), 'Secondary amber accent preserved');
    assert.ok(signupHtml.json.raw.includes('Plus Jakarta Sans'), 'Typography token preserved');
    assert.ok(signupHtml.json.raw.includes('carrier-pill'), 'Carrier pill preserved');

    const cashierHtml = await httpRequest(server, { method: 'GET', path: '/cashier-login' });
    assert.ok(cashierHtml.json.raw.includes('pin-dot'), 'PIN dots preserved');
    assert.ok(cashierHtml.json.raw.includes('cashier-chip'), 'Cashier chips preserved');
  } finally {
    server.close();
  }
});
