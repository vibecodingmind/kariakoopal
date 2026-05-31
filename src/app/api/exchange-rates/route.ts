import { NextResponse } from 'next/server';
import { DEMO_EXCHANGE_RATES, db } from '@/lib/demo-data';

export async function GET() {
  try {
    const rates = await db.exchangeRate.findMany({
      orderBy: { currency: 'asc' },
    });

    if (rates.length === 0) {
      return NextResponse.json({ items: DEMO_EXCHANGE_RATES });
    }

    return NextResponse.json({ items: rates });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    return NextResponse.json({ items: DEMO_EXCHANGE_RATES });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currency, rate } = body;

    if (!currency || rate === undefined) {
      return NextResponse.json({ error: 'currency and rate are required' }, { status: 400 });
    }

    const exchangeRate = await db.exchangeRate.upsert({
      where: { currency },
      update: { rate },
      create: { currency, rate },
    });

    return NextResponse.json({ item: exchangeRate }, { status: 201 });
  } catch (error) {
    console.error('Create exchange rate error:', error);
    return NextResponse.json({ error: 'Failed to create exchange rate' }, { status: 500 });
  }
}
