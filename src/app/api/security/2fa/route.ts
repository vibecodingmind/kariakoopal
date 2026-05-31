import { NextRequest, NextResponse } from 'next/server';
import { generate2FASecret, verify2FACode, generateBackupCodes, getOTPAuthURI } from '@/lib/2fa';

// 2FA management endpoint
// GET: Check 2FA status for a user
// POST: Enable 2FA (generate secret + backup codes)
// DELETE: Disable 2FA (verify code first)

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/db');
    const security = await db.userSecurity.findUnique({ where: { userId } });

    return NextResponse.json({
      enabled: security?.twoFactorEnabled || false,
      backupCodesRemaining: security?.twoFactorSecret ? 1 : 0, // Don't expose actual codes
    });
  } catch {
    // Demo mode fallback
    return NextResponse.json({ enabled: false, backupCodesRemaining: 0, demoMode: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const secret = generate2FASecret();
    const backupCodes = generateBackupCodes(8);
    const otpauthUri = getOTPAuthURI(secret, email || 'user@kariako.com');

    try {
      const { db } = await import('@/lib/db');
      await db.userSecurity.upsert({
        where: { userId },
        update: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          pinHash: JSON.stringify(backupCodes), // Store backup codes temporarily
        },
        create: {
          userId,
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          pinHash: JSON.stringify(backupCodes),
        },
      });
    } catch {
      // Demo mode — just return the data without persisting
    }

    return NextResponse.json({
      success: true,
      secret,
      backupCodes,
      otpauthUri,
      demoMode: false,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, code } = await req.json();
    if (!userId || !code) {
      return NextResponse.json({ error: 'userId and code are required' }, { status: 400 });
    }

    try {
      const { db } = await import('@/lib/db');
      const security = await db.userSecurity.findUnique({ where: { userId } });

      if (!security?.twoFactorEnabled || !security.twoFactorSecret) {
        return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
      }

      // Verify the code before disabling
      if (!verify2FACode(security.twoFactorSecret, code)) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
      }

      await db.userSecurity.update({
        where: { userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
    } catch {
      // Demo mode
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
