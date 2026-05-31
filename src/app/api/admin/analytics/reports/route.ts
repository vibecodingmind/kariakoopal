import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const reports = await db.analyticsReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Analytics reports GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, periodStart, periodEnd, generatedBy } = body;

    if (!type || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'type, periodStart, periodEnd required' }, { status: 400 });
    }

    const { generateReport } = await import('@/lib/analytics-v2');
    const result = await generateReport(
      type,
      new Date(periodStart),
      new Date(periodEnd),
      generatedBy || 'admin'
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Analytics reports POST error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
