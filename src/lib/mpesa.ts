// ── M-Pesa Daraja API Integration ──
// Safaricom Daraja API helper for STK Push (Lipa Na M-Pesa Online)
// Supports both sandbox and production environments
// Falls back to demo mode when env vars are missing

const MPESA_BASE_URL_SANDBOX = 'https://sandbox.safaricom.co.ke';
const MPESA_BASE_URL_PRODUCTION = 'https://api.safaricom.co.ke';

function getBaseUrl(): string {
  const env = process.env.MPESA_ENV || 'sandbox';
  return env === 'production' ? MPESA_BASE_URL_PRODUCTION : MPESA_BASE_URL_SANDBOX;
}

export function isDemoMode(): boolean {
  return !(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_PASSKEY &&
    process.env.MPESA_SHORTCODE
  );
}

/**
 * Get OAuth2 access token from Daraja API
 */
export async function getAccessToken(): Promise<string> {
  if (isDemoMode()) {
    return `demo_access_token_${Date.now()}`;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Generate the password for STK Push
 * Format: Base64(Shortcode + Passkey + Timestamp)
 */
export function generatePassword(): { password: string; timestamp: string } {
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  return { password, timestamp };
}

/**
 * Format phone number for M-Pesa (254XXXXXXXXX)
 */
function formatPhone(phone: string): string {
  // Remove any spaces or dashes
  let cleaned = phone.replace(/[\s-]/g, '');

  // Handle Tanzanian numbers: convert 07XX/06XX to 255XXXXXXXX
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  }

  // Handle +255 prefix
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle 255 prefix already present
  if (cleaned.startsWith('255')) {
    // For M-Pesa Kenya sandbox we keep it, in production TZ we'd adapt
    return cleaned;
  }

  // Handle 254 prefix (Kenya)
  if (cleaned.startsWith('254')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateSTKPush(params: {
  phone: string;
  amount: number;
  accountRef: string;
  transactionDesc: string;
}): Promise<{
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage?: string;
}> {
  const { phone, amount, accountRef, transactionDesc } = params;

  // Demo mode: return simulated success response
  if (isDemoMode()) {
    const mockId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      MerchantRequestID: `MRQ_${mockId}`,
      CheckoutRequestID: `CO_${mockId}`,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: 'Success. Request accepted for processing',
    };
  }

  const accessToken = await getAccessToken();
  const { password, timestamp } = generatePassword();
  const shortcode = process.env.MPESA_SHORTCODE!;

  const response = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formatPhone(phone),
      PartyB: shortcode,
      PhoneNumber: formatPhone(phone),
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kariako.app'}/api/payments/mpesa/callback`,
      AccountReference: accountRef,
      TransactionDesc: transactionDesc,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.errorMessage || `STK Push failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Query STK Push transaction status
 */
export async function querySTKStatus(checkoutRequestId: string): Promise<{
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  ResultCode: string;
  ResultDesc: string;
}> {
  // Demo mode: return simulated response
  if (isDemoMode()) {
    // Simulate different states based on checkout request ID age
    const timestamp = parseInt(checkoutRequestId.split('_')[1] || '0');
    const age = Date.now() - timestamp;

    if (age < 5000) {
      return {
        MerchantRequestID: `MRQ_${checkoutRequestId}`,
        CheckoutRequestID: checkoutRequestId,
        ResponseCode: '0',
        ResponseDescription: 'Processing',
        ResultCode: '0',
        ResultDesc: 'The service request is being processed',
      };
    }

    return {
      MerchantRequestID: `MRQ_${checkoutRequestId}`,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: '0',
      ResponseDescription: 'Success',
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully',
    };
  }

  const accessToken = await getAccessToken();
  const { password, timestamp } = generatePassword();
  const shortcode = process.env.MPESA_SHORTCODE!;

  const response = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  if (!response.ok) {
    throw new Error(`STK query failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Generate a mock M-Pesa receipt number for demo mode
 */
export function generateMockReceipt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let receipt = 'MPESA';
  for (let i = 0; i < 7; i++) {
    receipt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return receipt;
}
