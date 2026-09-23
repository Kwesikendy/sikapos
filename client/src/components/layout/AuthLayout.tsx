import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PosTerminalMockup } from '../visuals/PosTerminalMockup';
import { Zap, WifiOff, Smartphone } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  showPreview?: boolean;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showPreview = true,
  title = 'Run your shop from one place.',
  subtitle = 'Built for Ghanaian retailers, pharmacies, minimarts, and boutiques.',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        {showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Product Showcase & Authentic Value Props (5 cols) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 sticky top-24">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5EE] text-[#0D5C3A] text-xs font-bold border border-emerald-200">
                  Ghana Retail Cloud
                </span>
                <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                  {title}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Realistic POS Preview */}
              <div className="w-full shadow-lg rounded-2xl overflow-hidden border border-slate-200">
                <PosTerminalMockup />
              </div>

              {/* Practical Value Points */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Direct MoMo and Bank Settlements</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Accept MTN MoMo and Telecel Cash with instant confirmation and automated daily payout.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Offline Continuity</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Keep scanning and ringing cash sales during cellular network downtime. Transactions sync once connection restores.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Works on Hardware You Already Own</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Use standard Android phones, tablets, or laptops. Connect wireless thermal printers whenever you are ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Main Form Content (7 cols) */}
            <div className="lg:col-span-7 w-full flex flex-col justify-center">
              {children}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">{children}</div>
        )}
      </main>

      <Footer />
    </div>
  );
};
