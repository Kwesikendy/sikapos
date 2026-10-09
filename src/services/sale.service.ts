import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import { TaxService } from './tax.service.ts';
import { ProductService } from './product.service.ts';

export interface SaleItemInput {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleParams {
  tenantId: string;
  branchId?: string;
  cashierId: string;
  items: SaleItemInput[];
  paymentMethod: 'cash' | 'mtn_momo' | 'telecel_cash' | 'at_money' | 'card';
  amountTendered?: number;
  customerPhone?: string;
  applyTax?: boolean;
}

export interface SaleRecord {
  id: string;
  receipt_number: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name?: string;
  subtotal: number;
  tax_amount: number;
  tax_total?: number;
  grand_total: number;
  payment_method: string;
  amount_tendered: number | null;
  change_due: number | null;
  customer_phone: string | null;
  tax_breakdown_json: string;
  status: string;
  created_at: string;
  items?: {
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

export class SaleService {
  private db: Database.Database;
  private taxService: TaxService;
  private productService: ProductService;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
    this.taxService = new TaxService(this.db);
    this.productService = new ProductService(this.db);
  }

  public createSale(params: CreateSaleParams): SaleRecord {
    if (!params.items || params.items.length === 0) {
      throw new Error('Cannot process sale with zero items');
    }

    // Default primary branch if not provided
    let branchId = params.branchId;
    if (!branchId) {
      const primaryBranch = this.db.prepare(`
        SELECT id FROM branches WHERE tenant_id = ? AND is_primary = 1
      `).get(params.tenantId) as { id: string } | undefined;
      branchId = primaryBranch ? primaryBranch.id : 'br_default_osu';
    }

    // Calculate subtotal
    let subtotal = 0;
    const preparedItems = params.items.map((item) => {
      const qty = Math.max(1, Number(item.quantity));
      const price = Number(item.unitPrice);
      const lineTotal = Number((qty * price).toFixed(2));
      subtotal += lineTotal;
      return {
        ...item,
        quantity: qty,
        unitPrice: price,
        lineTotal
      };
    });

    subtotal = Number(subtotal.toFixed(2));

    // Calculate taxes
    let taxAmount = 0;
    let grandTotal = subtotal;
    let taxBreakdown = {
      taxType: 'not_registered',
      vatAmount: 0,
      nhilAmount: 0,
      getfundAmount: 0,
      totalTax: 0,
      grandTotal: subtotal
    };

    if (params.applyTax !== false) {
      const activeProfile = this.taxService.getActiveTaxProfile(params.tenantId);
      if (activeProfile && activeProfile.tax_type !== 'not_registered') {
        const taxCalc = this.taxService.calculateTaxes(subtotal, activeProfile);
        taxAmount = taxCalc.totalTax;
        grandTotal = taxCalc.grandTotal;
        taxBreakdown = {
          taxType: activeProfile.tax_type,
          vatAmount: taxCalc.vatAmount,
          nhilAmount: taxCalc.nhilAmount,
          getfundAmount: taxCalc.getfundAmount,
          totalTax: taxCalc.totalTax,
          grandTotal: taxCalc.grandTotal
        };
      }
    }

    // Amount tendered & change
    const tendered = params.amountTendered !== undefined ? Number(params.amountTendered) : grandTotal;
    const changeDue = Math.max(0, Number((tendered - grandTotal).toFixed(2)));

    const saleId = `sale_${crypto.randomBytes(8).toString('hex')}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `SK-${dateStr}-${randCode}`;
    const now = new Date().toISOString();

    const insertSaleStmt = this.db.prepare(`
      INSERT INTO sales (
        id, receipt_number, tenant_id, branch_id, cashier_id,
        subtotal, tax_total, grand_total, payment_method,
        amount_tendered, change_due, customer_phone, tax_breakdown_json,
        status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `);

    const insertItemStmt = this.db.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, tenant_id, product_name, quantity, unit_price, subtotal, line_total, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertSaleStmt.run(
        saleId,
        receiptNumber,
        params.tenantId,
        branchId,
        params.cashierId,
        subtotal,
        taxAmount,
        grandTotal,
        params.paymentMethod,
        tendered,
        changeDue,
        params.customerPhone || null,
        JSON.stringify(taxBreakdown),
        now
      );

      for (const item of preparedItems) {
        const itemId = `sitem_${crypto.randomBytes(6).toString('hex')}`;
        const prodId = item.productId || `prod_custom_${crypto.randomBytes(4).toString('hex')}`;
        insertItemStmt.run(
          itemId,
          saleId,
          prodId,
          params.tenantId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
          item.lineTotal,
          now
        );

        if (item.productId) {
          try {
            this.productService.adjustStock(params.tenantId, branchId, item.productId, -item.quantity);
          } catch {
            // Stock adjustment skipped if product stock tracking is disabled
          }
        }
      }
    });

    transaction();

    return this.getSaleById(params.tenantId, saleId)!;
  }

  public getSaleById(tenantId: string, saleId: string): SaleRecord | null {
    const sale = this.db.prepare(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.tenant_id = ? AND s.id = ?
    `).get(tenantId, saleId) as SaleRecord | undefined;

    if (!sale) return null;

    const items = this.db.prepare(`
      SELECT * FROM sale_items WHERE sale_id = ? AND tenant_id = ? ORDER BY rowid ASC
    `).all(saleId, tenantId) as SaleRecord['items'];

    const taxVal = Number((sale as any).tax_total ?? (sale as any).tax_amount ?? 0);

    return {
      ...sale,
      tax_amount: taxVal,
      tax_total: taxVal,
      items
    };
  }

  public getSales(tenantId: string, limit: number = 50): SaleRecord[] {
    const sales = this.db.prepare(`
      SELECT s.*, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE s.tenant_id = ?
      ORDER BY s.created_at DESC
      LIMIT ?
    `).all(tenantId, limit) as SaleRecord[];

    return sales.map(s => {
      const taxVal = Number((s as any).tax_total ?? (s as any).tax_amount ?? 0);
      return {
        ...s,
        tax_amount: taxVal,
        tax_total: taxVal,
      };
    });
  }

  public getTodaySummary(tenantId: string): {
    totalRevenue: number;
    transactionCount: number;
    cashTotal: number;
    momoTotal: number;
  } {
    const today = new Date().toISOString().slice(0, 10);
    const rows = this.db.prepare(`
      SELECT grand_total, payment_method
      FROM sales
      WHERE tenant_id = ? AND date(created_at) = date(?) AND status = 'completed'
    `).all(tenantId, today) as { grand_total: number; payment_method: string }[];

    let totalRevenue = 0;
    let cashTotal = 0;
    let momoTotal = 0;

    for (const row of rows) {
      totalRevenue += row.grand_total;
      if (row.payment_method === 'cash') {
        cashTotal += row.grand_total;
      } else {
        momoTotal += row.grand_total;
      }
    }

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      transactionCount: rows.length,
      cashTotal: Number(cashTotal.toFixed(2)),
      momoTotal: Number(momoTotal.toFixed(2))
    };
  }
}
