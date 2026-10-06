import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone/PWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);
    if (standaloneMode) return;

    // Check dismissal history
    const dismissedAt = localStorage.getItem('sikapos_pwa_install_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 14) {
        return; // Suppress for 14 days
      }
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      setDismissed(false);
    }

    // Listen for beforeinstallprompt event (Chromium, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('sikapos_pwa_install_dismissed', Date.now().toString());
    } catch {
      // ignore
    }
  };

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 pointer-events-auto"
      >
        <div
          role="region"
          aria-label="Install SikaPOS web app"
          className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-4 sm:p-4.5 shadow-2xl flex items-start gap-3.5"
          style={{
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          }}
        >
          {/* SikaPOS Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#0D5C3A]/20">
            <Download className="w-5 h-5 text-white" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
              Install SikaPOS
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {isIOS
                ? 'Install on your iPhone or iPad for quick offline access.'
                : 'Get fast one-tap checkout access straight from your home screen.'}
            </p>

            {/* iOS Safari Instruction */}
            {isIOS ? (
              <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-700 flex items-center gap-1.5 font-medium">
                <span>Tap</span>
                <Share className="w-3.5 h-3.5 text-[#0D5C3A] inline shrink-0" aria-hidden="true" />
                <span>Share then</span>
                <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                  <PlusSquare className="w-3 h-3 text-[#0D5C3A]" aria-hidden="true" /> Add to Home Screen
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0D5C3A] hover:bg-[#09432A] transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A]"
                >
                  Install App
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Not now
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
