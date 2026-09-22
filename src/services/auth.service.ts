import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import { config } from '../config/env.ts';
import type { User, UserSummary, UserRole } from '../types/index.ts';
import { TenantService } from './tenant.service.ts';
import { AuditService } from './audit.service.ts';

export interface RegisterOwnerParams {
  tenantId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterCashierParams {
  tenantId: string;
  branchId: string;
  fullName: string;
  phoneNumber: string;
  pin: string; // 4 digits
  email?: string;
}

export class AuthService {
  private db: Database.Database;
  private tenantService: TenantService;
  private auditService: AuditService;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
    this.tenantService = new TenantService(this.db);
    this.auditService = new AuditService(this.db);
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public hashPin(pin: string, salt: string): string {
    return crypto.scryptSync(pin, salt, 32).toString('hex');
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public registerOwner(params: RegisterOwnerParams): UserSummary {
    const userId = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(params.password, salt);
    const now = new Date().toISOString();

    const insertStmt = this.db.prepare(`
      INSERT INTO users (id, tenant_id, full_name, email, phone_number, password_hash, salt, is_active, email_verified, phone_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
    `);

    insertStmt.run(
      userId,
      params.tenantId,
      params.fullName,
      params.email.toLowerCase().trim(),
      params.phoneNumber.trim(),
      passwordHash,
      salt,
      now,
      now
    );

    // Assign 'Owner' role
    this.tenantService.assignUserRole(params.tenantId, userId, 'Owner');

    this.auditService.record({
      tenantId: params.tenantId,
      userId,
      action: 'auth.owner_registered',
      entityType: 'user',
      entityId: userId,
      details: { email: params.email }
    });

    return this.getUserSummary(userId)!;
  }

  public registerCashier(params: RegisterCashierParams): UserSummary {
    if (!/^\d{4}$/.test(params.pin)) {
      throw new Error('Cashier PIN must be exactly 4 digits');
    }

    const userId = crypto.randomUUID();
    const pinSalt = crypto.randomBytes(16).toString('hex');
    const pinHash = this.hashPin(params.pin, pinSalt);
    const now = new Date().toISOString();
    const email = params.email || `cashier_${userId.substring(0, 8)}@sikapos.local`;

    const insertStmt = this.db.prepare(`
      INSERT INTO users (id, tenant_id, full_name, email, phone_number, pin_hash, pin_salt, is_active, email_verified, phone_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 1, ?, ?)
    `);

    insertStmt.run(
      userId,
      params.tenantId,
      params.fullName,
      email,
      params.phoneNumber.trim(),
      pinHash,
      pinSalt,
      now,
      now
    );

    // Assign 'Cashier' role
    this.tenantService.assignUserRole(params.tenantId, userId, 'Cashier');

    // Assign cashier to branch
    this.db.prepare(`
      INSERT INTO branch_users (branch_id, user_id, tenant_id, is_default, created_at)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(branch_id, user_id) DO NOTHING
    `).run(params.branchId, userId, params.tenantId, now);

    this.auditService.record({
      tenantId: params.tenantId,
      userId,
      action: 'auth.cashier_created',
      entityType: 'user',
      entityId: userId,
      details: { branchId: params.branchId, fullName: params.fullName }
    });

    return this.getUserSummary(userId)!;
  }

  public loginWithPassword(email: string, password: string, clientIp?: string, userAgent?: string): { token: string; user: UserSummary } {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.db.prepare(`
      SELECT * FROM users
      WHERE email = ? AND is_active = 1
    `).get(normalizedEmail) as User & { password_hash: string; salt: string } | undefined;

    if (!user || !user.password_hash || !user.salt) {
      throw new Error('Invalid email or password');
    }

    const computedHash = this.hashPassword(password, user.salt);
    const hashA = Buffer.from(computedHash, 'hex');
    const hashB = Buffer.from(user.password_hash, 'hex');

    const isMatch = hashA.length === hashB.length && crypto.timingSafeEqual(hashA, hashB);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    this.db.prepare('UPDATE users SET last_login_at = DATETIME("now") WHERE id = ?').run(user.id);

    const token = this.createSession(user.id, user.tenant_id);

    this.auditService.record({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'auth.login_password_success',
      entityType: 'session',
      ipAddress: clientIp,
      userAgent,
      details: { email: normalizedEmail }
    });

    return {
      token,
      user: this.getUserSummary(user.id)!
    };
  }

  public loginWithPin(tenantId: string, cashierId: string, pin: string, clientIp?: string, userAgent?: string): { token: string; user: UserSummary } {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    const user = this.db.prepare(`
      SELECT * FROM users
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `).get(cashierId, tenantId) as User & { pin_hash: string; pin_salt: string } | undefined;

    if (!user || !user.pin_hash || !user.pin_salt) {
      throw new Error('Invalid cashier PIN or inactive account');
    }

    const computedPinHash = this.hashPin(pin, user.pin_salt);
    const hashA = Buffer.from(computedPinHash, 'hex');
    const hashB = Buffer.from(user.pin_hash, 'hex');

    const isMatch = hashA.length === hashB.length && crypto.timingSafeEqual(hashA, hashB);
    if (!isMatch) {
      throw new Error('Invalid cashier PIN');
    }

    // Update last login
    this.db.prepare('UPDATE users SET last_login_at = DATETIME("now") WHERE id = ?').run(user.id);

    const token = this.createSession(user.id, user.tenant_id);

    this.auditService.record({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'auth.login_pin_success',
      entityType: 'session',
      ipAddress: clientIp,
      userAgent,
      details: { cashierId }
    });

    return {
      token,
      user: this.getUserSummary(user.id)!
    };
  }

  public createSession(userId: string, tenantId: string): string {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const sessionId = crypto.randomUUID();

    const expiresAt = new Date(Date.now() + config.sessionExpiryHours * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO auth_sessions (id, user_id, tenant_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, tenantId, tokenHash, expiresAt, createdAt);

    return rawToken;
  }

  public validateSession(token: string): { user: UserSummary; tenantId: string } | null {
    if (!token) return null;

    const tokenHash = this.hashToken(token);
    const session = this.db.prepare(`
      SELECT s.*, u.is_active FROM auth_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > DATETIME('now') AND u.is_active = 1
    `).get(tokenHash) as { user_id: string; tenant_id: string; is_active: number } | undefined;

    if (!session) return null;

    const userSummary = this.getUserSummary(session.user_id);
    if (!userSummary) return null;

    return {
      user: userSummary,
      tenantId: session.tenant_id
    };
  }

  public logout(token: string): void {
    const tokenHash = this.hashToken(token);
    this.db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
  }

  public getUserSummary(userId: string): UserSummary | null {
    const user = this.db.prepare(`
      SELECT id, tenant_id, full_name, email, phone_number, is_active, email_verified, phone_verified
      FROM users
      WHERE id = ?
    `).get(userId) as {
      id: string;
      tenant_id: string;
      full_name: string;
      email: string;
      phone_number: string;
      is_active: number;
      email_verified: number;
      phone_verified: number;
    } | undefined;

    if (!user) return null;

    const roles = this.tenantService.getUserRoles(userId);
    const permissions = this.tenantService.getUserPermissions(userId);

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      is_active: user.is_active === 1,
      email_verified: user.email_verified === 1,
      phone_verified: user.phone_verified === 1,
      roles,
      permissions
    };
  }
}
