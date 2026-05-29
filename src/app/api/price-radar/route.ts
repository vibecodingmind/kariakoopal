import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const category = searchParams.get('category');

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

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Get price radar error:', error);
    return NextResponse.json({ error: 'Failed to fetch price radar entries' }, { status: 500 });
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
