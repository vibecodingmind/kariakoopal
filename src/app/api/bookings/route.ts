import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString, isValidAmount, isValidId } from '@/lib/sanitize';
import { apiRateLimit } from '@/lib/rate-limit';

// Booking statuses
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

interface Booking {
  id: string;
  seekerId: string;
  guideId: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // hours
  zone: string;
  notes: string;
  totalAmount: number;
  platformFee: number;
  guidePayout: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'escrow';
  createdAt: string;
  updatedAt: string;
}

// In-memory demo store (replace with database in production)
const bookings: Map<string, Booking> = new Map();

// POST: Create a new booking
export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = apiRateLimit(clientId);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { seekerId, guideId, scheduledDate, scheduledTime, duration, zone, notes, paymentMethod } = body;

    // Validate inputs
    if (!seekerId || !guideId || !scheduledDate || !scheduledTime || !duration || !zone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isValidId(seekerId) || !isValidId(guideId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const sanitizedNotes = notes ? sanitizeString(notes) : '';
    const sanitizedZone = sanitizeString(zone);
    const sanitizedDuration = Math.max(0.5, Math.min(12, Number(duration))); // 0.5-12 hours
    
    // Calculate pricing
    const hourlyRate = 15000; // TZS per hour (would come from guide profile)
    const totalAmount = hourlyRate * sanitizedDuration;
    const platformFeePercent = 0.15; // 15%
    const platformFee = Math.round(totalAmount * platformFeePercent);
    const guidePayout = totalAmount - platformFee;

    if (!isValidAmount(totalAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const booking: Booking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      seekerId,
      guideId,
      status: 'pending',
      scheduledDate,
      scheduledTime,
      duration: sanitizedDuration,
      zone: sanitizedZone,
      notes: sanitizedNotes,
      totalAmount,
      platformFee,
      guidePayout,
      paymentMethod: paymentMethod || 'mpesa',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.set(booking.id, booking);

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking created. Waiting for guide confirmation.',
      nextSteps: [
        'Guide will receive notification',
        'Guide must accept within 30 minutes',
        'Payment will be held in escrow',
        'You will be notified on confirmation',
      ],
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Booking creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: List bookings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let results = Array.from(bookings.values());

    // Filter by user
    if (userId && role === 'seeker') {
      results = results.filter(b => b.seekerId === userId);
    } else if (userId && role === 'guide') {
      results = results.filter(b => b.guideId === userId);
    }

    // Filter by status
    if (status) {
      results = results.filter(b => b.status === status);
    }

    // Sort by date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, bookings: results, total: results.length });
  } catch (error: unknown) {
    console.error('Booking list error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
