import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { DEMO_USERS, DEMO_GUIDE_PROFILES, isDemoPhone, db } from '@/lib/demo-data';
import { sanitizePhone, sanitizeEmail, sanitizeString, sanitizeRole } from '@/lib/sanitize';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ── Demo accounts with known passwords (for quick demo access) ──
const DEMO_EMAIL_ACCOUNTS: Record<string, { password: string; id: string; name: string; role: string; phone: string; email: string }> = {
  'seeker@kariako.com': { password: 'demo1234', id: 'demo-seeker-1', name: 'Sarah Johnson', role: 'seeker', phone: '+14155550001', email: 'seeker@kariako.com' },
  'guide@kariako.com': { password: 'demo1234', id: 'demo-guide-1', name: 'Hamisi Juma', role: 'guide', phone: '+255712000001', email: 'guide@kariako.com' },
  'admin@kariako.com': { password: 'demo1234', id: 'demo-admin-1', name: 'Admin User', role: 'admin', phone: '+255700000001', email: 'admin@kariako.com' },
  // Also support @demo.com variants
  'seeker@demo.com': { password: 'demo123', id: 'demo-seeker-1', name: 'Sarah Johnson', role: 'seeker', phone: '+14155550001', email: 'seeker@demo.com' },
  'guide@demo.com': { password: 'demo123', id: 'demo-guide-1', name: 'Hamisi Juma', role: 'guide', phone: '+255712000001', email: 'guide@demo.com' },
  'admin@demo.com': { password: 'demo123', id: 'demo-admin-1', name: 'Admin User', role: 'admin', phone: '+255700000001', email: 'admin@demo.com' },
};

// ── Helper: Set auth cookies ──
async function setAuthCookies(token: string, role: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    cookieStore.set('user_role', role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  } catch {}
}

