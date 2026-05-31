import { NextResponse } from 'next/server';

// ── Demo security data ──
const demoSecurity = {
  id: 'sec1',
  userId: 'demo',
  twoFactorEnabled: false,
  twoFactorSecret: null,
  pinEnabled: false,
  pinHash: null,
  loginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  lastLoginIp: '196.44.xxx.xxx',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
};

const demoSessions = [
  { id: 'sess1', device: 'iPhone 15 Pro', browser: 'Safari', ip: '196.44.xxx.xxx', lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(), current: true },
  { id: 'sess2', device: 'Samsung Galaxy S24', browser: 'Chrome', ip: '154.118.xxx.xxx', lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), current: false },
  { id: 'sess3', device: 'Windows PC', browser: 'Firefox', ip: '41.59.xxx.xxx', lastActive: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), current: false },
];

const demoLoginHistory = [
  { id: 'lh1', ip: '196.44.xxx.xxx', device: 'iPhone 15 Pro', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), success: true },
  { id: 'lh2', ip: '154.118.xxx.xxx', device: 'Samsung Galaxy S24', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), success: true },
  { id: 'lh3', ip: '103.21.xxx.xxx', device: 'Unknown', time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), success: false },
  { id: 'lh4', ip: '196.44.xxx.xxx', device: 'iPhone 15 Pro', time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), success: true },
  { id: 'lh5', ip: '41.59.xxx.xxx', device: 'Windows PC', time: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), success: true },
];

// GET /api/security - Return security settings
export async function GET() {
  // Calculate security score
  let score = 30; // Base score for having an account
  if (demoSecurity.twoFactorEnabled) score += 30;
  if (demoSecurity.pinEnabled) score += 20;
  if (demoSecurity.loginAttempts === 0) score += 10;
  if (demoSecurity.lastLoginAt) score += 10;
  score = Math.min(score, 100);

  return NextResponse.json({
    security: demoSecurity,
    sessions: demoSessions,
    loginHistory: demoLoginHistory,
    securityScore: score,
    suggestions: [
      { id: 's1', text: 'Enable Two-Factor Authentication for maximum security', priority: 'high', done: demoSecurity.twoFactorEnabled },
      { id: 's2', text: 'Set up a PIN lock for transactions', priority: 'medium', done: demoSecurity.pinEnabled },
      { id: 's3', text: 'Remove unused active sessions', priority: 'low', done: demoSessions.length <= 1 },
    ],
  });
}

// PUT /api/security - Update security settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { twoFactorEnabled, pinEnabled } = body;

    const updated = { ...demoSecurity };

    if (typeof twoFactorEnabled === 'boolean') {
      updated.twoFactorEnabled = twoFactorEnabled;
      if (twoFactorEnabled) {
        updated.twoFactorSecret = 'DEMO_SECRET_' + Date.now();
      } else {
        updated.twoFactorSecret = null;
      }
    }

    if (typeof pinEnabled === 'boolean') {
      updated.pinEnabled = pinEnabled;
      if (pinEnabled) {
        updated.pinHash = 'DEMO_PIN_HASH_' + Date.now();
      } else {
        updated.pinHash = null;
      }
    }

    updated.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      security: updated,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
