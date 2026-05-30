import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { provider, providerId, email, name, avatarUrl } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // For social login, we need at least an email or a provider+providerId combo
    if (!email && !providerId) {
      return NextResponse.json(
        { error: 'Email or provider ID is required' },
        { status: 400 }
      );
    }

    let user;

    if (email) {
      // Try to find user by email first
      user = await db.user.findFirst({ where: { email } });
    }

    if (!user && providerId) {
      // Try to find by phone pattern used for social users
      const socialPhone = `social_${provider}_${providerId}`;
      user = await db.user.findUnique({ where: { phone: socialPhone } });
    }

    if (!user) {
      // Create a new user for social login
      const phone = email
        ? `social_${provider}_${Date.now()}`
        : `social_${provider}_${providerId}_${Date.now()}`;

      user = await db.user.create({
        data: {
          email: email || null,
          phone,
          name: name || (email ? email.split('@')[0] : `${provider} User`),
          avatarUrl: avatarUrl || null,
          role: 'seeker',
        },
      });
    } else if (email && !user.email) {
      // Update existing user with email if they didn't have one
      user = await db.user.update({
        where: { id: user.id },
        data: {
          email,
          ...(avatarUrl && !user.avatarUrl ? { avatarUrl } : {}),
          ...(name && name !== user.name ? { name } : {}),
        },
      });
    }

    // Set the same auth_token cookie as the existing system
    const token = `token_${user.id}_${Date.now()}`;

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ user, token }, { status: 200 });
  } catch (error) {
    console.error('Social auth error:', error);
    return NextResponse.json({ error: 'Social authentication failed' }, { status: 500 });
  }
}
