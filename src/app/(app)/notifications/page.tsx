'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore, type NotificationType } from '@/lib/stores/notification-store';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Compass, DollarSign, Shield,
  Star, CreditCard, Info, AlertTriangle, CheckCircle2,
  Clock, X, MessageCircle, CalendarCheck, XCircle,
  Ban, Megaphone, Award,
} from 'lucide-react';

type FilterTab = 'all' | 'booking' | 'message' | 'payment' | 'system';

// ── Notification type icon mapping ──
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'booking_new': return <CalendarCheck className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />;
    case 'booking_confirmed': return <CheckCircle2 className="w-4 h-4 text-[#10B981]" />;
    case 'booking_cancelled': return <XCircle className="w-4 h-4 text-[#DC2626]" />;
    case 'chat_message': return <MessageCircle className="w-4 h-4 text-[#0891B2]" />;
    case 'payment_received': return <DollarSign className="w-4 h-4 text-[#F59E0B]" />;
    case 'payment_failed': return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />;
    case 'guide_verified': return <Award className="w-4 h-4 text-[#8B5CF6]" />;
    case 'review_received': return <Star className="w-4 h-4 text-[#F59E0B]" />;
    case 'system_announcement': return <Megaphone className="w-4 h-4 text-[#06B6D4]" />;
    // Legacy types
    case 'session': return <Compass className="w-4 h-4 text-[#065F46]" />;
    case 'payment': return <DollarSign className="w-4 h-4 text-[#F59E0B]" />;
    case 'booking': return <CalendarCheck className="w-4 h-4 text-[#065F46]" />;
    case 'message': return <MessageCircle className="w-4 h-4 text-[#0891B2]" />;
    case 'success': return <CheckCircle2 className="w-4 h-4 text-[#10B981]" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />;
    case 'error': return <XCircle className="w-4 h-4 text-[#DC2626]" />;
    case 'info': return <Info className="w-4 h-4 text-[#0891B2]" />;
    case 'system': return <Info className="w-4 h-4 text-[#0891B2]" />;
    case 'review': return <Star className="w-4 h-4 text-[#F59E0B]" />;
    default: return <Bell className="w-4 h-4 text-[#64748B]" />;
  }
}

// ── Notification type background color ──
function getNotificationBg(type: NotificationType, read: boolean) {
  if (read) return '';
  switch (type) {
    case 'booking_new': case 'booking_confirmed': case 'booking': case 'session':
      return 'bg-[#ECFDF5]/50 dark:bg-[#022C22]/50';
    case 'booking_cancelled':
      return 'bg-[#FEF2F2]/50 dark:bg-[#2D1B1B]/50';
    case 'chat_message': case 'message':
      return 'bg-[#ECFEFF]/50 dark:bg-[#0C2D3E]/50';
    case 'payment_received': case 'payment':
      return 'bg-[#FEF3C7]/50 dark:bg-[#3D2E0A]/50';
    case 'payment_failed': case 'error':
      return 'bg-[#FEF2F2]/50 dark:bg-[#2D1B1B]/50';
    case 'guide_verified':
      return 'bg-[#F5F3FF]/50 dark:bg-[#2E1A47]/50';
    case 'review_received': case 'review':
      return 'bg-[#FEF3C7]/50 dark:bg-[#3D2E0A]/50';
    case 'system_announcement':
      return 'bg-[#ECFEFF]/50 dark:bg-[#0C2D3E]/50';
    case 'success':
      return 'bg-[#ECFDF5]/50 dark:bg-[#022C22]/50';
    case 'warning':
      return 'bg-[#FEF3C7]/50 dark:bg-[#3D2E0A]/50';
    default:
      return 'bg-[#F1F5F9]/50 dark:bg-[#334155]/50';
  }
}

// ── Notification type icon bg ──
function getIconBg(type: NotificationType) {
  switch (type) {
    case 'booking_new': case 'booking_confirmed': case 'booking': case 'session':
      return 'bg-[#ECFDF5] dark:bg-[#064E3B]';
    case 'booking_cancelled':
      return 'bg-[#FEF2F2] dark:bg-[#3B1111]';
    case 'chat_message': case 'message':
      return 'bg-[#ECFEFF] dark:bg-[#0C3547]';
    case 'payment_received': case 'payment':
      return 'bg-[#FEF3C7] dark:bg-[#3D2E0A]';
    case 'payment_failed': case 'error':
      return 'bg-[#FEF2F2] dark:bg-[#3B1111]';
    case 'guide_verified':
      return 'bg-[#F5F3FF] dark:bg-[#2E1A47]';
    case 'review_received': case 'review':
      return 'bg-[#FEF3C7] dark:bg-[#3D2E0A]';
    case 'system_announcement':
      return 'bg-[#ECFEFF] dark:bg-[#0C3547]';
    case 'success':
      return 'bg-[#ECFDF5] dark:bg-[#064E3B]';
    case 'warning':
      return 'bg-[#FEF3C7] dark:bg-[#3D2E0A]';
    default:
      return 'bg-[#F1F5F9] dark:bg-[#334155]';
  }
}

