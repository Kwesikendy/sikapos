import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import type { AuditLog } from '../types/index.js';

export interface RecordAuditParams {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}

export class AuditService {
  private db: Database.Database;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  public record(params: RecordAuditParams): AuditLog {
    const id = crypto.randomUUID();
    const detailsJson = JSON.stringify(params.details || {});
    const createdAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.tenantId || null,
      params.userId || null,
      params.action,
      params.entityType,
      params.entityId || null,
      params.ipAddress || null,
      params.userAgent || null,
      detailsJson,
      createdAt
    );

    return {
      id,
      tenant_id: params.tenantId || null,
      user_id: params.userId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      details: params.details || {},
      created_at: createdAt
    };
  }

  public getTenantAuditLogs(tenantId: string, limit = 50): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT id, tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent, details_json, created_at
      FROM audit_logs
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(tenantId, limit) as Array<{
      id: string;
      tenant_id: string | null;
      user_id: string | null;
      action: string;
      entity_type: string;
      entity_id: string | null;
      ip_address: string | null;
      user_agent: string | null;
      details_json: string;
      created_at: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      tenant_id: r.tenant_id,
      user_id: r.user_id,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      details: JSON.parse(r.details_json || '{}'),
      created_at: r.created_at
    }));
  }
}
