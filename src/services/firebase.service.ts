import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import { getFirestoreDb, isFirebaseAdminConfigured } from '../lib/firebase-admin.ts';
import type { UserSummary, Tenant, Branch } from '../types/index.ts';

export class FirebaseService {
  private db: Database.Database;

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  /**
   * Sync a Tenant and primary Branch to Firestore
   */
  public async syncTenant(tenant: Partial<Tenant> | null, branch?: Partial<Branch> | null): Promise<void> {
    if (!isFirebaseAdminConfigured()) return;
    try {
      if (!tenant || !tenant.id) return;
      const firestore = getFirestoreDb();
      await firestore.collection('tenants').doc(tenant.id).set(
        {
          ...tenant,
          ...(branch ? { primaryBranch: branch } : {}),
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('Cloud Firestore API has not been used')) {
        // Silently skip if Firestore API is disabled in GCP
        return;
      }
      console.warn('[FirebaseService] Failed to sync tenant to Firestore:', err?.message || err);
    }
  }

  /**
   * Sync a User to Firestore
   */
  public async syncUser(user: UserSummary, firebaseUid?: string): Promise<void> {
    if (!isFirebaseAdminConfigured()) return;
    try {
      if (!user || !user.id) return;
      const firestore = getFirestoreDb();
      const uid = firebaseUid || (user as any).firebase_uid || null;

      await firestore.collection('users').doc(user.id).set(
        {
          id: user.id,
          tenant_id: user.tenant_id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          roles: user.roles || [],
          is_active: user.is_active ?? true,
          firebase_uid: uid,
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (uid) {
        await firestore.collection('firebase_users').doc(uid).set(
          {
            userId: user.id,
            tenantId: user.tenant_id,
            email: user.email || null,
            phoneNumber: user.phone_number || null,
            syncedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('Cloud Firestore API has not been used')) {
        return;
      }
      console.warn('[FirebaseService] Failed to sync user to Firestore:', err?.message || err);
    }
  }

  /**
   * Find an existing user or restore them from Firestore if SQLite was wiped
   */
  public async findOrRestoreFirebaseUser(
    firebaseUid: string,
    email?: string,
    phoneNumber?: string
  ): Promise<{ user: UserSummary; tenantId: string } | null> {
    // 1. Check local SQLite
    let localUser = firebaseUid
      ? (this.db.prepare('SELECT * FROM users WHERE firebase_uid = ?').get(firebaseUid) as any)
      : null;

    if (!localUser && email) {
      localUser = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (localUser && firebaseUid) {
        this.db.prepare('UPDATE users SET firebase_uid = ? WHERE id = ?').run(firebaseUid, localUser.id);
      }
    }

    if (!localUser && phoneNumber) {
      localUser = this.db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber) as any;
      if (localUser && firebaseUid) {
        this.db.prepare('UPDATE users SET firebase_uid = ? WHERE id = ?').run(firebaseUid, localUser.id);
      }
    }

    if (localUser) {
      const summary = this.getUserSummary(localUser.id);
      if (summary) {
        if (firebaseUid) {
          this.syncUser(summary, firebaseUid).catch(() => {});
        }
        return { user: summary, tenantId: localUser.tenant_id };
      }
    }

    // 2. Not in local SQLite -> Query Firestore (handles Render ephemeral disk reset!)
    if (!isFirebaseAdminConfigured()) {
      return null;
    }

    try {
      const firestore = getFirestoreDb();

      let firestoreUserData: any = null;

      if (firebaseUid) {
        const fbUserDoc = await firestore.collection('firebase_users').doc(firebaseUid).get();
        if (fbUserDoc.exists) {
          const mapping = fbUserDoc.data()!;
          const uDoc = await firestore.collection('users').doc(mapping.userId).get();
          if (uDoc.exists) {
            firestoreUserData = uDoc.data();
          }
        }
      }

      if (!firestoreUserData && email) {
        const qEmail = await firestore.collection('users').where('email', '==', email).limit(1).get();
        if (!qEmail.empty) {
          firestoreUserData = qEmail.docs[0].data();
        }
      }

      if (!firestoreUserData && phoneNumber) {
        const qPhone = await firestore.collection('users').where('phone_number', '==', phoneNumber).limit(1).get();
        if (!qPhone.empty) {
          firestoreUserData = qPhone.docs[0].data();
        }
      }

      if (!firestoreUserData) {
        return null;
      }

      // Restore Tenant and User into SQLite
      const tenantId = firestoreUserData.tenant_id || firestoreUserData.tenantId;
      const tenantDoc = await firestore.collection('tenants').doc(tenantId).get();

      if (tenantDoc.exists) {
        const tData = tenantDoc.data()!;
        this.db.prepare(`
          INSERT INTO tenants (id, legal_name, business_name, trade_category, currency_code, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
          ON CONFLICT(id) DO UPDATE SET
            business_name = excluded.business_name,
            legal_name = excluded.legal_name
        `).run(
          tenantId,
          tData.legal_name || tData.legalName || tData.business_name || 'Business',
          tData.business_name || tData.businessName || 'Business',
          tData.trade_category || tData.tradeCategory || 'general_retail',
          tData.currency_code || tData.currencyCode || 'GHS',
          tData.status || 'active'
        );

        const pb = tData.primaryBranch;
        if (pb) {
          this.db.prepare(`
            INSERT INTO branches (id, tenant_id, name, is_primary, region, gps_digital_address, physical_address, phone, status, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'active', DATETIME('now'), DATETIME('now'))
            ON CONFLICT(id) DO NOTHING
          `).run(
            pb.id || `br_${tenantId}_1`,
            tenantId,
            pb.name || 'Main Branch',
            pb.region || 'Greater Accra',
            pb.gps_digital_address || pb.gpsDigitalAddress || 'GA-000-0000',
            pb.physical_address || pb.physicalAddress || 'Accra',
            pb.phone || firestoreUserData.phone_number || '0000000000'
          );
        }
      }

      // Restore User into SQLite
      this.db.prepare(`
        INSERT INTO users (id, tenant_id, full_name, email, phone_number, is_active, firebase_uid, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
        ON CONFLICT(id) DO UPDATE SET
          firebase_uid = excluded.firebase_uid,
          is_active = excluded.is_active
      `).run(
        firestoreUserData.id,
        tenantId,
        firestoreUserData.full_name || firestoreUserData.fullName || 'Store User',
        firestoreUserData.email || '',
        firestoreUserData.phone_number || firestoreUserData.phoneNumber || '',
        firestoreUserData.is_active ? 1 : 0,
        firebaseUid || firestoreUserData.firebase_uid || null
      );

      // Restore User Role
      const roleName = (firestoreUserData.roles && firestoreUserData.roles[0]) || 'Owner';
      const roleRow = this.db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as any;
      if (roleRow) {
        this.db.prepare(`
          INSERT INTO user_roles (user_id, role_id, tenant_id)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, role_id) DO NOTHING
        `).run(firestoreUserData.id, roleRow.id, tenantId);
      }

      const summary = this.getUserSummary(firestoreUserData.id);
      if (summary) {
        return { user: summary, tenantId };
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('Cloud Firestore API has not been used')) {
        // Firestore not enabled in GCP project; gracefully continue with local database
        return null;
      }
      console.error('[FirebaseService] Error restoring user from Firestore:', err?.message || err);
    }

    return null;

  }

  private getUserSummary(userId: string): UserSummary | null {
    const row = this.db.prepare(`
      SELECT u.id, u.tenant_id, u.full_name, u.email, u.phone_number, u.is_active, u.email_verified, u.phone_verified, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
    `).get(userId) as any;

    if (!row) return null;

    return {
      id: row.id,
      tenant_id: row.tenant_id,
      full_name: row.full_name,
      email: row.email,
      phone_number: row.phone_number,
      is_active: Boolean(row.is_active),
      email_verified: Boolean(row.email_verified),
      phone_verified: Boolean(row.phone_verified),
      roles: row.role ? [row.role] : ['Cashier'],
      permissions: [],
    };
  }
}
