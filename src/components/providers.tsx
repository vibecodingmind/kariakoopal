'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

// ── Hydration Gate ──
// Prevents rendering children until zustand persist has rehydrated from localStorage.
// This eliminates the mobile "blink" where pages flash between authenticated/unauthenticated states.
function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if zustand has already hydrated (fast path)
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // Listen for hydration completion
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Fallback: also check periodically in case the event already fired
    const interval = setInterval(() => {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
        clearInterval(interval);
      }
    }, 50);

    return () => {
      unsubFinishHydration();
      clearInterval(interval);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#065F46] border-t-transparent animate-spin" />
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
