import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { drawerVariants } from '../../lib/motion';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  size = 'md',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const slideVariants = {
    initial: { x: position === 'right' ? '100%' : '-100%' },
    animate: { x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
    exit: { 
      x: position === 'right' ? '100%' : '-100%', 
      transition: { type: 'tween' as const, ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number], duration: 0.25 }
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed top-0 bottom-0 z-50 flex flex-col bg-white/90 backdrop-blur-xl border-white/50 shadow-2xl overflow-hidden',
              position === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              'w-full',
              sizeClasses[size]
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/50">
                <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {title}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors active-depress"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-5 border-t border-slate-200/60 bg-slate-50/80 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
