import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorText, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left group">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 group-focus-within:text-[#0D5C3A] transition-colors duration-200">
              {label}
            </label>
          </div>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0D5C3A] transition-colors duration-200">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-12 rounded-lg bg-white border-[1.5px] text-slate-900 placeholder:text-slate-400',
              'text-base transition-all duration-200 shadow-xs hover:border-slate-300',
              'focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0D5C3A]/10 focus:border-[#0D5C3A]',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed',
              startIcon ? 'pl-11' : 'pl-4',
              endIcon ? 'pr-11' : 'pr-4',
              errorText ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-[#DC2626]/20 focus:border-[#DC2626]' : 'border-slate-200',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3.5 flex items-center text-slate-400 group-focus-within:text-[#0D5C3A] transition-colors duration-200">
              {endIcon}
            </div>
          )}
        </div>
        {errorText ? (
          <p className="text-xs font-medium text-[#DC2626] mt-1.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#DC2626]"></span>
            {errorText}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
