import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getDb } from './connection.ts';
import type Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase(db?: Database.Database): Database.Database {
  const database = db || getDb();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema
  database.exec(schemaSql);

  // Seed core roles and permissions
  seedRolesAndPermissions(database);

  return database;
}

function seedRolesAndPermissions(db: Database.Database): void {
  const permissionsList = [
    { code: 'products.view', module: 'products', description: 'View product catalog and pricing' },
    { code: 'products.create', module: 'products', description: 'Create new products and SKUs' },
    { code: 'products.update', module: 'products', description: 'Edit existing products and pricing' },
    { code: 'products.delete', module: 'products', description: 'Delete or archive products' },

    { code: 'inventory.view', module: 'inventory', description: 'View stock levels across branches' },
    { code: 'inventory.adjust', module: 'inventory', description: 'Adjust stock quantities directly' },
    { code: 'inventory.receive', module: 'inventory', description: 'Receive new purchase orders' },
    { code: 'inventory.count', module: 'inventory', description: 'Perform stocktaking counts' },

    { code: 'sales.view', module: 'sales', description: 'View receipts and transaction records' },
    { code: 'sales.create', module: 'sales', description: 'Ring up sales and process checkout' },
    { code: 'sales.refund', module: 'sales', description: 'Process returns, voids and refunds' },

    { code: 'customers.view', module: 'customers', description: 'View customer accounts and loyalty' },
    { code: 'customers.create', module: 'customers', description: 'Create customer profiles' },
    { code: 'customers.update', module: 'customers', description: 'Edit customer profiles' },

    { code: 'reports.view', module: 'reports', description: 'View daily sales, audits, and VAT reports' },
    { code: 'employees.manage', module: 'employees', description: 'Manage staff, PINs, and permissions' },
    { code: 'settings.manage', module: 'settings', description: 'Manage store configuration and tax' },
    { code: 'subscription.manage', module: 'subscription', description: 'Manage billing and plan tier' },
  ];

  const insertPermStmt = db.prepare(`
    INSERT INTO permissions (id, code, module, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(code) DO NOTHING
  `);

  const permMap = new Map<string, string>();
  for (const perm of permissionsList) {
    const id = crypto.randomUUID();
    insertPermStmt.run(id, perm.code, perm.module, perm.description);
  }

  // Retrieve actual permission IDs
  const allPerms = db.prepare('SELECT id, code FROM permissions').all() as Array<{ id: string; code: string }>;
  for (const p of allPerms) {
    permMap.set(p.code, p.id);
  }

  // Define roles
  const rolesList = [
    { name: 'Owner', description: 'Full business owner with unrestricted access across all branches' },
    { name: 'Manager', description: 'Store manager with inventory, reporting, staff, and sales authority' },
    { name: 'Cashier', description: 'Front-desk point-of-sale operator ringing up transactions' },
    { name: 'Inventory Staff', description: 'Warehouse and shelf attendant responsible for stock counts and receiving' },
    { name: 'Platform Admin', description: 'Akoma Commerce Cloud platform operator (isolated from tenant data)' },
  ];

  const insertRoleStmt = db.prepare(`
    INSERT INTO roles (id, name, description, is_system)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(name) DO NOTHING
  `);

  for (const r of rolesList) {
    insertRoleStmt.run(crypto.randomUUID(), r.name, r.description);
  }

  const allRoles = db.prepare('SELECT id, name FROM roles').all() as Array<{ id: string; name: string }>;
  const roleMap = new Map<string, string>();
  for (const r of allRoles) {
    roleMap.set(r.name, r.id);
  }

  // Define role-permission matrix
  const roleAssignments: Record<string, string[]> = {
    Owner: [
      'products.view', 'products.create', 'products.update', 'products.delete',
      'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.count',
      'sales.view', 'sales.create', 'sales.refund',
      'customers.view', 'customers.create', 'customers.update',
      'reports.view', 'employees.manage', 'settings.manage', 'subscription.manage'
    ],
    Manager: [
      'products.view', 'products.create', 'products.update',
      'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.count',
      'sales.view', 'sales.create', 'sales.refund',
      'customers.view', 'customers.create', 'customers.update',
      'reports.view', 'employees.manage', 'settings.manage'
    ],
    Cashier: [
      'sales.view', 'sales.create',
      'customers.view', 'customers.create',
      'products.view'
    ],
    'Inventory Staff': [
      'products.view',
      'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.count'
    ],
    'Platform Admin': []
  };

  const insertRolePermStmt = db.prepare(`
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (?, ?)
    ON CONFLICT(role_id, permission_id) DO NOTHING
  `);

  for (const [roleName, permCodes] of Object.entries(roleAssignments)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const code of permCodes) {
      const permId = permMap.get(code);
      if (permId) {
        insertRolePermStmt.run(roleId, permId);
      }
    }
  }
}
