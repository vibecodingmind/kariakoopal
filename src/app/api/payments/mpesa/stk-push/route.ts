import { NextRequest, NextResponse } from 'next/server';
import { initiateSTKPush, generateMockReceipt, isDemoMode } from '@/lib/mpesa';
import { sanitizePhone, sanitizeString } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount, accountRef, transactionDesc } = body;

    // Validate and sanitize inputs
    const sanitizedPhone = sanitizePhone(phone);
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format', success: false },
        { status: 400 }
      );
    }

    const sanitizedAccountRef = sanitizeString(accountRef || 'ChimboWallet', 50);
    const sanitizedDesc = sanitizeString(transactionDesc || 'Wallet Top Up', 100);

    const sanitizedAmount = Number(amount);
    if (!sanitizedAmount || sanitizedAmount < 1 || sanitizedAmount > 300000) {
      return NextResponse.json(
        { error: 'Amount must be between 1 and 300,000 TZS', success: false },
        { status: 400 }
      );
    }

    // Initiate STK Push
    const result = await initiateSTKPush({
      phone: sanitizedPhone,
      amount: sanitizedAmount,
      accountRef: sanitizedAccountRef,
      transactionDesc: sanitizedDesc,
    });

    // In demo mode, include a mock receipt
    const response = {
      success: true,
      ...result,
      ...(isDemoMode()
        ? {
            demoMode: true,
            mockReceipt: generateMockReceipt(),
            mockMpesaReceipt: `QJK${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          }
        : {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'STK Push failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
