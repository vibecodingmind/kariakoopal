import { NextRequest, NextResponse } from 'next/server';

// ── GET /api/security - Return security settings ──
export async function GET(req: NextRequest) {
  try {
    const security = {
      twoFactorEnabled: false,
      pinEnabled: false,
      loginAttempts: 0,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      lastLoginIp: '196.138.xxx.xx',
      securityScore: 45,
      activeSessions: [
        { id: 's1', device: 'iPhone 15 Pro', location: 'Dar es Salaam', lastActive: 'Now', current: true },
        { id: 's2', device: 'Chrome on Windows', location: 'Dar es Salaam', lastActive: '2 hours ago', current: false },
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
    const body = await req.json();
    const { twoFactorEnabled, pinEnabled } = body;

    // Simulate update
    return NextResponse.json({
      success: true,
      security: {
        twoFactorEnabled: twoFactorEnabled ?? false,
        pinEnabled: pinEnabled ?? false,
        securityScore: 45 + (twoFactorEnabled ? 25 : 0) + (pinEnabled ? 20 : 0),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
