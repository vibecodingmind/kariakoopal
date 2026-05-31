import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const httpServer = createServer();
const PORT = 3003;

const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Type Definitions ────────────────────────────────────────────────

interface GuideInfo {
  userId: string;
  socketId: string;
  zones: string[];
  status: 'online' | 'offline' | 'busy';
  location?: { lat: number; lng: number };
  lastSeen: Date;
}

interface SessionInfo {
  sessionId: string;
  guideId: string;
  seekerId: string;
  guideSocketId: string;
  seekerSocketId: string;
  startedAt: Date;
  completedAt?: Date;
}

interface RequestData {
  requestId: string;
  seekerId: string;
  seekerName?: string;
  zoneIds: string[];
  description?: string;
  budget?: number | null;
  category?: string;
  createdAt: Date;
}

interface MessageData {
  sessionId: string;
  senderId: string;
  senderType: 'guide' | 'seeker';
  content: string;
  translatedContent?: string | null;
  timestamp: Date;
}

interface LocationData {
  sessionId: string;
  senderId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}

interface EmergencyData {
  sessionId: string;
  senderId: string;
  senderType: 'guide' | 'seeker';
  message: string;
  lat?: number;
  lng?: number;
  timestamp: Date;
}

interface StatsData {
  onlineGuides: number;
  busyGuides: number;
  activeSessions: number;
  pendingRequests: number;
}

// ─── In-Memory State ─────────────────────────────────────────────────

const onlineGuides = new Map<string, GuideInfo>(); // socketId -> GuideInfo
const activeSessions = new Map<string, SessionInfo>(); // sessionId -> SessionInfo
const pendingRequests = new Map<string, { data: RequestData; timeoutId: NodeJS.Timeout }>(); // requestId -> { data, timeoutId }
const seekerSockets = new Map<string, string>(); // seekerId -> socketId
const userSockets = new Map<string, { socketId: string; userId: string; role: string }>(); // socketId -> user info (for client-side events)

// ─── Helper Functions ────────────────────────────────────────────────

function getOnlineGuideCount(): { online: number; busy: number } {
  let online = 0;
  let busy = 0;
  onlineGuides.forEach((g) => {
    if (g.status === 'online') online++;
    else if (g.status === 'busy') busy++;
  });
  return { online, busy };
}

function getStats(): StatsData {
  const counts = getOnlineGuideCount();
  return {
    onlineGuides: counts.online,
    busyGuides: counts.busy,
    activeSessions: activeSessions.size,
    pendingRequests: pendingRequests.size,
  };
}

function broadcastStats() {
  io.to('admin:room').emit('admin:stats', getStats());
}

function removeGuide(socketId: string) {
  const guide = onlineGuides.get(socketId);
  if (guide) {
    // Leave all zone rooms
    guide.zones.forEach((zone) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.leave(`zone:${zone}`);
    });
    onlineGuides.delete(socketId);
    io.emit('guides:updated', getOnlineGuideCount());
    broadcastStats();
  }
}

function handleRequestTimeout(requestId: string) {
  const request = pendingRequests.get(requestId);
  if (request) {
    // Notify the seeker that no guide accepted
    const seekerSocketId = seekerSockets.get(request.data.seekerId);
    if (seekerSocketId) {
      io.to(seekerSocketId).emit('request:timeout', {
        requestId,
        message: 'No guide accepted your request within 5 minutes. Expanding search zone.',
        expandedZones: true,
      });
    }

    // Auto-expand: broadcast to ALL online guides, not just zone-matched ones
    onlineGuides.forEach((guide) => {
      if (guide.status === 'online') {
        io.to(guide.socketId).emit('request:new', {
          ...request.data,
          expanded: true,
          message: 'Expanded search - this request needs a guide!',
        });
      }
    });

    // Set another timeout for final expiry (2 more minutes)
    const finalTimeoutId = setTimeout(() => {
      const stillPending = pendingRequests.get(requestId);
      if (stillPending) {
        const sSocketId = seekerSockets.get(request.data.seekerId);
        if (sSocketId) {
          io.to(sSocketId).emit('request:expired', {
            requestId,
            message: 'No guide available. Please try again later.',
          });
        }
        pendingRequests.delete(requestId);
        broadcastStats();
      }
    }, 2 * 60 * 1000);

    // Update the pending request with new timeout
    pendingRequests.set(requestId, { data: request.data, timeoutId: finalTimeoutId });
    broadcastStats();
  }
}

