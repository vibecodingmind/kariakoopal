import { NextRequest, NextResponse } from 'next/server';
import { isValidId, sanitizeString } from '@/lib/sanitize';
import { apiRateLimit } from '@/lib/rate-limit';

// Booking statuses
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'escrow';

interface BookingRecord {
  id: string;
  seekerId: string;
  guideId: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  zone: string;
  notes: string;
  totalAmount: number;
  platformFee: number;
  guidePayout: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  disputeReason?: string;
  disputedAt?: string;
}

// In-memory demo store reference (shared with bookings/route.ts in production via database)
const bookings: Map<string, BookingRecord> = new Map();

// Seed some demo bookings
function seedDemoBookings() {
  if (bookings.size > 0) return;
  
  const now = new Date();
  const demoBookings: BookingRecord[] = [
    {
      id: 'booking-demo-pending-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'pending',
      scheduledDate: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
      scheduledTime: '10:00',
      duration: 3,
      zone: 'Electronics Zone',
      notes: 'Looking for phone accessories and repairs',
      totalAmount: 45000,
      platformFee: 6750,
      guidePayout: 38250,
      paymentMethod: 'mpesa',
      paymentStatus: 'pending',
      createdAt: new Date(now.getTime() - 300000).toISOString(),
      updatedAt: new Date(now.getTime() - 300000).toISOString(),
    },
    {
      id: 'booking-demo-confirmed-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-2',
      status: 'confirmed',
      scheduledDate: new Date(now.getTime() + 172800000).toISOString().split('T')[0],
      scheduledTime: '14:00',
      duration: 2,
      zone: 'Fabrics Zone',
      notes: 'Need kitenge for a wedding',
      totalAmount: 30000,
      platformFee: 4500,
      guidePayout: 25500,
      paymentMethod: 'mpesa',
      paymentStatus: 'escrow',
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 1800000).toISOString(),
      confirmedAt: new Date(now.getTime() - 1800000).toISOString(),
    },
    {
      id: 'booking-demo-active-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-3',
      status: 'in_progress',
      scheduledDate: now.toISOString().split('T')[0],
      scheduledTime: '09:00',
      duration: 4,
      zone: 'Wholesale Zone',
      notes: 'Bulk rice and cooking oil purchase',
      totalAmount: 60000,
      platformFee: 9000,
      guidePayout: 51000,
      paymentMethod: 'mpesa',
      paymentStatus: 'escrow',
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      confirmedAt: new Date(now.getTime() - 5400000).toISOString(),
      startedAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'booking-demo-completed-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'completed',
      scheduledDate: new Date(now.getTime() - 86400000).toISOString().split('T')[0],
      scheduledTime: '11:00',
      duration: 2,
      zone: 'Spices Zone',
      notes: 'Spice shopping for restaurant',
      totalAmount: 30000,
      platformFee: 4500,
      guidePayout: 25500,
      paymentMethod: 'mpesa',
      paymentStatus: 'paid',
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      confirmedAt: new Date(now.getTime() - 172000000).toISOString(),
      startedAt: new Date(now.getTime() - 86400000).toISOString(),
      completedAt: new Date(now.getTime() - 79200000).toISOString(),
    },
    {
      id: 'booking-demo-cancelled-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-4',
      status: 'cancelled',
      scheduledDate: new Date(now.getTime() - 259200000).toISOString().split('T')[0],
      scheduledTime: '16:00',
      duration: 1,
      zone: 'Kitchenware Zone',
      notes: '',
      totalAmount: 15000,
      platformFee: 2250,
      guidePayout: 12750,
      paymentMethod: 'mpesa',
      paymentStatus: 'refunded',
      createdAt: new Date(now.getTime() - 345600000).toISOString(),
      updatedAt: new Date(now.getTime() - 259200000).toISOString(),
      cancelledAt: new Date(now.getTime() - 259200000).toISOString(),
      cancellationReason: 'Schedule conflict',
    },
    // Guide perspective bookings
    {
      id: 'booking-guide-pending-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'pending',
      scheduledDate: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
      scheduledTime: '13:00',
      duration: 2,
      zone: 'Electronics Zone',
      notes: 'Need help finding a specific phone model',
      totalAmount: 30000,
      platformFee: 4500,
      guidePayout: 25500,
      paymentMethod: 'mpesa',
      paymentStatus: 'pending',
      createdAt: new Date(now.getTime() - 120000).toISOString(),
      updatedAt: new Date(now.getTime() - 120000).toISOString(),
    },
    {
      id: 'booking-guide-pending-2',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'pending',
      scheduledDate: new Date(now.getTime() + 259200000).toISOString().split('T')[0],
      scheduledTime: '09:30',
      duration: 3,
      zone: 'Electronics Zone',
      notes: 'Buying laptop accessories',
      totalAmount: 45000,
      platformFee: 6750,
      guidePayout: 38250,
      paymentMethod: 'mpesa',
      paymentStatus: 'pending',
      createdAt: new Date(now.getTime() - 60000).toISOString(),
      updatedAt: new Date(now.getTime() - 60000).toISOString(),
    },
    {
      id: 'booking-guide-confirmed-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'confirmed',
      scheduledDate: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
      scheduledTime: '15:00',
      duration: 2,
      zone: 'Fabrics Zone',
      notes: 'Kanga shopping for ceremony',
      totalAmount: 30000,
      platformFee: 4500,
      guidePayout: 25500,
      paymentMethod: 'mpesa',
      paymentStatus: 'escrow',
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      confirmedAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'booking-guide-active-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'in_progress',
      scheduledDate: now.toISOString().split('T')[0],
      scheduledTime: '10:00',
      duration: 3,
      zone: 'Electronics Zone',
      notes: 'Phone and accessory shopping',
      totalAmount: 45000,
      platformFee: 6750,
      guidePayout: 38250,
      paymentMethod: 'mpesa',
      paymentStatus: 'escrow',
      createdAt: new Date(now.getTime() - 10800000).toISOString(),
      updatedAt: new Date(now.getTime() - 7200000).toISOString(),
      confirmedAt: new Date(now.getTime() - 9000000).toISOString(),
      startedAt: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: 'booking-guide-completed-1',
      seekerId: 'demo-seeker-1',
      guideId: 'demo-guide-1',
      status: 'completed',
      scheduledDate: new Date(now.getTime() - 172800000).toISOString().split('T')[0],
      scheduledTime: '11:00',
      duration: 4,
      zone: 'Wholesale Zone',
      notes: 'Bulk buying for shop',
      totalAmount: 60000,
      platformFee: 9000,
      guidePayout: 51000,
      paymentMethod: 'mpesa',
      paymentStatus: 'paid',
      createdAt: new Date(now.getTime() - 259200000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
      confirmedAt: new Date(now.getTime() - 258000000).toISOString(),
      startedAt: new Date(now.getTime() - 172800000).toISOString(),
      completedAt: new Date(now.getTime() - 165600000).toISOString(),
    },
  ];

  demoBookings.forEach(b => bookings.set(b.id, b));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limit
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = apiRateLimit(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const body = await req.json();
    const { action, userId, reason } = body;

    // Seed demo data if empty
    seedDemoBookings();

    const booking = bookings.get(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'confirm':
        if (booking.status !== 'pending') {
          return NextResponse.json({ error: 'Booking is not in pending state' }, { status: 400 });
        }
        booking.status = 'confirmed';
        booking.paymentStatus = 'escrow';
        booking.confirmedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();
        return NextResponse.json({
          success: true,
          booking,
          message: 'Booking confirmed! Payment held in escrow. Guide and seeker will be notified.',
        });

      case 'start':
        if (booking.status !== 'confirmed') {
          return NextResponse.json({ error: 'Booking must be confirmed first' }, { status: 400 });
        }
        booking.status = 'in_progress';
        booking.startedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();
        return NextResponse.json({
          success: true,
          booking,
          message: 'Session started! Enjoy your Kariakoo experience.',
        });

      case 'complete':
        if (booking.status !== 'in_progress') {
          return NextResponse.json({ error: 'Session must be in progress' }, { status: 400 });
        }
        booking.status = 'completed';
        booking.paymentStatus = 'paid';
        booking.completedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();
        return NextResponse.json({
          success: true,
          booking,
          message: 'Session completed! Payment released to guide. Please leave a review.',
        });

      case 'cancel':
        if (['completed', 'cancelled'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 });
        }
        booking.status = 'cancelled';
        booking.paymentStatus = booking.paymentStatus === 'escrow' ? 'refunded' : booking.paymentStatus;
        booking.cancelledAt = new Date().toISOString();
        booking.cancellationReason = reason ? sanitizeString(reason) : 'No reason provided';
        booking.updatedAt = new Date().toISOString();
        return NextResponse.json({
          success: true,
          booking,
          message: booking.paymentStatus === 'refunded' 
            ? 'Booking cancelled. Payment will be refunded within 24 hours.'
            : 'Booking cancelled.',
        });

      case 'dispute':
        if (booking.status !== 'in_progress' && booking.status !== 'completed') {
          return NextResponse.json({ error: 'Can only dispute active or completed sessions' }, { status: 400 });
        }
        booking.status = 'disputed';
        booking.disputeReason = reason ? sanitizeString(reason) : 'No reason provided';
        booking.disputedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();
        return NextResponse.json({
          success: true,
          booking,
          message: 'Dispute filed. Our team will review within 24 hours. Payment held in escrow.',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Booking action error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Seed demo data if empty
    seedDemoBookings();

    const booking = bookings.get(id);
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    console.error('Booking get error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
