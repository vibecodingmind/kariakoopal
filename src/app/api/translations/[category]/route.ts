import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const translations = await db.translationKey.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    const map: Record<string, { en: string; sw: string }> = {};
    for (const t of translations) {
      map[t.key] = { en: t.valueEn, sw: t.valueSw };
    }

    return NextResponse.json({ category, translations: map, count: translations.length });
  } catch (error) {
    console.error('Translations category GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
  }
}
