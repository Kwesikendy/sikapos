import React from 'react';
import { cn } from '../../lib/utils';

interface AmbientGlowProps {
  className?: string;
  color?: 'emerald' | 'amber' | 'neutral';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ 
  className, 
  color = 'emerald',
  position = 'top-left'
}) => {
  const colorMap = {
    emerald: 'from-[#0D5C3A]/20 to-transparent',
    amber: 'from-[#D97706]/15 to-transparent',
    neutral: 'from-slate-300/20 to-transparent'
  };

  const positionMap = {
    'top-left': '-top-[20%] -left-[10%]',
    'top-right': '-top-[20%] -right-[10%]',
    'bottom-left': '-bottom-[20%] -left-[10%]',
    'bottom-right': '-bottom-[20%] -right-[10%]',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div 
      className={cn(
        'absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] max-w-[800px] max-h-[800px] rounded-full blur-[100px] pointer-events-none bg-gradient-radial',
        colorMap[color],
        positionMap[position],
        className
      )}
      aria-hidden="true"
    />
  );
};
