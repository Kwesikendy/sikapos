import { Router } from 'express';
import { ProductService } from '../../services/product.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import { TenantService } from '../../services/tenant.service.ts';
import { createAuthMiddleware } from '../../middleware/auth.ts';
import { enforceTenantContext } from '../../middleware/tenant.ts';
import { requirePermission } from '../../middleware/rbac.ts';
import { validateBody } from '../../middleware/validate.ts';

export const productRouter = Router();

const productService = new ProductService();
const authService = new AuthService();
const tenantService = new TenantService();
const authenticate = createAuthMiddleware(authService);

// GET /api/v1/products
productRouter.get('/', authenticate, enforceTenantContext, (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const search = req.query.search ? String(req.query.search) : undefined;
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;

    const products = productService.getProducts(tenantId, { search, categoryId });
    const categories = productService.getCategories(tenantId);

    res.json({
      success: true,
      data: {
        products,
        categories
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/categories
productRouter.get('/categories', authenticate, enforceTenantContext, (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const categories = productService.getCategories(tenantId);

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/products/categories
productRouter.post('/categories', authenticate, enforceTenantContext, requirePermission('products.create'), validateBody([
  { field: 'name', required: true }
]), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { name, colorCode } = req.body;
    
    const category = productService.createCategory(tenantId, name, colorCode);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch(err) {
    next(err);
  }
});

// POST /api/v1/products
productRouter.post('/', authenticate, enforceTenantContext, requirePermission('products.create'), validateBody([
  { field: 'name', required: true },
  { field: 'sellingPrice', required: true, type: 'number' }
]), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { name, barcode, sku, categoryId, description, costPrice, sellingPrice, isTaxable, initialStock, branchId } = req.body;

    const product = productService.createProduct(tenantId, {
      name,
      barcode,
      sku,
      categoryId,
      description,
      costPrice,
      sellingPrice,
      isTaxable
    });

    if (initialStock && initialStock > 0) {
      const targetBranchId = branchId || req.tenantContext?.branchId || tenantService.getBranches(tenantId).find(b => b.is_primary)?.id;
      if (targetBranchId) {
        productService.adjustStock(tenantId, targetBranchId, product.id, initialStock);
        // Reload product to get stock
        const productWithStock = productService.getProductById(tenantId, product.id);
        res.status(201).json({ success: true, data: productWithStock });
        return;
      }
    }

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

// POST /api/v1/products/:id/stock
productRouter.post('/:id/stock', authenticate, enforceTenantContext, requirePermission('inventory.adjust'), validateBody([
  { field: 'branchId', required: true },
  { field: 'quantity', required: true, type: 'number' }
]), (req, res, next) => {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const productId = String(req.params.id);
    const { branchId, quantity } = req.body;

    productService.adjustStock(tenantId, branchId, productId, quantity);
    
    const updated = productService.getProductById(tenantId, productId);
    
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
