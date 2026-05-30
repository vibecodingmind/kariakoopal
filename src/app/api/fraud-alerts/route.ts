import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const alertType = searchParams.get('alertType');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (alertType) where.alertType = alertType;

    const alerts = await db.fraudAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: alerts });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    return NextResponse.json({ error: 'Failed to fetch fraud alerts' }, { status: 500 });
  }
}
