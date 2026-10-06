import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../visuals/BrandLogo';
import { ProgressSteps } from '../ui/ProgressSteps';
import { LogIn } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  // Determine current onboarding step index
  const getOnboardingStep = (path: string): number => {
    if (path.startsWith('/merchant-signup')) return 0;
    if (path.startsWith('/store-setup')) return 1;
    if (path.startsWith('/launch-readiness')) return 2;
    if (path.startsWith('/pos')) return 3;
    return -1;
  };

  const currentStep = getOnboardingStep(location.pathname);
  const isOnboarding = currentStep >= 0;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Anchor */}
        <Link
          to="/merchant-signup"
          className="flex items-center gap-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] rounded-lg transition-opacity"
          aria-label="SikaPOS Home"
        >
          <BrandLogo size="md" />
        </Link>

        {/* Center: Contextual Onboarding Progress (replaces 4 competing links) */}
        {isOnboarding ? (
          <div className="hidden md:flex items-center">
            <ProgressSteps currentStepIndex={currentStep} />
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600" aria-label="Main Navigation">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg hover:text-[#0D5C3A] hover:bg-slate-100/60 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/pos"
              className="px-3 py-1.5 rounded-lg hover:text-[#0D5C3A] hover:bg-slate-100/60 transition-colors"
            >
              Point of Sale
            </Link>
          </nav>
        )}

        {/* Right: Restrained Status + Single Clear Secondary Action */}
        <div className="flex items-center gap-3">
          {/* Subtle Online Signal */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/50"
            role="status"
            aria-label="System status: Cloud synced"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" aria-hidden="true" />
            <span className="hidden sm:inline">Online</span>
          </div>

          {/* Secondary CTA: Sign In */}
          {location.pathname !== '/login' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
