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
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
              {label}
            </label>
          </div>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-500">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-12 rounded-lg bg-slate-50 border text-slate-900 placeholder:text-slate-400',
              'text-base sm:text-sm transition-colors duration-150',
              'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              startIcon ? 'pl-11' : 'pl-3.5',
              endIcon ? 'pr-11' : 'pr-3.5',
              errorText ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500' : 'border-slate-300',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3.5 flex items-center text-slate-500">
              {endIcon}
            </div>
          )}
        </div>
        {errorText ? (
          <p className="text-xs font-medium text-rose-600 mt-1">{errorText}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
