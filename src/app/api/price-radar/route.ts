import { NextRequest, NextResponse } from 'next/server';
import { DEMO_PRICES, DEMO_ZONES, getDbOrNull } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const category = searchParams.get('category');

    const db = getDbOrNull();
    if (!db) {
      let entries = DEMO_PRICES.map(p => ({
        ...p,
        zone: DEMO_ZONES.find(z => z.id === p.zoneId) || null,
      }));
      if (zoneId) entries = entries.filter(e => e.zoneId === zoneId);
      if (category) entries = entries.filter(e => e.category === category);
      return NextResponse.json({ entries }, { status: 200 });
    }

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (category) where.category = category;

    const entries = await db.priceRadar.findMany({
      where,
      include: {
        zone: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (entries.length === 0) {
      return NextResponse.json({
        entries: DEMO_PRICES.map(p => ({
          ...p,
          zone: DEMO_ZONES.find(z => z.id === p.zoneId) || null,
        })),
      }, { status: 200 });
    }

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Get price radar error:', error);
    return NextResponse.json({
      entries: DEMO_PRICES.map(p => ({
        ...p,
        zone: DEMO_ZONES.find(z => z.id === p.zoneId) || null,
      })),
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category, zoneId, priceMin, priceMax, updatedBy } = await request.json();

    if (!category || !zoneId || priceMin === undefined || priceMax === undefined) {
      return NextResponse.json(
        { error: 'category, zoneId, priceMin, and priceMax are required' },
        { status: 400 }
      );
    }

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const zone = await db.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const entry = await db.priceRadar.create({
      data: {
        category,
        zoneId,
        priceMin,
        priceMax,
        updatedBy: updatedBy || 'admin',
      },
      include: {
        zone: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Create price radar error:', error);
    return NextResponse.json({ error: 'Failed to create price radar entry' }, { status: 500 });
  }
}
