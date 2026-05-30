import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const req = await db.request.findUnique({
      where: { id },
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
        sessions: {
          include: {
            guide: {
              select: { id: true, name: true, phone: true, avatarUrl: true },
            },
            seeker: {
              select: { id: true, name: true, phone: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ request: req }, { status: 200 });
  } catch (error) {
    console.error('Get request error:', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const existing = await db.request.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updated = await db.request.update({
      where: { id },
      data: { status },
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

    return NextResponse.json({ request: updated }, { status: 200 });
  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
