'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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

// ── Socket.IO Chat Hook ──

export function useSocketChat() {
  const { user, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  // Connect Socket.IO on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // No socket to create when not authenticated
      return;
    }

    const userId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
    const userName = user.name || userId;

    const newSocket = io('/', {
      query: { userId, userName, XTransformPort: '3003' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('[Chat:Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Chat:Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('[Chat:Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('user_online', (data: { userId: string; userName: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    });

    newSocket.on('user_offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    newSocket.connect();

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      // Disconnect and clean up when auth changes or component unmounts
      newSocket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
    };
  }, [isAuthenticated, user]);

  // Join a conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  }, []);

  // Leave a conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  }, []);

  // Send a message via Socket.IO
  const sendSocketMessage = useCallback((
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'location' | 'system' = 'text'
  ) => {
    if (socketRef.current?.connected) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      socketRef.current.emit('send_message', {
        conversationId,
        senderId: userId,
        content,
        messageType,
      });
    }
  }, [user]);

  // Emit typing start
  const emitTypingStart = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      const userName = user?.name || userId;
      socketRef.current.emit('typing_start', {
        conversationId,
        userId,
        userName,
      });
    }
  }, [user]);

  // Emit typing stop
  const emitTypingStop = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      socketRef.current.emit('typing_stop', {
        conversationId,
        userId,
      });
    }
  }, [user]);

  // Mark messages as read
  const markMessagesRead = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      socketRef.current.emit('mark_read', {
        conversationId,
        userId,
      });
    }
  }, [user]);

  // Listen for specific socket events (with cleanup)
  const onNewMessage = useCallback((callback: (data: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: string;
    createdAt: string;
  }) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('new_message', callback);
    return () => {
      socketRef.current?.off('new_message', callback);
    };
  }, []);

  const onTyping = useCallback((callback: (data: {
    conversationId: string;
    userId: string;
    userName: string;
  }) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('typing', callback);
    return () => {
      socketRef.current?.off('typing', callback);
    };
  }, []);

  const onTypingStop = useCallback((callback: (data: {
    conversationId: string;
    userId: string;
  }) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('typing_stop', callback);
    return () => {
      socketRef.current?.off('typing_stop', callback);
    };
  }, []);

  const onMessagesRead = useCallback((callback: (data: {
    conversationId: string;
    userId: string;
  }) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('messages_read', callback);
    return () => {
      socketRef.current?.off('messages_read', callback);
    };
  }, []);

  return {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendSocketMessage,
    emitTypingStart,
    emitTypingStop,
    markMessagesRead,
    onNewMessage,
    onTyping,
    onTypingStop,
    onMessagesRead,
  };
}

// ── REST-based Hook (with Socket.IO enhancement) ──

export function useChat() {
  const { user, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // ── Fetch conversations (REST fallback) ──

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

  // ── Socket.IO connection for conversation list updates ──

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const userId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
    const userName = user.name || userId;

    const newSocket = io('/', {
      query: { userId, userName },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Route through Caddy gateway
    newSocket.io.opts.query = {
      ...newSocket.io.opts.query,
      XTransformPort: '3003',
    };

    newSocket.on('connect', () => {
      console.log('[Chat:Socket] Connected for conversation list:', newSocket.id);
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', () => {
      setSocketConnected(false);
    });

    // When a new message arrives, refresh the conversation list
    newSocket.on('new_message', () => {
      fetchConversations();
    });

    // When messages are read, refresh to update unread counts
    newSocket.on('messages_read', () => {
      fetchConversations();
    });

    newSocket.connect();
    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, fetchConversations]);

  // ── Initial fetch and polling (fallback when Socket.IO is disconnected) ──

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    fetchConversations().finally(() => setIsLoading(false));

    // Poll every 5 seconds as fallback (only when socket is not connected)
    pollIntervalRef.current = setInterval(() => {
      if (!socketConnected) {
        fetchConversations();
      }
    }, 5000);

    // Still poll every 15 seconds even with socket (belt and suspenders)
    const slowPollId = setInterval(fetchConversations, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clearInterval(slowPollId);
    };
  }, [isAuthenticated, fetchConversations, socketConnected]);

  // ── Send a message (creates conversation or sends to existing) ──

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

      // Also emit via Socket.IO if connected
      if (socketRef.current?.connected && data.conversationId) {
        socketRef.current.emit('send_message', {
          conversationId: data.conversationId,
          senderId,
          content: message,
          messageType: 'text',
        });
      }

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
    socketConnected,
    fetchConversations,
    sendMessage,
  };
}

// ── Conversation Messages Hook (with Socket.IO real-time updates) ──

