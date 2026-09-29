import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { PosTerminalMockup } from '../components/visuals/PosTerminalMockup';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { authApi } from '../api/auth.api';
import { ApiError } from '../types/auth.types';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Zap,
  Smartphone,
  ShieldCheck,
  Headphones,
  CheckCircle,
  Play
} from 'lucide-react';
import {
  merchantSignupSchema,
  otpVerificationSchema,
  type MerchantSignupFormData,
} from '../schemas/form.schemas';
import { useToast } from '../components/ui/Toast';

export const MerchantSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Form State
  const [fullName, setFullName] = useState('Kwabena Mensah');
  const [phoneNumber, setPhoneNumber] = useState('0244123456');
  const [email, setEmail] = useState('kwabena@mensahstores.com');
  const [businessName, setBusinessName] = useState('Mensah Provision Store');
  const [branchName, setBranchName] = useState('Osu Oxford St. Branch');
  const [password, setPassword] = useState('OsuPass2025#');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error States
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MerchantSignupFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCarrier, setOtpCarrier] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Check URL hash on mount or change to scroll to form
  useEffect(() => {
    if (window.location.hash === '#signup-form') {
      setTimeout(() => {
        scrollToForm();
      }, 150);
    }
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setFieldErrors({});

    // Validate form inputs against Zod schema
    const validationResult = merchantSignupSchema.safeParse({
      fullName,
      phoneNumber,
      email,
      businessName,
      branchName,
      password,
    });

    if (!validationResult.success) {
      const errors: Partial<Record<keyof MerchantSignupFormData, string>> = {};
      for (const issue of validationResult.error.issues) {
        const field = issue.path[0] as keyof MerchantSignupFormData;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      setError('Please resolve the highlighted validation errors before continuing.');
      toast.warning('Validation Required', 'Please check highlighted fields before continuing.');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Request OTP from real backend
      const res = await authApi.requestSignupOtp(phoneNumber);
      setOtpCarrier(res.carrier);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
        setOtpCode(res.debugCode);
      }
      setCooldown(60);
      setShowOtpModal(true);
      toast.success('Verification Code Sent', `SMS code dispatched to ${phoneNumber}.`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.remainingCooldownSeconds) {
        setCooldown(apiErr.remainingCooldownSeconds);
        setShowOtpModal(true);
      }
      const msg = apiErr.message || 'Could not send verification code. Please try again.';
      setError(msg);
      toast.error('Verification Request Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResendingOtp || isVerifyingOtp) return;
    setIsResendingOtp(true);
    setOtpError(null);
    try {
      const res = await authApi.requestSignupOtp(phoneNumber);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
        setOtpCode(res.debugCode);
      }
      setCooldown(60);
      toast.success('Code Resent', 'A fresh verification code has been dispatched.');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr.message || 'Failed to resend code.';
      setOtpError(msg);
      toast.error('Resend Failed', msg);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (isVerifyingOtp) return;

    // Validate OTP against Zod schema
    const otpValidation = otpVerificationSchema.safeParse({ otpCode });
    if (!otpValidation.success) {
      const msg = otpValidation.error.issues[0]?.message || 'Please enter the full 6-digit verification code.';
      setOtpError(msg);
      toast.warning('Invalid Code', msg);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      // Step 2: Verify OTP
      await authApi.verifySignupOtp(phoneNumber, otpCode);

      // Step 3: Register Merchant Tenant
      await authApi.registerMerchant({
        businessLegalName: `${businessName} Ltd`,
        businessTradeName: businessName,
        tradeCategory: 'provision_supermarket',
        ownerFullName: fullName,
        ownerEmail: email,
        ownerPhone: phoneNumber,
        password,
        primaryBranchName: branchName,
        primaryBranchRegion: 'Greater Accra',
        primaryBranchGps: 'GA-183-9024',
        primaryBranchAddress: 'Oxford Street, Osu, Accra',
      });

      toast.success('Registration Successful', 'Welcome to SikaPOS! Initializing store setup.');
      setShowOtpModal(false);
      navigate('/store-setup');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr.message || 'Verification failed. Please check the code.';
      setOtpError(msg);
      toast.error('Registration Failed', msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      <main className="flex-1 w-full overflow-hidden">
        {/* HERO SECTION - Replicating Image 2 Reference Design */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-mint-curve">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Spacious Confident Copy */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="text-xs font-bold uppercase tracking-wider text-[#00A859] flex items-center gap-2">
                  <span>Retail Commerce Platform</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Ghana Operating Standard</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Best POS Software in Ghana For Retail Business
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Built for modern Ghanaian traders, supermarkets, and pharmacies. Increase checkout speed, process instant MTN MoMo and Telecel Cash payments, automate GRA statutory tax calculations, and boost store revenue.
                </p>


                {/* CTAs matching reference button style */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-white bg-[#00A859] hover:bg-[#00924C] shadow-md hover:shadow-lg transition-all active-depress cursor-pointer"
                  >
                    <span>Enjoy 30 Days Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/cashier-login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#00A859] flex items-center justify-center">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                    <span>Cashier Quick-PIN Demo</span>
                  </Link>
                </div>

                {/* Micro trust row */}
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#00A859]" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#00A859]" />
                    <span>MTN MoMo & Telecel ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#00A859]" />
                    <span>Works offline</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Sleek Realistic Hardware Presentation */}
              <div className="lg:col-span-6 w-full">
                <PosTerminalMockup />
              </div>

            </div>
          </div>
        </section>

        {/* PROMO BANNER - Replicating Image 3 Top Strip */}
        <section className="bg-[#0B1B2B] text-white py-8 sm:py-10 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Increase Business Operation Efficiency - Choose SikaPOS Now!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Join over 2,400 forward-thinking retailers and traders across Greater Accra and Ashanti.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToForm}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#00A859] hover:bg-[#00924C] shadow-md transition-all active-depress shrink-0 cursor-pointer"
            >
              Register Your Store
            </button>
          </div>
        </section>

        {/* 4-CARD FEATURES SECTION - Replicating Image 3 Grid */}
        <section className="py-20 lg:py-24 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                Designed For Modern Commerce
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome to the Ultimate Retail POS Software for Ghana!
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Everything required to run a high-volume supermarket, neighborhood minimart, pharmacy, or boutique without cumbersome hardware.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-[#FAFCFB] border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00A859] flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Easy 3-Minute Onboarding</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Set up your business tenant, assign store branches, and configure product categories in minutes on any tablet, phone, or laptop.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-[#FAFCFB] border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00A859] flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Localized Ghana Payments</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Native integration with MTN MoMo, Telecel Cash, and AT Money. Accept direct QR codes and prompt customer phones seamlessly.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-[#FAFCFB] border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00A859] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Countertop Rapid PIN Switching</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Cashiers switch shifts in seconds with tactile 4-digit PIN authentication, preventing unauthorized drawer access and tracing sales.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-[#FAFCFB] border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00A859] flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Accra-Based Dedicated Support</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Our local engineering and support team is on standby via WhatsApp and direct line to assist with hardware setup and training.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REGISTRATION FORM SECTION - Spacious, Clean, Uncrowded */}
        <section ref={formRef} id="signup-form" className="py-20 bg-[#F4F9F6] border-t border-slate-200">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            
            <div className="text-center space-y-2 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                Stage 02 • Merchant Registration
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-sm text-slate-600">
                Set up your business tenant and store manager access.
              </p>
            </div>

            <Card elevated className="w-full p-8 sm:p-10 bg-white">
              
              {/* Header Guidance */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Store Owner Profile
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Quick 2-Minute Setup
                </span>
              </div>

              {/* Informational Guidance */}
              <div className="mb-6">
                <Alert variant="info">
                  Cashiers do not register here. You will invite staff with fast 4-digit PINs after setting up your store.
                </Alert>
              </div>

              {error && (
                <div className="mb-6">
                  <Alert variant="error">{error}</Alert>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleInitialSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  helperText="As printed on your Ghana Card"
                  placeholder="e.g. Kwabena Mensah"
                  value={fullName}
                  errorText={fieldErrors.fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  required
                />

                <PhoneInput
                  label="Mobile Phone Number"
                  helperText="Used for instant OTP verification and MoMo settlements"
                  value={phoneNumber}
                  errorText={fieldErrors.phoneNumber}
                  onChange={(val) => {
                    setPhoneNumber(val);
                    if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                  }}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. kwabena@mensahstores.com"
                  value={email}
                  errorText={fieldErrors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Trade Name"
                    placeholder="e.g. Mensah Provision Store"
                    value={businessName}
                    errorText={fieldErrors.businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (fieldErrors.businessName) setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
                    }}
                    required
                  />

                  <Input
                    label="Primary Outlet / Branch"
                    placeholder="e.g. Osu Oxford St. Branch"
                    value={branchName}
                    errorText={fieldErrors.branchName}
                    onChange={(e) => {
                      setBranchName(e.target.value);
                      if (fieldErrors.branchName) setFieldErrors((prev) => ({ ...prev, branchName: undefined }));
                    }}
                    required
                  />
                </div>

                <Input
                  label="Account Password"
                  type={showPassword ? 'text' : 'password'}
                  helperText="Minimum 8 characters with at least one number and special character"
                  placeholder="Enter secure password"
                  value={password}
                  errorText={fieldErrors.password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  required
                  startIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="pt-4 space-y-2">
                  <Button
                    id="create-account-button"
                    type="submit"
                    size="lg"
                    className="w-full text-base py-4 font-bold"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create Account
                  </Button>
                  <p className="text-center text-xs text-slate-500">
                    Dispatches a 6-digit SMS verification code to verify your phone number.
                  </p>
                </div>
              </form>

              {/* Existing User Alternatives */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span>Already have a SikaPOS account?</span>
                <div className="flex items-center gap-4">
                  <Link
                    to="/cashier-login"
                    className="font-bold text-[#00A859] hover:underline"
                  >
                    Cashier PIN Login
                  </Link>
                  <span>•</span>
                  <Link
                    to="/cashier-login?tab=admin"
                    className="font-semibold text-slate-700 hover:underline"
                  >
                    Admin Sign In
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Your Phone Number"
        description={`We sent a 6-digit verification code to +233 ${phoneNumber}.`}
      >
        <div className="space-y-5 pt-2">
          {otpError && <Alert variant="error">{otpError}</Alert>}

          {/* Development Sandbox Helper Notice */}
          {debugOtp && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-semibold">Sandbox Testing Code:</span>{' '}
              <code className="bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-amber-950">{debugOtp}</code>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              autoFocus
              disabled={isVerifyingOtp}
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full h-14 text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Network: {otpCarrier || 'Ghana Telco'}</span>
            {cooldown > 0 ? (
              <span className="font-mono text-amber-700 font-semibold">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                disabled={isResendingOtp || isVerifyingOtp}
                onClick={handleResendOtp}
                className="font-bold text-[#00A859] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResendingOtp ? 'Resending Code...' : 'Resend Code'}
              </button>
            )}
          </div>

          <div className="pt-2">
            <Button
              id="verify-register-button"
              type="button"
              className="w-full"
              size="lg"
              disabled={isVerifyingOtp || isResendingOtp}
              isLoading={isVerifyingOtp}
              onClick={handleVerifyAndRegister}
            >
              Verify and Create Account
            </Button>
          </div>
        </div>
      </Modal>

      <LoadingOverlay
        isOpen={isVerifyingOtp}
        message="Creating Merchant Account"
        submessage="Verifying credentials and setting up your store tenant..."
      />

      <Footer />
    </div>
  );
};
