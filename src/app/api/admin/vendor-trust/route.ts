import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveVendorTrustScore } from '@/lib/vendor-trust';

// GET - List all vendor trust scores
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const maxScore = parseInt(searchParams.get('maxScore') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const scores = await db.vendorTrustScore.findMany({
      where: {
        overallScore: { gte: minScore, lte: maxScore },
      },
      orderBy: { overallScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.vendorTrustScore.count({
      where: {
        overallScore: { gte: minScore, lte: maxScore },
      },
    });

    // Enrich with vendor data
    const enriched = await Promise.all(
      scores.map(async (score) => {
        const vendor = await db.vendor.findUnique({
          where: { id: score.vendorId },
          select: { id: true, name: true, stallNumber: true, approved: true, zoneId: true },
        });
        const zone = vendor?.zoneId
          ? await db.zone.findUnique({ where: { id: vendor.zoneId }, select: { name: true } })
          : null;

        return {
          ...score,
          factors: JSON.parse(score.factors || '{}'),
          vendorName: vendor?.name || 'Unknown',
          stallNumber: vendor?.stallNumber || '',
          approved: vendor?.approved || false,
          zoneName: zone?.name || 'Unknown',
        };
      })
    );

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
      : 0;

    return NextResponse.json({
      scores: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        averageScore: avgScore,
        totalVendors: total,
      },
    });
  } catch (error) {
    console.error('Admin vendor trust GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor trust scores' }, { status: 500 });
  }
}

// PATCH - Manually adjust a vendor trust score
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId, adjustment, reason } = body;

    if (!vendorId || adjustment === undefined) {
      return NextResponse.json({ error: 'Vendor ID and adjustment are required' }, { status: 400 });
    }

    // Get current score
    const current = await db.vendorTrustScore.findUnique({
      where: { vendorId },
    });

    if (!current) {
      // Compute and save first
      await saveVendorTrustScore(vendorId);
    }

    const currentScore = current?.overallScore || 50;
    const newScore = Math.max(0, Math.min(100, currentScore + adjustment));

    const updated = await db.vendorTrustScore.upsert({
      where: { vendorId },
      create: {
        vendorId,
        overallScore: newScore,
        factors: JSON.stringify({ manualAdjustment: adjustment, reason: reason || 'Admin adjustment' }),
        lastCalculated: new Date(),
      },
      update: {
        overallScore: newScore,
        factors: JSON.stringify({
          ...JSON.parse(current?.factors || '{}'),
          manualAdjustment: adjustment,
          reason: reason || 'Admin adjustment',
          adjustedAt: new Date().toISOString(),
        }),
        lastCalculated: new Date(),
      },
    });

    return NextResponse.json({
      vendorId,
      previousScore: currentScore,
      newScore,
      adjustment,
      reason,
    });
  } catch (error) {
    console.error('Admin vendor trust PATCH error:', error);
    return NextResponse.json({ error: 'Failed to adjust vendor trust score' }, { status: 500 });
  }
}
