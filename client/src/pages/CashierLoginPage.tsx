import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { authApi } from '../api/auth.api';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, Shield, ArrowRight, Lock, Building, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface CashierProfile {
  id: string;
  name: string;
  role: string;
  initials: string;
  tenantId: string;
}

const CASHIER_PROFILES: CashierProfile[] = [
  { id: 'usr_owner_001', name: 'Kwabena Mensah', role: 'Store Admin', initials: 'KM', tenantId: 'ten_default_osu' },
  { id: 'usr_cashier_001', name: 'Abena Osei', role: 'Cashier Station 1', initials: 'AO', tenantId: 'ten_default_osu' },
  { id: 'usr_cashier_002', name: 'Kofi Boateng', role: 'Cashier Station 2', initials: 'KB', tenantId: 'ten_default_osu' },
];

export const CashierLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('tab') === 'admin' ? 'admin' : 'pin';

  const [mode, setMode] = useState<'pin' | 'admin'>(initialMode);
  const [selectedCashier, setSelectedCashier] = useState<CashierProfile>(CASHIER_PROFILES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Email Login State
  const [adminEmail, setAdminEmail] = useState('kwabena@mensahstores.com');
  const [adminPassword, setAdminPassword] = useState('OsuPass2025#');
  const [tenantOptions, setTenantOptions] = useState<TenantOption[] | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Connect to real backend PIN login
      await authApi.loginWithPin(selectedCashier.tenantId, selectedCashier.id, pin);
      navigate('/store-setup');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'That PIN is incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e?: React.FormEvent, overrideTenantId?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const targetTenant = overrideTenantId || selectedTenantId || undefined;

    try {
      await authApi.loginWithPassword(adminEmail, adminPassword, targetTenant);
      navigate('/store-setup');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'MULTIPLE_TENANTS_FOUND' && apiErr.tenants) {
        setTenantOptions(apiErr.tenants);
      } else {
        setError(apiErr.message || 'The email or password is incorrect.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center">
        {/* Terminal Info Header Banner */}
        <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center border border-emerald-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Merchant Terminal OS
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Terminal #ACC-04 • SikaPOS Core
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="online" pulse>
              Cloud Synced
            </Badge>
            <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Osu Oxford St. Branch
            </div>
          </div>
        </div>

        {/* Main Terminal Shell */}
        <Card elevated className="w-full max-w-lg p-6 sm:p-8">
          {/* Switch Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                mode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Cashier PIN Fast-Switch
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                mode === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Admin Email Login
            </button>
          </div>

          {error && (
            <div className="mb-6">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {mode === 'pin' ? (
            <div className="flex flex-col items-center">
              {/* Cashier Shift Selector */}
              <div className="w-full mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 text-left">
                  Select Shift Attendant
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CASHIER_PROFILES.map((profile) => {
                    const isSelected = selectedCashier.id === profile.id;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setSelectedCashier(profile);
                          setError(null);
                        }}
                        className={cn(
                          'cashier-chip p-2.5 rounded-xl border text-left transition-all active-depress flex flex-col justify-between h-20 select-none cursor-pointer',
                          isSelected
                            ? 'bg-[#E8F5EE] border-[#0D5C3A] ring-1 ring-[#0D5C3A]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center',
                            isSelected
                              ? 'bg-[#0D5C3A] text-white'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {profile.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile.name.split(' ')[0]}
                          </p>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {profile.role}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Cashier Identity Pill */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center text-lg font-bold shadow-xs mb-2">
                  {selectedCashier.initials}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCashier.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCashier.role} • Ready for till entry
                </p>
              </div>

              {/* High-Velocity Numpad */}
              <PinKeypad
                onComplete={handlePinComplete}
                isLoading={isLoading}
                error={error}
                onClearError={() => setError(null)}
              />
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {tenantOptions ? (
                <div className="space-y-4">
                  <Alert variant="info" title="Multiple Stores Found">
                    Your email is associated with more than one business. Select the store you wish to access:
                  </Alert>

                  <div className="space-y-2">
                    {tenantOptions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTenantId(t.id);
                          handleAdminLogin(undefined, t.id);
                        }}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0D5C3A] hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-[#0D5C3A]" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{t.businessName}</p>
                            <p className="text-xs text-slate-500">{t.legalName}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <Input
                    label="Administrator Email"
                    type="email"
                    placeholder="e.g. kwabena@mensahstores.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter account password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    startIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Sign In as Admin
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer Navigation Switch */}
          <div className="mt-8 pt-5 border-t border-slate-200 text-center">
            <Link
              to="/merchant-signup"
              className="text-xs font-semibold text-[#0D5C3A] hover:underline"
            >
              Need to register a new store? Create an account
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};
