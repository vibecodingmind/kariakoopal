'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

// ── Types ──

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  content: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  translatedContent?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  bookingId: string | null;
  createdAt: string;
}

// ── Hook ──

export function useChat() {
  const { user, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const userId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      const res = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      setConversations(data.conversations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    }
  }, [isAuthenticated, user]);

  // Initial fetch and polling
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchConversations();
    setIsLoading(true);
    fetchConversations().finally(() => setIsLoading(false));

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(fetchConversations, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAuthenticated, fetchConversations]);

  // Send a message (creates conversation or sends to existing)
  const sendMessage = useCallback(async (recipientId: string, message: string, bookingId?: string) => {
    if (!user) return null;

    const senderId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message, bookingId, senderId }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      // Refresh conversations
      fetchConversations();

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [user, fetchConversations]);

  // Get total unread count
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return {
    conversations,
    isLoading,
    error,
    totalUnread,
    fetchConversations,
    sendMessage,
  };
}

// ── Conversation Messages Hook ──

export function useConversationMessages(conversationId: string | null) {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation['otherUser'] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !isAuthenticated || !user) return;

    try {
      const userId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      const res = await fetch(`/api/chat/${conversationId}?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages);
      setConversation(data.conversation?.otherUser || null);
      setBookingId(data.conversation?.bookingId || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    }
  }, [conversationId, isAuthenticated, user]);

  // Initial fetch and polling
  useEffect(() => {
    if (!conversationId || !isAuthenticated) return;

    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    // Poll every 3 seconds when conversation is open
    pollIntervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId, isAuthenticated, fetchMessages]);

  // Send message to existing conversation
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'image' | 'location' | 'system' = 'text', extra?: { imageUrl?: string; latitude?: number; longitude?: number }) => {
    if (!conversationId || !user) return null;

    const senderId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId,
      senderName: user.name,
      messageType,
      content,
      imageUrl: extra?.imageUrl,
      latitude: extra?.latitude,
      longitude: extra?.longitude,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Simulate typing indicator after sending
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          messageType,
          senderId,
          ...extra,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => m.id === optimisticMessage.id ? data.message : m)
      );

      return data;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [conversationId, user]);

  return {
    messages,
    conversation,
    bookingId,
    isLoading,
    error,
    isTyping,
    fetchMessages,
    sendMessage,
  };
}
