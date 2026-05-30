import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await db.session.findUnique({
      where: { id },
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true, languagePref: true },
        },
        seeker: {
          select: { id: true, name: true, phone: true, avatarUrl: true, languagePref: true },
        },
        request: {
          select: { id: true, description: true, status: true, budget: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Complete session
    if (body.action === 'complete') {
      updateData.completedAt = new Date();
      updateData.escrowStatus = 'released';
      updateData.seekerConfirmed = true;
      updateData.guideConfirmed = true;
    }

    // Rate session
    if (body.action === 'rate') {
      if (body.ratingSeeker !== undefined) updateData.ratingSeeker = body.ratingSeeker;
      if (body.ratingGuide !== undefined) updateData.ratingGuide = body.ratingGuide;
      if (body.reviewSeeker !== undefined) updateData.reviewSeeker = body.reviewSeeker;
      if (body.reviewGuide !== undefined) updateData.reviewGuide = body.reviewGuide;
    }

    // Dispute
    if (body.action === 'dispute') {
      updateData.disputeFlag = true;
      updateData.disputeReason = body.disputeReason || null;
      updateData.escrowStatus = 'disputed';
    }

    // Emergency
    if (body.action === 'emergency') {
      updateData.emergencyFlag = true;
    }

    // Confirm
    if (body.action === 'confirm') {
      if (body.confirmAs === 'seeker') updateData.seekerConfirmed = true;
      if (body.confirmAs === 'guide') updateData.guideConfirmed = true;
    }

    const updated = await db.session.update({
      where: { id },
      data: updateData,
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        seeker: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        request: {
          select: { id: true, description: true, status: true },
        },
      },
    });

    // If session completed, update guide profile stats
    if (body.action === 'complete') {
      const guideProfile = await db.guideProfile.findFirst({
        where: { userId: existing.guideId },
      });
      if (guideProfile) {
        const totalSessions = guideProfile.totalSessions + 1;
        const currentRating = guideProfile.avgRating * guideProfile.totalSessions;
        const newRating = body.ratingGuide
          ? (currentRating + body.ratingGuide) / totalSessions
          : guideProfile.avgRating;

        await db.guideProfile.update({
          where: { id: guideProfile.id },
          data: {
            totalSessions,
            avgRating: Math.round(newRating * 10) / 10,
            currentStatus: 'online',
          },
        });
      }

      // Update request status
      await db.request.update({
        where: { id: existing.requestId },
        data: { status: 'completed' },
      });
    }

    return NextResponse.json({ session: updated }, { status: 200 });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
