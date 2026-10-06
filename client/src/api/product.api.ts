import { apiClient } from './client';

export interface ProductCategory {
  id: string;
  tenant_id: string;
  name: string;
  color_code: string | null;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  category_name?: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  description: string | null;
  base_price: number;
  cost_price: number;
  is_taxable: number;
  status: string;
  created_at: string;
  updated_at: string;
  total_stock?: number;
}

export const productApi = {
  getProducts: async (params?: { search?: string; categoryId?: string }) => {
    return apiClient.get<{ products: Product[]; categories: ProductCategory[] }>('/products', params);
  },

  getCategories: async () => {
    return apiClient.get<ProductCategory[]>('/products/categories');
  },

  createCategory: async (payload: { name: string; colorCode?: string }) => {
    return apiClient.post<ProductCategory>('/products/categories', payload);
  },

  createProduct: async (payload: {
    name: string;
    barcode?: string;
    sku?: string;
    categoryId?: string;
    description?: string;
    costPrice?: number;
    sellingPrice: number;
    isTaxable?: boolean;
    initialStock?: number;
    branchId?: string;
  }) => {
    return apiClient.post<Product>('/products', payload);
  },

  updateProduct: async (
    id: string,
    payload: Partial<{
      name: string;
      barcode: string;
      sku: string;
      categoryId: string;
      description: string;
      costPrice: number;
      sellingPrice: number;
      isTaxable: boolean;
      status: string;
    }>
  ) => {
    return apiClient.put<Product>(`/products/${id}`, payload);
  },

  adjustStock: async (id: string, payload: { branchId: string; quantity: number }) => {
    return apiClient.post<Product>(`/products/${id}/stock`, payload);
  }
};
