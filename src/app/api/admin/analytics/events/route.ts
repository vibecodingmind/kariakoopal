import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (type) where.eventType = type;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.analyticsEvent.count({ where }),
    ]);

    return NextResponse.json({ events, total, page, limit });
  } catch (error) {
    console.error('Analytics events GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, userId, metadata, value, entityType, entityId } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    const event = await db.analyticsEvent.create({
      data: {
        eventType,
        userId: userId || null,
        metadata: JSON.stringify(metadata || {}),
        value: value || 0,
        entity_type: entityType || null,
        entityId: entityId || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Analytics events POST error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
