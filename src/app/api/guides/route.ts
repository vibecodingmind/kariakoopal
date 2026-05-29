import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const guides = await db.guideProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            languagePref: true,
          },
        },
        badges: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ guides }, { status: 200 });
  } catch (error) {
    console.error('Get guides error:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}
