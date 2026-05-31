import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/security/export - Export user data as JSON
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Gather user data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        languagePref: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Gather related data
    const [guideProfile, wallet, notifications, reviews, badges] = await Promise.all([
      db.guideProfile.findUnique({
        where: { userId },
        select: { bio: true, status: true, avgRating: true, totalSessions: true, languages: true, zones: true },
      }),
      db.wallet.findUnique({
        where: { userId },
        select: { balance: true, currency: true, transactions: { select: { type: true, amount: true, status: true, description: true, createdAt: true } } },
      }),
      db.notification.findMany({
        where: { userId },
        select: { type: true, title: true, message: true, read: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.review.findMany({
        where: { revieweeId: userId },
        select: { rating: true, comment: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.badge.findMany({
        where: { guideId: userId },
        select: { badgeType: true, awardedAt: true },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user,
      guideProfile,
      wallet: wallet ? { balance: wallet.balance, currency: wallet.currency, recentTransactions: wallet.transactions } : null,
      notifications,
      reviews,
      badges,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('GET /api/security/export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
