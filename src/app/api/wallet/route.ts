import { NextResponse } from 'next/server';

// ── Demo wallet data ──
const demoWallet = {
  id: 'w1',
  userId: 'demo',
  balance: 47500,
  currency: 'TZS',
  createdAt: new Date().toISOString(),
};

const demoTransactions = [
  { id: 'tx1', walletId: 'w1', type: 'deposit', amount: 50000, status: 'completed', description: 'M-Pesa top-up', reference: 'MPESA-20260304-001', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'tx2', walletId: 'w1', type: 'payment', amount: -15000, status: 'completed', description: 'Session payment - Fabrics Zone tour', reference: 'SES-2847', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'tx3', walletId: 'w1', type: 'deposit', amount: 25000, status: 'completed', description: 'M-Pesa top-up', reference: 'MPESA-20260303-002', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'tx4', walletId: 'w1', type: 'withdrawal', amount: -20000, status: 'completed', description: 'Withdrawal to M-Pesa', reference: 'WD-20260303-001', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
  { id: 'tx5', walletId: 'w1', type: 'payment', amount: -8000, status: 'completed', description: 'Session payment - Electronics Zone', reference: 'SES-2831', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'tx6', walletId: 'w1', type: 'refund', amount: 8000, status: 'completed', description: 'Refund for cancelled session #SES-2831', reference: 'REF-2831', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
  { id: 'tx7', walletId: 'w1', type: 'subscription', amount: -15000, status: 'completed', description: 'Pro subscription - Monthly', reference: 'SUB-PRO-20260301', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'tx8', walletId: 'w1', type: 'deposit', amount: 100000, status: 'completed', description: 'M-Pesa top-up', reference: 'MPESA-20260301-001', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
  { id: 'tx9', walletId: 'w1', type: 'payment', amount: -25000, status: 'completed', description: 'Session payment - Wholesale Zone', reference: 'SES-2812', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
  { id: 'tx10', walletId: 'w1', type: 'payout', amount: 42500, status: 'pending', description: 'Earnings payout for Feb 2026', reference: 'PAY-20260228', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString() },
];

// GET /api/wallet - Return wallet balance and recent transactions
export async function GET() {
  return NextResponse.json({
    wallet: demoWallet,
    transactions: demoTransactions,
    pendingBalance: 42500,
    availableBalance: demoWallet.balance - 42500,
  });
}

// POST /api/wallet - Top up wallet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, phone } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Simulate top-up
    const newBalance = demoWallet.balance + amount;
    const transaction = {
      id: `tx-${Date.now()}`,
      walletId: 'w1',
      type: 'deposit',
      amount,
      status: 'completed',
      description: `M-Pesa top-up from ${phone || '255-XXX-XXXX'}`,
      reference: `MPESA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Top-up successful',
      wallet: { ...demoWallet, balance: newBalance },
      transaction,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
