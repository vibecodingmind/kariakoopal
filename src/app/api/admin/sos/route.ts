import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all active SOS events for admin monitoring
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [events, totalCount] = await Promise.all([
      db.sOSEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.sOSEvent.count({ where }),
    ]);

    // Enrich with user data
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const user = await db.user.findUnique({
          where: { id: event.userId },
          select: { id: true, name: true, phone: true, role: true },
        });

        let session = null;
        if (event.sessionId) {
          session = await db.session.findUnique({
            where: { id: event.sessionId },
            select: {
              id: true,
              guideId: true,
              seekerId: true,
              escrowStatus: true,
              guide: { select: { id: true, name: true, phone: true } },
              seeker: { select: { id: true, name: true, phone: true } },
            },
          });
        }

        return {
          ...event,
          contactsNotified: JSON.parse(event.contactsNotified || '[]'),
          user,
          session,
        };
      })
    );

    const activeStats = await db.sOSEvent.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      where: { status: 'active' },
    });

    return NextResponse.json({
      events: enrichedEvents,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats: activeStats,
    });
  } catch (error) {
    console.error('Admin SOS GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SOS events' }, { status: 500 });
  }
}
