import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export type StatusVariant = 'active' | 'synced' | 'pending' | 'syncing' | 'failed' | 'offline';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusVariant;
  label?: string;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  pulse = false,
  className,
  ...props
}) => {
  const configs: Record<
    StatusVariant,
    { defaultLabel: string; bg: string; text: string; border: string; dotColor: string; icon: React.ReactNode }
  > = {
    active: {
      defaultLabel: 'Active',
      bg: 'bg-emerald-50',
      text: 'text-[#15803D]',
      border: 'border-emerald-200',
      dotColor: 'bg-[#15803D]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />,
    },
    synced: {
      defaultLabel: 'Cloud Synced',
      bg: 'bg-emerald-50',
      text: 'text-[#15803D]',
      border: 'border-emerald-200',
      dotColor: 'bg-[#15803D]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />,
    },
    pending: {
      defaultLabel: 'Pending',
      bg: 'bg-amber-50',
      text: 'text-[#B45309]',
      border: 'border-amber-200',
      dotColor: 'bg-[#B45309]',
      icon: <Clock className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />,
    },
    syncing: {
      defaultLabel: 'Syncing',
      bg: 'bg-sky-50',
      text: 'text-[#0284C7]',
      border: 'border-sky-200',
      dotColor: 'bg-[#0284C7]',
      icon: <RefreshCw className="w-3.5 h-3.5 text-[#0284C7] animate-spin" aria-hidden="true" />,
    },
    failed: {
      defaultLabel: 'Action Required',
      bg: 'bg-red-50',
      text: 'text-[#DC2626]',
      border: 'border-red-200',
      dotColor: 'bg-[#DC2626]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" aria-hidden="true" />,
    },
    offline: {
      defaultLabel: 'Offline Active',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dotColor: 'bg-slate-500',
      icon: <WifiOff className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />,
    },
  };

  const config = configs[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      {pulse ? (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.dotColor)} aria-hidden="true" />
      ) : (
        config.icon
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
