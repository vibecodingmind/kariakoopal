import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, getAnalyticsSummary, getRecentEvents, type AnalyticsEvent, type AnalyticsEventData } from '@/lib/analytics';

// POST /api/analytics - Track events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = body as { event: AnalyticsEvent; data?: AnalyticsEventData };

    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    trackEvent(event, data || {});

    return NextResponse.json({ success: true, message: 'Event tracked' });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/analytics - Get analytics summary (admin only in production)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'recent') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const events = getRecentEvents(limit);
      return NextResponse.json({ success: true, events });
    }

    // Default: return summary
    const summary = getAnalyticsSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
