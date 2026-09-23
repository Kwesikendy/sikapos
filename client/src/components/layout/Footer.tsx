import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-100 bg-white py-8 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00A859]" />
          <span>Ghana Data Protection Act 843 Compliant. Bank-grade TLS 1.3 encryption.</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <span>SikaPOS • Akoma Commerce Cloud</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
};
