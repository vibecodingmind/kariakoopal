'use client';

import { Send, Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { t, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  translatedContent: string | null;
  createdAt: string;
  senderName?: string;
}

interface SessionChatProps {
  sessionId: string;
  currentUserId: string;
  messages: ChatMessage[];
  language?: Language;
  onSendMessage?: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SessionChat({
  sessionId,
  currentUserId,
  messages,
  language: propLanguage,
  onSendMessage,
  isLoading = false,
  className,
}: SessionChatProps) {
  const storeLanguage = useAuthStore((s) => s.language) as Language;
  const language = propLanguage || storeLanguage;
  const [messageText, setMessageText] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed || !onSendMessage) return;
    onSendMessage(trimmed);
    setMessageText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
              <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-40')} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground">
          {language === 'sw' ? 'Kikao' : 'Session'}: {sessionId.slice(0, 8)}
        </span>
        <Button
          variant={autoTranslate ? 'default' : 'outline'}
          size="sm"
          className={cn('h-7 gap-1.5 text-xs', autoTranslate && 'bg-primary')}
          onClick={() => setAutoTranslate(!autoTranslate)}
        >
          <Languages className="size-3" />
          {t('auto_translate', language)}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('no_messages', language)}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
                >
                  {/* Sender name */}
                  {!isOwn && msg.senderName && (
                    <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 rounded-bl-md'
                    )}
                  >
                    <p className="break-words">{msg.content}</p>

                    {/* Translation */}
                    {autoTranslate && msg.translatedContent && (
                      <div className={cn(
                        'mt-1 pt-1 text-xs border-t',
                        isOwn
                          ? 'border-primary-foreground/20 text-primary-foreground/80'
                          : 'border-emerald-700/20 text-emerald-700/80 dark:text-emerald-300/80'
                      )}>
                        {msg.translatedContent}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t bg-muted/30">
        <Input
          ref={inputRef}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat_placeholder', language)}
          className="flex-1 h-10 text-sm"
          aria-label={t('chat_placeholder', language)}
        />
        <Button
          size="icon"
          className="size-10 shrink-0"
          onClick={handleSend}
          disabled={!messageText.trim()}
          aria-label={t('send_message', language)}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
