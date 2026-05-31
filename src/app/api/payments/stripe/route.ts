import { NextRequest, NextResponse } from 'next/server';

// Stripe Checkout integration for card payments
// Supports demo mode when STRIPE_SECRET_KEY is not set

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, userId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Demo mode
    if (!stripeKey) {
      const mockSessionId = `CS_DEMO_${Date.now()}`;
      const mockReceipt = `STRIPE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Simulate processing delay then credit wallet
      setTimeout(async () => {
        try {
          const { db } = await import('@/lib/db');
          const users = await db.user.findMany({ take: 1 });
          if (users.length > 0) {
            let wallet = await db.wallet.findUnique({ where: { userId: users[0].id } });
            if (!wallet) {
              wallet = await db.wallet.create({ data: { userId: users[0].id, balance: 0 } });
            }
            await db.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
            await db.transaction.create({
              data: {
                walletId: wallet.id,
                type: 'deposit',
                amount,
                status: 'completed',
                description: 'Stripe Card Top Up',
                reference: mockReceipt,
              },
            });
          }
        } catch { /* DB not available in demo */ }
      }, 2500);

      return NextResponse.json({
        success: true,
        sessionId: mockSessionId,
        url: null,
        demoMode: true,
        mockReceipt,
      });
    }

    // Production: Create Stripe Checkout Session
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${stripeKey}`,
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'mode': 'payment',
        'customer_email': email || 'user@chimbo.direct',
        'line_items[0][price_data][currency]': 'tzs',
        'line_items[0][price_data][product_data][name]': 'Chimbo Direct Wallet Top Up',
        'line_items[0][price_data][unit_amount]': String(Math.round(amount)), // TZS has no decimals
        'line_items[0][quantity]': '1',
        'success_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/wallet?payment=stripe&status=success`,
        'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/wallet?payment=stripe&status=cancelled`,
        'metadata[user_id]': userId || 'demo',
        'metadata[amount]': String(amount),
      }),
    });

    const session = await stripeRes.json();

    return NextResponse.json({
      success: !!session.id,
      sessionId: session.id || '',
      url: session.url || null,
      demoMode: false,
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
