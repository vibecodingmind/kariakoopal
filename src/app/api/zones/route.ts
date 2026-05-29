import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const zones = await db.zone.findMany({
      include: {
        _count: {
          select: { vendors: true, priceRadar: true, requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ zones }, { status: 200 });
  } catch (error) {
    console.error('Get zones error:', error);
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, nameSw, description, geoBounds, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    const zone = await db.zone.create({
      data: {
        name,
        nameSw: nameSw || '',
        description: description || '',
        geoBounds: JSON.stringify(geoBounds || {}),
        color: color || '#4CAF50',
      },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error('Create zone error:', error);
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
  }
}
