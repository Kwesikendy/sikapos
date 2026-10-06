import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AuthSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  isLoading = false,
  loadingText = 'Signing in...',
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={cn(
        'group relative w-full min-h-[48px] py-3 px-5 rounded-xl font-bold text-sm sm:text-base text-white select-none transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#0D5C3A]/20 hover:shadow-lg hover:shadow-[#0D5C3A]/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D5C3A]',
        'bg-gradient-to-r from-[#0D5C3A] to-[#09432A] hover:from-[#09432A] hover:to-[#062F1D] active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white/90" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight
            className="w-4 h-4 text-white/90 transition-transform duration-200 group-hover:translate-x-1.5"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
};

export default AuthSubmitButton;
