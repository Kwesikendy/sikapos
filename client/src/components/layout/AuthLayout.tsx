import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PosTerminalMockup } from '../visuals/PosTerminalMockup';
import { Zap, WifiOff, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants, staggerContainer, staggerItem } from '../../lib/motion';

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
    <div className="min-h-screen flex flex-col bg-transparent text-slate-900 selection:bg-[#0D5C3A]/20 selection:text-[#0D5C3A]">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10 relative z-10">
        {showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            {/* Left: Product Showcase & Authentic Value Props (5 cols) */}
            <motion.div 
              className="hidden lg:flex lg:col-span-5 flex-col gap-8 sticky top-28"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerItem} className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5EE]/80 backdrop-blur-sm text-[#0D5C3A] text-xs font-bold border border-emerald-200/50 shadow-sm uppercase tracking-wider">
                  Ghana Retail Cloud
                </span>
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  {title}
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-sm">
                  {subtitle}
                </p>
              </motion.div>

              {/* Realistic POS Preview */}
              <motion.div variants={staggerItem} className="w-full shadow-2xl shadow-[#0D5C3A]/5 rounded-3xl overflow-hidden border border-white/50 bg-white/40 backdrop-blur-md p-2">
                <div className="rounded-2xl overflow-hidden shadow-inner border border-slate-100">
                  <PosTerminalMockup />
                </div>
              </motion.div>

              {/* Practical Value Points */}
              <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 pt-4">
                {[
                  { icon: Zap, title: "Direct MoMo and Bank Settlements", desc: "Accept MTN MoMo and Telecel Cash with instant confirmation and automated daily payout.", color: "emerald" },
                  { icon: WifiOff, title: "Offline Continuity", desc: "Keep scanning and ringing cash sales during cellular network downtime. Transactions sync once connection restores.", color: "amber" },
                  { icon: Smartphone, title: "Works on Hardware You Already Own", desc: "Use standard Android phones, tablets, or laptops. Connect wireless thermal printers whenever you are ready.", color: "sky" }
                ].map((item, idx) => (
                  <motion.div key={idx} variants={staggerItem} className="p-4 rounded-2xl bg-white/70 backdrop-blur-lg border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm bg-${item.color}-50 text-${item.color}-600 border border-${item.color}-100`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Main Form Content (7 cols) */}
            <motion.div 
              className="lg:col-span-7 w-full flex flex-col justify-center min-h-[75vh]"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </div>
        ) : (
          <motion.div 
            className="max-w-4xl mx-auto w-full min-h-[75vh] flex flex-col justify-center"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};
