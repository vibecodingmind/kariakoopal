import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
// Token formats: token_{userId}_{timestamp} | demo_token_{userId}_{timestamp} | temp_token_{id}_{timestamp}
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    // demo_token_{userId}_{timestamp} → index 2
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    // token_{userId}_{timestamp} → index 1
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    return null;
  }
  return null;
}

// ── Demo conversations (fallback) ──
const demoConversations = [
  {
    id: 'conv-1',
    participants: [
      { userId: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, unreadCount: 2 },
      { userId: 'guide-1', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, unreadCount: 0 },
    ],
    lastMessageContent: 'Nitakuwa kwenye electronics zone asubuhi 📍',
    lastMessageSender: 'guide-1',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    bookingId: 'booking-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'conv-2',
    participants: [
      { userId: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, unreadCount: 0 },
      { userId: 'guide-2', name: 'Fatma Hassan', role: 'guide', avatarUrl: null, unreadCount: 1 },
    ],
    lastMessageContent: 'Tuna vitambaa vya kanga vipya! Njoo uone 🌟',
    lastMessageSender: 'guide-2',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    bookingId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'conv-3',
    participants: [
      { userId: 'demo-seeker', name: 'James K.', role: 'seeker', avatarUrl: null, unreadCount: 0 },
      { userId: 'guide-3', name: 'Asha Mohamed', role: 'guide', avatarUrl: null, unreadCount: 0 },
    ],
    lastMessageContent: 'Asante kwa kutumia Chimbo Direct! ⭐',
    lastMessageSender: 'demo-seeker',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    bookingId: 'booking-3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'conv-4',
    participants: [
      { userId: 'demo-guide', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, unreadCount: 3 },
      { userId: 'seeker-2', name: 'Amina Rashid', role: 'seeker', avatarUrl: null, unreadCount: 0 },
    ],
    lastMessageContent: 'Naomba msaada kwa spices zone kesho',
    lastMessageSender: 'seeker-2',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    bookingId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'conv-5',
    participants: [
      { userId: 'demo-guide', name: 'Mwanaildi Juma', role: 'guide', avatarUrl: null, unreadCount: 0 },
      { userId: 'seeker-3', name: 'David M.', role: 'seeker', avatarUrl: null, unreadCount: 0 },
    ],
    lastMessageContent: 'Session imekamilika! Tafadhali acha review',
    lastMessageSender: 'demo-guide',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    bookingId: 'booking-5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

// ── Demo fallback helper ──
function getDemoConversations(userId: string) {
  const conversations = demoConversations
    .filter(conv => conv.participants.some(p => p.userId === userId))
    .map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId)!;
      const myParticipant = conv.participants.find(p => p.userId === userId)!;
      return {
        id: conv.id,
        otherUser: {
          id: otherParticipant.userId,
          name: otherParticipant.name,
          role: otherParticipant.role,
          avatarUrl: otherParticipant.avatarUrl,
          isOnline: otherParticipant.role === 'guide' ? Math.random() > 0.5 : false,
        },
        lastMessage: {
          content: conv.lastMessageContent,
          senderId: conv.lastMessageSender,
          createdAt: conv.lastMessageAt,
        },
        unreadCount: myParticipant.unreadCount,
        bookingId: conv.bookingId,
        createdAt: conv.createdAt,
      };
    })
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  return conversations;
}

