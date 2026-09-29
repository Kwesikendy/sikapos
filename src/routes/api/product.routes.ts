import { Router } from 'express';
import { ProductService } from '../../services/product.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';
import { validateBody } from '../../middleware/validate.ts';

export const productRouter = Router();

const productService = new ProductService();
const authService = new AuthService();
const authenticate = createAuthMiddleware(authService);

// GET /api/v1/products
productRouter.get('/', authenticate, enforceTenantContext, (req, res) => {
  const tenantId = req.tenantContext!.tenantId;
  const search = req.query.search ? String(req.query.search) : undefined;
  const category = req.query.category ? String(req.query.category) : undefined;

  const products = productService.getProducts(tenantId, { search, category });
  const categories = productService.getCategories(tenantId);

  res.json({
    success: true,
    data: {
      products,
      categories
    }
  });
});

// GET /api/v1/products/categories
productRouter.get('/categories', authenticate, enforceTenantContext, (req, res) => {
  const tenantId = req.tenantContext!.tenantId;
  const categories = productService.getCategories(tenantId);

  res.json({
    success: true,
    data: categories
  });
});

// POST /api/v1/products
productRouter.post('/', authenticate, enforceTenantContext, requirePermission('products.create'), validateBody([
  { field: 'name', required: true },
  { field: 'sellingPrice', required: true, type: 'number' }
]), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { name, barcode, category, costPrice, sellingPrice, stockQuantity, lowStockThreshold } = req.body;

    const product = productService.createProduct(tenantId, {
      name,
      barcode,
      category,
      costPrice,
      sellingPrice,
      stockQuantity,
      lowStockThreshold
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/products/:id
productRouter.put('/:id', authenticate, enforceTenantContext, requirePermission('products.update'), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const productId = String(req.params.id);

    const updated = productService.updateProduct(tenantId, productId, req.body);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});
