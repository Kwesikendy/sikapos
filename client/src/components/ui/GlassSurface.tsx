import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
  variant?: 'light' | 'dark' | 'emerald';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ 
  className, 
  variant = 'light',
  intensity = 'medium',
  interactive = false,
  children,
  ...props 
}) => {
  const variantMap = {
    light: 'bg-white/70 border-white/60 text-slate-900',
    dark: 'bg-slate-900/80 border-slate-700/50 text-white',
    emerald: 'bg-[#0D5C3A]/80 border-[#0D5C3A]/40 text-white'
  };

  const blurMap = {
    low: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    high: 'backdrop-blur-xl'
  };

  return (
    <motion.div 
      className={cn(
        'rounded-[20px] border shadow-xl transition-colors',
        variantMap[variant],
        blurMap[intensity],
        interactive ? 'cursor-pointer hover:bg-white/80' : '',
        className
      )}
      whileHover={interactive ? { y: -6, scale: 1.01, boxShadow: '0 25px 50px -12px rgba(13, 92, 58, 0.2)' } : undefined}
      whileTap={interactive ? { y: -2, scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
