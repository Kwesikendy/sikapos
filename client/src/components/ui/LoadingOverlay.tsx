import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  submessage?: string;
  isFullScreen?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Processing request...',
  submessage,
  isFullScreen = true,
  className,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 select-none',
        isFullScreen ? 'fixed inset-0' : 'absolute inset-0 rounded-2xl',
        className
      )}
    >
      <div className="bg-white px-6 py-5 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-3 max-w-xs text-center mx-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
          <Loader2 className="w-6 h-6 text-[#00A859] animate-spin shrink-0" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-slate-900 leading-tight">
            {message}
          </p>
          {submessage && (
            <p className="text-xs text-slate-500 leading-normal">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
