import { NextRequest, NextResponse } from 'next/server';

// Capture an approved PayPal order and credit the user's wallet

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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    return data.access_token || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, userId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Demo mode
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        captureId: `CAPTURE_${orderId}`,
        demoMode: true,
      });
    }

    // Production: Capture the PayPal order
    const isSandbox = process.env.PAYPAL_SANDBOX !== 'false';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureRes.json();

    // Credit wallet if capture successful
    if (captureData.status === 'COMPLETED') {
      const purchaseUnit = captureData.purchase_units?.[0];
      const amount = Number(purchaseUnit?.payments?.captures?.[0]?.amount?.value || 0);
      const uid = userId || purchaseUnit?.custom_id;

      if (uid && amount > 0) {
        try {
          const { db } = await import('@/lib/db');
          let wallet = await db.wallet.findUnique({ where: { userId: uid } });
          if (!wallet) {
            wallet = await db.wallet.create({ data: { userId: uid, balance: 0 } });
          }
          await db.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
          await db.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'deposit',
              amount,
              status: 'completed',
              description: 'PayPal Top Up',
              reference: purchaseUnit?.payments?.captures?.[0]?.id || `PP_${Date.now()}`,
            },
          });
        } catch (dbError) {
          console.error('PayPal capture DB error:', dbError);
        }
      }
    }

    return NextResponse.json({
      success: captureData.status === 'COMPLETED',
      status: captureData.status,
      captureId: captureData.id,
      demoMode: false,
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
  }
}
