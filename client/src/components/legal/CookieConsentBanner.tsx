import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cookie, X, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('sikapos_cookie_consent');
      if (!consent) {
        // Small delay so it does not collide with page load animations
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore localStorage errors in private modes
    }
  }, []);

  const handleAccept = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem('sikapos_cookie_consent', JSON.stringify({
        level,
        timestamp: Date.now(),
        version: '1.0'
      }));
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 pointer-events-auto"
        role="region"
        aria-label="Cookie consent banner"
      >
        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-3.5 text-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
              <Cookie className="w-5 h-5 text-[#0D5C3A]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Privacy & Data Storage Choice
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                We use strictly necessary cookies and local storage to secure cashier sessions and enable offline till syncing under Ghana Act 843. We never use third-party advertising cookies.
              </p>
            </div>
            <button
              onClick={() => handleAccept('essential')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Close cookie consent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <Link
              to="/legal/cookies"
              className="text-xs font-semibold text-[#0D5C3A] hover:underline inline-flex items-center gap-1"
            >
              <span>Cookie Policy</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAccept('essential')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => handleAccept('all')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0D5C3A] hover:bg-[#09432A] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept All</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
