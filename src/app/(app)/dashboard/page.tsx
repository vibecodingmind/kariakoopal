'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardRedirectPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }
    if (user?.role === 'seeker') router.replace('/');
    else if (user?.role === 'guide') router.replace('/guide');
    else if (user?.role === 'admin') router.replace('/admin');
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#3730A3] border-t-transparent rounded-full" />
    </div>
  );
}
