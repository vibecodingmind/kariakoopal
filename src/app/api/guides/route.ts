import { NextRequest, NextResponse } from 'next/server';
import { DEMO_GUIDES, db } from '@/lib/demo-data';

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

    if (guides.length === 0) {
      let filtered = DEMO_GUIDES;
      if (status) filtered = filtered.filter(g => g.guideProfile.status === status);
      return NextResponse.json({
        guides: filtered.map(g => ({
          ...g.guideProfile,
          user: g.user,
          badges: [],
        })),
      }, { status: 200 });
    }

    return NextResponse.json({ guides }, { status: 200 });
  } catch (error) {
    console.error('Get guides error:', error);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    let filtered = DEMO_GUIDES;
    if (status) filtered = filtered.filter(g => g.guideProfile.status === status);
    return NextResponse.json({
      guides: filtered.map(g => ({
        ...g.guideProfile,
        user: g.user,
        badges: [],
      })),
    }, { status: 200 });
  }
}
