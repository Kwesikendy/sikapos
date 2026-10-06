import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Store } from 'lucide-react';

export interface AuthCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  title = 'Sign In to SikaPOS',
  subtitle = 'Access your store dashboard, inventory, and POS terminal.',
  icon,
  children,
  footer,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'w-full max-w-[460px] mx-auto rounded-3xl sm:rounded-[2rem] border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-6 sm:p-9 shadow-2xl transition-all',
        className
      )}
      style={{
        boxShadow:
          '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
      }}
    >
      {/* ── Visual Hierarchy Header ── */}
      <div className="mb-6 space-y-1.5 text-center">
        {/* Emblem / Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D5C3A] via-[#09432A] to-[#062F1D] text-white shadow-md shadow-[#0D5C3A]/20 mb-2">
          {icon || <Store className="w-6 h-6 text-white" aria-hidden="true" />}
        </div>

        {/* Highest visual emphasis */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>

        {/* Secondary description */}
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* ── Form Body ── */}
      <div className="space-y-5">{children}</div>

      {/* ── Optional Card Footer ── */}
      {footer && <div className="mt-6 pt-5 border-t border-slate-100">{footer}</div>}
    </motion.div>
  );
};

export default AuthCard;
