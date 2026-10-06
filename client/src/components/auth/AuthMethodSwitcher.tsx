import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface AuthMethodOption<T extends string> {
  id: T;
  label: string;
  badge?: string;
}

export interface AuthMethodSwitcherProps<T extends string> {
  options: AuthMethodOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

export function AuthMethodSwitcher<T extends string>({
  options,
  activeId,
  onChange,
  className,
}: AuthMethodSwitcherProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="Authentication Method"
      className={cn(
        'relative grid p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 select-none shadow-inner',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative z-10 py-2.5 px-3 min-h-[44px] text-xs sm:text-sm font-bold rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C3A] cursor-pointer',
              isActive ? 'text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {/* Sliding Active Pill */}
            {isActive && (
              <motion.div
                layoutId="activeAuthIndicator"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80 -z-10"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 32,
                }}
              />
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0D5C3A] font-semibold">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AuthMethodSwitcher;
