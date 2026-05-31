import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tour = await db.groupTour.findUnique({ where: { id } });
    if (!tour) {
      return NextResponse.json({ error: 'Group tour not found' }, { status: 404 });
    }

    const guide = await db.user.findUnique({
      where: { id: tour.guideId },
      select: { id: true, name: true, avatarUrl: true },
    });
    const guideProfile = guide
      ? await db.guideProfile.findUnique({
          where: { userId: guide.id },
          select: { avgRating: true, totalSessions: true },
        })
      : null;
    const zone = await db.zone.findUnique({
      where: { id: tour.zoneId },
      select: { id: true, name: true, nameSw: true, color: true },
    });

    const participantIds: string[] = JSON.parse(tour.participantIds);
    const participants = await db.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, name: true, avatarUrl: true },
    });

    const spotsRemaining = tour.maxParticipants - tour.currentCount;
    const tourDate = tour.date ? new Date(tour.date) : null;
    const now = new Date();
    const countdownMs = tourDate ? Math.max(0, tourDate.getTime() - now.getTime()) : 0;

    return NextResponse.json({
      item: {
        ...tour,
        participantIds,
        spotsRemaining,
        guide: guide ? { ...guide, avgRating: guideProfile?.avgRating ?? 0 } : null,
        zone,
        participants,
        countdownMs,
        rating: guideProfile?.avgRating ?? 0,
      },
    });
  } catch (error) {
    console.error('Get group tour error:', error);
    return NextResponse.json({ error: 'Failed to fetch group tour' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId } = body;

    // Fetch current tour
    const tour = await db.groupTour.findUnique({ where: { id } });
    if (!tour) {
      return NextResponse.json({ error: 'Group tour not found' }, { status: 404 });
    }

    const participants: string[] = JSON.parse(tour.participantIds);

    if (action === 'join') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for join action' }, { status: 400 });
      }
      if (participants.includes(userId)) {
        return NextResponse.json({ error: 'User already joined' }, { status: 400 });
      }
      if (tour.currentCount >= tour.maxParticipants) {
        return NextResponse.json({ error: 'Tour is full' }, { status: 400 });
      }
      if (tour.status === 'cancelled' || tour.status === 'completed') {
        return NextResponse.json({ error: 'Tour is no longer open' }, { status: 400 });
      }

      const newParticipants = [...participants, userId];
      const newCount = tour.currentCount + 1;
      const newStatus = newCount >= tour.maxParticipants ? 'full' : tour.status;

      const updated = await db.groupTour.update({
        where: { id },
        data: {
          participantIds: JSON.stringify(newParticipants),
          currentCount: newCount,
          status: newStatus,
        },
      });

      // Notify guide
      await db.notification.create({
        data: {
          userId: tour.guideId,
          type: 'booking',
          title: 'New Group Tour Join',
          message: `A seeker has joined your tour "${tour.title}". ${newCount}/${tour.maxParticipants} participants.`,
          read: false,
          actionUrl: '/guide/group-tours',
        },
      });

      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
          spotsRemaining: updated.maxParticipants - updated.currentCount,
        },
      });
    }

    if (action === 'leave') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for leave action' }, { status: 400 });
      }
      if (!participants.includes(userId)) {
        return NextResponse.json({ error: 'User is not in this tour' }, { status: 400 });
      }
      if (userId === tour.guideId) {
        return NextResponse.json({ error: 'Guide cannot leave their own tour' }, { status: 400 });
      }

      const newParticipants = participants.filter((p) => p !== userId);
      const newCount = Math.max(1, tour.currentCount - 1);
      const newStatus = tour.status === 'full' ? 'open' : tour.status;

      const updated = await db.groupTour.update({
        where: { id },
        data: {
          participantIds: JSON.stringify(newParticipants),
          currentCount: newCount,
          status: newStatus,
        },
      });

      return NextResponse.json({
        item: {
          ...updated,
          participantIds: JSON.parse(updated.participantIds),
          spotsRemaining: updated.maxParticipants - updated.currentCount,
        },
      });
    }

    if (action === 'cancel') {
      const updated = await db.groupTour.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      // Notify all participants
      const allParticipants = JSON.parse(tour.participantIds) as string[];
      for (const pid of allParticipants) {
        if (pid !== tour.guideId) {
          await db.notification.create({
            data: {
              userId: pid,
              type: 'alert',
              title: 'Tour Cancelled',
              message: `The group tour "${tour.title}" has been cancelled by the guide.`,
              read: false,
            },
          });
        }
      }

      return NextResponse.json({
        item: { ...updated, participantIds: JSON.parse(updated.participantIds) },
      });
    }

    if (action === 'complete') {
      const updated = await db.groupTour.update({
        where: { id },
        data: { status: 'completed' },
      });

      // Check and award badges for participants
      const allParticipants = JSON.parse(tour.participantIds) as string[];
      for (const pid of allParticipants) {
        const userSessions = await db.session.count({
          where: { seekerId: pid, escrowStatus: 'released' },
        });
        // Check for social_butterfly badge (5 different guides)
        if (userSessions >= 5) {
          const existingBadge = await db.badge.findFirst({
            where: { guideId: pid, badgeType: 'social_butterfly' },
          });
          if (!existingBadge) {
            await db.badge.create({
              data: { guideId: pid, badgeType: 'social_butterfly' },
            });
          }
        }
      }

      return NextResponse.json({
        item: { ...updated, participantIds: JSON.parse(updated.participantIds) },
      });
    }

    if (action === 'chat') {
      // Get/create chat conversation for tour participants
      const allParticipants = JSON.parse(tour.participantIds) as string[];
      // Find existing conversation for this tour
      const existing = await db.conversation.findFirst({
        where: { bookingId: `tour-${id}` },
      });

      if (existing) {
        return NextResponse.json({ conversationId: existing.id });
      }

      // Create new conversation
      const conversation = await db.conversation.create({
        data: {
          bookingId: `tour-${id}`,
          lastMessageContent: `Group tour chat for "${tour.title}"`,
          lastMessageSender: 'system',
        },
      });

      // Add all participants
      for (const pid of allParticipants) {
        await db.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: pid,
            unreadCount: 0,
          },
        });
      }

      return NextResponse.json({ conversationId: conversation.id });
    }

    return NextResponse.json({ error: 'Invalid action. Use join, leave, cancel, complete, or chat' }, { status: 400 });
  } catch (error) {
    console.error('Update group tour error:', error);
    return NextResponse.json({ error: 'Failed to update group tour' }, { status: 500 });
  }
}
