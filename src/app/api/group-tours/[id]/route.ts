import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tour = await db.groupTour.findUnique({ where: { id } });
    if (!tour) {
      return NextResponse.json({ error: 'Group tour not found' }, { status: 404 });
    }
    return NextResponse.json({
      item: {
        ...tour,
        participantIds: JSON.parse(tour.participantIds),
      },
    });
  } catch (error) {
    console.error('Get group tour error:', error);
    return NextResponse.json({ error: 'Failed to fetch group tour' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId } = body;

    // Fetch current tour
    const tour = await db.groupTour.findUnique({ where: { id } });
    if (!tour) {
      return NextResponse.json({ error: 'Group tour not found' }, { status: 404 });
    }

    const participants: string[] = JSON.parse(tour.participantIds);

    if (action === 'join') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for join action' }, { status: 400 });
      }
      if (participants.includes(userId)) {
        return NextResponse.json({ error: 'User already joined' }, { status: 400 });
      }
      if (tour.currentCount >= tour.maxParticipants) {
        return NextResponse.json({ error: 'Tour is full' }, { status: 400 });
      }

      const newParticipants = [...participants, userId];
      const newCount = tour.currentCount + 1;
      const newStatus = newCount >= tour.maxParticipants ? 'full' : tour.status;

      const updated = await db.groupTour.update({
        where: { id },
        data: {
          participantIds: JSON.stringify(newParticipants),
          currentCount: newCount,
          status: newStatus,
        },
      });

      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
        },
      });
    }

    if (action === 'leave') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for leave action' }, { status: 400 });
      }
      if (!participants.includes(userId)) {
        return NextResponse.json({ error: 'User is not in this tour' }, { status: 400 });
      }

      const newParticipants = participants.filter((p) => p !== userId);
      const newCount = Math.max(0, tour.currentCount - 1);
      const newStatus = tour.status === 'full' ? 'open' : tour.status;

      const updated = await db.groupTour.update({
        where: { id },
        data: {
          participantIds: JSON.stringify(newParticipants),
          currentCount: newCount,
          status: newStatus,
        },
      });

      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
        },
      });
    }

    if (action === 'cancel') {
      const updated = await db.groupTour.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
        },
      });
    }

    if (action === 'complete') {
      const updated = await db.groupTour.update({
        where: { id },
        data: { status: 'completed' },
      });
      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use join, leave, cancel, or complete' }, { status: 400 });
  } catch (error) {
    console.error('Update group tour error:', error);
    return NextResponse.json({ error: 'Failed to update group tour' }, { status: 500 });
  }
}
