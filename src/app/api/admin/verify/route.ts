import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { guideId, action, reason } = await request.json();

    if (!guideId || !action) {
      return NextResponse.json(
        { error: 'guideId and action (approve/reject) are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const guideProfile = await db.guideProfile.findFirst({
      where: { userId: guideId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        badges: true,
      },
    });

    if (!guideProfile) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'active' : 'suspended';

    const updated = await db.guideProfile.update({
      where: { id: guideProfile.id },
      data: { status: newStatus },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        badges: true,
      },
    });

    // If approved, optionally award a "verified_elite" badge
    if (action === 'approve') {
      const existingBadge = await db.badge.findFirst({
        where: { guideId, badgeType: 'verified_elite' },
      });
      if (!existingBadge) {
        await db.badge.create({
          data: { guideId, badgeType: 'verified_elite' },
        });
      }
    }

    return NextResponse.json(
      {
        guide: updated,
        action,
        reason: reason || null,
        newStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ error: 'Failed to verify guide' }, { status: 500 });
  }
}
