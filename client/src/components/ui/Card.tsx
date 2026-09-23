import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  elevated = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-6 sm:p-8',
        elevated ? 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]' : 'shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
