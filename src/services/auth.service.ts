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

export class MultipleTenantsError extends Error {
  public code = 'MULTIPLE_TENANTS_FOUND';
  public tenants: Array<{ id: string; businessName: string; legalName: string }>;

  constructor(tenants: Array<{ id: string; businessName: string; legalName: string }>) {
    super('Account belongs to multiple organizations. Please specify tenantId.');
    this.name = 'MultipleTenantsError';
    this.tenants = tenants;
  }
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
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 1, ?, ?)
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

  /**
   * Password Authentication with Multi-Tenant Disambiguation.
   * If an email exists across multiple tenants:
   *   - If tenantId is not provided: Throws MultipleTenantsError with tenant options.
   *   - If tenantId is provided: Authenticates strictly against that tenant.
   * If an email exists in only one tenant: Authenticates against that tenant directly.
   */
  public loginWithPassword(
    email: string,
    password: string,
    tenantId?: string,
    clientIp?: string,
    userAgent?: string
  ): { token: string; user: UserSummary; tenantId: string } {
    const normalizedEmail = email.toLowerCase().trim();

    // Query all active accounts matching this email across organizations
    const matchingUsers = this.db.prepare(`
      SELECT u.*, t.business_name, t.legal_name
      FROM users u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE u.email = ? AND u.is_active = 1
    `).all(normalizedEmail) as Array<User & {
      password_hash: string;
      salt: string;
      business_name: string;
      legal_name: string;
    }>;

    if (matchingUsers.length === 0) {
      this.auditService.record({
        action: 'auth.login_password_failure',
        entityType: 'session',
        ipAddress: clientIp,
        userAgent,
        details: { email: normalizedEmail, reason: 'user_not_found' }
      });
      throw new Error('Invalid email or password');
    }

    let targetUser: (User & { password_hash: string; salt: string }) | undefined;

    if (tenantId) {
      // Strictly resolve to specified tenant
      targetUser = matchingUsers.find(u => u.tenant_id === tenantId);
      if (!targetUser) {
        this.auditService.record({
          tenantId,
          action: 'auth.login_password_failure',
          entityType: 'session',
          ipAddress: clientIp,
          userAgent,
          details: { email: normalizedEmail, tenantId, reason: 'tenant_mismatch' }
        });
        throw new Error('Invalid email or password');
      }
    } else {
      if (matchingUsers.length > 1) {
        // Disambiguation required: same email belongs to multiple tenants
        const tenantOptions = matchingUsers.map(u => ({
          id: u.tenant_id,
          businessName: u.business_name,
          legalName: u.legal_name
        }));
        throw new MultipleTenantsError(tenantOptions);
      }
      targetUser = matchingUsers[0];
    }

    if (!targetUser.password_hash || !targetUser.salt) {
      this.auditService.record({
        tenantId: targetUser.tenant_id,
        userId: targetUser.id,
        action: 'auth.login_password_failure',
        entityType: 'session',
        ipAddress: clientIp,
        userAgent,
        details: { email: normalizedEmail, reason: 'missing_credentials' }
      });
      throw new Error('Invalid email or password');
    }

    const computedHash = this.hashPassword(password, targetUser.salt);
    const hashA = Buffer.from(computedHash, 'hex');
    const hashB = Buffer.from(targetUser.password_hash, 'hex');

    const isMatch = hashA.length === hashB.length && crypto.timingSafeEqual(hashA, hashB);
    if (!isMatch) {
      this.auditService.record({
        tenantId: targetUser.tenant_id,
        userId: targetUser.id,
        action: 'auth.login_password_failure',
        entityType: 'session',
        ipAddress: clientIp,
        userAgent,
        details: { email: normalizedEmail, reason: 'invalid_password' }
      });
      throw new Error('Invalid email or password');
    }

    // Update last login
    this.db.prepare("UPDATE users SET last_login_at = DATETIME('now') WHERE id = ?").run(targetUser.id);

    const token = this.createSession(targetUser.id, targetUser.tenant_id);

    this.auditService.record({
      tenantId: targetUser.tenant_id,
      userId: targetUser.id,
      action: 'auth.login_password_success',
      entityType: 'session',
      ipAddress: clientIp,
      userAgent,
      details: { email: normalizedEmail }
    });

    return {
      token,
      user: this.getUserSummary(targetUser.id)!,
      tenantId: targetUser.tenant_id
    };
  }

  public loginWithPin(
    tenantId: string,
    cashierId: string,
    pin: string,
    clientIp?: string,
    userAgent?: string
  ): { token: string; user: UserSummary; tenantId: string } {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    const user = this.db.prepare(`
      SELECT * FROM users
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `).get(cashierId, tenantId) as User & { pin_hash: string; pin_salt: string } | undefined;

    if (!user || !user.pin_hash || !user.pin_salt) {
      this.auditService.record({
        tenantId,
        action: 'auth.login_pin_failure',
        entityType: 'session',
        ipAddress: clientIp,
        userAgent,
        details: { cashierId, reason: 'cashier_not_found' }
      });
      throw new Error('Invalid cashier PIN or inactive account');
    }

    const computedPinHash = this.hashPin(pin, user.pin_salt);
    const hashA = Buffer.from(computedPinHash, 'hex');
    const hashB = Buffer.from(user.pin_hash, 'hex');

    const isMatch = hashA.length === hashB.length && crypto.timingSafeEqual(hashA, hashB);
    if (!isMatch) {
      this.auditService.record({
        tenantId: user.tenant_id,
        userId: user.id,
        action: 'auth.login_pin_failure',
        entityType: 'session',
        ipAddress: clientIp,
        userAgent,
        details: { cashierId, reason: 'incorrect_pin' }
      });
      throw new Error('Invalid cashier PIN');
    }

    // Update last login
    this.db.prepare("UPDATE users SET last_login_at = DATETIME('now') WHERE id = ?").run(user.id);

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
      user: this.getUserSummary(user.id)!,
      tenantId: user.tenant_id
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
    const nowIso = new Date().toISOString();
    const session = this.db.prepare(`
      SELECT s.*, u.is_active FROM auth_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1
    `).get(tokenHash, nowIso) as { user_id: string; tenant_id: string; is_active: number } | undefined;

    if (!session) return null;

    const userSummary = this.getUserSummary(session.user_id);
    if (!userSummary) return null;

    return {
      user: userSummary,
      tenantId: session.tenant_id
    };
  }

  /**
   * Revoke a single active session (standard logout).
   */
  public logout(token: string): void {
    const tokenHash = this.hashToken(token);
    const session = this.db.prepare('SELECT user_id, tenant_id FROM auth_sessions WHERE token_hash = ?').get(tokenHash) as {
      user_id: string;
      tenant_id: string;
    } | undefined;

    this.db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);

    if (session) {
      this.auditService.record({
        tenantId: session.tenant_id,
        userId: session.user_id,
        action: 'auth.logout',
        entityType: 'session'
      });
    }
  }

  /**
   * Revoke all active sessions for a user (triggered upon password or PIN change/reset).
   */
  public revokeUserSessions(userId: string): number {
    const user = this.db.prepare('SELECT tenant_id FROM users WHERE id = ?').get(userId) as { tenant_id: string } | undefined;
    const result = this.db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);

    this.auditService.record({
      tenantId: user ? user.tenant_id : null,
      userId,
      action: 'auth.user_sessions_revoked',
      entityType: 'user',
      entityId: userId,
      details: { revokedCount: result.changes }
    });

    return result.changes;
  }

  /**
   * Securely update password and revoke all existing sessions.
   */
  public updatePassword(userId: string, newPassword: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(newPassword, salt);
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE users
      SET password_hash = ?, salt = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, salt, now, userId);

    // Revoke all existing sessions for security
    this.revokeUserSessions(userId);

    const user = this.db.prepare('SELECT tenant_id FROM users WHERE id = ?').get(userId) as { tenant_id: string } | undefined;
    this.auditService.record({
      tenantId: user?.tenant_id,
      userId,
      action: 'auth.password_updated',
      entityType: 'user',
      entityId: userId
    });
  }

  /**
   * Securely update cashier PIN and revoke all existing sessions.
   */
  public updateCashierPin(userId: string, newPin: string): void {
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('Cashier PIN must be exactly 4 digits');
    }

    const pinSalt = crypto.randomBytes(16).toString('hex');
    const pinHash = this.hashPin(newPin, pinSalt);
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE users
      SET pin_hash = ?, pin_salt = ?, updated_at = ?
      WHERE id = ?
    `).run(pinHash, pinSalt, now, userId);

    // Revoke all existing sessions for security
    this.revokeUserSessions(userId);

    const user = this.db.prepare('SELECT tenant_id FROM users WHERE id = ?').get(userId) as { tenant_id: string } | undefined;
    this.auditService.record({
      tenantId: user?.tenant_id,
      userId,
      action: 'auth.pin_updated',
      entityType: 'user',
      entityId: userId
    });
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
