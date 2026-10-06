import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { apiClient } from '../api/client';
import { setAuthToken as setServiceAuthToken, clearAuthToken as clearServiceAuthToken } from '../services/apiClient';
import type { User, Tenant, Branch, RegisterPayload, AuthSuccessResponse } from '../types/auth.types';

export interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  primaryBranch: Branch | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (
    email: string,
    password: string,
    tenantId?: string
  ) => Promise<AuthSuccessResponse>;
  loginWithPin: (
    tenantId: string,
    cashierId: string,
    pin: string
  ) => Promise<AuthSuccessResponse>;
  registerMerchant: (
    payload: RegisterPayload
  ) => Promise<AuthSuccessResponse>;
  logout: (redirectTo?: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setPrimaryBranch: (branch: Branch | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('sikapos_user');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [tenant, setTenantState] = useState<Tenant | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('sikapos_tenant');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [primaryBranch, setPrimaryBranchState] = useState<Branch | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('sikapos_branch');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.sessionStorage.getItem('sikapos_token') ||
        window.localStorage.getItem('sikapos_token') ||
        null
      );
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize token state across API clients and storage
  const syncToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    apiClient.setToken(newToken);
    setServiceAuthToken(newToken);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (typeof window !== 'undefined') {
      if (u) window.localStorage.setItem('sikapos_user', JSON.stringify(u));
      else window.localStorage.removeItem('sikapos_user');
    }
  }, []);

  const setTenant = useCallback((t: Tenant | null) => {
    setTenantState(t);
    if (typeof window !== 'undefined') {
      if (t) window.localStorage.setItem('sikapos_tenant', JSON.stringify(t));
      else window.localStorage.removeItem('sikapos_tenant');
    }
  }, []);

  const setPrimaryBranch = useCallback((b: Branch | null) => {
    setPrimaryBranchState(b);
    if (typeof window !== 'undefined') {
      if (b) window.localStorage.setItem('sikapos_branch', JSON.stringify(b));
      else window.localStorage.removeItem('sikapos_branch');
    }
  }, []);

  // Check and verify current session with the backend API
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const activeToken =
      apiClient.getToken() ||
      (typeof window !== 'undefined'
        ? window.sessionStorage.getItem('sikapos_token') ||
          window.localStorage.getItem('sikapos_token')
        : null);

    if (!activeToken) {
      setUser(null);
      setTenant(null);
      setPrimaryBranch(null);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getCurrentUser();
      setUser(res.user);
      setTenant(res.tenant);
      if (res.primaryBranch) {
        setPrimaryBranch(res.primaryBranch);
      }
      setIsLoading(false);
      return true;
    } catch {
      // Session token invalid or expired
      syncToken(null);
      setUser(null);
      setTenant(null);
      setPrimaryBranch(null);
      setIsLoading(false);
      return false;
    }
  }, [syncToken, setUser, setTenant, setPrimaryBranch]);

  // Initial session verification on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login with Email/Phone & Password (Admin / Manager)
  const loginWithPassword = useCallback(
    async (
      email: string,
      password: string,
      tenantId?: string
    ): Promise<AuthSuccessResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.loginWithPassword(email, password, tenantId);
        if (res.token) {
          syncToken(res.token);
        }
        setUser(res.user);
        if (res.tenant) {
          setTenant(res.tenant);
        }
        if (res.primaryBranch) {
          setPrimaryBranch(res.primaryBranch);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [syncToken, setUser, setTenant, setPrimaryBranch]
  );

  // Fast PIN login for Till Cashiers
  const loginWithPin = useCallback(
    async (
      tenantId: string,
      cashierId: string,
      pin: string
    ): Promise<AuthSuccessResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.loginWithPin(tenantId, cashierId, pin);
        if (res.token) {
          syncToken(res.token);
        }
        setUser(res.user);
        if (res.tenant) {
          setTenant(res.tenant);
        }
        if (res.primaryBranch) {
          setPrimaryBranch(res.primaryBranch);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [syncToken, setUser, setTenant, setPrimaryBranch]
  );

  // Register Merchant Tenant & Owner
  const registerMerchant = useCallback(
    async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.registerMerchant(payload);
        if (res.token) {
          syncToken(res.token);
        }
        setUser(res.user);
        if (res.tenant) {
          setTenant(res.tenant);
        }
        if (res.primaryBranch) {
          setPrimaryBranch(res.primaryBranch);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [syncToken, setUser, setTenant, setPrimaryBranch]
  );

  // Logout and clear active session, wipe local storage user data, and redirect to login page
  const logout = useCallback(
    async (redirectTo: string = '/login'): Promise<void> => {
      setIsLoading(true);
      try {
        await authApi.logout();
      } catch {
        // Clear local state even if network call fails
      } finally {
        syncToken(null);
        clearServiceAuthToken();
        setUser(null);
        setTenant(null);
        setPrimaryBranch(null);

        // Remove user data and authentication state from local and session storage
        if (typeof window !== 'undefined') {
          const authStorageKeys = [
            'sikapos_token',
            'token',
            'auth_token',
            'sikapos_auth_token',
            'sikapos_user',
            'sikapos_tenant',
            'sikapos_branch',
            'user',
            'user_data',
            'tenant',
            'activeCashier',
            'cashierId',
            'cashier_profile',
          ];

          authStorageKeys.forEach((key) => {
            try {
              window.localStorage.removeItem(key);
            } catch {
              // ignore
            }
            try {
              window.sessionStorage.removeItem(key);
            } catch {
              // ignore
            }
          });

          // Sweep any residual keys related to auth or user session in localStorage
          try {
            if (window.localStorage) {
              const keysToRemove: string[] = [];
              for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k && /^(sikapos_|user|auth|token|tenant|cashier)/i.test(k)) {
                  keysToRemove.push(k);
                }
              }
              keysToRemove.forEach((k) => window.localStorage.removeItem(k));
            }
          } catch {
            // ignore
          }
        }

        setIsLoading(false);

        // Redirect user to the login page
        if (redirectTo) {
          try {
            navigate(redirectTo, { replace: true });
          } catch {
            if (typeof window !== 'undefined') {
              window.location.assign(redirectTo);
            }
          }
        }
      }
    },
    [syncToken, setUser, setTenant, setPrimaryBranch, navigate]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      tenant,
      primaryBranch,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      loginWithPassword,
      loginWithPin,
      registerMerchant,
      logout,
      checkAuth,
      setUser,
      setTenant,
      setPrimaryBranch,
    }),
    [
      user,
      tenant,
      primaryBranch,
      token,
      isLoading,
      loginWithPassword,
      loginWithPin,
      registerMerchant,
      logout,
      checkAuth,
      setUser,
      setTenant,
      setPrimaryBranch,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
