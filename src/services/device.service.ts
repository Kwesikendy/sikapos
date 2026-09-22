import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import type { Device, OfflineSyncEvent } from '../types/index.ts';
import { AuditService } from './audit.service.ts';

export interface RegisterDeviceParams {
  tenantId: string;
  branchId: string;
  deviceName: string;
  deviceIdentifier: string;
  deviceType: 'pos_terminal' | 'tablet' | 'mobile' | 'desktop';
  hardwareModel: string;
}

export class DeviceService {
  private db: Database.Database;
  private auditService: AuditService;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
    this.auditService = new AuditService(this.db);
  }

  public registerDevice(params: RegisterDeviceParams): Device {
    // Ensure branch belongs to tenant
    const branch = this.db.prepare('SELECT id FROM branches WHERE id = ? AND tenant_id = ?').get(params.branchId, params.tenantId);
    if (!branch) {
      throw new Error('Branch does not belong to specified tenant');
    }

    const existing = this.db.prepare('SELECT * FROM devices WHERE device_identifier = ?').get(params.deviceIdentifier) as Device | undefined;
    const now = new Date().toISOString();

    if (existing) {
      if (existing.tenant_id !== params.tenantId) {
        throw new Error('Device identifier already registered under another merchant organization');
      }

      this.db.prepare(`
        UPDATE devices
        SET branch_id = ?, device_name = ?, device_type = ?, hardware_model = ?, updated_at = ?
        WHERE id = ?
      `).run(params.branchId, params.deviceName, params.deviceType, params.hardwareModel, now, existing.id);

      return this.getDeviceById(params.tenantId, existing.id)!;
    }

    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO devices (id, tenant_id, branch_id, device_name, device_identifier, device_type, hardware_model, last_heartbeat_at, sync_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)
    `).run(
      id,
      params.tenantId,
      params.branchId,
      params.deviceName,
      params.deviceIdentifier,
      params.deviceType,
      params.hardwareModel,
      now,
      now,
      now
    );

    this.auditService.record({
      tenantId: params.tenantId,
      action: 'device.registered',
      entityType: 'device',
      entityId: id,
      details: { identifier: params.deviceIdentifier, model: params.hardwareModel }
    });

    return this.getDeviceById(params.tenantId, id)!;
  }

  public getDeviceById(tenantId: string, deviceId: string): Device | null {
    const row = this.db.prepare(`
      SELECT * FROM devices WHERE id = ? AND tenant_id = ?
    `).get(deviceId, tenantId) as Device | undefined;

    return row || null;
  }

  public getBranchDevices(tenantId: string, branchId: string): Device[] {
    const rows = this.db.prepare(`
      SELECT * FROM devices WHERE tenant_id = ? AND branch_id = ?
    `).all(tenantId, branchId) as Device[];

    return rows;
  }

  public recordHeartbeat(tenantId: string, deviceIdentifier: string): { acknowledged: boolean; serverTime: string } {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      UPDATE devices
      SET last_heartbeat_at = ?, updated_at = ?
      WHERE device_identifier = ? AND tenant_id = ?
    `).run(now, now, deviceIdentifier, tenantId);

    return {
      acknowledged: result.changes > 0,
      serverTime: now
    };
  }

  /**
   * Architectural foundation for future Phase 11 local transaction synchronization.
   * Enforces idempotent duplicate prevention via unique client_event_id.
   * NOTE: Full multi-master offline data synchronization will be implemented in Phase 11.
   */
  public queueOfflineSyncEvent(tenantId: string, deviceId: string, clientEventId: string, eventType: string, payload: Record<string, unknown>): { status: 'received' | 'duplicate'; eventId: string } {
    // Check if event was already received (idempotency check)
    const existing = this.db.prepare(`
      SELECT id FROM offline_sync_events
      WHERE client_event_id = ?
    `).get(clientEventId) as { id: string } | undefined;

    if (existing) {
      return { status: 'duplicate', eventId: existing.id };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO offline_sync_events (id, tenant_id, device_id, client_event_id, event_type, payload_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'received', ?)
    `).run(id, tenantId, deviceId, clientEventId, eventType, JSON.stringify(payload), now);

    return { status: 'received', eventId: id };
  }
}
