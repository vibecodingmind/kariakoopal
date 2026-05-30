import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (guideId) where.guideId = guideId;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';

    const deals = await db.packageDeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: deals });
  } catch (error) {
    console.error('Get package deals error:', error);
    return NextResponse.json({ error: 'Failed to fetch package deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guideId, title, description, duration, zoneIds, price, includesDelivery } = body;

    if (!guideId || !title) {
      return NextResponse.json({ error: 'guideId and title are required' }, { status: 400 });
    }

    const deal = await db.packageDeal.create({
      data: {
        guideId,
        title,
        description: description ?? '',
        duration: duration ?? 2,
        zoneIds: zoneIds ?? '[]',
        price: price ?? 0,
        includesDelivery: includesDelivery ?? false,
      },
    });

    return NextResponse.json({ item: deal }, { status: 201 });
  } catch (error) {
    console.error('Create package deal error:', error);
    return NextResponse.json({ error: 'Failed to create package deal' }, { status: 500 });
  }
}
