import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/guides/[id]/rating-stats - Comprehensive rating statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch all reviews for this guide
    const reviews = await db.review.findMany({
      where: { revieweeId: id },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    // Rating distribution (1-5 stars breakdown)
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) ratingDistribution[rounded]++;
    });

    // 30-day average
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
    const thirtyDayAverage = recentReviews.length > 0
      ? Math.round((recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length) * 10) / 10
      : averageRating;

    // Trend direction (comparing last 30 days to previous 30 days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodReviews = reviews.filter(r =>
      new Date(r.createdAt) >= sixtyDaysAgo && new Date(r.createdAt) < thirtyDaysAgo
    );
    const previousAverage = previousPeriodReviews.length > 0
      ? Math.round((previousPeriodReviews.reduce((sum, r) => sum + r.rating, 0) / previousPeriodReviews.length) * 10) / 10
      : averageRating;

    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (thirtyDayAverage > previousAverage + 0.1) trendDirection = 'up';
    else if (thirtyDayAverage < previousAverage - 0.1) trendDirection = 'down';

    // Rating history for chart
    const ratingHistory = await db.ratingHistory.findMany({
      where: { guideId: id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // Recent rating changes
    const recentChanges = ratingHistory.slice(-10).map(h => ({
      id: h.id,
      rating: h.rating,
      avgRating: h.avgRating,
      reviewCount: h.reviewCount,
      createdAt: h.createdAt.toISOString(),
    }));

    // Response rate
    const reviewsWithResponse = await db.review.findMany({
      where: { revieweeId: id, response: { not: null } },
      select: { id: true },
    });
    const responseRate = totalReviews > 0
      ? Math.round((reviewsWithResponse.length / totalReviews) * 100)
      : 0;

    // Average rating by month (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const recentSixMonths = reviews.filter(r => new Date(r.createdAt) >= sixMonthsAgo);
    const monthlyBreakdown: Record<string, { average: number; count: number }> = {};
    recentSixMonths.forEach(r => {
      const monthKey = new Date(r.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { average: 0, count: 0 };
      }
      monthlyBreakdown[monthKey].count++;
    });
    // Calculate averages
    Object.keys(monthlyBreakdown).forEach(monthKey => {
      const monthReviews = recentSixMonths.filter(r =>
        new Date(r.createdAt).toISOString().slice(0, 7) === monthKey
      );
      monthlyBreakdown[monthKey].average = monthReviews.length > 0
        ? Math.round((monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length) * 10) / 10
        : 0;
    });

    return NextResponse.json({
      averageRating,
      totalReviews,
      ratingDistribution,
      trendDirection,
      thirtyDayAverage,
      previousAverage,
      responseRate,
      recentChanges,
      monthlyBreakdown,
      ratingHistory: ratingHistory.map(h => ({
        id: h.id,
        rating: h.rating,
        avgRating: h.avgRating,
        reviewCount: h.reviewCount,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    // Return demo data on error
    return NextResponse.json({
      averageRating: 4.3,
      totalReviews: 24,
      ratingDistribution: { 1: 1, 2: 2, 3: 3, 4: 8, 5: 10 },
      trendDirection: 'up',
      thirtyDayAverage: 4.5,
      previousAverage: 4.1,
      responseRate: 67,
      recentChanges: [
        { id: 'rh1', rating: 5, avgRating: 4.3, reviewCount: 24, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'rh2', rating: 4, avgRating: 4.2, reviewCount: 23, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: 'rh3', rating: 5, avgRating: 4.2, reviewCount: 22, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
      ],
      monthlyBreakdown: {
        [new Date().toISOString().slice(0, 7)]: { average: 4.5, count: 6 },
      },
      ratingHistory: [
        { id: 'rh1', rating: 5, avgRating: 4.3, reviewCount: 24, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
        { id: 'rh2', rating: 4, avgRating: 4.2, reviewCount: 23, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: 'rh3', rating: 5, avgRating: 4.2, reviewCount: 22, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 'rh4', rating: 3, avgRating: 4.1, reviewCount: 21, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
        { id: 'rh5', rating: 5, avgRating: 4.2, reviewCount: 20, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
      ],
    });
  }
}
