import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const guideId = searchParams.get('guideId');
    const isPublic = searchParams.get('isPublic');

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (guideId) where.guideId = guideId;
    if (isPublic !== null && isPublic !== undefined) where.isPublic = isPublic === 'true';

    const stories = await db.marketStory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: stories });
  } catch (error) {
    console.error('Get market stories error:', error);
    return NextResponse.json({ error: 'Failed to fetch market stories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guideId, vendorId, zoneId, title, content, audioUrl, tags, isPublic } = body;

    if (!guideId || !zoneId || !title || !content) {
      return NextResponse.json({ error: 'guideId, zoneId, title, and content are required' }, { status: 400 });
    }

    const story = await db.marketStory.create({
      data: {
        guideId,
        vendorId: vendorId ?? null,
        zoneId,
        title,
        content,
        audioUrl: audioUrl ?? null,
        tags: tags ?? '[]',
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json({ item: story }, { status: 201 });
  } catch (error) {
    console.error('Create market story error:', error);
    return NextResponse.json({ error: 'Failed to create market story' }, { status: 500 });
  }
}
