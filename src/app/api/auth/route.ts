import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USERS, DEMO_GUIDE_PROFILES, isDemoPhone, db } from '@/lib/demo-data';
import { sanitizePhone, sanitizeEmail, sanitizeString, sanitizeRole } from '@/lib/sanitize';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateResult = rateLimit(`auth:${clientIp}`, 5, 60 * 1000); // 5 attempts per minute per IP
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          success: false,
          retryAfter: Math.ceil((rateResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateResult.total),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateResult.resetTime),
            'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { phone, name, email, role } = body;

    // ── Input Sanitization ──
    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedRole = sanitizeRole(role);

    // ── Demo Mode Fallback (no database required) ──
    // Demo users are served directly without hitting the database
    if (sanitizedPhone && isDemoPhone(phone)) {
      const demoUser = DEMO_USERS[phone];
      const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : demoUser.role;
      const user = { ...demoUser, role: userRole, name: sanitizedName || demoUser.name };

      const token = `demo_token_${user.id}_${Date.now()}`;

      try {
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
        cookieStore.set('user_role', userRole, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      } catch {}

      const guideProfile = userRole === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;

      return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
    }

    // ── Database-backed Auth ──
    // Try database, fall back to temporary user if DB unavailable
    let dbAvailable = true;
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbAvailable = false;
    }

    if (!dbAvailable) {
      // If no database available and not a demo user, create a temporary in-memory user
      if (sanitizedPhone) {
        const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const user = {
          id: tempId,
          phone: sanitizedPhone,
          name: sanitizedName || sanitizedPhone.replace(/^\+/, ''),
          email: sanitizedEmail || null,
          role: userRole,
          languagePref: 'sw' as const,
          avatarUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const token = `temp_token_${tempId}_${Date.now()}`;

        try {
          const cookieStore = await cookies();
          cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          });
          cookieStore.set('user_role', userRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          });
        } catch {}

        const guideProfile = userRole === 'guide' ? {
          id: `gp-${tempId}`,
          userId: tempId,
          bio: '',
          status: 'pending',
          zones: ['zone-electronics', 'zone-fabrics'],
          languages: ['sw', 'en'],
          avgRating: 0,
          totalSessions: 0,
          isOnline: false,
          currentStatus: 'offline',
        } : null;

        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: true }, { status: 200 });
      }

      return NextResponse.json({ error: 'Database unavailable and no phone provided' }, { status: 503 });
    }

    // Support email-based lookup for social login users
    if (!sanitizedPhone && sanitizedEmail) {
      const user = await db.user.findFirst({ where: { email: sanitizedEmail } });

      if (user) {
        let updatedUser = user;
        if (sanitizedRole && user.role !== sanitizedRole) {
          updatedUser = await db.user.update({
            where: { id: user.id },
            data: { role: sanitizedRole },
          });
        }

        const token = `token_${updatedUser.id}_${Date.now()}`;

        try {
          const cookieStore = await cookies();
          cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          });
          cookieStore.set('user_role', updatedUser.role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          });
        } catch {}

        let guideProfile: Record<string, unknown> | null = null;
        if (updatedUser.role === 'guide') {
          const rawProfile = await db.guideProfile.findUnique({
            where: { userId: updatedUser.id },
          });
          if (rawProfile) {
            guideProfile = {
              ...rawProfile,
              zones: JSON.parse(rawProfile.zones || '[]'),
              languages: JSON.parse(rawProfile.languages || '[]'),
            };
          }
        }

        return NextResponse.json({ user: updatedUser, token, guideProfile }, { status: 200 });
      }

      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!sanitizedPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { phone: sanitizedPhone } });
    let isNewUser = false;

    if (!user) {
      const userName = sanitizedName || sanitizedPhone.replace(/^\+/, '');
      const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
      user = await db.user.create({
        data: { phone: sanitizedPhone, name: userName, email: sanitizedEmail || null, role: userRole },
      });
      isNewUser = true;

      if (userRole === 'guide') {
        await db.guideProfile.create({
          data: {
            userId: user.id,
            bio: '',
            status: 'pending',
            zones: [],
            languages: ['sw'],
            avgRating: 0,
            totalSessions: 0,
            isOnline: false,
            currentStatus: 'offline',
          },
        });
      }
    } else {
      if (sanitizedRole && user.role !== sanitizedRole) {
        user = await db.user.update({
          where: { id: user.id },
          data: { role: sanitizedRole },
        });

        if (sanitizedRole === 'guide') {
          const existingProfile = await db.guideProfile.findUnique({
            where: { userId: user.id },
          });
          if (!existingProfile) {
            await db.guideProfile.create({
              data: {
                userId: user.id,
                bio: '',
                status: 'pending',
                zones: [],
                languages: ['sw'],
                avgRating: 0,
                totalSessions: 0,
                isOnline: false,
                currentStatus: 'offline',
              },
            });
          }
        }
      }
    }

    const token = `token_${user.id}_${Date.now()}`;

    try {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      cookieStore.set('user_role', user.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    } catch {}

    let guideProfile: Record<string, unknown> | null = null;
    if (user.role === 'guide') {
      const rawProfile = await db.guideProfile.findUnique({
        where: { userId: user.id },
      });
      if (rawProfile) {
        guideProfile = {
          ...rawProfile,
          zones: JSON.parse(rawProfile.zones || '[]'),
          languages: JSON.parse(rawProfile.languages || '[]'),
        };
      }
    }

    let badges: { id: string; guideId: string; badgeType: string; awardedAt: string }[] = [];
    if (user.role === 'guide' && guideProfile) {
      badges = await db.badge.findMany({
        where: { guideId: (guideProfile as { id: string }).id },
      });
    }

    return NextResponse.json({ user, token, guideProfile, badges, isNewUser }, { status: 200 });
  } catch (error) {
    console.error('Auth error:', error);

    // Last resort: if it's a demo phone number, return demo data even on error
    try {
      const body = await request.clone().json();
      if (body.phone && isDemoPhone(body.phone)) {
        const demoUser = DEMO_USERS[body.phone];
        const userRole = (body.role === 'guide' || body.role === 'admin') ? body.role : demoUser.role;
        const user = { ...demoUser, role: userRole, name: body.name || demoUser.name };
        const token = `demo_token_${user.id}_${Date.now()}`;
        const guideProfile = userRole === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
      }
    } catch {}

    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
