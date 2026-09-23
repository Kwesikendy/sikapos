import { apiClient } from './client';
import {
  RequestOtpResponse,
  VerifyOtpResponse,
  RegisterPayload,
  AuthSuccessResponse,
  User,
  Tenant,
} from '../types/auth.types';

export const authApi = {
  requestSignupOtp: async (phoneNumber: string): Promise<RequestOtpResponse> => {
    return apiClient.post<RequestOtpResponse>('/auth/signup-otp/request', { phoneNumber });
  },

  verifySignupOtp: async (phoneNumber: string, code: string): Promise<VerifyOtpResponse> => {
    return apiClient.post<VerifyOtpResponse>('/auth/signup-otp/verify', { phoneNumber, code });
  },

  registerMerchant: async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
    const res = await apiClient.post<AuthSuccessResponse>('/auth/register', payload);
    if (res.token) {
      apiClient.setToken(res.token);
    }
    return res;
  },

  loginWithPassword: async (
    email: string,
    password: string,
    tenantId?: string
  ): Promise<AuthSuccessResponse> => {
    const res = await apiClient.post<AuthSuccessResponse>('/auth/login', {
      email,
      password,
      tenantId,
    });
    if (res.token) {
      apiClient.setToken(res.token);
    }
    return res;
  },

  loginWithPin: async (
    tenantId: string,
    cashierId: string,
    pin: string
  ): Promise<AuthSuccessResponse> => {
    const res = await apiClient.post<AuthSuccessResponse>('/auth/login-pin', {
      tenantId,
      cashierId,
      pin,
    });
    if (res.token) {
      apiClient.setToken(res.token);
    }
    return res;
  },

  getCurrentUser: async (): Promise<{ user: User; tenant: Tenant }> => {
    return apiClient.get<{ user: User; tenant: Tenant }>('/auth/me');
  },

  logout: async (): Promise<{ loggedOut: boolean }> => {
    try {
      const res = await apiClient.post<{ loggedOut: boolean }>('/auth/logout');
      apiClient.setToken(null);
      return res;
    } catch (err) {
      apiClient.setToken(null);
      throw err;
    }
  },
};
