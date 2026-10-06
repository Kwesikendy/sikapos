import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Stepper, StepItem } from '../components/ui/Stepper';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DotPattern } from '../components/visuals/DotPattern';
import { AmbientGlow } from '../components/visuals/AmbientGlow';
import {
  Building2,
  Store,
  MapPin,
  Percent,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  FileCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { authApi } from '../api/auth.api';
import { tenantApi } from '../api/tenant.api';
import { ApiError } from '../types/auth.types';
import { Alert } from '../components/ui/Alert';

const STEPS: StepItem[] = [
  { id: 1, label: 'Owner Profile' },
  { id: 2, label: 'Store Setup' },
  { id: 3, label: 'Tax Profile' },
  { id: 4, label: 'Cashier & Payout' },
];

const CATEGORIES = [
  { id: 'provision_supermarket', label: 'Provision & Supermarket', desc: 'Fast-moving consumer goods, snacks, beverages' },
  { id: 'pharmacy', label: 'Pharmacy & Wellness', desc: 'Prescription medicines, OTC drugs, toiletries' },
  { id: 'fashion', label: 'Boutique & Apparel', desc: 'Clothing, footwear, fabrics, accessories' },
  { id: 'electronics', label: 'Electronics & Repairs', desc: 'Phones, hardware gadgets, accessories' },
];

export const StoreSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [branchId, setBranchId] = useState('');

  // Step 1: Owner Profile
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Step 2: Store Details
  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('provision');
  const [branchName, setBranchName] = useState('');
  const [ghanaPostGps, setGhanaPostGps] = useState('');

  // Step 3: Tax Profile (Ghana GRA Options)
  const [taxMode, setTaxMode] = useState<'standard_gra' | 'not_registered'>('standard_gra');
  const [tinNumber, setTinNumber] = useState('');

  // Step 4: Cashier PIN & Payout
  const [cashierName, setCashierName] = useState('Cashier 01');
  const [cashierPhone, setCashierPhone] = useState('');
  const [cashierPin, setCashierPin] = useState('');
  const [payoutMomoNumber, setPayoutMomoNumber] = useState('');

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const { user, tenant } = await authApi.getCurrentUser();
        setOwnerName(user.fullName);
        setOwnerPhone((user as any).phone || (user as any).phone_number || (user as any).phoneNumber);
        setOwnerEmail(user.email || '');
        setBusinessName(tenant.businessName);
        
        // Match category
        if (tenant.tradeCategory.includes('pharmacy')) setSelectedCategory('pharmacy');
        else if (tenant.tradeCategory.includes('fashion')) setSelectedCategory('boutique');
        else if (tenant.tradeCategory.includes('electronics')) setSelectedCategory('electronics');
        else setSelectedCategory('provision');

        // Fetch Branches
        const branches = await tenantApi.getBranches();
        if (branches.length > 0) {
          const primary = branches.find(b => b.is_primary) || branches[0];
          setBranchId(primary.id);
          setBranchName(primary.name);
          setGhanaPostGps(primary.gps_digital_address);
        }
      } catch (err) {
        setError('Failed to load store data. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContext();
  }, []);

  const handleNext = async () => {
    setError(null);
    
    // Logic per step
    if (currentStep === 1 || currentStep === 2) {
      setCurrentStep(currentStep + 1);
      setStepError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      setIsSaving(true);
      try {
        await tenantApi.updateTaxProfile({
          taxType: taxMode,
          tinNumber: tinNumber
        });
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err: unknown) {
        setError((err as ApiError).message || 'Failed to update tax configuration');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (currentStep === 4) {
      if (cashierPin.length !== 4) {
        setError('Cashier PIN must be exactly 4 digits');
        return;
      }
      if (!cashierPhone) {
        setError('Please provide a valid phone number for the cashier');
        return;
      }
      
      setIsSaving(true);
      try {
        // Create initial cashier
        await tenantApi.createCashier({
          branchId,
          fullName: cashierName,
          phoneNumber: cashierPhone,
          pin: cashierPin
        });
        
        // Setup complete
        navigate('/launch-readiness');
      } catch (err: unknown) {
        setError((err as ApiError).message || 'Failed to setup cashier profile');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (isSaving || isLoadingData) return;
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-[#0D5C3A]/20 border-t-[#0D5C3A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden relative selection:bg-[#0D5C3A]/20 selection:text-[#0D5C3A]">
      <DotPattern variant="emerald" size="md" opacity={0.85} />
      <AmbientGlow color="emerald" position="top-left" className="opacity-40" />
      <AmbientGlow color="amber" position="bottom-right" className="opacity-25" />

      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Step Indicator */}
          <motion.div variants={staggerItem} className="mb-8">
            <Stepper steps={STEPS} currentStep={currentStep} onStepClick={() => {}} />
          </motion.div>

          {error && (
            <motion.div variants={staggerItem} className="mb-6">
              <Alert variant="error" className="shadow-sm">{error}</Alert>
            </motion.div>
          )}

          {/* Step Content Shell */}
          <motion.div variants={staggerItem}>
            <GlassSurface variant="light" intensity="high" className="p-6 sm:p-10 shadow-lg border-white/50 bg-white/70 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {/* STEP 1: OWNER PROFILE */}
                  {currentStep === 1 && (
                    <div className="space-y-6 text-left">
                      <div className="border-b border-slate-200/60 pb-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Step 1 of 4
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                          Owner Profile
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                          Confirm your primary administrator identity for SikaPOS.
                        </p>
                      </div>

                      <div className="space-y-5 pt-2">
                        <Input
                          label="Full Name"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          required
                          disabled
                        />
                        <PhoneInput
                          label="Primary Mobile Phone"
                          value={ownerPhone}
                          onChange={setOwnerPhone}
                          required
                          disabled
                        />
                        <Input
                          label="Email Address"
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          required
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BUSINESS & STORE SETUP */}
                  {currentStep === 2 && (
                    <div className="space-y-6 text-left">
                      <div className="border-b border-slate-200/60 pb-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Step 2 of 4
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                          Store Setup and Location
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                          Configure your primary branch outlet and commercial trade focus.
                        </p>
                      </div>

                      <div className="space-y-5 pt-2">
                        <Input
                          label="Business Organization Legal Name"
                          helperText="Appears on electronic customer till receipts and settlement invoices"
                          placeholder="e.g. Osu Golden Mart Ltd"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                          disabled
                          startIcon={<Building2 className="w-5 h-5" />}
                        />

                        {/* Retail Category Selector */}
                        <div>
                          <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Primary Retail Category
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {CATEGORIES.map((cat) => {
                              const isSelected = selectedCategory === cat.id;
                              return (
                                <div
                                  key={cat.id}
                                  className={cn(
                                    'p-4 rounded-2xl border transition-all select-none text-left flex flex-col justify-between shadow-xs',
                                    isSelected
                                      ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.02]'
                                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-bold text-slate-900">{cat.label}</span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-5 h-5 text-[#0D5C3A]" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                          <Input
                            label="Primary Branch Name"
                            placeholder="e.g. Osu Oxford St. Branch"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            required
                            disabled
                            startIcon={<Store className="w-5 h-5" />}
                          />

                          <Input
                            label="GhanaPost GPS Digital Address"
                            helperText="Ghana's national address system (e.g. GA-183-9024)"
                            placeholder="e.g. GA-183-9024"
                            value={ghanaPostGps}
                            onChange={(e) => setGhanaPostGps(e.target.value)}
                            required
                            disabled
                            startIcon={<MapPin className="w-5 h-5" />}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: TAX CONFIGURATION */}
                  {currentStep === 3 && (
                    <div className="space-y-6 text-left">
                      <div className="border-b border-slate-200/60 pb-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Step 3 of 4
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                          Ghana Revenue Authority (GRA)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                          Choose how sales taxes are computed on itemized customer till receipts.
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        {/* Option 1: Standard GRA VAT Registered */}
                        <div
                          onClick={() => setTaxMode('standard_gra')}
                          className={cn(
                            'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-5 shadow-xs',
                            taxMode === 'standard_gra'
                              ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.01]'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", taxMode === 'standard_gra' ? 'bg-[#0D5C3A] text-white' : 'bg-slate-200 text-slate-600')}>
                            <Receipt className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-slate-900">
                                VAT Registered Business (Standard Configuration)
                              </h3>
                              {taxMode === 'standard_gra' && (
                                <CheckCircle2 className="w-5 h-5 text-[#0D5C3A]" />
                              )}
                            </div>
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                              Prices include standard Ghana levies: 15% VAT, 2.5% NHIL, and 2.5% GETFund.
                            </p>
                            <div className="pt-3 flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 rounded bg-white text-[11px] font-mono font-bold text-slate-700 border border-slate-200 shadow-sm">
                                15.0% VAT
                              </span>
                              <span className="px-2.5 py-1 rounded bg-white text-[11px] font-mono font-bold text-slate-700 border border-slate-200 shadow-sm">
                                2.5% NHIL
                              </span>
                              <span className="px-2.5 py-1 rounded bg-white text-[11px] font-mono font-bold text-slate-700 border border-slate-200 shadow-sm">
                                2.5% GETFund
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Not VAT Registered */}
                        <div
                          onClick={() => setTaxMode('not_registered')}
                          className={cn(
                            'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-5 shadow-xs',
                            taxMode === 'not_registered'
                              ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.01]'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", taxMode === 'not_registered' ? 'bg-[#0D5C3A] text-white' : 'bg-slate-200 text-slate-600')}>
                            <Percent className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-slate-900">
                                Not VAT Registered
                              </h3>
                              {taxMode === 'not_registered' && (
                                <CheckCircle2 className="w-5 h-5 text-[#0D5C3A]" />
                              )}
                            </div>
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                              Your shelf prices will not include VAT or associated government levies.
                            </p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {taxMode === 'standard_gra' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-4"
                            >
                              <Input
                                label="Taxpayer Identification Number (TIN)"
                                helperText="Optional for onboarding. Can be updated later in Settings."
                                placeholder="e.g. P0012345678"
                                value={tinNumber}
                                onChange={(e) => setTinNumber(e.target.value)}
                                startIcon={<FileCheck className="w-5 h-5" />}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: CASHIER PIN & PAYOUT */}
                  {currentStep === 4 && (
                    <div className="space-y-6 text-left">
                      <div className="border-b border-slate-200/60 pb-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Step 4 of 4
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                          Cashier PIN & Payout
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                          Set up your first till cashier and destination account for payouts.
                        </p>
                      </div>

                      <div className="space-y-5 pt-2">
                        <Input
                          label="Cashier Full Name"
                          helperText="Who will be operating the till?"
                          placeholder="e.g. Ama Serwaa"
                          value={cashierName}
                          onChange={(e) => setCashierName(e.target.value)}
                          required
                        />
                        <PhoneInput
                          label="Cashier Mobile Phone"
                          value={cashierPhone}
                          onChange={setCashierPhone}
                          required
                        />
                        <Input
                          label="Till Cashier PIN (4 Digits)"
                          type="password"
                          maxLength={4}
                          helperText="Cashiers use this quick 4-digit code to log into countertops and tablets"
                          placeholder="e.g. 1234"
                          value={cashierPin}
                          onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                          required
                          startIcon={<Lock className="w-5 h-5" />}
                          className="font-mono tracking-widest text-lg"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Wizard Action Controls */}
              <div className="mt-10 pt-6 border-t border-slate-200/60 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleBack}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="shadow-none border-slate-300"
                    disabled={isSaving}
                  >
                    Previous Step
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="button"
                  size="md"
                  onClick={handleNext}
                  isLoading={isSaving}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="px-8 shadow-md"
                >
                  {currentStep === 4 ? 'Save and Go to Launchpad' : 'Continue'}
                </Button>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      </main>

      <LoadingOverlay
        isOpen={isSaving}
        message="Saving Store Setup"
        submessage="Applying branch location, tax profile, and payout details..."
      />

      <Footer />
    </div>
  );
};
