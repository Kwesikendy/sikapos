import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

import { HTMLMotionProps } from 'framer-motion';

export interface SkeletonProps extends HTMLMotionProps<'div'> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: number | string;
  height?: number | string;
  pulse?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  pulse = true,
  style,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: pulse ? [0.5, 1, 0.5] : 0.5 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'bg-slate-200/50 backdrop-blur-sm',
        {
          'rounded-2xl': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'rounded-lg': variant === 'text',
        },
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1.25rem' : undefined),
        ...style,
      }}
      {...props}
    />
  );
};
