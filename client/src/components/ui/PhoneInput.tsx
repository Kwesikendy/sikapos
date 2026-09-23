import React, { useMemo } from 'react';
import { detectGhanaCarrier, cn } from '../../lib/utils';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone Number',
  helperText,
  errorText,
  value,
  onChange,
  className,
  id,
  disabled,
  ...props
}) => {
  const inputId = id || 'phone-number-input';

  const carrier = useMemo(() => {
    return detectGhanaCarrier(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s]/g, '');
    onChange(val);
  };

  const getCarrierBadge = () => {
    if (!value || value.length < 3) return null;

    if (carrier.slug === 'mtn') {
      return (
        <span className="carrier-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          MTN MoMo
        </span>
      );
    }
    if (carrier.slug === 'telecel') {
      return (
        <span className="carrier-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          Telecel Cash
        </span>
      );
    }
    if (carrier.slug === 'at') {
      return (
        <span className="carrier-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          AT Money
        </span>
      );
    }
    return (
      <span className="carrier-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
        Ghana Mobile
      </span>
    );
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        {getCarrierBadge()}
      </div>

      <div className="flex items-center gap-2">
        {/* Country Code Prefix */}
        <div className="h-12 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-sm flex items-center justify-center shrink-0 select-none">
          +233
        </div>

        <div className="relative flex-1 flex items-center">
          <input
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            placeholder="024 000 0000"
            className={cn(
              'w-full h-12 rounded-xl bg-slate-50/70 border text-slate-900 placeholder:text-slate-400 font-mono',
              'text-sm px-4 transition-all duration-150',
              'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A859] focus:border-[#00A859]',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              errorText ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500' : 'border-slate-200 hover:border-slate-300',
              className
            )}
            {...props}
          />
        </div>
      </div>

      {errorText ? (
        <p className="text-xs font-semibold text-rose-600 mt-1">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
