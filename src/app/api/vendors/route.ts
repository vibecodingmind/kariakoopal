import { NextRequest, NextResponse } from 'next/server';
import { DEMO_VENDORS, DEMO_ZONES, db } from '@/lib/demo-data';

function getDemoVendors(zoneId?: string | null, category?: string | null, approved?: string | null) {
  let vendors = DEMO_VENDORS.map(v => ({
    ...v,
    zone: DEMO_ZONES.find(z => z.id === v.zoneId) || null,
  }));
  if (zoneId) vendors = vendors.filter(v => v.zoneId === zoneId);
  if (category) vendors = vendors.filter(v => v.categories.includes(category));
  if (approved !== null && approved !== undefined) vendors = vendors.filter(v => v.approved === (approved === 'true'));
  return vendors;
}

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

    if (vendors.length === 0) {
      return NextResponse.json({ vendors: getDemoVendors(zoneId, category, approved) }, { status: 200 });
    }

    return NextResponse.json({ vendors }, { status: 200 });
  } catch (error) {
    console.error('Get vendors error:', error);
    const { searchParams } = new URL(request.url);
    return NextResponse.json({ vendors: getDemoVendors(searchParams.get('zoneId'), searchParams.get('category'), searchParams.get('approved')) }, { status: 200 });
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
