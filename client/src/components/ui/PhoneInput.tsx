import React, { useMemo } from 'react';
import { detectGhanaCarrier, cn } from '../../lib/utils';
import { Smartphone } from 'lucide-react';

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
    // Only allow numbers, spaces, and plus
    const val = e.target.value.replace(/[^\d\s]/g, '');
    onChange(val);
  };

  const getCarrierBadge = () => {
    if (!value || value.length < 3) return null;

    if (carrier.slug === 'mtn') {
      return (
        <span className="carrier-pill inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          MTN MoMo
        </span>
      );
    }
    if (carrier.slug === 'telecel') {
      return (
        <span className="carrier-pill inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          Telecel Cash
        </span>
      );
    }
    if (carrier.slug === 'at') {
      return (
        <span className="carrier-pill inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
          AT Money
        </span>
      );
    }
    return (
      <span className="carrier-pill inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
        Ghana Mobile
      </span>
    );
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
        {getCarrierBadge()}
      </div>

      <div className="flex items-center gap-2">
        {/* Country Code Prefix (Strictly no emoji) */}
        <div className="h-12 px-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 font-mono font-semibold text-sm flex items-center justify-center shrink-0 select-none">
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
            aria-invalid={errorText ? 'true' : undefined}
            aria-describedby={
              errorText
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full h-12 rounded-lg bg-slate-50 border text-slate-900 placeholder:text-slate-400 font-mono',
              'text-base sm:text-sm px-3.5 transition-colors duration-150',
              'focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              errorText ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-[#DC2626]' : 'border-slate-300',
              className
            )}
            {...props}
          />
        </div>
      </div>

      {errorText ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-[#DC2626] mt-1">{errorText}</p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
