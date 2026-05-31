import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// GET - Admin review queue: list all pending/under_review verifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending,under_review';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const statuses = status.split(',').filter(Boolean);

    const [verifications, total] = await Promise.all([
      db.guideVerification.findMany({
        where: { status: { in: statuses } },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      db.guideVerification.count({
        where: { status: { in: statuses } },
      }),
    ]);

    // Enrich with user data
    const enriched = await Promise.all(
      verifications.map(async (v) => {
        const user = await db.user.findUnique({
          where: { id: v.guideId },
          select: { id: true, name: true, phone: true, email: true, avatarUrl: true, createdAt: true },
        });
        const badgeCount = await db.badge.count({ where: { guideId: v.guideId } });
        return {
          ...v,
          user,
          badgeCount,
        };
      })
    );

    // Get stats
    const stats = await Promise.all([
      db.guideVerification.count({ where: { status: 'pending' } }),
      db.guideVerification.count({ where: { status: 'under_review' } }),
      db.guideVerification.count({ where: { status: 'approved' } }),
      db.guideVerification.count({ where: { status: 'rejected' } }),
    ]);

    return NextResponse.json({
      success: true,
      verifications: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        pending: stats[0],
        underReview: stats[1],
        approved: stats[2],
        rejected: stats[3],
      },
    });
  } catch (error: any) {
    console.error('Admin verify GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Admin approve/reject verification
export async function POST(request: NextRequest) {
  try {
    const { guideId, action, reason } = await request.json();

    if (!guideId || !action) {
      return NextResponse.json(
        { error: 'guideId and action (approve/reject) are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const verification = await db.guideVerification.findUnique({ where: { guideId } });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    // Update verification record
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const bgStatus = action === 'approve' ? 'passed' : 'failed';

    await db.guideVerification.update({
      where: { guideId },
      data: {
        status: newStatus,
        backgroundCheckStatus: bgStatus,
        reviewedBy: 'admin',
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? (reason || 'Did not meet verification requirements') : null,
      },
    });

    // Update guide profile
    const guideProfile = await db.guideProfile.findFirst({
      where: { userId: guideId },
      include: {
        user: { select: { id: true, name: true, phone: true, avatarUrl: true, email: true } },
      },
    });

    if (guideProfile) {
      const profileStatus = action === 'approve' ? 'active' : 'suspended';
      await db.guideProfile.update({
        where: { id: guideProfile.id },
        data: { status: profileStatus },
      });

      // If approved, award verified_elite badge
      if (action === 'approve') {
        const existingBadge = await db.badge.findFirst({
          where: { guideId, badgeType: 'verified_elite' },
        });
        if (!existingBadge) {
          await db.badge.create({
            data: { guideId, badgeType: 'verified_elite' },
          });
        }
      }

      // Send email notification
      if (guideProfile.user.email) {
        try {
          await sendEmail('guide_verification', guideProfile.user.email, {
            name: guideProfile.user.name,
            status: action === 'approve' ? 'approved' : 'rejected',
            reason: reason || '',
          });
        } catch (emailErr) {
          console.log('Verification status email failed:', emailErr);
        }
      }

      // Create in-app notification
      try {
        await db.notification.create({
          data: {
            userId: guideId,
            type: action === 'approve' ? 'success' : 'warning',
            title: action === 'approve' ? 'Verification Approved!' : 'Verification Not Approved',
            titleSw: action === 'approve' ? 'Uthibitisho Umekubaliwa!' : 'Uthibitisho Hakukubaliwa',
            message: action === 'approve'
              ? 'Congratulations! Your guide verification has been approved.'
              : `Your verification was not approved. Reason: ${reason || 'Did not meet requirements'}`,
            bodySw: action === 'approve'
              ? 'Hongera! Uthibitisho wako umekubaliwa.'
              : `Uthibitisho wako haukukubaliwa. Sababu: ${reason || 'Haikutimiza mahitaji'}`,
            actionUrl: '/guide/verification',
          },
        });
      } catch { /* ignore */ }
    }

    const updatedVerification = await db.guideVerification.findUnique({ where: { guideId } });

    return NextResponse.json(
      {
        success: true,
        verification: updatedVerification,
        action,
        reason: reason || null,
        newStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ error: 'Failed to verify guide' }, { status: 500 });
  }
}
