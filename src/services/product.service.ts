import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  category_name?: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  description: string | null;
  base_price: number;
  cost_price: number;
  is_taxable: number;
  status: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  total_stock?: number;
}

export interface CreateProductParams {
  name: string;
  barcode?: string;
  sku?: string;
  categoryId?: string;
  costPrice?: number;
  sellingPrice: number;
  description?: string;
  imageUrl?: string;
  isTaxable?: boolean;
}

export class ProductService {
  private db: Database.Database;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  public getProducts(tenantId: string, options?: { search?: string; categoryId?: string }): Product[] {
    let sql = `
      SELECT p.*, c.name as category_name, 
             (SELECT SUM(quantity) FROM inventory WHERE product_id = p.id AND tenant_id = ?) as total_stock
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? AND p.status != 'archived'
    `;
    const params: (string | number)[] = [tenantId, tenantId];

    if (options?.categoryId && options.categoryId !== 'all') {
      sql += ` AND p.category_id = ?`;
      params.push(options.categoryId);
    }

    if (options?.search && options.search.trim().length > 0) {
      sql += ` AND (LOWER(p.name) LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)`;
      const term = `%${options.search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY p.name ASC`;

    return this.db.prepare(sql).all(...params) as Product[];
  }

  public getProductById(tenantId: string, productId: string): Product | null {
    const row = this.db.prepare(`
      SELECT p.*, c.name as category_name,
             (SELECT SUM(quantity) FROM inventory WHERE product_id = p.id AND tenant_id = ?) as total_stock
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? AND p.id = ?
    `).get(tenantId, tenantId, productId) as Product | undefined;

    return row || null;
  }

  public getCategories(tenantId: string) {
    return this.db.prepare(`
      SELECT * FROM product_categories WHERE tenant_id = ? ORDER BY name ASC
    `).all(tenantId);
  }

  public createCategory(tenantId: string, name: string, colorCode?: string) {
    const id = `cat_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO product_categories (id, tenant_id, name, color_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, tenantId, name.trim(), colorCode || null, now, now);

    return this.db.prepare(`SELECT * FROM product_categories WHERE id = ?`).get(id);
  }

  public createProduct(tenantId: string, params: CreateProductParams): Product {
    const id = `prd_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO products (
        id, tenant_id, category_id, name, barcode, sku, description, image_url,
        base_price, cost_price, is_taxable, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      id,
      tenantId,
      params.categoryId || null,
      params.name.trim(),
      params.barcode?.trim() || null,
      params.sku?.trim() || null,
      params.description?.trim() || null,
      params.imageUrl || null,
      Number(params.sellingPrice),
      Number(params.costPrice || 0),
      params.isTaxable === false ? 0 : 1,
      now,
      now
    );

    return this.getProductById(tenantId, id)!;
  }

  public updateProduct(
    tenantId: string,
    productId: string,
    params: Partial<{
      name: string;
      barcode: string;
      sku: string;
      categoryId: string;
      description: string;
      imageUrl: string;
      costPrice: number;
      sellingPrice: number;
      isTaxable: boolean;
      status: string;
    }>
  ): Product | null {
    const existing = this.getProductById(tenantId, productId);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (params.name !== undefined) {
      updates.push('name = ?');
      values.push(params.name.trim());
    }
    if (params.barcode !== undefined) {
      updates.push('barcode = ?');
      values.push(params.barcode?.trim() || null);
    }
    if (params.sku !== undefined) {
      updates.push('sku = ?');
      values.push(params.sku?.trim() || null);
    }
    if (params.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(params.categoryId || null);
    }
    if (params.description !== undefined) {
      updates.push('description = ?');
      values.push(params.description?.trim() || null);
    }
    if (params.imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(params.imageUrl || null);
    }
    if (params.costPrice !== undefined) {
      updates.push('cost_price = ?');
      values.push(Number(params.costPrice));
    }
    if (params.sellingPrice !== undefined) {
      updates.push('base_price = ?');
      values.push(Number(params.sellingPrice));
    }
    if (params.isTaxable !== undefined) {
      updates.push('is_taxable = ?');
      values.push(params.isTaxable ? 1 : 0);
    }
    if (params.status !== undefined) {
      updates.push('status = ?');
      values.push(params.status);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(tenantId, productId);

    this.db.prepare(`
      UPDATE products SET ${updates.join(', ')} WHERE tenant_id = ? AND id = ?
    `).run(...values);

    return this.getProductById(tenantId, productId);
  }

  public adjustStock(tenantId: string, branchId: string, productId: string, delta: number): void {
    const now = new Date().toISOString();
    
    // Check if inventory record exists
    const exists = this.db.prepare(`
      SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ? AND tenant_id = ?
    `).get(productId, branchId, tenantId) as { quantity: number } | undefined;

    if (exists) {
      this.db.prepare(`
        UPDATE inventory
        SET quantity = MAX(0, quantity + ?), updated_at = ?, last_restock_at = CASE WHEN ? > 0 THEN ? ELSE last_restock_at END
        WHERE product_id = ? AND branch_id = ? AND tenant_id = ?
      `).run(delta, now, delta, now, productId, branchId, tenantId);
    } else {
      this.db.prepare(`
        INSERT INTO inventory (product_id, branch_id, tenant_id, quantity, last_restock_at, created_at, updated_at)
        VALUES (?, ?, ?, MAX(0, ?), CASE WHEN ? > 0 THEN ? ELSE NULL END, ?, ?)
      `).run(productId, branchId, tenantId, delta, delta, now, now, now);
    }
  }
}
