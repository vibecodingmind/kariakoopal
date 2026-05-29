import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const category = searchParams.get('category');
    const approved = searchParams.get('approved');

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (category) where.categories = { contains: category };
    if (approved !== null && approved !== undefined) where.approved = approved === 'true';

    const vendors = await db.vendor.findMany({
      where,
      include: {
        zone: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vendors }, { status: 200 });
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      zoneId,
      categories,
      stallNumber,
      contact,
      geoLat,
      geoLng,
      approved,
      recommendations,
      openHours,
    } = await request.json();

    if (!name || !zoneId) {
      return NextResponse.json(
        { error: 'name and zoneId are required' },
        { status: 400 }
      );
    }

    const zone = await db.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const vendor = await db.vendor.create({
      data: {
        name,
        zoneId,
        categories: JSON.stringify(categories || []),
        stallNumber: stallNumber || '',
        contact: contact || '',
        geoLat: geoLat || -6.8264,
        geoLng: geoLng || 39.2695,
        approved: approved ?? false,
        recommendations: recommendations || 0,
        openHours: openHours || '8:00-18:00',
      },
      include: {
        zone: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    console.error('Create vendor error:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
