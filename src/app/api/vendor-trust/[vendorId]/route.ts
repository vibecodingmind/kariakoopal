import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeVendorTrustScore, saveVendorTrustScore } from '@/lib/vendor-trust';

// GET - Return computed trust score with breakdown
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    // First try to get cached score
    const cached = await db.vendorTrustScore.findUnique({
      where: { vendorId },
    });

    // If cached and less than 1 hour old, return it
    if (cached && cached.lastCalculated) {
      const age = Date.now() - new Date(cached.lastCalculated).getTime();
      if (age < 60 * 60 * 1000) {
        const vendor = await db.vendor.findUnique({
          where: { id: vendorId },
          select: { id: true, name: true, stallNumber: true },
        });
        return NextResponse.json({
          vendorId,
          vendorName: vendor?.name,
          overallScore: cached.overallScore,
          reviewScore: cached.reviewScore,
          disputeRate: cached.disputeRate,
          priceFairness: cached.priceFairness,
          responseTime: cached.responseTime,
          repeatCustomerRate: cached.repeatCustomerRate,
          timeInMarket: cached.timeInMarket,
          factors: JSON.parse(cached.factors || '{}'),
          lastCalculated: cached.lastCalculated,
        });
      }
    }

    // Compute fresh score
    const { overallScore, breakdown } = await computeVendorTrustScore(vendorId);
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, stallNumber: true },
    });

    return NextResponse.json({
      vendorId,
      vendorName: vendor?.name,
      overallScore,
      breakdown,
    });
  } catch (error) {
    console.error('Vendor trust GET error:', error);
    return NextResponse.json({ error: 'Failed to compute trust score' }, { status: 500 });
  }
}

// POST - Trigger recalculation and save
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const { overallScore, breakdown } = await saveVendorTrustScore(vendorId);

    return NextResponse.json({
      vendorId,
      overallScore,
      breakdown,
      recalculated: true,
    });
  } catch (error) {
    console.error('Vendor trust POST error:', error);
    return NextResponse.json({ error: 'Failed to recalculate trust score' }, { status: 500 });
  }
}
