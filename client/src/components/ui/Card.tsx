import React from 'react';
import { cn } from '../../lib/utils';

import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  elevated?: boolean;
  glass?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className,
  elevated = false,
  glass = false,
  interactive = false,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-card border border-slate-200/80 p-6 transition-colors',
        glass ? 'glass-panel' : 'bg-white',
        elevated ? 'shadow-card' : 'shadow-sm',
        interactive ? 'cursor-pointer hover:border-emerald-200/60' : '',
        className
      )}
      whileHover={interactive ? { y: -4, scale: 1.01, boxShadow: '0 20px 25px -5px rgba(13, 92, 58, 0.1), 0 8px 10px -6px rgba(13, 92, 58, 0.1)' } : undefined}
      whileTap={interactive ? { y: 0, scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});
Card.displayName = 'Card';
