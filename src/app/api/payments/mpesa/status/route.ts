import { NextRequest, NextResponse } from 'next/server';
import { querySTKStatus } from '@/lib/mpesa';
import { sanitizeString } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const CheckoutRequestID = searchParams.get('CheckoutRequestID');

    if (!CheckoutRequestID) {
      return NextResponse.json(
        { error: 'CheckoutRequestID is required', success: false },
        { status: 400 }
      );
    }

    const sanitizedId = sanitizeString(CheckoutRequestID, 100);

    const result = await querySTKStatus(sanitizedId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('M-Pesa status query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status query failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CheckoutRequestID } = body;

    if (!CheckoutRequestID) {
      return NextResponse.json(
        { error: 'CheckoutRequestID is required', success: false },
        { status: 400 }
      );
    }

    const sanitizedId = sanitizeString(CheckoutRequestID, 100);

    const result = await querySTKStatus(sanitizedId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('M-Pesa status query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status query failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
