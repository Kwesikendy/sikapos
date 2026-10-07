import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassSurface } from '../components/ui/GlassSurface';
import { FormSection } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ApiError } from '../types/auth.types';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import {
  auth as firebaseAuth,
  googleProvider,
  signInWithPopup,
} from '../lib/firebase';

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

interface MerchantSignupFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  businessName: string;
  branchName: string;
  password: string;
}

export const MerchantSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerMerchant, loginWithGoogle, loginWithFirebaseToken } = useAuth();
  const { toast } = useToast();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Validation & Error States
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MerchantSignupFormData, string>>>({});
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGooglePreFill = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Authenticate with Google Popup via Firebase
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      const fbUser = userCredential.user;

      // Extract and prefill Google user information immediately
      if (fbUser.displayName) setFullName(fbUser.displayName);
      if (fbUser.email) setEmail(fbUser.email);
      if (fbUser.phoneNumber) {
        setPhoneNumber(fbUser.phoneNumber.replace('+233', '0'));
      }
      if (fbUser.uid) setFirebaseUid(fbUser.uid);

      // 2. Check if user already has an existing store account
      const idToken = await fbUser.getIdToken();
      try {
        await loginWithFirebaseToken(idToken);
        toast.success('Welcome back!', 'Logging into your SikaPOS store.');
        navigate('/dashboard');
        return;
      } catch (loginErr: any) {
        if (loginErr?.code === 'USER_NOT_REGISTERED') {
          toast.success(
            'Google account linked!',
            'Please fill in your store details below to finish creating your account.'
          );
          scrollToForm();
        } else {
          throw loginErr;
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      setError(err?.message || 'Could not connect Google account.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCarrier, setOtpCarrier] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
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

  const normalizeGhanaPhone = (raw: string): string => {
    let cleaned = raw.replace(/[\s\-().]/g, '');
    if (cleaned.startsWith('+233')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('233')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (/^[25]\d{8}$/.test(cleaned)) {
      return '0' + cleaned;
    }
    return raw.replace(/[\s\-().]/g, '');
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setFieldErrors({});

    const formattedPhone = normalizeGhanaPhone(phoneNumber);

    if (!/^0[25]\d{8}$/.test(formattedPhone)) {
      setError(
        'Please enter a valid 10-digit Ghanaian mobile number (e.g. 059 929 5290 or 024 123 4567).'
      );
      return;
    }

    if (!firebaseUid) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!/\d/.test(password)) {
        setError('Password must include at least one number.');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must include at least one uppercase letter (e.g. A-Z).');
        return;
      }
    }

    if (!hasAgreedToTerms) {
      setError('Please confirm you are at least 18 years old and agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    // Direct registration for Google-linked accounts (identity already verified by Google OAuth)
    if (firebaseUid) {
      setIsLoading(true);
      try {
        await registerMerchant({
          businessLegalName: `${businessName.trim() || 'My Store'} Ltd`,
          businessTradeName: businessName.trim() || 'My Store',
          tradeCategory: 'provision_supermarket',
          ownerFullName: fullName.trim() || 'Store Owner',
          ownerEmail: email.trim(),
          ownerPhone: formattedPhone,
          password: password || 'GoogleAuth2025!',
          primaryBranchName: branchName.trim() || `${businessName.trim() || 'My Store'} Main Branch`,
          primaryBranchRegion: 'Greater Accra',
          primaryBranchGps: 'GA-000-0000',
          primaryBranchAddress: branchName.trim() || `${businessName.trim() || 'My Store'}, Accra`,
          primaryBranchPhone: formattedPhone,
          firebaseUid,
        });

        toast.success('Registration successful', 'Your SikaPOS store account has been created.');
        navigate('/store-setup');
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        let errMessage = apiErr.message;
        if (apiErr.details) {
          const detailsList = Object.values(apiErr.details).filter(Boolean);
          if (detailsList.length > 0) {
            errMessage = detailsList.join('. ');
          }
        }
        setError(errMessage || 'Registration failed. Please check your details and try again.');
        toast.error('Registration failed', errMessage || 'Registration failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard phone SMS OTP verification flow
    setIsLoading(true);
    try {
      // Step 1: Request OTP from backend
      const res = await authApi.requestSignupOtp(formattedPhone);
      setOtpCarrier(res.carrier);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
        setOtpCode(res.debugCode);
      }
      setCooldown(60);
      setShowOtpModal(true);
      toast.success(
        'Verification code ready',
        res.debugCode
          ? 'Verification code generated for testing.'
          : 'Please check your phone for the 6-digit OTP code.'
      );
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.remainingCooldownSeconds) {
        setCooldown(apiErr.remainingCooldownSeconds);
        setShowOtpModal(true);
      }
      let errMessage = apiErr.message;
      if (apiErr.details && apiErr.details.phoneNumber) {
        errMessage = apiErr.details.phoneNumber;
      }
      setError(errMessage || 'Could not send verification code. Please check your phone number and try again.');
      toast.error('Failed to dispatch OTP', errMessage || 'Could not send verification code.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendOtp = async () => {
    if (cooldown > 0 || isResendingOtp || isVerifyingOtp) return;
    setIsResendingOtp(true);
    setOtpError(null);
    try {
      const formattedPhone = normalizeGhanaPhone(phoneNumber);
      const res = await authApi.requestSignupOtp(formattedPhone);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
        setOtpCode(res.debugCode);
      }
      setCooldown(60);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr.message || 'Failed to resend code.';
      setOtpError(msg);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (isVerifyingOtp) return;

    // Validate OTP manually
    if (!otpCode || otpCode.length < 6) {
      const msg = 'Please enter the full 6-digit verification code.';
      setOtpError(msg);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    const formattedPhone = normalizeGhanaPhone(phoneNumber);

    try {
      // Step 2: Verify OTP
      await authApi.verifySignupOtp(formattedPhone, otpCode);

      // Step 3: Register Merchant Tenant
      await registerMerchant({
        businessLegalName: `${businessName.trim() || 'My Store'} Ltd`,
        businessTradeName: businessName.trim() || 'My Store',
        tradeCategory: 'provision_supermarket',
        ownerFullName: fullName.trim() || 'Store Owner',
        ownerEmail: email.trim(),
        ownerPhone: formattedPhone,
        password,
        primaryBranchName: branchName.trim() || `${businessName.trim() || 'My Store'} Main Branch`,
        primaryBranchRegion: 'Greater Accra',
        primaryBranchGps: 'GA-000-0000',
        primaryBranchAddress: branchName.trim() || `${businessName.trim() || 'My Store'}, Accra`,
        primaryBranchPhone: formattedPhone,
        firebaseUid: firebaseUid || undefined,
      });

      setShowOtpModal(false);
      toast.success('Registration successful', 'Your SikaPOS store account has been created.');
      navigate('/store-setup');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      let errMessage = apiErr.message;
      if (apiErr.details) {
        const detailsList = Object.values(apiErr.details).filter(Boolean);
        if (detailsList.length > 0) {
          errMessage = detailsList.join('. ');
        }
      }
      setOtpError(errMessage || 'Verification failed. Please check the code.');
      toast.error('Registration failed', errMessage || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <AuthLayout>
      <GlassSurface
        variant="light"
        intensity="high"
        className="w-full p-6 sm:p-8 bg-white/95 rounded-2xl border border-slate-200/80 shadow-card"
      >
        {/* Screen Title & Narrative */}
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Store Account
          </h2>
          <p className="text-sm text-slate-500">
            Start selling in minutes with your phone number and store profile.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" className="shadow-xs">{error}</Alert>
          </div>
        )}

        {/* Google Quick Connect */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGooglePreFill}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{firebaseUid ? `Google Connected (${email})` : 'Fast Sign Up with Google'}</span>
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                or fill store details
              </span>
            </div>
          </div>
        </div>

        {/* Clean, Grouped Form applying Proximity Law */}
        <form ref={formRef} onSubmit={handleInitialSubmit} className="space-y-6">
          
          {/* Group 1: Your Details */}
          <FormSection title="1. Your Details">
            <Input
              label="Full Name"
              placeholder="e.g. Kwabena Mensah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PhoneInput
                label="Mobile Phone"
                value={phoneNumber}
                onChange={setPhoneNumber}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. kwabena@shop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </FormSection>

          {/* Group 2: Your Business */}
          <FormSection title="2. Your Business">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Name"
                placeholder="e.g. Mensah Provision Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <Input
                label="Branch / Location"
                placeholder="e.g. Osu Oxford St."
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
              />
            </div>
          </FormSection>

          {/* Group 3: Security */}
          <FormSection title={firebaseUid ? "3. Security (Optional for Google)" : "3. Security"}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              helperText={firebaseUid ? "Optional (your Google account manages login)" : "At least 8 characters, 1 number, and 1 uppercase letter"}
              placeholder={firebaseUid ? "Optional backup password" : "Create a secure password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!firebaseUid}
              startIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </FormSection>

          {/* Statutory Consent & Age Verification (Ghana Act 843) */}
          <div className="flex items-start gap-2.5 pt-2 text-left">
            <input
              id="consent-checkbox"
              type="checkbox"
              required
              checked={hasAgreedToTerms}
              onChange={(e) => setHasAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A] cursor-pointer"
            />
            <label htmlFor="consent-checkbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
              I confirm I am at least 18 years old, authorized to bind this business, and agree to the{' '}
              <Link to="/legal/terms" target="_blank" className="font-bold text-[#0D5C3A] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/legal/privacy" target="_blank" className="font-bold text-[#0D5C3A] hover:underline">
                Privacy Policy
              </Link>.
            </label>
          </div>

          {/* Level 1: Primary Action (Von Restorff Effect) */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
              isLoading={isLoading}
              loadingText={firebaseUid ? "Creating your store..." : "Sending verification code..."}
              rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
            >
              {firebaseUid ? "Create Store Account" : "Verify Phone & Continue"}
            </Button>
          </div>
        </form>

        {/* Level 2/3: Clear, low-friction secondary route */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500">
          <span>Already have a store?</span>
          <Link
            to="/login"
            className="font-bold text-[#0D5C3A] hover:text-[#09432A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded px-1"
          >
            Sign in to your store →
          </Link>
        </div>
      </GlassSurface>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Your Phone"
        description={`We sent a 6-digit code to +233 ${phoneNumber}.`}
      >
        <div className="space-y-5 pt-2">
          {otpError && <Alert variant="error">{otpError}</Alert>}

          {/* Sandbox Development Code */}
          {debugOtp && (
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>Testing OTP:</span>
              <code className="bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-sm">{debugOtp}</code>
            </div>
          )}

          <div>
            <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter 6-Digit Code
            </label>
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              autoFocus
              disabled={isVerifyingOtp}
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              aria-label="6-digit verification code"
              className="w-full h-14 text-center font-mono text-2xl font-bold tracking-[0.4em] rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>{otpCarrier || 'Ghana Telco'}</span>
            {cooldown > 0 ? (
              <span className="font-mono text-amber-700 font-semibold">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                disabled={isResendingOtp || isVerifyingOtp}
                onClick={handleResendOtp}
                className="font-bold text-[#0D5C3A] hover:underline cursor-pointer"
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
              loadingText="Verifying..."
              onClick={handleVerifyAndRegister}
            >
              Verify & Complete Registration
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
    </AuthLayout>
  );
};
