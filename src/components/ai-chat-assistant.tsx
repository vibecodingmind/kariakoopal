'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Bot,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ──

type UserRole = 'seeker' | 'guide' | 'admin';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  feedback?: 'positive' | 'negative' | null;
  copied?: boolean;
}

interface AIChatAssistantProps {
  userRole?: UserRole;
  className?: string;
}

interface ChatAPIResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  suggestions?: string[];
  error?: string;
}

// ── Constants ──

const QUICK_ACTIONS = [
  { label: 'Plan my trip', icon: '🗺️', message: 'Help me plan my trip to Kariakoo Market. What should I know before I go?' },
  { label: 'Find a guide', icon: '🧭', message: 'Find me a local guide who can help me navigate Kariakoo Market.' },
  { label: 'Translate', icon: '🗣️', message: 'Translate some common phrases from English to Swahili that I can use at the market.' },
  { label: 'Negotiate price', icon: '💰', message: 'Give me tips on how to negotiate prices at Kariakoo Market like a local.' },
];

const ROLE_GREETINGS: Record<UserRole, string> = {
  seeker: "Karibu! 👋 I'm **Chimbo AI**, your personal guide to Kariakoo Market. I can help you find the best deals, connect with local guides, translate Swahili, and navigate the market like a pro.\n\nWhat would you like to explore today?",
  guide: "Jambo! 🌟 I'm **Chimbo AI**, your assistant for the guide platform. I can help you improve your profile, get more bookings, manage your schedule, and connect with seekers.\n\nHow can I help you today?",
  admin: "Hello! ⚡ I'm **Chimbo AI**, your admin assistant. I can help you monitor platform health, manage disputes, verify vendors, and review analytics.\n\nWhat would you like to check?",
};

const WELCOME_SUGGESTIONS: Record<UserRole, string[]> = {
  seeker: ['What are the best zones to visit?', 'How much does a guide cost?', 'Street food recommendations'],
  guide: ['How to get more bookings?', 'Tips for better ratings', 'Set my availability'],
  admin: ['Platform stats overview', 'Recent fraud alerts', 'Dispute resolution queue'],
};

// ── Helpers ──

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Render markdown-like bold (**text**) and list items (- item) as React-friendly HTML */
function renderFormattedText(text: string): string {
  let html = text
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Bullet lists: - item
    .replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists: 1. item
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
  return html;
}

// ── Sub-components ──

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 px-1">
      <Avatar className="w-7 h-7 ring-2 ring-emerald-500/20 shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
          <Sparkles className="w-3.5 h-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function AIMessageBubble({
  message,
  onFeedback,
  onCopy,
}: {
  message: ChatMessage;
  onFeedback: (id: string, type: 'positive' | 'negative') => void;
  onCopy: (id: string) => void;
}) {
  return (
    <div className="flex items-end gap-2.5 px-1 group">
      <Avatar className="w-7 h-7 ring-2 ring-emerald-500/20 shadow-sm shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
          <Sparkles className="w-3.5 h-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5 max-w-[85%] min-w-0">
        <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div
            className="text-sm leading-relaxed text-foreground break-words [&_strong]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_br]:block"
            dangerouslySetInnerHTML={{ __html: renderFormattedText(message.content) }}
          />
        </div>
        <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] text-muted-foreground mr-2">{formatTime(message.timestamp)}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCopy(message.id)}
                className="p-1 rounded-md hover:bg-accent/50 transition-colors"
                aria-label="Copy message"
              >
                {message.copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {message.copied ? 'Copied!' : 'Copy'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFeedback(message.id, 'positive')}
                className={`p-1 rounded-md transition-colors ${
                  message.feedback === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'hover:bg-accent/50'
                }`}
                aria-label="Good response"
              >
                <ThumbsUp className={`w-3 h-3 ${message.feedback === 'positive' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Helpful</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFeedback(message.id, 'negative')}
                className={`p-1 rounded-md transition-colors ${
                  message.feedback === 'negative'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'hover:bg-accent/50'
                }`}
                aria-label="Poor response"
              >
                <ThumbsDown className={`w-3 h-3 ${message.feedback === 'negative' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Not helpful</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function UserMessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-end justify-end gap-2.5 px-1">
      <div className="flex flex-col items-end gap-1 max-w-[85%] min-w-0">
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground px-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 mt-1">
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/15 hover:border-emerald-500/25 transition-all duration-200 font-medium truncate max-w-[200px]"
        >
          {s}
        </motion.button>
      ))}
    </div>
  );
}

