import React from 'react';
import { cn } from '../../lib/utils';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  size = 'md',
  showSubtitle = true,
}) => {
  const imgSizes = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <img
        src="/logo.png"
        alt="SikaPOS"
        className={cn('object-contain rounded-lg drop-shadow-xs transition-transform hover:scale-105', imgSizes[size])}
      />
    </div>
  );
};
