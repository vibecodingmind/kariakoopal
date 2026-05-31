import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTierForPoints, DEMO_LOYALTY_ACCOUNT, DEMO_LOYALTY_TRANSACTIONS, getTierProgress } from '@/lib/loyalty-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points, type, reason, referenceId, metadata } = body;

    if (!userId || !points || !type || !reason) {
      return NextResponse.json({ error: 'userId, points, type, and reason are required' }, { status: 400 });
    }

    // Demo user — simulate earning
    if (userId.startsWith('demo-')) {
      const updatedPoints = DEMO_LOYALTY_ACCOUNT.points + points;
      const progress = getTierProgress(updatedPoints);
      return NextResponse.json({
        success: true,
        account: {
          ...DEMO_LOYALTY_ACCOUNT,
          points: updatedPoints,
          lifetimePoints: DEMO_LOYALTY_ACCOUNT.lifetimePoints + points,
          tier: progress.tier,
          nextTier: progress.nextTier,
          nextTierPoints: progress.nextTierPoints,
          progressPercent: Math.round(progress.progressPercent),
        },
        transaction: {
          id: `lt_${Date.now()}`,
          accountId: DEMO_LOYALTY_ACCOUNT.id,
          points,
          type,
          reason,
          referenceId: referenceId || null,
          metadata: metadata || '{}',
          createdAt: new Date().toISOString(),
        },
      });
    }

    // DB-backed
    let account = await db.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await db.loyaltyAccount.create({ data: { userId, tier: 'bronze' } });
    }

    // Streak logic
    const today = new Date().toISOString().split('T')[0];
    const lastDate = account.lastActivityDate;
    let currentStreak = account.currentStreak;

    if (lastDate === today) {
      // Already active today, no streak change
    } else if (lastDate && isConsecutiveDay(lastDate, today)) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    const newPoints = account.points + points;
    const newLifetime = account.lifetimePoints + points;
    const newTier = getTierForPoints(newPoints);
    const longestStreak = Math.max(currentStreak, account.longestStreak);

    // Create transaction + update account
    const transaction = await db.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points,
        type,
        reason,
        referenceId: referenceId || null,
        metadata: metadata || '{}',
      },
    });

    account = await db.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: newPoints,
        lifetimePoints: newLifetime,
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        tier: newTier,
      },
    });

    const progress = getTierProgress(account.points);

    return NextResponse.json({
      success: true,
      account: {
        ...account,
        nextTier: progress.nextTier,
        nextTierPoints: progress.nextTierPoints,
        progressPercent: Math.round(progress.progressPercent),
      },
      transaction,
    });
  } catch (error) {
    console.error('[Loyalty Earn] Error:', error);
    return NextResponse.json({ error: 'Failed to earn points' }, { status: 500 });
  }
}

function isConsecutiveDay(lastDate: string, today: string): boolean {
  const last = new Date(lastDate);
  const now = new Date(today);
  const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 1 && diff < 2;
}
