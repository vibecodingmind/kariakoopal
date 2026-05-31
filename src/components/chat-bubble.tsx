'use client';

import { cn } from '@/lib/utils';
import { CheckCheck, Check, MapPin, Image as ImageIcon, Info, Clock } from 'lucide-react';
import type { ChatMessage } from '@/hooks/use-chat';

// ── Types ──

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp?: boolean;
  showSender?: boolean;
  className?: string;
}

// ── Time formatting ──

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Chat Bubble Component ──

export function ChatBubble({
  message,
  isOwn,
  showTimestamp = true,
  showSender = false,
  className,
}: ChatBubbleProps) {
  // System message
  if (message.messageType === 'system') {
    return (
      <div className={cn('flex justify-center my-3', className)}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#334155] text-[10px] text-[#64748B] max-w-[80%]">
          <Info className="w-3 h-3 shrink-0" />
          <span className="text-center">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 mb-1',
        isOwn ? 'items-end' : 'items-start',
        className,
      )}
    >
      {/* Sender name */}
      {showSender && !isOwn && (
        <span className="text-[10px] text-[#64748B] px-2 ml-1 font-medium">
          {message.senderName}
        </span>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] sm:max-w-[70%] relative group',
          isOwn ? 'pr-1' : 'pl-1',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-[#065F46] dark:bg-[#065F46] text-white rounded-br-md'
              : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] rounded-bl-md',
          )}
        >
          {/* Image message */}
          {message.messageType === 'image' && (
            <div className="mb-2 rounded-xl overflow-hidden bg-[#E2E8F0] dark:bg-[#334155] aspect-video flex items-center justify-center">
              {message.imageUrl ? (
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[#64748B]">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">Photo</span>
                </div>
              )}
            </div>
          )}

          {/* Location message */}
          {message.messageType === 'location' && (
            <div className="mb-2 rounded-xl overflow-hidden bg-[#ECFDF5] dark:bg-[#064E3B] p-3 flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#065F46]/10 dark:bg-[#34D399]/20 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-xs font-medium',
                  isOwn ? 'text-white/90' : 'text-[#065F46] dark:text-[#34D399]'
                )}>
                  📍 {message.content}
                </p>
                {message.latitude && message.longitude && (
                  <p className={cn(
                    'text-[10px] mt-0.5',
                    isOwn ? 'text-white/60' : 'text-[#64748B]'
                  )}>
                    {message.latitude.toFixed(4)}, {message.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Text content */}
          {message.messageType === 'text' && (
            <p>{message.content}</p>
          )}

          {/* Translation (if available) */}
          {message.translatedContent && message.messageType === 'text' && (
            <div className={cn(
              'mt-1.5 pt-1.5 text-xs border-t',
              isOwn
                ? 'border-white/20 text-white/70'
                : 'border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8]'
            )}>
              {message.translatedContent}
            </div>
          )}
        </div>

        {/* Timestamp and read receipt */}
        {showTimestamp && (
          <div className={cn(
            'flex items-center gap-1 mt-0.5 px-1',
            isOwn ? 'justify-end' : 'justify-start',
          )}>
            <Clock className="w-2.5 h-2.5 text-[#94A3B8]" />
            <span className="text-[9px] text-[#94A3B8]">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && (
              message.isRead ? (
                <CheckCheck className="w-3 h-3 text-[#34D399]" />
              ) : (
                <Check className="w-3 h-3 text-[#94A3B8]" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing Indicator ──

export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="flex items-end gap-2 mb-1">
      <div className="bg-[#F1F5F9] dark:bg-[#1E293B] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      {name && (
        <span className="text-[10px] text-[#94A3B8]">{name} is typing...</span>
      )}
    </div>
  );
}

// ── Date Separator ──

export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday';
  } else {
    label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
      <span className="text-[10px] text-[#94A3B8] font-medium">{label}</span>
      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
    </div>
  );
}
