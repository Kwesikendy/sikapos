import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkStatus } from '../pwa/NetworkStatus';
import { Menu, X, LayoutDashboard, ShoppingCart, LogIn, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AppNavbarProps {
  className?: string;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ className }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/merchant-signup' ||
    location.pathname === '/cashier-login' ||
    location.pathname === '/store-setup' ||
    location.pathname === '/launch-readiness';

  const showInternalLinks = isAuthenticated && !isAuthPage;

  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-6 pt-2.5 sm:pt-4 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs transition-all pointer-events-auto ${className || ''}`}
        style={{
          boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* ── Official Brand Identity ── */}
          <Link
            to={showInternalLinks ? '/dashboard' : '/login'}
            className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded-xl py-1 transition-transform"
            aria-label="SikaPOS Home"
          >
            <img
              src="/logo.png"
              alt="SikaPOS"
              className="h-9 sm:h-10 w-auto object-contain rounded-lg drop-shadow-xs transition-transform group-hover:scale-105"
            />
          </Link>

          {/* ── Desktop Navigation Links (ONLY for authenticated sessions inside app) ── */}
          {showInternalLinks && (
            <nav
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600"
              aria-label="Primary Navigation"
            >
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] ${
                  location.pathname.startsWith('/dashboard')
                    ? 'text-[#0D5C3A] bg-emerald-50/80 font-bold'
                    : 'text-slate-700 hover:text-[#0D5C3A] hover:bg-slate-100/70'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/pos"
                className={`px-3.5 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] ${
                  location.pathname.startsWith('/pos')
                    ? 'text-[#0D5C3A] bg-emerald-50/80 font-bold'
                    : 'text-slate-700 hover:text-[#0D5C3A] hover:bg-slate-100/70'
                }`}
              >
                Point of Sale
              </Link>
            </nav>
          )}

          {/* ── Right Status & Actions ── */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Reusable SikaPOS Network Status Indicator */}
            <NetworkStatus compactOnMobile={true} />

            {/* Contextual Action Button */}
            {location.pathname === '/merchant-signup' ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Sign In</span>
              </Link>
            ) : location.pathname === '/login' ? (
              <Link
                to="/merchant-signup"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#0D5C3A] hover:text-[#09432A] bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Create Store</span>
              </Link>
            ) : !showInternalLinks ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Sign In</span>
              </Link>
            ) : null}

            {/* Mobile Hamburger Button (only needed if there are links to show) */}
            {showInternalLinks && (
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] transition-colors cursor-pointer"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation-menu"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Glass Dropdown Drawer ── */}
        <AnimatePresence>
          {mobileOpen && showInternalLinks && (
            <motion.div
              id="mobile-navigation-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-slate-200/70 px-4 pt-3 pb-5 space-y-2 bg-white/95 backdrop-blur-2xl rounded-b-2xl"
            >
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-[#0D5C3A] hover:bg-emerald-50/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0D5C3A]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/pos"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-[#0D5C3A] hover:bg-emerald-50/60 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-[#0D5C3A]" />
                  <span>Point of Sale Terminal</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default AppNavbar;
