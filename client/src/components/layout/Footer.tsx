import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0D5C3A]" />
          <span>Ghana Data Protection Act 843 Compliant. Bank-grade TLS encryption.</span>
        </div>

        <div className="flex items-center gap-6">
          <span>SikaPOS • Akoma Commerce Cloud</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
};
