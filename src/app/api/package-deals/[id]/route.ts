import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await db.packageDeal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: 'Package deal not found' }, { status: 404 });
    }
    return NextResponse.json({ item: deal });
  } catch (error) {
    console.error('Get package deal error:', error);
    return NextResponse.json({ error: 'Failed to fetch package deal' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deal = await db.packageDeal.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ item: deal });
  } catch (error) {
    console.error('Update package deal error:', error);
    return NextResponse.json({ error: 'Failed to update package deal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.packageDeal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete package deal error:', error);
    return NextResponse.json({ error: 'Failed to delete package deal' }, { status: 500 });
  }
}
