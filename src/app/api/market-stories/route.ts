import { NextResponse } from 'next/server';
import { getDbOrNull } from '@/lib/demo-data';

const DEMO_STORIES = [
  { id: 'ms1', guideId: 'demo-guide-1', vendorId: 'v1', zoneId: 'zone-electronics', title: 'The Phone Repair Guru of Stall A-12', content: 'Zaki has been fixing phones in Kariakoo for 15 years. His secret? He learned from his father who repaired radios in the 1970s. Today, he can fix any smartphone screen in under 30 minutes — and his prices are always fair because he sources parts directly from Dubai.', audioUrl: null, tags: '["electronics","repair","insider"]', isPublic: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ms2', guideId: 'demo-guide-2', vendorId: 'v2', zoneId: 'zone-fabrics', title: 'The Secret Language of Kanga', content: 'Every kanga pattern tells a story. The jina (message) printed on the border carries wisdom, humor, or social commentary. Mama Kanga at Stall B-45 has the largest collection of vintage kanga in all of Kariakoo — some dating back to the 1960s.', audioUrl: null, tags: '["fabrics","kanga","culture"]', isPublic: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ms3', guideId: 'demo-guide-3', vendorId: 'v3', zoneId: 'zone-wholesale', title: 'Wholesale Secrets: How to Buy Rice Like a Pro', content: 'The best time to buy rice at Al-Falah Wholesale is Thursday morning between 6-7am. That is when fresh shipments arrive from Morogoro. Ask for "mchele wa mafuta" — the slightly oily rice that cooks perfectly and stores for months.', audioUrl: null, tags: '["wholesale","rice","tips"]', isPublic: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const guideId = searchParams.get('guideId');
    const isPublic = searchParams.get('isPublic');

    const db = getDbOrNull();
    if (!db) {
      let stories = DEMO_STORIES;
      if (zoneId) stories = stories.filter(s => s.zoneId === zoneId);
      if (guideId) stories = stories.filter(s => s.guideId === guideId);
      if (isPublic !== null && isPublic !== undefined) stories = stories.filter(s => s.isPublic === (isPublic === 'true'));
      return NextResponse.json({ items: stories });
    }

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (guideId) where.guideId = guideId;
    if (isPublic !== null && isPublic !== undefined) where.isPublic = isPublic === 'true';

    const stories = await db.marketStory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (stories.length === 0) {
      return NextResponse.json({ items: DEMO_STORIES });
    }

    return NextResponse.json({ items: stories });
  } catch (error) {
    console.error('Get market stories error:', error);
    return NextResponse.json({ items: DEMO_STORIES });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guideId, vendorId, zoneId, title, content, audioUrl, tags, isPublic } = body;

    if (!guideId || !zoneId || !title || !content) {
      return NextResponse.json({ error: 'guideId, zoneId, title, and content are required' }, { status: 400 });
    }

    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
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
