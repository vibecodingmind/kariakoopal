import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List pending KYC submissions for admin review
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      db.kYCVerification.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.kYCVerification.count({ where }),
    ]);

    // Enrich with user data
    const enriched = await Promise.all(
      submissions.map(async (sub) => {
        const user = await db.user.findUnique({
          where: { id: sub.userId },
          select: { id: true, name: true, phone: true, email: true, avatarUrl: true, role: true },
        });

        return {
          ...sub,
          user,
          aiConfidence: Math.round(((sub.aiFaceMatchScore + sub.aiDocAuthScore) / 2) * 100),
        };
      })
    );

    // Stats
    const stats = await db.kYCVerification.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return NextResponse.json({
      submissions: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Admin KYC GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC submissions' }, { status: 500 });
  }
}

// PATCH - Approve or reject a KYC submission
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { kycId, adminId, action, reason } = body;

    if (!kycId || !adminId || !action) {
      return NextResponse.json({ error: 'KYC ID, Admin ID, and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
    }

    const kyc = await db.kYCVerification.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updated = await db.kYCVerification.update({
      where: { id: kycId },
      data: {
        status: newStatus,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? (reason || 'Did not meet verification requirements') : null,
      },
    });

    // If approved, award verification badge
    if (action === 'approve') {
      await db.badge.upsert({
        where: { id: `kyc-verified-${kyc.userId}` },
        create: {
          id: `kyc-verified-${kyc.userId}`,
          guideId: kyc.userId,
          badgeType: 'kyc_verified',
          awardedAt: new Date(),
        },
        update: {
          badgeType: 'kyc_verified',
          awardedAt: new Date(),
        },
      });
    }

    // Notify user
    await db.notification.create({
      data: {
        userId: kyc.userId,
        type: action === 'approve' ? 'success' : 'warning',
        title: action === 'approve' ? 'KYC Approved' : 'KYC Rejected',
        titleSw: action === 'approve' ? 'KYC Imeidhinishwa' : 'KYC Imekataliwa',
        message: action === 'approve'
          ? 'Your identity has been verified successfully. You now have a verified badge!'
          : `Your KYC verification was not approved. Reason: ${reason || 'Documents did not meet requirements'}. You can resubmit.`,
        actionUrl: '/guide/kyc',
      },
    });

    return NextResponse.json({
      ...updated,
      action,
    });
  } catch (error) {
    console.error('Admin KYC PATCH error:', error);
    return NextResponse.json({ error: 'Failed to review KYC submission' }, { status: 500 });
  }
}
