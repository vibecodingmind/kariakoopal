'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useConversationMessages } from '@/hooks/use-chat';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ChatBubble, TypingIndicator, DateSeparator } from '@/components/chat-bubble';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Send, MapPin, Image as ImageIcon,
  Compass, CalendarCheck, MoreVertical,
  Phone, Video, Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { user, language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const {
    messages,
    conversation: otherUser,
    bookingId,
    isLoading,
    isTyping,
    sendMessage,
  } = useConversationMessages(conversationId);

  const [messageText, setMessageText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send
  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    sendMessage(trimmed, 'text');
    setMessageText('');
    inputRef.current?.focus();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Send location
  const handleSendLocation = () => {
    sendMessage('Shared location - Kariakoo Market, Dar es Salaam', 'location', {
      latitude: -6.8264,
      longitude: 39.2695,
    });
    setShowActions(false);
  };

  // Group messages by date
  const getMessageGroups = () => {
    const groups: Array<{ type: 'date'; date: string } | { type: 'message'; message: typeof messages[0] }> = [];
    let lastDate = '';

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        groups.push({ type: 'date', date: msg.createdAt });
        lastDate = msgDate;
      }
      groups.push({ type: 'message', message: msg });
    });

    return groups;
  };

  const messageGroups = getMessageGroups();

  // Avatar color
  const getAvatarColor = (role: string) => {
    return role === 'guide'
      ? 'bg-[#065F46] dark:bg-[#065F46]'
      : 'bg-[#0891B2] dark:bg-[#0891B2]';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] -mx-4 -mb-20 sm:-mx-0 sm:-mb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] shrink-0"
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/chat')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-[#64748B]" />
        </button>

        {/* Avatar + Info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {otherUser ? (
            <>
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl ${getAvatarColor(otherUser.role)} flex items-center justify-center text-white font-bold text-sm`}>
                  {getInitials(otherUser.name)}
                </div>
                {otherUser.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F172A]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] dark:text-[#E2E8F0] truncate">
                  {otherUser.name}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {otherUser.isOnline
                    ? l('Online', 'Mtandaoni')
                    : l('Offline', 'Hapatikani')}
                  {otherUser.role === 'guide' && ` · ${l('Guide', 'Mwongozo')}`}
                </p>
              </div>
            </>
          ) : (
            <div className="min-w-0">
              <div className="h-4 w-24 bg-[#E2E8F0] dark:bg-[#334155] rounded animate-pulse" />
              <div className="h-3 w-16 bg-[#E2E8F0] dark:bg-[#334155] rounded animate-pulse mt-1" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {bookingId && (
            <button
              onClick={() => router.push(`/seeker/session/${bookingId}`)}
              className="h-8 px-2.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center gap-1 text-[10px] font-semibold text-[#065F46] dark:text-[#34D399]"
            >
              <CalendarCheck className="w-3 h-3" />
              {l('View Session', 'Tazama Kipindi')}
            </button>
          )}
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>
      </motion.div>

      {/* Context Actions Dropdown */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute right-4 top-28 z-50 w-48 kcard p-1.5 shadow-lg"
        >
          {otherUser?.role === 'guide' && (
            <button
              onClick={() => { router.push(`/guides/${otherUser.id}`); setShowActions(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-lg transition-colors"
            >
              <Compass className="w-4 h-4 text-[#065F46]" />
              {l('View Profile', 'Tazama Wasifu')}
            </button>
          )}
          {!bookingId && otherUser?.role === 'guide' && (
            <button
              onClick={() => { router.push('/seeker/bookings'); setShowActions(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-lg transition-colors"
            >
              <CalendarCheck className="w-4 h-4 text-[#F59E0B]" />
              {l('Book this Guide', 'Hifadhi Mwongozo')}
            </button>
          )}
          <button
            onClick={handleSendLocation}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-lg transition-colors"
          >
            <MapPin className="w-4 h-4 text-[#0891B2]" />
            {l('Share Location', 'Shiriki Eneo')}
          </button>
          <button
            onClick={() => setShowActions(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            {l('Report', 'Ripoti')}
          </button>
        </motion.div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        style={{ scrollbarGutter: 'stable' }}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`h-12 rounded-2xl bg-[#E2E8F0] dark:bg-[#334155] animate-pulse ${
                    i % 2 === 0 ? 'w-48' : 'w-40'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center mx-auto mb-3">
                <Compass className="w-6 h-6 text-[#64748B]" />
              </div>
              <p className="font-semibold text-[#1E293B] dark:text-[#E2E8F0] text-sm">
                {l('Start the conversation!', 'Anza mazungumzo!')}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {l('Send a message to get started', 'Tuma ujumbe kuanza')}
              </p>
            </div>
          </div>
        ) : (
          messageGroups.map((item, idx) => {
            if (item.type === 'date') {
              return <DateSeparator key={`date-${idx}`} date={item.date} />;
            }
            const msg = item.message;
            const isOwn = msg.senderId === currentUserId;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showTimestamp={true}
                showSender={!isOwn && messages.length > 0}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <TypingIndicator name={otherUser?.name} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#0F172A] border-t border-[#E2E8F0] dark:border-[#334155] shrink-0"
      >
        {/* Attachment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSendLocation}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors active:scale-90"
            title={l('Share Location', 'Shiriki Eneo')}
          >
            <MapPin className="w-4 h-4 text-[#64748B]" />
          </button>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors active:scale-90"
            title={l('Send Image', 'Tuma Picha')}
            onClick={() => {
              sendMessage('📷 Photo from Kariakoo Market', 'image');
            }}
          >
            <ImageIcon className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={l('Type a message...', 'Andika ujumbe...')}
          className="flex-1 h-10 bg-[#F1F5F9] dark:bg-[#1E293B] border-none rounded-xl text-sm"
        />

        {/* Send button */}
        <Button
          size="icon"
          className="w-10 h-10 rounded-xl bg-[#065F46] dark:bg-[#065F46] hover:bg-[#064E3B] dark:hover:bg-[#064E3B] shrink-0 shadow-sm active:scale-95 transition-transform"
          onClick={handleSend}
          disabled={!messageText.trim()}
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
      </motion.div>
    </div>
  );
}