// GET /api/chat - List conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Extract user ID from auth cookie or query param
    const authToken = request.cookies.get('auth_token')?.value;
    const userId = (authToken ? getUserIdFromToken(authToken) : null) || userIdParam || 'demo-seeker';

    try {
      // Query DB: find all conversation participations for this user
      const participations = await db.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      role: true,
                      avatarUrl: true,
                      guideProfile: {
                        select: { currentStatus: true, isOnline: true },
                      },
                    },
                  },
                },
              },
              chatMessages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { conversation: { updatedAt: 'desc' } },
      });

      if (participations.length === 0) {
        // No DB conversations yet — fall back to demo
        return NextResponse.json({ conversations: getDemoConversations(userId) });
      }

      const conversations = participations.map(p => {
        const conv = p.conversation;
        const otherParticipant = conv.participants.find(op => op.userId !== userId);
        const otherUser = otherParticipant?.user;
        const lastMsg = conv.chatMessages[0];

        return {
          id: conv.id,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                role: otherUser.role,
                avatarUrl: otherUser.avatarUrl,
                isOnline: otherUser.guideProfile?.isOnline ?? false,
              }
            : { id: 'unknown', name: 'Unknown', role: 'seeker', avatarUrl: null, isOnline: false },
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                senderId: lastMsg.senderId,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : {
                content: conv.lastMessageContent || '',
                senderId: conv.lastMessageSender || '',
                createdAt: conv.lastMessageAt.toISOString(),
              },
          unreadCount: p.unreadCount,
          bookingId: conv.bookingId,
          createdAt: conv.createdAt.toISOString(),
        };
      });

      // Sort by lastMessage.createdAt desc
      conversations.sort(
        (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );

      return NextResponse.json({ conversations });
    } catch (dbError) {
      console.error('DB query failed, falling back to demo data:', dbError);
      return NextResponse.json({ conversations: getDemoConversations(userId) });
    }
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/chat - Create conversation or send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, message, bookingId, senderId } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'recipientId and message are required' },
        { status: 400 }
      );
    }

    // Extract sender ID from auth cookie or body
    const authToken = request.cookies.get('auth_token')?.value;
    const sender = (authToken ? getUserIdFromToken(authToken) : null) || senderId || 'demo-seeker';

    try {
      // Check if conversation already exists between these two users
      const existingParticipation = await db.conversationParticipant.findFirst({
        where: {
          userId: sender,
          conversation: {
            participants: {
              some: { userId: recipientId },
            },
          },
        },
        include: {
          conversation: {
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
          },
        },
      });

      if (existingParticipation) {
        // Add message to existing conversation
        const conv = existingParticipation.conversation;

        const newMsg = await db.chatMessage.create({
          data: {
            conversationId: conv.id,
            senderId: sender,
            messageType: 'text',
            content: message,
          },
        });

        // Update conversation's last message fields
        await db.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessageContent: message,
            lastMessageSender: sender,
            lastMessageAt: new Date(),
          },
        });

        // Increment unread count for the other participant
        await db.conversationParticipant.updateMany({
          where: {
            conversationId: conv.id,
            userId: { not: sender },
          },
          data: { unreadCount: { increment: 1 } },
        });

        const otherParticipant = conv.participants.find(p => p.userId !== sender);
        const otherUser = otherParticipant?.user;

        const conversationResponse = {
          id: conv.id,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                role: otherUser.role,
                avatarUrl: otherUser.avatarUrl,
                isOnline: otherUser.guideProfile?.isOnline ?? false,
              }
            : { id: 'unknown', name: 'Unknown', role: 'seeker', avatarUrl: null, isOnline: false },
          lastMessageContent: message,
          lastMessageSender: sender,
          lastMessageAt: new Date().toISOString(),
          bookingId: conv.bookingId,
          createdAt: conv.createdAt.toISOString(),
        };

        const messageResponse = {
          id: newMsg.id,
          conversationId: conv.id,
          senderId: sender,
          messageType: 'text',
          content: message,
          createdAt: newMsg.createdAt.toISOString(),
          isRead: false,
        };

        return NextResponse.json({ conversation: conversationResponse, message: messageResponse }, { status: 201 });
      }

      // Create new conversation
      const newConversation = await db.conversation.create({
        data: {
          bookingId: bookingId || null,
          lastMessageContent: message,
          lastMessageSender: sender,
          lastMessageAt: new Date(),
          participants: {
            create: [
              { userId: sender, unreadCount: 0 },
              { userId: recipientId, unreadCount: 1 },
            ],
          },
          chatMessages: {
            create: {
              senderId: sender,
              messageType: 'text',
              content: message,
            },
          },
        },
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

      const otherParticipant = newConversation.participants.find(p => p.userId !== sender);
      const otherUser = otherParticipant?.user;
      const createdMessage = newConversation.chatMessages?.[0];

      const conversationResponse = {
        id: newConversation.id,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              role: otherUser.role,
              avatarUrl: otherUser.avatarUrl,
              isOnline: otherUser.guideProfile?.isOnline ?? false,
            }
          : { id: 'unknown', name: 'Unknown', role: 'seeker', avatarUrl: null, isOnline: false },
        lastMessageContent: message,
        lastMessageSender: sender,
        lastMessageAt: new Date().toISOString(),
        bookingId: newConversation.bookingId,
        createdAt: newConversation.createdAt.toISOString(),
      };

      const messageResponse = {
        id: createdMessage?.id || `msg-${Date.now()}`,
        conversationId: newConversation.id,
        senderId: sender,
        messageType: 'text',
        content: message,
        createdAt: (createdMessage?.createdAt || new Date()).toISOString(),
        isRead: false,
      };

      return NextResponse.json({ conversation: conversationResponse, message: messageResponse }, { status: 201 });
    } catch (dbError) {
      console.error('DB operation failed, falling back to demo data:', dbError);

      // Demo fallback
      const existingConv = demoConversations.find(
        conv => conv.participants.some(p => p.userId === sender) &&
                conv.participants.some(p => p.userId === recipientId)
      );

      if (existingConv) {
        const newMessage = {
          id: `msg-${Date.now()}`,
          conversationId: existingConv.id,
          senderId: sender,
          messageType: 'text',
          content: message,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        existingConv.lastMessageContent = message;
        existingConv.lastMessageSender = sender;
        existingConv.lastMessageAt = new Date().toISOString();

        return NextResponse.json({ conversation: existingConv, message: newMessage }, { status: 201 });
      }

      const recipientName = recipientId === 'guide-1' ? 'Mwanaildi Juma' :
                            recipientId === 'guide-2' ? 'Fatma Hassan' :
                            recipientId === 'guide-3' ? 'Asha Mohamed' : 'User';
      const senderName = sender === 'demo-seeker' ? 'James K.' : 'Mwanaildi Juma';

      const newConversation = {
        id: `conv-${Date.now()}`,
        participants: [
          { userId: sender, name: senderName, role: sender.includes('guide') ? 'guide' : 'seeker', avatarUrl: null, unreadCount: 0 },
          { userId: recipientId, name: recipientName, role: recipientId.includes('guide') ? 'guide' : 'seeker', avatarUrl: null, unreadCount: 1 },
        ],
        lastMessageContent: message,
        lastMessageSender: sender,
        lastMessageAt: new Date().toISOString(),
        bookingId: bookingId || null,
        createdAt: new Date().toISOString(),
      };

      const newMessage = {
        id: `msg-${Date.now()}`,
        conversationId: newConversation.id,
        senderId: sender,
        messageType: 'text',
        content: message,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      return NextResponse.json({ conversation: newConversation, message: newMessage }, { status: 201 });
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
