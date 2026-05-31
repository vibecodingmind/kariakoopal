import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// ── Profanity check (simple word list) ──
const PROFANITY_LIST = [
  'fuck', 'shit', 'damn', 'ass', 'bastard', 'crap', 'hell',
  'idiot', 'stupid', 'moron', 'dumb', 'hate', 'suck', 'loser',
  'terrible', 'worst', 'scam', 'fraud', 'thief', 'steal',
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some(word => lower.includes(word));
}

function isShortReview(text: string): boolean {
  return text.trim().length < 10;
}

function isExtremeRatingWithoutText(rating: number, text: string): boolean {
  return rating === 1 && text.trim().length < 20;
}

// ── Demo reviews (fallback when DB is empty or in demo mode) ──
const DEMO_REVIEWS = [
  { id: 'r1', sessionId: 's1', reviewerId: 'u2', reviewerName: 'Amina Hassan', revieweeId: 'u1', rating: 5, comment: 'Amazing guide! Knows every corner of the market and got me the best deals on kanga fabrics.', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'r2', sessionId: 's2', reviewerId: 'u3', reviewerName: 'Juma Michael', revieweeId: 'u1', rating: 4, comment: 'Very helpful and knowledgeable about the electronics zone. Would recommend!', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'r3', sessionId: 's3', reviewerId: 'u4', reviewerName: 'Fatima Abdallah', revieweeId: 'u1', rating: 5, comment: 'The best guide in Kariakoo! She helped me find wholesale suppliers I never knew existed.', response: 'Asante Fatima! It was a pleasure guiding you.', respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString() },
  { id: 'r4', sessionId: 's4', reviewerId: 'u5', reviewerName: 'David Kimaro', revieweeId: 'u1', rating: 4, comment: 'Great session. She negotiated prices on my behalf and saved me a lot of money.', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString() },
  { id: 'r5', sessionId: 's5', reviewerId: 'u6', reviewerName: 'Sarah Mollel', revieweeId: 'u1', rating: 3, comment: 'Good guide but was a bit late to our meeting point. Otherwise helpful.', response: 'Sorry about that Sarah! I\'ll be on time next time.', respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString() },
];

// ── Helper: Recalculate guide rating stats ──
async function recalculateGuideRating(guideId: string) {
  try {
    const reviews = await db.review.findMany({
      where: { revieweeId: guideId },
      select: { rating: true, createdAt: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    // 30-day trending rating
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
    const trendingRating = recentReviews.length > 0
      ? Math.round((recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length) * 10) / 10
      : averageRating;

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) ratingDistribution[rounded]++;
    });

    // Update guide profile
    const guideProfile = await db.guideProfile.findFirst({
      where: { userId: guideId },
    });

    if (guideProfile) {
      const oldAvg = guideProfile.avgRating;
      const oldCount = guideProfile.reviewCount;

      await db.guideProfile.update({
        where: { id: guideProfile.id },
        data: {
          avgRating: averageRating,
          reviewCount: totalReviews,
          trendingRating,
        },
      });

      // Check for significant rating change alert
      if (oldCount > 0 && Math.abs(averageRating - oldAvg) >= 0.5) {
        const isPositive = averageRating > oldAvg;
        // Create in-app notification for the guide
        try {
          await db.notification.create({
            data: {
              userId: guideId,
              type: 'alert',
              title: 'Rating Changed',
              titleSw: 'Alama imebadilika',
              message: `Your average rating changed from ${oldAvg.toFixed(1)} to ${averageRating.toFixed(1)}`,
              bodySw: `Wastani wa alama zako umebadilika kutoka ${oldAvg.toFixed(1)} hadi ${averageRating.toFixed(1)}`,
            },
          });
        } catch {
          // Notification creation is best-effort
        }

        // Send email notification for significant rating change
        try {
          const guideUser = await db.user.findUnique({ where: { id: guideId }, select: { email: true, name: true } });
          if (guideUser?.email) {
            await sendEmail('admin_broadcast', guideUser.email, {
              name: guideUser.name || 'Guide',
              subject: isPositive ? '⭐ Your Rating Improved!' : '⚠️ Your Rating Changed',
              bodyHtml: `
                <p>Your average rating on Chimbo Direct has changed significantly.</p>
                <p><strong>Previous:</strong> ${oldAvg.toFixed(1)} ★</p>
                <p><strong>Current:</strong> ${averageRating.toFixed(1)} ★</p>
                <p><strong>Total Reviews:</strong> ${totalReviews}</p>
                <p>${isPositive
                  ? 'Great work! Keep providing excellent service to maintain your momentum.'
                  : 'Consider reviewing recent feedback to improve your service quality.'
                }</p>
              `,
              body: `Your rating changed from ${oldAvg.toFixed(1)} to ${averageRating.toFixed(1)} (${totalReviews} reviews). ${isPositive ? 'Great work!' : 'Review your recent feedback.'}`,
              appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://chimbo.direct',
            });
          }
        } catch {
          // Email notification is best-effort
        }
      }
    }

    return { averageRating, totalReviews, trendingRating, ratingDistribution };
  } catch (error) {
    console.error('Recalculate guide rating error:', error);
    return null;
  }
}

