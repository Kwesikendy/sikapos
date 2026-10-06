import React from 'react';
import { cn } from '../../lib/utils';

interface DotPatternProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  opacity?: number;
}

export const DotPattern: React.FC<DotPatternProps> = ({ 
  className, 
  variant = 'dark',
  size = 'md',
  opacity = 1
}) => {
  const sizeClass = {
    sm: 'bg-[size:10px_10px]',
    md: 'bg-[size:20px_20px]',
    lg: 'bg-[size:40px_40px]'
  }[size];

  const variantClass = variant === 'dark' ? 'bg-dot-pattern' : 'bg-dot-pattern-light';

  return (
    <div 
      className={cn(
        'absolute inset-0 pointer-events-none transition-opacity duration-1000',
        variantClass,
        sizeClass,
        className
      )}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
};
