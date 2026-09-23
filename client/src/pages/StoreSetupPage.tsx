import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [currentStep, setCurrentStep] = useState(2); // Starts on Step 2 (Store Setup)

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
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Step Indicator */}
        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>

        {/* Step Content Shell */}
        <Card elevated className="p-8 sm:p-10 bg-white">
          {/* STEP 1: OWNER PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-6 text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                  Step 1 of 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Owner Profile
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Confirm your primary administrator identity for SikaPOS.
                </p>
              </div>

              <div className="space-y-4 pt-2">
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
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                  Step 2 of 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Store Setup and Location
                </h2>
                <p className="text-sm text-slate-600 mt-1">
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
                  startIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                />

                {/* Retail Category Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Primary Retail Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            'p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between',
                            isSelected
                              ? 'bg-emerald-50/80 border-[#00A859] ring-2 ring-[#00A859]'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-900">{cat.label}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#00A859]" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{cat.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Primary Branch Name"
                    placeholder="e.g. Osu Oxford St. Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    startIcon={<Store className="w-4 h-4 text-slate-400" />}
                  />

                  <Input
                    label="GhanaPost GPS Digital Address"
                    helperText="Ghana's national address system (e.g. GA-183-9024)"
                    placeholder="e.g. GA-183-9024"
                    value={ghanaPostGps}
                    onChange={(e) => setGhanaPostGps(e.target.value)}
                    required
                    startIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TAX CONFIGURATION */}
          {currentStep === 3 && (
            <div className="space-y-6 text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                  Step 3 of 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Ghana Revenue Authority (GRA) Tax Profile
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Choose how sales taxes are computed on itemized customer till receipts.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Option 1: Standard GRA VAT Registered */}
                <div
                  onClick={() => setTaxMode('standard')}
                  className={cn(
                    'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-4',
                    taxMode === 'standard'
                      ? 'bg-emerald-50/80 border-[#00A859] ring-2 ring-[#00A859]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#00A859] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        VAT Registered Business (Standard Configuration)
                      </h3>
                      {taxMode === 'standard' && (
                        <CheckCircle2 className="w-5 h-5 text-[#00A859]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Prices include standard Ghana levies: 15% VAT, 2.5% NHIL, and 2.5% GETFund.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
                        15.0% VAT
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
                        2.5% NHIL
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
                        2.5% GETFund
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Not VAT Registered */}
                <div
                  onClick={() => setTaxMode('non_vat')}
                  className={cn(
                    'p-5 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-4',
                    taxMode === 'non_vat'
                      ? 'bg-emerald-50/80 border-[#00A859] ring-2 ring-[#00A859]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Not VAT Registered
                      </h3>
                      {taxMode === 'non_vat' && (
                        <CheckCircle2 className="w-5 h-5 text-[#00A859]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Your shelf prices will not include VAT or associated government levies.
                    </p>
                  </div>
                </div>

                {taxMode === 'standard' && (
                  <div className="pt-2">
                    <Input
                      label="Taxpayer Identification Number (TIN)"
                      helperText="Optional for onboarding. Can be updated later in Settings."
                      placeholder="e.g. P0012345678"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      startIcon={<FileCheck className="w-4 h-4 text-slate-400" />}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CASHIER PIN & PAYOUT */}
          {currentStep === 4 && (
            <div className="space-y-6 text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                  Step 4 of 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Cashier PIN and Payout Destination
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Set up your counter PIN and destination account for Mobile Money deposits.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  label="Master Till Cashier PIN (4 Digits)"
                  type="password"
                  maxLength={4}
                  helperText="Cashiers use this quick 4-digit code to log into countertops and tablets"
                  placeholder="e.g. 1234"
                  value={cashierPin}
                  onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                  required
                  startIcon={<Lock className="w-4 h-4 text-slate-400" />}
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

          {/* Wizard Action Controls */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
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
            >
              {currentStep === 4 ? 'Save and Go to Launchpad' : 'Continue to Next Step'}
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};
