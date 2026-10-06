import { Router } from 'express';
import { AuthService, MultipleTenantsError } from '../../services/auth.service.ts';
import { OtpService } from '../../services/otp.service.ts';
import { TenantService } from '../../services/tenant.service.ts';
import { FirebaseService } from '../../services/firebase.service.ts';
import { getFirebaseAuth } from '../../lib/firebase-admin.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { createRateLimiter } from '../../middleware/rateLimit.ts';
import {
  validateBody,
  validateGhanaPhone,
  validateEmail,
  validatePassword,
  validateCashierPin
} from '../../middleware/validate.ts';

export const authRouter = Router();

const authService = new AuthService();
const otpService = new OtpService();
const tenantService = new TenantService();
const firebaseService = new FirebaseService();
const authenticate = createAuthMiddleware(authService);

const otpLimiter = createRateLimiter({ keyPrefix: 'rl_otp' });
const loginLimiter = createRateLimiter({ keyPrefix: 'rl_login' });

/**
 * Step 1: Send OTP for merchant phone verification
 */
authRouter.post('/signup-otp/request', otpLimiter, validateBody([
  {
    field: 'phoneNumber',
    required: true,
    validator: (val) => {
      const res = validateGhanaPhone(String(val));
      return { valid: res.valid, error: res.error };
    }
  }
]), async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const phoneCheck = validateGhanaPhone(phoneNumber);

    const result = await otpService.requestOtp(phoneCheck.normalized!, 'merchant_signup');

    res.json({
      success: true,
      data: {
        recipient: phoneCheck.normalized,
        carrier: phoneCheck.carrier,
        expiresAt: result.expiresAt,
        ...(result.debugCode ? { debugCode: result.debugCode } : {})
      }
    });
  } catch (err: any) {
    if (err && err.code === 'RESEND_COOLDOWN') {
      res.status(429).json({
        success: false,
        error: {
          code: 'RESEND_COOLDOWN',
          message: err.message,
          remainingSeconds: err.remainingSeconds
        }
      });
      return;
    }
    next(err);
  }
});

/**
 * Step 2: Verify OTP
 */
authRouter.post('/signup-otp/verify', otpLimiter, validateBody([
  { field: 'phoneNumber', required: true },
  { field: 'code', required: true }
]), (req, res) => {
  const { phoneNumber, code } = req.body;
  const phoneCheck = validateGhanaPhone(phoneNumber);
  const normalized = phoneCheck.normalized || phoneNumber;

  const result = otpService.verifyOtp(normalized, String(code).trim(), 'merchant_signup');

  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: {
        code: result.code || 'OTP_VERIFICATION_FAILED',
        message: result.reason || 'Invalid OTP code',
        ...(result.remainingAttempts !== undefined ? { remainingAttempts: result.remainingAttempts } : {})
      }
    });
    return;
  }

  res.json({
    success: true,
    data: {
      verified: true,
      phoneNumber: normalized
    }
  });
});

/**
 * Step 3: Register Tenant and Owner Account
 */
