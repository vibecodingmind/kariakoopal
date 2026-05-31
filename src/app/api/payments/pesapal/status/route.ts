import { NextRequest, NextResponse } from 'next/server';

const PESAPAL_BASE = 'https://pay.pesapal.com/v3';
const PESAPAL_SANDBOX = 'https://cybqa.pesapal.com/v3';

function getBaseUrl() {
  return process.env.PESAPAL_SANDBOX === 'true' ? PESAPAL_SANDBOX : PESAPAL_BASE;
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
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const orderTrackingId = req.nextUrl.searchParams.get('orderTrackingId');
  if (!orderTrackingId) {
    return NextResponse.json({ error: 'orderTrackingId is required' }, { status: 400 });
  }

  // Demo mode
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({
      status: 'COMPLETED',
      payment_method: 'MOBILE_MONEY',
      amount: 0,
      confirmation_code: `PSPL${orderTrackingId.slice(-6)}`,
      demoMode: true,
    });
  }

  // Production
  try {
    const res = await fetch(`${getBaseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Pesapal status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
