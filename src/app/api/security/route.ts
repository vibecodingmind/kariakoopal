import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimiters } from '@/lib/rate-limit';
import { sanitizeEmail } from '@/lib/sanitize';

// ── GET /api/security - Return security settings from DB ──
export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const security = await db.userSecurity.findUnique({
      where: { userId },
      include: {
        authSessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { lastActive: 'desc' },
        },
      },
    });

    if (!security) {
      // Return defaults if no security record exists yet
      return NextResponse.json({
        security: {
          twoFactorEnabled: false,
          pinEnabled: false,
          loginAttempts: 0,
          lastLoginAt: null,
          lastLoginIp: null,
          securityScore: 45,
          sessionTimeout: 30,
          profileVisible: true,
          showPhone: false,
          showEmail: false,
          activeSessions: [],
        },
      });
    }

    // Calculate security score
    let securityScore = 45;
    if (security.twoFactorEnabled) securityScore += 25;
    if (security.pinEnabled) securityScore += 20;
    if (security.sessionTimeout <= 15) securityScore += 5;
    if (security.profileVisible) securityScore += 5;

    const activeSessions = security.authSessions.map((s) => ({
      id: s.id,
      device: s.deviceName,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      location: s.location,
      lastActive: s.lastActive.toISOString(),
      current: s.isCurrent,
    }));

    return NextResponse.json({
      security: {
        twoFactorEnabled: security.twoFactorEnabled,
        pinEnabled: security.pinEnabled,
        loginAttempts: security.loginAttempts,
        lastLoginAt: security.lastLoginAt?.toISOString() || null,
        lastLoginIp: security.lastLoginIp,
        securityScore: Math.min(100, securityScore),
        sessionTimeout: security.sessionTimeout,
        profileVisible: security.profileVisible,
        showPhone: security.showPhone,
        showEmail: security.showEmail,
        activeSessions,
      },
    });
  } catch (error) {
    console.error('GET /api/security error:', error);
    return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
  }
}

// ── PUT /api/security - Update security settings in DB ──
export async function PUT(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiters.auth(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const {
      userId,
      twoFactorEnabled,
      pinEnabled,
      sessionTimeout,
      email,
      profileVisible,
      showPhone,
      showEmail,
      pinHash,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate email if provided
    if (email && !sanitizeEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate session timeout
    if (sessionTimeout !== undefined && (sessionTimeout < 5 || sessionTimeout > 120)) {
      return NextResponse.json({ error: 'Session timeout must be between 5 and 120 minutes' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
    if (pinEnabled !== undefined) updateData.pinEnabled = pinEnabled;
    if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout;
    if (profileVisible !== undefined) updateData.profileVisible = profileVisible;
    if (showPhone !== undefined) updateData.showPhone = showPhone;
    if (showEmail !== undefined) updateData.showEmail = showEmail;
    if (pinHash !== undefined) updateData.pinHash = pinHash;

    const security = await db.userSecurity.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    // Calculate security score
    let securityScore = 45;
    if (security.twoFactorEnabled) securityScore += 25;
    if (security.pinEnabled) securityScore += 20;
    if (security.sessionTimeout <= 15) securityScore += 5;
    if (security.profileVisible) securityScore += 5;

    return NextResponse.json({
      success: true,
      security: {
        twoFactorEnabled: security.twoFactorEnabled,
        pinEnabled: security.pinEnabled,
        sessionTimeout: security.sessionTimeout,
        profileVisible: security.profileVisible,
        showPhone: security.showPhone,
        showEmail: security.showEmail,
        securityScore: Math.min(100, securityScore),
      },
    });
  } catch (error) {
    console.error('PUT /api/security error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
