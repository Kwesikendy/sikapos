import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PinKeypad } from '../components/ui/PinKeypad';
import { Badge } from '../components/ui/Badge';
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
import { cn } from '../lib/utils';

export const LaunchReadinessPage: React.FC = () => {
  const navigate = useNavigate();
  const [offlineMode, setOfflineMode] = useState(true);
  const [pin, setPin] = useState('');
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
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Top Status Header */}
          <motion.div variants={staggerItem} className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A]">
                  Setup Complete
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Ready for Business • Launchpad Activation
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <Badge variant="online" pulse className="px-3 py-1.5 shadow-sm border border-emerald-200/50 bg-white/80">
                Terminal Stand #01 Online
              </Badge>
            </div>
          </motion.div>

          {/* Dual Bento Grid */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Terminal Fast-Switch Security (5 cols) */}
            <Card glass className="lg:col-span-5 p-6 sm:p-8 space-y-6 text-left shadow-lg border-white/50 bg-white/60">
              <div className="border-b border-slate-200/60 pb-5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Countertop Security
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-3">
                  Cashier Fast-Switch PIN
                </h2>
                <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                  Staff use this 4-digit code to ring sales quickly without needing your admin password.
                </p>
              </div>

              {/* Active Cashier Identity */}
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center text-[13px] font-bold shadow-inner">
                    KM
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Kwabena Mensah</p>
                    <p className="text-[11px] text-slate-500 font-medium">Primary Till • Store Manager</p>
                  </div>
                </div>
                <Badge variant="primary" className="bg-[#0D5C3A]/10 text-[#0D5C3A] border-none">Active</Badge>
              </div>

              {/* Keypad */}
              <div className="pt-2">
                <PinKeypad onComplete={handlePinComplete} />
              </div>

              {/* Offline Mode Switch */}
              <div className="pt-5 border-t border-slate-200/60">
                <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-200/60 cursor-pointer transition-all shadow-xs group select-none">
                  <input
                    type="checkbox"
                    checked={offlineMode}
                    onChange={(e) => setOfflineMode(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#0D5C3A] focus:ring-0 accent-[#0D5C3A] cursor-pointer"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-slate-900 group-hover:text-[#0D5C3A] transition-colors">
                      Enable offline transaction mode on this device
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                      Offline mode will queue transactions locally when connection drops. Automatically syncs once internet is restored.
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Right: Launchpad Readiness Checklist & Action (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <Card glass className="p-6 sm:p-8 space-y-6 shadow-lg border-white/50 bg-white/70">
                <div className="border-b border-slate-200/60 pb-5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-[#E8F5EE] px-3 py-1 rounded-full border border-emerald-200 inline-flex mb-3 shadow-xs">
                    Readiness Score: 100%
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Ready for Business
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-2 leading-relaxed max-w-lg">
                    Your store workspace and till configuration are validated and ready to take customer transactions.
                  </p>
                </div>

                {/* Verified Checklist */}
                <div className="space-y-3.5 pt-2">
                  {checklistItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={idx}
                        variants={staggerItem}
                        className="p-4 rounded-2xl border border-white bg-white/60 hover:bg-white backdrop-blur-md transition-all flex items-center justify-between gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center shrink-0 border border-emerald-100/50 shadow-sm group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] shrink-0 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ready</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Big Launch Trigger */}
                <div className="pt-6 border-t border-slate-200/60 mt-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleLaunch}
                    className="w-full h-16 text-[15px] font-extrabold shadow-lg shadow-[#0D5C3A]/20"
                    rightIcon={<ArrowRight className="w-6 h-6" />}
                  >
                    Open Cashier Terminal
                  </Button>
                  <p className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-4">
                    Launches high-cadence checkout mode with local cache and instant MoMo push.
                  </p>
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
