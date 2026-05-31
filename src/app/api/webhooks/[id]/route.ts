import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const endpoint = await db.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const deliveries = await db.webhookDelivery.findMany({
      where: { endpointId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ endpoint, deliveries });
  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { url, events, isActive } = body;

    const endpoint = await db.webhookEndpoint.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(events && { events: JSON.stringify(events) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Webhook PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}
