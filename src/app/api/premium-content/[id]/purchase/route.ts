import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/premium-content/[id]/purchase — purchase premium content
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get content
    const content = await db.premiumContent.findUnique({ where: { id } });
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (!content.isActive) {
      return NextResponse.json({ error: 'Content is not available' }, { status: 400 });
    }

    // Check if already purchased
    const existing = await db.contentPurchase.findUnique({
      where: { userId_contentId: { userId, contentId: id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already purchased', purchase: existing }, { status: 409 });
    }

    // Check wallet balance
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (wallet && wallet.balance < content.price) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Create purchase
    const purchase = await db.contentPurchase.create({
      data: {
        userId,
        contentId: id,
        amount: content.price,
      },
    });

    // Deduct from wallet
    if (wallet && content.price > 0) {
      await db.wallet.update({
        where: { userId },
        data: { balance: { decrement: content.price } },
      });

      await db.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'payment',
          amount: content.price,
          status: 'completed',
          description: `Premium content: ${content.title}`,
          reference: purchase.id,
        },
      });
    }

    // Update content purchase count
    await db.premiumContent.update({
      where: { id },
      data: { purchases: { increment: 1 } },
    });

    // Credit guide wallet
    const guideWallet = await db.wallet.findUnique({ where: { userId: content.guideId } });
    if (guideWallet && content.price > 0) {
      await db.wallet.update({
        where: { userId: content.guideId },
        data: { balance: { increment: content.price } },
      });

      await db.transaction.create({
        data: {
          walletId: guideWallet.id,
          type: 'deposit',
          amount: content.price,
          status: 'completed',
          description: `Content sale: ${content.title}`,
          reference: purchase.id,
        },
      });
    }

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    console.error('Premium content purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase content' }, { status: 500 });
  }
}
