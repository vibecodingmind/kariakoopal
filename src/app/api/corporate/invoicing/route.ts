import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/corporate/invoicing — get invoices for a corporate account
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const corporateId = searchParams.get('corporateId');

    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 });
    }

    // Get corporate account
    const account = await db.corporateAccount.findUnique({
      where: { id: corporateId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 });
    }

    // Get transactions related to corporate members
    const members = await db.corporateMember.findMany({
      where: { corporateId },
      select: { userId: true },
    });

    const memberIds = members.map(m => m.userId);

    const wallets = await db.wallet.findMany({
      where: { userId: { in: memberIds } },
      select: { id: true },
    });

    const walletIds = wallets.map(w => w.id);

    const transactions = await db.transaction.findMany({
      where: {
        walletId: { in: walletIds },
        type: 'payment',
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Generate invoice summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTxns = transactions.filter(t => new Date(t.createdAt) >= startOfMonth);
    const thisMonthTotal = thisMonthTxns.reduce((a, t) => a + t.amount, 0);

    return NextResponse.json({
      invoices: [
        {
          id: `inv-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          corporateId,
          period: `${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`,
          amount: thisMonthTotal,
          transactionCount: thisMonthTxns.length,
          status: 'pending',
          createdAt: now.toISOString(),
        },
      ],
      currentMonthTotal: thisMonthTotal,
      budgetRemaining: account.monthlyBudget - account.spentThisMonth,
      monthlyBudget: account.monthlyBudget,
    });
  } catch (error) {
    console.error('Corporate invoicing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/corporate/invoicing — generate invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { corporateId, month, year } = body;

    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 });
    }

    const account = await db.corporateAccount.findUnique({
      where: { id: corporateId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 });
    }

    // Create invoice record (simplified — in production this would generate PDF)
    const invoiceId = `INV-${Date.now()}`;
    const amount = account.spentThisMonth;

    return NextResponse.json({
      invoice: {
        id: invoiceId,
        corporateId,
        companyName: account.companyName,
        amount,
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        status: 'generated',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Corporate invoicing POST error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
