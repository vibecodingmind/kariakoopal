import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_LOYALTY_TRANSACTIONS } from '@/lib/loyalty-data';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Demo user
    if (userId.startsWith('demo-')) {
      return NextResponse.json({
        transactions: DEMO_LOYALTY_TRANSACTIONS.slice(offset, offset + limit),
        total: DEMO_LOYALTY_TRANSACTIONS.length,
      });
    }

    // DB-backed
    const account = await db.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      return NextResponse.json({ transactions: [], total: 0 });
    }

    const [transactions, total] = await Promise.all([
      db.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.loyaltyTransaction.count({ where: { accountId: account.id } }),
    ]);

    return NextResponse.json({ transactions, total });
  } catch (error) {
    console.error('[Loyalty History] Error:', error);
    return NextResponse.json({ transactions: DEMO_LOYALTY_TRANSACTIONS, total: DEMO_LOYALTY_TRANSACTIONS.length });
  }
}
