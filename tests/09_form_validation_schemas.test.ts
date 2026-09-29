import test from 'node:test';
import assert from 'node:assert';
import {
  merchantSignupSchema,
  otpVerificationSchema,
  storeSetupOwnerSchema,
  storeSetupStoreSchema,
  storeSetupTaxSchema,
  storeSetupCashierSchema,
  storeSetupCompleteSchema,
} from '../client/src/schemas/form.schemas.ts';

test('Zod Schemas - 1: Merchant Signup valid payload passes', () => {
  const validData = {
    fullName: 'Kwabena Mensah',
    phoneNumber: '0244123456',
    email: 'kwabena@mensahstores.com',
    businessName: 'Mensah Provision Store',
    branchName: 'Osu Oxford St. Branch',
    password: 'OsuPass2025#',
  };

  const result = merchantSignupSchema.safeParse(validData);
  assert.strictEqual(result.success, true);
});

test('Zod Schemas - 2: Merchant Signup invalid fields rejected', () => {
  // Bad email
  const badEmail = merchantSignupSchema.safeParse({
    fullName: 'Kwabena Mensah',
    phoneNumber: '0244123456',
    email: 'not-an-email',
    businessName: 'Store',
    branchName: 'Branch',
    password: 'OsuPass2025#',
  });
  assert.strictEqual(badEmail.success, false);
  assert.ok(badEmail.error?.issues.some((i) => i.path[0] === 'email'));

  // Weak password (no special char or no number)
  const weakPass = merchantSignupSchema.safeParse({
    fullName: 'Kwabena Mensah',
    phoneNumber: '0244123456',
    email: 'kwabena@mensahstores.com',
    businessName: 'Store',
    branchName: 'Branch',
    password: 'passwordonly',
  });
  assert.strictEqual(weakPass.success, false);
  assert.ok(weakPass.error?.issues.some((i) => i.path[0] === 'password'));

  // Invalid Ghana phone
  const badPhone = merchantSignupSchema.safeParse({
    fullName: 'Kwabena Mensah',
    phoneNumber: '12345',
    email: 'kwabena@mensahstores.com',
    businessName: 'Store',
    branchName: 'Branch',
    password: 'OsuPass2025#',
  });
  assert.strictEqual(badPhone.success, false);
  assert.ok(badPhone.error?.issues.some((i) => i.path[0] === 'phoneNumber'));
});

test('Zod Schemas - 3: OTP verification schema', () => {
  assert.strictEqual(otpVerificationSchema.safeParse({ otpCode: '123456' }).success, true);
  assert.strictEqual(otpVerificationSchema.safeParse({ otpCode: '12345' }).success, false);
  assert.strictEqual(otpVerificationSchema.safeParse({ otpCode: 'abcdef' }).success, false);
});

test('Zod Schemas - 4: Store Setup - Owner Profile schema', () => {
  const validOwner = {
    ownerName: 'Kwabena Mensah',
    ownerPhone: '0244123456',
    ownerEmail: 'kwabena@mensahstores.com',
  };
  assert.strictEqual(storeSetupOwnerSchema.safeParse(validOwner).success, true);

  const invalidOwner = {
    ownerName: 'K',
    ownerPhone: '0244123456',
    ownerEmail: 'invalid',
  };
  const res = storeSetupOwnerSchema.safeParse(invalidOwner);
  assert.strictEqual(res.success, false);
  assert.ok(res.error?.issues.some((i) => i.path[0] === 'ownerName'));
  assert.ok(res.error?.issues.some((i) => i.path[0] === 'ownerEmail'));
});

test('Zod Schemas - 5: Store Setup - Store & Location schema (GhanaPost GPS)', () => {
  const validStore = {
    businessName: 'Mensah Stores Ltd',
    selectedCategory: 'provision_supermarket',
    branchName: 'Osu Oxford St.',
    ghanaPostGps: 'GA-183-9024',
  };
  assert.strictEqual(storeSetupStoreSchema.safeParse(validStore).success, true);

  // Invalid GPS format
  const badGps = {
    ...validStore,
    ghanaPostGps: 'invalid-gps-address',
  };
  const res = storeSetupStoreSchema.safeParse(badGps);
  assert.strictEqual(res.success, false);
  assert.ok(res.error?.issues.some((i) => i.path[0] === 'ghanaPostGps'));
});

test('Zod Schemas - 6: Store Setup - GRA Tax schema', () => {
  assert.strictEqual(
    storeSetupTaxSchema.safeParse({ taxMode: 'standard', tinNumber: 'P0012345678' }).success,
    true
  );
  assert.strictEqual(
    storeSetupTaxSchema.safeParse({ taxMode: 'non_vat' }).success,
    true
  );
  // Invalid mode
  assert.strictEqual(
    storeSetupTaxSchema.safeParse({ taxMode: 'unknown_mode' as any }).success,
    false
  );
});

test('Zod Schemas - 7: Store Setup - Cashier Till PIN and MoMo Payout', () => {
  const validCashier = {
    cashierPin: '1234',
    payoutMomoNumber: '0244123456',
  };
  assert.strictEqual(storeSetupCashierSchema.safeParse(validCashier).success, true);

  // 3-digit PIN rejected
  assert.strictEqual(
    storeSetupCashierSchema.safeParse({ cashierPin: '123', payoutMomoNumber: '0244123456' }).success,
    false
  );

  // Non-numeric PIN rejected
  assert.strictEqual(
    storeSetupCashierSchema.safeParse({ cashierPin: 'abcd', payoutMomoNumber: '0244123456' }).success,
    false
  );
});

test('Zod Schemas - 8: Complete Store Setup combined schema', () => {
  const completeValid = {
    ownerName: 'Kwabena Mensah',
    ownerPhone: '0244123456',
    ownerEmail: 'kwabena@mensahstores.com',
    businessName: 'Mensah Provision Store',
    selectedCategory: 'provision_supermarket',
    branchName: 'Osu Oxford St. Branch',
    ghanaPostGps: 'GA-183-9024',
    taxMode: 'standard' as const,
    tinNumber: 'P0012345678',
    cashierPin: '1234',
    payoutMomoNumber: '0244123456',
  };

  assert.strictEqual(storeSetupCompleteSchema.safeParse(completeValid).success, true);
});
