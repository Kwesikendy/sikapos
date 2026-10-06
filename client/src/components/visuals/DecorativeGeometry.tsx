import React from 'react';
import { cn } from '../../lib/utils';

export const DecorativeGrid: React.FC<{ className?: string, opacity?: number }> = ({ className, opacity = 0.5 }) => (
  <div 
    className={cn("absolute inset-0 pointer-events-none bg-grid-pattern", className)}
    style={{ opacity }}
    aria-hidden="true"
  />
);

export const DecorativeCircle: React.FC<{ className?: string }> = ({ className }) => (
  <div 
    className={cn("absolute pointer-events-none rounded-full border border-[#0D5C3A]/10", className)}
    aria-hidden="true"
  />
);

export const DecorativeLine: React.FC<{ className?: string, orientation?: 'h' | 'v' }> = ({ className, orientation = 'h' }) => (
  <div 
    className={cn(
      "absolute pointer-events-none bg-gradient-to-r from-transparent via-[#0D5C3A]/15 to-transparent",
      orientation === 'h' ? 'h-[1px] w-full' : 'w-[1px] h-full bg-gradient-to-b',
      className
    )}
    aria-hidden="true"
  />
);
