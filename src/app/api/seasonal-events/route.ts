import { NextResponse } from 'next/server';
import { DEMO_EVENTS, getDbOrNull } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const db = getDbOrNull();
    if (!db) {
      let events = DEMO_EVENTS;
      if (type) events = events.filter(e => e.type === type);
      return NextResponse.json({ items: events });
    }

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const events = await db.seasonalEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    if (events.length === 0) {
      return NextResponse.json({ items: DEMO_EVENTS });
    }

    return NextResponse.json({ items: events });
  } catch (error) {
    console.error('Get seasonal events error:', error);
    return NextResponse.json({ items: DEMO_EVENTS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, titleSw, description, type, startDate, endDate, affectedZones, insiderTip, insiderTipSw } = body;

    if (!title || !startDate) {
      return NextResponse.json({ error: 'title and startDate are required' }, { status: 400 });
    }

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const event = await db.seasonalEvent.create({
      data: {
        title,
        titleSw: titleSw ?? '',
        description: description ?? '',
        type: type ?? 'cultural',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        affectedZones: affectedZones ?? '[]',
        insiderTip: insiderTip ?? '',
        insiderTipSw: insiderTipSw ?? '',
      },
    });

    return NextResponse.json({ item: event }, { status: 201 });
  } catch (error) {
    console.error('Create seasonal event error:', error);
    return NextResponse.json({ error: 'Failed to create seasonal event' }, { status: 500 });
  }
}
