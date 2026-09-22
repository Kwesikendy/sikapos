import test from 'node:test';
import assert from 'node:assert';
import { getDb } from '../src/db/connection.ts';
import { initializeDatabase } from '../src/db/init.ts';
import { TaxService } from '../src/services/tax.service.ts';
import { DeviceService } from '../src/services/device.service.ts';
import { TenantService } from '../src/services/tenant.service.ts';

const db = initializeDatabase();
const taxService = new TaxService(db);
const deviceService = new DeviceService(db);
const tenantService = new TenantService(db);

test('Tax Service: Standard GRA calculation and currency formatting', () => {
  const profile = {
    id: 'test_gra',
    tenant_id: 'test_tenant',
    name: 'Ghana Standard VAT + Levies',
    tax_type: 'standard_gra' as const,
    vat_rate: 15.0,
    nhil_rate: 2.5,
    getfund_rate: 2.5,
    covid_levy_rate: 0.0,
    is_active: true,
    created_at: '',
    updated_at: ''
  };

  const subtotal = 1000.00;
  const calc = taxService.calculateTaxes(subtotal, profile);

  // NHIL: 2.5% of 1000 = 25.00
  assert.strictEqual(calc.nhilAmount, 25.00);
  // GETFund: 2.5% of 1000 = 25.00
  assert.strictEqual(calc.getfundAmount, 25.00);
  // VAT: 15% of (1000 + 25 + 25) = 15% of 1050 = 157.50
  assert.strictEqual(calc.vatAmount, 157.50);
  // Total Tax: 25 + 25 + 157.50 = 207.50
  assert.strictEqual(calc.totalTax, 207.50);
  // Grand Total: 1000 + 207.50 = 1207.50
  assert.strictEqual(calc.grandTotal, 1207.50);

  // Ghana currency formatting check
  assert.strictEqual(calc.formattedSubtotal, 'GH₵ 1,000.00');
  assert.strictEqual(calc.formattedGrandTotal, 'GH₵ 1,207.50');
});

test('Tax Service: Not VAT registered profile (0% tax)', () => {
  const exemptProfile = {
    id: 'exempt',
    tenant_id: 'test_tenant',
    name: 'Not Registered',
    tax_type: 'not_registered' as const,
    vat_rate: 0,
    nhil_rate: 0,
    getfund_rate: 0,
    covid_levy_rate: 0,
    is_active: true,
    created_at: '',
    updated_at: ''
  };

  const calc = taxService.calculateTaxes(500.00, exemptProfile);
  assert.strictEqual(calc.totalTax, 0);
  assert.strictEqual(calc.grandTotal, 500.00);
  assert.strictEqual(calc.formattedGrandTotal, 'GH₵ 500.00');
});

test('Device Service: Terminal registration, heartbeat and idempotent sync queue', () => {
  const { tenant, primaryBranch } = tenantService.createTenant({
    legalName: 'Device Test Retail Ltd',
    businessName: 'Device Store',
    tradeCategory: 'general_retail',
    primaryBranch: {
      name: 'Terminal Hub',
      region: 'Greater Accra',
      gpsDigitalAddress: 'GA-777-8888',
      physicalAddress: 'Osu',
      phone: '+233249990000'
    }
  });

  // 1. Terminal registration
  const testDevId = `ACC-TERM-${Date.now()}`;
  const device = deviceService.registerDevice({
    tenantId: tenant.id,
    branchId: primaryBranch.id,
    deviceName: 'Counter Register 1',
    deviceIdentifier: testDevId,
    deviceType: 'pos_terminal',
    hardwareModel: 'Sunmi V2 Pro'
  });

  assert.ok(device.id);
  assert.strictEqual(device.device_identifier, testDevId);
  assert.strictEqual(device.hardware_model, 'Sunmi V2 Pro');

  // 2. Terminal heartbeat
  const hb = deviceService.recordHeartbeat(tenant.id, testDevId);
  assert.strictEqual(hb.acknowledged, true);
  assert.ok(hb.serverTime);

  // 3. Offline event queue duplicate prevention (idempotency check)
  const clientEventId = `evt_test_${Date.now()}_${Math.random()}`;
  const firstEvent = deviceService.queueOfflineSyncEvent(
    tenant.id,
    device.id,
    clientEventId,
    'local_order_created',
    { orderRef: 'ORD-001', total: 150.00 }
  );
  assert.strictEqual(firstEvent.status, 'received');

  // Same clientEventId submitted again must be detected as duplicate
  const duplicateEvent = deviceService.queueOfflineSyncEvent(
    tenant.id,
    device.id,
    clientEventId,
    'local_order_created',
    { orderRef: 'ORD-001', total: 150.00 }
  );
  assert.strictEqual(duplicateEvent.status, 'duplicate');
  assert.strictEqual(duplicateEvent.eventId, firstEvent.eventId);
});