// ── Helper: Get guide profile for a user ──
async function getGuideProfile(userId: string, role: string) {
  if (role !== 'guide') return null;
  const rawProfile = await db.guideProfile.findUnique({ where: { userId } });
  if (rawProfile) {
    return { ...rawProfile, zones: JSON.parse(rawProfile.zones || '[]'), languages: JSON.parse(rawProfile.languages || '[]') };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateResult = rateLimit(`auth:${clientIp}`, 5, 60 * 1000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.', success: false, retryAfter: Math.ceil((rateResult.resetTime - Date.now()) / 1000) },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rateResult.total), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rateResult.resetTime), 'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { phone, name, email, password, role } = body;

    // ── Input Sanitization ──
    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedRole = sanitizeRole(role);

    // ═══════════════════════════════════════════
    // PATH 1: Email + Password Auth (PRIMARY)
    // ═══════════════════════════════════════════
    if (sanitizedEmail && password) {
      // ── Demo email accounts (no DB required) ──
      const demoAccount = DEMO_EMAIL_ACCOUNTS[sanitizedEmail.toLowerCase()];
      if (demoAccount && password === demoAccount.password) {
        const user = { id: demoAccount.id, phone: demoAccount.phone, email: demoAccount.email, name: sanitizedName || demoAccount.name, role: (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : demoAccount.role, languagePref: 'sw' as const, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const token = `demo_token_${user.id}_${Date.now()}`;
        await setAuthCookies(token, user.role);
        const guideProfile = user.role === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
      }

      // ── Database-backed email+password auth ──
      let dbAvailable = true;
      try { await db.$queryRaw`SELECT 1`; } catch { dbAvailable = false; }

      if (dbAvailable) {
        // Check if user exists by email
        let user = await db.user.findFirst({ where: { email: sanitizedEmail } });

        if (user) {
          // ── LOGIN: Verify password ──
          if (!user.passwordHash) {
            return NextResponse.json({ error: 'This account uses social login. Please sign in with Google or Facebook.' }, { status: 401 });
          }
          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          if (!passwordMatch) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
          }

          // Update role if provided and different
          if (sanitizedRole && user.role !== sanitizedRole) {
            user = await db.user.update({ where: { id: user.id }, data: { role: sanitizedRole } });
            if (sanitizedRole === 'guide') {
              const existingProfile = await db.guideProfile.findUnique({ where: { userId: user.id } });
              if (!existingProfile) {
                await db.guideProfile.create({ data: { userId: user.id, bio: '', status: 'pending', zones: [], languages: ['sw'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } });
              }
            }
          }

          const token = `token_${user.id}_${Date.now()}`;
          await setAuthCookies(token, user.role);
          const guideProfile = await getGuideProfile(user.id, user.role);
          let badges: { id: string; guideId: string; badgeType: string; awardedAt: string }[] = [];
          if (user.role === 'guide' && guideProfile) {
            badges = await db.badge.findMany({ where: { guideId: (guideProfile as { id: string }).id } });
          }
          return NextResponse.json({ user, token, guideProfile, badges, isNewUser: false }, { status: 200 });
        } else {
          // ── REGISTER: Create new user with hashed password ──
          const saltRounds = 12;
          const passwordHash = await bcrypt.hash(password, saltRounds);
          const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
          // Generate a unique placeholder phone for the user
          const placeholderPhone = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          user = await db.user.create({
            data: {
              phone: placeholderPhone,
              email: sanitizedEmail,
              passwordHash,
              name: sanitizedName || sanitizedEmail.split('@')[0],
              role: userRole,
            },
          });

          if (userRole === 'guide') {
            await db.guideProfile.create({ data: { userId: user.id, bio: '', status: 'pending', zones: [], languages: ['sw'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } });
          }

          const token = `token_${user.id}_${Date.now()}`;
          await setAuthCookies(token, user.role);
          const guideProfile = await getGuideProfile(user.id, user.role);
          return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: true }, { status: 200 });
        }
      } else {
        // DB unavailable: create temporary user from email
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
        const user = { id: tempId, phone: `temp_${Date.now()}`, email: sanitizedEmail, name: sanitizedName || sanitizedEmail.split('@')[0], role: userRole, languagePref: 'sw' as const, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const token = `temp_token_${tempId}_${Date.now()}`;
        await setAuthCookies(token, userRole);
        const guideProfile = userRole === 'guide' ? { id: `gp-${tempId}`, userId: tempId, bio: '', status: 'pending', zones: ['zone-electronics', 'zone-fabrics'], languages: ['sw', 'en'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: true }, { status: 200 });
      }
    }

    // ═══════════════════════════════════════════
    // PATH 2: Phone-based Auth (LEGACY/DEMO)
    // ═══════════════════════════════════════════
    if (sanitizedPhone && isDemoPhone(phone)) {
      const demoUser = DEMO_USERS[phone];
      const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : demoUser.role;
      const user = { ...demoUser, role: userRole, name: sanitizedName || demoUser.name };
      const token = `demo_token_${user.id}_${Date.now()}`;
      await setAuthCookies(token, userRole);
      const guideProfile = userRole === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;
      return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
    }

    // Email-only lookup (for social login sync)
    if (!sanitizedPhone && sanitizedEmail && !password) {
      let dbAvailable = true;
      try { await db.$queryRaw`SELECT 1`; } catch { dbAvailable = false; }

      if (dbAvailable) {
        const user = await db.user.findFirst({ where: { email: sanitizedEmail } });
        if (user) {
          let updatedUser = user;
          if (sanitizedRole && user.role !== sanitizedRole) {
            updatedUser = await db.user.update({ where: { id: user.id }, data: { role: sanitizedRole } });
          }
          const token = `token_${updatedUser.id}_${Date.now()}`;
          await setAuthCookies(token, updatedUser.role);
          const guideProfile = await getGuideProfile(updatedUser.id, updatedUser.role);
          return NextResponse.json({ user: updatedUser, token, guideProfile }, { status: 200 });
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Phone-based DB auth
    if (sanitizedPhone) {
      let dbAvailable = true;
      try { await db.$queryRaw`SELECT 1`; } catch { dbAvailable = false; }

      if (!dbAvailable) {
        const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const user = { id: tempId, phone: sanitizedPhone, name: sanitizedName || sanitizedPhone.replace(/^\+/, ''), email: sanitizedEmail || null, role: userRole, languagePref: 'sw' as const, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const token = `temp_token_${tempId}_${Date.now()}`;
        await setAuthCookies(token, userRole);
        const guideProfile = userRole === 'guide' ? { id: `gp-${tempId}`, userId: tempId, bio: '', status: 'pending', zones: ['zone-electronics', 'zone-fabrics'], languages: ['sw', 'en'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: true }, { status: 200 });
      }

      let user = await db.user.findUnique({ where: { phone: sanitizedPhone } });
      let isNewUser = false;

      if (!user) {
        const userName = sanitizedName || sanitizedPhone.replace(/^\+/, '');
        const userRole = (sanitizedRole === 'guide' || sanitizedRole === 'admin') ? sanitizedRole : 'seeker';
        user = await db.user.create({ data: { phone: sanitizedPhone, name: userName, email: sanitizedEmail || null, role: userRole } });
        isNewUser = true;
        if (userRole === 'guide') {
          await db.guideProfile.create({ data: { userId: user.id, bio: '', status: 'pending', zones: [], languages: ['sw'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } });
        }
      } else {
        if (sanitizedRole && user.role !== sanitizedRole) {
          user = await db.user.update({ where: { id: user.id }, data: { role: sanitizedRole } });
          if (sanitizedRole === 'guide') {
            const existingProfile = await db.guideProfile.findUnique({ where: { userId: user.id } });
            if (!existingProfile) {
              await db.guideProfile.create({ data: { userId: user.id, bio: '', status: 'pending', zones: [], languages: ['sw'], avgRating: 0, totalSessions: 0, isOnline: false, currentStatus: 'offline' } });
            }
          }
        }
      }

      const token = `token_${user.id}_${Date.now()}`;
      await setAuthCookies(token, user.role);
      const guideProfile = await getGuideProfile(user.id, user.role);
      let badges: { id: string; guideId: string; badgeType: string; awardedAt: string }[] = [];
      if (user.role === 'guide' && guideProfile) {
        badges = await db.badge.findMany({ where: { guideId: (guideProfile as { id: string }).id } });
      }
      return NextResponse.json({ user, token, guideProfile, badges, isNewUser }, { status: 200 });
    }

    return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    // Last resort: demo fallback
    try {
      const body = await request.clone().json();
      if (body.phone && isDemoPhone(body.phone)) {
        const demoUser = DEMO_USERS[body.phone];
        const userRole = (body.role === 'guide' || body.role === 'admin') ? body.role : demoUser.role;
        const user = { ...demoUser, role: userRole, name: body.name || demoUser.name };
        const token = `demo_token_${user.id}_${Date.now()}`;
        await setAuthCookies(token, userRole);
        const guideProfile = userRole === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
      }
      // Also check demo email accounts
      if (body.email && DEMO_EMAIL_ACCOUNTS[body.email.toLowerCase()] && body.password === DEMO_EMAIL_ACCOUNTS[body.email.toLowerCase()].password) {
        const demo = DEMO_EMAIL_ACCOUNTS[body.email.toLowerCase()];
        const user = { id: demo.id, phone: demo.phone, email: demo.email, name: body.name || demo.name, role: (body.role === 'guide' || body.role === 'admin') ? body.role : demo.role, languagePref: 'sw' as const, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const token = `demo_token_${user.id}_${Date.now()}`;
        await setAuthCookies(token, user.role);
        const guideProfile = user.role === 'guide' ? (DEMO_GUIDE_PROFILES[user.id] || DEMO_GUIDE_PROFILES['demo-guide-1']) : null;
        return NextResponse.json({ user, token, guideProfile, badges: [], isNewUser: false }, { status: 200 });
      }
    } catch {}
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
