import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/sanitize';

// Demo user IDs
const DEMO_BOOKING_IDS = ['booking-1', 'booking-2', 'booking-3', 'booking-4', 'booking-5', 'booking-6', 'booking-7', 'booking-8', 'booking-9'];
const isDemoBookingId = (id: string) => id.startsWith('booking-') || id.startsWith('demo_');

// GET /api/bookings/[id] - Get single booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = sanitizeString(id, 50);

    // Use demo data for demo booking IDs or when database is unavailable
    const useDemo = isDemoBookingId(bookingId);

    let dbAvailable = false;
    if (!useDemo) {
      try {
        await db.$queryRaw`SELECT 1`;
        dbAvailable = true;
      } catch {
        dbAvailable = false;
      }
    }

    if (dbAvailable && !useDemo) {
      try {
        const session = await db.session.findUnique({
          where: { id: bookingId },
          include: {
            guide: { select: { id: true, name: true, avatarUrl: true, phone: true } },
            seeker: { select: { id: true, name: true, avatarUrl: true, phone: true } },
            request: true,
            messages: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        });

        if (!session) {
          return NextResponse.json({ error: 'Booking not found', success: false }, { status: 404 });
        }

        const guideProfile = await db.guideProfile.findUnique({
          where: { userId: session.guideId },
        });

        const booking = {
          id: session.id,
          seekerId: session.seekerId,
          seekerName: session.seeker.name,
          seekerAvatar: session.seeker.avatarUrl,
          guideId: session.guideId,
          guideName: session.guide.name,
          guideAvatar: session.guide.avatarUrl,
          guideRating: guideProfile?.avgRating || 4.5,
          guidePhone: session.guide.phone,
          status: session.completedAt ? 'completed' : session.startedAt ? 'in_progress' : session.disputeFlag ? 'disputed' : 'pending',
          scheduledDate: session.createdAt.toISOString().split('T')[0],
          scheduledTime: '10:00',
          duration: 2,
          zone: 'Kariakoo Market',
          notes: session.request?.description || '',
          sessionCode: session.sessionCode,
          totalAmount: session.amount,
          platformFee: session.platformFee,
          guidePayout: session.amount - session.platformFee,
          paymentMethod: 'mpesa',
          paymentStatus: session.escrowStatus,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          startedAt: session.startedAt?.toISOString(),
          completedAt: session.completedAt?.toISOString(),
          ratingSeeker: session.ratingSeeker,
          ratingGuide: session.ratingGuide,
          reviewSeeker: session.reviewSeeker,
          reviewGuide: session.reviewGuide,
          messages: session.messages.map(m => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          })),
        };

        return NextResponse.json({ booking, success: true });
      } catch (dbError) {
        console.error('Database query error, falling back to demo:', dbError);
      }
    }

    // Demo mode: return mock detailed booking
    const guideNames: Record<string, string> = {
      'demo-guide-1': 'Hamisi Juma',
      'demo-guide-2': 'Fatma Hassan',
      'demo-guide-3': 'Asha Mohamed',
      'demo-guide-4': 'Mwanaildi Juma',
      'demo-guide-5': 'Halima Abdi',
    };

    const demoBooking = {
      id: bookingId,
      seekerId: 'demo-seeker-1',
      seekerName: 'Sarah Johnson',
      guideId: 'demo-guide-1',
      guideName: guideNames['demo-guide-1'] || 'Hamisi Juma',
      guideRating: 4.8,
      guidePhone: '+255712000001',
      status: bookingId.includes('in_progress') ? 'in_progress' : bookingId.includes('completed') ? 'completed' : bookingId.includes('cancelled') ? 'cancelled' : 'confirmed',
      scheduledDate: '2026-06-05',
      scheduledTime: '10:00',
      endTime: '12:00',
      duration: 2,
      zone: 'Electronics Zone',
      notes: 'Looking for phone accessories and repairs',
      sessionCode: `SES-${bookingId.slice(-4).toUpperCase()}`,
      totalAmount: 35000,
      platformFee: 5250,
      guidePayout: 29750,
      paymentMethod: 'mpesa',
      paymentStatus: 'escrow',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      startedAt: null,
      completedAt: null,
      ratingSeeker: null,
      ratingGuide: null,
      reviewSeeker: null,
      reviewGuide: null,
      messages: [
        { id: 'm1', senderId: 'demo-guide-1', content: 'Karibu! I\'m at the main entrance. Where are you?', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { id: 'm2', senderId: 'demo-seeker-1', content: 'I\'m near Stall B-10. I can see the blue sign.', createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString() },
        { id: 'm3', senderId: 'demo-guide-1', content: 'Perfect! Walk towards the big yellow umbrella — I\'m right there.', createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      ],
    };

    return NextResponse.json({ booking: demoBooking, success: true, demoMode: true });
  } catch (error) {
    console.error('Booking GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', success: false },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = sanitizeString(id, 50);
    const body = await request.json();
    const { action, reason, rating, review } = body;

    const sanitizedReason = sanitizeString(reason || '', 500);
    const sanitizedReview = sanitizeString(review || '', 500);
    const sanitizedRating = Math.min(5, Math.max(1, Number(rating) || 0));

    // Use demo data for demo booking IDs or when database is unavailable
    const useDemo = isDemoBookingId(bookingId);

    let dbAvailable = false;
    if (!useDemo) {
      try {
        await db.$queryRaw`SELECT 1`;
        dbAvailable = true;
      } catch {
        dbAvailable = false;
      }
    }

    if (dbAvailable && !useDemo) {
      try {
        const session = await db.session.findUnique({ where: { id: bookingId } });
        if (!session) {
          return NextResponse.json({ error: 'Booking not found', success: false }, { status: 404 });
        }

        const now = new Date();
        let updateData: Record<string, unknown> = { updatedAt: now };

        switch (action) {
          case 'confirm':
            updateData = { ...updateData, escrowStatus: 'held' };
            break;
          case 'start':
            updateData = { ...updateData, startedAt: now };
            break;
          case 'complete':
            updateData = { ...updateData, completedAt: now, escrowStatus: 'released' };
            break;
          case 'cancel':
            updateData = { ...updateData, escrowStatus: 'refunded', disputeFlag: false };
            break;
          case 'dispute':
            updateData = { ...updateData, disputeFlag: true, disputeReason: sanitizedReason, escrowStatus: 'held' };
            break;
          case 'review_seeker':
            updateData = { ...updateData, ratingSeeker: sanitizedRating, reviewSeeker: sanitizedReview };
            break;
          case 'review_guide':
            updateData = { ...updateData, ratingGuide: sanitizedRating, reviewGuide: sanitizedReview };
            break;
          default:
            return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 });
        }

        await db.session.update({
          where: { id: bookingId },
          data: updateData,
        });

        return NextResponse.json({ success: true, action, bookingId });
      } catch (dbError) {
        console.error('Database update error, falling back to demo:', dbError);
      }
    }

    // Demo mode: just return success
    return NextResponse.json({
      success: true,
      action,
      bookingId,
      demoMode: true,
      message: `Booking ${action} processed (demo mode)`,
    });
  } catch (error) {
    console.error('Booking PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking', success: false },
      { status: 500 }
    );
  }
}
