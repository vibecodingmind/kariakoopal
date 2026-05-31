import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tips — list tips (sent or received)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const direction = searchParams.get('direction') || 'received'; // sent or received
    const sessionId = searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: any = {};
    if (direction === 'received') {
      where.toGuideId = userId;
    } else {
      where.fromUserId = userId;
    }
    if (sessionId) where.sessionId = sessionId;

    const tips = await db.tip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const stats = await db.tip.aggregate({
      where: direction === 'received' ? { toGuideId: userId } : { fromUserId: userId },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    // This month's total
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTotal = await db.tip.aggregate({
      where: {
        ...(direction === 'received' ? { toGuideId: userId } : { fromUserId: userId }),
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return NextResponse.json({
      tips,
      stats: {
        total: stats._sum.amount || 0,
        count: stats._count,
        average: stats._avg.amount || 0,
        thisMonth: monthTotal._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Tips GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });
  }
}

// POST /api/tips — send a tip
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, fromUserId, toGuideId, amount, message, isAnonymous } = body;

    if (!sessionId || !fromUserId || !toGuideId || !amount) {
      return NextResponse.json(
        { error: 'sessionId, fromUserId, toGuideId, and amount are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
    }

    // Check seeker wallet balance
    const wallet = await db.wallet.findUnique({
      where: { userId: fromUserId },
    });

    if (wallet && wallet.balance < parsedAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Create tip
    const tip = await db.tip.create({
      data: {
        sessionId,
        fromUserId,
        toGuideId,
        amount: parsedAmount,
        message: message || '',
        isAnonymous: isAnonymous || false,
      },
    });

    // Deduct from wallet if exists
    if (wallet) {
      await db.wallet.update({
        where: { userId: fromUserId },
        data: { balance: { decrement: parsedAmount } },
      });

      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'payment',
          amount: parsedAmount,
          status: 'completed',
          description: `Tip to guide`,
          reference: tip.id,
        },
      });
    }

    // Credit guide wallet
    const guideWallet = await db.wallet.findUnique({
      where: { userId: toGuideId },
    });

    if (guideWallet) {
      await db.wallet.update({
        where: { userId: toGuideId },
        data: { balance: { increment: parsedAmount } },
      });

      await db.transaction.create({
        data: {
          walletId: guideWallet.id,
          type: 'deposit',
          amount: parsedAmount,
          status: 'completed',
          description: isAnonymous ? 'Anonymous tip received' : 'Tip received',
          reference: tip.id,
        },
      });
    }

    return NextResponse.json({ tip }, { status: 201 });
  } catch (error) {
    console.error('Tips POST error:', error);
    return NextResponse.json({ error: 'Failed to send tip' }, { status: 500 });
  }
}
