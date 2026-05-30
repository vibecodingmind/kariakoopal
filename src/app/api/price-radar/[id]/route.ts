import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { category, zoneId, priceMin, priceMax, updatedBy } = await request.json();

    const existing = await db.priceRadar.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Price radar entry not found' }, { status: 404 });
    }

    const updated = await db.priceRadar.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(zoneId !== undefined && { zoneId }),
        ...(priceMin !== undefined && { priceMin }),
        ...(priceMax !== undefined && { priceMax }),
        ...(updatedBy !== undefined && { updatedBy }),
        updatedAt: new Date(),
      },
      include: {
        zone: {
          select: { id: true, name: true, nameSw: true, color: true },
        },
      },
    });

    return NextResponse.json({ entry: updated }, { status: 200 });
  } catch (error) {
    console.error('Update price radar error:', error);
    return NextResponse.json({ error: 'Failed to update price radar entry' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.priceRadar.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Price radar entry not found' }, { status: 404 });
    }

    await db.priceRadar.delete({ where: { id } });

    return NextResponse.json({ message: 'Price radar entry deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete price radar error:', error);
    return NextResponse.json({ error: 'Failed to delete price radar entry' }, { status: 500 });
  }
}
