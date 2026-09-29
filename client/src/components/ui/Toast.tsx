import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const toastMethods = useMemo(
    () => ({
      success: (title: string, message?: string, duration?: number) =>
        showToast({ type: 'success', title, message, duration }),
      error: (title: string, message?: string, duration?: number) =>
        showToast({ type: 'error', title, message, duration }),
      warning: (title: string, message?: string, duration?: number) =>
        showToast({ type: 'warning', title, message, duration }),
      info: (title: string, message?: string, duration?: number) =>
        showToast({ type: 'info', title, message, duration }),
    }),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      toast: toastMethods,
    }),
    [toasts, showToast, dismissToast, toastMethods]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Global Toast Container */}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const getTheme = () => {
    switch (item.type) {
      case 'success':
        return {
          card: 'bg-white border-emerald-300 shadow-emerald-500/10',
          icon: <CheckCircle2 className="w-5 h-5 text-[#00A859] shrink-0 mt-0.5" />,
          title: 'text-slate-900',
          message: 'text-slate-600',
        };
      case 'error':
        return {
          card: 'bg-white border-rose-300 shadow-rose-500/10',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          title: 'text-slate-900',
          message: 'text-slate-600',
        };
      case 'warning':
        return {
          card: 'bg-white border-amber-300 shadow-amber-500/10',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          title: 'text-slate-900',
          message: 'text-slate-600',
        };
      case 'info':
      default:
        return {
          card: 'bg-white border-sky-300 shadow-sky-500/10',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
          title: 'text-slate-900',
          message: 'text-slate-600',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 ease-out',
        'animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-4',
        theme.card
      )}
    >
      {theme.icon}
      <div className="flex-1 pr-2">
        <h4 className={cn('text-sm font-semibold leading-snug', theme.title)}>{item.title}</h4>
        {item.message && (
          <p className={cn('text-xs mt-1 leading-relaxed', theme.message)}>{item.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
