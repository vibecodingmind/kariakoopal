import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const isRecording = searchParams.get('isRecording');
    const includeMilestones = searchParams.get('includeMilestones') === 'true';
    const includeNotes = searchParams.get('includeNotes') === 'true';

    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (isRecording !== null && isRecording !== undefined) where.isRecording = isRecording === 'true';

    const recordings = await db.sessionRecording.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: { id: true, guideId: true, seekerId: true, status: true, startedAt: true, endedAt: true },
        },
      },
    });

    let milestones: unknown[] = [];
    let notes: unknown[] = [];

    if (sessionId && includeMilestones) {
      milestones = await db.sessionMilestone.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });
    }

    if (sessionId && includeNotes) {
      notes = await db.sessionNote.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });
    }

    // Generate session summary if sessionId provided
    let summary = null;
    if (sessionId) {
      const sessionMilestones = milestones as { type: string; label: string; location?: string }[];
      const zonesVisited = sessionMilestones.filter(m => m.type === 'zone_change').map(m => m.label);
      const vendorsVisited = sessionMilestones.filter(m => m.type === 'vendor_visit').map(m => m.label);
      const sessionNotes = notes as { text: string }[];

      summary = {
        totalMilestones: sessionMilestones.length,
        zonesVisited: [...new Set(zonesVisited)],
        vendorsVisited,
        totalNotes: sessionNotes.length,
        hasMeetup: sessionMilestones.some(m => m.type === 'meetup'),
        hasEnd: sessionMilestones.some(m => m.type === 'end'),
      };
    }

    return NextResponse.json({
      items: recordings,
      milestones,
      notes,
      summary,
    });
  } catch (error) {
    console.error('Get session recordings error:', error);
    return NextResponse.json({ error: 'Failed to fetch session recordings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isRecording, guideConsent, seekerConsent, duration, storageUrl, milestone, note } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Add milestone if provided
    if (milestone) {
      const created = await db.sessionMilestone.create({
        data: {
          sessionId,
          type: milestone.type || 'note',
          label: milestone.label || '',
          location: milestone.location || null,
          timestamp: milestone.timestamp || new Date().toISOString(),
        },
      });
      return NextResponse.json({ item: created, type: 'milestone' }, { status: 201 });
    }

    // Add note if provided
    if (note) {
      const created = await db.sessionNote.create({
        data: {
          sessionId,
          text: note.text || '',
          type: note.type || 'note',
          timestamp: note.timestamp || new Date().toISOString(),
        },
      });
      return NextResponse.json({ item: created, type: 'note' }, { status: 201 });
    }

    // Create or update recording
    const recording = await db.sessionRecording.create({
      data: {
        sessionId,
        isRecording: isRecording ?? false,
        guideConsent: guideConsent ?? false,
        seekerConsent: seekerConsent ?? false,
        duration: duration ?? 0,
        storageUrl: storageUrl ?? '',
      },
    });

    return NextResponse.json({ item: recording, type: 'recording' }, { status: 201 });
  } catch (error) {
    console.error('Create session recording error:', error);
    return NextResponse.json({ error: 'Failed to create session recording' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { recordingId, isRecording, duration } = body;

    if (!recordingId) {
      return NextResponse.json({ error: 'recordingId is required' }, { status: 400 });
    }

    const recording = await db.sessionRecording.update({
      where: { id: recordingId },
      data: {
        ...(isRecording !== undefined && { isRecording }),
        ...(duration !== undefined && { duration }),
      },
    });

    return NextResponse.json({ item: recording });
  } catch (error) {
    console.error('Update session recording error:', error);
    return NextResponse.json({ error: 'Failed to update session recording' }, { status: 500 });
  }
}
