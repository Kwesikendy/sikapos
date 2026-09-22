import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../src/app.ts';
import { initializeDatabase } from '../src/db/init.ts';
import { TenantService } from '../src/services/tenant.service.ts';
import { AuthService } from '../src/services/auth.service.ts';

const db = initializeDatabase();
const tenantService = new TenantService(db);
const authService = new AuthService(db);
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

test('Verification 8: Server-side tenant isolation guarantees', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 1. Setup Tenant Alpha
    const { tenant: tenantAlpha } = tenantService.createTenant({
      legalName: 'Alpha Enterprises Ltd',
      businessName: 'Alpha Mart',
      tradeCategory: 'provision_supermarket',
      primaryBranch: {
        name: 'Alpha Primary',
        region: 'Greater Accra',
        gpsDigitalAddress: 'GA-111-2222',
        physicalAddress: 'Ridge, Accra',
        phone: '+233241112222'
      }
    });

    const ownerAlpha = authService.registerOwner({
      tenantId: tenantAlpha.id,
      fullName: 'Alpha Boss',
      email: 'boss@alpha.com',
      phoneNumber: '+233241112222',
      password: 'AlphaPassword1!'
    });
    const tokenAlpha = authService.createSession(ownerAlpha.id, tenantAlpha.id);

    // 2. Setup Tenant Beta
    const { tenant: tenantBeta } = tenantService.createTenant({
      legalName: 'Beta Retail Services Ltd',
      businessName: 'Beta Boutique',
      tradeCategory: 'fashion',
      primaryBranch: {
        name: 'Beta Primary',
        region: 'Ashanti',
        gpsDigitalAddress: 'AK-333-4444',
        physicalAddress: 'Kumasi Mall',
        phone: '+233203334444'
      }
    });

    const ownerBeta = authService.registerOwner({
      tenantId: tenantBeta.id,
      fullName: 'Beta Boss',
      email: 'boss@beta.com',
      phoneNumber: '+233203334444',
      password: 'BetaPassword1!'
    });
    const tokenBeta = authService.createSession(ownerBeta.id, tenantBeta.id);

    // 3. User Alpha accesses /api/v1/tenants/current -> gets Alpha, NEVER Beta
    const currentAlpha = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/current',
      headers: { Authorization: `Bearer ${tokenAlpha}` }
    });

    assert.strictEqual(currentAlpha.status, 200);
    assert.strictEqual(currentAlpha.json.data.id, tenantAlpha.id);
    assert.strictEqual(currentAlpha.json.data.business_name, 'Alpha Mart');

    // 4. User Beta accesses /api/v1/tenants/current -> gets Beta
    const currentBeta = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/current',
      headers: { Authorization: `Bearer ${tokenBeta}` }
    });

    assert.strictEqual(currentBeta.status, 200);
    assert.strictEqual(currentBeta.json.data.id, tenantBeta.id);
    assert.strictEqual(currentBeta.json.data.business_name, 'Beta Boutique');

    // 5. Anti-spoofing: User Alpha tries to pass Tenant Beta's ID in header
    const spoofHeaderAttempt = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/current',
      headers: {
        Authorization: `Bearer ${tokenAlpha}`,
        'x-tenant-id': tenantBeta.id
      }
    });

    assert.strictEqual(spoofHeaderAttempt.status, 403);
    assert.strictEqual(spoofHeaderAttempt.json.error.code, 'TENANT_MISMATCH');

    // 6. Anti-spoofing: User Alpha tries to pass Tenant Beta's ID in query parameter
    const spoofQueryAttempt = await httpRequest(server, {
      method: 'GET',
      path: `/api/v1/tenants/current?tenant_id=${tenantBeta.id}`,
      headers: { Authorization: `Bearer ${tokenAlpha}` }
    });

    assert.strictEqual(spoofQueryAttempt.status, 403);
    assert.strictEqual(spoofQueryAttempt.json.error.code, 'TENANT_MISMATCH');

    // 7. Isolation in branch listings
    const alphaBranchesRes = await httpRequest(server, {
      method: 'GET',
      path: '/api/v1/tenants/branches',
      headers: { Authorization: `Bearer ${tokenAlpha}` }
    });

    assert.strictEqual(alphaBranchesRes.status, 200);
    const alphaBranchIds = alphaBranchesRes.json.data.map((b: any) => b.tenant_id);
    assert.ok(alphaBranchIds.every((id: string) => id === tenantAlpha.id));
    assert.ok(!alphaBranchIds.includes(tenantBeta.id));
  } finally {
    server.close();
  }
});