export function useConversationMessages(conversationId: string | null) {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation['otherUser'] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<{ userId: string; userName: string } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch messages (REST fallback) ──

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

  // ── Socket.IO connection for real-time messages ──

  useEffect(() => {
    if (!conversationId || !isAuthenticated || !user) return;

    const userId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
    const userName = user.name || userId;

    const newSocket = io('/', {
      query: { userId, userName },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Route through Caddy gateway
    newSocket.io.opts.query = {
      ...newSocket.io.opts.query,
      XTransformPort: '3003',
    };

    newSocket.on('connect', () => {
      console.log('[Chat:Socket] Connected for conversation:', conversationId);
      setSocketConnected(true);

      // Join the conversation room
      newSocket.emit('join_conversation', { conversationId });

      // Mark messages as read when entering conversation
      newSocket.emit('mark_read', { conversationId, userId });
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', () => {
      setSocketConnected(false);
    });

    // ── Listen for new messages ──

    newSocket.on('new_message', (data: {
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      messageType: string;
      createdAt: string;
    }) => {
      if (data.conversationId === conversationId) {
        // Only add if it's not from us (our optimistic update already handles our own)
        const myUserId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
        if (data.senderId !== myUserId) {
          const newMsg: ChatMessage = {
            id: data.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderName: data.senderId, // Will be enriched by REST refresh
            messageType: (data.messageType as ChatMessage['messageType']) || 'text',
            content: data.content,
            isRead: true,
            createdAt: data.createdAt,
          };
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read since we're in this conversation
          newSocket.emit('mark_read', { conversationId, userId });
        }

        // Also do a REST refresh to get full message details
        fetchMessages();
      }
    });

    // ── Listen for typing indicators ──

    newSocket.on('typing', (data: { conversationId: string; userId: string; userName: string }) => {
      if (data.conversationId === conversationId) {
        const myUserId = user.role === 'guide' ? 'demo-guide' : 'demo-seeker';
        if (data.userId !== myUserId) {
          setIsTyping(true);
          setTypingUser({ userId: data.userId, userName: data.userName });

          // Auto-clear typing after 3 seconds of no updates
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUser(null);
          }, 3000);
        }
      }
    });

    newSocket.on('typing_stop', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
        setTypingUser(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    });

    // ── Listen for messages read ──

    newSocket.on('messages_read', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        // Mark messages from this user as read
        setMessages(prev =>
          prev.map(m =>
            m.senderId !== data.userId ? { ...m, isRead: true } : m
          )
        );
      }
    });

    newSocket.connect();
    socketRef.current = newSocket;

    return () => {
      // Leave conversation room and disconnect
      if (newSocket.connected) {
        newSocket.emit('leave_conversation', { conversationId });
      }
      newSocket.disconnect();
      socketRef.current = null;
      setIsTyping(false);
      setTypingUser(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, isAuthenticated, user, fetchMessages]);

  // ── Initial fetch and polling (fallback when Socket.IO is disconnected) ──

  useEffect(() => {
    if (!conversationId || !isAuthenticated) return;

    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    // Poll every 3 seconds as fallback (only when socket is not connected)
    pollIntervalRef.current = setInterval(() => {
      if (!socketConnected) {
        fetchMessages();
      }
    }, 3000);

    // Still poll every 10 seconds even with socket (safety net)
    const slowPollId = setInterval(fetchMessages, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clearInterval(slowPollId);
    };
  }, [conversationId, isAuthenticated, fetchMessages, socketConnected]);

  // ── Send message to existing conversation ──

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

    // Emit typing indicator for auto-reply simulation (keep existing behavior)
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingUser(null);
    }, 3000);

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

      // Also emit via Socket.IO if connected
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          conversationId,
          senderId,
          content,
          messageType,
        });
      }

      return data;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [conversationId, user]);

  // ── Emit typing start ──

  const emitTypingStart = useCallback(() => {
    if (socketRef.current?.connected && conversationId) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      const userName = user?.name || userId;
      socketRef.current.emit('typing_start', {
        conversationId,
        userId,
        userName,
      });
    }
  }, [conversationId, user]);

  // ── Emit typing stop ──

  const emitTypingStop = useCallback(() => {
    if (socketRef.current?.connected && conversationId) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      socketRef.current.emit('typing_stop', {
        conversationId,
        userId,
      });
    }
  }, [conversationId, user]);

  // ── Mark messages as read ──

  const markAsRead = useCallback(() => {
    if (socketRef.current?.connected && conversationId) {
      const userId = user?.role === 'guide' ? 'demo-guide' : 'demo-seeker';
      socketRef.current.emit('mark_read', {
        conversationId,
        userId,
      });
    }
  }, [conversationId, user]);

  return {
    messages,
    conversation,
    bookingId,
    isLoading,
    error,
    isTyping,
    typingUser,
    socketConnected,
    fetchMessages,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    markAsRead,
  };
}
