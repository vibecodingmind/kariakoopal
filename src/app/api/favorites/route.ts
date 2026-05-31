import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/sanitize';

// GET - List favorites for a user (with optional collection filter)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const targetType = searchParams.get('type'); // guide, vendor, package, zone
    const collection = searchParams.get('collection');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const where: any = { userId };
    if (targetType) where.targetType = targetType;
    if (collection) where.collection = collection;

    const [favorites, total] = await Promise.all([
      db.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.favorite.count({ where }),
    ]);

    // Enrich favorites with target data
    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        let targetData: any = null;

        try {
          switch (fav.targetType) {
            case 'guide': {
              const user = await db.user.findUnique({
                where: { id: fav.targetId },
                select: { id: true, name: true, avatarUrl: true, role: true },
              });
              const profile = await db.guideProfile.findUnique({
                where: { userId: fav.targetId },
                select: { avgRating: true, currentStatus: true, bio: true, zones: true, languages: true },
              });
              const badgeCount = await db.badge.count({ where: { guideId: fav.targetId, badgeType: 'verified_elite' } });
              targetData = {
                ...user,
                rating: profile?.avgRating || 0,
                status: profile?.currentStatus || 'offline',
                bio: profile?.bio || '',
                zones: profile?.zones ? JSON.parse(profile.zones) : [],
                languages: profile?.languages ? JSON.parse(profile.languages) : [],
                verified: badgeCount > 0,
              };
              break;
            }
            case 'vendor': {
              const vendor = await db.vendor.findUnique({
                where: { id: fav.targetId },
                include: { zone: { select: { name: true } } },
              });
              targetData = vendor ? {
                id: vendor.id,
                name: vendor.name,
                rating: 4.5,
                category: vendor.categories,
                zone: vendor.zone?.name || '',
                stall: vendor.stallNumber,
                verified: vendor.approved,
              } : null;
              break;
            }
            case 'package': {
              const pkg = await db.packageDeal.findUnique({ where: { id: fav.targetId } });
              targetData = pkg ? {
                id: pkg.id,
                name: pkg.title,
                price: pkg.price,
                duration: pkg.duration,
                description: pkg.description,
              } : null;
              break;
            }
            case 'zone': {
              const zone = await db.zone.findUnique({ where: { id: fav.targetId } });
              targetData = zone ? {
                id: zone.id,
                name: zone.name,
                nameSw: zone.nameSw,
                description: zone.description,
                color: zone.color,
              } : null;
              break;
            }
          }
        } catch { /* target might not exist */ }

        return {
          ...fav,
          target: targetData,
        };
      })
    );

    // Get user's collections
    const collections = await db.favorite.groupBy({
      by: ['collection'],
      where: { userId },
      _count: { id: true },
    });

    // Get favorites count per target type
    const typeCounts = await db.favorite.groupBy({
      by: ['targetType'],
      where: { userId },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      favorites: enriched.filter(f => f.target !== null),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      collections: collections.map(c => ({ name: c.collection, count: c._count.id })),
      typeCounts: typeCounts.map(t => ({ type: t.targetType, count: t._count.id })),
    });
  } catch (error: any) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a favorite
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, targetId, targetType, collection, note } = body;

    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: 'userId, targetId, and targetType are required' }, { status: 400 });
    }

    const validTypes = ['guide', 'vendor', 'package', 'zone'];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json({ error: `targetType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const safeCollection = sanitizeString(collection || 'default', 50);
    const safeNote = sanitizeString(note || '', 200);

    // Check if already favorited
    const existing = await db.favorite.findFirst({
      where: { userId, targetId, targetType, collection: safeCollection },
    });

    if (existing) {
      // Update note if provided
      if (safeNote) {
        const updated = await db.favorite.update({
          where: { id: existing.id },
          data: { note: safeNote },
        });
        return NextResponse.json({ success: true, favorite: updated, alreadyExisted: true });
      }
      return NextResponse.json({ success: true, favorite: existing, alreadyExisted: true });
    }

    const favorite = await db.favorite.create({
      data: {
        userId,
        targetId,
        targetType,
        collection: safeCollection,
        note: safeNote,
      },
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error: any) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a favorite
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const collection = searchParams.get('collection') || 'default';

    if (id) {
      // Delete by favorite ID
      const favorite = await db.favorite.findUnique({ where: { id } });
      if (!favorite) {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
      }
      await db.favorite.delete({ where: { id } });
      return NextResponse.json({ success: true, deleted: true });
    }

    if (userId && targetId && targetType) {
      // Delete by userId + targetId + targetType + collection
      const favorite = await db.favorite.findFirst({
        where: { userId, targetId, targetType, collection },
      });
      if (!favorite) {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
      }
      await db.favorite.delete({ where: { id: favorite.id } });
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: 'Provide either id, or userId+targetId+targetType' }, { status: 400 });
  } catch (error: any) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a favorite (move to collection or change note)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, collection, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Favorite id required' }, { status: 400 });
    }

    const favorite = await db.favorite.findUnique({ where: { id } });
    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    const data: any = {};
    if (collection !== undefined) data.collection = sanitizeString(collection, 50);
    if (note !== undefined) data.note = sanitizeString(note, 200);

    const updated = await db.favorite.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, favorite: updated });
  } catch (error: any) {
    console.error('Favorites PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
