import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/premium-content — list premium content with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get('guideId');
    const category = searchParams.get('category');
    const accessType = searchParams.get('accessType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (guideId) where.guideId = guideId;
    if (category) where.category = category;
    if (accessType) where.accessType = accessType;

    const [content, total] = await Promise.all([
      db.premiumContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.premiumContent.count({ where }),
    ]);

    return NextResponse.json({ content, total, page, limit });
  } catch (error) {
    console.error('Premium content GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch premium content' }, { status: 500 });
  }
}

// POST /api/premium-content — create premium content
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guideId, title, description, contentUrl, coverUrl, category, accessType, price } = body;

    if (!guideId || !title) {
      return NextResponse.json(
        { error: 'guideId and title are required' },
        { status: 400 }
      );
    }

    const content = await db.premiumContent.create({
      data: {
        guideId,
        title,
        description: description || '',
        contentUrl: contentUrl || '',
        coverUrl: coverUrl || '',
        category: category || 'market_intel',
        accessType: accessType || 'one_time',
        price: parseFloat(price) || 0,
      },
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error('Premium content POST error:', error);
    return NextResponse.json({ error: 'Failed to create premium content' }, { status: 500 });
  }
}
