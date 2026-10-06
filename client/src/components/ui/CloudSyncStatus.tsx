import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, WifiOff, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SyncState = 'online' | 'syncing' | 'offline' | 'pending';

export interface CloudSyncStatusProps {
  state?: SyncState;
  pendingCount?: number;
  className?: string;
}

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  state = 'online',
  pendingCount = 0,
  className
}) => {
  const [currentSyncState, setCurrentSyncState] = useState<SyncState>(state);

  useEffect(() => {
    setCurrentSyncState(state);
  }, [state]);

  const config = {
    online: {
      label: 'Synced',
      icon: CheckCircle2,
      dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      textClass: 'text-emerald-800',
      bgClass: 'bg-emerald-50/80 border-emerald-200/80',
    },
    syncing: {
      label: 'Syncing',
      icon: RefreshCw,
      dotClass: 'bg-amber-500 animate-spin',
      textClass: 'text-amber-800',
      bgClass: 'bg-amber-50/80 border-amber-200/80',
    },
    offline: {
      label: 'Offline',
      icon: WifiOff,
      dotClass: 'bg-rose-500',
      textClass: 'text-rose-800',
      bgClass: 'bg-rose-50/80 border-rose-200/80',
    },
    pending: {
      label: `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending`,
      icon: Clock,
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-800',
      bgClass: 'bg-amber-50/80 border-amber-200/80',
    },
  }[currentSyncState];

  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSyncState}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs backdrop-blur-md transition-all select-none",
          config.bgClass,
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />
        <span className={cn("font-bold tracking-tight", config.textClass)}>
          {config.label}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
