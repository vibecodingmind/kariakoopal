import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Save a location point to history
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId, lat, lng, accuracy } = body;

    if (!sessionId || !lat || !lng) {
      return NextResponse.json({ error: 'sessionId, lat, and lng are required' }, { status: 400 });
    }

    const record = await db.locationHistory.create({
      data: {
        sessionId,
        userId: userId || 'anonymous',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accuracy: parseFloat(accuracy || '10'),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Location history POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Retrieve location history for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!sessionId && !userId) {
      return NextResponse.json({ error: 'sessionId or userId required' }, { status: 400 });
    }

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;

    const history = await db.locationHistory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, history, total: history.length });
  } catch (error: any) {
    console.error('Location history GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
