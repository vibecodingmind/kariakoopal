import { NextRequest, NextResponse } from 'next/server';
import { previewEmail, getEmailTypes, getQueueStatus } from '@/lib/email';

// GET /api/email - Get email system status, available types
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
        resetUrl: 'https://chimbo.direct/reset?token=demo',
        appUrl: 'https://chimbo.direct',
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
      queue: getQueueStatus(),
    });
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/email - Admin broadcast email to multiple users
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, bodyHtml, bodyText, ctaUrl, ctaText, recipientEmails } = body;

    if (!subject || (!bodyHtml && !bodyText)) {
      return NextResponse.json(
        { error: 'Subject and body (HTML or text) are required' },
        { status: 400 }
      );
    }

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'recipientEmails array is required' },
        { status: 400 }
      );
    }

    // Queue broadcast emails
    const results = [];
    for (const email of recipientEmails.slice(0, 100)) { // max 100 per batch
      const { sendEmail } = await import('@/lib/email');
      const result = await sendEmail('admin_broadcast', email, {
        subject,
        bodyHtml: bodyHtml || '',
        body: bodyText || bodyHtml?.replace(/<[^>]*>/g, '') || '',
        message: bodyText || '',
        ctaUrl: ctaUrl || '',
        ctaText: ctaText || '',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct',
      });
      results.push({ email, trackingId: result.trackingId });
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast queued for ${results.length} recipients`,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Email broadcast error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
