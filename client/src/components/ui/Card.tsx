import React from 'react';
import { cn } from '../../lib/utils';

import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  elevated?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className,
  elevated = false,
  glass = false,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-card border border-slate-200/80 p-6',
        glass ? 'glass-panel' : 'bg-white',
        elevated ? 'shadow-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300' : 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});
Card.displayName = 'Card';
