// ── Socket.io Client for Chimbo Direct Platform ──
// Provides real-time messaging, location tracking, and live updates

import { io, Socket } from 'socket.io-client';

const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || '3003';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    try {
      socket = io('/', {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        // Route through Caddy gateway using XTransformPort query parameter
        query: {
          XTransformPort: SOCKET_PORT,
        },
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.warn('[Socket] Connection error:', error.message);
      });
    } catch (e) {
      console.warn('[Socket] Failed to initialize:', e);
      return null;
    }
  }

  return socket;
}

export function connectSocket(userId: string, role: string, userName?: string): Socket | null {
  const s = getSocket();
  if (!s) return null;

  if (!s.connected) {
    s.auth = { userId, role };
    s.io.opts.query = {
      ...s.io.opts.query,
      userId,
      userName: userName || userId,
      role,
      XTransformPort: SOCKET_PORT,
    };
    s.connect();
  }

  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ── Event types ──

export interface LiveLocation {
  userId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface ChatMessageEvent {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'system' | 'file';
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  latitude?: number;
  longitude?: number;
  translatedContent?: string | null;
  createdAt: string;
}

export interface GuideRequestEvent {
  requestId: string;
  seekerId: string;
  seekerName: string;
  description: string;
  zoneIds: string[];
  budget: number | null;
  timestamp: number;
}

export interface SessionUpdate {
  sessionId: string;
  status: string;
  timestamp: number;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface ReadReceiptEvent {
  conversationId: string;
  userId: string;
  messageIds?: string[];
}

export interface ReactionEvent {
  conversationId: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  action: 'add' | 'remove';
}

export interface OnlineStatusEvent {
  userId: string;
  userName?: string;
}

// ── Chat Event Emitters ──

export function emitJoinConversation(conversationId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('join_conversation', { conversationId });
  }
}

export function emitLeaveConversation(conversationId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('leave_conversation', { conversationId });
  }
}

export function emitChatMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'location' | 'system' | 'file' = 'text', extra?: { imageUrl?: string; fileUrl?: string; fileName?: string; fileSize?: number; latitude?: number; longitude?: number }): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('send_message', {
      conversationId,
      content,
      messageType,
      ...extra,
    });
  }
}

export function emitTypingStart(conversationId: string, userName: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('typing_start', { conversationId, userId: '', userName });
  }
}

export function emitTypingStop(conversationId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('typing_stop', { conversationId, userId: '' });
  }
}

export function emitMarkRead(conversationId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('mark_read', { conversationId, userId: '' });
  }
}

export function emitMessageReaction(conversationId: string, messageId: string, emoji: string, action: 'add' | 'remove' = 'add'): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('message_reaction', { conversationId, messageId, userId: '', emoji, action });
  }
}

// ── Legacy Session Event Emitters ──

export function emitLocation(lat: number, lng: number, accuracy: number = 10): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('location:update', { lat, lng, accuracy });
  }
}

export function emitJoinSession(sessionId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('session:join', { sessionId });
  }
}

export function emitLeaveSession(sessionId: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('session:leave', { sessionId });
  }
}

export function emitGuideStatus(status: 'online' | 'offline' | 'busy'): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('guide:status', { status });
  }
}

// ── Chat Event Listeners ──

export function onNewMessage(callback: (data: ChatMessageEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('new_message', callback);
  return () => s.off('new_message', callback);
}

export function onTyping(callback: (data: TypingEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('typing', callback);
  return () => s.off('typing', callback);
}

export function onTypingStop(callback: (data: { conversationId: string; userId: string }) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('typing_stop', callback);
  return () => s.off('typing_stop', callback);
}

export function onMessagesRead(callback: (data: ReadReceiptEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('messages_read', callback);
  return () => s.off('messages_read', callback);
}

export function onMessageReaction(callback: (data: ReactionEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('message_reaction', callback);
  return () => s.off('message_reaction', callback);
}

export function onUserOnline(callback: (data: OnlineStatusEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('user_online', callback);
  return () => s.off('user_online', callback);
}

export function onUserOffline(callback: (data: { userId: string }) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('user_offline', callback);
  return () => s.off('user_offline', callback);
}

export function onUsersOnline(callback: (userIds: string[]) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('users:online', callback);
  return () => s.off('users:online', callback);
}

// ── Legacy Event Listeners ──

export function onLocationUpdate(callback: (data: LiveLocation) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('location:update', callback);
  return () => s.off('location:update', callback);
}

export function onChatMessage(callback: (data: { id: string; sessionId: string; senderId: string; content: string; translatedContent: string | null; timestamp: number }) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('chat:message', callback);
  return () => s.off('chat:message', callback);
}

export function onGuideRequest(callback: (data: GuideRequestEvent) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('request:new', callback);
  return () => s.off('request:new', callback);
}

export function onSessionUpdate(callback: (data: SessionUpdate) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('session:update', callback);
  return () => s.off('session:update', callback);
}

export function onUserJoined(callback: (data: { userId: string; name: string }) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('session:userJoined', callback);
  return () => s.off('session:userJoined', callback);
}
