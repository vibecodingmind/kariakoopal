import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const disputedSessions = await db.session.findMany({
      where: { disputeFlag: true },
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        seeker: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        request: {
          select: { id: true, description: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ disputes: disputedSessions }, { status: 200 });
  } catch (error) {
    console.error('Get disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, resolution, reason } = await request.json();

    if (!sessionId || !resolution) {
      return NextResponse.json(
        { error: 'sessionId and resolution (release/refund) are required' },
        { status: 400 }
      );
    }

    if (!['release', 'refund'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Resolution must be "release" or "refund"' },
        { status: 400 }
      );
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        seeker: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.disputeFlag) {
      return NextResponse.json(
        { error: 'Session does not have an active dispute' },
        { status: 400 }
      );
    }

    const escrowStatus = resolution === 'release' ? 'released' : 'refunded';

    const updated = await db.session.update({
      where: { id: sessionId },
      data: {
        escrowStatus,
        disputeFlag: false,
        completedAt: new Date(),
      },
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        seeker: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        request: {
          select: { id: true, description: true },
        },
      },
    });

    // If releasing escrow, create a payout for the guide
    if (resolution === 'release') {
      const guideAmount = session.amount - session.platformFee;
      if (guideAmount > 0) {
        await db.payout.create({
          data: {
            guideId: session.guideId,
            amount: guideAmount,
            status: 'pending',
            mobileMoneyNumber: '',
          },
        });
      }
    }

    // Update guide status back to online
    await db.guideProfile.updateMany({
      where: { userId: session.guideId },
      data: { currentStatus: 'online' },
    });

    // Update request status
    await db.request.update({
      where: { id: session.requestId },
      data: { status: 'completed' },
    });

    return NextResponse.json(
      {
        session: updated,
        resolution,
        reason: reason || null,
        escrowStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
  }
}
