import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getEmailTypes, previewEmail } from '@/lib/email';

// POST /api/email/send - Send a transactional email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to' },
        { status: 400 }
      );
    }

    const result = await sendEmail(type, to, data || {});

    return NextResponse.json({
      success: result.success,
      message: result.message,
      demo: result.demo || false,
    });
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/email/send - Get available email types & preview
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const previewType = searchParams.get('preview') as string | null;

    if (previewType) {
      const preview = previewEmail(previewType as any, {
        name: 'Demo User',
        guideName: 'Mwanamvula Juma',
        seekerName: 'John Doe',
        zone: 'Fabrics Zone',
        date: new Date().toLocaleDateString(),
        time: '10:00 AM',
        amount: '15,000',
        sessionCode: 'KG-2024-001',
        transactionId: 'TXN-DEMO-001',
        status: 'pending',
        resetUrl: 'https://kariako.guide/reset?token=demo',
      });

      if (!preview) {
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
      }

      return NextResponse.json({ success: true, preview });
    }

    return NextResponse.json({
      success: true,
      types: getEmailTypes(),
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    });
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
