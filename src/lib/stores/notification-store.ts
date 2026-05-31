import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──

export interface Notification {
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
  notifications: Notification[];
  unreadCount: number;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// ── Demo Notifications ──

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'demo-seeker',
    type: 'session',
    title: 'Guide Accepted Your Request',
    message: 'Mwanaildi Juma has accepted your guide request for Fabrics Zone. Session starts soon!',
    read: false,
    actionUrl: '/seeker/session/s1',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    userId: 'demo-seeker',
    type: 'payment',
    title: 'Payment Received',
    message: 'TZS 35,000 has been held in escrow for your session with Fatma Hassan.',
    read: false,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    userId: 'demo-seeker',
    type: 'info',
    title: 'Price Drop Alert!',
    message: 'Samsung Galaxy A54 price dropped in Electronics Zone. Check Price Radar for details.',
    read: false,
    actionUrl: '/prices',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'n4',
    userId: 'demo-seeker',
    type: 'session',
    title: 'Session Completed',
    message: 'Your session with Asha Mohamed has been completed. Please leave a review.',
    read: true,
    actionUrl: '/seeker/history',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n5',
    userId: 'demo-seeker',
    type: 'system',
    title: 'Welcome to Kariako Guide!',
    message: 'Your account has been set up successfully. Start exploring Kariakoo market with a local guide.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n6',
    userId: 'demo-guide',
    type: 'session',
    title: 'New Session Request',
    message: 'James K. is requesting a guide for Electronics Zone. Budget: TZS 35,000.',
    read: false,
    actionUrl: '/guide/sessions',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'n7',
    userId: 'demo-guide',
    type: 'payment',
    title: 'Payout Processed',
    message: 'TZS 125,000 has been sent to your M-Pesa account (0712***890).',
    read: false,
    actionUrl: '/guide/earnings',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'n8',
    userId: 'demo-guide',
    type: 'success',
    title: 'New Badge Earned!',
    message: 'Congratulations! You earned the "100+ Sessions" badge. Keep up the great work!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'n9',
    userId: 'demo-guide',
    type: 'warning',
    title: 'Subscription Renewal',
    message: 'Your Pro subscription renews in 3 days. Ensure your M-Pesa account has sufficient balance.',
    read: false,
    actionUrl: '/guide/subscriptions',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'n10',
    userId: 'demo-guide',
    type: 'system',
    title: 'New Feature: QR Check-in',
    message: 'You can now use QR codes for session check-ins. Try it in your next session!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: DEMO_NOTIFICATIONS,
      unreadCount: DEMO_NOTIFICATIONS.filter(n => !n.read).length,

      setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }),

      addNotification: (notification) => {
        const newNotif: Notification = {
          ...notification,
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        const updated = [newNotif, ...get().notifications];
        set({
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length,
        });
      },

      markAsRead: (id) => {
        const updated = get().notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length,
        });
      },

      markAllRead: () => {
        const updated = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications: updated, unreadCount: 0 });
      },

      removeNotification: (id) => {
        const updated = get().notifications.filter(n => n.id !== id);
        set({
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length,
        });
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
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
