import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../visuals/BrandLogo';
import { Badge } from '../ui/Badge';
import { PhoneCall, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/merchant-signup', label: 'Register' },
    { path: '/store-setup', label: 'Setup Wizard' },
    { path: '/launch-readiness', label: 'Launch Readiness' },
    { path: '/cashier-login', label: 'Cashier Terminal' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/merchant-signup" className="flex items-center gap-2">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#0D5C3A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Support */}
        <div className="flex items-center gap-3">
          <Badge variant="online" pulse className="hidden sm:inline-flex">
            Online • Cloud Synced
          </Badge>

          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
            <span>Support: +233 24 000 0000</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-[#E8F5EE] px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D5C3A]" />
            <span className="hidden sm:inline">Protected</span>
          </div>
        </div>
      </div>
    </header>
  );
};
