import { NextRequest, NextResponse } from 'next/server';
import { verifyMilestone } from '@/lib/smart-escrow';

// POST - Verify a milestone (with GPS check if applicable)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, userRole, lat, lng } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await verifyMilestone(
      id,
      userId,
      userRole || 'seeker',
      lat,
      lng
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify milestone';
    console.error('Milestone verify error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
