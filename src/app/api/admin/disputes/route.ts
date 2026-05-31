import { NextRequest, NextResponse } from 'next/server';
import { getDbOrNull } from '@/lib/demo-data';

const DEMO_DISPUTES = [
  {
    id: 'disp1',
    requestId: 'req1',
    guideId: 'demo-guide-1',
    seekerId: 'demo-seeker-1',
    sessionCode: 'KG-2026-001',
    startedAt: '2026-05-28T10:00:00.000Z',
    completedAt: null,
    escrowStatus: 'held',
    amount: 25000,
    platformFee: 2500,
    disputeFlag: true,
    disputeReason: 'Guide did not show up on time',
    emergencyFlag: false,
    seekerConfirmed: false,
    guideConfirmed: false,
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-30T14:00:00.000Z',
    guide: { id: 'demo-guide-1', name: 'Hamisi Juma', phone: '+255712000001', avatarUrl: null },
    seeker: { id: 'demo-seeker-1', name: 'Sarah Johnson', phone: '+14155550001', avatarUrl: null },
    request: { id: 'req1', description: 'Need guide for electronics shopping - looking for phone deals' },
    messages: [],
  },
  {
    id: 'disp2',
    requestId: 'req2',
    guideId: 'demo-guide-2',
    seekerId: 'demo-seeker-1',
    sessionCode: 'KG-2026-002',
    startedAt: '2026-05-29T08:00:00.000Z',
    completedAt: null,
    escrowStatus: 'held',
    amount: 35000,
    platformFee: 3500,
    disputeFlag: true,
    disputeReason: 'Price charged was higher than quoted',
    emergencyFlag: false,
    seekerConfirmed: false,
    guideConfirmed: false,
    createdAt: '2026-05-29T08:00:00.000Z',
    updatedAt: '2026-05-30T16:00:00.000Z',
    guide: { id: 'demo-guide-2', name: 'Fatma Hassan', phone: '+255714000001', avatarUrl: null },
    seeker: { id: 'demo-seeker-1', name: 'Sarah Johnson', phone: '+14155550001', avatarUrl: null },
    request: { id: 'req2', description: 'Fabric shopping for kanga and kitenge' },
    messages: [],
  },
];

export async function GET() {
  try {
    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ disputes: DEMO_DISPUTES }, { status: 200 });
    }

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

    if (disputedSessions.length === 0) {
      return NextResponse.json({ disputes: DEMO_DISPUTES }, { status: 200 });
    }

    return NextResponse.json({ disputes: disputedSessions }, { status: 200 });
  } catch (error) {
    console.error('Get disputes error:', error);
    return NextResponse.json({ disputes: DEMO_DISPUTES }, { status: 200 });
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

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
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

    await db.guideProfile.updateMany({
      where: { userId: session.guideId },
      data: { currentStatus: 'online' },
    });

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
