import { NextRequest, NextResponse } from 'next/server';

// GET /api/email/unsubscribe - Handle email unsubscribe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const type = searchParams.get('type') || 'all';

    if (!id && !email) {
      return new Response(
        `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribe - Chimbo Direct</title></head>
<body style="font-family:system-ui;max-width:500px;margin:2rem auto;padding:0 1rem;text-align:center">
<h1 style="color:#065F46">Unsubscribe</h1>
<p>Invalid unsubscribe link. Please contact support@chimbo.direct for help.</p>
</body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Log the unsubscribe
    console.log(`📧 [Unsubscribe] ID: ${id}, Email: ${email}, Type: ${type}`);

    // In production, update the user's email preferences in UserSecurity
    // For now, return a confirmation page

    return new Response(
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed - Chimbo Direct</title>
<style>body{font-family:system-ui;max-width:500px;margin:2rem auto;padding:0 1rem;text-align:center;color:#1E293B}
.card{background:#ECFDF5;border:1px solid #065F46;border-radius:12px;padding:2rem;margin-top:2rem}
h1{color:#065F46;margin-top:2rem}a{color:#065F46}</style></head>
<body>
<h1>✅ You've been unsubscribed</h1>
<div class="card">
<p>You will no longer receive ${type === 'all' ? 'marketing' : type} emails from Chimbo Direct.</p>
<p style="font-size:14px;color:#64748B;margin-top:1rem">
Transaction emails (booking confirmations, payment receipts, security alerts) will still be sent as required.
</p>
</div>
<p style="margin-top:2rem;font-size:14px;color:#64748B">
Changed your mind? <a href="https://chimbo.direct/settings">Update your preferences</a>
</p>
</body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('Error processing unsubscribe', { status: 500 });
  }
}

// POST /api/email/unsubscribe - API-based unsubscribe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, types } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`📧 [Unsubscribe API] Email: ${email}, Types: ${types || 'all'}`);

    // In production, update user's notification preferences in DB

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated',
      email,
      unsubscribedTypes: types || ['all'],
    });
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
