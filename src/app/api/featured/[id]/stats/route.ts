import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/featured/[id]/stats — increment impressions or clicks
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type } = body; // 'impressions' or 'clicks'

    if (!['impressions', 'clicks'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be impressions or clicks' },
        { status: 400 }
      );
    }

    const listing = await db.featuredListing.update({
      where: { id },
      data: { [type]: { increment: 1 } },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Featured stats POST error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
