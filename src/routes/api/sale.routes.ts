import { Router } from 'express';
import { SaleService } from '../../services/sale.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';
import { validateBody } from '../../middleware/validate.ts';

export const saleRouter = Router();

const saleService = new SaleService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

saleRouter.use(authenticate, enforceTenantContext);

// GET /api/v1/sales
saleRouter.get('/', requirePermission('sales.view'), (req, res) => {
  const tenantId = req.tenantContext!.tenantId;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const sales = saleService.getSales(tenantId, limit);
  const summary = saleService.getTodaySummary(tenantId);

  res.json({
    success: true,
    data: {
      sales,
      summary
    }
  });
});

// POST /api/v1/sales
saleRouter.post('/', requirePermission('sales.create'), validateBody([
  { field: 'items', required: true },
  { field: 'paymentMethod', required: true }
]), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const cashierId = req.user!.id;
    const { items, paymentMethod, amountTendered, customerPhone, applyTax, branchId } = req.body;

    const sale = saleService.createSale({
      tenantId,
      branchId,
      cashierId,
      items,
      paymentMethod,
      amountTendered,
      customerPhone,
      applyTax
    });

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sales/:id
saleRouter.get('/:id', requirePermission('sales.view'), (req, res) => {
  const tenantId = req.tenantContext!.tenantId;
  const sale = saleService.getSaleById(tenantId, String(req.params.id));


  if (!sale) {
    res.status(404).json({
      success: false,
      error: { code: 'SALE_NOT_FOUND', message: 'Sale record not found' }
    });
    return;
  }

  res.json({
    success: true,
    data: sale
  });
});
