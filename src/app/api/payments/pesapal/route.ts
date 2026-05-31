import { NextRequest, NextResponse } from 'next/server';

// Pesapal payment integration for TZS mobile money (M-Pesa, Tigo Pesa, Airtel Money)
// Supports demo mode when PESAPAL_CONSUMER_KEY is not set

const PESAPAL_BASE = 'https://pay.pesapal.com/v3'; // production
const PESAPAL_SANDBOX = 'https://cybqa.pesapal.com/v3'; // sandbox

function getBaseUrl() {
  const isSandbox = process.env.PESAPAL_SANDBOX === 'true';
  return isSandbox ? PESAPAL_SANDBOX : PESAPAL_BASE;
}

async function getAccessToken(): Promise<string | null> {
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ consumer_key: key, consumer_secret: secret }),
    });
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, amount, accountRef, email, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Demo mode
    const token = await getAccessToken();
    if (!token) {
      const mockOrderId = `PESAPAL_DEMO_${Date.now()}`;
      const mockReceipt = `PSPL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Simulate processing delay then success
      setTimeout(async () => {
        try {
          const { db } = await import('@/lib/db');
          // Find or create wallet for this user
          const userIdentifier = accountRef?.replace('KARIKO_', '') || 'demo';
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
                description: description || 'Pesapal Top Up',
                reference: mockReceipt,
              },
            });
          }
        } catch {
          // DB not available in demo mode, that's fine
        }
      }, 2500);

      return NextResponse.json({
        success: true,
        orderTrackingId: mockOrderId,
        redirectUrl: null,
        demoMode: true,
        mockReceipt,
      });
    }

    // Production: Register IPN URL
    const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/api/payments/pesapal/callback`;
    const ipnRes = await fetch(`${getBaseUrl()}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'POST',
      }),
    });
    const ipnData = await ipnRes.json();

    // Submit order to Pesapal
    const orderRes = await fetch(`${getBaseUrl()}/api/Transactions/SubmitOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: accountRef || `KARIKO_${Date.now()}`,
        currency: 'TZS',
        amount: Number(amount),
        description: description || 'Chimbo Direct Wallet Top Up',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct'}/wallet?payment=pesapal`,
        notification_id: ipnData?.ipn_id || '',
        billing_address: {
          email_address: email || 'user@chimbo.direct',
          phone_number: phone || '',
          country_code: 'TZ',
          first_name: 'Chimbo',
          last_name: 'User',
        },
      }),
    });
    const orderData = await orderRes.json();

    return NextResponse.json({
      success: orderData.status === '200' || !!orderData.order_tracking_id,
      orderTrackingId: orderData.order_tracking_id || '',
      redirectUrl: orderData.redirect_url || '',
      demoMode: false,
    });
  } catch (error) {
    console.error('Pesapal payment error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
