import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const lists = await db.shoppingList.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Parse JSON items field for each list
    const parsed = lists.map((list) => ({
      ...list,
      items: JSON.parse(list.items),
    }));

    return NextResponse.json({ items: parsed });
  } catch (error) {
    console.error('Get shopping lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping lists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, items } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const list = await db.shoppingList.create({
      data: {
        userId,
        name: name ?? 'My Shopping List',
        items: JSON.stringify(items ?? []),
        isActive: true,
      },
    });

    return NextResponse.json({
      item: {
        ...list,
        items: JSON.parse(list.items),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create shopping list error:', error);
    return NextResponse.json({ error: 'Failed to create shopping list' }, { status: 500 });
  }
}
