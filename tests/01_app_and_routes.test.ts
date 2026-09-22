import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../src/app.ts';
import { initializeDatabase } from '../src/db/init.ts';

// Test database setup
initializeDatabase();
const app = createApp();

function makeRequest(server: http.Server, path: string): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      return reject(new Error('Server not listening'));
    }

    http.get(`http://127.0.0.1:${addr.port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

test('Verification 1: Application starts and health endpoint responds', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    const res = await makeRequest(server, '/api/v1/health');
    assert.strictEqual(res.status, 200);

    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'healthy');
    assert.strictEqual(json.data.database, 'connected');
  } finally {
    server.close();
  }
});

test('Verification 2 & 12: Existing Stage 2 routes and UI assets are preserved and responsive', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  try {
    // 1. Root index navigator
    const rootRes = await makeRequest(server, '/');
    assert.strictEqual(rootRes.status, 200);
    assert.ok(rootRes.body.includes('SikaPOS'));
    assert.ok(rootRes.body.includes('Merchant Signup'));

    // 2. Merchant Signup & Welcome
    const signupRes = await makeRequest(server, '/merchant-signup');
    assert.strictEqual(signupRes.status, 200);
    assert.ok(signupRes.body.includes('SikaPOS'));
    assert.ok(signupRes.body.includes('Built for modern Ghanaian traders'));

    // 3. Business & Store Setup Wizard
    const wizardRes = await makeRequest(server, '/store-setup');
    assert.strictEqual(wizardRes.status, 200);
    assert.ok(wizardRes.body.includes('Store Setup'));
    assert.ok(wizardRes.body.includes('GhanaPost GPS') || wizardRes.body.includes('GhanaPost'));

    // 4. Cashier PIN & Launch Readiness
    const readinessRes = await makeRequest(server, '/launch-readiness');
    assert.strictEqual(readinessRes.status, 200);
    assert.ok(readinessRes.body.includes('Ready for Business'));

    // 5. Cashier PIN Login & OTP Verification
    const loginRes = await makeRequest(server, '/cashier-login');
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.includes('Merchant Terminal OS'));
  } finally {
    server.close();
  }
});
