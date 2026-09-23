import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../visuals/BrandLogo';
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/merchant-signup', label: 'Overview' },
    { path: '/store-setup', label: 'Setup Wizard' },
    { path: '/launch-readiness', label: 'Readiness' },
    { path: '/cashier-login', label: 'Cashier POS' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo - clean and uncluttered */}
        <Link to="/merchant-signup" className="flex items-center gap-3">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'text-sm font-medium transition-colors duration-150 relative py-1',
                  isActive
                    ? 'text-[#00A859] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A859] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            to="/cashier-login"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
          >
            Cashier Sign In
          </Link>
          <Link
            to="/merchant-signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#00A859] hover:bg-[#00924C] shadow-sm hover:shadow transition-all active-depress"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/merchant-signup"
            className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#00A859]"
          >
            Sign Up
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium',
                  location.pathname === item.path
                    ? 'bg-emerald-50 text-[#00A859] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/cashier-login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Cashier PIN Sign In
            </Link>
            <Link
              to="/merchant-signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full text-sm font-semibold text-white bg-[#00A859]"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
