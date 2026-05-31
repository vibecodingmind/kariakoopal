import { NextRequest, NextResponse } from 'next/server';

// M-Pesa Daraja API Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || 'demo_key',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'demo_secret',
  passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '174379',
  baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
};

// Get OAuth token
async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  const res = await fetch(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  return data.access_token;
}

// Generate timestamp
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
}

// Generate password
function getPassword(timestamp: string): string {
  return Buffer.from(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
}

// POST: Initiate STK Push
export async function POST(req: NextRequest) {
  try {
    const { phone, amount, reference, description } = await req.json();

    // Demo mode: if no real credentials, simulate success
    if (MPESA_CONFIG.consumerKey === 'demo_key') {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        MerchantRequestID: 'demo-' + Date.now(),
        CheckoutRequestID: 'demo-checkout-' + Date.now(),
        ResponseCode: '0',
        ResponseDescription: 'Demo: Accept the service request successfully',
        CustomerMessage: 'Demo: Success. Request accepted for processing',
        message: 'STK Push initiated (DEMO MODE). In production, user would receive M-Pesa prompt on their phone.',
      });
    }

    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const token = await getMpesaToken();

    // Format phone number: 254XXXXXXXXX
    let formattedPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('255')) {
      formattedPhone = '254' + formattedPhone.slice(3);
    }

    const stkPayload = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://web-production-91b90.up.railway.app'}/api/payments/mpesa/callback`,
      AccountReference: reference || 'ChimboDirect',
      TransactionDesc: description || 'Chimbo Direct Payment',
    };

    const response = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const data = await response.json();

    if (data.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        mode: 'production',
        MerchantRequestID: data.MerchantRequestID,
        CheckoutRequestID: data.CheckoutRequestID,
        ResponseCode: data.ResponseCode,
        ResponseDescription: data.ResponseDescription,
        CustomerMessage: data.CustomerMessage,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.ResponseDescription || 'STK Push failed',
        errorCode: data.ResponseCode,
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('M-Pesa STK Push error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET: Check payment status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get('CheckoutRequestID');

    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: 'CheckoutRequestID required' }, { status: 400 });
    }

    // Demo mode
    if (MPESA_CONFIG.consumerKey === 'demo_key') {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        ResultCode: '0',
        ResultDesc: 'The service request is processed successfully',
        amount: 1000,
        mphone: '254712345678',
      });
    }

    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const token = await getMpesaToken();

    const response = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    console.error('M-Pesa status check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
