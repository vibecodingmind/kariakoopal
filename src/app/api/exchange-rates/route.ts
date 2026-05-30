import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rates = await db.exchangeRate.findMany({
      orderBy: { currency: 'asc' },
    });
    return NextResponse.json({ items: rates });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
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
