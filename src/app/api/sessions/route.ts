import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');
    const seekerId = searchParams.get('seekerId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (guideId) where.guideId = guideId;
    if (seekerId) where.seekerId = seekerId;
    if (status) where.escrowStatus = status;

    const sessions = await db.session.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requestId, guideId, seekerId, amount, platformFee } = await request.json();

    if (!requestId || !guideId || !seekerId) {
      return NextResponse.json(
        { error: 'requestId, guideId, and seekerId are required' },
        { status: 400 }
      );
    }

    const sessionCode = `KG-${Date.now().toString(36).toUpperCase()}`;

    const session = await db.session.create({
      data: {
        requestId,
        guideId,
        seekerId,
        sessionCode,
        startedAt: new Date(),
        escrowStatus: 'held',
        amount: amount || 0,
        platformFee: platformFee || 0,
      },
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

    // Update request status to matched
    await db.request.update({
      where: { id: requestId },
      data: { status: 'matched' },
    });

    // Update guide status to busy
    await db.guideProfile.updateMany({
      where: { userId: guideId },
      data: { currentStatus: 'busy' },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
