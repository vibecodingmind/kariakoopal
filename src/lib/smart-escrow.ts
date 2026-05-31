import { db } from '@/lib/db';

interface MilestoneTemplate {
  milestoneType: string;
  label: string;
  labelSw: string;
  percentage: number;
  requiresGps: boolean;
  gpsLat?: number;
  gpsLng?: number;
  gpsRadius: number;
}

const DEFAULT_MILESTONES: MilestoneTemplate[] = [
  {
    milestoneType: 'meetup',
    label: 'Meetup Confirmed',
    labelSw: 'Mkutano Umethibitishwa',
    percentage: 30,
    requiresGps: true,
    gpsRadius: 200,
  },
  {
    milestoneType: 'midpoint',
    label: 'Midpoint Check',
    labelSw: 'Ukaguzi wa Kati',
    percentage: 40,
    requiresGps: false,
    gpsRadius: 500,
  },
  {
    milestoneType: 'completion',
    label: 'Session Completed',
    labelSw: 'Kipendi Kimeisha',
    percentage: 30,
    requiresGps: false,
    gpsRadius: 500,
  },
];

/**
 * Create default escrow milestones for a session
 */
export async function createDefaultMilestones(sessionId: string): Promise<{
  milestones: Array<{
    id: string;
    milestoneType: string;
    label: string;
    percentage: number;
    amount: number;
    status: string;
  }>;
  totalAmount: number;
}> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const totalAmount = session.amount;
  const milestones = [];

  for (const template of DEFAULT_MILESTONES) {
    const amount = (template.percentage / 100) * totalAmount;
    const milestone = await db.escrowMilestone.create({
      data: {
        sessionId,
        milestoneType: template.milestoneType,
        label: template.label,
        percentage: template.percentage,
        amount,
        status: 'pending',
        gpsRadius: template.gpsRadius,
      },
    });
    milestones.push(milestone);
  }

  return { milestones, totalAmount };
}

/**
 * Verify a milestone - check GPS if applicable, mark as verified
 */
export async function verifyMilestone(
  milestoneId: string,
  verifierId: string,
  verifierRole: 'seeker' | 'guide' | 'admin',
  userLat?: number,
  userLng?: number
): Promise<{
  success: boolean;
  milestone: Record<string, unknown>;
  gpsVerified: boolean;
  message: string;
}> {
  const milestone = await db.escrowMilestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'pending') {
    throw new Error(`Milestone already ${milestone.status}`);
  }

  // GPS verification for meetup milestone
  let gpsVerified = false;
  if (milestone.milestoneType === 'meetup' && milestone.lat && milestone.lng && userLat && userLng) {
    const distance = calculateDistance(
      milestone.lat,
      milestone.lng,
      userLat,
      userLng
    );
    gpsVerified = distance <= milestone.gpsRadius;
    if (!gpsVerified) {
      return {
        success: false,
        milestone,
        gpsVerified,
        message: `GPS check failed: you are ${Math.round(distance)}m away from the meetup point (max ${milestone.gpsRadius}m)`,
      };
    }
  } else if (milestone.milestoneType === 'meetup') {
    // If no GPS coordinates set, allow verification by both parties
    gpsVerified = true;
  } else {
    gpsVerified = true;
  }

  const updated = await db.escrowMilestone.update({
    where: { id: milestoneId },
    data: {
      status: 'verified',
      verifiedBy: verifierRole,
      lat: userLat ?? milestone.lat,
      lng: userLng ?? milestone.lng,
      verifiedAt: new Date(),
    },
  });

  return {
    success: true,
    milestone: updated,
    gpsVerified,
    message: 'Milestone verified successfully',
  };
}

/**
 * Release a verified milestone - transfer funds
 */
export async function releaseMilestone(
  milestoneId: string,
  releasedBy: string
): Promise<{
  success: boolean;
  releasedAmount: number;
  totalReleased: number;
  remainingAmount: number;
}> {
  const milestone = await db.escrowMilestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'verified') {
    throw new Error('Milestone must be verified before release');
  }

  // Mark as released
  await db.escrowMilestone.update({
    where: { id: milestoneId },
    data: {
      status: 'released',
      releasedAt: new Date(),
    },
  });

  // Calculate total released for the session
  const sessionMilestones = await db.escrowMilestone.findMany({
    where: { sessionId: milestone.sessionId },
  });

  const totalReleased = sessionMilestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalAmount = sessionMilestones.reduce((sum, m) => sum + m.amount, 0);
  const remainingAmount = totalAmount - totalReleased;

  // If all milestones are released, update session escrow status
  const allReleased = sessionMilestones.every((m) => m.status === 'released');
  if (allReleased) {
    await db.session.update({
      where: { id: milestone.sessionId },
      data: { escrowStatus: 'released' },
    });
  }

  // Create a transaction for the guide's wallet
  const session = await db.session.findUnique({
    where: { id: milestone.sessionId },
  });

  if (session) {
    const guideWallet = await db.wallet.findUnique({
      where: { userId: session.guideId },
    });

    if (guideWallet) {
      await db.wallet.update({
        where: { userId: session.guideId },
        data: { balance: { increment: milestone.amount } },
      });

      await db.transaction.create({
        data: {
          walletId: guideWallet.id,
          type: 'escrow_release',
          amount: milestone.amount,
          status: 'completed',
          description: `Escrow release: ${milestone.label}`,
          reference: milestone.id,
          provider: 'escrow',
        },
      });
    }

    // Notify guide
    await db.notification.create({
      data: {
        userId: session.guideId,
        type: 'payment',
        title: 'Escrow Released',
        titleSw: 'Escrow Imefunguliwa',
        message: `TZS ${milestone.amount.toLocaleString()} has been released for ${milestone.label}`,
        actionUrl: `/guide/escrow/${milestone.sessionId}`,
      },
    });

    // Notify seeker
    await db.notification.create({
      data: {
        userId: session.seekerId,
        type: 'info',
        title: 'Milestone Released',
        titleSw: 'Hatua Imefunguliwa',
        message: `Milestone "${milestone.label}" has been released (TZS ${milestone.amount.toLocaleString()})`,
        actionUrl: `/seeker/escrow/${milestone.sessionId}`,
      },
    });
  }

  return {
    success: true,
    releasedAmount: milestone.amount,
    totalReleased,
    remainingAmount,
  };
}

/**
 * Get session milestones with progress info
 */
export async function getSessionMilestones(sessionId: string) {
  const milestones = await db.escrowMilestone.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const totalReleased = milestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalVerified = milestones
    .filter((m) => m.status === 'verified')
    .reduce((sum, m) => sum + m.amount, 0);

  return {
    milestones,
    totalAmount,
    totalReleased,
    totalVerified,
    progressPercent: totalAmount > 0 ? Math.round((totalReleased / totalAmount) * 100) : 0,
  };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
