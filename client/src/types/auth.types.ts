export interface User {
  id: string;
  tenantId: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: 'owner' | 'manager' | 'cashier' | 'accountant';
  isActive: boolean;
  avatarUrl?: string | null;
}

export interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  legalName: string;
  tradeCategory: string;
  currency: string;
  taxRegistrationNumber?: string | null;
  taxProfile: 'vat_standard' | 'vat_flat' | 'none';
  status: 'active' | 'suspended' | 'trial';
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface RequestOtpResponse {
  recipient: string;
  carrier: string;
  expiresAt: string;
  debugCode?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  phoneNumber: string;
}

export interface RegisterPayload {
  businessLegalName: string;
  businessTradeName: string;
  tradeCategory: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  primaryBranchName: string;
  primaryBranchAddress?: string;
  primaryBranchPhone?: string;
}

export interface AuthSuccessResponse {
  token: string;
  user: User;
  tenant?: Tenant;
  tenantId?: string;
  primaryBranch?: Branch;
}

export interface TenantOption {
  id: string;
  businessName: string;
  legalName: string;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  remainingCooldownSeconds?: number;
  tenants?: TenantOption[];
}
