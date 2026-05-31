import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/security/sessions - List active auth sessions for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const sessions = await db.userAuthSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
    });

    // If no sessions in DB, seed some demo sessions
    if (sessions.length === 0) {
      const now = new Date();
      const demoSessions = [
        {
          userId,
          deviceName: 'iPhone 15 Pro',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS 17',
          location: 'Dar es Salaam, TZ',
          ipAddress: '196.138.xxx.xx',
          isCurrent: true,
          lastActive: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
        {
          userId,
          deviceName: 'Chrome on Windows',
          deviceType: 'desktop',
          browser: 'Chrome 120',
          os: 'Windows 11',
          location: 'Dar es Salaam, TZ',
          ipAddress: '196.138.xxx.xx',
          isCurrent: false,
          lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
        {
          userId,
          deviceName: 'Samsung Galaxy S24',
          deviceType: 'mobile',
          browser: 'Chrome Mobile',
          os: 'Android 14',
          location: 'Kariakoo, TZ',
          ipAddress: '196.138.xxx.xx',
          isCurrent: false,
          lastActive: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        },
      ];

      for (const s of demoSessions) {
        await db.userAuthSession.create({ data: s });
      }

      const created = await db.userAuthSession.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { lastActive: 'desc' },
      });

      return NextResponse.json({
        sessions: created.map((s) => ({
          id: s.id,
          device: s.deviceName,
          deviceType: s.deviceType,
          browser: s.browser,
          os: s.os,
          location: s.location,
          lastActive: s.lastActive.toISOString(),
          current: s.isCurrent,
        })),
      });
    }

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        device: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        location: s.location,
        lastActive: s.lastActive.toISOString(),
        current: s.isCurrent,
      })),
    });
  } catch (error) {
    console.error('GET /api/security/sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/security/sessions - Revoke all non-current sessions
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Delete all non-current sessions
    const result = await db.userAuthSession.deleteMany({
      where: {
        userId,
        isCurrent: false,
      },
    });

    return NextResponse.json({
      success: true,
      revokedCount: result.count,
      message: `Revoked ${result.count} session(s)`,
    });
  } catch (error) {
    console.error('POST /api/security/sessions error:', error);
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
