-- SikaPOS / Akoma Commerce Cloud - Phase 0 Database Schema
-- Multi-Tenant Relational Foundation

PRAGMA foreign_keys = ON;

-- 1. Tenants (Organizations / Merchant Entities)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  trade_category TEXT NOT NULL CHECK(trade_category IN ('provision_supermarket', 'pharmacy', 'fashion', 'electronics', 'general_retail')),
  currency_code TEXT NOT NULL DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'trial')),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 2. Branches (Physical Outlets / Storefronts per Tenant)
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL,
  gps_digital_address TEXT NOT NULL,
  physical_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_primary ON branches(tenant_id, is_primary);

-- 3. Users (Store Owners, Managers, Cashiers, Staff)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT,
  salt TEXT,
  pin_hash TEXT,
  pin_salt TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, email),
  UNIQUE(tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- 4. Roles (System-Defined & Future Custom Roles)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. Permissions (Granular Authorization Actions)
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 6. Role Permissions (Mapping between Roles and Permissions)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 7. User Roles (Assignment of Roles to Users in a Tenant)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- 8. Branch Users (Assignment of Staff to specific Outlets)
CREATE TABLE IF NOT EXISTS branch_users (
  branch_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  PRIMARY KEY (branch_id, user_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_branch_users_tenant ON branch_users(tenant_id);

-- 9. Tax Profiles (Data-Driven Ghana Revenue Authority & Custom Rules)
CREATE TABLE IF NOT EXISTS tax_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tax_type TEXT NOT NULL CHECK(tax_type IN ('not_registered', 'standard_gra', 'custom')),
  vat_rate REAL NOT NULL DEFAULT 0.0,
  nhil_rate REAL NOT NULL DEFAULT 0.0,
  getfund_rate REAL NOT NULL DEFAULT 0.0,
  covid_levy_rate REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tax_profiles_tenant ON tax_profiles(tenant_id);

-- 10. Devices (Terminal & Hardware Identity for POS and Mobile Registers)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_identifier TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK(device_type IN ('pos_terminal', 'tablet', 'mobile', 'desktop')),
  hardware_model TEXT NOT NULL,
  last_heartbeat_at TEXT,
  last_sync_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'offline' CHECK(sync_status IN ('synced', 'pending', 'offline')),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_devices_tenant ON devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_branch ON devices(branch_id);

-- 11. Auth Sessions (Server-Authoritative Tokens with Tenant Association)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON auth_sessions(tenant_id);

-- 12. Audit Logs (Compliance & Financial Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 13. OTP Verifications (Provider-Agnostic Verification Lifecycle)
CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  otp_code_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('merchant_signup', 'cashier_login', 'password_reset')),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_recipient ON otp_verifications(recipient, purpose);

-- 14. Offline Sync Events (Architectural Foundation for Future Phase 11 Sync Queue)
CREATE TABLE IF NOT EXISTS offline_sync_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  client_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received', 'processed', 'conflict')),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_tenant_device ON offline_sync_events(tenant_id, device_id);
