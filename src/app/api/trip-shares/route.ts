import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST - Create a trip share
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seekerId, sessionId, contactId, expiresInHours } = body;

    if (!seekerId || !sessionId || !contactId) {
      return NextResponse.json({ error: 'Seeker ID, Session ID, and Contact ID are required' }, { status: 400 });
    }

    // Verify the session belongs to the seeker
    const session = await db.session.findFirst({
      where: { id: sessionId, seekerId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found or not authorized' }, { status: 403 });
    }

    // Verify the contact belongs to the seeker
    const contact = await db.trustedContact.findFirst({
      where: { id: contactId, userId: seekerId, isActive: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Trusted contact not found' }, { status: 404 });
    }

    const shareToken = randomUUID();
    const hours = expiresInHours || 8;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const tripShare = await db.tripShare.create({
      data: {
        seekerId,
        sessionId,
        contactId,
        shareToken,
        isActive: true,
        expiresAt,
      },
    });

    return NextResponse.json({
      ...tripShare,
      trackingUrl: `/tracking/${shareToken}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Trip shares POST error:', error);
    return NextResponse.json({ error: 'Failed to create trip share' }, { status: 500 });
  }
}

// GET - Get trip share data (by shareToken for public tracking, or by seekerId for listing)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareToken = searchParams.get('shareToken');
    const seekerId = searchParams.get('seekerId');

    // Public tracking view using shareToken
    if (shareToken) {
      const tripShare = await db.tripShare.findUnique({
        where: { shareToken },
      });

      if (!tripShare || !tripShare.isActive) {
        return NextResponse.json({ error: 'Tracking link not found or expired' }, { status: 404 });
      }

      if (tripShare.expiresAt && new Date() > tripShare.expiresAt) {
        await db.tripShare.update({
          where: { id: tripShare.id },
          data: { isActive: false },
        });
        return NextResponse.json({ error: 'Tracking link has expired' }, { status: 410 });
      }

      // Get session data
      const session = await db.session.findUnique({
        where: { id: tripShare.sessionId },
        select: {
          id: true,
          escrowStatus: true,
          startedAt: true,
          completedAt: true,
          seeker: { select: { id: true, name: true, avatarUrl: true } },
          guide: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Get latest location
      const latestLocation = await db.locationHistory.findFirst({
        where: { sessionId: tripShare.sessionId },
        orderBy: { timestamp: 'desc' },
      });

      // Get route history
      const locationHistory = await db.locationHistory.findMany({
        where: { sessionId: tripShare.sessionId },
        orderBy: { timestamp: 'asc' },
        take: 50,
      });

      const contact = await db.trustedContact.findUnique({
        where: { id: tripShare.contactId },
        select: { name: true, canTrack: true },
      });

      return NextResponse.json({
        seekerName: session?.seeker?.name || 'Unknown',
        seekerAvatar: session?.seeker?.avatarUrl,
        guideName: session?.guide?.name || 'Unknown',
        guideAvatar: session?.guide?.avatarUrl,
        sessionStatus: session?.escrowStatus || 'unknown',
        startedAt: session?.startedAt,
        completedAt: session?.completedAt,
        currentLocation: latestLocation ? {
          lat: latestLocation.lat,
          lng: latestLocation.lng,
          accuracy: latestLocation.accuracy,
          timestamp: latestLocation.timestamp,
        } : null,
        routeHistory: contact?.canTrack ? locationHistory.map((l) => ({
          lat: l.lat,
          lng: l.lng,
          timestamp: l.timestamp,
        })) : [],
        canTrack: contact?.canTrack ?? true,
        shareToken,
        expiresAt: tripShare.expiresAt,
      });
    }

    // List all trip shares for a seeker
    if (seekerId) {
      const shares = await db.tripShare.findMany({
        where: { seekerId, isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          // We don't have relations, so we'll fetch contact separately
        },
      });

      const enrichedShares = await Promise.all(
        shares.map(async (share) => {
          const contact = await db.trustedContact.findUnique({
            where: { id: share.contactId },
            select: { name: true, relation: true },
          });
          return {
            ...share,
            contactName: contact?.name || 'Unknown',
            contactRelation: contact?.relation || 'other',
            trackingUrl: `/tracking/${share.shareToken}`,
          };
        })
      );

      return NextResponse.json({ shares: enrichedShares });
    }

    return NextResponse.json({ error: 'shareToken or seekerId is required' }, { status: 400 });
  } catch (error) {
    console.error('Trip shares GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch trip share data' }, { status: 500 });
  }
}
