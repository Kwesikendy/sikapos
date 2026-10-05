import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../visuals/BrandLogo';
import { Badge } from '../ui/Badge';
import { PhoneCall, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/merchant-signup', label: 'Register' },
    { path: '/store-setup', label: 'Setup Wizard' },
    { path: '/launch-readiness', label: 'Launch Readiness' },
    { path: '/cashier-login', label: 'Cashier Terminal' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b-0 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/merchant-signup" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2 bg-slate-50/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 z-10',
                  isActive ? 'text-[#0D5C3A]' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="header-active-tab"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/50 -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Support */}
        <div className="flex items-center gap-3">
          <Badge variant="online" pulse className="hidden sm:inline-flex bg-white/80 backdrop-blur-sm border-emerald-200/50 shadow-xs">
            Online • Cloud Synced
          </Badge>

          <div className="hidden xl:flex items-center gap-1.5 text-[13px] font-medium text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-xs">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
            <span>Support: +233 24 000 0000</span>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-800 bg-[#E8F5EE]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-200/60 shadow-xs hover:shadow-sm transition-shadow cursor-default">
            <ShieldCheck className="w-4 h-4 text-[#0D5C3A]" />
            <span className="hidden sm:inline">Protected</span>
          </div>
        </div>
      </div>
    </header>
  );
};
