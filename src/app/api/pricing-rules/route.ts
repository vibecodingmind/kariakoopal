import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zoneId');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};
    if (zoneId) where.OR = [{ zoneId }, { zoneId: '' }];
    if (activeOnly) where.isActive = true;

    const rules = await db.pricingRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ rules, total: rules.length });
  } catch (error) {
    console.error('Pricing rules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoneId, guideTier, ruleType, multiplier, conditions, priority, startDate, endDate } = body;

    const rule = await db.pricingRule.create({
      data: {
        zoneId: zoneId || '',
        guideTier: guideTier || 'all',
        ruleType: ruleType || 'surge',
        multiplier: multiplier || 1.0,
        conditions: JSON.stringify(conditions || {}),
        priority: priority || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Pricing rules POST error:', error);
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await db.pricingRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pricing rules DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete pricing rule' }, { status: 500 });
  }
}
