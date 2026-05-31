'use client';

import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, lastSynced, syncPending, syncNow } = useOffline();
  const [syncing, setSyncing] = useState(false);

  if (isOnline && syncPending === 0) return null;

  const handleSync = async () => {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all ${
      isOnline
        ? 'bg-[#F59E0B] text-white'
        : 'bg-red-600 text-white'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online — {syncPending} action{syncPending !== 1 ? 's' : ''} pending sync</span>
            <button onClick={handleSync} disabled={syncing} className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs hover:bg-white/30">
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : 'Sync Now'}
            </button>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You&apos;re offline — some features may be limited</span>
            {lastSynced && (
              <span className="text-xs opacity-75 ml-2">
                Last synced: {new Date(lastSynced).toLocaleTimeString()}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
