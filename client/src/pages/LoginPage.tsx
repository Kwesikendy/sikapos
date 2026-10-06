import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DotPattern } from '../components/visuals/DotPattern';
import { AmbientGlow } from '../components/visuals/AmbientGlow';
import { useAuth } from '../context/AuthContext';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, ArrowRight, Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';

interface CashierPreset {
  id: string;
  name: string;
  role: string;
  tenantId: string;
}

const CASHIER_PRESETS: CashierPreset[] = [
  { id: 'usr_cashier_001', name: 'Cashier Station 1', role: 'Front Counter', tenantId: 'ten_default_osu' },
  { id: 'usr_cashier_002', name: 'Cashier Station 2', role: 'Express Till', tenantId: 'ten_default_osu' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithPassword, loginWithPin } = useAuth();

  const initialTab = searchParams.get('mode') === 'cashier' ? 'cashier' : 'owner';
  const [tab, setTab] = useState<'owner' | 'cashier'>(initialTab);

  // Owner / Manager Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[] | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Cashier Form State
  const [selectedCashier, setSelectedCashier] = useState<CashierPreset>(CASHIER_PRESETS[0]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOwnerLogin = async (e?: React.FormEvent, overrideTenantId?: string) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your store email address or phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const targetTenant = overrideTenantId || selectedTenantId || undefined;

    try {
      await loginWithPassword(identifier.trim(), password, targetTenant);
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'MULTIPLE_TENANTS_FOUND' && apiErr.tenants) {
        setTenantOptions(apiErr.tenants);
      } else {
        setError(apiErr.message || 'Invalid email, phone number, or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashierPinComplete = async (pin: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithPin(selectedCashier.tenantId, selectedCashier.id, pin);
      navigate('/pos');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Incorrect cashier PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden relative selection:bg-[#0D5C3A]/20 selection:text-[#0D5C3A]">
      {/* Visual Dot Texture & Ambient Lighting */}
      <DotPattern variant="emerald" size="md" opacity={0.85} />
      <AmbientGlow color="emerald" position="top-left" className="opacity-40" />
      <AmbientGlow color="amber" position="bottom-right" className="opacity-25" />

      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 flex flex-col items-center justify-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-md"
        >
          {/* Card Container */}
          <GlassSurface
            variant="light"
            intensity="high"
            className="w-full p-6 sm:p-8 bg-white/95 rounded-2xl border border-slate-200/80 shadow-card"
          >
            {/* Header Titles */}
            <div className="mb-6 space-y-1 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white shadow-inner mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign In to SikaPOS
              </h1>
              <p className="text-sm text-slate-500">
                Access your store dashboard, inventory, and POS terminal.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setTab('owner'); setError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  tab === 'owner'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Owner / Manager
              </button>
              <button
                type="button"
                onClick={() => { setTab('cashier'); setError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  tab === 'cashier'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cashier PIN
              </button>
            </div>

            {error && (
              <div className="mb-6">
                <Alert variant="error" className="shadow-xs">{error}</Alert>
              </div>
            )}

            {/* Tenant Disambiguation Modal / Selection */}
            {tenantOptions && (
              <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <p className="text-xs font-bold text-emerald-900">
                  Multiple stores found for your account. Please select one:
                </p>
                <div className="space-y-2">
                  {tenantOptions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTenantId(t.id);
                        handleOwnerLogin(undefined, t.id);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-white border border-emerald-100 hover:border-[#0D5C3A] text-sm font-bold text-slate-800 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <span>{t.businessName}</span>
                      <ArrowRight className="w-4 h-4 text-[#0D5C3A] group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 1: Store Owner & Manager Login */}
            {tab === 'owner' && (
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <Input
                  label="Email or Phone Number"
                  placeholder="e.g. 059 929 5299 or name@store.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  startIcon={<User className="w-4 h-4 text-slate-400" aria-hidden="true" />}
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your store password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  startIcon={<Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus-visible:outline-none p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                  >
                    Sign In to Store
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Cashier Fast-Switch PIN Login */}
            {tab === 'cashier' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-[#0D5C3A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Station Cashier PIN
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {CASHIER_PRESETS.map((cashier) => (
                    <button
                      key={cashier.id}
                      type="button"
                      onClick={() => setSelectedCashier(cashier)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedCashier.id === cashier.id
                          ? 'border-[#0D5C3A] bg-emerald-50/60 font-bold text-emerald-950'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold truncate">{cashier.name}</div>
                      <div className="text-[10px] text-slate-500">{cashier.role}</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <PinKeypad
                    onComplete={handleCashierPinComplete}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Bottom Link to Signup */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500">
              <span>New to SikaPOS?</span>
              <Link
                to="/merchant-signup"
                className="font-bold text-[#0D5C3A] hover:text-[#09432A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded px-1"
              >
                Create Store Account →
              </Link>
            </div>
          </GlassSurface>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
