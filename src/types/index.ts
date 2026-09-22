// SikaPOS / Akoma Commerce Cloud - Domain Types (Phase 0 Architecture)

export type UserRole = 'Owner' | 'Manager' | 'Cashier' | 'Inventory Staff' | 'Platform Admin';

export type PermissionCode =
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.receive'
  | 'inventory.count'
  | 'sales.view'
  | 'sales.create'
  | 'sales.refund'
  | 'customers.view'
  | 'customers.create'
  | 'customers.update'
  | 'reports.view'
  | 'employees.manage'
  | 'settings.manage'
  | 'subscription.manage';

export interface Tenant {
  id: string;
  legal_name: string;
  business_name: string;
  trade_category: 'provision_supermarket' | 'pharmacy' | 'fashion' | 'electronics' | 'general_retail';
  currency_code: string; // Default 'GHS'
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  is_primary: boolean;
  region: string;
  gps_digital_address: string;
  physical_address: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  password_hash?: string;
  salt?: string;
  pin_hash?: string;
  pin_salt?: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSummary {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  roles: string[];
  permissions: string[];
}

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  code: PermissionCode;
  module: string;
  description: string;
  created_at: string;
}

export type TaxProfileType = 'not_registered' | 'standard_gra' | 'custom';

export interface TaxProfile {
  id: string;
  tenant_id: string;
  name: string;
  tax_type: TaxProfileType;
  vat_rate: number; // e.g. 15.0 for 15%
  nhil_rate: number; // e.g. 2.5 for 2.5%
  getfund_rate: number; // e.g. 2.5 for 2.5%
  covid_levy_rate: number; // e.g. 0.0 or 1.0%
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  tenant_id: string;
  branch_id: string;
  device_name: string;
  device_identifier: string; // Unique hardware/terminal ID (e.g. ACC-04)
  device_type: 'pos_terminal' | 'tablet' | 'mobile' | 'desktop';
  hardware_model: string; // e.g. 'Sunmi V2 Pro', 'Android Tablet'
  last_heartbeat_at: string | null;
  last_sync_at: string | null;
  sync_status: 'synced' | 'pending' | 'offline';
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  id: string;
  user_id: string;
  tenant_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface OtpVerificationRecord {
  id: string;
  recipient: string;
  otp_code_hash: string;
  salt: string;
  purpose: 'merchant_signup' | 'cashier_login' | 'password_reset';
  attempts_count: number;
  max_attempts: number;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

// Minimal offline event placeholder for architectural support
export interface OfflineSyncEvent {
  id: string;
  tenant_id: string;
  device_id: string;
  client_event_id: string; // Idempotent key
  event_type: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'conflict';
  created_at: string;
}

export interface TenantContext {
  tenantId: string;
  branchId?: string;
  user: UserSummary;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
