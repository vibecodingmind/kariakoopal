import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/featured — list active featured listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'active';

    const where: any = { status };
    if (zoneId) where.zoneId = zoneId;
    if (type) where.type = type;

    const listings = await db.featuredListing.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Featured GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured listings' }, { status: 500 });
  }
}

// POST /api/featured — create a featured listing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guideId, type, targetId, zoneId, startDate, endDate } = body;

    if (!guideId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'guideId, type, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Calculate cost based on duration (days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = type === 'profile' ? 5000 : type === 'package' ? 3000 : 4000;
    const cost = days * dailyRate;

    // Get max position
    const maxPos = await db.featuredListing.findFirst({
      where: { status: 'active' },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const listing = await db.featuredListing.create({
      data: {
        guideId,
        type: type || 'profile',
        targetId: targetId || '',
        zoneId: zoneId || '',
        position: (maxPos?.position || 0) + 1,
        startDate: start,
        endDate: end,
        cost,
        status: 'active',
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Featured POST error:', error);
    return NextResponse.json({ error: 'Failed to create featured listing' }, { status: 500 });
  }
}