// ─── Connection Handler ──────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  // Store user info from auth data passed during connection
  const auth = socket.handshake.auth as { userId?: string; role?: string };
  if (auth?.userId) {
    userSockets.set(socket.id, {
      socketId: socket.id,
      userId: auth.userId,
      role: auth.role || 'seeker',
    });
    console.log(`[Auth] User ${auth.userId} (role: ${auth.role || 'seeker'}) connected on socket ${socket.id}`);
  }

  // ─── Client-Side Event Aliases (matching socket.ts) ───────────────
  // These handle events emitted by the client-side socket.ts library

  // location:update - broadcast location to session participants
  socket.on('location:update', (data: { lat: number; lng: number; accuracy?: number }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) {
      console.warn(`[Location:Update] Unauthenticated socket ${socket.id} attempted location update`);
      return;
    }

    console.log(`[Location:Update] User ${userInfo.userId} location: ${data.lat}, ${data.lng}`);

    const locationPayload = {
      userId: userInfo.userId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy || 10,
      timestamp: Date.now(),
    };

    // Broadcast to all sessions this user is part of
    activeSessions.forEach((session) => {
      if (session.guideId === userInfo.userId || session.seekerId === userInfo.userId) {
        io.to(`session:${session.sessionId}`).emit('location:update', locationPayload);
      }
    });

    // Also emit via the guide:location event for map display if user is a guide
    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, {
        ...guide,
        location: { lat: data.lat, lng: data.lng },
        lastSeen: new Date(),
      });
      io.emit('guide:location', {
        userId: userInfo.userId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
      });
    }
  });

  // chat:message - broadcast message to session participants
  socket.on('chat:message', (data: { sessionId: string; content: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) {
      console.warn(`[Chat:Message] Unauthenticated socket ${socket.id} attempted to send message`);
      return;
    }

    console.log(`[Chat:Message] User ${userInfo.userId} in session ${data.sessionId}: ${data.content}`);

    const messagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId: data.sessionId,
      senderId: userInfo.userId,
      content: data.content,
      translatedContent: null,
      timestamp: Date.now(),
    };

    // Broadcast to the session room
    io.to(`session:${data.sessionId}`).emit('chat:message', messagePayload);

    // Also emit via session:message for compatibility
    io.to(`session:${data.sessionId}`).emit('session:message', {
      sessionId: data.sessionId,
      senderId: userInfo.userId,
      senderType: userInfo.role === 'guide' ? 'guide' as const : 'seeker' as const,
      content: data.content,
      timestamp: new Date(),
    });
  });

  // session:join - join a socket.io room for the session
  socket.on('session:join', (data: { sessionId: string }) => {
    const userInfo = userSockets.get(socket.id);
    console.log(`[Session:Join] Socket ${socket.id} joining session room: ${data.sessionId}`);

    socket.join(`session:${data.sessionId}`);

    // Notify others in the session
    socket.to(`session:${data.sessionId}`).emit('session:userJoined', {
      userId: userInfo?.userId || 'unknown',
      name: userInfo?.userId || 'unknown',
    });

    // Also emit session:update event
    io.to(`session:${data.sessionId}`).emit('session:update', {
      sessionId: data.sessionId,
      status: 'active',
      timestamp: Date.now(),
    });
  });

  // session:leave - leave a socket.io room
  socket.on('session:leave', (data: { sessionId: string }) => {
    const userInfo = userSockets.get(socket.id);
    console.log(`[Session:Leave] Socket ${socket.id} leaving session room: ${data.sessionId}`);

    socket.leave(`session:${data.sessionId}`);

    // Notify others in the session
    socket.to(`session:${data.sessionId}`).emit('session:userLeft', {
      userId: userInfo?.userId || 'unknown',
    });
  });

  // guide:status - broadcast guide status change
  socket.on('guide:status', (data: { status: 'online' | 'offline' | 'busy' }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) {
      console.warn(`[Guide:Status] Unauthenticated socket ${socket.id} attempted status change`);
      return;
    }

    console.log(`[Guide:Status] Guide ${userInfo.userId} status changed to: ${data.status}`);

    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, status: data.status, lastSeen: new Date() });
      io.emit('guides:updated', getOnlineGuideCount());
    } else if (data.status === 'online') {
      // Guide not registered yet but marking online — register them
      const guideInfo: GuideInfo = {
        userId: userInfo.userId,
        socketId: socket.id,
        zones: [],
        status: 'online',
        lastSeen: new Date(),
      };
      onlineGuides.set(socket.id, guideInfo);
      socket.join(`guide:${userInfo.userId}`);
      io.emit('guides:updated', getOnlineGuideCount());
    }

    // Broadcast the status change
    io.emit('guide:status', {
      userId: userInfo.userId,
      status: data.status,
      timestamp: Date.now(),
    });

    broadcastStats();
  });

  // request:new - notify relevant guides of new requests (client-side alias)
  socket.on('request:new', (data: { requestId: string; seekerId: string; seekerName?: string; description?: string; zoneIds?: string[]; budget?: number | null }) => {
    const userInfo = userSockets.get(socket.id);
    console.log(`[Request:New] Seeker ${data.seekerId || userInfo?.userId} created request ${data.requestId}`);

    const seekerId = data.seekerId || userInfo?.userId || '';
    const zoneIds = data.zoneIds || [];

    // Track seeker socket
    seekerSockets.set(seekerId, socket.id);
    socket.join(`seeker:${seekerId}`);

    const requestData: RequestData = {
      requestId: data.requestId,
      seekerId,
      seekerName: data.seekerName,
      zoneIds,
      description: data.description,
      budget: data.budget,
      createdAt: new Date(),
    };

    // Broadcast to all online guides in matching zones
    zoneIds.forEach((zoneId: string) => {
      io.to(`zone:${zoneId}`).emit('request:new', {
        ...requestData,
        timestamp: Date.now(),
      });
    });

    // If no zone specified, broadcast to all online guides
    if (zoneIds.length === 0) {
      onlineGuides.forEach((guide) => {
        if (guide.status === 'online') {
          io.to(guide.socketId).emit('request:new', {
            ...requestData,
            timestamp: Date.now(),
          });
        }
      });
    }

    // Set up 5-minute timeout for auto-expansion
    const timeoutId = setTimeout(() => {
      handleRequestTimeout(data.requestId);
    }, 5 * 60 * 1000);

    pendingRequests.set(data.requestId, { data: requestData, timeoutId });

    broadcastStats();
  });

  // ─── Guide Events (Original) ─────────────────────────────────────

  socket.on('guide:online', (data: { userId: string; zones: string[]; location?: { lat: number; lng: number } }) => {
    console.log(`[Guide:Online] Guide ${data.userId} is online in zones: ${data.zones.join(', ')}`);

    const guideInfo: GuideInfo = {
      userId: data.userId,
      socketId: socket.id,
      zones: data.zones || [],
      status: 'online',
      location: data.location,
      lastSeen: new Date(),
    };

    onlineGuides.set(socket.id, guideInfo);

    // Update user socket mapping
    userSockets.set(socket.id, {
      socketId: socket.id,
      userId: data.userId,
      role: 'guide',
    });

    // Join zone rooms
    data.zones.forEach((zone: string) => {
      socket.join(`zone:${zone}`);
    });

    // Join guide room
    socket.join(`guide:${data.userId}`);

    io.emit('guides:updated', getOnlineGuideCount());
    broadcastStats();
  });

  socket.on('guide:location', (data: { userId: string; lat: number; lng: number }) => {
    console.log(`[Guide:Location] Guide ${data.userId} location updated: ${data.lat}, ${data.lng}`);

    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, location: { lat: data.lat, lng: data.lng }, lastSeen: new Date() });
      // Broadcast guide location for map display
      io.emit('guide:location', {
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
      });
    }
  });

  // ─── Request Events (Original) ────────────────────────────────────

  socket.on('request:create', (data: RequestData) => {
    console.log(`[Request:Create] Seeker ${data.seekerId} created request ${data.requestId} in zones: ${data.zoneIds.join(', ')}`);

    // Track seeker socket
    seekerSockets.set(data.seekerId, socket.id);
    socket.join(`seeker:${data.seekerId}`);

    const requestData: RequestData = {
      ...data,
      createdAt: data.createdAt || new Date(),
    };

    // Broadcast to all online guides in matching zones
    data.zoneIds.forEach((zoneId: string) => {
      io.to(`zone:${zoneId}`).emit('request:new', requestData);
    });

    // Set up 5-minute timeout for auto-expansion
    const timeoutId = setTimeout(() => {
      handleRequestTimeout(data.requestId);
    }, 5 * 60 * 1000);

    pendingRequests.set(data.requestId, { data: requestData, timeoutId });

    broadcastStats();
  });

  socket.on('request:cancel', (data: { requestId: string; seekerId: string }) => {
    console.log(`[Request:Cancel] Seeker ${data.seekerId} cancelled request ${data.requestId}`);

    const request = pendingRequests.get(data.requestId);
    if (request) {
      // Clear the timeout
      clearTimeout(request.timeoutId);
      pendingRequests.delete(data.requestId);

      // Notify all guides in the zones that the request was cancelled
      request.data.zoneIds.forEach((zoneId: string) => {
        io.to(`zone:${zoneId}`).emit('request:cancelled', {
          requestId: data.requestId,
          seekerId: data.seekerId,
        });
      });

      broadcastStats();
    }
  });

  socket.on('request:accept', (data: { requestId: string; guideId: string; seekerId: string; sessionId: string }) => {
    console.log(`[Request:Accept] Guide ${data.guideId} accepted request ${data.requestId} - Session ${data.sessionId}`);

    const request = pendingRequests.get(data.requestId);
    if (!request) {
      // Request no longer available (might have been cancelled or expired)
      socket.emit('request:unavailable', {
        requestId: data.requestId,
        message: 'This request is no longer available.',
      });
      return;
    }

    // Clear the timeout since the request was accepted
    clearTimeout(request.timeoutId);
    pendingRequests.delete(data.requestId);

    // Notify the seeker that their request was accepted
    const seekerSocketId = seekerSockets.get(data.seekerId);
    if (seekerSocketId) {
      io.to(seekerSocketId).emit('request:accepted', {
        requestId: data.requestId,
        guideId: data.guideId,
        sessionId: data.sessionId,
        timestamp: new Date(),
      });
    }

    // Update guide status to busy
    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, status: 'busy', lastSeen: new Date() });
      io.emit('guides:updated', getOnlineGuideCount());
    }

    broadcastStats();
  });

  socket.on('request:timeout', (data: { requestId: string }) => {
    console.log(`[Request:Timeout] Request ${data.requestId} timed out`);
    // Client-side timeout trigger - also handle server-side
    handleRequestTimeout(data.requestId);
  });

  // ─── Session Events (Original) ────────────────────────────────────

  socket.on('session:start', (data: { sessionId: string; guideId: string; seekerId: string }) => {
    console.log(`[Session:Start] Session ${data.sessionId} started between guide ${data.guideId} and seeker ${data.seekerId}`);

    const sessionInfo: SessionInfo = {
      sessionId: data.sessionId,
      guideId: data.guideId,
      seekerId: data.seekerId,
      guideSocketId: socket.id,
      seekerSocketId: seekerSockets.get(data.seekerId) || '',
      startedAt: new Date(),
    };

    activeSessions.set(data.sessionId, sessionInfo);

    // Both guide and seeker join the session room
    socket.join(`session:${data.sessionId}`);

    const seekerSocketId = seekerSockets.get(data.seekerId);
    if (seekerSocketId) {
      const seekerSocket = io.sockets.sockets.get(seekerSocketId);
      if (seekerSocket) {
        seekerSocket.join(`session:${data.sessionId}`);
      }
    }

    // Notify both parties that the session has started
    io.to(`session:${data.sessionId}`).emit('session:started', {
      sessionId: data.sessionId,
      guideId: data.guideId,
      seekerId: data.seekerId,
      timestamp: new Date(),
    });

    broadcastStats();
  });

  socket.on('session:message', (data: MessageData) => {
    console.log(`[Session:Message] ${data.senderType} ${data.senderId} in session ${data.sessionId}: ${data.content}`);

    const messageWithTimestamp: MessageData = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    io.to(`session:${data.sessionId}`).emit('session:message', messageWithTimestamp);
  });

  socket.on('session:location', (data: LocationData) => {
    console.log(`[Session:Location] ${data.senderId} shared location in session ${data.sessionId}: ${data.lat}, ${data.lng}`);

    const locationWithTimestamp: LocationData = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    io.to(`session:${data.sessionId}`).emit('session:location', locationWithTimestamp);
  });

  socket.on('session:complete', (data: { sessionId: string; completedBy: string; completedByType: 'guide' | 'seeker'; rating?: number; review?: string }) => {
    console.log(`[Session:Complete] Session ${data.sessionId} completed by ${data.completedByType} ${data.completedBy}`);

    const session = activeSessions.get(data.sessionId);
    if (session) {
      const completedSession = { ...session, completedAt: new Date() };

      // Update guide status back to online
      const guideSocketId = completedSession.guideSocketId;
      const guide = onlineGuides.get(guideSocketId);
      if (guide) {
        onlineGuides.set(guideSocketId, { ...guide, status: 'online', lastSeen: new Date() });
        io.emit('guides:updated', getOnlineGuideCount());
      }

      // Notify both parties
      io.to(`session:${data.sessionId}`).emit('session:completed', {
        sessionId: data.sessionId,
        completedBy: data.completedBy,
        completedByType: data.completedByType,
        rating: data.rating,
        review: data.review,
        timestamp: new Date(),
      });

      // Remove session from active sessions
      activeSessions.delete(data.sessionId);

      broadcastStats();
    }
  });

  socket.on('session:emergency', (data: EmergencyData) => {
    console.log(`[EMERGENCY] ${data.senderType} ${data.senderId} in session ${data.sessionId}: ${data.message}`);

    const emergencyWithTimestamp: EmergencyData = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };

    // Notify everyone in the session
    io.to(`session:${data.sessionId}`).emit('session:emergency', emergencyWithTimestamp);

    // Notify admin room
    io.to('admin:room').emit('admin:emergency', emergencyWithTimestamp);

    // Also notify all other admins via broadcast
    io.emit('admin:emergency', emergencyWithTimestamp);
  });

  // ─── Admin Events ──────────────────────────────────────────────────

  socket.on('admin:join', (data: { adminId: string }) => {
    console.log(`[Admin:Join] Admin ${data.adminId} joined admin room`);

    socket.join('admin:room');
    socket.join(`admin:${data.adminId}`);

    // Send current stats immediately
    socket.emit('admin:stats', getStats());
  });

  socket.on('admin:stats', () => {
    // Request for current stats
    socket.emit('admin:stats', getStats());
  });

  // ─── Health Check ─────────────────────────────────────────────────

  socket.on('ping', () => {
    socket.emit('pong', {
      status: 'ok',
      timestamp: Date.now(),
      stats: getStats(),
    });
  });

  // ─── Disconnect ────────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] User disconnected: ${socket.id} (${reason})`);

    const userInfo = userSockets.get(socket.id);

    // Check if this was a guide
    const guide = onlineGuides.get(socket.id);
    if (guide) {
      console.log(`[Disconnect] Guide ${guide.userId} went offline`);

      // If guide was in an active session, notify the seeker
      activeSessions.forEach((session) => {
        if (session.guideSocketId === socket.id) {
          const seekerSocketId = seekerSockets.get(session.seekerId);
          if (seekerSocketId) {
            io.to(seekerSocketId).emit('session:disrupted', {
              sessionId: session.sessionId,
              message: 'Your guide has disconnected. Waiting for reconnection...',
              guideId: session.guideId,
            });
          }
          // Also notify admins
          io.to('admin:room').emit('admin:disruption', {
            sessionId: session.sessionId,
            type: 'guide_disconnected',
            userId: session.guideId,
          });
        }
      });

      removeGuide(socket.id);
    }

    // Check if this was a seeker - clean up seeker socket mapping
    seekerSockets.forEach((socketId, seekerId) => {
      if (socketId === socket.id) {
        seekerSockets.delete(seekerId);
        console.log(`[Disconnect] Seeker ${seekerId} disconnected`);

        // If seeker was in an active session, notify the guide
        activeSessions.forEach((session) => {
          if (session.seekerId === seekerId) {
            io.to(session.guideSocketId).emit('session:disrupted', {
              sessionId: session.sessionId,
              message: 'The seeker has disconnected. Waiting for reconnection...',
              seekerId: session.seekerId,
            });
            // Also notify admins
            io.to('admin:room').emit('admin:disruption', {
              sessionId: session.sessionId,
              type: 'seeker_disconnected',
              userId: session.seekerId,
            });
          }
        });
      }
    });

    // Clean up user socket mapping
    userSockets.delete(socket.id);

    broadcastStats();
  });

  socket.on('error', (error) => {
    console.error(`[Error] Socket error (${socket.id}):`, error);
  });
});

// ─── Start Server ────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[Realtime Service] Socket.io server running on port ${PORT}`);
  console.log(`[Realtime Service] Chimbo Direct platform - real-time events active`);
  console.log(`[Realtime Service] Health check via Next.js API: /api/socketio?XTransformPort=${PORT}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Shutdown] Received SIGTERM signal, shutting down server...');
  io.close();
  httpServer.close(() => {
    console.log('[Shutdown] Realtime service closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Shutdown] Received SIGINT signal, shutting down server...');
  io.close();
  httpServer.close(() => {
    console.log('[Shutdown] Realtime service closed');
    process.exit(0);
  });
});
