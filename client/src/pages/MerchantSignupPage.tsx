import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { authApi } from '../api/auth.api';
import { ApiError } from '../types/auth.types';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

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
      // Step 1: Request OTP from real backend
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
    <AuthLayout
      title="Run your shop from one place."
      subtitle="Built for modern Ghanaian traders, pharmacies, minimarts, and retail shops."
    >
      <Card elevated className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
              Stage 02 • Merchant Registration
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Create Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Set up your business tenant and store manager access.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold self-start sm:self-auto border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-[#0D5C3A]" />
            <span>Store Owner</span>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="my-5">
          <Alert variant="info">
            Cashiers do not register here. You will invite staff with fast 4-digit PINs after setting up your store.
          </Alert>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <Input
            label="Full Name"
            helperText="As printed on your Ghana Card"
            placeholder="e.g. Kwabena Mensah"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <PhoneInput
            label="Mobile Phone Number"
            helperText="Used for instant OTP verification and MoMo settlements"
            value={phoneNumber}
            onChange={setPhoneNumber}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. kwabena@mensahstores.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Trade Name"
              placeholder="e.g. Mensah Provision Store"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />

            <Input
              label="Primary Outlet / Branch"
              placeholder="e.g. Osu Oxford St. Branch"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Account Password"
            type={showPassword ? 'text' : 'password'}
            helperText="Minimum 8 characters with at least one number and special character"
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          <div className="pt-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Phone and Continue
            </Button>
          </div>
        </form>

        {/* Existing User Alternatives */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Already have an account?</span>
          <div className="flex items-center gap-4">
            <Link
              to="/cashier-login"
              className="font-semibold text-[#0D5C3A] hover:underline"
            >
              Cashier PIN Login
            </Link>
            <span>•</span>
            <Link
              to="/cashier-login?tab=admin"
              className="font-semibold text-slate-700 hover:underline"
            >
              Admin Password Login
            </Link>
          </div>
        </div>
      </Card>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Your Phone Number"
        description={`We sent a 6-digit verification code to +233 ${phoneNumber}.`}
      >
        <div className="space-y-4 pt-2">
          {otpError && <Alert variant="error">{otpError}</Alert>}

          {/* Development Sandbox Helper Notice */}
          {debugOtp && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <span className="font-semibold">Sandbox Testing Code:</span>{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{debugOtp}</code>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              autoFocus
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full h-14 text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Network: {otpCarrier || 'Ghana Telco'}</span>
            {cooldown > 0 ? (
              <span className="font-mono text-amber-700">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-semibold text-[#0D5C3A] hover:underline cursor-pointer"
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
              onClick={handleVerifyAndRegister}
            >
              Verify and Complete Registration
            </Button>
          </div>
        </div>
      </Modal>
    </AuthLayout>
  );
};