// ── Group by date ──
function groupNotificationsByDate(notifications: Array<{ createdAt: string }>) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: typeof notifications }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ];

  notifications.forEach(n => {
    const date = new Date(n.createdAt);
    if (date >= today) {
      groups[0].items.push(n);
    } else if (date >= yesterday) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  });

  return groups.filter(g => g.items.length > 0);
}

// ── Swipeable Notification Item ──
function SwipeableNotification({
  notification,
  onMarkRead,
  onDismiss,
  onClick,
}: {
  notification: { id: string; type: NotificationType; title: string; message: string; read: boolean; createdAt: string; actionUrl?: string };
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0], ['#DC2626', '#00000000']);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.8, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      onDismiss(notification.id);
    }
  };

  return (
    <motion.div className="relative overflow-hidden rounded-xl">
      {/* Swipe background */}
      <motion.div
        style={{ background }}
        className="absolute inset-0 flex items-end justify-end pr-4 pb-4"
      >
        <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-1 text-white text-xs font-medium">
          <Trash2 className="w-3 h-3" />
          Remove
        </motion.div>
      </motion.div>

      {/* Notification card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={() => onClick(notification.id)}
        className={`relative cursor-pointer transition-all hover:shadow-md active:scale-[0.98] p-3.5 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] ${getNotificationBg(notification.type, notification.read)} ${!notification.read ? 'border-l-4 border-l-[#065F46] dark:border-l-[#34D399]' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(notification.type)}`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm ${!notification.read ? 'font-semibold text-[#1E293B] dark:text-[#E2E8F0]' : 'font-medium text-[#64748B]'}`}>
                {notification.title}
              </p>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-[#065F46] dark:bg-[#34D399] shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{notification.message}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock className="w-3 h-3 text-[#94A3B8]" />
              <span className="text-[10px] text-[#94A3B8]">{formatTime(notification.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Format time ──
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Main Page ──
export default function NotificationsPage() {
  const { language, user } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllRead, removeNotification, clearAll } = useNotificationStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [filter, setFilter] = useState<FilterTab>('all');

  // Filter notifications for current user role
  const userNotifications = notifications.filter(n => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'guide') return n.userId === 'demo-guide' || !n.userId || n.type === 'system' || n.type === 'system_announcement';
    return n.userId === 'demo-seeker' || !n.userId || n.type === 'system' || n.type === 'system_announcement';
  });

  // Filter by tab
  const filtered = userNotifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'booking') return ['booking_new', 'booking_confirmed', 'booking_cancelled', 'booking', 'session'].includes(n.type);
    if (filter === 'message') return ['chat_message', 'message'].includes(n.type);
    if (filter === 'payment') return ['payment_received', 'payment_failed', 'payment'].includes(n.type);
    if (filter === 'system') return ['system', 'system_announcement', 'info', 'success', 'warning', 'error', 'guide_verified', 'review_received', 'review'].includes(n.type);
    return true;
  });

  // Group by date
  const dateGroups = groupNotificationsByDate(filtered);

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    const notif = notifications.find(n => n.id === id);
    if (notif?.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Notifications', 'Arifa')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} ${l('unread', 'hazijasomwa')}` : l('All caught up!', 'Zote zimesomwa!')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="kbtn-outline text-xs py-1.5 px-2.5 flex items-center gap-1">
              <CheckCheck className="w-3 h-3" />{l('Mark all read', 'Soma zote')}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      >
        {([
          { key: 'all' as FilterTab, label: l('All', 'Zote'), count: userNotifications.length },
          { key: 'booking' as FilterTab, label: l('Bookings', 'Uhifadhi'), count: userNotifications.filter(n => ['booking_new', 'booking_confirmed', 'booking_cancelled', 'booking', 'session'].includes(n.type)).length },
          { key: 'message' as FilterTab, label: l('Messages', 'Ujumbe'), count: userNotifications.filter(n => ['chat_message', 'message'].includes(n.type)).length },
          { key: 'payment' as FilterTab, label: l('Payments', 'Malipo'), count: userNotifications.filter(n => ['payment_received', 'payment_failed', 'payment'].includes(n.type)).length },
          { key: 'system' as FilterTab, label: l('System', 'Mfumo'), count: userNotifications.filter(n => ['system', 'system_announcement', 'info', 'success', 'warning', 'error', 'guide_verified', 'review_received', 'review'].includes(n.type)).length },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === tab.key ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-[#E2E8F0] dark:bg-[#475569]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Notification Groups */}
      {dateGroups.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-[#64748B]" />
          </div>
          <p className="font-semibold">{l('No notifications', 'Hakuna arifa')}</p>
          <p className="text-sm text-[#64748B] mt-1">{l('You\'re all caught up!', 'Umekwisha soma zote!')}</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {group.label === 'Today' ? l('Today', 'Leo') :
                   group.label === 'Yesterday' ? l('Yesterday', 'Jana') :
                   l('Earlier', 'Zamani')}
                </span>
                <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
              </div>

              {/* Notifications in group */}
              <div className="space-y-2">
                <AnimatePresence>
                  {group.items.map((notif) => (
                    <SwipeableNotification
                      key={notif.id}
                      notification={notif}
                      onMarkRead={markAsRead}
                      onDismiss={removeNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
