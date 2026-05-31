import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const [guides, vendors, zones, prices, shoppingLists] = await Promise.all([
      db.user.findMany({
        where: { role: 'guide', status: 'active' },
        include: { guideProfile: true },
        take: 50,
      }),
      db.vendor.findMany({ where: { approved: true }, take: 50 }),
      db.zone.findMany(),
      db.priceRadar.findMany({ take: 100 }),
      userId ? db.shoppingList.findMany({ where: { userId, isActive: true } }) : [],
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        guides: guides.map(g => ({
          id: g.id, name: g.name, avatarUrl: g.avatarUrl,
          avgRating: g.guideProfile?.avgRating || 0,
          totalSessions: g.guideProfile?.totalSessions || 0,
          zones: JSON.parse(g.guideProfile?.zones || '[]'),
          isOnline: g.guideProfile?.isOnline || false,
        })),
        vendors: vendors.map(v => ({
          id: v.id, name: v.name, zoneId: v.zoneId,
          categories: JSON.parse(v.categories || '[]'),
          stallNumber: v.stallNumber, openHours: v.openHours,
        })),
        zones: zones.map(z => ({
          id: z.id, name: z.name, nameSw: z.nameSw, color: z.color,
        })),
        prices: prices.map(p => ({
          id: p.id, category: p.category, zoneId: p.zoneId,
          priceMin: p.priceMin, priceMax: p.priceMax,
        })),
        shoppingLists: shoppingLists.map(s => ({
          id: s.id, name: s.name, items: JSON.parse(s.items || '[]'),
        })),
      },
    });
  } catch (error) {
    console.error('Offline cache GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cache data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, cacheType, data } = body;

    if (!userId || !cacheType) {
      return NextResponse.json({ error: 'userId and cacheType required' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.offlineCache.upsert({
      where: { userId_cacheType: { userId, cacheType } },
      update: { data: JSON.stringify(data || {}), expiresAt, version: { increment: 1 } },
      create: { userId, cacheType, data: JSON.stringify(data || {}), expiresAt },
    });

    return NextResponse.json({ success: true, cachedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Offline cache POST error:', error);
    return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 });
  }
}
