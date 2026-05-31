import { NextRequest, NextResponse } from 'next/server';
import { DEMO_ZONES, DEMO_VENDORS, DEMO_PRICES, getDbOrNull } from '@/lib/demo-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDbOrNull();
    if (!db) {
      const zone = DEMO_ZONES.find(z => z.id === id || z.id === `zone-${id}`);
      if (!zone) {
        return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
      }
      const zoneVendors = DEMO_VENDORS.filter(v => v.zoneId === zone.id);
      const zonePrices = DEMO_PRICES.filter(p => p.zoneId === zone.id);
      return NextResponse.json({
        zone: {
          ...zone,
          vendors: zoneVendors,
          priceRadar: zonePrices,
          requests: [],
          _count: { vendors: zoneVendors.length, priceRadar: zonePrices.length, requests: 0 },
        },
      }, { status: 200 });
    }

    const zone = await db.zone.findUnique({
      where: { id },
      include: {
        vendors: true,
        priceRadar: true,
        requests: {
          include: {
            seeker: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { vendors: true, priceRadar: true, requests: true },
        },
      },
    });

    if (!zone) {
      // Fallback to demo
      const demoZone = DEMO_ZONES.find(z => z.id === id || z.id === `zone-${id}`);
      if (demoZone) {
        const zoneVendors = DEMO_VENDORS.filter(v => v.zoneId === demoZone.id);
        const zonePrices = DEMO_PRICES.filter(p => p.zoneId === demoZone.id);
        return NextResponse.json({
          zone: {
            ...demoZone,
            vendors: zoneVendors,
            priceRadar: zonePrices,
            requests: [],
            _count: { vendors: zoneVendors.length, priceRadar: zonePrices.length, requests: 0 },
          },
        }, { status: 200 });
      }
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({ zone }, { status: 200 });
  } catch (error) {
    console.error('Get zone error:', error);
    return NextResponse.json({ error: 'Failed to fetch zone' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, nameSw, description, geoBounds, color } = await request.json();

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await db.zone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const updated = await db.zone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameSw !== undefined && { nameSw }),
        ...(description !== undefined && { description }),
        ...(geoBounds !== undefined && { geoBounds: JSON.stringify(geoBounds) }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ zone: updated }, { status: 200 });
  } catch (error) {
    console.error('Update zone error:', error);
    return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await db.zone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    await db.zone.delete({ where: { id } });

    return NextResponse.json({ message: 'Zone deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete zone error:', error);
    return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
  }
}
