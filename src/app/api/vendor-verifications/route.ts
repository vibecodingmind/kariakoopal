import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const isVerified = searchParams.get('isVerified');

    const where: Record<string, unknown> = {};
    if (vendorId) where.vendorId = vendorId;
    if (isVerified !== null && isVerified !== undefined) where.isVerified = isVerified === 'true';

    const verifications = await db.vendorVerification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items: verifications });
  } catch (error) {
    console.error('Get vendor verifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor verifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId, isVerified, monthlyFee, qrCode } = body;

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
    }

    const verification = await db.vendorVerification.create({
      data: {
        vendorId,
        isVerified: isVerified ?? false,
        monthlyFee: monthlyFee ?? 5000,
        qrCode: qrCode ?? '',
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    return NextResponse.json({ item: verification }, { status: 201 });
  } catch (error) {
    console.error('Create vendor verification error:', error);
    return NextResponse.json({ error: 'Failed to create vendor verification' }, { status: 500 });
  }
}
