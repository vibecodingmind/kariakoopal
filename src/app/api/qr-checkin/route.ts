import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// GET /api/qr-checkin - List check-ins or validate QR code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const seekerId = searchParams.get('seekerId');
    const guideId = searchParams.get('guideId');
    const qrCodeHash = searchParams.get('qrCodeHash');

    // If qrCodeHash provided, validate the QR code
    if (qrCodeHash) {
      const checkIn = await db.qRCheckIn.findUnique({
        where: { qrCodeHash },
      });

      if (!checkIn) {
        return NextResponse.json({ valid: false, error: 'QR code not found' }, { status: 404 });
      }

      // Check date validity
      const today = new Date().toISOString().split('T')[0];
      if (checkIn.validDate && checkIn.validDate !== today) {
        return NextResponse.json({
          valid: false,
          error: 'QR code expired',
          details: { validDate: checkIn.validDate, today },
        });
      }

      // Check one-time use (fully used = checked in AND out)
      if (checkIn.used && checkIn.checkedIn && checkIn.checkedOut) {
        return NextResponse.json({
          valid: false,
          error: 'QR code already used',
          details: { checkedIn: checkIn.checkedIn, checkedOut: checkIn.checkedOut },
        });
      }

      // Enrich with session/guide/seeker data
      const session = await db.session.findUnique({
        where: { id: checkIn.sessionId },
        select: { id: true, sessionCode: true, startedAt: true, completedAt: true },
      });
      const guide = await db.user.findUnique({
        where: { id: checkIn.guideId },
        select: { id: true, name: true, avatarUrl: true },
      });
      const seeker = await db.user.findUnique({
        where: { id: checkIn.seekerId },
        select: { id: true, name: true, avatarUrl: true },
      });

      return NextResponse.json({
        valid: true,
        checkIn: { ...checkIn, session, guide, seeker },
      });
    }

    // List check-ins
    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (seekerId) where.seekerId = seekerId;
    if (guideId) where.guideId = guideId;

    const checkIns = await db.qRCheckIn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Enrich with user data
    const enriched = await Promise.all(
      checkIns.map(async (ci) => {
        const [guide, seeker] = await Promise.all([
          db.user.findUnique({
            where: { id: ci.guideId },
            select: { id: true, name: true, avatarUrl: true },
          }),
          db.user.findUnique({
            where: { id: ci.seekerId },
            select: { id: true, name: true, avatarUrl: true },
          }),
        ]);
        return { ...ci, guide, seeker };
      })
    );

    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error('Get QR check-in error:', error);
    return NextResponse.json({ error: 'Failed to fetch check-in data' }, { status: 500 });
  }
}

// POST /api/qr-checkin - Create check-in record or perform check-in/out
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, seekerId, guideId, qrCodeHash } = body;

    // Action: create - Generate a new QR check-in record
    if (action === 'create') {
      if (!sessionId || !seekerId || !guideId) {
        return NextResponse.json(
          { error: 'sessionId, seekerId, and guideId are required' },
          { status: 400 }
        );
      }

      // Check if a QR check-in already exists for this session/seeker
      const existing = await db.qRCheckIn.findFirst({
        where: { sessionId, seekerId },
      });
      if (existing) {
        return NextResponse.json({ item: existing }, { status: 200 });
      }

      const hash = crypto.randomBytes(16).toString('hex');
      const today = new Date().toISOString().split('T')[0];

      const checkIn = await db.qRCheckIn.create({
        data: {
          sessionId,
          seekerId,
          guideId,
          qrCodeHash: hash,
          validDate: today,
          checkedIn: false,
          checkedOut: false,
          used: false,
        },
      });

      return NextResponse.json({ item: checkIn }, { status: 201 });
    }

    // Action: checkin - Verify and perform check-in
    if (action === 'checkin') {
      if (!qrCodeHash) {
        return NextResponse.json({ error: 'qrCodeHash is required' }, { status: 400 });
      }

      const checkIn = await db.qRCheckIn.findUnique({ where: { qrCodeHash } });
      if (!checkIn) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }

      const today = new Date().toISOString().split('T')[0];
      if (checkIn.validDate && checkIn.validDate !== today) {
        return NextResponse.json(
          { error: 'QR code is not valid for today', validDate: checkIn.validDate },
          { status: 400 }
        );
      }

      if (checkIn.checkedIn) {
        return NextResponse.json(
          { error: 'Already checked in', checkedInAt: checkIn.checkedInAt },
          { status: 400 }
        );
      }

      const updated = await db.qRCheckIn.update({
        where: { id: checkIn.id },
        data: { checkedIn: true, checkedInAt: new Date(), used: true },
      });

      await db.notification.create({
        data: {
          userId: checkIn.seekerId,
          type: 'success',
          title: 'Check-in Confirmed',
          message: 'You have been checked in successfully. Enjoy your session!',
          read: false,
        },
      });

      return NextResponse.json({ item: updated, action: 'checkin' });
    }

    // Action: checkout - Perform check-out
    if (action === 'checkout') {
      if (!qrCodeHash) {
        return NextResponse.json({ error: 'qrCodeHash is required' }, { status: 400 });
      }

      const checkIn = await db.qRCheckIn.findUnique({ where: { qrCodeHash } });
      if (!checkIn) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }

      if (!checkIn.checkedIn) {
        return NextResponse.json({ error: 'Must check in first' }, { status: 400 });
      }

      if (checkIn.checkedOut) {
        return NextResponse.json({ error: 'Already checked out' }, { status: 400 });
      }

      const updated = await db.qRCheckIn.update({
        where: { id: checkIn.id },
        data: { checkedOut: true, checkedOutAt: new Date() },
      });

      return NextResponse.json({ item: updated, action: 'checkout' });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use create, checkin, or checkout' },
      { status: 400 }
    );
  } catch (error) {
    console.error('QR check-in action error:', error);
    return NextResponse.json({ error: 'Failed to process check-in' }, { status: 500 });
  }
}
