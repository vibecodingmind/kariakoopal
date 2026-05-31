import { NextRequest, NextResponse } from 'next/server';

/**
 * M-Pesa Daraja Callback Handler
 * Called by Safaricom after STK Push completes
 * Parses the callback body and extracts the transaction result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract the STK Push callback result
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error('Invalid M-Pesa callback: missing stkCallback', body);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = stkCallback;

    const resultCode = String(ResultCode);

    if (resultCode === '0') {
      // Transaction successful - extract callback metadata
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const metadata: Record<string, unknown> = {};

      for (const item of callbackMetadata) {
        switch (item.Name) {
          case 'Amount':
            metadata.amount = item.Value;
            break;
          case 'MpesaReceiptNumber':
            metadata.mpesaReceipt = item.Value;
            break;
          case 'TransactionDate':
            metadata.transactionDate = item.Value;
            break;
          case 'PhoneNumber':
            metadata.phoneNumber = item.Value;
            break;
        }
      }

      console.log('M-Pesa payment successful:', {
        MerchantRequestID,
        CheckoutRequestID,
        ...metadata,
      });

      // In a production app, you would:
      // 1. Update the transaction in the database
      // 2. Credit the user's wallet
      // 3. Send a notification to the user
    } else {
      console.log('M-Pesa payment failed:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode: resultCode,
        ResultDesc,
      });

      // In a production app, you would:
      // 1. Update the transaction status to failed
      // 2. Notify the user
    }

    // Always return success to Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  } catch (error) {
    console.error('M-Pesa callback processing error:', error);
    // Still return success to Safaricom to prevent retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
}
