import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const isRecording = searchParams.get('isRecording');

    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (isRecording !== null && isRecording !== undefined) where.isRecording = isRecording === 'true';

    const recordings = await db.sessionRecording.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: recordings });
  } catch (error) {
    console.error('Get session recordings error:', error);
    return NextResponse.json({ error: 'Failed to fetch session recordings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isRecording, guideConsent, seekerConsent, duration, storageUrl } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const recording = await db.sessionRecording.create({
      data: {
        sessionId,
        isRecording: isRecording ?? false,
        guideConsent: guideConsent ?? false,
        seekerConsent: seekerConsent ?? false,
        duration: duration ?? 0,
        storageUrl: storageUrl ?? '',
      },
    });

    return NextResponse.json({ item: recording }, { status: 201 });
  } catch (error) {
    console.error('Create session recording error:', error);
    return NextResponse.json({ error: 'Failed to create session recording' }, { status: 500 });
  }
}
