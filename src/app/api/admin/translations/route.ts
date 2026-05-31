import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { key: { contains: search } },
        { valueEn: { contains: search } },
        { valueSw: { contains: search } },
      ];
    }

    const translations = await db.translationKey.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const stats = await db.translationKey.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return NextResponse.json({
      translations,
      stats: stats.map((s) => ({ category: s.category, count: s._count.id })),
      total: translations.length,
    });
  } catch (error) {
    console.error('Translations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, valueEn, valueSw, category, updatedBy } = body;

    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    const existing = await db.translationKey.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: 'Key already exists' }, { status: 409 });
    }

    const translation = await db.translationKey.create({
      data: {
        key,
        valueEn: valueEn || '',
        valueSw: valueSw || '',
        category: category || 'general',
        updatedBy: updatedBy || 'admin',
      },
    });

    return NextResponse.json(translation, { status: 201 });
  } catch (error) {
    console.error('Translations POST error:', error);
    return NextResponse.json({ error: 'Failed to create translation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates, seed } = body;

    if (seed) {
      const { seedDefaultTranslations } = await import('@/lib/translation-cms');
      const result = await seedDefaultTranslations();
      return NextResponse.json({ message: 'Translations seeded', ...result });
    }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    const results = [];
    for (const u of updates) {
      if (!u.key) continue;
      const r = await db.translationKey.upsert({
        where: { key: u.key },
        update: {
          valueEn: u.valueEn ?? undefined,
          valueSw: u.valueSw ?? undefined,
          category: u.category ?? undefined,
          updatedBy: u.updatedBy || 'admin',
        },
        create: {
          key: u.key,
          valueEn: u.valueEn || '',
          valueSw: u.valueSw || '',
          category: u.category || 'general',
          updatedBy: u.updatedBy || 'admin',
        },
      });
      results.push(r);
    }

    return NextResponse.json({ updated: results.length, translations: results });
  } catch (error) {
    console.error('Translations PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update translations' }, { status: 500 });
  }
}
