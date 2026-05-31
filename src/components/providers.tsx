'use client';

import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useAuthStore } from '@/lib/stores/auth-store';

// ── Hydration Gate ──
// Waits for zustand-persist to FULLY rehydrate before rendering children.
// Prevents the "flash/blink" on mobile where the app briefly renders with
// default (unauthenticated) state before the persisted state loads from localStorage.
function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if zustand-persist has already hydrated (synchronous check)
    // The `persist` API on the store exposes `hasHydrated()` and `onFinishHydration()`
    const store = useAuthStore;

    if (store.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }

    // If not yet hydrated, subscribe to the hydration finish event
    const unsubFinish = store.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    // Safety timeout: if hydration doesn't complete within 3 seconds,
    // show the UI anyway (prevents infinite loading on broken storage)
    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 3000);

    return () => {
      unsubFinish?.();
      clearTimeout(timeout);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#065F46]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-white/30 border-t-[#F59E0B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <HydrationGate>{children}</HydrationGate>
    </SessionProvider>
  );
}
