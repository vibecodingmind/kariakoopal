import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Demo reviews (fallback when DB is empty or in demo mode) ──
const DEMO_REVIEWS = [
  { id: 'r1', sessionId: 's1', reviewerId: 'u2', reviewerName: 'Amina Hassan', revieweeId: 'u1', rating: 5, comment: 'Amazing guide! Knows every corner of the market and got me the best deals on kanga fabrics.', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'r2', sessionId: 's2', reviewerId: 'u3', reviewerName: 'Juma Michael', revieweeId: 'u1', rating: 4, comment: 'Very helpful and knowledgeable about the electronics zone. Would recommend!', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'r3', sessionId: 's3', reviewerId: 'u4', reviewerName: 'Fatima Abdallah', revieweeId: 'u1', rating: 5, comment: 'The best guide in Kariakoo! She helped me find wholesale suppliers I never knew existed.', response: 'Asante Fatima! It was a pleasure guiding you.', respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString() },
  { id: 'r4', sessionId: 's4', reviewerId: 'u5', reviewerName: 'David Kimaro', revieweeId: 'u1', rating: 4, comment: 'Great session. She negotiated prices on my behalf and saved me a lot of money.', response: null, respondedAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString() },
  { id: 'r5', sessionId: 's5', reviewerId: 'u6', reviewerName: 'Sarah Mollel', revieweeId: 'u1', rating: 3, comment: 'Good guide but was a bit late to our meeting point. Otherwise helpful.', response: 'Sorry about that Sarah! I\'ll be on time next time.', respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString() },
];

// GET /api/reviews - Return reviews for a user (by reviewerId or revieweeId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewerId');
    const revieweeId = searchParams.get('revieweeId');

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

    return NextResponse.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
      breakdown,
      responseRate,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reviewerId, revieweeId, rating, comment } = body;

    if (!sessionId || !reviewerId || !revieweeId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clampedRating = Math.min(5, Math.max(1, Number(rating)));

    // Try to save to DB
    let newReview;
    try {
      const reviewer = await db.user.findUnique({ where: { id: reviewerId }, select: { name: true } });

      newReview = await db.review.create({
        data: {
          sessionId,
          reviewerId,
          revieweeId,
          rating: clampedRating,
          comment: comment || '',
        },
      });

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
      });
    } catch {
      // DB not available, return mock response
      const mockReview = {
        id: `r-${Date.now()}`,
        sessionId,
        reviewerId,
        reviewerName: 'You',
        revieweeId,
        rating: clampedRating,
        comment: comment || '',
        response: null,
        respondedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        review: mockReview,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
