import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  glass?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  glass = false,
}) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-3xl',
        glass ? 'bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl' : 'bg-transparent',
        className
      )}
    >
      <motion.div
        variants={staggerItem}
        className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center text-slate-400 shadow-inner border border-white/60"
      >
        <Icon className="w-8 h-8" />
      </motion.div>
      
      <motion.h3
        variants={staggerItem}
        className="text-lg font-extrabold text-slate-900 mb-2 tracking-tight"
      >
        {title}
      </motion.h3>
      
      <motion.p
        variants={staggerItem}
        className="text-[13px] text-slate-500 max-w-sm mb-6 leading-relaxed"
      >
        {description}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.div variants={staggerItem}>
          <Button onClick={onAction} variant="primary">
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
