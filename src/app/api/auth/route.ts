import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USERS, DEMO_GUIDE_PROFILES, isDemoPhone, db } from '@/lib/demo-data';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, email, role } = await request.json();

    // ── Demo Mode Fallback (no database required) ──
    // Demo users are served directly without hitting the database
    if (phone && isDemoPhone(phone)) {
      const demoUser = DEMO_USERS[phone];
      const userRole = (role === 'guide' || role === 'admin') ? role : demoUser.role;
      const user = { ...demoUser, role: userRole, name: name || demoUser.name };

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
      if (phone) {
        const userRole = (role === 'guide' || role === 'admin') ? role : 'seeker';
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const user = {
          id: tempId,
          phone,
          name: name || phone.replace(/^\+/, ''),
          email: email || null,
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
    if (!phone && email) {
      const user = await db.user.findFirst({ where: { email } });

      if (user) {
        let updatedUser = user;
        if (role && user.role !== role && (role === 'seeker' || role === 'guide' || role === 'admin')) {
          updatedUser = await db.user.update({
            where: { id: user.id },
            data: { role },
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

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      const userName = name || phone.replace(/^\+/, '');
      const userRole = (role === 'guide' || role === 'admin') ? role : 'seeker';
      user = await db.user.create({
        data: { phone, name: userName, email: email || null, role: userRole },
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
      if (role && user.role !== role && (role === 'seeker' || role === 'guide' || role === 'admin')) {
        user = await db.user.update({
          where: { id: user.id },
          data: { role },
        });

        if (role === 'guide') {
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
