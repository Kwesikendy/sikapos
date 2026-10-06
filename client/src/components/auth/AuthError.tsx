import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AuthErrorProps {
  message: string | null;
  className?: string;
  action?: React.ReactNode;
}

export const AuthError: React.FC<AuthErrorProps> = ({ message, className, action }) => {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              'flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-medium shadow-2xs my-2',
              className
            )}
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 leading-snug">
              <span>{message}</span>
              {action && <div className="mt-1.5">{action}</div>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthError;
