import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/rate-limit';
import { sanitizeEmail } from '@/lib/sanitize';

// ── GET /api/security - Return security settings ──
export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const security = {
      twoFactorEnabled: false,
      pinEnabled: false,
      loginAttempts: 0,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      lastLoginIp: '196.138.xxx.xx',
      securityScore: 45,
      sessionTimeout: 30, // minutes
      emailVerified: true,
      phoneVerified: true,
      activeSessions: [
        { id: 's1', device: 'iPhone 15 Pro', location: 'Dar es Salaam', lastActive: 'Now', current: true },
        { id: 's2', device: 'Chrome on Windows', location: 'Dar es Salaam', lastActive: '2 hours ago', current: false },
      ],
      recentActivity: [
        { type: 'login', description: 'Logged in from iPhone', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { type: 'password_change', description: 'Password changed', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { type: 'payment', description: 'Payment of TZS 45,000', timestamp: new Date(Date.now() - 172800000).toISOString() },
      ],
    };

    return NextResponse.json({ security });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
  }
}

// ── PUT /api/security - Update security settings ──
export async function PUT(req: NextRequest) {
  try {
    // Rate limit
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { twoFactorEnabled, pinEnabled, sessionTimeout, email } = body;

    // Validate email if provided
    if (email && !sanitizeEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate session timeout
    if (sessionTimeout !== undefined && (sessionTimeout < 5 || sessionTimeout > 120)) {
      return NextResponse.json({ error: 'Session timeout must be between 5 and 120 minutes' }, { status: 400 });
    }

    // Simulate update
    let securityScore = 45;
    if (twoFactorEnabled) securityScore += 25;
    if (pinEnabled) securityScore += 20;
    if (sessionTimeout && sessionTimeout <= 15) securityScore += 5;

    return NextResponse.json({
      success: true,
      security: {
        twoFactorEnabled: twoFactorEnabled ?? false,
        pinEnabled: pinEnabled ?? false,
        sessionTimeout: sessionTimeout ?? 30,
        securityScore: Math.min(100, securityScore),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// ── POST /api/security - Security actions (enable 2FA, verify, etc.) ──
export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'enable_2fa':
        return NextResponse.json({
          success: true,
          message: '2FA setup initiated. Verification code sent to your phone.',
          qrCodeUrl: 'otpauth://totp/KariakoGuide:user@demo.com?secret=DEMO_SECRET&issuer=KariakoGuide',
        });

      case 'verify_2fa':
        return NextResponse.json({
          success: true,
          message: '2FA enabled successfully.',
        });

      case 'disable_2fa':
        return NextResponse.json({
          success: true,
          message: '2FA disabled.',
        });

      case 'enable_pin':
        return NextResponse.json({
          success: true,
          message: 'PIN setup initiated.',
        });

      case 'revoke_session': {
        const { sessionId } = body;
        return NextResponse.json({
          success: true,
          message: `Session ${sessionId || 'unknown'} revoked.`,
        });
      }

      case 'revoke_all_sessions':
        return NextResponse.json({
          success: true,
          message: 'All other sessions revoked.',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
