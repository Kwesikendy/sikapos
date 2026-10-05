import { z } from 'zod';

/**
 * Ghana phone number validator helper
 * Accepts format like 0244123456, 024 412 3456, +233244123456, 233244123456
 */
const ghanaPhoneValidation = z
  .string()
  .trim()
  .min(1, 'Phone number is required.')
  .refine(
    (val) => {
      const clean = val.replace(/\D/g, '');
      // Standard Ghanaian format: 10 digits starting with 0, or 12 digits starting with 233, or 9 digits without leading 0
      if (clean.length === 10 && clean.startsWith('0')) return true;
      if (clean.length === 12 && clean.startsWith('233')) return true;
      if (clean.length === 9) return true;
      return false;
    },
    {
      message: 'Enter a valid Ghanaian mobile phone number (e.g. 024 412 3456).',
    }
  );

/**
 * GhanaPost GPS digital address code validator
 * Format: 2 letters, hyphen, 3 to 4 digits, hyphen, 4 digits (e.g. GA-183-9024 or AK-039-4028)
 */
const ghanaPostGpsValidation = z
  .string()
  .trim()
  .min(1, 'GhanaPost GPS digital address is required.')
  .regex(
    /^[A-Za-z]{2}-\d{3,4}-\d{4}$/,
    'Format must follow GhanaPost GPS pattern (e.g. GA-183-9024).'
  );

/**
 * Merchant Signup Schema - validates owner identity, contact and initial branch credentials
 */
export const merchantSignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters.')
    .max(80, 'Full name must not exceed 80 characters.')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Full name should only contain letters and spaces.'),
  phoneNumber: ghanaPhoneValidation,
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Enter a valid email address (e.g. kwabena@mensahstores.com).'),
  businessName: z
    .string()
    .trim()
    .min(2, 'Business trade name must be at least 2 characters.')
    .max(100, 'Business trade name must not exceed 100 characters.'),
  branchName: z
    .string()
    .trim()
    .min(2, 'Primary outlet name must be at least 2 characters.')
    .max(100, 'Outlet name must not exceed 100 characters.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[0-9]/, 'Password must include at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character.'),
});

export type MerchantSignupFormData = z.infer<typeof merchantSignupSchema>;

/**
 * OTP Verification Schema
 */
export const otpVerificationSchema = z.object({
  otpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the full 6-digit verification code sent to your phone.'),
});

export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

/**
 * Store Setup - Step 1: Owner Profile Schema
 */
export const storeSetupOwnerSchema = z.object({
  ownerName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters.')
    .max(80, 'Full name is too long.'),
  ownerPhone: ghanaPhoneValidation,
  ownerEmail: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Enter a valid email address.'),
});

export type StoreSetupOwnerFormData = z.infer<typeof storeSetupOwnerSchema>;

/**
 * Store Setup - Step 2: Store Details & Location Schema
 */
export const storeSetupStoreSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'Business legal name must be at least 2 characters.')
    .max(100, 'Business legal name is too long.'),
  selectedCategory: z
    .string()
    .min(1, 'Please select a primary commercial trade category.'),
  branchName: z
    .string()
    .trim()
    .min(2, 'Branch outlet name must be at least 2 characters.')
    .max(100, 'Branch outlet name is too long.'),
  ghanaPostGps: ghanaPostGpsValidation,
});

export type StoreSetupStoreFormData = z.infer<typeof storeSetupStoreSchema>;

/**
 * Store Setup - Step 3: Ghana Revenue Authority (GRA) Tax Profile Schema
 */
export const storeSetupTaxSchema = z.object({
  taxMode: z.enum(['standard', 'non_vat'], {
    message: 'Select a valid GRA tax configuration mode.',
  }),
  tinNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        // Standard Ghana Taxpayer Identification Number pattern (e.g. P0012345678, C0012345678, V0012345678)
        return /^[A-Za-z0-9]{8,15}$/.test(val);
      },
      {
        message: 'TIN must be 8-15 alphanumeric characters (e.g. P0012345678).',
      }
    ),
});

export type StoreSetupTaxFormData = z.infer<typeof storeSetupTaxSchema>;

/**
 * Store Setup - Step 4: Cashier PIN & MoMo Settlement Schema
 */
export const storeSetupCashierSchema = z.object({
  cashierPin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Cashier till PIN must be exactly 4 numeric digits.'),
  payoutMomoNumber: ghanaPhoneValidation,
});

export type StoreSetupCashierFormData = z.infer<typeof storeSetupCashierSchema>;

/**
 * Complete Store Setup Schema (combines steps for full validation before final API persistence)
 */
export const storeSetupCompleteSchema = storeSetupOwnerSchema
  .merge(storeSetupStoreSchema)
  .merge(storeSetupTaxSchema)
  .merge(storeSetupCashierSchema);

export type StoreSetupCompleteFormData = z.infer<typeof storeSetupCompleteSchema>;
