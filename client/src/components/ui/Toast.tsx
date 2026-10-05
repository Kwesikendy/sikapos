import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ToastMessage } from '../../hooks/useToast';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const variants = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10',
  error: 'bg-red-50 text-red-800 border-red-200 shadow-red-500/10',
  info: 'bg-sky-50 text-sky-800 border-sky-200 shadow-sky-500/10',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 shadow-amber-500/10',
};

const iconColors = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md bg-white/90',
        'ring-1 ring-black/5'
      )}
    >
      <div className={cn('shrink-0 mt-0.5', iconColors[toast.type])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 pt-0.5 min-w-0">
        <p className="text-sm font-extrabold text-slate-900 tracking-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export interface ToasterProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
