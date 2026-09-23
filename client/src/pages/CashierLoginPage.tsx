import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { authApi } from '../api/auth.api';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, ArrowRight, Lock, Building, Wifi, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Modern Countertop Terminal Header Bar */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center border border-emerald-100 shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Merchant Terminal OS
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Terminal #ACC-04 • SikaPOS Core
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00A859] border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#00A859] animate-pulse" />
              <span>Cloud Synced</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <span>Osu Oxford St. Branch</span>
            </div>
          </div>
        </div>

        {/* Countertop Tablet POS Shell */}
        <Card elevated className="w-full max-w-lg p-6 sm:p-10 bg-white">
          {/* Switch Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setError(null);
              }}
              className={cn(
                'py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
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
                'py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-left">
                  Select Shift Attendant
                </label>
                <div className="grid grid-cols-3 gap-2.5">
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
                          'cashier-chip p-3 rounded-2xl border text-left transition-all active-depress flex flex-col justify-between h-22 select-none cursor-pointer',
                          isSelected
                            ? 'bg-emerald-50/80 border-[#00A859] ring-2 ring-[#00A859]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center',
                            isSelected
                              ? 'bg-[#00A859] text-white shadow-xs'
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

              {/* Selected Cashier Identity Details */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#00A859] text-white flex items-center justify-center text-lg font-bold shadow-sm mb-2.5">
                  {selectedCashier.initials}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
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
                        className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:border-[#00A859] hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-[#00A859]" />
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

                  <div className="pt-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-base py-3.5 font-bold"
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
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/merchant-signup"
              className="text-xs font-bold text-[#00A859] hover:underline"
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
