import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log the callback for debugging
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));
    
    const { Body } = body;
    if (Body?.stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      if (ResultCode === 0 && CallbackMetadata) {
        // Payment successful - extract details
        const metadata = CallbackMetadata.Item.reduce((acc: Record<string, unknown>, item: { Name: string; Value: unknown }) => {
          acc[item.Name] = item.Value;
          return acc;
        }, {} as Record<string, unknown>);
        
        console.log('Payment successful:', {
          MerchantRequestID,
          CheckoutRequestID,
          Amount: metadata.Amount,
          MpesaReceiptNumber: metadata.MpesaReceiptNumber,
          PhoneNumber: metadata.PhoneNumber,
        });
        
        // TODO: Update database with transaction
        // await db.transaction.create({ ... });
      } else {
        console.log('Payment failed:', { ResultCode, ResultDesc });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('M-Pesa callback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
