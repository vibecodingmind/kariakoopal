import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Notification Interface ──

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'session' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ── Notification Store ──

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;

  // Actions
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

// ── Demo Notifications ──

const demoNotifications: NotificationItem[] = [
  {
    id: 'n1',
    userId: 'demo',
    type: 'session',
    title: 'New Session Request',
    message: 'Amina Hassan wants a guide for the Fabrics Zone tomorrow at 10:00 AM.',
    read: false,
    actionUrl: '/guide/sessions',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    userId: 'demo',
    type: 'payment',
    title: 'Payment Received',
    message: 'TZS 25,000 has been credited to your wallet for session #S-2847.',
    read: false,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    userId: 'demo',
    type: 'system',
    title: 'System Update',
    message: 'Kariako Guide v2.5 is now available with improved map features and faster matching.',
    read: false,
    actionUrl: '/settings',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n4',
    userId: 'demo',
    type: 'session',
    title: 'Session Completed',
    message: 'Your session with Juma Michael has been marked as completed. Please leave a review.',
    read: true,
    actionUrl: '/seeker/history',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'n5',
    userId: 'demo',
    type: 'payment',
    title: 'Subscription Renewal',
    message: 'Your Pro subscription will renew on March 15, 2026. TZS 15,000 will be charged.',
    read: false,
    actionUrl: '/guide/subscriptions',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'n6',
    userId: 'demo',
    type: 'warning',
    title: 'Fraud Alert',
    message: 'Unusual activity detected on your account. Please review your recent sessions.',
    read: false,
    actionUrl: '/settings/security',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'n7',
    userId: 'demo',
    type: 'success',
    title: 'Review Received',
    message: 'Fatima Abdallah left a 5-star review: "Amazing guide! Knows every corner of the market."',
    read: true,
    actionUrl: '/guide/profile',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n8',
    userId: 'demo',
    type: 'info',
    title: 'New Zone Available',
    message: 'The Artisanal Zone is now available for guided tours. Update your zones to include it.',
    read: true,
    actionUrl: '/guide/profile',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'n9',
    userId: 'demo',
    type: 'payment',
    title: 'Payout Processed',
    message: 'Your payout of TZS 85,000 has been sent to M-Pesa 255-XXX-XXXX.',
    read: true,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'n10',
    userId: 'demo',
    type: 'session',
    title: 'Buddy Match Found',
    message: 'We found a buddy match for you in the Spices Zone. Session starts at 2:00 PM.',
    read: false,
    actionUrl: '/market',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'n11',
    userId: 'demo',
    type: 'system',
    title: 'Holiday Schedule',
    message: 'Kariakoo market will have special hours during Eid al-Fitr. Plan your sessions accordingly.',
    read: true,
    actionUrl: '/events',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'n12',
    userId: 'demo',
    type: 'error',
    title: 'Payment Failed',
    message: 'Your wallet top-up of TZS 10,000 failed. Please try again or contact support.',
    read: false,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: demoNotifications,
      unreadCount: demoNotifications.filter((n) => !n.read).length,

      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        }),

      addNotification: (notification) => {
        const newNotification: NotificationItem = {
          ...notification,
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        }),
    }),
    {
      name: 'kariako-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
