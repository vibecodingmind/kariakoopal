import { NextRequest, NextResponse } from 'next/server';

// Stripe webhook handler for checkout.session.completed events
// In production, verify the signature with STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    // In production, verify Stripe webhook signature here:
    // const sig = req.headers.get('stripe-signature');
    // const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

    if (payload.type === 'checkout.session.completed') {
      const session = payload.data?.object;
      const userId = session?.metadata?.user_id;
      const amount = Number(session?.metadata?.amount || session?.amount_total || 0);

      if (userId && amount > 0) {
        try {
          const { db } = await import('@/lib/db');
          let wallet = await db.wallet.findUnique({ where: { userId } });
          if (!wallet) {
            wallet = await db.wallet.create({ data: { userId, balance: 0 } });
          }
          await db.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
          await db.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'deposit',
              amount,
              status: 'completed',
              description: 'Stripe Card Top Up',
              reference: session?.payment_intent || `STRIPE_${Date.now()}`,
            },
          });
        } catch (dbError) {
          console.error('Stripe webhook DB error:', dbError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
