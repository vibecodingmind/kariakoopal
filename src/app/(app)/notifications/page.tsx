'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Compass, DollarSign, Shield,
  Star, CreditCard, Info, AlertTriangle, CheckCircle2,
  Clock, X
} from 'lucide-react';

type FilterTab = 'all' | 'session' | 'payment' | 'system';

export default function NotificationsPage() {
  const { language, user } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllRead, removeNotification, clearAll } = useNotificationStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  }).filter(n => {
    // Show seeker notifications to seekers, guide notifications to guides
    if (user?.role === 'admin') return true;
    if (user?.role === 'guide') return n.userId === 'demo-guide' || n.type === 'system';
    return n.userId === 'demo-seeker' || n.type === 'system';
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'session': return <Compass className="w-4 h-4 text-[#0B5D3A]" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-[#FFD23F]" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-[#10B981]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />;
      case 'error': return <X className="w-4 h-4 text-[#E63946]" />;
      case 'system': return <Info className="w-4 h-4 text-[#0077B6]" />;
      default: return <Bell className="w-4 h-4 text-[#6C757D]" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return '';
    switch (type) {
      case 'session': return 'bg-[#E8F5EE]/50 dark:bg-[#0D2818]/50';
      case 'payment': return 'bg-[#FEF3C7]/50 dark:bg-[#3D2E0A]/50';
      case 'success': return 'bg-[#E8F5EE]/50 dark:bg-[#0D2818]/50';
      case 'warning': return 'bg-[#FEF3C7]/50 dark:bg-[#3D2E0A]/50';
      default: return 'bg-[#F1F3F5]/50 dark:bg-[#21262D]/50';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return l('Just now', 'Sasa hivi');
    if (diffMins < 60) return `${diffMins} ${l('min ago', 'dakika zilizopita')}`;
    if (diffHours < 24) return `${diffHours} ${l('hours ago', 'masaa yaliyopita')}`;
    return `${diffDays} ${l('days ago', 'siku zilizopita')}`;
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Notifications', 'Arifa')}</h1>
          <p className="text-sm text-[#6C757D] mt-0.5">
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
            <button onClick={clearAll} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D]">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { key: 'all' as FilterTab, label: l('All', 'Zote'), count: notifications.length },
          { key: 'session' as FilterTab, label: l('Sessions', 'Vipindi'), count: notifications.filter(n => n.type === 'session').length },
          { key: 'payment' as FilterTab, label: l('Payments', 'Malipo'), count: notifications.filter(n => n.type === 'payment').length },
          { key: 'system' as FilterTab, label: l('System', 'Mfumo'), count: notifications.filter(n => n.type === 'system' || n.type === 'info' || n.type === 'warning' || n.type === 'success').length },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === tab.key ? 'bg-[#0A4D3C] text-white' : 'bg-[#F1F3F5] dark:bg-[#21262D] text-[#6C757D]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-[#E9ECEF] dark:bg-[#30363D]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Notification List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#F1F3F5] dark:bg-[#21262D] flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#6C757D]" />
              </div>
              <p className="font-semibold">{l('No notifications', 'Hakuna arifa')}</p>
              <p className="text-sm text-[#6C757D] mt-1">{l('You\'re all caught up!', 'Umekwisha soma zote!')}</p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => markAsRead(notif.id)}
                className={`kcard p-3.5 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${getBgColor(notif.type, notif.read)} ${!notif.read ? 'border-l-4 border-l-[#0A4D3C]' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'session' ? 'bg-[#E8F5EE]' :
                    notif.type === 'payment' ? 'bg-[#FEF3C7]' :
                    notif.type === 'success' ? 'bg-[#E8F5EE]' :
                    notif.type === 'warning' ? 'bg-[#FEF3C7]' :
                    'bg-[#F1F3F5] dark:bg-[#21262D]'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${!notif.read ? 'font-semibold' : ''}`}>{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-[#0A4D3C] dark:bg-[#2EA77A] shrink-0" />}
                    </div>
                    <p className="text-xs text-[#6C757D] mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3 text-[#6C757D]" />
                      <span className="text-[10px] text-[#6C757D]">{formatTime(notif.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#F1F3F5] dark:hover:bg-[#21262D] shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
