import React, { useState, useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PinKeypadProps {
  pinLength?: number;
  onComplete: (pin: string) => void;
  error?: string | null;
  onClearError?: () => void;
  isLoading?: boolean;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pinLength = 4,
  onComplete,
  error = null,
  onClearError,
  isLoading = false,
}) => {
  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigit = (digit: string) => {
    if (isLoading) return;
    if (error && onClearError) {
      onClearError();
    }
    if (pin.length < pinLength) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === pinLength) {
        onComplete(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    if (error && onClearError) {
      onClearError();
    }
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLoading) return;
    if (error && onClearError) {
      onClearError();
    }
    setPin('');
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
      {/* 4-Digit Dot Indicators */}
      <div
        className={cn(
          'flex items-center gap-4 transition-transform duration-150',
          shake && 'animate-bounce text-rose-500'
        )}
      >
        {Array.from({ length: pinLength }).map((_, idx) => {
          const filled = idx < pin.length;
          return (
            <div
              key={idx}
              className={cn(
                'pin-dot w-4 h-4 rounded-full transition-all duration-150',
                filled
                  ? 'bg-[#0D5C3A] scale-110 shadow-xs'
                  : 'bg-slate-200 border border-slate-300'
              )}
            />
          );
        })}
      </div>

      {/* Helper / Error Status Text */}
      <div className="h-5 flex items-center justify-center text-center">
        {error ? (
          <p className="text-xs font-semibold text-rose-600">{error}</p>
        ) : (
          <p className="text-xs text-slate-500">
            {pin.length === 0
              ? 'Enter 4-digit security PIN'
              : `${pin.length} of ${pinLength} digits entered`}
          </p>
        )}
      </div>

      {/* Tactile 3x4 Touch Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isLoading}
            onClick={() => handleDigit(digit)}
            className="h-14 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 active:bg-slate-100 active-depress font-mono text-xl font-bold text-slate-900 flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleClear}
          aria-label="Clear PIN"
          className="h-14 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 active:bg-slate-300 active-depress text-slate-600 font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-40"
        >
          Clear
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 active:bg-slate-100 active-depress font-mono text-xl font-bold text-slate-900 flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-50"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleBackspace}
          aria-label="Backspace"
          className="h-14 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 active:bg-slate-300 active-depress text-slate-700 flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-40"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
