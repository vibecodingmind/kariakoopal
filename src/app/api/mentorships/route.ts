import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mentorId = searchParams.get('mentorId');
    const menteeId = searchParams.get('menteeId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (mentorId) where.mentorId = mentorId;
    if (menteeId) where.menteeId = menteeId;

    const mentorships = await db.mentorship.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: mentorships });
  } catch (error) {
    console.error('Get mentorships error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentorships' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mentorId, menteeId, sessionsRequired, bonusPercent } = body;

    if (!mentorId || !menteeId) {
      return NextResponse.json({ error: 'mentorId and menteeId are required' }, { status: 400 });
    }

    const mentorship = await db.mentorship.create({
      data: {
        mentorId,
        menteeId,
        sessionsRequired: sessionsRequired ?? 5,
        bonusPercent: bonusPercent ?? 0.03,
      },
    });

    return NextResponse.json({ item: mentorship }, { status: 201 });
  } catch (error) {
    console.error('Create mentorship error:', error);
    return NextResponse.json({ error: 'Failed to create mentorship' }, { status: 500 });
  }
}
