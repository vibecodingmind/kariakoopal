import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const where = role ? { role } : {};

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, languagePref, avatarUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(languagePref !== undefined && { languagePref }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
