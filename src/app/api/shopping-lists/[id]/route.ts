import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const list = await db.shoppingList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }
    return NextResponse.json({
      item: {
        ...list,
        items: JSON.parse(list.items),
      },
    });
  } catch (error) {
    console.error('Get shopping list error:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, items } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (items !== undefined) data.items = JSON.stringify(items);

    const list = await db.shoppingList.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      item: {
        ...list,
        items: JSON.parse(list.items),
      },
    });
  } catch (error) {
    console.error('Update shopping list error:', error);
    return NextResponse.json({ error: 'Failed to update shopping list' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.shoppingList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    return NextResponse.json({ error: 'Failed to delete shopping list' }, { status: 500 });
  }
}
