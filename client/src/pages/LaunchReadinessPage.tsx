import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  CheckCircle2,
  Store,
  Wifi,
  Receipt,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const LaunchReadinessPage: React.FC = () => {
  const navigate = useNavigate();
  const [offlineMode, setOfflineMode] = useState(true);
  const [pin, setPin] = useState('1234');
  const [pinSaved, setPinSaved] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Top Status Header */}
        <div className="w-full bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Setup Complete
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Ready for Business • Launchpad Activation
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="online" pulse>
              Terminal Stand #01 Online
            </Badge>
          </div>
        </div>

        {/* Dual Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Terminal Fast-Switch Security (5 cols) */}
          <Card elevated className="lg:col-span-5 p-6 sm:p-8 space-y-6 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
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
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center text-xs font-bold">
                  KM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Kwabena Mensah</p>
                  <p className="text-[11px] text-slate-500">Primary Till • Store Manager</p>
                </div>
              </div>
              <Badge variant="primary">Active</Badge>
            </div>

            {/* Keypad */}
            <PinKeypad onComplete={handlePinComplete} />

            {/* Offline Mode Switch */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={offlineMode}
                  onChange={(e) => setOfflineMode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0D5C3A] focus:ring-0 accent-[#0D5C3A] cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-900">
                    Enable offline transaction mode on this device
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Offline mode will queue transactions locally when connection drops. Automatically syncs once internet is restored.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Right: Launchpad Readiness Checklist & Action (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <Card elevated className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-[#E8F5EE] px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                  Readiness Score: 100%
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Ready for Business
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0D5C3A] shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Ready</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Launch Trigger */}
              <div className="pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleLaunch}
                  className="w-full h-14 text-base font-bold"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Open Cashier Terminal
                </Button>
                <p className="text-center text-xs text-slate-500 mt-2">
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
