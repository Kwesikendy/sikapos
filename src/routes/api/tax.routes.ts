import { Router } from 'express';
import { TaxService } from '../../services/tax.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';
import { validateBody } from '../../middleware/validate.ts';

export const taxRouter = Router();

const taxService = new TaxService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

/**
 * Public/Unauthenticated simulation endpoint for onboarding previews
 */
taxRouter.post('/simulate', validateBody([
  { field: 'subtotal', required: true, type: 'number' }
]), (req, res) => {
  const { subtotal, taxType, customVatRate, customNhilRate, customGetfundRate } = req.body;

  let vatRate = TaxService.GRA_STANDARD_RATES.vatRate;
  let nhilRate = TaxService.GRA_STANDARD_RATES.nhilRate;
  let getfundRate = TaxService.GRA_STANDARD_RATES.getfundRate;
  let name = 'Ghana Standard VAT + Levies';

  if (taxType === 'not_registered') {
    vatRate = 0;
    nhilRate = 0;
    getfundRate = 0;
    name = 'Not VAT Registered (Exempt Retailer)';
  } else if (taxType === 'custom') {
    vatRate = customVatRate ?? 0;
    nhilRate = customNhilRate ?? 0;
    getfundRate = customGetfundRate ?? 0;
    name = 'Custom Tax Profile';
  }

  const calculation = taxService.calculateTaxes(Number(subtotal), {
    id: 'preview',
    tenant_id: 'preview',
    name,
    tax_type: taxType || 'standard_gra',
    vat_rate: vatRate,
    nhil_rate: nhilRate,
    getfund_rate: getfundRate,
    covid_levy_rate: 0,
    is_active: true,
    created_at: '',
    updated_at: ''
  });

  res.json({
    success: true,
    data: calculation
  });
});

/**
 * Protected routes: Get and configure tenant tax profile
 */
taxRouter.get('/current', authenticate, enforceTenantContext, (req, res) => {
  const profile = taxService.getActiveTaxProfile(req.tenantContext!.tenantId);

  res.json({
    success: true,
    data: profile
  });
});

taxRouter.post('/configure', authenticate, enforceTenantContext, requirePermission('settings.manage'), validateBody([
  { field: 'taxType', required: true }
]), (req, res) => {
  const { taxType, customVatRate, customNhilRate, customGetfundRate } = req.body;

  if (!['not_registered', 'standard_gra', 'custom'].includes(taxType)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TAX_TYPE', message: 'taxType must be one of: not_registered, standard_gra, custom' }
    });
    return;
  }

  const profile = taxService.setTaxProfile(req.tenantContext!.tenantId, {
    taxType,
    customVatRate: customVatRate ? Number(customVatRate) : undefined,
    customNhilRate: customNhilRate ? Number(customNhilRate) : undefined,
    customGetfundRate: customGetfundRate ? Number(customGetfundRate) : undefined,
  });

  res.json({
    success: true,
    data: profile
  });
});
