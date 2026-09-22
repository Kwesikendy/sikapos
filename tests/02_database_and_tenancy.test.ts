import test from 'node:test';
import assert from 'node:assert';
import { getDb } from '../src/db/connection.ts';
import { initializeDatabase } from '../src/db/init.ts';
import { TenantService } from '../src/services/tenant.service.ts';
import { AuthService } from '../src/services/auth.service.ts';
import { TaxService } from '../src/services/tax.service.ts';

const db = initializeDatabase();
const tenantService = new TenantService(db);
const authService = new AuthService(db);
const taxService = new TaxService(db);

test('Verification 3: Database connectivity and foreign keys enforced', () => {
  const result = db.prepare('SELECT 1 as test').get() as { test: number };
  assert.strictEqual(result.test, 1);

  const fkPragma = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
  assert.strictEqual(fkPragma.foreign_keys, 1, 'Foreign keys must be enabled');
});

test('Verification 4: Tenant records can be created with legal & trade details', () => {
  const { tenant, primaryBranch } = tenantService.createTenant({
    legalName: 'Kofi & Sons Retail Ent. Ltd.',
    businessName: 'Kofi Supermarket',
    tradeCategory: 'provision_supermarket',
    primaryBranch: {
      name: 'Osu Oxford Street Branch',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-183-4921',
      physicalAddress: 'Oxford Street, Near Danquah Circle',
      phone: '+233244123456'
    }
  });

  assert.ok(tenant.id);
  assert.strictEqual(tenant.legal_name, 'Kofi & Sons Retail Ent. Ltd.');
  assert.strictEqual(tenant.trade_category, 'provision_supermarket');
  assert.strictEqual(tenant.currency_code, 'GHS');
  assert.strictEqual(tenant.status, 'active');

  assert.ok(primaryBranch.id);
  assert.strictEqual(primaryBranch.tenant_id, tenant.id);
  assert.strictEqual(primaryBranch.is_primary, true);
  assert.strictEqual(primaryBranch.gps_digital_address, 'GA-183-4921');
});

test('Verification 5: Branches belong strictly to the correct tenant', () => {
  const { tenant: tenantA } = tenantService.createTenant({
    legalName: 'Tenant A Ltd',
    businessName: 'Store A',
    tradeCategory: 'pharmacy',
    primaryBranch: {
      name: 'Branch A1',
      region: 'Ashanti',
      gpsDigitalAddress: 'AK-039-1234',
      physicalAddress: 'Adum Central',
      phone: '+233201234567'
    }
  });

  const { tenant: tenantB } = tenantService.createTenant({
    legalName: 'Tenant B Ltd',
    businessName: 'Store B',
    tradeCategory: 'electronics',
    primaryBranch: {
      name: 'Branch B1',
      region: 'Western',
      gpsDigitalAddress: 'WS-002-9876',
      physicalAddress: 'Market Circle, Takoradi',
      phone: '+233541112233'
    }
  });

  // Create additional branch for Tenant A
  const branchA2 = tenantService.createBranch(tenantA.id, {
    name: 'Branch A2 (Bantama)',
    region: 'Ashanti',
    gpsDigitalAddress: 'AK-045-8888',
    physicalAddress: 'Bantama High Street',
    phone: '+233209876543'
  });

  const branchesA = tenantService.getBranches(tenantA.id);
  const branchesB = tenantService.getBranches(tenantB.id);

  assert.strictEqual(branchesA.length, 2);
  assert.strictEqual(branchesB.length, 1);

  // Tenant B cannot see Tenant A's branches
  assert.strictEqual(tenantService.getBranchById(tenantB.id, branchA2.id), null);
  assert.strictEqual(tenantService.getBranchById(tenantA.id, branchA2.id)?.name, 'Branch A2 (Bantama)');
});

test('Verification 6: Users belong strictly to the correct tenant and inherit roles', () => {
  const { tenant } = tenantService.createTenant({
    legalName: 'Adom Provisions Ltd',
    businessName: 'Adom Mart',
    tradeCategory: 'provision_supermarket',
    primaryBranch: {
      name: 'Main Mart',
      region: 'Eastern',
      gpsDigitalAddress: 'EN-101-2020',
      physicalAddress: 'Koforidua Market',
      phone: '+233271234567'
    }
  });

  const owner = authService.registerOwner({
    tenantId: tenant.id,
    fullName: 'Kwame Adom',
    email: 'kwame@adommart.com',
    phoneNumber: '+233271234567',
    password: 'Password123'
  });

  assert.strictEqual(owner.tenant_id, tenant.id);
  assert.strictEqual(owner.email, 'kwame@adommart.com');
  assert.ok(owner.roles.includes('Owner'));
  assert.ok(owner.permissions.includes('settings.manage'));
  assert.ok(owner.permissions.includes('sales.create'));
});
