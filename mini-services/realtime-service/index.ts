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

// ─── Chat-specific Types ─────────────────────────────────────────────

interface ChatMessagePayload {
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

interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

interface ReactionPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  emoji: string;
  action: 'add' | 'remove';
}

interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  messageIds: string[];
}

// ─── In-Memory State ─────────────────────────────────────────────────

const onlineGuides = new Map<string, GuideInfo>(); // socketId -> GuideInfo
const activeSessions = new Map<string, SessionInfo>(); // sessionId -> SessionInfo
const pendingRequests = new Map<string, { data: RequestData; timeoutId: NodeJS.Timeout }>(); // requestId -> { data, timeoutId }
const seekerSockets = new Map<string, string>(); // seekerId -> socketId
const userSockets = new Map<string, { socketId: string; userId: string; role: string; userName?: string }>(); // socketId -> user info

// ─── Chat-specific State ─────────────────────────────────────────────

const conversationRooms = new Map<string, Set<string>>(); // conversationId -> Set of socketIds
const userConversationMap = new Map<string, Set<string>>(); // userId -> Set of conversationIds
const typingUsers = new Map<string, Map<string, { userName: string; timeoutId: NodeJS.Timeout }>>(); // conversationId -> (userId -> { userName, timeout })
const messageReactions = new Map<string, Map<string, string>>(); // messageId -> (userId -> emoji)
const onlineUserIds = new Set<string>(); // Set of currently online user IDs

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
    const seekerSocketId = seekerSockets.get(request.data.seekerId);
    if (seekerSocketId) {
      io.to(seekerSocketId).emit('request:timeout', {
        requestId,
        message: 'No guide accepted your request within 5 minutes. Expanding search zone.',
        expandedZones: true,
      });
    }

    onlineGuides.forEach((guide) => {
      if (guide.status === 'online') {
        io.to(guide.socketId).emit('request:new', {
          ...request.data,
          expanded: true,
          message: 'Expanded search - this request needs a guide!',
        });
      }
    });

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

    pendingRequests.set(requestId, { data: request.data, timeoutId: finalTimeoutId });
    broadcastStats();
  }
}

// ─── Chat Helper Functions ───────────────────────────────────────────

function getUserIdBySocket(socketId: string): string | null {
  return userSockets.get(socketId)?.userId || null;
}

function getSocketIdByUserId(userId: string): string | null {
  for (const [socketId, info] of userSockets) {
    if (info.userId === userId) return socketId;
  }
  return null;
}

function clearTypingForUser(conversationId: string, userId: string) {
  const convTyping = typingUsers.get(conversationId);
  if (convTyping) {
    const entry = convTyping.get(userId);
    if (entry) {
      clearTimeout(entry.timeoutId);
      convTyping.delete(userId);
      if (convTyping.size === 0) {
        typingUsers.delete(conversationId);
      }
    }
  }
}

function broadcastOnlineStatus() {
  io.emit('users:online', Array.from(onlineUserIds));
}

