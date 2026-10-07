import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '../components/visuals/AnimatedBackground';
import { AppNavbar } from '../components/navigation/AppNavbar';
import { AuthCard } from '../components/auth/AuthCard';
import { AuthMethodSwitcher } from '../components/auth/AuthMethodSwitcher';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthError } from '../components/auth/AuthError';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import { PhoneInput } from '../components/ui/PhoneInput';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Footer } from '../components/layout/Footer';
import { InstallPrompt } from '../components/pwa/InstallPrompt';
import { UpdatePrompt } from '../components/pwa/UpdatePrompt';
import { useAuth } from '../context/AuthContext';
import { ApiError, TenantOption } from '../types/auth.types';
import { Store, User, Lock, KeyRound, Eye, EyeOff, Smartphone, ArrowRight } from 'lucide-react';

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
  <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
  const {
    loginWithPassword,
    loginWithPin,
    loginWithGoogle,
    requestPhoneLoginOtp,
    verifyPhoneLoginOtp,
  } = useAuth();

  const initialTab = searchParams.get('mode') === 'cashier' ? 'cashier' : 'owner';
  const [activeTab, setActiveTab] = useState<'owner' | 'phone' | 'cashier'>(initialTab as any);

  // Owner form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[] | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Phone OTP login fields
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Cashier PIN
  const [selectedCashier, setSelectedCashier] = useState<CashierPreset>(CASHIER_PRESETS[0]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegisteredInfo, setNotRegisteredInfo] = useState<{ email?: string; phone?: string } | null>(null);

  const authOptions = [
    { id: 'owner' as const, label: 'Owner / Manager' },
    { id: 'phone' as const, label: 'Phone OTP' },
    { id: 'cashier' as const, label: 'Cashier PIN' },
  ];

  // 1. Google OAuth
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
      if (
        err?.code === 'USER_NOT_REGISTERED' ||
        err?.response?.data?.error?.code === 'USER_NOT_REGISTERED'
      ) {
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

  // 2. Phone OTP Request
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    let cleanPhone = phoneInput.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+233')) {
      // already normalized
    } else if (cleanPhone.startsWith('233')) {
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = '+233' + cleanPhone.substring(1);
    } else if (/^[25]\d{8}$/.test(cleanPhone)) {
      cleanPhone = '+233' + cleanPhone;
    }

    setIsLoading(true);
    setError(null);
    setNotRegisteredInfo(null);
    try {
      await requestPhoneLoginOtp(cleanPhone);
      setPhoneOtpSent(true);
    } catch (err: any) {
      if (
        err?.code === 'USER_NOT_REGISTERED' ||
        err?.response?.data?.error?.code === 'USER_NOT_REGISTERED'
      ) {
        setNotRegisteredInfo({ phone: phoneInput });
        setError('No store registered with this phone number yet.');
        return;
      }
      const apiErr = err as ApiError;
      setError(apiErr?.message || err?.message || 'Failed to send SMS OTP. Please check your number.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone OTP Verification
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpCode.trim() || phoneOtpCode.length < 6) {
      setError('Please enter the 6-digit code sent to your phone.');
      return;
    }

    let cleanPhone = phoneInput.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+233')) {
      // already normalized
    } else if (cleanPhone.startsWith('233')) {
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = '+233' + cleanPhone.substring(1);
    } else if (/^[25]\d{8}$/.test(cleanPhone)) {
      cleanPhone = '+233' + cleanPhone;
    }

    setIsLoading(true);
    setError(null);
    try {
      await verifyPhoneLoginOtp(cleanPhone, phoneOtpCode.trim());
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err: any) {
      if (
        err?.code === 'USER_NOT_REGISTERED' ||
        err?.response?.data?.error?.code === 'USER_NOT_REGISTERED'
      ) {
        setNotRegisteredInfo({ phone: phoneInput });
        setError('No store registered with this phone number yet.');
        return;
      }
      const apiErr = err as ApiError;
      setError(apiErr?.message || err?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Standard Owner / Password Login
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

  // 5. Cashier PIN Login
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
    <AnimatedBackground>
      {/* Floating Glass Navigation Bar */}
      <AppNavbar />

      {/* Main Authentication Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center relative z-10">
        <AuthCard
          title="Sign In to SikaPOS"
          subtitle="Access your store dashboard, inventory, and POS terminal."
          footer={
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
              <span>New to SikaPOS?</span>
              <Link
                to="/merchant-signup"
                className="font-bold text-[#0D5C3A] hover:text-[#09432A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded-lg px-1.5 py-0.5"
              >
                Create Store Account
              </Link>
            </div>
          }
        >
          {/* Quick Google Sign In */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200/70" />
              <span className="absolute bg-white/90 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-xs">
                or sign in with
              </span>
            </div>
          </div>

          {/* Segmented Auth Method Switcher */}
          <AuthMethodSwitcher
            options={authOptions}
            activeId={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setError(null);
              setNotRegisteredInfo(null);
            }}
          />

          {/* Error Banner */}
          <AuthError
            message={error}
            action={
              notRegisteredInfo && (
                <Link
                  to="/merchant-signup"
                  className="font-bold underline text-rose-900 hover:text-rose-700 inline-flex items-center gap-1"
                >
                  Create store account now
                </Link>
              )
            }
          />

          {/* Multiple Store Accounts Disambiguation */}
          {tenantOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-2.5 text-left"
            >
              <p className="text-xs font-bold text-emerald-950">
                Multiple stores found for your account. Please select one:
              </p>
              <div className="space-y-1.5">
                {tenantOptions.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTenantId(t.id);
                      handleOwnerLogin(undefined, t.id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-emerald-100 hover:border-[#0D5C3A] text-xs sm:text-sm font-bold text-slate-800 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <span>{t.businessName}</span>
                    <ArrowRight className="w-4 h-4 text-[#0D5C3A] group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab 1: Owner / Manager Password Login */}
          {activeTab === 'owner' && (
            <form onSubmit={handleOwnerLogin} className="space-y-4 text-left">
              <AuthInput
                label="Email or Phone Number"
                placeholder="e.g. 059 929 5299 or name@store.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                startIcon={<User className="w-4 h-4" aria-hidden="true" />}
              />

              <AuthInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your store password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                startIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus-visible:outline-none p-1.5 rounded-lg cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="pt-1">
                <AuthSubmitButton isLoading={isLoading} loadingText="Signing in...">
                  Sign In to Store
                </AuthSubmitButton>
              </div>
            </form>
          )}

          {/* Tab 2: Phone OTP Login */}
          {activeTab === 'phone' && (
            <div className="space-y-4 text-left">
              {!phoneOtpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <PhoneInput
                    label="Ghana Mobile Number"
                    value={phoneInput}
                    onChange={setPhoneInput}
                    placeholder="024 412 3456"
                    helperText="We will send an SMS verification code to your phone"
                  />

                  <div className="pt-1">
                    <AuthSubmitButton isLoading={isLoading} loadingText="Sending code...">
                      Send Verification Code
                    </AuthSubmitButton>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <div className="text-center p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80">
                    <p className="text-xs text-slate-600">SMS code sent to</p>
                    <p className="text-sm font-extrabold text-[#0D5C3A]">{phoneInput}</p>
                  </div>

                  <AuthInput
                    label="6-Digit Verification Code"
                    placeholder="123456"
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    startIcon={<Smartphone className="w-4 h-4" aria-hidden="true" />}
                  />

                  <div className="pt-1 flex flex-col gap-2">
                    <AuthSubmitButton isLoading={isLoading} loadingText="Verifying...">
                      Verify and Sign In
                    </AuthSubmitButton>

                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOtpSent(false);
                        setPhoneOtpCode('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 text-center cursor-pointer"
                    >
                      Change phone number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab 3: Cashier Fast-Switch PIN Login */}
          {activeTab === 'cashier' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-[#0D5C3A]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Cashier Station
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CASHIER_PRESETS.map((cashier) => (
                  <button
                    key={cashier.id}
                    type="button"
                    onClick={() => setSelectedCashier(cashier)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedCashier.id === cashier.id
                        ? 'border-[#0D5C3A] bg-emerald-50/80 font-bold text-emerald-950 shadow-2xs'
                        : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">{cashier.name}</div>
                    <div className="text-[10px] text-slate-500">{cashier.role}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <PinKeypad onComplete={handleCashierPinComplete} isLoading={isLoading} />
              </div>
            </div>
          )}
        </AuthCard>
      </main>

      {/* Reusable PWA Install & Update Prompts */}
      <InstallPrompt />
      <UpdatePrompt />

      <Footer />
    </AnimatedBackground>
  );
};

export default LoginPage;
