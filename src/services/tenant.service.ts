import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import type { Tenant, Branch, User, UserSummary, UserRole } from '../types/index.ts';
import { TaxService } from './tax.service.ts';

export interface CreateTenantParams {
  legalName: string;
  businessName: string;
  tradeCategory: 'provision_supermarket' | 'pharmacy' | 'fashion' | 'electronics' | 'general_retail';
  primaryBranch: {
    name: string;
    region: string;
    gpsDigitalAddress: string;
    physicalAddress: string;
    phone: string;
  };
  taxConfiguration?: {
    taxType: 'not_registered' | 'standard_gra' | 'custom';
    customVatRate?: number;
    customNhilRate?: number;
    customGetfundRate?: number;
  };
}

export class TenantService {
  private db: Database.Database;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  public createTenant(params: CreateTenantParams): { tenant: Tenant; primaryBranch: Branch } {
    const tenantId = crypto.randomUUID();
    const branchId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertTenantStmt = this.db.prepare(`
      INSERT INTO tenants (id, legal_name, business_name, trade_category, currency_code, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'GHS', 'active', ?, ?)
    `);

    const insertBranchStmt = this.db.prepare(`
      INSERT INTO branches (id, tenant_id, name, is_primary, region, gps_digital_address, physical_address, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'active', ?, ?)
    `);

    const taxService = new TaxService(this.db);

    const transaction = this.db.transaction(() => {
      insertTenantStmt.run(
        tenantId,
        params.legalName,
        params.businessName,
        params.tradeCategory,
        now,
        now
      );

      insertBranchStmt.run(
        branchId,
        tenantId,
        params.primaryBranch.name,
        params.primaryBranch.region,
        params.primaryBranch.gpsDigitalAddress,
        params.primaryBranch.physicalAddress,
        params.primaryBranch.phone,
        now,
        now
      );

      // Initialize default or specified tax profile
      const taxType = params.taxConfiguration?.taxType || 'standard_gra';
      taxService.setTaxProfile(tenantId, {
        taxType,
        customVatRate: params.taxConfiguration?.customVatRate,
        customNhilRate: params.taxConfiguration?.customNhilRate,
        customGetfundRate: params.taxConfiguration?.customGetfundRate,
      });
    });

    transaction();

    const tenant = this.getTenantById(tenantId)!;
    const primaryBranch = this.getBranchById(tenantId, branchId)!;

    return { tenant, primaryBranch };
  }

  public getTenantById(tenantId: string): Tenant | null {
    const row = this.db.prepare(`
      SELECT * FROM tenants WHERE id = ?
    `).get(tenantId) as Tenant | undefined;

    return row || null;
  }

  public getBranches(tenantId: string): Branch[] {
    const rows = this.db.prepare(`
      SELECT * FROM branches
      WHERE tenant_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `).all(tenantId) as Array<{
      id: string;
      tenant_id: string;
      name: string;
      is_primary: number;
      region: string;
      gps_digital_address: string;
      physical_address: string;
      phone: string;
      status: 'active' | 'inactive';
      created_at: string;
      updated_at: string;
    }>;

    return rows.map(r => ({
      ...r,
      is_primary: r.is_primary === 1
    }));
  }

  public getBranchById(tenantId: string, branchId: string): Branch | null {
    const row = this.db.prepare(`
      SELECT * FROM branches
      WHERE id = ? AND tenant_id = ?
    `).get(branchId, tenantId) as {
      id: string;
      tenant_id: string;
      name: string;
      is_primary: number;
      region: string;
      gps_digital_address: string;
      physical_address: string;
      phone: string;
      status: 'active' | 'inactive';
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
      ...row,
      is_primary: row.is_primary === 1
    };
  }

  public createBranch(tenantId: string, params: {
    name: string;
    region: string;
    gpsDigitalAddress: string;
    physicalAddress: string;
    phone: string;
    isPrimary?: boolean;
  }): Branch {
    const branchId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (params.isPrimary) {
      this.db.prepare(`
        UPDATE branches
        SET is_primary = 0, updated_at = ?
        WHERE tenant_id = ?
      `).run(now, tenantId);
    }

    this.db.prepare(`
      INSERT INTO branches (id, tenant_id, name, is_primary, region, gps_digital_address, physical_address, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      branchId,
      tenantId,
      params.name,
      params.isPrimary ? 1 : 0,
      params.region,
      params.gpsDigitalAddress,
      params.physicalAddress,
      params.phone,
      now,
      now
    );

    return this.getBranchById(tenantId, branchId)!;
  }

  public getTenantUsers(tenantId: string): UserSummary[] {
    const users = this.db.prepare(`
      SELECT id, tenant_id, full_name, email, phone_number, is_active, email_verified, phone_verified
      FROM users
      WHERE tenant_id = ?
    `).all(tenantId) as Array<{
      id: string;
      tenant_id: string;
      full_name: string;
      email: string;
      phone_number: string;
      is_active: number;
      email_verified: number;
      phone_verified: number;
    }>;

    return users.map(u => {
      const roles = this.getUserRoles(u.id);
      const permissions = this.getUserPermissions(u.id);

      return {
        id: u.id,
        tenant_id: u.tenant_id,
        full_name: u.full_name,
        email: u.email,
        phone_number: u.phone_number,
        is_active: u.is_active === 1,
        email_verified: u.email_verified === 1,
        phone_verified: u.phone_verified === 1,
        roles,
        permissions
      };
    });
  }

  public assignUserRole(tenantId: string, userId: string, roleName: UserRole): void {
    // Verify user belongs to tenant
    const user = this.db.prepare('SELECT id FROM users WHERE id = ? AND tenant_id = ?').get(userId, tenantId);
    if (!user) {
      throw new Error('User does not belong to this tenant');
    }

    const role = this.db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: string } | undefined;
    if (!role) {
      throw new Error(`Role ${roleName} does not exist`);
    }

    this.db.prepare(`
      INSERT INTO user_roles (user_id, role_id, tenant_id, created_at)
      VALUES (?, ?, ?, DATETIME('now'))
      ON CONFLICT(user_id, role_id) DO NOTHING
    `).run(userId, role.id, tenantId);
  }

  public getUserRoles(userId: string): string[] {
    const rows = this.db.prepare(`
      SELECT r.name FROM roles r
      INNER JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(userId) as Array<{ name: string }>;

    return rows.map(r => r.name);
  }

  public getUserPermissions(userId: string): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT p.code FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ?
    `).all(userId) as Array<{ code: string }>;

    return rows.map(r => r.code);
  }
}
