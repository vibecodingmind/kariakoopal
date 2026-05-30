import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const messages = await db.message.findMany({
      where: { sessionId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, senderId, content, translatedContent } = await request.json();

    if (!sessionId || !senderId || !content) {
      return NextResponse.json(
        { error: 'sessionId, senderId, and content are required' },
        { status: 400 }
      );
    }

    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const message = await db.message.create({
      data: {
        sessionId,
        senderId,
        content,
        translatedContent: translatedContent || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
