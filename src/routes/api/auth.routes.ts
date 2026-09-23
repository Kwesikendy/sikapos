import { Router } from 'express';
import { AuthService, MultipleTenantsError } from '../../services/auth.service.ts';
import { OtpService } from '../../services/otp.service.ts';
import { TenantService } from '../../services/tenant.service.ts';
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
  { field: 'primaryBranchRegion', required: true },
  { field: 'primaryBranchGps', required: true },
  { field: 'primaryBranchAddress', required: true }
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
      primaryBranchRegion,
      primaryBranchGps,
      primaryBranchAddress,
      taxConfiguration
    } = req.body;

    const phoneCheck = validateGhanaPhone(ownerPhone);

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

    // 1. Create Tenant and Primary Branch
    const { tenant, primaryBranch } = tenantService.createTenant({
      legalName: businessLegalName,
      businessName: businessTradeName,
      tradeCategory,
      primaryBranch: {
        name: primaryBranchName,
        region: primaryBranchRegion,
        gpsDigitalAddress: primaryBranchGps,
        physicalAddress: primaryBranchAddress,
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
      password
    });

    // 3. Issue Session Token
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
 * Step 4: Login with Email & Password (Multi-Tenant Aware)
 */
authRouter.post('/login', loginLimiter, validateBody([
  { field: 'email', required: true },
  { field: 'password', required: true }
]), (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const result = authService.loginWithPassword(email, password, tenantId, clientIp, userAgent);

    res.json({
      success: true,
      data: result
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

    res.json({
      success: true,
      data: result
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

  res.json({
    success: true,
    data: {
      user: req.user,
      tenant
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
