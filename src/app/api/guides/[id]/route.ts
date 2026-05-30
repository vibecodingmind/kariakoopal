import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guide = await db.guideProfile.findUnique({
      where: { id },
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
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide }, { status: 200 });
  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { bio, zones, languages, status } = await request.json();

    const guide = await db.guideProfile.findUnique({ where: { id } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const updated = await db.guideProfile.update({
      where: { id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(zones !== undefined && { zones: JSON.stringify(zones) }),
        ...(languages !== undefined && { languages: JSON.stringify(languages) }),
        ...(status !== undefined && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        badges: true,
      },
    });

    return NextResponse.json({ guide: updated }, { status: 200 });
  } catch (error) {
    console.error('Update guide error:', error);
    return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
  }
}