authRouter.post('/register', validateBody([
  { field: 'businessLegalName', required: true },
  { field: 'businessTradeName', required: true },
  { field: 'tradeCategory', required: true },
  { field: 'ownerFullName', required: true },
  {
    field: 'ownerEmail',
    required: true,
    validator: (val) => validateEmail(String(val))
  },
  {
    field: 'ownerPhone',
    required: true,
    validator: (val) => {
      const res = validateGhanaPhone(String(val));
      return { valid: res.valid, error: res.error };
    }
  },
  {
    field: 'password',
    required: true,
    validator: (val) => validatePassword(String(val))
  },
  { field: 'primaryBranchName', required: true },
  { field: 'primaryBranchRegion', required: false },
  { field: 'primaryBranchGps', required: false },
  { field: 'primaryBranchAddress', required: false }
]), (req, res, next) => {
  try {
    const {
      businessLegalName,
      businessTradeName,
      tradeCategory,
      ownerFullName,
      ownerEmail,
      ownerPhone,
      password,
      primaryBranchName,
      primaryBranchRegion = 'Greater Accra',
      primaryBranchGps = 'GA-183-9024',
      primaryBranchAddress = 'Oxford Street, Osu, Accra',
      taxConfiguration
    } = req.body;

    const phoneCheck = validateGhanaPhone(ownerPhone);

    const VALID_CATEGORIES = [
      'provision_supermarket',
      'pharmacy',
      'fashion',
      'electronics',
      'general_retail',
    ];
    const categoryToUse = VALID_CATEGORIES.includes(tradeCategory)
      ? tradeCategory
      : 'provision_supermarket';

    // Verify phone OTP was completed (only in production or when verified OTP is present)
    const isVerified = otpService.isRecipientVerified(phoneCheck.normalized!, 'merchant_signup');
    if (!isVerified && process.env.NODE_ENV === 'production') {
      res.status(400).json({
        success: false,
        error: {
          code: 'PHONE_NOT_VERIFIED',
          message: 'Phone number must be verified via OTP prior to account registration'
        }
      });
      return;
    }

    // Ensure tradeCategory satisfies DB CHECK constraint
    const validCategories = ['provision_supermarket', 'pharmacy', 'fashion', 'electronics', 'general_retail'];
    let safeTradeCategory: any = tradeCategory;
    if (!validCategories.includes(safeTradeCategory)) {
      if (safeTradeCategory === 'grocery_minimart' || safeTradeCategory === 'provision') {
        safeTradeCategory = 'provision_supermarket';
      } else {
        safeTradeCategory = 'general_retail';
      }
    }

    // Default primary branch details if deferred to Step 2 store setup
    const branchRegion = (primaryBranchRegion && String(primaryBranchRegion).trim()) || 'Greater Accra';
    const branchGps = (primaryBranchGps && String(primaryBranchGps).trim()) || 'GA-000-0000';
    const branchAddress = (primaryBranchAddress && String(primaryBranchAddress).trim()) || primaryBranchName || 'Accra, Ghana';

    // 1. Create Tenant and Primary Branch
    const { tenant, primaryBranch } = tenantService.createTenant({
      legalName: businessLegalName,
      businessName: businessTradeName,
      tradeCategory: safeTradeCategory,
      primaryBranch: {
        name: primaryBranchName,
        region: branchRegion,
        gpsDigitalAddress: branchGps,
        physicalAddress: branchAddress,
        phone: phoneCheck.normalized!
      },
      taxConfiguration
    });

    // 2. Register Owner
    const owner = authService.registerOwner({
      tenantId: tenant.id,
      fullName: ownerFullName,
      email: ownerEmail,
      phoneNumber: phoneCheck.normalized!,
      password,
      firebaseUid: req.body.firebaseUid,
    });

    // 3. Sync Tenant & User to Firestore in background
    firebaseService.syncTenant(tenant, primaryBranch).catch(() => {});
    firebaseService.syncUser(owner, req.body.firebaseUid).catch(() => {});

    // 4. Issue Session Token
    const token = authService.createSession(owner.id, tenant.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        tenant,
        primaryBranch,
        user: owner
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Step 4: Login with Email or Phone & Password (Multi-Tenant Aware)
 */
authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier || req.body.phone || req.body.phoneNumber;
    const { password, tenantId } = req.body;

    if (!identifier) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email or phone number is required' }
      });
      return;
    }
    if (!password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password is required' }
      });
      return;
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    let result;
    try {
      result = authService.loginWithPassword(identifier, password, tenantId, clientIp, userAgent);
    } catch (err) {
      // If login failed, check if user exists in Firestore (handles Render container restart!)
      const restored = await firebaseService.findOrRestoreFirebaseUser('', identifier, identifier);
      if (restored) {
        try {
          result = authService.loginWithPassword(identifier, password, tenantId || restored.tenantId, clientIp, userAgent);
        } catch {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const tenant = tenantService.getTenantById(result.tenantId);
    const branches = tenantService.getBranches(result.tenantId);
    const primaryBranch = branches.find(b => b.is_primary) || branches[0] || null;

    // Keep Firestore updated in background
    firebaseService.syncTenant(tenant, primaryBranch).catch(() => {});
    firebaseService.syncUser(result.user).catch(() => {});

    res.json({
      success: true,
      data: {
        ...result,
        tenant,
        primaryBranch,
        branches
      }
    });
  } catch (err: unknown) {
    if (err instanceof MultipleTenantsError) {
      res.status(409).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          tenants: err.tenants
        }
      });
      return;
    }

    const msg = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: msg
      }
    });
  }
});

/**
 * Step 4b: Firebase Sign-In (Google OAuth, Phone OTP, Firebase Email)
 */
authRouter.post('/firebase-login', loginLimiter, async (req, res, next) => {
  try {
    const { idToken, tenantId } = req.body;
    if (!idToken) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Firebase ID token is required' }
      });
      return;
    }

    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;
    const phone = decoded.phone_number;

    const restored = await firebaseService.findOrRestoreFirebaseUser(uid, email, phone);

    if (!restored) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_REGISTERED',
          message: 'No store account linked with this Google/Phone login yet. Please sign up to create your store.',
          firebaseUser: {
            uid,
            email,
            phone,
            name: decoded.name || null,
          }
        }
      });
      return;
    }

    const targetTenantId = tenantId || restored.tenantId;
    const sessionToken = authService.createSession(restored.user.id, targetTenantId);
    const tenant = tenantService.getTenantById(targetTenantId);
    const branches = tenantService.getBranches(targetTenantId);
    const primaryBranch = branches.find(b => b.is_primary) || branches[0] || null;

    res.json({
      success: true,
      data: {
        token: sessionToken,
        user: restored.user,
        tenantId: targetTenantId,
        tenant,
        primaryBranch,
        branches
      }
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_FIREBASE_TOKEN',
        message: err.message || 'Firebase authentication failed'
      }
    });
  }
});

/**
 * Step 5: Cashier Fast-Switch PIN Login
 */
authRouter.post('/login-pin', loginLimiter, validateBody([
  { field: 'tenantId', required: true },
  { field: 'cashierId', required: true },
  {
    field: 'pin',
    required: true,
    validator: (val) => validateCashierPin(String(val))
  }
]), (req, res, next) => {
  try {
    const { tenantId, cashierId, pin } = req.body;
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = authService.loginWithPin(tenantId, cashierId, pin, clientIp, userAgent);
    const tenant = tenantService.getTenantById(result.tenantId);
    const branches = tenantService.getBranches(result.tenantId);
    const primaryBranch = branches.find(b => b.is_primary) || branches[0] || null;

    res.json({
      success: true,
      data: {
        ...result,
        tenant,
        primaryBranch,
        branches
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PIN verification failed';
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PIN',
        message: msg
      }
    });
  }
});

/**
 * Current Authenticated Context
 */
authRouter.get('/me', authenticate, (req, res) => {
  const tenant = tenantService.getTenantById(req.tenantId!);
  const branches = tenantService.getBranches(req.tenantId!);
  const primaryBranch = branches.find(b => b.is_primary) || branches[0] || null;

  res.json({
    success: true,
    data: {
      user: req.user,
      tenant,
      primaryBranch,
      branches
    }
  });
});

/**
 * Logout (Revoke Active Session Token)
 */
authRouter.post('/logout', authenticate, (req, res) => {
  if (req.token) {
    authService.logout(req.token);
  }

  res.json({
    success: true,
    data: {
      loggedOut: true
    }
  });
});
