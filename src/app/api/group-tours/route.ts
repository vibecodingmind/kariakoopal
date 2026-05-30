import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;

    const tours = await db.groupTour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields for each tour
    const parsed = tours.map((tour) => ({
      ...tour,
      participantIds: JSON.parse(tour.participantIds),
    }));

    return NextResponse.json({ items: parsed });
  } catch (error) {
    console.error('Get group tours error:', error);
    return NextResponse.json({ error: 'Failed to fetch group tours' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guideId, zoneId, title, description, descriptionSw, maxParticipants, soloPrice, groupPrice, timeSlot, date } = body;

    if (!guideId || !zoneId || !title) {
      return NextResponse.json({ error: 'guideId, zoneId, and title are required' }, { status: 400 });
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

    return NextResponse.json({
      item: {
        ...tour,
        participantIds: JSON.parse(tour.participantIds),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create group tour error:', error);
    return NextResponse.json({ error: 'Failed to create group tour' }, { status: 500 });
  }
}
