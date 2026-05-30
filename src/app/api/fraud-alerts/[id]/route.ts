import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const alert = await db.fraudAlert.findUnique({ where: { id } });
    if (!alert) {
      return NextResponse.json({ error: 'Fraud alert not found' }, { status: 404 });
    }
    return NextResponse.json({ item: alert });
  } catch (error) {
    console.error('Get fraud alert error:', error);
    return NextResponse.json({ error: 'Failed to fetch fraud alert' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reviewedBy } = body;

    const alert = await db.fraudAlert.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(reviewedBy ? { reviewedBy } : {}),
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ item: alert });
  } catch (error) {
    console.error('Update fraud alert error:', error);
    return NextResponse.json({ error: 'Failed to update fraud alert' }, { status: 500 });
  }
}
