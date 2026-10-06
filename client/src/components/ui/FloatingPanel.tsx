import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface FloatingPanelProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ 
  className, 
  interactive = false,
  children,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -5, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(13, 92, 58, 0.15)' } : { y: -2 }}
      whileTap={interactive ? { y: 0, scale: 0.98 } : undefined}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
      className={cn(
        'relative bg-white rounded-2xl shadow-2xl shadow-[#0D5C3A]/10 border border-slate-100 p-6 z-20',
        'before:absolute before:inset-0 before:rounded-2xl before:ring-1 before:ring-black/5 before:pointer-events-none transition-colors',
        interactive ? 'cursor-pointer hover:border-emerald-200' : '',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
