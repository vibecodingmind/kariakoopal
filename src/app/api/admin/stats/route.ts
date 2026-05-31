import { NextResponse } from 'next/server';
import { getDbOrNull } from '@/lib/demo-data';

const DEMO_STATS = {
  users: { seekers: 156, guides: 23, admins: 3, total: 182 },
  sessions: { active: 12, total: 847 },
  requests: { open: 28, matched: 15, completed: 692, cancelled: 42 },
  revenue: { total: 2847500 },
  rating: { average: 4.7 },
  guides: { pendingVerification: 5 },
  zones: 6,
  vendors: 234,
};

export async function GET() {
  try {
    const db = getDbOrNull();
    if (!db) {
      return NextResponse.json({ stats: DEMO_STATS }, { status: 200 });
    }

    // Total users by role
    const [seekerCount, guideCount, adminCount] = await Promise.all([
      db.user.count({ where: { role: 'seeker' } }),
      db.user.count({ where: { role: 'guide' } }),
      db.user.count({ where: { role: 'admin' } }),
    ]);

    // Active sessions
    const activeSessions = await db.session.count({
      where: { completedAt: null },
    });

    // Requests by status
    const [openRequests, matchedRequests, completedRequests, cancelledRequests] =
      await Promise.all([
        db.request.count({ where: { status: 'open' } }),
        db.request.count({ where: { status: 'matched' } }),
        db.request.count({ where: { status: 'completed' } }),
        db.request.count({ where: { status: 'cancelled' } }),
      ]);

    // Total revenue
    const releasedSessions = await db.session.findMany({
      where: { escrowStatus: 'released' },
      select: { amount: true, platformFee: true },
    });
    const totalRevenue = releasedSessions.reduce(
      (sum, s) => sum + (s.platformFee || 0),
      0
    );

    // Average rating
    const ratedSessions = await db.session.findMany({
      where: { ratingSeeker: { not: null } },
      select: { ratingSeeker: true },
    });
    const avgRating =
      ratedSessions.length > 0
        ? ratedSessions.reduce((sum, s) => sum + (s.ratingSeeker || 0), 0) /
          ratedSessions.length
        : 0;

    // Guides pending verification
    const pendingVerification = await db.guideProfile.count({
      where: { status: 'pending' },
    });

    const totalSessions = await db.session.count();
    const totalZones = await db.zone.count();
    const totalVendors = await db.vendor.count();

    return NextResponse.json(
      {
        stats: {
          users: { seekers: seekerCount, guides: guideCount, admins: adminCount, total: seekerCount + guideCount + adminCount },
          sessions: { active: activeSessions, total: totalSessions },
          requests: { open: openRequests, matched: matchedRequests, completed: completedRequests, cancelled: cancelledRequests },
          revenue: { total: Math.round(totalRevenue * 100) / 100 },
          rating: { average: Math.round(avgRating * 10) / 10 },
          guides: { pendingVerification },
          zones: totalZones,
          vendors: totalVendors,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json({ stats: DEMO_STATS }, { status: 200 });
  }
}
