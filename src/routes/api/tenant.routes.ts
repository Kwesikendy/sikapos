import { Router } from 'express';
import { TenantService } from '../../services/tenant.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requireRole, requirePermission } from '../../middleware/rbac.ts';
import { validateBody, validateCashierPin, validateGhanaPhone } from '../../middleware/validate.ts';

export const tenantRouter = Router();

const tenantService = new TenantService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

// Apply auth and tenant context across all tenant routes
tenantRouter.use(authenticate, enforceTenantContext);

/**
 * Get current tenant profile
 */
tenantRouter.get('/current', (req, res) => {
  const tenant = tenantService.getTenantById(req.tenantContext!.tenantId);
  if (!tenant) {
    res.status(404).json({
      success: false,
      error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
    });
    return;
  }

  res.json({
    success: true,
    data: tenant
  });
});

/**
 * List branches belonging to current tenant
 */
tenantRouter.get('/branches', (req, res) => {
  const branches = tenantService.getBranches(req.tenantContext!.tenantId);

  res.json({
    success: true,
    data: branches
  });
});

/**
 * Create a new branch (Requires Owner or settings.manage permission)
 */
tenantRouter.post('/branches', requirePermission('settings.manage'), validateBody([
  { field: 'name', required: true },
  { field: 'region', required: true },
  { field: 'gpsDigitalAddress', required: true },
  { field: 'physicalAddress', required: true },
  {
    field: 'phone',
    required: true,
    validator: (val) => {
      const res = validateGhanaPhone(String(val));
      return { valid: res.valid, error: res.error };
    }
  }
]), (req, res, next) => {
  try {
    const { name, region, gpsDigitalAddress, physicalAddress, phone, isPrimary } = req.body;
    const phoneCheck = validateGhanaPhone(phone);

    const branch = tenantService.createBranch(req.tenantContext!.tenantId, {
      name,
      region,
      gpsDigitalAddress,
      physicalAddress,
      phone: phoneCheck.normalized!,
      isPrimary: Boolean(isPrimary)
    });

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List staff/users in current tenant
 */
tenantRouter.get('/users', requirePermission('employees.manage'), (req, res) => {
  const users = tenantService.getTenantUsers(req.tenantContext!.tenantId);

  res.json({
    success: true,
    data: users
  });
});

/**
 * Create a cashier with 4-digit PIN for current tenant
 */
tenantRouter.post('/cashiers', requirePermission('employees.manage'), validateBody([
  { field: 'branchId', required: true },
  { field: 'fullName', required: true },
  {
    field: 'phoneNumber',
    required: true,
    validator: (val) => {
      const res = validateGhanaPhone(String(val));
      return { valid: res.valid, error: res.error };
    }
  },
  {
    field: 'pin',
    required: true,
    validator: (val) => validateCashierPin(String(val))
  }
]), (req, res, next) => {
  try {
    const { branchId, fullName, phoneNumber, pin, email } = req.body;
    const phoneCheck = validateGhanaPhone(phoneNumber);

    const cashier = authService.registerCashier({
      tenantId: req.tenantContext!.tenantId,
      branchId,
      fullName,
      phoneNumber: phoneCheck.normalized!,
      pin,
      email
    });

    res.status(201).json({
      success: true,
      data: cashier
    });
  } catch (err) {
    next(err);
  }
});
