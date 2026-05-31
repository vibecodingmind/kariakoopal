import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const status = searchParams.get('status');
    const guideId = searchParams.get('guideId');

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;
    if (guideId) where.guideId = guideId;

    const tours = await db.groupTour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Enrich with guide data and parse JSON fields
    const enriched = await Promise.all(
      tours.map(async (tour) => {
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

        const spotsRemaining = tour.maxParticipants - tour.currentCount;
        const participantIds: string[] = JSON.parse(tour.participantIds);

        // Calculate countdown
        const tourDate = tour.date ? new Date(tour.date) : null;
        const now = new Date();
        const countdownMs = tourDate ? Math.max(0, tourDate.getTime() - now.getTime()) : 0;
        const countdownHours = Math.floor(countdownMs / (1000 * 60 * 60));
        const countdownMinutes = Math.floor((countdownMs % (1000 * 60 * 60)) / (1000 * 60));

        // Auto-start: if full or scheduled time reached
        let autoStarted = false;
        if (tour.status === 'open' && spotsRemaining === 0) {
          autoStarted = true;
        }
        if (tour.status === 'open' && tourDate && tourDate <= now) {
          autoStarted = true;
        }

        // Parse timeSlot for duration
        const timeParts = tour.timeSlot.split('-');
        let durationHours = 2;
        if (timeParts.length === 2) {
          const startH = parseInt(timeParts[0].split(':')[0]) || 0;
          const endH = parseInt(timeParts[1].split(':')[0]) || 0;
          if (endH > startH) durationHours = endH - startH;
        }

        return {
          ...tour,
          participantIds,
          spotsRemaining,
          guide: guide ? { ...guide, avgRating: guideProfile?.avgRating ?? 0, totalSessions: guideProfile?.totalSessions ?? 0 } : null,
          zone,
          countdownHours,
          countdownMinutes,
          autoStarted,
          durationHours,
          rating: guideProfile?.avgRating ?? 0,
        };
      })
    );

    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error('Get group tours error:', error);
    return NextResponse.json({ error: 'Failed to fetch group tours' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guideId, zoneId, title, description, descriptionSw,
      maxParticipants, soloPrice, groupPrice, timeSlot, date,
      meetingPoint, zonesCovered,
    } = body;

    if (!guideId || !zoneId || !title) {
      return NextResponse.json({ error: 'guideId, zoneId, and title are required' }, { status: 400 });
    }

    // Verify guide exists
    const guide = await db.user.findUnique({ where: { id: guideId } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const tour = await db.groupTour.create({
      data: {
        guideId,
        zoneId,
        title,
        description: description ?? '',
        descriptionSw: descriptionSw ?? '',
        maxParticipants: maxParticipants ?? 5,
        currentCount: 1,
        soloPrice: soloPrice ?? 15000,
        groupPrice: groupPrice ?? 8000,
        timeSlot: timeSlot ?? '',
        date: date ?? '',
        status: 'open',
        participantIds: JSON.stringify([guideId]),
      },
    });

    // Create notification for the zone
    await db.notification.create({
      data: {
        userId: guideId,
        type: 'success',
        title: 'Group Tour Created',
        message: `Your group tour "${title}" has been created successfully.`,
        read: false,
        actionUrl: '/guide/group-tours',
      },
    });

    return NextResponse.json({
      item: {
        ...tour,
        participantIds: JSON.parse(tour.participantIds),
        spotsRemaining: tour.maxParticipants - tour.currentCount,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create group tour error:', error);
    return NextResponse.json({ error: 'Failed to create group tour' }, { status: 500 });
  }
}
