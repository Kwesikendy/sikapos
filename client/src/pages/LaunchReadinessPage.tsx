import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  CheckCircle2,
  Store,
  Receipt,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const LaunchReadinessPage: React.FC = () => {
  const navigate = useNavigate();
  const [offlineMode, setOfflineMode] = useState(true);
  const [, setPin] = useState('1234');
  const [, setPinSaved] = useState(false);

  const checklistItems = [
    { title: 'Merchant Account Verified', desc: 'Kwabena Mensah • Registered Owner', status: 'ready', icon: ShieldCheck },
    { title: 'Store Outlet Branch Configured', desc: 'Osu Oxford St. Branch (GA-183-9024)', status: 'ready', icon: Store },
    { title: 'GRA Sales Tax Profile Set', desc: 'Standard 15% VAT + 2.5% NHIL + 2.5% GETFund', status: 'ready', icon: Receipt },
    { title: 'Settlement Account Linked', desc: 'MTN Mobile Money (+233 24 412 3456)', status: 'ready', icon: Smartphone },
    { title: 'Cashier Shift Terminal Ready', desc: 'Tactile 4-digit PIN authentication active', status: 'ready', icon: Terminal },
  ];

  const handlePinComplete = (enteredPin: string) => {
    setPin(enteredPin);
    setPinSaved(true);
  };

  const handleLaunch = () => {
    navigate('/cashier-login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Top Status Header */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00A859] text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                Setup Complete
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Ready for Business • Launchpad Activation
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-[#00A859] border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#00A859] animate-pulse" />
              <span>Terminal Stand #01 Online</span>
            </div>
          </div>
        </div>

        {/* Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Terminal Fast-Switch Security (5 cols) */}
          <Card elevated className="lg:col-span-5 p-6 sm:p-8 space-y-6 text-left bg-white">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                Countertop Security
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Cashier Fast-Switch PIN
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Staff use this 4-digit code to ring sales quickly without needing your admin password.
              </p>
            </div>

            {/* Active Cashier Identity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00A859] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  KM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Kwabena Mensah</p>
                  <p className="text-[11px] text-slate-500">Primary Till • Store Manager</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#00A859]">
                Active
              </span>
            </div>

            {/* Keypad */}
            <PinKeypad onComplete={handlePinComplete} />

            {/* Offline Mode Switch */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={offlineMode}
                  onChange={(e) => setOfflineMode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#00A859] focus:ring-0 accent-[#00A859] cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-900">
                    Enable offline transaction mode on this device
                  </p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Offline mode will queue transactions locally when connection drops. Automatically syncs once internet is restored.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Right: Launchpad Readiness Checklist & Action (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <Card elevated className="p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A859] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                  Readiness Score: 100%
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Ready for Business
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Your store workspace and till configuration are validated and ready to take customer transactions.
                </p>
              </div>

              {/* Verified Checklist */}
              <div className="space-y-3 pt-2">
                {checklistItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center shrink-0">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A859] shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Ready</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Launch Trigger */}
              <div className="pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleLaunch}
                  className="w-full h-14 text-base font-bold shadow-md hover:shadow-lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Open Cashier Terminal
                </Button>
                <p className="text-center text-xs text-slate-500 mt-2.5">
                  Launches high-cadence checkout mode with local cache and instant MoMo push.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
