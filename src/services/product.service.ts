import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  barcode: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductParams {
  name: string;
  barcode?: string;
  category?: string;
  costPrice?: number;
  sellingPrice: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export class ProductService {
  private db: Database.Database;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  public getProducts(tenantId: string, options?: { search?: string; category?: string }): Product[] {
    let sql = `SELECT * FROM products WHERE tenant_id = ? AND is_active = 1`;
    const params: (string | number)[] = [tenantId];

    if (options?.category && options.category !== 'all') {
      sql += ` AND LOWER(category) = LOWER(?)`;
      params.push(options.category);
    }

    if (options?.search && options.search.trim().length > 0) {
      sql += ` AND (LOWER(name) LIKE ? OR barcode LIKE ?)`;
      const term = `%${options.search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    sql += ` ORDER BY name ASC`;

    return this.db.prepare(sql).all(...params) as Product[];
  }

  public getProductById(tenantId: string, productId: string): Product | null {
    const row = this.db.prepare(`
      SELECT * FROM products WHERE tenant_id = ? AND id = ?
    `).get(tenantId, productId) as Product | undefined;

    return row || null;
  }

  public getCategories(tenantId: string): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT category FROM products WHERE tenant_id = ? AND is_active = 1 ORDER BY category ASC
    `).all(tenantId) as { category: string }[];

    return rows.map((r) => r.category);
  }

  public createProduct(tenantId: string, params: CreateProductParams): Product {
    const id = `prd_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO products (
        id, tenant_id, name, barcode, category,
        cost_price, selling_price, stock_quantity,
        low_stock_threshold, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      tenantId,
      params.name.trim(),
      params.barcode?.trim() || null,
      params.category?.trim() || 'General',
      Number(params.costPrice || 0),
      Number(params.sellingPrice),
      Number(params.stockQuantity || 0),
      Number(params.lowStockThreshold || 5),
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
      category: string;
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
      isActive: boolean;
    }>
  ): Product | null {
    const existing = this.getProductById(tenantId, productId);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (params.name !== undefined) {
      updates.push('name = ?');
      values.push(params.name.trim());
    }
    if (params.barcode !== undefined) {
      updates.push('barcode = ?');
      values.push(params.barcode.trim());
    }
    if (params.category !== undefined) {
      updates.push('category = ?');
      values.push(params.category.trim());
    }
    if (params.costPrice !== undefined) {
      updates.push('cost_price = ?');
      values.push(Number(params.costPrice));
    }
    if (params.sellingPrice !== undefined) {
      updates.push('selling_price = ?');
      values.push(Number(params.sellingPrice));
    }
    if (params.stockQuantity !== undefined) {
      updates.push('stock_quantity = ?');
      values.push(Number(params.stockQuantity));
    }
    if (params.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(params.isActive ? 1 : 0);
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

  public adjustStock(tenantId: string, productId: string, delta: number): void {
    this.db.prepare(`
      UPDATE products
      SET stock_quantity = MAX(0, stock_quantity + ?), updated_at = ?
      WHERE tenant_id = ? AND id = ?
    `).run(delta, new Date().toISOString(), tenantId, productId);
  }
}
