'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  connectSocket,
  disconnectSocket,
  onChatMessage,
  onGuideRequest,
  onSessionUpdate,
  onLocationUpdate,
  emitLocation,
  type ChatMessage,
  type GuideRequestEvent,
  type SessionUpdate,
  type LiveLocation,
} from '@/lib/socket';

export function useSocketIO() {
  const { user, isAuthenticated } = useAuthStore();
  const initializedRef = useRef(false);

  // Connect socket when user authenticates
  useEffect(() => {
    if (isAuthenticated && user && !initializedRef.current) {
      initializedRef.current = true;
      connectSocket(user.id, user.role);
    }

    if (!isAuthenticated && initializedRef.current) {
      initializedRef.current = false;
      disconnectSocket();
    }

    return () => {
      // Don't disconnect on unmount - let the app manage lifecycle
    };
  }, [isAuthenticated, user]);

  // Location tracking hook
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return () => {};

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        emitLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        console.warn('[Location] Error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    startLocationTracking,
  };
}

// Hook for listening to chat messages in a session
export function useSessionChat(
  sessionId: string | null,
  onMessage?: (msg: ChatMessage) => void
) {
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onChatMessage((msg) => {
      if (msg.sessionId === sessionId) {
        messagesRef.current = [...messagesRef.current, msg];
        onMessage?.(msg);
      }
    });

    return unsubscribe;
  }, [sessionId, onMessage]);

  return messagesRef;
}

// Hook for guides to receive new requests
export function useGuideRequests(
  onRequest?: (req: GuideRequestEvent) => void
) {
  useEffect(() => {
    if (!onRequest) return;
    const unsubscribe = onGuideRequest(onRequest);
    return unsubscribe;
  }, [onRequest]);
}

// Hook for session status updates
export function useSessionUpdates(
  onUpdate?: (update: SessionUpdate) => void
) {
  useEffect(() => {
    if (!onUpdate) return;
    const unsubscribe = onSessionUpdate(onUpdate);
    return unsubscribe;
  }, [onUpdate]);
}

// Hook for live location updates from other users
export function useLiveLocations(
  onLocation?: (loc: LiveLocation) => void
) {
  useEffect(() => {
    if (!onLocation) return;
    const unsubscribe = onLocationUpdate(onLocation);
    return unsubscribe;
  }, [onLocation]);
}
