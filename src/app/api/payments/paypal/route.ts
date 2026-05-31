import { NextRequest, NextResponse } from 'next/server';

// PayPal Orders API integration
// Supports demo mode when PAYPAL_CLIENT_ID is not set

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const isSandbox = process.env.PAYPAL_SANDBOX !== 'false';
  const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    return data.access_token || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, userId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Demo mode
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      const mockOrderId = `PAYPAL_DEMO_${Date.now()}`;
      const mockReceipt = `PP${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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
                description: 'PayPal Top Up',
                reference: mockReceipt,
              },
            });
          }
        } catch { /* DB not available in demo */ }
      }, 2500);

      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        approvalUrl: null,
        demoMode: true,
        mockReceipt,
      });
    }

    // Production: Create PayPal order
    const isSandbox = process.env.PAYPAL_SANDBOX !== 'false';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'TZS',
            value: String(amount),
          },
          description: 'Kariako Guide Wallet Top Up',
          custom_id: userId || 'demo',
        }],
        application_context: {
          brand_name: 'Kariako Guide',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kariako.guide'}/wallet?payment=paypal&status=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kariako.guide'}/wallet?payment=paypal&status=cancelled`,
        },
      }),
    });

    const orderData = await orderRes.json();
    const approvalLink = orderData.links?.find((l: { rel: string }) => l.rel === 'approve')?.href;

    return NextResponse.json({
      success: !!orderData.id,
      orderId: orderData.id || '',
      approvalUrl: approvalLink || null,
      demoMode: false,
    });
  } catch (error) {
    console.error('PayPal payment error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
