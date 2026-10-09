import { apiClient } from './client';

export interface ProductItem {
  id: string;
  tenant_id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  category_id: string | null;
  category_name?: string;
  cost_price: number;
  base_price: number;
  total_stock?: number;
  is_taxable: number;
  status: string;
}

export interface SaleItemPayload {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalePayload {
  items: SaleItemPayload[];
  paymentMethod: 'cash' | 'mtn_momo' | 'telecel_cash' | 'at_money' | 'card';
  amountTendered?: number;
  customerPhone?: string;
  applyTax?: boolean;
}

export interface SaleReceipt {
  id: string;
  receipt_number: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name?: string;
  subtotal: number;
  tax_amount: number;
  tax_total?: number;
  grand_total: number;
  payment_method: string;
  amount_tendered: number | null;
  change_due: number | null;
  customer_phone: string | null;
  tax_breakdown_json: string;
  status: string;
  created_at: string;
  items?: {
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  tenantId: string;
  isActive: boolean;
}

export interface TenantDetails {
  id: string;
  legal_name: string;
  business_name: string;
  trade_category: string;
  currency_code: string;
  status: string;
  branches: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    region: string;
    gps_digital_address: string;
    physical_address: string;
    phone: string;
  }>;
}

export interface ReadinessCheck {
  id: string;
  title: string;
  desc: string;
  status: string;
  passed: boolean;
}

export interface ReadinessResponse {
  score: number;
  allReady: boolean;
  tenant: any;
  primaryBranch: any;
  checks: ReadinessCheck[];
}

export const posApi = {
  // Products
  getProducts: async (search?: string, categoryId?: string): Promise<{ products: ProductItem[]; categories: any[] }> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ products: ProductItem[]; categories: any[] }>(`/products${qs}`);
  },

  createProduct: async (product: {
    name: string;
    barcode?: string;
    sku?: string;
    categoryId?: string;
    costPrice?: number;
    sellingPrice: number;
    initialStock?: number;
    branchId?: string;
  }): Promise<ProductItem> => {
    return apiClient.post<ProductItem>('/products', product);
  },

  updateProduct: async (id: string, product: {
    name?: string;
    barcode?: string;
    sku?: string;
    categoryId?: string;
    costPrice?: number;
    sellingPrice?: number;
    isTaxable?: boolean;
    status?: string;
  }): Promise<ProductItem> => {
    return apiClient.put<ProductItem>(`/products/${id}`, product);
  },

  adjustStock: async (id: string, branchId: string, quantity: number): Promise<ProductItem> => {
    return apiClient.post<ProductItem>(`/products/${id}/stock`, { branchId, quantity });
  },

  // Sales
  createSale: async (payload: CreateSalePayload): Promise<SaleReceipt> => {
    return apiClient.post<SaleReceipt>('/sales', payload);
  },

  getSales: async (limit: number = 30): Promise<{ sales: SaleReceipt[]; summary: { totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number } }> => {
    return apiClient.get<{ sales: SaleReceipt[]; summary: { totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number } }>(`/sales?limit=${limit}`);
  },

  // Staff for terminal fast-switch
  getPublicStaff: async (tenantId?: string): Promise<StaffMember[]> => {
    const qs = tenantId ? `?tenantId=${tenantId}` : '';
    return apiClient.get<StaffMember[]>(`/tenants/public-staff${qs}`);
  },

  // Store & Tenant Details
  getCurrentTenant: async (): Promise<TenantDetails> => {
    return apiClient.get<TenantDetails>('/tenants/current');
  },

  updateStoreSetup: async (payload: {
    businessName: string;
    tradeCategory: string;
    primaryBranch?: {
      name?: string;
      region?: string;
      gpsDigitalAddress?: string;
      physicalAddress?: string;
      phone?: string;
    };
  }): Promise<any> => {
    return apiClient.put('/tenants/current', payload);
  },

  // Readiness
  getReadiness: async (): Promise<ReadinessResponse> => {
    return apiClient.get<ReadinessResponse>('/tenants/readiness');
  },

  // Tax Profile
  getTaxProfile: async (): Promise<any> => {
    return apiClient.get('/tax/current');
  },

  configureTax: async (taxType: 'standard_gra' | 'not_registered' | 'custom'): Promise<any> => {
    return apiClient.post('/tax/configure', { taxType });
  },
};
