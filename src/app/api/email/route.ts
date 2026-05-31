import { NextRequest, NextResponse } from 'next/server';

interface EmailPayload {
  to: string;
  subject: string;
  template: 'welcome' | 'booking-confirmed' | 'booking-cancelled' | 'payout-received' | 'review-received' | 'security-alert' | 'weekly-digest';
  data: Record<string, any>;
}

const TEMPLATES: Record<string, (data: Record<string, any>) => { html: string; text: string }> = {
  welcome: (data) => ({
    html: `<h1>Welcome to Kariako Guide, ${data.name}!</h1><p>Your ${data.role} account is ready.</p><p>Start exploring Kariakoo Market with AI-powered tools.</p>`,
    text: `Welcome to Kariako Guide, ${data.name}! Your ${data.role} account is ready.`,
  }),
  'booking-confirmed': (data) => ({
    html: `<h1>Booking Confirmed!</h1><p>Your session with ${data.guideName} on ${data.date} at ${data.time} is confirmed.</p><p>Amount: TZS ${data.amount?.toLocaleString()}</p><p>Payment held in escrow until session completion.</p>`,
    text: `Booking confirmed with ${data.guideName} on ${data.date} at ${data.time}.`,
  }),
  'booking-cancelled': (data) => ({
    html: `<h1>Booking Cancelled</h1><p>Your booking with ${data.guideName} has been cancelled.</p><p>Reason: ${data.reason || 'No reason provided'}</p><p>Refund will be processed within 24 hours.</p>`,
    text: `Booking with ${data.guideName} cancelled. Refund processing.`,
  }),
  'payout-received': (data) => ({
    html: `<h1>Payout Received!</h1><p>TZS ${data.amount?.toLocaleString()} has been sent to your ${data.method} account.</p>`,
    text: `Payout of TZS ${data.amount?.toLocaleString()} sent to ${data.method}.`,
  }),
  'review-received': (data) => ({
    html: `<h1>New Review!</h1><p>${data.seekerName} left you a ${data.rating}-star review.</p><p>"${data.comment}"</p>`,
    text: `${data.seekerName} left a ${data.rating}-star review.`,
  }),
  'security-alert': (data) => ({
    html: `<h1>Security Alert</h1><p>${data.message}</p><p>If this wasn't you, please secure your account immediately.</p>`,
    text: `Security alert: ${data.message}`,
  }),
  'weekly-digest': (data) => ({
    html: `<h1>Your Weekly Kariako Digest</h1><p>Sessions: ${data.sessions} | Earnings: TZS ${data.earnings?.toLocaleString()} | Rating: ${data.rating}</p>`,
    text: `Weekly: ${data.sessions} sessions, TZS ${data.earnings?.toLocaleString()} earned.`,
  }),
};

export async function POST(req: NextRequest) {
  try {
    const { to, subject, template, data }: EmailPayload = await req.json();

    if (!to || !template) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const templateFn = TEMPLATES[template];
    if (!templateFn) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    const content = templateFn(data);

    // In production, use a real email service (SendGrid, Resend, etc.)
    // For now, log the email
    console.log('📧 Email sent:', { to, subject, template });

    return NextResponse.json({
      success: true,
      message: 'Email queued for sending (demo mode - logged to console)',
      template,
      to,
      preview: content,
    });
  } catch (error: any) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
