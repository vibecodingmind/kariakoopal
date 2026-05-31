import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_LOYALTY_ACCOUNT, DEMO_REWARDS, getTierProgress } from '@/lib/loyalty-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, rewardId } = body;

    if (!userId || !rewardId) {
      return NextResponse.json({ error: 'userId and rewardId are required' }, { status: 400 });
    }

    // Find reward
    const reward = DEMO_REWARDS.find(r => r.id === rewardId);
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Demo user
    if (userId.startsWith('demo-')) {
      if (DEMO_LOYALTY_ACCOUNT.points < reward.pointsCost) {
        return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
      }
      const updatedPoints = DEMO_LOYALTY_ACCOUNT.points - reward.pointsCost;
      const progress = getTierProgress(updatedPoints);
      return NextResponse.json({
        success: true,
        message: `Redeemed: ${reward.name}`,
        account: {
          ...DEMO_LOYALTY_ACCOUNT,
          points: updatedPoints,
          tier: progress.tier,
          nextTier: progress.nextTier,
          nextTierPoints: progress.nextTierPoints,
          progressPercent: Math.round(progress.progressPercent),
        },
      });
    }

    // DB-backed
    let account = await db.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 });
    }

    if (account.points < reward.pointsCost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }

    // Create redemption transaction
    await db.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points: -reward.pointsCost,
        type: 'redeem',
        reason: 'redeemed_discount',
        referenceId: rewardId,
        metadata: JSON.stringify({ rewardName: reward.name }),
      },
    });

    const newPoints = account.points - reward.pointsCost;
    account = await db.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints },
    });

    const progress = getTierProgress(account.points);

    return NextResponse.json({
      success: true,
      message: `Redeemed: ${reward.name}`,
      account: {
        ...account,
        nextTier: progress.nextTier,
        nextTierPoints: progress.nextTierPoints,
        progressPercent: Math.round(progress.progressPercent),
      },
    });
  } catch (error) {
    console.error('[Loyalty Redeem] Error:', error);
    return NextResponse.json({ error: 'Failed to redeem' }, { status: 500 });
  }
}
