import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/commission/ledger — list commission ledger entries with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromUserId = searchParams.get('fromUserId');
    const toUserId = searchParams.get('toUserId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (fromUserId) where.fromUserId = fromUserId;
    if (toUserId) where.toUserId = toUserId;
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      db.commissionLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.commissionLedger.count({ where }),
    ]);

    // Calculate totals
    const totals = await db.commissionLedger.aggregate({
      where,
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
    });

    return NextResponse.json({
      entries,
      total,
      page,
      limit,
      totals: {
        grossAmount: totals._sum.grossAmount || 0,
        commissionAmount: totals._sum.commissionAmount || 0,
        netAmount: totals._sum.netAmount || 0,
      },
    });
  } catch (error) {
    console.error('Commission ledger GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch commission ledger' }, { status: 500 });
  }
}
