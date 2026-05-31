import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/featured/[id] — get single featured listing with analytics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await db.featuredListing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json({ error: 'Featured listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      listing,
      analytics: {
        impressions: listing.impressions,
        clicks: listing.clicks,
        ctr: listing.impressions > 0 ? ((listing.clicks / listing.impressions) * 100).toFixed(2) : '0.00',
      },
    });
  } catch (error) {
    console.error('Featured [id] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured listing' }, { status: 500 });
  }
}

// PATCH /api/featured/[id] — pause/resume/cancel a featured listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be active, paused, or cancelled' },
        { status: 400 }
      );
    }

    const listing = await db.featuredListing.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Featured [id] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update featured listing' }, { status: 500 });
  }
}
