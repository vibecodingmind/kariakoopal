import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const zoneId = searchParams.get('zoneId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (zoneId) where.zoneId = zoneId;

    const matches = await db.buddyMatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: matches });
  } catch (error) {
    console.error('Get buddy matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch buddy matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seeker1Id, seeker2Id, zoneId, timeSlot, guideId } = body;

    if (!seeker1Id || !seeker2Id || !zoneId) {
      return NextResponse.json({ error: 'seeker1Id, seeker2Id, and zoneId are required' }, { status: 400 });
    }

    const match = await db.buddyMatch.create({
      data: {
        seeker1Id,
        seeker2Id,
        zoneId,
        timeSlot: timeSlot ?? '',
        guideId: guideId ?? null,
      },
    });

    return NextResponse.json({ item: match }, { status: 201 });
  } catch (error) {
    console.error('Create buddy match error:', error);
    return NextResponse.json({ error: 'Failed to create buddy match' }, { status: 500 });
  }
}
