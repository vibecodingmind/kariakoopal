'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNotificationStore } from '@/lib/stores/notification-store';

interface RealtimeEvent {
  type: 'booking' | 'message' | 'payment' | 'system' | 'session' | 'review';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification, incrementUnread } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect to Socket.IO server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/api/socketio',
      auth: { userId: user.id, role: user.role },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 Real-time connected');
      socket.emit('join', { userId: user.id, role: user.role });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Real-time disconnected');
    });

    // Listen for notifications
    socket.on('notification', (event: RealtimeEvent) => {
      addNotification({
        id: `notif-${Date.now()}`,
        type: event.type,
        title: event.title,
        message: event.message,
        read: false,
        createdAt: event.timestamp,
        data: event.data,
      });
      incrementUnread();
    });

    // Listen for booking updates
    socket.on('booking:update', (data: any) => {
      addNotification({
        id: `booking-${Date.now()}`,
        type: 'booking',
        title: 'Booking Update',
        message: data.message,
        read: false,
        createdAt: new Date().toISOString(),
        data,
      });
      incrementUnread();
    });

    // Listen for session updates
    socket.on('session:update', (data: any) => {
      addNotification({
        id: `session-${Date.now()}`,
        type: 'session',
        title: 'Session Update',
        message: data.message,
        read: false,
        createdAt: new Date().toISOString(),
        data,
      });
      incrementUnread();
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, addNotification, incrementUnread]);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
