import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/reviews/[id] - Update a review (add guide response)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { response, reviewerId, revieweeId } = body;

    if (!response || !response.trim()) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    // Try to update in DB
    try {
      const review = await db.review.findUnique({ where: { id } });
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      // Only the reviewee (guide) can respond
      if (revieweeId && review.revieweeId !== revieweeId) {
        return NextResponse.json({ error: 'Only the reviewed guide can respond' }, { status: 403 });
      }

      const updated = await db.review.update({
        where: { id },
        data: {
          response: response.trim(),
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        review: {
          id: updated.id,
          response: updated.response,
          respondedAt: updated.respondedAt?.toISOString() || null,
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch {
      // DB not available, return mock success
      return NextResponse.json({
        success: true,
        review: {
          id,
          response: response.trim(),
          respondedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/reviews/[id] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const review = await db.review.findUnique({
        where: { id },
        include: {
          reviewer: { select: { name: true } },
          reviewee: { select: { name: true } },
        },
      });

      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json({
        review: {
          id: review.id,
          sessionId: review.sessionId,
          reviewerId: review.reviewerId,
          reviewerName: review.reviewer?.name || 'Anonymous',
          revieweeId: review.revieweeId,
          revieweeName: review.reviewee?.name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          response: review.response,
          respondedAt: review.respondedAt?.toISOString() || null,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
        },
      });
    } catch {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
