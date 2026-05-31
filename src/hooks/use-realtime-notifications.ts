'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

/**
 * Hook for real-time notification polling
 * Polls the /api/notifications endpoint every 15 seconds
 * Returns notifications, unread count, and mark-as-read function
 */
export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: RealtimeNotification) => !n.read).length);
      }
    } catch {
      // Silently fail — notifications are not critical
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId }) });
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) });
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchNotifications();

    // Poll every 15 seconds
    intervalRef.current = setInterval(fetchNotifications, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchNotifications]);

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
