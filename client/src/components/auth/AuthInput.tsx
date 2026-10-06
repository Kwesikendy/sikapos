import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, helperText, startIcon, endIcon, id, className, required, ...props }, ref) => {
    const inputId = id || `auth-input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return (
      <div className="space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-bold text-slate-700 tracking-tight"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>

        <div className="relative rounded-xl">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              'w-full min-h-[46px] py-2.5 px-3.5 rounded-xl text-sm font-medium text-slate-900 transition-all duration-150',
              'bg-slate-50/80 border border-slate-200/90 shadow-2xs',
              'placeholder:text-slate-400 placeholder:font-normal',
              'hover:border-slate-300 hover:bg-slate-50',
              'focus:bg-white focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/15 focus:outline-none',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              startIcon ? 'pl-10' : 'pl-3.5',
              endIcon ? 'pr-11' : 'pr-3.5',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/30',
              className
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              {endIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs font-semibold text-rose-600 mt-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-[11px] text-slate-500 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;
