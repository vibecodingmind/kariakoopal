// ── Socket.io Client for Chimbo Direct Platform ──
// Provides real-time messaging, location tracking, and live updates

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';
const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || '3003';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    try {
      socket = io(SOCKET_URL, {
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

export function connectSocket(userId: string, role: string): Socket | null {
  const s = getSocket();
  if (!s) return null;

  if (!s.connected) {
    s.auth = { userId, role };
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

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  translatedContent: string | null;
  timestamp: number;
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

// ── Event emitters ──

export function emitLocation(lat: number, lng: number, accuracy: number = 10): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('location:update', { lat, lng, accuracy });
  }
}

export function emitChatMessage(sessionId: string, content: string): void {
  const s = getSocket();
  if (s?.connected) {
    s.emit('chat:message', { sessionId, content });
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

// ── Event listeners ──

export function onLocationUpdate(callback: (data: LiveLocation) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on('location:update', callback);
  return () => s.off('location:update', callback);
}

export function onChatMessage(callback: (data: ChatMessage) => void): () => void {
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
