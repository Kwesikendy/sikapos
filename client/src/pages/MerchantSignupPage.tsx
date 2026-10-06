import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassSurface } from '../components/ui/GlassSurface';
import { FormSection } from '../components/ui/FormSection';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { authApi } from '../api/auth.api';
import { ApiError } from '../types/auth.types';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const MerchantSignupPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState('Kwabena Mensah');
  const [phoneNumber, setPhoneNumber] = useState('0244123456');
  const [email, setEmail] = useState('kwabena@mensahstores.com');
  const [businessName, setBusinessName] = useState('Mensah Provision Store');
  const [branchName, setBranchName] = useState('Osu Oxford St. Branch');
  const [password, setPassword] = useState('OsuPass2025#');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCarrier, setOtpCarrier] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
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

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid Ghanaian mobile phone number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Request OTP from backend
      const res = await authApi.requestSignupOtp(phoneNumber);
      setOtpCarrier(res.carrier);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
      }
      setCooldown(60);
      setShowOtpModal(true);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.remainingCooldownSeconds) {
        setCooldown(apiErr.remainingCooldownSeconds);
        setShowOtpModal(true);
      }
      setError(apiErr.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setOtpError(null);
    try {
      const res = await authApi.requestSignupOtp(phoneNumber);
      if (res.debugCode) {
        setDebugOtp(res.debugCode);
      }
      setCooldown(60);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setOtpError(apiErr.message || 'Failed to resend code.');
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otpCode || otpCode.length < 6) {
      setOtpError('Please enter the full 6-digit verification code.');
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
        tradeCategory: 'grocery_minimart',
        ownerFullName: fullName,
        ownerEmail: email,
        ownerPhone: phoneNumber,
        password,
        primaryBranchName: branchName,
      });

      setShowOtpModal(false);
      navigate('/store-setup');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setOtpError(apiErr.message || 'Verification failed. Please check the code.');
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

        {/* Clean, Grouped Form applying Proximity Law */}
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          
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
          <FormSection title="3. Security">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              helperText="At least 8 characters"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          {/* Level 1: Primary Action (Von Restorff Effect) */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
              isLoading={isLoading}
              loadingText="Sending verification code..."
              rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
            >
              Verify Phone & Continue
            </Button>
          </div>
        </form>

        {/* Level 2/3: Clear, low-friction secondary route */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500">
          <span>Already have a store?</span>
          <Link
            to="/cashier-login"
            className="font-bold text-[#0D5C3A] hover:text-[#09432A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded px-1"
          >
            Sign in to terminal →
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
        <div className="space-y-4 pt-2">
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
                onClick={handleResendOtp}
                className="font-bold text-[#0D5C3A] hover:underline cursor-pointer"
              >
                Resend Code
              </button>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="w-full"
              size="lg"
              isLoading={isVerifyingOtp}
              loadingText="Verifying..."
              onClick={handleVerifyAndRegister}
            >
              Verify & Complete Registration
            </Button>
          </div>
        </div>
      </Modal>
    </AuthLayout>
  );
};
