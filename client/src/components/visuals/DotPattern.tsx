import React from 'react';
import { cn } from '../../lib/utils';

export interface DotPatternProps {
  className?: string;
  variant?: 'emerald' | 'slate' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  fadeMask?: 'radial' | 'top-fade' | 'bottom-fade' | 'linear' | 'none';
  opacity?: number;
}

export const DotPattern: React.FC<DotPatternProps> = ({ 
  className, 
  variant = 'emerald',
  size = 'md',
  fadeMask = 'radial',
  opacity = 0.75
}) => {
  const sizeClass = {
    sm: 'bg-[size:16px_16px]',
    md: 'bg-[size:24px_24px]',
    lg: 'bg-[size:36px_36px]'
  }[size];

  const variantClass = {
    emerald: 'bg-dot-pattern',
    dark: 'bg-dot-pattern',
    slate: 'bg-dot-pattern-slate',
    light: 'bg-dot-pattern-light',
  }[variant] || 'bg-dot-pattern';

  const maskStyle: React.CSSProperties = {
    opacity,
    WebkitMaskImage: fadeMask === 'radial'
      ? 'radial-gradient(ellipse at 50% 30%, black 20%, rgba(0,0,0,0.5) 60%, transparent 95%)'
      : fadeMask === 'top-fade'
      ? 'linear-gradient(to bottom, black 10%, rgba(0,0,0,0.3) 70%, transparent 100%)'
      : fadeMask === 'bottom-fade'
      ? 'linear-gradient(to top, black 10%, rgba(0,0,0,0.3) 70%, transparent 100%)'
      : fadeMask === 'linear'
      ? 'linear-gradient(135deg, black 0%, transparent 80%)'
      : 'none',
    maskImage: fadeMask === 'radial'
      ? 'radial-gradient(ellipse at 50% 30%, black 20%, rgba(0,0,0,0.5) 60%, transparent 95%)'
      : fadeMask === 'top-fade'
      ? 'linear-gradient(to bottom, black 10%, rgba(0,0,0,0.3) 70%, transparent 100%)'
      : fadeMask === 'bottom-fade'
      ? 'linear-gradient(to top, black 10%, rgba(0,0,0,0.3) 70%, transparent 100%)'
      : fadeMask === 'linear'
      ? 'linear-gradient(135deg, black 0%, transparent 80%)'
      : 'none',
  };

  return (
    <div 
      className={cn(
        'absolute inset-0 pointer-events-none transition-opacity duration-700',
        variantClass,
        sizeClass,
        className
      )}
      style={maskStyle}
      aria-hidden="true"
    />
  );
};
