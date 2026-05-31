import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/wallet - Return wallet data ──
export async function GET(req: NextRequest) {
  try {
    // Demo wallet data
    const wallet = {
      balance: 47500,
      pendingBalance: 75000,
      currency: 'TZS',
      transactions: [
        { id: 't1', type: 'deposit', amount: 50000, status: 'completed', description: 'M-Pesa Top Up', date: 'May 30, 2026' },
        { id: 't2', type: 'payment', amount: -35000, status: 'completed', description: 'Session Payment', date: 'May 30, 2026' },
        { id: 't3', type: 'refund', amount: 15000, status: 'completed', description: 'Session Refund', date: 'May 28, 2026' },
      ],
    };

    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

// ── POST /api/wallet - Top up wallet ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, phoneNumber } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Simulate successful top-up
    const transaction = {
      id: `t-${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'completed',
      description: `M-Pesa Top Up`,
      reference: `MPESA${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Top up successful',
      transaction,
      newBalance: 47500 + amount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Top up failed' }, { status: 500 });
  }
}
