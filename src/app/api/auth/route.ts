import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, email } = await request.json();

    // Support email-based lookup for social login users
    if (!phone && email) {
      const user = await db.user.findFirst({ where: { email } });

      if (user) {
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
      }

      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { phone } });

    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: 'Name is required for new users' },
          { status: 400 }
        );
      }
      user = await db.user.create({
        data: { phone, name, email: email || null },
      });
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

    return NextResponse.json({ user, token }, { status: 200 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
