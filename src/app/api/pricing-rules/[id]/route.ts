import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isActive, multiplier, priority } = body;

    const rule = await db.pricingRule.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(multiplier !== undefined && { multiplier }),
        ...(priority !== undefined && { priority }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Pricing rule PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
  }
}
