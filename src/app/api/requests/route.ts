import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const zoneId = searchParams.get('zoneId');
    const seekerId = searchParams.get('seekerId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (seekerId) where.seekerId = seekerId;
    if (zoneId) where.zones = { some: { id: zoneId } };

    const requests = await db.request.findMany({
      where,
      include: {
        seeker: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        zones: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seekerId, description, zoneIds, budget, photoUrl } = await request.json();

    if (!seekerId || !description) {
      return NextResponse.json(
        { error: 'seekerId and description are required' },
        { status: 400 }
      );
    }

    const seeker = await db.user.findUnique({ where: { id: seekerId } });
    if (!seeker) {
      return NextResponse.json({ error: 'Seeker not found' }, { status: 404 });
    }

    const newRequest = await db.request.create({
      data: {
        seekerId,
        description,
        zoneIds: JSON.stringify(zoneIds || []),
        budget: budget || 0,
        photoUrl: photoUrl || null,
        ...(zoneIds?.length > 0 && {
          zones: {
            connect: zoneIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        seeker: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        zones: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
