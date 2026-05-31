import { NextResponse } from 'next/server';
import { getRealtimeStats } from '@/lib/analytics-v2';

export async function GET() {
  try {
    const stats = await getRealtimeStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics realtime GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch realtime stats' }, { status: 500 });
  }
}
