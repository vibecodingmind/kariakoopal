import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '@/lib/dynamic-pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { basePrice, zoneId, guideTier, dateTime } = body;

    if (!basePrice || basePrice <= 0) {
      return NextResponse.json({ error: 'basePrice is required and must be positive' }, { status: 400 });
    }

    const result = await calculateDynamicPrice(
      Number(basePrice),
      zoneId || undefined,
      guideTier || undefined,
      dateTime || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pricing calculate error:', error);
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 });
  }
}
