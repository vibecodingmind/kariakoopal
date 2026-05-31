import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const endpoints = await db.webhookEndpoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ endpoints });
  } catch (error) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, url, events } = body;

    if (!userId || !url) {
      return NextResponse.json({ error: 'userId and url required' }, { status: 400 });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await db.webhookEndpoint.create({
      data: {
        userId,
        url,
        events: JSON.stringify(events || []),
        secret,
        isActive: true,
      },
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.webhookEndpoint.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhooks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
