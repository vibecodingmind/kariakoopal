import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_LOYALTY_ACCOUNT, DEMO_LOYALTY_TRANSACTIONS, getTierProgress } from '@/lib/loyalty-data';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Demo user — return demo data
    if (userId.startsWith('demo-')) {
      const progress = getTierProgress(DEMO_LOYALTY_ACCOUNT.points);
      return NextResponse.json({
        ...DEMO_LOYALTY_ACCOUNT,
        nextTier: progress.nextTier,
        nextTierPoints: progress.nextTierPoints,
        progressPercent: Math.round(progress.progressPercent),
        transactions: DEMO_LOYALTY_TRANSACTIONS.slice(0, 10),
      });
    }

    // DB-backed user
    let account = await db.loyaltyAccount.findUnique({ where: { userId } });

    if (!account) {
      // Create account on first access
      account = await db.loyaltyAccount.create({
        data: { userId, tier: 'bronze' },
      });
    }

    const transactions = await db.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const progress = getTierProgress(account.points);

    return NextResponse.json({
      ...account,
      nextTier: progress.nextTier,
      nextTierPoints: progress.nextTierPoints,
      progressPercent: Math.round(progress.progressPercent),
      transactions,
    });
  } catch (error) {
    console.error('[Loyalty GET] Error:', error);
    // Fallback to demo
    const progress = getTierProgress(DEMO_LOYALTY_ACCOUNT.points);
    return NextResponse.json({
      ...DEMO_LOYALTY_ACCOUNT,
      nextTier: progress.nextTier,
      nextTierPoints: progress.nextTierPoints,
      progressPercent: Math.round(progress.progressPercent),
      transactions: DEMO_LOYALTY_TRANSACTIONS.slice(0, 10),
    });
  }
}
