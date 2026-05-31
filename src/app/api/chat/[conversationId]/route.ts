import { NextRequest, NextResponse } from 'next/server';

// ── Demo messages per conversation ──
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
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: 'demo-seeker',
      senderName: 'James K.',
      messageType: 'text',
      content: 'Hujambo! Nafahamu kutaka electronics zone kesho asubuhi',
      translatedContent: 'Hello! I want to visit the electronics zone tomorrow morning',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'msg-1-2',
      conversationId: 'conv-1',
      senderId: 'guide-1',
      senderName: 'Mwanaildi Juma',
      messageType: 'text',
      content: 'Karibu! Mimiiko tayari. Unahitaji nini hasa?',
      translatedContent: 'Welcome! I am ready. What exactly do you need?',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
    {
      id: 'msg-1-3',
      conversationId: 'conv-1',
      senderId: 'demo-seeker',
      senderName: 'James K.',
      messageType: 'text',
      content: 'Ninahitaji Samsung Galaxy A54. Bei gani?',
      translatedContent: 'I need a Samsung Galaxy A54. What is the price?',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'msg-1-4',
      conversationId: 'conv-1',
      senderId: 'guide-1',
      senderName: 'Mwanaildi Juma',
      messageType: 'location',
      content: 'Tutakutana hapa - Electronics Zone, Block C',
      latitude: -6.8264,
      longitude: 39.2695,
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'msg-1-5',
      conversationId: 'conv-1',
      senderId: 'guide-1',
      senderName: 'Mwanaildi Juma',
      messageType: 'system',
      content: 'Booking confirmed for Electronics Zone tour',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'msg-1-6',
      conversationId: 'conv-1',
      senderId: 'guide-1',
      senderName: 'Mwanaildi Juma',
      messageType: 'text',
      content: 'Nitakuwa kwenye electronics zone asubuhi 📍',
      translatedContent: 'I will be at the electronics zone in the morning',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'msg-1-7',
      conversationId: 'conv-1',
      senderId: 'guide-1',
      senderName: 'Mwanaildi Juma',
      messageType: 'text',
      content: 'Nina connections nzuri huko, nitakupata bei nzuri 💰',
      translatedContent: 'I have good connections there, I will get you a good price',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'demo-seeker',
      senderName: 'James K.',
      messageType: 'text',
      content: 'Habari Fatma! Una vitambaa vya kanga?',
      translatedContent: 'Hi Fatma! Do you have kanga fabrics?',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'msg-2-2',
      conversationId: 'conv-2',
      senderId: 'guide-2',
      senderName: 'Fatma Hassan',
      messageType: 'text',
      content: 'Ndio! Tuna aina nyingi za kanga na kitenge 🌺',
      translatedContent: 'Yes! We have many types of kanga and kitenge',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    },
    {
      id: 'msg-2-3',
      conversationId: 'conv-2',
      senderId: 'guide-2',
      senderName: 'Fatma Hassan',
      messageType: 'text',
      content: 'Tuna vitambaa vya kanga vipya! Njoo uone 🌟',
      translatedContent: 'We have new kanga fabrics! Come and see',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderId: 'guide-3',
      senderName: 'Asha Mohamed',
      messageType: 'text',
      content: 'Asante kwa kutembelea nami! Umeipata bei nzuri?',
      translatedContent: 'Thanks for visiting with me! Did you get a good price?',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'msg-3-2',
      conversationId: 'conv-3',
      senderId: 'demo-seeker',
      senderName: 'James K.',
      messageType: 'text',
      content: 'Asante kwa kutumia Kariako Guide! ⭐',
      translatedContent: 'Thanks for using Kariako Guide!',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'msg-3-3',
      conversationId: 'conv-3',
      senderId: 'guide-3',
      senderName: 'Asha Mohamed',
      messageType: 'system',
      content: 'Session completed. Please leave a review!',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
    },
  ],
  'conv-4': [
    {
      id: 'msg-4-1',
      conversationId: 'conv-4',
      senderId: 'seeker-2',
      senderName: 'Amina Rashid',
      messageType: 'text',
      content: 'Hujambo, naomba msaada kwa spices zone',
      translatedContent: 'Hello, I need help with the spices zone',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'msg-4-2',
      conversationId: 'conv-4',
      senderId: 'demo-guide',
      senderName: 'Mwanaildi Juma',
      messageType: 'text',
      content: 'Karibu! Spices zone ni eneo langu la taaluma 🌶️',
      translatedContent: 'Welcome! The spices zone is my area of expertise',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'msg-4-3',
      conversationId: 'conv-4',
      senderId: 'seeker-2',
      senderName: 'Amina Rashid',
      messageType: 'text',
      content: 'Naomba msaada kwa spices zone kesho',
      translatedContent: 'I need help with the spices zone tomorrow',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ],
  'conv-5': [
    {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      senderId: 'demo-guide',
      senderName: 'Mwanaildi Juma',
      messageType: 'text',
      content: 'Tumemaliza ziada! Umepata vitu vyote ulivyoomba',
      translatedContent: 'We have finished the tour! You got everything you asked for',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    {
      id: 'msg-5-2',
      conversationId: 'conv-5',
      senderId: 'demo-guide',
      senderName: 'Mwanaildi Juma',
      messageType: 'system',
      content: 'Session imekamilika! Tafadhali acha review',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
  ],
};

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
    const userId = searchParams.get('userId') || 'demo-seeker';

    const messages = demoMessages[conversationId] || [];

    // Simulate cursor-based pagination
    let filtered = messages;
    if (cursor) {
      const cursorIdx = messages.findIndex(m => m.id === cursor);
      if (cursorIdx > 0) {
        filtered = messages.slice(0, cursorIdx);
      }
    }

    // Limit results
    const limited = filtered.slice(-limit);
    const hasMore = filtered.length > limit;
    const nextCursor = hasMore ? limited[0]?.id : null;

    // Mark messages as read for current user
    const unreadCount = messages.filter(m => !m.isRead && m.senderId !== userId).length;

    // Conversation info
    const conversationInfo = {
      id: conversationId,
      otherUser: getOtherUser(conversationId, userId),
      bookingId: conversationId === 'conv-1' ? 'booking-1' : conversationId === 'conv-3' ? 'booking-3' : conversationId === 'conv-5' ? 'booking-5' : null,
    };

    return NextResponse.json({
      messages: limited,
      conversation: conversationInfo,
      unreadCount,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
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

    const sender = senderId || 'demo-seeker';
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

    // Add to demo messages
    if (!demoMessages[conversationId]) {
      demoMessages[conversationId] = [];
    }
    demoMessages[conversationId].push(newMessage as typeof demoMessages[string][number]);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Helper to get other user info for a conversation
function getOtherUser(conversationId: string, userId: string) {
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