// ── Main Component ──

export function AIChatAssistant({ userRole = 'seeker', className }: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => generateId());
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ── Scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Focus input when opened ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Initialize welcome message ──
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: ROLE_GREETINGS[userRole],
        timestamp: new Date(),
        suggestions: WELCOME_SUGGESTIONS[userRole],
        feedback: null,
        copied: false,
      };
      setMessages([welcomeMsg]);
    }
  }, [userRole, messages.length]);

  // ── Send message to API ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      feedback: null,
      copied: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasInteracted(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
          userRole,
          language: 'English',
          location: 'Kariakoo Market',
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ChatAPIResponse = await res.json();

      if (!data.success || !data.response) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        feedback: null,
        copied: false,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again in a moment. If the issue persists, check your connection and retry.",
        timestamp: new Date(),
        suggestions: ['Try again', 'Plan my trip', 'Find a guide'],
        feedback: null,
        copied: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [conversationId, userRole, isLoading]);

  // ── Handle submit ──
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  // ── Handle suggestion click ──
  const handleSuggestionClick = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  // ── Handle quick action ──
  const handleQuickAction = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  // ── Copy message ──
  const handleCopy = useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    navigator.clipboard.writeText(msg.content).then(() => {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, copied: true } : m))
      );
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === id ? { ...m, copied: false } : m))
        );
      }, 2000);
    });
  }, [messages]);

  // ── Feedback ──
  const handleFeedback = useCallback((id: string, type: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, feedback: type } : m))
    );
  }, []);

  // ── Voice input ──
  const toggleVoiceInput = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // ── New conversation ──
  const startNewConversation = useCallback(() => {
    setConversationId(generateId());
    setMessages([]);
    setHasInteracted(false);
  }, []);

  // ── Count unread indicator ──
  const unreadCount = !hasInteracted && !isOpen ? 1 : 0;

  return (
    <>
      {/* ═══ FLOATING BUTTON ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${className || ''}`}
            aria-label="Open AI Chat Assistant"
          >
            {/* Glow pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse" />
            <Sparkles className="w-6 h-6 relative z-10" />

            {/* Notification badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ CHAT PANEL ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed z-50 flex flex-col overflow-hidden bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-emerald-500/5 ${
              // Full width on mobile, fixed on desktop
              'bottom-0 right-0 left-0 h-[85dvh] sm:bottom-4 sm:right-4 sm:left-auto sm:w-[400px] sm:h-[600px] sm:rounded-2xl sm:max-h-[calc(100dvh-2rem)]'
            } ${className || ''}`}
          >
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-300 rounded-full border-2 border-emerald-700 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Chimbo AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
                    <span className="text-[11px] text-white/70 font-medium">Online • Ready to help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startNewConversation}
                      className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">New chat</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ── QUICK ACTION CHIPS ── */}
            {!hasInteracted && (
              <div className="px-4 py-3 border-b border-border/30 bg-muted/20 shrink-0">
                <p className="text-[11px] text-muted-foreground font-medium mb-2">Quick actions</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_ACTIONS.map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQuickAction(action.message)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 whitespace-nowrap shrink-0 shadow-sm"
                    >
                      <span className="text-sm">{action.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── MESSAGES AREA ── */}
            <ScrollArea className="flex-1 px-3 py-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'user' ? (
                      <UserMessageBubble message={msg} />
                    ) : (
                      <AIMessageBubble
                        message={msg}
                        onFeedback={handleFeedback}
                        onCopy={handleCopy}
                      />
                    )}
                    {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="ml-9 mt-2">
                        <SuggestionChips
                          suggestions={msg.suggestions}
                          onSelect={handleSuggestionClick}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* ── INPUT AREA ── */}
            <div className="border-t border-border/30 bg-background/60 backdrop-blur-sm px-3 py-3 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/40 rounded-xl px-3 py-1.5 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-200">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Chimbo AI anything..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 py-1"
                    autoComplete="off"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isListening
                            ? 'bg-amber-500/15 text-amber-500 animate-pulse'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                        aria-label={isListening ? 'Stop listening' : 'Voice input'}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {isListening ? 'Listening...' : 'Voice input'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all duration-200 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Send message</TooltipContent>
                </Tooltip>
              </form>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                AI may make mistakes. Verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIChatAssistant;
