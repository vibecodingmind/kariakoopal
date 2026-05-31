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

interface UserInfo {
  socketId: string;
  userId: string;
  name: string;
  conversations: Set<string>;
  connectedAt: Date;
}

interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'system';
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

interface MarkReadPayload {
  conversationId: string;
  userId: string;
}

// ─── In-Memory State ─────────────────────────────────────────────────

const connectedUsers = new Map<string, UserInfo>(); // socketId -> UserInfo
const userSocketMap = new Map<string, string>(); // userId -> socketId (latest socket)

// ─── Helper Functions ────────────────────────────────────────────────

function getOnlineUserIds(): string[] {
  return Array.from(userSocketMap.keys());
}

function getUserInfoBySocket(socketId: string): UserInfo | undefined {
  return connectedUsers.get(socketId);
}

function getUserInfoByUserId(userId: string): UserInfo | undefined {
  const socketId = userSocketMap.get(userId);
  if (!socketId) return undefined;
  return connectedUsers.get(socketId);
}

// ─── Connection Handler ──────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  // Get userId from handshake query
  const userId = (socket.handshake.query.userId as string) || '';
  const userName = (socket.handshake.query.userName as string) || userId;

  if (!userId) {
    console.warn(`[Chat:Connect] Socket ${socket.id} connected without userId — disconnecting`);
    socket.disconnect(true);
    return;
  }

  console.log(`[Chat:Connect] User ${userId} (${userName}) connected on socket ${socket.id}`);

  // If user already has a socket, disconnect the old one
  const existingSocketId = userSocketMap.get(userId);
  if (existingSocketId && existingSocketId !== socket.id) {
    const oldSocket = io.sockets.sockets.get(existingSocketId);
    if (oldSocket) {
      console.log(`[Chat:Connect] Disconnecting previous socket for user ${userId}: ${existingSocketId}`);
      oldSocket.disconnect(true);
    }
    connectedUsers.delete(existingSocketId);
  }

  // Store socket→userId mapping
  const userInfo: UserInfo = {
    socketId: socket.id,
    userId,
    name: userName,
    conversations: new Set(),
    connectedAt: new Date(),
  };
  connectedUsers.set(socket.id, userInfo);
  userSocketMap.set(userId, socket.id);

  // Emit user_online to all
  io.emit('user_online', { userId, userName });

  // ─── join_conversation ─────────────────────────────────────────────

  socket.on('join_conversation', (data: { conversationId: string }) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    console.log(`[Chat:Join] User ${info.userId} joining conversation ${data.conversationId}`);
    socket.join(data.conversationId);
    info.conversations.add(data.conversationId);

    // Notify others in the conversation that user joined
    socket.to(data.conversationId).emit('user_joined_conversation', {
      conversationId: data.conversationId,
      userId: info.userId,
      userName: info.name,
    });
  });

  // ─── leave_conversation ────────────────────────────────────────────

  socket.on('leave_conversation', (data: { conversationId: string }) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    console.log(`[Chat:Leave] User ${info.userId} leaving conversation ${data.conversationId}`);
    socket.leave(data.conversationId);
    info.conversations.delete(data.conversationId);

    // Notify others in the conversation that user left
    socket.to(data.conversationId).emit('user_left_conversation', {
      conversationId: data.conversationId,
      userId: info.userId,
    });
  });

  // ─── send_message ──────────────────────────────────────────────────

  socket.on('send_message', (data: SendMessagePayload) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    const { conversationId, senderId, content, messageType } = data;

    // Validate sender matches connected user
    if (senderId !== info.userId) {
      console.warn(`[Chat:Message] Sender mismatch: socket user=${info.userId}, message sender=${senderId}`);
      return;
    }

    console.log(`[Chat:Message] User ${senderId} in conversation ${conversationId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      conversationId,
      senderId,
      content,
      messageType: messageType || 'text',
      createdAt: new Date().toISOString(),
    };

    // Broadcast new_message to the conversation room (including sender for confirmation)
    io.to(conversationId).emit('new_message', messageData);
  });

  // ─── typing_start ──────────────────────────────────────────────────

  socket.on('typing_start', (data: TypingPayload) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    console.log(`[Chat:Typing] User ${info.userId} typing in conversation ${data.conversationId}`);

    // Broadcast typing to the room (excluding sender)
    socket.to(data.conversationId).emit('typing', {
      conversationId: data.conversationId,
      userId: info.userId,
      userName: info.name,
    });
  });

  // ─── typing_stop ───────────────────────────────────────────────────

  socket.on('typing_stop', (data: { conversationId: string }) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    // Broadcast typing_stop to the room (excluding sender)
    socket.to(data.conversationId).emit('typing_stop', {
      conversationId: data.conversationId,
      userId: info.userId,
    });
  });

  // ─── mark_read ─────────────────────────────────────────────────────

  socket.on('mark_read', (data: MarkReadPayload) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    console.log(`[Chat:Read] User ${info.userId} marked messages as read in conversation ${data.conversationId}`);

    // Emit messages_read to the conversation room
    io.to(data.conversationId).emit('messages_read', {
      conversationId: data.conversationId,
      userId: info.userId,
    });
  });

  // ─── disconnect ────────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    const info = getUserInfoBySocket(socket.id);
    if (!info) return;

    console.log(`[Chat:Disconnect] User ${info.userId} disconnected: ${reason}`);

    // Remove mappings
    connectedUsers.delete(socket.id);

    // Only remove from userSocketMap if this is the current socket for the user
    if (userSocketMap.get(info.userId) === socket.id) {
      userSocketMap.delete(info.userId);

      // Emit user_offline to all
      io.emit('user_offline', { userId: info.userId });
    }
  });

  // ─── error ─────────────────────────────────────────────────────────

  socket.on('error', (error) => {
    console.error(`[Chat:Error] Socket error (${socket.id}):`, error);
  });

  // ─── ping (health check) ──────────────────────────────────────────

  socket.on('ping', () => {
    socket.emit('pong', {
      status: 'ok',
      timestamp: Date.now(),
      onlineUsers: getOnlineUserIds().length,
    });
  });
});

// ─── Start Server ────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[Chat Service] Socket.io server running on port ${PORT}`);
  console.log(`[Chat Service] Kariako Guide platform - chat events active`);
  console.log(`[Chat Service] Health check via Next.js API: /api/socketio?XTransformPort=${PORT}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Shutdown] Received SIGTERM signal, shutting down chat service...');
  io.close();
  httpServer.close(() => {
    console.log('[Shutdown] Chat service closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Shutdown] Received SIGINT signal, shutting down chat service...');
  io.close();
  httpServer.close(() => {
    console.log('[Shutdown] Chat service closed');
    process.exit(0);
  });
});
