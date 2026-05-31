import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDefaultMilestones, getSessionMilestones } from '@/lib/smart-escrow';

// GET - Get milestones for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const data = await getSessionMilestones(sessionId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Escrow milestones GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

// POST - Create milestones for a session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if milestones already exist
    const existing = await db.escrowMilestone.findMany({
      where: { sessionId },
    });

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Milestones already exist for this session' }, { status: 400 });
    }

    const result = await createDefaultMilestones(sessionId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Escrow milestones POST error:', error);
    return NextResponse.json({ error: 'Failed to create milestones' }, { status: 500 });
  }
}

// PATCH - Verify or release a milestone
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { milestoneId, action, userId, userRole, lat, lng } = body;

    if (!milestoneId || !action || !userId) {
      return NextResponse.json({ error: 'Milestone ID, action, and user ID are required' }, { status: 400 });
    }

    if (!['verify', 'release'].includes(action)) {
      return NextResponse.json({ error: 'Action must be verify or release' }, { status: 400 });
    }

    if (action === 'verify') {
      const { verifyMilestone } = await import('@/lib/smart-escrow');
      const result = await verifyMilestone(milestoneId, userId, userRole || 'seeker', lat, lng);
      return NextResponse.json(result);
    }

    if (action === 'release') {
      const { releaseMilestone } = await import('@/lib/smart-escrow');
      const result = await releaseMilestone(milestoneId, userId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process milestone';
    console.error('Escrow milestones PATCH error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
