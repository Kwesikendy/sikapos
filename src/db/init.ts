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

  const schemaPhase3Path = path.join(__dirname, 'schema_phase3.sql');
  const schemaPhase3Sql = fs.readFileSync(schemaPhase3Path, 'utf8');

  // Execute schemas
  database.exec(schemaSql);
  database.exec(schemaPhase3Sql);

  // ── Column migrations ────────────────────────────────────────────────────────
  // SQLite has no "ALTER TABLE … ADD COLUMN IF NOT EXISTS", so we attempt each
  // missing column and silently swallow the "duplicate column" error.
  const safeAddColumn = (table: string, column: string, definition: string) => {
    try {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {
      // Column already exists — safe to ignore
    }
  };

  // sale_items: schema_phase3 created this table without product_name / line_total
  safeAddColumn('sale_items', 'product_name', 'TEXT NOT NULL DEFAULT ""');
  safeAddColumn('sale_items', 'line_total',   'REAL NOT NULL DEFAULT 0');
  // users: firebase_uid for Firebase Auth integration
  safeAddColumn('users', 'firebase_uid', 'TEXT');
  try {
    database.exec('CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)');
  } catch {
    // Ignore index creation error
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Seed core roles and permissions
  seedRolesAndPermissions(database);

  // Seed default demo merchant & staff profiles for Cashier/Admin interfaces
  seedDemoMerchant(database);

  return database;

}

function seedDemoMerchant(db: Database.Database): void {
  const tenantId = 'ten_default_osu';
  const branchId = 'br_default_osu';

  // Seed tenant
  db.prepare(`
    INSERT INTO tenants (id, legal_name, business_name, trade_category, currency_code, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    tenantId,
    'Mensah Stores Ghana Ltd',
    'Mensah Stores Osu',
    'general_retail',
    'GHS',
    'active'
  );

  // Seed branch
  db.prepare(`
    INSERT INTO branches (id, tenant_id, name, is_primary, region, gps_digital_address, physical_address, phone, status)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    branchId,
    tenantId,
    'Osu Oxford St. Branch',
    'Greater Accra',
    'GA-183-9024',
    'Oxford Street, Osu, Accra',
    '0244123456',
    'active'
  );

  // Helper for password & PIN hashing
  const hashPassword = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString('hex');
  const hashPin = (pin: string, salt: string) => crypto.scryptSync(pin, salt, 32).toString('hex');

  const ownerSalt = crypto.randomBytes(16).toString('hex');
  const ownerPinSalt = crypto.randomBytes(16).toString('hex');
  const cashier1PinSalt = crypto.randomBytes(16).toString('hex');
  const cashier2PinSalt = crypto.randomBytes(16).toString('hex');

  const insertUserStmt = db.prepare(`
    INSERT INTO users (id, tenant_id, full_name, email, phone_number, password_hash, salt, pin_hash, pin_salt, is_active, email_verified, phone_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
    ON CONFLICT(id) DO NOTHING
  `);

  // Insert Admin / Store Owner (Kwabena Mensah)
  insertUserStmt.run(
    'usr_owner_001',
    tenantId,
    'Kwabena Mensah',
    'kwabena@mensahstores.com',
    '0244123456',
    hashPassword('OsuPass2025#', ownerSalt),
    ownerSalt,
    hashPin('1234', ownerPinSalt),
    ownerPinSalt
  );

  // Insert Cashier 1 (Abena Osei)
  insertUserStmt.run(
    'usr_cashier_001',
    tenantId,
    'Abena Osei',
    'abena@mensahstores.com',
    '0244123457',
    null,
    null,
    hashPin('1234', cashier1PinSalt),
    cashier1PinSalt
  );

  // Insert Cashier 2 (Kofi Boateng)
  insertUserStmt.run(
    'usr_cashier_002',
    tenantId,
    'Kofi Boateng',
    'kofi@mensahstores.com',
    '0244123458',
    null,
    null,
    hashPin('1234', cashier2PinSalt),
    cashier2PinSalt
  );

  // Assign roles
  const ownerRole = db.prepare("SELECT id FROM roles WHERE name = 'Owner'").get() as { id: string } | undefined;
  const cashierRole = db.prepare("SELECT id FROM roles WHERE name = 'Cashier'").get() as { id: string } | undefined;

  const insertUserRoleStmt = db.prepare(`
    INSERT INTO user_roles (user_id, role_id, tenant_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, role_id) DO NOTHING
  `);

  if (ownerRole) {
    insertUserRoleStmt.run('usr_owner_001', ownerRole.id, tenantId);
  }
  if (cashierRole) {
    insertUserRoleStmt.run('usr_cashier_001', cashierRole.id, tenantId);
    insertUserRoleStmt.run('usr_cashier_002', cashierRole.id, tenantId);
  }

  // Assign branch users
  const insertBranchUserStmt = db.prepare(`
    INSERT INTO branch_users (branch_id, user_id, tenant_id, is_default)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(branch_id, user_id) DO NOTHING
  `);

  insertBranchUserStmt.run(branchId, 'usr_owner_001', tenantId);
  insertBranchUserStmt.run(branchId, 'usr_cashier_001', tenantId);
  insertBranchUserStmt.run(branchId, 'usr_cashier_002', tenantId);

  // Seed standard GRA tax profile
  db.prepare(`
    INSERT INTO tax_profiles (id, tenant_id, name, tax_type, vat_rate, nhil_rate, getfund_rate, covid_levy_rate, is_active)
    VALUES (?, ?, ?, 'standard_gra', 0.15, 0.025, 0.025, 0.01, 1)
    ON CONFLICT(id) DO NOTHING
  `).run('tax_default_osu', tenantId, 'Standard GRA');

  // Seed standard retail products for Mensah Stores Osu
  const insertProductStmt = db.prepare(`
    INSERT INTO products (id, tenant_id, name, barcode, base_price, cost_price, is_taxable, status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'active')
    ON CONFLICT(id) DO NOTHING
  `);

  const insertInventoryStmt = db.prepare(`
    INSERT INTO inventory (product_id, branch_id, tenant_id, quantity, low_stock_threshold)
    VALUES (?, ?, ?, ?, 5)
    ON CONFLICT(product_id, branch_id) DO NOTHING
  `);

  const demoProducts = [
    { id: 'prd_01', name: 'Nestle Milo Refill Pack 400g', barcode: '7613035889012', cost: 32.00, price: 38.50, stock: 45 },
    { id: 'prd_02', name: 'Ideal Evaporated Milk 160g', barcode: '7613032114520', cost: 9.50, price: 12.00, stock: 120 },
    { id: 'prd_03', name: 'Bel-Aqua Mineral Water 750ml', barcode: '6034000128911', cost: 3.50, price: 5.00, stock: 95 },
    { id: 'prd_04', name: 'Voltic Natural Mineral Water 500ml', barcode: '6034000234109', cost: 3.00, price: 4.50, stock: 80 },
    { id: 'prd_05', name: 'Frytol Pure Vegetable Oil 1L', barcode: '6034000554128', cost: 40.00, price: 48.00, stock: 35 },
    { id: 'prd_06', name: 'Gino Tomato Mix Paste 70g Sachet', barcode: '8901030776512', cost: 4.80, price: 6.50, stock: 150 },
    { id: 'prd_07', name: 'Geisha Herbal Beauty Soap 200g', barcode: '6034000998231', cost: 10.50, price: 14.00, stock: 60 },
    { id: 'prd_08', name: 'Pepsodent Triple Protection 140g', barcode: '8717163612841', cost: 14.20, price: 18.50, stock: 55 },
    { id: 'prd_09', name: 'Omo Multi-Active Washing Powder 500g', barcode: '8712561993412', cost: 12.00, price: 16.00, stock: 40 },
    { id: 'prd_10', name: 'FanYogo Strawberry Yogurt Pouch 145ml', barcode: '6034000781290', cost: 2.80, price: 4.00, stock: 75 },
    { id: 'prd_11', name: 'This Way Chocolate Drink 200ml', barcode: '6034000332145', cost: 4.50, price: 6.00, stock: 65 },
    { id: 'prd_12', name: 'TGI Thai Jasmine Perfumed Rice 5kg', barcode: '8850123984120', cost: 125.00, price: 145.00, stock: 25 },
    { id: 'prd_13', name: 'Tasty Tom Enriched Tomato Paste 400g', barcode: '6034000445612', cost: 19.50, price: 24.00, stock: 50 },
    { id: 'prd_14', name: 'Kalyppo Fruit Juice Orange 250ml', barcode: '6034000889123', cost: 4.00, price: 5.50, stock: 85 },
    { id: 'prd_15', name: 'Kleesoft Detergent Powder 1kg', barcode: '6921345678901', cost: 17.00, price: 22.00, stock: 38 }
  ];

  for (const prd of demoProducts) {
    insertProductStmt.run(
      prd.id,
      tenantId,
      prd.name,
      prd.barcode,
      prd.price,
      prd.cost
    );
    insertInventoryStmt.run(
      prd.id,
      branchId,
      tenantId,
      prd.stock
    );
  }
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
