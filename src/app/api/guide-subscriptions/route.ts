import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');

    const where: Record<string, unknown> = {};
    if (tier) where.tier = tier;

    const subscriptions = await db.guideSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: subscriptions });
  } catch (error) {
    console.error('Get guide subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch guide subscriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guideId, tier, autoRenew, paymentRef } = body;

    if (!guideId) {
      return NextResponse.json({ error: 'guideId is required' }, { status: 400 });
    }

    const subscription = await db.guideSubscription.create({
      data: {
        guideId,
        tier: tier ?? 'starter',
        autoRenew: autoRenew ?? false,
        paymentRef: paymentRef ?? '',
      },
    });

    return NextResponse.json({ item: subscription }, { status: 201 });
  } catch (error) {
    console.error('Create guide subscription error:', error);
    return NextResponse.json({ error: 'Failed to create guide subscription' }, { status: 500 });
  }
}
