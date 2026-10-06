import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Listen for custom swUpdated event or service worker controllerchange
    const handleSwUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('swUpdated', handleSwUpdate);

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      window.removeEventListener('swUpdated', handleSwUpdate);
    };
  }, []);

  const handleRefresh = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.waiting?.postMessage({ type: 'SKIP_WAITING' }));
      });
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 sm:max-w-sm z-50 pointer-events-auto"
      >
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-xl p-3.5 shadow-xl flex items-center justify-between gap-3 text-slate-800"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-900">Update Available</p>
              <p className="text-slate-500 truncate">A new version of SikaPOS is ready.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0D5C3A] hover:bg-[#09432A] transition-colors shadow-2xs"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setUpdateAvailable(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              aria-label="Dismiss update notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdatePrompt;
