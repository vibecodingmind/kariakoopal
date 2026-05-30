import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (type) where.type = type;

    const waypoints = await db.navWaypoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: waypoints });
  } catch (error) {
    console.error('Get nav waypoints error:', error);
    return NextResponse.json({ error: 'Failed to fetch navigation waypoints' }, { status: 500 });
  }
}