// ── Helper: Auto-flag review for moderation ──
async function autoFlagReview(reviewId: string, rating: number, comment: string) {
  const flags: string[] = [];

  if (containsProfanity(comment)) flags.push('profanity');
  if (isShortReview(comment)) flags.push('short_review');
  if (isExtremeRatingWithoutText(rating, comment)) flags.push('extreme_rating');

  if (flags.length > 0) {
    try {
      await db.reviewModeration.create({
        data: {
          reviewId,
          status: 'pending',
          reason: `Auto-flagged: ${flags.join(', ')}`,
          flaggedBy: 'system',
          flagReason: flags[0],
        },
      });
    } catch {
      // Moderation flagging is best-effort
    }
  }

  return flags;
}

// GET /api/reviews - Return reviews for a user (by reviewerId or revieweeId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewerId');
    const revieweeId = searchParams.get('revieweeId');
    const includeModeration = searchParams.get('includeModeration') === 'true';

    // Try to fetch from DB first
    let dbReviews: Array<{
      id: string;
      sessionId: string;
      reviewerId: string;
      revieweeId: string;
      rating: number;
      comment: string;
      response: string | null;
      respondedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      reviewer?: { name: string } | null;
      reviewee?: { name: string } | null;
    }> = [];

    try {
      const where: Record<string, string> = {};
      if (reviewerId) where.reviewerId = reviewerId;
      if (revieweeId) where.revieweeId = revieweeId;

      dbReviews = await db.review.findMany({
        where,
        include: {
          reviewer: { select: { name: true } },
          reviewee: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // DB not available, fall through to demo data
    }

    // If DB has reviews, use them; otherwise fall back to demo
    const reviews = dbReviews.length > 0
      ? dbReviews.map(r => ({
          id: r.id,
          sessionId: r.sessionId,
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer?.name || 'Anonymous',
          revieweeId: r.revieweeId,
          revieweeName: r.reviewee?.name || 'Anonymous',
          rating: r.rating,
          comment: r.comment,
          response: r.response,
          respondedAt: r.respondedAt?.toISOString() || null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))
      : DEMO_REVIEWS.filter(r => {
          if (reviewerId && r.reviewerId !== reviewerId) return false;
          if (revieweeId && r.revieweeId !== revieweeId) return false;
          return true;
        });

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    // Rating breakdown
    const breakdown = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: reviews.filter(r => r.rating === stars).length,
    }));

    // Response rate (percentage of reviews with a response)
    const respondedCount = reviews.filter(r => r.response).length;
    const responseRate = reviews.length > 0 ? Math.round((respondedCount / reviews.length) * 100) : 0;

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) ratingDistribution[rounded]++;
    });

    const result: Record<string, unknown> = {
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
      breakdown,
      responseRate,
      ratingDistribution,
    };

    // Include moderation data if requested
    if (includeModeration) {
      try {
        const moderationData = await db.reviewModeration.findMany({
          where: { reviewId: { in: reviews.map(r => r.id) } },
        });
        result.moderation = moderationData;
      } catch {
        result.moderation = [];
      }
    }

    // Trending rating for reviewee
    if (revieweeId) {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentReviews = await db.review.findMany({
          where: {
            revieweeId,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { rating: true },
        });
        result.trendingRating = recentReviews.length > 0
          ? Math.round((recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length) * 10) / 10
          : avgRating;
      } catch {
        result.trendingRating = avgRating;
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review with auto-rating-update and moderation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reviewerId, revieweeId, rating, comment } = body;

    if (!sessionId || !reviewerId || !revieweeId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clampedRating = Math.min(5, Math.max(1, Number(rating)));
    const commentText = comment || '';

    // Try to save to DB
    let newReview;
    try {
      // Check for duplicate review (same reviewer, same session)
      const existing = await db.review.findFirst({
        where: { sessionId, reviewerId },
      });
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this session' }, { status: 409 });
      }

      const reviewer = await db.user.findUnique({ where: { id: reviewerId }, select: { name: true } });

      newReview = await db.review.create({
        data: {
          sessionId,
          reviewerId,
          revieweeId,
          rating: clampedRating,
          comment: commentText,
        },
      });

      // Auto-flag for moderation
      const flags = await autoFlagReview(newReview.id, clampedRating, commentText);

      // Auto-recalculate guide rating
      const ratingStats = await recalculateGuideRating(revieweeId);

      // Record rating history
      if (ratingStats) {
        try {
          await db.ratingHistory.create({
            data: {
              guideId: revieweeId,
              rating: clampedRating,
              reviewId: newReview.id,
              avgRating: ratingStats.averageRating,
              reviewCount: ratingStats.totalReviews,
            },
          });
        } catch {
          // Rating history is best-effort
        }
      }

      return NextResponse.json({
        success: true,
        review: {
          id: newReview.id,
          sessionId: newReview.sessionId,
          reviewerId: newReview.reviewerId,
          reviewerName: reviewer?.name || 'You',
          revieweeId: newReview.revieweeId,
          rating: newReview.rating,
          comment: newReview.comment,
          response: null,
          respondedAt: null,
          createdAt: newReview.createdAt.toISOString(),
          updatedAt: newReview.updatedAt.toISOString(),
        },
        moderationFlags: flags,
        ratingStats: ratingStats ? {
          averageRating: ratingStats.averageRating,
          totalReviews: ratingStats.totalReviews,
          trendingRating: ratingStats.trendingRating,
          ratingDistribution: ratingStats.ratingDistribution,
        } : null,
      });
    } catch (dbError) {
      // Check if it's the duplicate error we threw
      if (dbError instanceof Error && dbError.message === 'You have already reviewed this session') {
        return NextResponse.json({ error: dbError.message }, { status: 409 });
      }
      // DB not available, return mock response
      const mockReview = {
        id: `r-${Date.now()}`,
        sessionId,
        reviewerId,
        reviewerName: 'You',
        revieweeId,
        rating: clampedRating,
        comment: commentText,
        response: null,
        respondedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        review: mockReview,
        moderationFlags: [],
        ratingStats: null,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE /api/reviews - Report a review (flag as inappropriate)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, reporterId, reason, details } = body;

    if (!reviewId || !reporterId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const report = await db.reviewReport.create({
        data: {
          reviewId,
          reporterId,
          reason,
          details: details || '',
          status: 'pending',
        },
      });

      return NextResponse.json({ success: true, report });
    } catch {
      return NextResponse.json({
        success: true,
        report: { id: `rr-${Date.now()}`, reviewId, reporterId, reason, status: 'pending' },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