// ─── Connection Handler ──────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  // Store user info from auth data or query params
  const auth = socket.handshake.auth as { userId?: string; role?: string };
  const query = socket.handshake.query as { userId?: string; userName?: string; role?: string };

  const userId = auth?.userId || query?.userId || '';
  const userName = auth?.role ? '' : (query?.userName || '');
  const role = auth?.role || query?.role || 'seeker';

  if (userId) {
    userSockets.set(socket.id, {
      socketId: socket.id,
      userId,
      role,
      userName,
    });

    // Track online user
    onlineUserIds.add(userId);

    // Rejoin any conversation rooms this user was part of
    const prevConvIds = userConversationMap.get(userId);
    if (prevConvIds) {
      prevConvIds.forEach(convId => {
        socket.join(`conv:${convId}`);
        if (!conversationRooms.has(convId)) {
          conversationRooms.set(convId, new Set());
        }
        conversationRooms.get(convId)!.add(socket.id);
      });
    }

    // Broadcast user online status
    io.emit('user_online', { userId, userName: userName || userId });
    broadcastOnlineStatus();

    console.log(`[Auth] User ${userId} (role: ${role}) connected on socket ${socket.id}`);
  }

  // ─── Chat: Conversation Events ──────────────────────────────────

  // join_conversation - join a conversation room for real-time updates
  socket.on('join_conversation', (data: { conversationId: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const convId = data.conversationId;
    console.log(`[Chat:Join] User ${userInfo.userId} joining conversation ${convId}`);

    socket.join(`conv:${convId}`);

    // Track conversation membership
    if (!conversationRooms.has(convId)) {
      conversationRooms.set(convId, new Set());
    }
    conversationRooms.get(convId)!.add(socket.id);

    if (!userConversationMap.has(userInfo.userId)) {
      userConversationMap.set(userInfo.userId, new Set());
    }
    userConversationMap.get(userInfo.userId)!.add(convId);

    // Notify others in the conversation
    socket.to(`conv:${convId}`).emit('user_joined_conversation', {
      conversationId: convId,
      userId: userInfo.userId,
      userName: userInfo.userName || userInfo.userId,
    });
  });

  // leave_conversation - leave a conversation room
  socket.on('leave_conversation', (data: { conversationId: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const convId = data.conversationId;
    console.log(`[Chat:Leave] User ${userInfo.userId} leaving conversation ${convId}`);

    socket.leave(`conv:${convId}`);

    // Clean up tracking
    const convRoom = conversationRooms.get(convId);
    if (convRoom) {
      convRoom.delete(socket.id);
      if (convRoom.size === 0) conversationRooms.delete(convId);
    }

    const userConvs = userConversationMap.get(userInfo.userId);
    if (userConvs) {
      userConvs.delete(convId);
      if (userConvs.size === 0) userConversationMap.delete(userInfo.userId);
    }

    // Clear any typing indicators for this user
    clearTypingForUser(convId, userInfo.userId);

    socket.to(`conv:${convId}`).emit('user_left_conversation', {
      conversationId: convId,
      userId: userInfo.userId,
    });
  });

  // send_message - send a chat message to a conversation
  socket.on('send_message', (data: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: 'text' | 'image' | 'location' | 'system' | 'file';
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    latitude?: number;
    longitude?: number;
  }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) {
      console.warn(`[Chat:Send] Unauthenticated socket attempted to send message`);
      return;
    }

    const senderId = userInfo.userId;
    const msgType = data.messageType || 'text';

    console.log(`[Chat:Send] User ${senderId} in conv ${data.conversationId}: ${data.content.substring(0, 50)}`);

    const messagePayload: ChatMessagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      conversationId: data.conversationId,
      senderId,
      senderName: userInfo.userName || senderId,
      content: data.content,
      messageType: msgType,
      imageUrl: data.imageUrl,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      latitude: data.latitude,
      longitude: data.longitude,
      translatedContent: null,
      createdAt: new Date().toISOString(),
    };

    // Broadcast to everyone in the conversation room
    io.to(`conv:${data.conversationId}`).emit('new_message', messagePayload);

    // Also emit to users who may not be in the room but have this conversation
    // (push notification fallback - handled by the Next.js API)

    // Clear typing indicator for this sender since they just sent a message
    clearTypingForUser(data.conversationId, senderId);
    io.to(`conv:${data.conversationId}`).emit('typing_stop', {
      conversationId: data.conversationId,
      userId: senderId,
    });
  });

  // typing_start - user started typing in a conversation
  socket.on('typing_start', (data: TypingPayload) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const convId = data.conversationId;
    const userId = userInfo.userId;

    // Set or update typing indicator
    if (!typingUsers.has(convId)) {
      typingUsers.set(convId, new Map());
    }
    const convTyping = typingUsers.get(convId)!;

    // Clear any existing timeout for this user
    const existing = convTyping.get(userId);
    if (existing) clearTimeout(existing.timeoutId);

    // Set new timeout (auto-clear after 5 seconds)
    const timeoutId = setTimeout(() => {
      clearTypingForUser(convId, userId);
      io.to(`conv:${convId}`).emit('typing_stop', {
        conversationId: convId,
        userId,
      });
    }, 5000);

    convTyping.set(userId, { userName: data.userName || userInfo.userName || userId, timeoutId });

    // Broadcast typing indicator to others in the conversation
    socket.to(`conv:${convId}`).emit('typing', {
      conversationId: convId,
      userId,
      userName: data.userName || userInfo.userName || userId,
    });
  });

  // typing_stop - user stopped typing
  socket.on('typing_stop', (data: { conversationId: string; userId: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    clearTypingForUser(data.conversationId, userInfo.userId);
    socket.to(`conv:${data.conversationId}`).emit('typing_stop', {
      conversationId: data.conversationId,
      userId: userInfo.userId,
    });
  });

  // mark_read - mark messages as read
  socket.on('mark_read', (data: { conversationId: string; userId: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    console.log(`[Chat:Read] User ${userInfo.userId} marked messages as read in conv ${data.conversationId}`);

    // Notify others in the conversation that this user has read messages
    socket.to(`conv:${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      userId: userInfo.userId,
    });
  });

  // message_reaction - add/remove a reaction to a message
  socket.on('message_reaction', (data: ReactionPayload) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    console.log(`[Chat:Reaction] User ${userInfo.userId} ${data.action} reaction ${data.emoji} on msg ${data.messageId}`);

    // Track reaction in memory
    if (!messageReactions.has(data.messageId)) {
      messageReactions.set(data.messageId, new Map());
    }
    const msgReactions = messageReactions.get(data.messageId)!;

    if (data.action === 'add') {
      msgReactions.set(userInfo.userId, data.emoji);
    } else {
      msgReactions.delete(userInfo.userId);
    }

    // Broadcast reaction to conversation
    io.to(`conv:${data.conversationId}`).emit('message_reaction', {
      conversationId: data.conversationId,
      messageId: data.messageId,
      userId: userInfo.userId,
      userName: userInfo.userName || userInfo.userId,
      emoji: data.emoji,
      action: data.action,
    });
  });

  // ─── Location Events ────────────────────────────────────────────

  // location:update - broadcast location to session participants
  socket.on('location:update', (data: { lat: number; lng: number; accuracy?: number }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const locationPayload = {
      userId: userInfo.userId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy || 10,
      timestamp: Date.now(),
    };

    activeSessions.forEach((session) => {
      if (session.guideId === userInfo.userId || session.seekerId === userInfo.userId) {
        io.to(`session:${session.sessionId}`).emit('location:update', locationPayload);
      }
    });

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

  // chat:message - broadcast message to session participants (legacy)
  socket.on('chat:message', (data: { sessionId: string; content: string }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const messagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId: data.sessionId,
      senderId: userInfo.userId,
      content: data.content,
      translatedContent: null,
      timestamp: Date.now(),
    };

    io.to(`session:${data.sessionId}`).emit('chat:message', messagePayload);
    io.to(`session:${data.sessionId}`).emit('session:message', {
      sessionId: data.sessionId,
      senderId: userInfo.userId,
      senderType: userInfo.role === 'guide' ? 'guide' as const : 'seeker' as const,
      content: data.content,
      timestamp: new Date(),
    });
  });

  // ─── Session Events ─────────────────────────────────────────────

  socket.on('session:join', (data: { sessionId: string }) => {
    const userInfo = userSockets.get(socket.id);
    socket.join(`session:${data.sessionId}`);
    socket.to(`session:${data.sessionId}`).emit('session:userJoined', {
      userId: userInfo?.userId || 'unknown',
      name: userInfo?.userName || userInfo?.userId || 'unknown',
    });
    io.to(`session:${data.sessionId}`).emit('session:update', {
      sessionId: data.sessionId,
      status: 'active',
      timestamp: Date.now(),
    });
  });

  socket.on('session:leave', (data: { sessionId: string }) => {
    const userInfo = userSockets.get(socket.id);
    socket.leave(`session:${data.sessionId}`);
    socket.to(`session:${data.sessionId}`).emit('session:userLeft', {
      userId: userInfo?.userId || 'unknown',
    });
  });

  // ─── Guide Events ───────────────────────────────────────────────

  socket.on('guide:status', (data: { status: 'online' | 'offline' | 'busy' }) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;

    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, status: data.status, lastSeen: new Date() });
      io.emit('guides:updated', getOnlineGuideCount());
    } else if (data.status === 'online') {
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

    io.emit('guide:status', {
      userId: userInfo.userId,
      status: data.status,
      timestamp: Date.now(),
    });

    broadcastStats();
  });

  socket.on('guide:online', (data: { userId: string; zones: string[]; location?: { lat: number; lng: number } }) => {
    const guideInfo: GuideInfo = {
      userId: data.userId,
      socketId: socket.id,
      zones: data.zones || [],
      status: 'online',
      location: data.location,
      lastSeen: new Date(),
    };

    onlineGuides.set(socket.id, guideInfo);
    userSockets.set(socket.id, {
      socketId: socket.id,
      userId: data.userId,
      role: 'guide',
    });

    data.zones.forEach((zone: string) => {
      socket.join(`zone:${zone}`);
    });
    socket.join(`guide:${data.userId}`);

    io.emit('guides:updated', getOnlineGuideCount());
    broadcastStats();
  });

  socket.on('guide:location', (data: { userId: string; lat: number; lng: number }) => {
    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, location: { lat: data.lat, lng: data.lng }, lastSeen: new Date() });
      io.emit('guide:location', {
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
      });
    }
  });

  // ─── Request Events ─────────────────────────────────────────────

  socket.on('request:new', (data: { requestId: string; seekerId: string; seekerName?: string; description?: string; zoneIds?: string[]; budget?: number | null }) => {
    const userInfo = userSockets.get(socket.id);
    const seekerId = data.seekerId || userInfo?.userId || '';

    seekerSockets.set(seekerId, socket.id);
    socket.join(`seeker:${seekerId}`);

    const requestData: RequestData = {
      requestId: data.requestId,
      seekerId,
      seekerName: data.seekerName,
      zoneIds: data.zoneIds || [],
      description: data.description,
      budget: data.budget,
      createdAt: new Date(),
    };

    const zoneIds = data.zoneIds || [];
    zoneIds.forEach((zoneId: string) => {
      io.to(`zone:${zoneId}`).emit('request:new', {
        ...requestData,
        timestamp: Date.now(),
      });
    });

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

    const timeoutId = setTimeout(() => {
      handleRequestTimeout(data.requestId);
    }, 5 * 60 * 1000);

    pendingRequests.set(data.requestId, { data: requestData, timeoutId });
    broadcastStats();
  });

  socket.on('request:create', (data: RequestData) => {
    seekerSockets.set(data.seekerId, socket.id);
    socket.join(`seeker:${data.seekerId}`);

    data.zoneIds.forEach((zoneId: string) => {
      io.to(`zone:${zoneId}`).emit('request:new', data);
    });

    const timeoutId = setTimeout(() => {
      handleRequestTimeout(data.requestId);
    }, 5 * 60 * 1000);

    pendingRequests.set(data.requestId, { data, timeoutId });
    broadcastStats();
  });

  socket.on('request:cancel', (data: { requestId: string; seekerId: string }) => {
    const request = pendingRequests.get(data.requestId);
    if (request) {
      clearTimeout(request.timeoutId);
      pendingRequests.delete(data.requestId);
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
    const request = pendingRequests.get(data.requestId);
    if (!request) {
      socket.emit('request:unavailable', {
        requestId: data.requestId,
        message: 'This request is no longer available.',
      });
      return;
    }

    clearTimeout(request.timeoutId);
    pendingRequests.delete(data.requestId);

    const seekerSocketId = seekerSockets.get(data.seekerId);
    if (seekerSocketId) {
      io.to(seekerSocketId).emit('request:accepted', {
        requestId: data.requestId,
        guideId: data.guideId,
        sessionId: data.sessionId,
        timestamp: new Date(),
      });
    }

    const guide = onlineGuides.get(socket.id);
    if (guide) {
      onlineGuides.set(socket.id, { ...guide, status: 'busy', lastSeen: new Date() });
      io.emit('guides:updated', getOnlineGuideCount());
    }

    broadcastStats();
  });

  socket.on('request:timeout', (data: { requestId: string }) => {
    handleRequestTimeout(data.requestId);
  });

  // ─── Session Lifecycle Events ──────────────────────────────────

  socket.on('session:start', (data: { sessionId: string; guideId: string; seekerId: string }) => {
    const sessionInfo: SessionInfo = {
      sessionId: data.sessionId,
      guideId: data.guideId,
      seekerId: data.seekerId,
      guideSocketId: socket.id,
      seekerSocketId: seekerSockets.get(data.seekerId) || '',
      startedAt: new Date(),
    };

    activeSessions.set(data.sessionId, sessionInfo);
    socket.join(`session:${data.sessionId}`);

    const seekerSocketId = seekerSockets.get(data.seekerId);
    if (seekerSocketId) {
      const seekerSocket = io.sockets.sockets.get(seekerSocketId);
      if (seekerSocket) seekerSocket.join(`session:${data.sessionId}`);
    }

    io.to(`session:${data.sessionId}`).emit('session:started', {
      sessionId: data.sessionId,
      guideId: data.guideId,
      seekerId: data.seekerId,
      timestamp: new Date(),
    });

    broadcastStats();
  });

  socket.on('session:message', (data: MessageData) => {
    io.to(`session:${data.sessionId}`).emit('session:message', {
      ...data,
      timestamp: data.timestamp || new Date(),
    });
  });

  socket.on('session:location', (data: LocationData) => {
    io.to(`session:${data.sessionId}`).emit('session:location', {
      ...data,
      timestamp: data.timestamp || new Date(),
    });
  });

  socket.on('session:complete', (data: { sessionId: string; completedBy: string; completedByType: 'guide' | 'seeker'; rating?: number; review?: string }) => {
    const session = activeSessions.get(data.sessionId);
    if (session) {
      const guideSocketId = session.guideSocketId;
      const guide = onlineGuides.get(guideSocketId);
      if (guide) {
        onlineGuides.set(guideSocketId, { ...guide, status: 'online', lastSeen: new Date() });
        io.emit('guides:updated', getOnlineGuideCount());
      }

      io.to(`session:${data.sessionId}`).emit('session:completed', {
        sessionId: data.sessionId,
        completedBy: data.completedBy,
        completedByType: data.completedByType,
        rating: data.rating,
        review: data.review,
        timestamp: new Date(),
      });

      activeSessions.delete(data.sessionId);
      broadcastStats();
    }
  });

  socket.on('session:emergency', (data: EmergencyData) => {
    const emergencyWithTimestamp = { ...data, timestamp: data.timestamp || new Date() };
    io.to(`session:${data.sessionId}`).emit('session:emergency', emergencyWithTimestamp);
    io.to('admin:room').emit('admin:emergency', emergencyWithTimestamp);
    io.emit('admin:emergency', emergencyWithTimestamp);
  });

  // ─── Admin Events ──────────────────────────────────────────────

  socket.on('admin:join', (data: { adminId: string }) => {
    socket.join('admin:room');
    socket.join(`admin:${data.adminId}`);
    socket.emit('admin:stats', getStats());
  });

  socket.on('admin:stats', () => {
    socket.emit('admin:stats', getStats());
  });

  // ─── Health Check ──────────────────────────────────────────────

  socket.on('ping', () => {
    socket.emit('pong', {
      status: 'ok',
      timestamp: Date.now(),
      stats: getStats(),
      onlineUsers: onlineUserIds.size,
    });
  });

  // ─── Disconnect ────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] User disconnected: ${socket.id} (${reason})`);

    const userInfo = userSockets.get(socket.id);

    // Clean up online status
    if (userInfo) {
      onlineUserIds.delete(userInfo.userId);
      io.emit('user_offline', { userId: userInfo.userId });
      broadcastOnlineStatus();

      // Clean up conversation rooms
      const userConvs = userConversationMap.get(userInfo.userId);
      if (userConvs) {
        userConvs.forEach(convId => {
          const convRoom = conversationRooms.get(convId);
          if (convRoom) {
            convRoom.delete(socket.id);
            if (convRoom.size === 0) conversationRooms.delete(convId);
          }
          // Clear typing for this user in all conversations
          clearTypingForUser(convId, userInfo.userId);
        });
        userConversationMap.delete(userInfo.userId);
      }
    }

    // Check if this was a guide
    const guide = onlineGuides.get(socket.id);
    if (guide) {
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
          io.to('admin:room').emit('admin:disruption', {
            sessionId: session.sessionId,
            type: 'guide_disconnected',
            userId: session.guideId,
          });
        }
      });
      removeGuide(socket.id);
    }

    // Check if this was a seeker
    seekerSockets.forEach((socketId, seekerId) => {
      if (socketId === socket.id) {
        seekerSockets.delete(seekerId);
        activeSessions.forEach((session) => {
          if (session.seekerId === seekerId) {
            io.to(session.guideSocketId).emit('session:disrupted', {
              sessionId: session.sessionId,
              message: 'The seeker has disconnected. Waiting for reconnection...',
              seekerId: session.seekerId,
            });
            io.to('admin:room').emit('admin:disruption', {
              sessionId: session.sessionId,
              type: 'seeker_disconnected',
              userId: session.seekerId,
            });
          }
        });
      }
    });

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
  console.log(`[Realtime Service] Chat events: join_conversation, leave_conversation, send_message, typing_start, typing_stop, mark_read, message_reaction`);
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
