import test from 'node:test';
import assert from 'node:assert';
import { getDb } from '../src/db/connection.ts';
import { initializeDatabase } from '../src/db/init.ts';
import { TenantService } from '../src/services/tenant.service.ts';
import { AuthService } from '../src/services/auth.service.ts';

const db = initializeDatabase();
const tenantService = new TenantService(db);
const authService = new AuthService(db);

test('Verification 7: Roles and permissions system definitions', () => {
  const roles = db.prepare('SELECT name FROM roles').all() as Array<{ name: string }>;
  const roleNames = roles.map(r => r.name);

  assert.ok(roleNames.includes('Owner'), 'Owner role must exist');
  assert.ok(roleNames.includes('Manager'), 'Manager role must exist');
  assert.ok(roleNames.includes('Cashier'), 'Cashier role must exist');
  assert.ok(roleNames.includes('Inventory Staff'), 'Inventory Staff role must exist');
  assert.ok(roleNames.includes('Platform Admin'), 'Platform Admin role must exist');

  const perms = db.prepare('SELECT code FROM permissions').all() as Array<{ code: string }>;
  const permCodes = perms.map(p => p.code);

  const requiredPerms = [
    'products.view', 'products.create', 'products.update', 'products.delete',
    'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.count',
    'sales.view', 'sales.create', 'sales.refund',
    'customers.view', 'customers.create', 'customers.update',
    'reports.view', 'employees.manage', 'settings.manage', 'subscription.manage'
  ];

  for (const reqPerm of requiredPerms) {
    assert.ok(permCodes.includes(reqPerm), `Permission ${reqPerm} must exist`);
  }
});

test('Verification 7: Cashier vs Owner role permission separation', () => {
  const { tenant, primaryBranch } = tenantService.createTenant({
    legalName: 'Test Roles Mart',
    businessName: 'Roles Mart',
    tradeCategory: 'general_retail',
    primaryBranch: {
      name: 'Central',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-999-0000',
      physicalAddress: 'Central Market',
      phone: '+233240001122'
    }
  });

  const owner = authService.registerOwner({
    tenantId: tenant.id,
    fullName: 'Owner Joe',
    email: 'joe@rolesmart.com',
    phoneNumber: '+233240001122',
    password: 'Password123'
  });

  const cashier = authService.registerCashier({
    tenantId: tenant.id,
    branchId: primaryBranch.id,
    fullName: 'Cashier Mary',
    phoneNumber: '+233240003344',
    pin: '1234',
    email: 'mary@rolesmart.com'
  });

  // Owner permissions
  assert.ok(owner.roles.includes('Owner'));
  assert.ok(owner.permissions.includes('settings.manage'));
  assert.ok(owner.permissions.includes('employees.manage'));
  assert.ok(owner.permissions.includes('reports.view'));

  // Cashier permissions
  assert.ok(cashier.roles.includes('Cashier'));
  assert.ok(cashier.permissions.includes('sales.create'));
  assert.ok(cashier.permissions.includes('sales.view'));
  assert.strictEqual(cashier.permissions.includes('settings.manage'), false);
  assert.strictEqual(cashier.permissions.includes('employees.manage'), false);
  assert.strictEqual(cashier.permissions.includes('reports.view'), false);
});
