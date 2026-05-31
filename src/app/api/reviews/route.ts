import { NextResponse } from 'next/server';

// ── Demo reviews ──
const demoReviews = [
  { id: 'r1', sessionId: 's1', reviewerId: 'u2', reviewerName: 'Amina Hassan', revieweeId: 'u1', rating: 5, comment: 'Amazing guide! Knows every corner of the market and got me the best deals on kanga fabrics.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'r2', sessionId: 's2', reviewerId: 'u3', reviewerName: 'Juma Michael', revieweeId: 'u1', rating: 4, comment: 'Very helpful and knowledgeable about the electronics zone. Would recommend!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'r3', sessionId: 's3', reviewerId: 'u4', reviewerName: 'Fatima Abdallah', revieweeId: 'u1', rating: 5, comment: 'The best guide in Kariakoo! She helped me find wholesale suppliers I never knew existed.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
  { id: 'r4', sessionId: 's4', reviewerId: 'u5', reviewerName: 'David Kimaro', revieweeId: 'u1', rating: 4, comment: 'Great session. She negotiated prices on my behalf and saved me a lot of money.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString() },
  { id: 'r5', sessionId: 's5', reviewerId: 'u6', reviewerName: 'Sarah Mollel', revieweeId: 'u1', rating: 3, comment: 'Good guide but was a bit late to our meeting point. Otherwise helpful.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString() },
];

// GET /api/reviews - Return reviews for a user
export async function GET() {
  const avgRating = demoReviews.reduce((sum, r) => sum + r.rating, 0) / demoReviews.length;
  return NextResponse.json({
    reviews: demoReviews,
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: demoReviews.length,
  });
}

// POST /api/reviews - Create a new review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, reviewerId, revieweeId, rating, comment } = body;

    if (!sessionId || !reviewerId || !revieweeId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newReview = {
      id: `r-${Date.now()}`,
      sessionId,
      reviewerId,
      reviewerName: 'You',
      revieweeId,
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
