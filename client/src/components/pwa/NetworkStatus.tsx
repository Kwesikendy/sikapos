import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export type NetworkState = 'online' | 'offline' | 'reconnecting' | 'syncing';

export interface NetworkStatusProps {
  state?: NetworkState;
  showIcon?: boolean;
  compactOnMobile?: boolean;
  className?: string;
}

export function useNetworkStatus(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine ? 'online' : 'offline';
    }
    return 'online';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkState('reconnecting');
      const timer = setTimeout(() => {
        setNetworkState('online');
      }, 1500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setNetworkState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkState;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  state: overrideState,
  showIcon = true,
  compactOnMobile = true,
  className,
}) => {
  const detectedState = useNetworkStatus();
  const currentState = overrideState || detectedState;

  const config = {
    online: {
      label: 'Online',
      dotColor: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      bgColor: 'bg-emerald-50/90 border-emerald-200/60',
      aria: 'System is online and synced with Akoma Cloud',
      Icon: Wifi,
    },
    offline: {
      label: 'Offline Mode',
      dotColor: 'bg-rose-600',
      textColor: 'text-rose-900',
      bgColor: 'bg-rose-50/90 border-rose-200/60',
      aria: 'Device is offline. Local sales will queue and sync when reconnected.',
      Icon: WifiOff,
    },
    reconnecting: {
      label: 'Reconnecting...',
      dotColor: 'bg-amber-500 animate-pulse',
      textColor: 'text-amber-900',
      bgColor: 'bg-amber-50/90 border-amber-200/60',
      aria: 'Reconnecting to network...',
      Icon: RefreshCw,
    },
    syncing: {
      label: 'Syncing Data...',
      dotColor: 'bg-blue-600 animate-pulse',
      textColor: 'text-blue-900',
      bgColor: 'bg-blue-50/90 border-blue-200/60',
      aria: 'Synchronizing local register with cloud...',
      Icon: RefreshCw,
    },
  }[currentState];

  return (
    <div
      role="status"
      aria-label={config.aria}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 select-none shadow-2xs',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', config.dotColor)} aria-hidden="true" />
      <span className={cn(compactOnMobile ? 'hidden sm:inline' : 'inline')}>
        {config.label}
      </span>
    </div>
  );
};

export default NetworkStatus;
