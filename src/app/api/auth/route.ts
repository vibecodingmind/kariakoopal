import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, email, role } = await request.json();

    // Support email-based lookup for social login users
    if (!phone && email) {
      const user = await db.user.findFirst({ where: { email } });

      if (user) {
        // If role is provided and differs, update it
        let updatedUser = user;
        if (role && user.role !== role && (role === 'seeker' || role === 'guide' || role === 'admin')) {
          updatedUser = await db.user.update({
            where: { id: user.id },
            data: { role },
          });
        }

        const token = `token_${updatedUser.id}_${Date.now()}`;

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        // Also fetch guide profile if user is a guide
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
      // Auto-create user for login flow (demo mode / phone auth)
      const userName = name || phone.replace(/^\+/, '');
      const userRole = (role === 'guide' || role === 'admin') ? role : 'seeker';
      user = await db.user.create({
        data: { phone, name: userName, email: email || null, role: userRole },
      });
      isNewUser = true;

      // If new guide, create a pending guide profile
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
      // Update role if provided and different
      if (role && user.role !== role && (role === 'seeker' || role === 'guide' || role === 'admin')) {
        user = await db.user.update({
          where: { id: user.id },
          data: { role },
        });

        // If upgrading to guide, create guide profile if not exists
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

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Fetch guide profile if user is a guide
    let guideProfile: Record<string, unknown> | null = null;
    if (user.role === 'guide') {
      const rawProfile = await db.guideProfile.findUnique({
        where: { userId: user.id },
      });
      if (rawProfile) {
        // Parse JSON string fields to arrays for frontend compatibility
        guideProfile = {
          ...rawProfile,
          zones: JSON.parse(rawProfile.zones || '[]'),
          languages: JSON.parse(rawProfile.languages || '[]'),
        };
      }
    }

    // Fetch badges if guide
    let badges: { id: string; guideId: string; badgeType: string; awardedAt: string }[] = [];
    if (user.role === 'guide' && guideProfile) {
      badges = await db.badge.findMany({
        where: { guideId: (guideProfile as { id: string }).id },
      });
    }

    return NextResponse.json({ user, token, guideProfile, badges, isNewUser }, { status: 200 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
