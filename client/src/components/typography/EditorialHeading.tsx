import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface EditorialHeadingProps extends Omit<HTMLMotionProps<"h1">, "children"> {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const EditorialHeading: React.FC<EditorialHeadingProps> = ({
  children,
  variant = 'h1',
  align = 'left',
  className,
  ...props
}) => {
  const Component = motion[variant] as any;
  
  const baseClasses = "font-extrabold tracking-tighter text-slate-900 leading-[0.95]";
  
  const variantClasses = {
    h1: "text-6xl sm:text-7xl lg:text-8xl",
    h2: "text-4xl sm:text-5xl lg:text-6xl",
    h3: "text-3xl sm:text-4xl lg:text-5xl"
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };

  return (
    <Component
      className={cn(baseClasses, variantClasses[variant], alignClasses[align], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export const EditorialSubtext: React.FC<HTMLMotionProps<"p">> = ({ className, children, ...props }) => (
  <motion.p 
    className={cn("text-lg sm:text-xl text-slate-500 font-medium max-w-xl leading-relaxed", className)}
    {...props}
  >
    {children}
  </motion.p>
);
