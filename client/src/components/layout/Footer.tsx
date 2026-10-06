import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/95 backdrop-blur-md py-6 sm:py-8 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-xs text-slate-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-[#0D5C3A]" aria-hidden="true" />
            <span className="font-semibold">Ghana Data Protection Act (Act 843) Aligned • Mastermade Solutions</span>
          </div>

          {/* Legal Navigation Links */}
          <nav aria-label="Legal and compliance links" className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 font-medium">
            <Link to="/legal/privacy" className="hover:text-[#0D5C3A] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/legal/terms" className="hover:text-[#0D5C3A] transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/legal/refund" className="hover:text-[#0D5C3A] transition-colors">
              Refund Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/legal/cookies" className="hover:text-[#0D5C3A] transition-colors">
              Cookie Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/legal/data-deletion" className="hover:text-red-600 transition-colors">
              Data Deletion
            </Link>
          </nav>
        </div>

        {/* Entity details & Support Contact */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Mastermade Solutions. SikaPOS & Akoma Commerce Cloud. Accra, Ghana.</p>
          <div className="flex items-center gap-3">
            <span>Support: <a href="mailto:support@sikapos.com" className="hover:text-slate-700 font-semibold">support@sikapos.com</a></span>
            <span className="text-slate-300">•</span>
            <span>Legal: <a href="mailto:legal@mastermadesolutions.com" className="hover:text-slate-700 font-semibold">legal@mastermadesolutions.com</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
