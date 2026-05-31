import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──

export type NotificationType =
  | 'info' | 'success' | 'warning' | 'error'
  | 'session' | 'payment' | 'system'
  | 'booking' | 'message' | 'review'
  | 'booking_new' | 'booking_confirmed' | 'booking_cancelled'
  | 'chat_message'
  | 'payment_received' | 'payment_failed'
  | 'guide_verified'
  | 'review_received'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ── Notification Store ──

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Partial<Notification> & { title: string; message: string; type: NotificationType; read: boolean }) => void;
  incrementUnread: () => void;
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
    type: 'booking_confirmed',
    title: 'Guide Accepted Your Request',
    message: 'Mwanaildi Juma has accepted your guide request for Fabrics Zone. Session starts soon!',
    read: false,
    actionUrl: '/seeker/session/s1',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    userId: 'demo-seeker',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'TZS 35,000 has been held in escrow for your session with Fatma Hassan.',
    read: false,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    userId: 'demo-seeker',
    type: 'chat_message',
    title: 'New Message from Fatma',
    message: 'Tuna vitambaa vya kanga vipya! Njoo uone 🌟',
    read: false,
    actionUrl: '/chat',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'n4',
    userId: 'demo-seeker',
    type: 'booking_new',
    title: 'Price Drop Alert!',
    message: 'Samsung Galaxy A54 price dropped in Electronics Zone. Check Price Radar for details.',
    read: false,
    actionUrl: '/prices',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'n5',
    userId: 'demo-seeker',
    type: 'session',
    title: 'Session Completed',
    message: 'Your session with Asha Mohamed has been completed. Please leave a review.',
    read: true,
    actionUrl: '/seeker/history',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n6',
    userId: 'demo-seeker',
    type: 'review_received',
    title: 'Review Received!',
    message: 'Asha Mohamed left a 5-star review for your session!',
    read: true,
    actionUrl: '/seeker/history',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'n7',
    userId: 'demo-seeker',
    type: 'system_announcement',
    title: 'Welcome to Chimbo Direct!',
    message: 'Your account has been set up successfully. Start exploring Kariakoo market with a local guide.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n8',
    userId: 'demo-guide',
    type: 'booking_new',
    title: 'New Session Request',
    message: 'James K. is requesting a guide for Electronics Zone. Budget: TZS 35,000.',
    read: false,
    actionUrl: '/guide/sessions',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'n9',
    userId: 'demo-guide',
    type: 'payment_received',
    title: 'Payout Processed',
    message: 'TZS 125,000 has been sent to your M-Pesa account (0712***890).',
    read: false,
    actionUrl: '/guide/earnings',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'n10',
    userId: 'demo-guide',
    type: 'guide_verified',
    title: 'New Badge Earned!',
    message: 'Congratulations! You earned the "100+ Sessions" badge. Keep up the great work!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'n11',
    userId: 'demo-guide',
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: 'A booking for Spices Zone has been cancelled by the seeker.',
    read: false,
    actionUrl: '/guide/sessions',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'n12',
    userId: 'demo-guide',
    type: 'chat_message',
    title: 'Message from Amina',
    message: 'Naomba msaada kwa spices zone kesho',
    read: false,
    actionUrl: '/chat',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: 'n13',
    userId: 'demo-guide',
    type: 'payment_failed',
    title: 'Payment Failed',
    message: 'Wallet top-up of TZS 10,000 failed. Please try again.',
    read: true,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'n14',
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
          id: notification.id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: notification.userId || '',
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          actionUrl: notification.actionUrl,
          data: notification.data,
          createdAt: notification.createdAt || new Date().toISOString(),
        };
        const updated = [newNotif, ...get().notifications];
        set({
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length,
        });
      },

      incrementUnread: () => {
        set({ unreadCount: get().unreadCount + 1 });
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
      name: 'chimbo-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
