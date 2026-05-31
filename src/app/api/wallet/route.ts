import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
// Token formats: token_{userId}_{timestamp} | demo_token_{userId}_{timestamp} | temp_token_{id}_{timestamp}
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    // demo_token_{userId}_{timestamp} → index 2
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    // token_{userId}_{timestamp} → index 1
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    // temp users are not persisted
    return null;
  }
  return null;
}

// ── Demo fallback data ──
function getDemoWalletData() {
  return {
    balance: 47500,
    pendingBalance: 75000,
    currency: 'TZS',
    transactions: [
      { id: 't1', type: 'deposit', amount: 50000, status: 'completed', description: 'Pesapal Top Up', reference: 'PSPL2543', provider: 'pesapal', date: 'May 30, 2026', time: '2:45 PM' },
      { id: 't2', type: 'payment', amount: -35000, status: 'completed', description: 'Session Payment - Mwanaildi J.', reference: 'SES-001', provider: 'pesapal', date: 'May 30, 2026', time: '3:15 PM' },
      { id: 't3', type: 'refund', amount: 15000, status: 'completed', description: 'Session Refund - Cancelled', reference: 'REF-042', provider: 'stripe', date: 'May 28, 2026', time: '11:00 AM' },
    ],
  };
}

// ── Format date for frontend display ──
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── GET /api/wallet - Return wallet data with paginated transactions ──
export async function GET(req: NextRequest) {
  // ── Auth check ──
  const authToken = req.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = getUserIdFromToken(authToken);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  // ── Pagination params ──
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const typeFilter = searchParams.get('type') || undefined; // optional filter by type

  try {
    // ── Find or create wallet ──
    let wallet = await db.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      // Auto-create wallet for user if it doesn't exist
      wallet = await db.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'TZS',
        },
      });
    }

    // ── Build transaction query ──
    const whereClause: Record<string, unknown> = { walletId: wallet.id };
    if (typeFilter) {
      whereClause.type = typeFilter;
    }

    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.transaction.count({ where: whereClause }),
    ]);

    // ── Calculate pending balance from pending/escrow transactions ──
    const pendingTransactions = await db.transaction.findMany({
      where: {
        walletId: wallet.id,
        status: 'pending',
      },
      select: { amount: true, type: true },
    });
    const pendingBalance = pendingTransactions.reduce((sum, t) => {
      // Only count outgoing pending amounts (payments, withdrawals held in escrow)
      if (['payment', 'withdrawal', 'escrow_hold'].includes(t.type)) {
        return sum + Math.abs(t.amount);
      }
      return sum;
    }, 0);

    // ── Format transactions for frontend ──
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: ['deposit', 'refund'].includes(t.type) ? Math.abs(t.amount) : -Math.abs(t.amount),
      status: t.status,
      description: t.description,
      reference: t.reference,
      provider: t.provider || 'pesapal',
      date: formatDate(t.createdAt),
      time: formatTime(t.createdAt),
    }));

    return NextResponse.json({
      wallet: {
        balance: wallet.balance,
        pendingBalance,
        currency: wallet.currency,
        transactions: formattedTransactions,
      },
      pagination: {
        offset,
        limit,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Wallet GET error:', error);
    // ── Fallback to demo data if DB is unavailable ──
    const demoData = getDemoWalletData();
    return NextResponse.json({
      wallet: demoData,
      pagination: {
        offset: 0,
        limit: 20,
        total: demoData.transactions.length,
        hasMore: false,
      },
      demoMode: true,
    });
  }
}

// ── POST /api/wallet - Top up wallet ──
export async function POST(req: NextRequest) {
  // ── Auth check ──
  const authToken = req.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = getUserIdFromToken(authToken);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  // ── Parse body early so it's available in catch block ──
  let body: { amount?: number; provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { amount, provider = 'pesapal' } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // ── Validate provider ──
  const validProviders = ['pesapal', 'stripe', 'paypal'];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
  }

  try {
    // ── Find or create wallet ──
    let wallet = await db.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'TZS',
        },
      });
    }

    const walletId = wallet.id;
    const reference = `${provider.toUpperCase().slice(0, 4)}${Math.floor(Math.random() * 9000) + 1000}`;

    // ── Atomic transaction: create Transaction record + update Wallet balance ──
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          type: 'deposit',
          amount,
          status: 'completed',
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Top Up`,
          reference,
          provider,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });

      return { transaction, updatedWallet };
    });

    return NextResponse.json({
      success: true,
      message: 'Top up successful',
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount,
        status: result.transaction.status,
        description: result.transaction.description,
        reference: result.transaction.reference,
        provider: result.transaction.provider,
        date: formatDate(result.transaction.createdAt),
        time: formatTime(result.transaction.createdAt),
      },
      newBalance: result.updatedWallet.balance,
    });
  } catch (error) {
    console.error('Wallet POST error:', error);
    // ── Fallback to demo response if DB is unavailable ──
    const fallbackAmount = body.amount || 0;
    const fallbackProvider = body.provider || 'pesapal';
    const transaction = {
      id: `t-${Date.now()}`,
      type: 'deposit',
      amount: fallbackAmount,
      status: 'completed',
      description: `${fallbackProvider.charAt(0).toUpperCase() + fallbackProvider.slice(1)} Top Up`,
      reference: `MPESA${Math.floor(Math.random() * 9000) + 1000}`,
      provider: fallbackProvider,
      date: formatDate(new Date()),
      time: formatTime(new Date()),
    };

    return NextResponse.json({
      success: true,
      message: 'Top up successful (demo mode)',
      transaction,
      newBalance: 47500 + fallbackAmount,
      demoMode: true,
    });
  }
}
