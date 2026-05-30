import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');

    const where: Record<string, unknown> = {};
    if (guideId) where.guideId = guideId;

    const badges = await db.badge.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        guideProfile: {
          select: { id: true, bio: true, status: true },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });

    return NextResponse.json({ badges }, { status: 200 });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { guideId, badgeType } = await request.json();

    if (!guideId || !badgeType) {
      return NextResponse.json(
        { error: 'guideId and badgeType are required' },
        { status: 400 }
      );
    }

    const guide = await db.user.findUnique({
      where: { id: guideId },
      include: { guideProfile: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    if (!guide.guideProfile) {
      return NextResponse.json(
        { error: 'User does not have a guide profile' },
        { status: 400 }
      );
    }

    const badge = await db.badge.create({
      data: {
        guideId,
        badgeType,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        guideProfile: {
          select: { id: true, bio: true, status: true },
        },
      },
    });

    return NextResponse.json({ badge }, { status: 201 });
  } catch (error) {
    console.error('Create badge error:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}
