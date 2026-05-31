import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    return null;
  }
  return null;
}

// ── Demo messages per conversation (fallback) ──
const demoMessages: Record<string, Array<{
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
}>> = {
  'conv-1': [
    { id: 'msg-1-1', conversationId: 'conv-1', senderId: 'demo-seeker', senderName: 'James K.', messageType: 'text', content: 'Hujambo! Nafahamu kutaka electronics zone kesho asubuhi', translatedContent: 'Hello! I want to visit the electronics zone tomorrow morning', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'msg-1-2', conversationId: 'conv-1', senderId: 'guide-1', senderName: 'Mwanaildi Juma', messageType: 'text', content: 'Karibu! Mimiiko tayari. Unahitaji nini hasa?', translatedContent: 'Welcome! I am ready. What exactly do you need?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
    { id: 'msg-1-3', conversationId: 'conv-1', senderId: 'demo-seeker', senderName: 'James K.', messageType: 'text', content: 'Ninahitaji Samsung Galaxy A54. Bei gani?', translatedContent: 'I need a Samsung Galaxy A54. What is the price?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
    { id: 'msg-1-4', conversationId: 'conv-1', senderId: 'guide-1', senderName: 'Mwanaildi Juma', messageType: 'location', content: 'Tutakutana hapa - Electronics Zone, Block C', latitude: -6.8264, longitude: 39.2695, isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'msg-1-5', conversationId: 'conv-1', senderId: 'guide-1', senderName: 'Mwanaildi Juma', messageType: 'system', content: 'Booking confirmed for Electronics Zone tour', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
    { id: 'msg-1-6', conversationId: 'conv-1', senderId: 'guide-1', senderName: 'Mwanaildi Juma', messageType: 'text', content: 'Nitakuwa kwenye electronics zone asubuhi 📍', translatedContent: 'I will be at the electronics zone in the morning', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'msg-1-7', conversationId: 'conv-1', senderId: 'guide-1', senderName: 'Mwanaildi Juma', messageType: 'text', content: 'Nina connections nzuri huko, nitakupata bei nzuri 💰', translatedContent: 'I have good connections there, I will get you a good price', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
  ],
  'conv-2': [
    { id: 'msg-2-1', conversationId: 'conv-2', senderId: 'demo-seeker', senderName: 'James K.', messageType: 'text', content: 'Habari Fatma! Una vitambaa vya kanga?', translatedContent: 'Hi Fatma! Do you have kanga fabrics?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'msg-2-2', conversationId: 'conv-2', senderId: 'guide-2', senderName: 'Fatma Hassan', messageType: 'text', content: 'Ndio! Tuna aina nyingi za kanga na kitenge 🌺', translatedContent: 'Yes! We have many types of kanga and kitenge', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
    { id: 'msg-2-3', conversationId: 'conv-2', senderId: 'guide-2', senderName: 'Fatma Hassan', messageType: 'text', content: 'Tuna vitambaa vya kanga vipya! Njoo uone 🌟', translatedContent: 'We have new kanga fabrics! Come and see', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ],
  'conv-3': [
    { id: 'msg-3-1', conversationId: 'conv-3', senderId: 'guide-3', senderName: 'Asha Mohamed', messageType: 'text', content: 'Asante kwa kutembelea nami! Umeipata bei nzuri?', translatedContent: 'Thanks for visiting with me! Did you get a good price?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'msg-3-2', conversationId: 'conv-3', senderId: 'demo-seeker', senderName: 'James K.', messageType: 'text', content: 'Asante kwa kutumia Chimbo Direct! ⭐', translatedContent: 'Thanks for using Chimbo Direct!', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'msg-3-3', conversationId: 'conv-3', senderId: 'guide-3', senderName: 'Asha Mohamed', messageType: 'system', content: 'Session completed. Please leave a review!', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString() },
  ],
  'conv-4': [
    { id: 'msg-4-1', conversationId: 'conv-4', senderId: 'seeker-2', senderName: 'Amina Rashid', messageType: 'text', content: 'Hujambo, naomba msaada kwa spices zone', translatedContent: 'Hello, I need help with the spices zone', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'msg-4-2', conversationId: 'conv-4', senderId: 'demo-guide', senderName: 'Mwanaildi Juma', messageType: 'text', content: 'Karibu! Spices zone ni eneo langu la taaluma 🌶️', translatedContent: 'Welcome! The spices zone is my area of expertise', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    { id: 'msg-4-3', conversationId: 'conv-4', senderId: 'seeker-2', senderName: 'Amina Rashid', messageType: 'text', content: 'Naomba msaada kwa spices zone kesho', translatedContent: 'I need help with the spices zone tomorrow', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  ],
  'conv-5': [
    { id: 'msg-5-1', conversationId: 'conv-5', senderId: 'demo-guide', senderName: 'Mwanaildi Juma', messageType: 'text', content: 'Tumemaliza ziada! Umepata vitu vyote ulivyoomba', translatedContent: 'We have finished the tour! You got everything you asked for', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
    { id: 'msg-5-2', conversationId: 'conv-5', senderId: 'demo-guide', senderName: 'Mwanaildi Juma', messageType: 'system', content: 'Session imekamilika! Tafadhali acha review', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  ],
};

// ── Demo other-user lookup (fallback) ──
function getDemoOtherUser(conversationId: string, userId: string) {
  const otherUsers: Record<string, Record<string, { id: string; name: string; role: string; avatarUrl: string | null; isOnline: boolean }>> = {
    'conv-1': {
      'demo-seeker': { id: 'guide-1', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, isOnline: true },
      'guide-1': { id: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, isOnline: true },
    },
    'conv-2': {
      'demo-seeker': { id: 'guide-2', name: 'Fatma Hassan', role: 'guide', avatarUrl: null, isOnline: false },
      'guide-2': { id: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, isOnline: true },
    },
    'conv-3': {
      'demo-seeker': { id: 'guide-3', name: 'Asha Mohamed', role: 'guide', avatarUrl: null, isOnline: false },
      'guide-3': { id: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, isOnline: true },
    },
    'conv-4': {
      'demo-guide': { id: 'seeker-2', name: 'Amina Rashid', role: 'seeker', avatarUrl: null, isOnline: true },
      'seeker-2': { id: 'demo-guide', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, isOnline: true },
    },
    'conv-5': {
      'demo-guide': { id: 'seeker-3', name: 'David M.', role: 'seeker', avatarUrl: null, isOnline: false },
      'seeker-3': { id: 'demo-guide', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, isOnline: true },
    },
  };
  return otherUsers[conversationId]?.[userId] || { id: 'unknown', name: 'Unknown', role: 'seeker', avatarUrl: null, isOnline: false };
}

// GET /api/chat/[conversationId] - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userIdParam = searchParams.get('userId');

    // Extract user ID from auth cookie or query param
    const authToken = request.cookies.get('auth_token')?.value;
    const userId = (authToken ? getUserIdFromToken(authToken) : null) || userIdParam || 'demo-seeker';

    try {
      // Verify user is a participant in this conversation
      const participation = await db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

      if (!participation) {
        // User not in this conversation — fall back to demo
        return getDemoFallback(conversationId, userId, cursor, limit);
      }

      // Query messages with cursor-based pagination
      const messages = await db.chatMessage.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // take one extra to determine hasMore
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1, // skip the cursor itself
            }
          : {}),
      });

      const hasMore = messages.length > limit;
      const limited = hasMore ? messages.slice(0, limit) : messages;

      // Reverse to chronological order (oldest first)
      limited.reverse();

      // Mark messages as read for current user
      await db.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      // Reset unread count for this participant
      await db.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });

      // Get conversation info with other user
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  avatarUrl: true,
                  guideProfile: { select: { currentStatus: true, isOnline: true } },
                },
              },
            },
          },
        },
      });

      const otherParticipant = conversation?.participants.find(p => p.userId !== userId);
      const otherUser = otherParticipant?.user;

      const unreadCount = limited.filter(m => !m.isRead && m.senderId !== userId).length;

      const messagesResponse = limited.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender.name,
        messageType: m.messageType,
        content: m.content,
        imageUrl: m.imageUrl,
        latitude: m.latitude,
        longitude: m.longitude,
        translatedContent: m.translatedContent,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }));

      return NextResponse.json({
        messages: messagesResponse,
        conversation: {
          id: conversationId,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                role: otherUser.role,
                avatarUrl: otherUser.avatarUrl,
                isOnline: otherUser.guideProfile?.isOnline ?? false,
              }
            : { id: 'unknown', name: 'Unknown', role: 'seeker', avatarUrl: null, isOnline: false },
          bookingId: conversation?.bookingId || null,
        },
        unreadCount,
        pagination: {
          hasMore,
          nextCursor: hasMore ? limited[0]?.id : null,
          limit,
        },
      });
    } catch (dbError) {
      console.error('DB query failed, falling back to demo data:', dbError);
      return getDemoFallback(conversationId, userId, cursor, limit);
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Demo fallback for GET
function getDemoFallback(conversationId: string, userId: string, cursor: string | null, limit: number) {
  const messages = demoMessages[conversationId] || [];

  let filtered = messages;
  if (cursor) {
    const cursorIdx = messages.findIndex(m => m.id === cursor);
    if (cursorIdx > 0) {
      filtered = messages.slice(0, cursorIdx);
    }
  }

  const limited = filtered.slice(-limit);
  const hasMore = filtered.length > limit;

  const unreadCount = messages.filter(m => !m.isRead && m.senderId !== userId).length;

  const conversationInfo = {
    id: conversationId,
    otherUser: getDemoOtherUser(conversationId, userId),
    bookingId: conversationId === 'conv-1' ? 'booking-1' : conversationId === 'conv-3' ? 'booking-3' : conversationId === 'conv-5' ? 'booking-5' : null,
  };

  return NextResponse.json({
    messages: limited,
    conversation: conversationInfo,
    unreadCount,
    pagination: {
      hasMore,
      nextCursor: hasMore ? limited[0]?.id : null,
      limit,
    },
  });
}

// POST /api/chat/[conversationId] - Send a message to existing conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { content, messageType = 'text', senderId, imageUrl, latitude, longitude } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Extract sender ID from auth cookie or body
    const authToken = request.cookies.get('auth_token')?.value;
    const sender = (authToken ? getUserIdFromToken(authToken) : null) || senderId || 'demo-seeker';

    try {
      // Verify sender is a participant
      const participation = await db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: sender },
        },
      });

      if (!participation) {
        // Not a participant — fall back to demo
        return getDemoPostFallback(conversationId, sender, content, messageType, imageUrl, latitude, longitude);
      }

      // Create message in DB
      const newMsg = await db.chatMessage.create({
        data: {
          conversationId,
          senderId: sender,
          messageType,
          content,
          imageUrl: imageUrl || null,
          latitude: latitude || null,
          longitude: longitude || null,
        },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
      });

      // Update conversation's last message
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageContent: content,
          lastMessageSender: sender,
          lastMessageAt: new Date(),
        },
      });

      // Increment unread count for other participants
      await db.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: { not: sender },
        },
        data: { unreadCount: { increment: 1 } },
      });

      return NextResponse.json({
        message: {
          id: newMsg.id,
          conversationId,
          senderId: sender,
          senderName: newMsg.sender.name,
          messageType: newMsg.messageType,
          content: newMsg.content,
          imageUrl: newMsg.imageUrl,
          latitude: newMsg.latitude,
          longitude: newMsg.longitude,
          isRead: false,
          createdAt: newMsg.createdAt.toISOString(),
        },
      }, { status: 201 });
    } catch (dbError) {
      console.error('DB operation failed, falling back to demo data:', dbError);
      return getDemoPostFallback(conversationId, sender, content, messageType, imageUrl, latitude, longitude);
    }
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Demo fallback for POST
function getDemoPostFallback(
  conversationId: string,
  sender: string,
  content: string,
  messageType: string,
  imageUrl?: string,
  latitude?: number,
  longitude?: number
) {
  const senderName = sender === 'demo-seeker' ? 'James K.' : sender === 'demo-guide' ? 'Mwanaildi Juma' : 'User';

  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    senderId: sender,
    senderName,
    messageType: messageType as 'text' | 'image' | 'location' | 'system',
    content,
    imageUrl: imageUrl || undefined,
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (!demoMessages[conversationId]) {
    demoMessages[conversationId] = [];
  }
  demoMessages[conversationId].push(newMessage as typeof demoMessages[string][number]);

  return NextResponse.json({ message: newMessage }, { status: 201 });
}
