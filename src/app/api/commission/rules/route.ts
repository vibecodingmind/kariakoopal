import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/commission/rules — list commission rules (optional ?tier= filter)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');

    const where = tier ? { tier } : {};
    const rules = await db.commissionRule.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { category: 'asc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Commission rules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch commission rules' }, { status: 500 });
  }
}

// POST /api/commission/rules — create a commission rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, category, rate, minAmount, maxAmount } = body;

    if (!tier || !category || rate === undefined) {
      return NextResponse.json({ error: 'tier, category, and rate are required' }, { status: 400 });
    }

    const rule = await db.commissionRule.create({
      data: {
        tier,
        category,
        rate: parseFloat(rate),
        minAmount: minAmount ? parseFloat(minAmount) : 0,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Rule already exists for this tier and category' }, { status: 409 });
    }
    console.error('Commission rules POST error:', error);
    return NextResponse.json({ error: 'Failed to create commission rule' }, { status: 500 });
  }
}

// PATCH /api/commission/rules — update a commission rule
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, rate, minAmount, maxAmount, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const data: any = {};
    if (rate !== undefined) data.rate = parseFloat(rate);
    if (minAmount !== undefined) data.minAmount = parseFloat(minAmount);
    if (maxAmount !== undefined) data.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const rule = await db.commissionRule.update({
      where: { id },
      data,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Commission rules PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update commission rule' }, { status: 500 });
  }
}

// DELETE /api/commission/rules — deactivate a commission rule
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const rule = await db.commissionRule.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Commission rules DELETE error:', error);
    return NextResponse.json({ error: 'Failed to deactivate commission rule' }, { status: 500 });
  }
}
