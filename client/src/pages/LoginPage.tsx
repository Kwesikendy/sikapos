import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer } from '../lib/motion';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Alert } from '../components/ui/Alert';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DotPattern } from '../components/visuals/DotPattern';
import { AmbientGlow } from '../components/visuals/AmbientGlow';
import { useAuth } from '../context/AuthContext';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, ArrowRight, Lock, User, KeyRound, Eye, EyeOff, Smartphone } from 'lucide-react';
import type { ConfirmationResult } from '../lib/firebase';

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

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithPassword, loginWithPin, loginWithGoogle, requestFirebasePhoneOtp, confirmFirebasePhoneOtp } = useAuth();

  const initialTab = searchParams.get('mode') === 'cashier' ? 'cashier' : 'owner';
  const [tab, setTab] = useState<'owner' | 'phone' | 'cashier'>(initialTab as any);

  // Owner / Manager Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[] | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Phone OTP Login State
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Cashier Form State
  const [selectedCashier, setSelectedCashier] = useState<CashierPreset>(CASHIER_PRESETS[0]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegisteredInfo, setNotRegisteredInfo] = useState<{ email?: string; phone?: string; uid?: string } | null>(null);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setNotRegisteredInfo(null);
    try {
      await loginWithGoogle();
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      if (err?.code === 'USER_NOT_REGISTERED' || err?.response?.data?.error?.code === 'USER_NOT_REGISTERED') {
        const fbData = err?.response?.data?.error?.firebaseUser;
        setNotRegisteredInfo(fbData || { email: 'your Google account' });
        setError('No store registered with this Google account yet.');
        return;
      }
      const apiErr = err as ApiError;
      setError(apiErr?.message || err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone OTP Request
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    let cleanPhone = phoneInput.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+233' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+233' + cleanPhone;
    }

    setIsLoading(true);
    setError(null);
    try {
      const confirmation = await requestFirebasePhoneOtp(cleanPhone, 'phone-otp-recaptcha-btn');
      setPhoneConfirmation(confirmation);
      setPhoneOtpSent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send SMS OTP. Please check your number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneConfirmation) return;
    if (!phoneOtpCode.trim() || phoneOtpCode.length < 6) {
      setError('Please enter the 6-digit code sent to your phone.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await confirmFirebasePhoneOtp(phoneConfirmation, phoneOtpCode.trim());
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err: any) {
      if (err?.code === 'USER_NOT_REGISTERED' || err?.response?.data?.error?.code === 'USER_NOT_REGISTERED') {
        setNotRegisteredInfo({ phone: phoneInput });
        setError('No store registered with this phone number yet.');
        return;
      }
      setError(err?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Standard Owner / Password Login
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
    setNotRegisteredInfo(null);

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

  // Handle Cashier PIN Login
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

            {/* Google One-Click Sign In */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                    or sign in with
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-6 text-center">
              <button
                type="button"
                onClick={() => { setTab('owner'); setError(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tab === 'owner'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setTab('phone'); setError(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tab === 'phone'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => { setTab('cashier'); setError(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
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
                <Alert variant="error" className="shadow-xs">
                  <div>{error}</div>
                  {notRegisteredInfo && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <Link
                        to="/merchant-signup"
                        className="font-bold underline text-red-900 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        Create your store now →
                      </Link>
                    </div>
                  )}
                </Alert>
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

            {/* Tab 1: Store Owner & Manager Password Login */}
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

            {/* Tab 2: Phone OTP Login */}
            {tab === 'phone' && (
              <div className="space-y-4">
                {!phoneOtpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <PhoneInput
                      label="Ghana Mobile Number"
                      value={phoneInput}
                      onChange={setPhoneInput}
                      placeholder="024 412 3456"
                      helperText="We will send a 6-digit SMS verification code to your phone"
                    />

                    <div id="phone-otp-recaptcha-btn" className="hidden" />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                        isLoading={isLoading}
                        loadingText="Sending OTP..."
                        rightIcon={<Smartphone className="w-4 h-4" />}
                      >
                        Send Verification Code
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-xs text-slate-600">SMS code sent to</p>
                      <p className="text-sm font-extrabold text-[#0D5C3A]">{phoneInput}</p>
                    </div>

                    <Input
                      label="6-Digit Verification Code"
                      placeholder="e.g. 123456"
                      value={phoneOtpCode}
                      onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      autoFocus
                    />

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                        isLoading={isLoading}
                        loadingText="Verifying..."
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Verify & Sign In
                      </Button>

                      <button
                        type="button"
                        onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(''); }}
                        className="text-xs text-slate-500 hover:text-slate-700 py-1"
                      >
                        Change phone number
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Tab 3: Cashier Fast-Switch PIN Login */}
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
