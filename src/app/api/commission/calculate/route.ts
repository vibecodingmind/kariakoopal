import { NextRequest, NextResponse } from 'next/server';
import { calculateCommission } from '@/lib/commission';

// POST /api/commission/calculate — calculate commission for a transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, tier, category } = body;

    if (!amount || !tier || !category) {
      return NextResponse.json(
        { error: 'amount, tier, and category are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    const result = await calculateCommission(parsedAmount, tier, category);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Commission calculate error:', error);
    return NextResponse.json({ error: 'Failed to calculate commission' }, { status: 500 });
  }
}
