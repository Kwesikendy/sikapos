import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0D5C3A]" aria-hidden="true" />
          <span>Ghana Data Protection Act (Act 843) Aligned • Bank-Grade Security</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span>Support: <a href="tel:+233240000000" className="hover:text-slate-800 transition-colors font-semibold">+233 24 000 0000</a></span>
          <span className="text-slate-300">•</span>
          <span>Mastermade Solutions • SikaPOS</span>
          <span className="text-slate-300">•</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
};
