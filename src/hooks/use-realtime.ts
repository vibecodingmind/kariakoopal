'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { toast } from 'sonner';

interface RealtimeEvent {
  type: 'booking_new' | 'booking_confirmed' | 'booking_cancelled' | 'chat_message' | 'payment_received' | 'payment_failed' | 'guide_verified' | 'review_received' | 'system_announcement' | 'booking' | 'message' | 'payment' | 'system' | 'session' | 'review';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ── Notification type icon mapping ──
const NOTIFICATION_ICONS: Record<string, string> = {
  booking_new: '📋',
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  chat_message: '💬',
  payment_received: '💰',
  payment_failed: '⚠️',
  guide_verified: '🏅',
  review_received: '⭐',
  system_announcement: '📢',
};

// Map API notification types to store types
function mapApiType(apiType: string): 'info' | 'success' | 'warning' | 'error' | 'session' | 'payment' | 'system' | 'booking' | 'message' | 'review' {
  const mapping: Record<string, 'info' | 'success' | 'warning' | 'error' | 'session' | 'payment' | 'system' | 'booking' | 'message' | 'review'> = {
    booking_new: 'booking',
    booking_confirmed: 'booking',
    booking_cancelled: 'booking',
    chat_message: 'message',
    payment_received: 'payment',
    payment_failed: 'error',
    guide_verified: 'success',
    review_received: 'review',
    system_announcement: 'system',
    // Legacy types
    booking: 'booking',
    message: 'message',
    payment: 'payment',
    system: 'system',
    session: 'session',
    review: 'review',
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
  };
  return mapping[apiType] || 'info';
}

export function useRealtime() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification, incrementUnread, notifications, setNotifications, markAsRead, markAllRead } = useNotificationStore();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // ── Polling-based notification fetching ──
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();

      // Check if there are new notifications since last fetch
      const latestId = data.notifications?.[0]?.id;
      if (latestId && latestId !== lastFetchRef.current) {
        // Find truly new notifications
        const existingIds = new Set(notifications.map(n => n.id));
        const newNotifs = data.notifications.filter((n: { id: string }) => !existingIds.has(n.id));

        if (newNotifs.length > 0 && lastFetchRef.current) {
          // Show toast for new notifications
          newNotifs.forEach((notif: { type: string; title: string; message: string; id: string; read: boolean; actionUrl?: string; createdAt: string }) => {
            toast(notif.title, {
              description: notif.message,
              duration: 4000,
            });

            addNotification({
              id: notif.id,
              type: mapApiType(notif.type),
              title: notif.title,
              message: notif.message,
              read: notif.read,
              actionUrl: notif.actionUrl,
              createdAt: notif.createdAt,
            });
          });
        }

        lastFetchRef.current = latestId;
        setIsConnected(true);
      }
    } catch {
      // Silently fail - polling will retry
      setIsConnected(false);
    }
  }, [isAuthenticated, user, notifications, addNotification]);

  // ── Mark notification as read via API ──
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      markAsRead(notificationId);
    } catch {
      // Still mark locally even if API fails
      markAsRead(notificationId);
    }
  }, [markAsRead]);

  // ── Mark all notifications as read via API ──
  const markAllNotificationsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      markAllRead();
    } catch {
      // Still mark locally even if API fails
      markAllRead();
    }
  }, [markAllRead]);

  // ── Setup polling ──
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Poll immediately and then every 15 seconds for new notifications
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Trigger first fetch via timeout to avoid synchronous setState in effect
    const initialTimeout = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      clearTimeout(initialTimeout);
    };
  }, [isAuthenticated, user, fetchNotifications]);

  return {
    isConnected,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
