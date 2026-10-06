import React from 'react';
import { cn } from '../../lib/utils';

export interface AnimatedBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * SikaPOS Layered Atmospheric Background
 *
 * Layer 1: Base off-white canvas (#F8FAFC)
 * Layer 2: Dual-strata animated dotted network (pure CSS repeating radial-gradients, GPU-accelerated drift)
 * Layer 3: Subtle emerald radial glow anchored to the center focal plane
 * Layer 4: Very subtle gold & emerald ambient corner gradients
 *
 * Respects `@media (prefers-reduced-motion: reduce)` - halts animation while preserving the tactile dot pattern.
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'relative min-h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden flex flex-col',
        className
      )}
    >
      {/* ── Layer 2a: Primary Dot Network (28px grid, drifting slowly) ── */}
      <div
        className="sika-dot-layer-primary absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* ── Layer 2b: Secondary Sparse Depth Layer (44px grid, reverse micro-drift) ── */}
      <div
        className="sika-dot-layer-secondary absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* ── Layer 3: Central Emerald Focal Glow behind Auth Card ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] max-w-[90vw] max-h-[90vw] rounded-full pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(13, 92, 58, 0.055) 0%, rgba(13, 92, 58, 0.02) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 4a: Corner Gold Ambient Gradient (Top-Right) ── */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none z-0 blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 4b: Corner Emerald Ambient Gradient (Bottom-Left) ── */}
      <div
        className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full pointer-events-none z-0 blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(13, 92, 58, 0.14) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Interactive foreground content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

export default AnimatedBackground;
