import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Stepper, StepItem } from '../components/ui/Stepper';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
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

const STEPS: StepItem[] = [
  { id: 1, label: 'Owner Profile' },
  { id: 2, label: 'Store Setup' },
  { id: 3, label: 'Tax Profile' },
  { id: 4, label: 'Cashier & Payout' },
];

const CATEGORIES = [
  { id: 'provision', label: 'Provision & Supermarket', desc: 'Fast-moving consumer goods, snacks, beverages' },
  { id: 'pharmacy', label: 'Pharmacy & Wellness', desc: 'Prescription medicines, OTC drugs, toiletries' },
  { id: 'boutique', label: 'Boutique & Apparel', desc: 'Clothing, footwear, fabrics, accessories' },
  { id: 'electronics', label: 'Electronics & Repairs', desc: 'Phones, hardware gadgets, accessories' },
];

export const StoreSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);

  // Step 1: Owner Profile
  const [ownerName, setOwnerName] = useState('Kwabena Mensah');
  const [ownerPhone, setOwnerPhone] = useState('0244123456');
  const [ownerEmail, setOwnerEmail] = useState('kwabena@mensahstores.com');

  // Step 2: Store Details
  const [businessName, setBusinessName] = useState('Mensah Provision Store & Supermarket');
  const [selectedCategory, setSelectedCategory] = useState('provision');
  const [branchName, setBranchName] = useState('Osu Oxford St. Branch');
  const [ghanaPostGps, setGhanaPostGps] = useState('GA-183-9024');

  // Step 3: Tax Profile (Ghana GRA Options)
  const [taxMode, setTaxMode] = useState<'standard' | 'non_vat'>('standard');
  const [tinNumber, setTinNumber] = useState('P0012345678');

  // Step 4: Cashier PIN & Payout
  const [cashierPin, setCashierPin] = useState('1234');
  const [payoutMomoNumber, setPayoutMomoNumber] = useState('0244123456');

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/launch-readiness');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Step Indicator */}
          <motion.div variants={staggerItem} className="mb-8">
            <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
          </motion.div>

          {/* Step Content Shell */}
          <motion.div variants={staggerItem}>
            <Card glass className="p-6 sm:p-10 shadow-lg border-white/50 bg-white/70 backdrop-blur-xl">
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
                        />
                        <PhoneInput
                          label="Primary Mobile Phone"
                          value={ownerPhone}
                          onChange={setOwnerPhone}
                          required
                        />
                        <Input
                          label="Email Address"
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          required
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
                                  onClick={() => setSelectedCategory(cat.id)}
                                  className={cn(
                                    'p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between shadow-xs',
                                    isSelected
                                      ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.02]'
                                      : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
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
                            startIcon={<Store className="w-5 h-5" />}
                          />

                          <Input
                            label="GhanaPost GPS Digital Address"
                            helperText="Ghana's national address system (e.g. GA-183-9024)"
                            placeholder="e.g. GA-183-9024"
                            value={ghanaPostGps}
                            onChange={(e) => setGhanaPostGps(e.target.value)}
                            required
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
                          onClick={() => setTaxMode('standard')}
                          className={cn(
                            'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-5 shadow-xs',
                            taxMode === 'standard'
                              ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.01]'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", taxMode === 'standard' ? 'bg-[#0D5C3A] text-white' : 'bg-slate-200 text-slate-600')}>
                            <Receipt className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-slate-900">
                                VAT Registered Business (Standard Configuration)
                              </h3>
                              {taxMode === 'standard' && (
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
                          onClick={() => setTaxMode('non_vat')}
                          className={cn(
                            'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-5 shadow-xs',
                            taxMode === 'non_vat'
                              ? 'bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-md transform scale-[1.01]'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", taxMode === 'non_vat' ? 'bg-[#0D5C3A] text-white' : 'bg-slate-200 text-slate-600')}>
                            <Percent className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-slate-900">
                                Not VAT Registered
                              </h3>
                              {taxMode === 'non_vat' && (
                                <CheckCircle2 className="w-5 h-5 text-[#0D5C3A]" />
                              )}
                            </div>
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                              Your shelf prices will not include VAT or associated government levies.
                            </p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {taxMode === 'standard' && (
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
                          Set up your counter PIN and destination account for Mobile Money deposits.
                        </p>
                      </div>

                      <div className="space-y-5 pt-2">
                        <Input
                          label="Master Till Cashier PIN (4 Digits)"
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

                        <PhoneInput
                          label="Settlement Mobile Money Account"
                          helperText="Instant payouts from customer MTN MoMo and Telecel Cash drop here"
                          value={payoutMomoNumber}
                          onChange={setPayoutMomoNumber}
                          required
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
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="px-8 shadow-md"
                >
                  {currentStep === 4 ? 'Save and Go to Launchpad' : 'Continue'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
