import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const reminders = await db.calendarReminder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items: reminders });
  } catch (error) {
    console.error('Get calendar reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar reminders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, eventId } = body;

    if (!userId || !eventId) {
      return NextResponse.json({ error: 'userId and eventId are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await db.calendarReminder.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      return NextResponse.json({ item: existing }, { status: 200 });
    }

    const reminder = await db.calendarReminder.create({
      data: { userId, eventId },
    });

    return NextResponse.json({ item: reminder }, { status: 201 });
  } catch (error) {
    console.error('Create calendar reminder error:', error);
    return NextResponse.json({ error: 'Failed to create calendar reminder' }, { status: 500 });
  }
}
