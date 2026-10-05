import { Variants } from 'framer-motion';

export const framerTransitions = {
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  smooth: {
    type: 'tween' as const,
    ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
    duration: 0.25,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 35,
  }
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: framerTransitions.spring },
  exit: { opacity: 0, y: -10, transition: framerTransitions.smooth }
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: framerTransitions.spring }
};

export const cardHoverVariants: Variants = {
  initial: { scale: 1, y: 0, boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)' },
  hover: { 
    scale: 1.01, 
    y: -2, 
    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
    transition: framerTransitions.spring
  }
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: framerTransitions.spring },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: framerTransitions.smooth }
};

export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: framerTransitions.spring },
  exit: { x: '100%', transition: framerTransitions.smooth }
};

export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: framerTransitions.spring },
  exit: { y: '100%', transition: framerTransitions.smooth }
};
