import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (guideId) where.guideId = guideId;
    if (status) where.status = status;

    const payouts = await db.payout.findMany({
      where,
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { guideId, amount, mobileMoneyNumber } = await request.json();

    if (!guideId || amount === undefined) {
      return NextResponse.json(
        { error: 'guideId and amount are required' },
        { status: 400 }
      );
    }

    const guide = await db.user.findUnique({ where: { id: guideId } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const payout = await db.payout.create({
      data: {
        guideId,
        amount,
        mobileMoneyNumber: mobileMoneyNumber || '',
        status: 'pending',
      },
      include: {
        guide: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    console.error('Create payout error:', error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}
