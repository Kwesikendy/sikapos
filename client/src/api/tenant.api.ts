import { apiClient } from './client';

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  is_primary: number;
  region: string;
  gps_digital_address: string;
  physical_address: string;
  phone: string;
  status: string;
}

export interface TaxProfile {
  id: string;
  name: string;
  tax_type: string;
  vat_rate: number;
  nhil_rate: number;
  getfund_rate: number;
  covid_levy_rate: number;
}

export interface CashierPayload {
  branchId: string;
  fullName: string;
  phoneNumber: string;
  pin: string;
  email?: string;
}

export const tenantApi = {
  getCurrentTenant: async () => {
    return apiClient.get<any>('/tenants/current');
  },
  
  getBranches: async () => {
    return apiClient.get<Branch[]>('/tenants/branches');
  },
  
  updateTaxProfile: async (payload: { taxType: string; tinNumber?: string }) => {
    return apiClient.post<TaxProfile>('/tax/configure', payload);
  },

  createCashier: async (payload: CashierPayload) => {
    return apiClient.post<any>('/tenants/cashiers', payload);
  }
};
