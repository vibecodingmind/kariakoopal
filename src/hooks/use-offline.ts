'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

interface OfflineState {
  isOnline: boolean;
  lastSynced: string | null;
  syncPending: number;
  syncNow: () => Promise<void>;
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

function getInitialSynced(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chimbo-last-sync');
}

function getInitialPending(): number {
  if (typeof window === 'undefined') return 0;
  const pending = localStorage.getItem('chimbo-offline-queue');
  if (pending) {
    try {
      const actions = JSON.parse(pending);
      return Array.isArray(actions) ? actions.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

export function useOffline(): OfflineState {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [lastSynced, setLastSynced] = useState<string | null>(getInitialSynced);
  const [syncPending, setSyncPending] = useState(getInitialPending);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;

    const pending = localStorage.getItem('chimbo-offline-queue');
    if (!pending) return;

    try {
      const actions = JSON.parse(pending);
      if (!Array.isArray(actions) || actions.length === 0) return;

      const userId = localStorage.getItem('chimbo-user-id') || 'unknown';
      const res = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actions }),
      });

      if (res.ok) {
        localStorage.removeItem('chimbo-offline-queue');
        setSyncPending(0);
        const now = new Date().toISOString();
        localStorage.setItem('chimbo-last-sync', now);
        setLastSynced(now);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && syncPending > 0) {
      const timer = setTimeout(syncNow, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncPending, syncNow]);

  return { isOnline, lastSynced, syncPending, syncNow };
}
