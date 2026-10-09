import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { authApi } from '../api/auth.api';
import { posApi } from '../api/pos.api';
import { useAuth } from '../context/AuthContext';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, ArrowRight, Lock, Building } from 'lucide-react';
import { cn } from '../lib/utils';

interface CashierProfile {
  id: string;
  name: string;
  role: string;
  initials: string;
  tenantId: string;
}

const DEFAULT_CASHIERS: CashierProfile[] = [
  { id: 'usr_owner_001', name: 'Kwabena Mensah', role: 'Store Admin', initials: 'KM', tenantId: 'ten_default_osu' },
  { id: 'usr_cashier_001', name: 'Abena Osei', role: 'Cashier Station 1', initials: 'AO', tenantId: 'ten_default_osu' },
  { id: 'usr_cashier_002', name: 'Kofi Boateng', role: 'Cashier Station 2', initials: 'KB', tenantId: 'ten_default_osu' },
];

export const CashierLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithPin, loginWithPassword } = useAuth();
  const initialMode = searchParams.get('tab') === 'admin' ? 'admin' : 'pin';
  const redirectTarget = searchParams.get('redirect') || '/terminal';
  const queryStoreId = searchParams.get('storeId') || '';

  const [mode, setMode] = useState<'pin' | 'admin'>(initialMode);
  const [storeIdInput, setStoreIdInput] = useState(queryStoreId);
  const [isStoreLoaded, setIsStoreLoaded] = useState(!!queryStoreId);
  const [cashierProfiles, setCashierProfiles] = useState<CashierProfile[]>(DEFAULT_CASHIERS);
  const [selectedCashier, setSelectedCashier] = useState<CashierProfile>(DEFAULT_CASHIERS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Email Login State
  const [adminEmail, setAdminEmail] = useState('kwabena@mensahstores.com');
  const [adminPassword, setAdminPassword] = useState('OsuPass2025#');
  const [tenantOptions, setTenantOptions] = useState<TenantOption[] | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const loadStoreStaff = async (tenantId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const staff = await posApi.getPublicStaff(tenantId);
      if (staff && staff.length > 0) {
        const profiles: CashierProfile[] = staff.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          initials: s.initials,
          tenantId: s.tenantId,
        }));
        setCashierProfiles(profiles);
        setSelectedCashier(profiles[0]);
        setIsStoreLoaded(true);
        if (!searchParams.get('storeId')) {
          navigate(`/cashier-login?storeId=${tenantId}`, { replace: true });
        }
      } else {
        setError('No cashiers found for this Store Code.');
      }
    } catch (err) {
      setError('Invalid Store Code or failed to load store details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real staff from database
  useEffect(() => {
    if (queryStoreId) {
      loadStoreStaff(queryStoreId);
    }
  }, []);

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    setError(null);
    try {
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
      await loginWithPassword(adminEmail, adminPassword, targetTenant);
      navigate(redirectTarget);
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
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-lg flex flex-col items-center"
        >
          {/* Terminal Info Header Banner */}
          <motion.div variants={staggerItem} className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] block">
                  Merchant Terminal OS
                </span>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Terminal #ACC-04 • SikaPOS Core
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="online" pulse className="px-3 py-1 bg-white border border-emerald-200 shadow-sm">
                Cloud Synced
              </Badge>
              {isStoreLoaded && (
                <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200/60 shadow-sm">
                  Active Store Terminal
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Terminal Shell */}
          <motion.div variants={staggerItem} className="w-full">
            <GlassSurface variant="light" intensity="high" className="w-full p-6 sm:p-10 shadow-xl border-white/50 bg-white/70">
              {/* Switch Mode Tabs */}
              <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl mb-8 border border-slate-200/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setMode('pin');
                    setError(null);
                  }}
                  className={cn(
                    'relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer select-none z-10',
                    mode === 'pin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {mode === 'pin' && (
                    <motion.div
                      layoutId="login-mode-indicator"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Cashier PIN Switch</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setError(null);
                  }}
                  className={cn(
                    'relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer select-none z-10',
                    mode === 'admin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {mode === 'admin' && (
                    <motion.div
                      layoutId="login-mode-indicator"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Admin Email</span>
                </button>
              </div>

              {error && (
                <div className="mb-6">
                  <Alert variant="error" className="shadow-sm">{error}</Alert>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {mode === 'pin' ? (
                    <div className="flex flex-col items-center w-full">
                      {!isStoreLoaded ? (
                        <div className="w-full space-y-4 text-left">
                          <h3 className="text-sm font-extrabold text-slate-900">Connect to Store Terminal</h3>
                          <p className="text-xs text-slate-500 mb-4">
                            Enter the unique Store Code provided by your administrator, or click the direct terminal link shared with you.
                          </p>
                          <Input
                            label="Store Code / ID"
                            placeholder="e.g. ten_abc123"
                            value={storeIdInput}
                            onChange={(e) => setStoreIdInput(e.target.value)}
                          />
                          <Button 
                            className="w-full" 
                            isLoading={isLoading} 
                            onClick={() => {
                              if (storeIdInput.trim()) loadStoreStaff(storeIdInput.trim());
                            }}
                          >
                            Load Terminal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="w-full flex justify-between items-center mb-3">
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">
                              Select Shift Attendant
                            </label>
                            <button 
                              onClick={() => {
                                setIsStoreLoaded(false);
                                setStoreIdInput('');
                                navigate('/cashier-login', { replace: true });
                              }}
                              className="text-[10px] text-[#0D5C3A] font-bold uppercase hover:underline"
                            >
                              Change Store
                            </button>
                          </div>
                          <div className="w-full mb-8">
                            <div className="grid grid-cols-3 gap-3">
                          {cashierProfiles.map((profile) => {
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
                                  'p-3 rounded-2xl border text-left transition-all active-depress flex flex-col justify-between h-[88px] select-none cursor-pointer',
                                  isSelected
                                    ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.02]'
                                    : 'bg-slate-50/50 border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-full text-xs font-extrabold flex items-center justify-center shadow-sm',
                                    isSelected
                                      ? 'bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white'
                                      : 'bg-white border border-slate-200 text-slate-600'
                                  )}
                                >
                                  {profile.initials}
                                </div>
                                <div className="min-w-0 pt-1">
                                  <p className={cn("text-xs font-bold truncate", isSelected ? "text-[#0D5C3A]" : "text-slate-900")}>
                                    {profile.name.split(' ')[0]}
                                  </p>
                                  <span className="text-[10px] text-slate-500 font-medium truncate block">
                                    {profile.role.replace('Cashier ', '')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Cashier Identity Pill */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-[#0D5C3A]/20 mb-3 transform rotate-3">
                          <div className="transform -rotate-3">{selectedCashier.initials}</div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          {selectedCashier.name}
                        </h3>
                        <p className="text-[13px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full mt-2">
                          {selectedCashier.role} • Ready for till entry
                        </p>
                      </div>

                        <PinKeypad
                          onComplete={handlePinComplete}
                          isLoading={isLoading}
                          error={error}
                          onClearError={() => setError(null)}
                        />
                      </>
                    )}
                    </div>
                  ) : (
                    <div className="space-y-5 text-left w-full">
                      {tenantOptions ? (
                        <div className="space-y-4">
                          <Alert variant="info" title="Multiple Stores Found" className="shadow-sm border-sky-100 bg-sky-50/50 backdrop-blur-sm">
                            Your email is associated with more than one business. Select the store you wish to access:
                          </Alert>

                          <div className="space-y-3">
                            {tenantOptions.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTenantId(t.id);
                                  handleAdminLogin(undefined, t.id);
                                }}
                                className="w-full p-4 rounded-2xl border border-slate-200/60 bg-white/80 hover:bg-white hover:border-[#0D5C3A] hover:ring-2 hover:ring-[#0D5C3A]/10 text-left transition-all flex items-center justify-between cursor-pointer shadow-xs hover:shadow-md"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center border border-emerald-100">
                                    <Building className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-[15px] font-bold text-slate-900">{t.businessName}</p>
                                    <p className="text-[13px] text-slate-500">{t.legalName}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0D5C3A]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-5 w-full">
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
                            startIcon={<Lock className="w-5 h-5 text-slate-400" />}
                          />

                          <div className="pt-4 border-t border-slate-100">
                            <Button
                              type="submit"
                              size="lg"
                              className="w-full text-[15px]"
                              isLoading={isLoading}
                              rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                              Sign In as Admin
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer Navigation Switch */}
              <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                <Link
                  to="/merchant-signup"
                  className="text-[13px] font-bold text-[#0D5C3A] hover:text-[#09432A] transition-colors"
                >
                  Need to register a new store? Create an account
                </Link>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
