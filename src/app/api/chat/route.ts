import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Demo conversations ──
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
    lastMessageContent: 'Asante kwa kutumia Kariako Guide! ⭐',
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

// GET /api/chat - List conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-seeker';

    // In demo mode, filter demo conversations
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

    return NextResponse.json({ conversations });
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

    const sender = senderId || 'demo-seeker';

    // In demo mode, create a new conversation or return existing
    const existingConv = demoConversations.find(
      conv => conv.participants.some(p => p.userId === sender) &&
              conv.participants.some(p => p.userId === recipientId)
    );

    if (existingConv) {
      // Add message to existing conversation
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

    // Create new conversation
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
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
