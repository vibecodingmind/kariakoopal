'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/use-chat';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageCircle, Plus, Compass,
  Clock, CheckCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ChatListPage() {
  const { language, user } = useAuthStore();
  const { conversations, isLoading, totalUnread } = useChat();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by search
  const filtered = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return l('Now', 'Sasa');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Avatar initials with role-based color
  const getAvatarColor = (role: string) => {
    return role === 'guide'
      ? 'bg-[#065F46] dark:bg-[#065F46]'
      : 'bg-[#0891B2] dark:bg-[#0891B2]';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
            {l('Messages', 'Ujumbe')}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {totalUnread > 0
              ? `${totalUnread} ${l('unread messages', 'ujumbe haujasomwa')}`
              : l('All caught up!', 'Zote zimesomwa!')}
          </p>
        </div>
        <button
          onClick={() => router.push('/guides')}
          className="w-10 h-10 rounded-xl bg-[#065F46] dark:bg-[#065F46] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
          title={l('New Chat', 'Ujumbe Mpya')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={l('Search conversations...', 'Tafuta mazungumzo...')}
          className="pl-9 h-10 bg-[#F1F5F9] dark:bg-[#1E293B] border-none rounded-xl text-sm"
        />
      </motion.div>

      {/* Conversation List */}
      <div className="space-y-1">
        {isLoading && conversations.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] dark:bg-[#334155]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#E2E8F0] dark:bg-[#334155] rounded w-24" />
                  <div className="h-3 bg-[#E2E8F0] dark:bg-[#334155] rounded w-40" />
                </div>
                <div className="h-3 bg-[#E2E8F0] dark:bg-[#334155] rounded w-8" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-[#64748B]" />
            </div>
            <p className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">
              {searchQuery
                ? l('No conversations found', 'Hakuna mazungumzo')
                : l('No messages yet', 'Hakuna ujumbe bado')}
            </p>
            <p className="text-sm text-[#64748B] mt-1">
              {searchQuery
                ? l('Try a different search', 'Jaribu utafute tofauti')
                : l('Start a conversation with a guide!', 'Anza mazungumzo na mwongozi!')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/guides')}
                className="mt-4 kbtn text-sm py-2 px-4 flex items-center gap-2 mx-auto"
              >
                <Compass className="w-4 h-4" />
                {l('Find a Guide', 'Tafuta Mwongozo')}
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-all active:scale-[0.98] text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-xl ${getAvatarColor(conv.otherUser.role)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {getInitials(conv.otherUser.name)}
                  </div>
                  {/* Online indicator */}
                  {conv.otherUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F172A]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#1E293B] dark:text-[#E2E8F0]'}`}>
                        {conv.otherUser.name}
                      </span>
                      {conv.otherUser.role === 'guide' && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399]">
                          GUIDE
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] shrink-0 ${conv.unreadCount > 0 ? 'text-[#065F46] dark:text-[#34D399] font-semibold' : 'text-[#94A3B8]'}`}>
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-medium text-[#475569] dark:text-[#CBD5E1]' : 'text-[#94A3B8]'}`}>
                      {conv.lastMessage.senderId === (user?.role === 'guide' ? 'demo-guide' : 'demo-seeker') && (
                        <CheckCheck className="w-3 h-3 inline mr-0.5 text-[#34D399]" />
                      )}
                      {conv.lastMessage.content}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#065F46] dark:bg-[#34D399] text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
