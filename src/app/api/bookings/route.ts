import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString, sanitizePhone, sanitizeNumber, sanitizeBookingStatus, sanitizeRole } from '@/lib/sanitize';

// ── Demo Bookings Data ──
const DEMO_BOOKINGS = [
  {
    id: 'booking-1',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-1',
    status: 'confirmed',
    scheduledDate: '2026-06-05',
    scheduledTime: '10:00',
    duration: 2,
    zone: 'Electronics Zone',
    notes: 'Looking for phone accessories and repairs',
    totalAmount: 35000,
    platformFee: 5250,
    guidePayout: 29750,
    paymentMethod: 'mpesa',
    paymentStatus: 'escrow',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking-2',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-2',
    status: 'in_progress',
    scheduledDate: '2026-06-01',
    scheduledTime: '14:00',
    duration: 3,
    zone: 'Fabrics Zone',
    notes: 'Need kanga and kitenge for a wedding',
    totalAmount: 45000,
    platformFee: 6750,
    guidePayout: 38250,
    paymentMethod: 'mpesa',
    paymentStatus: 'escrow',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking-3',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-3',
    status: 'completed',
    scheduledDate: '2026-05-28',
    scheduledTime: '09:00',
    duration: 2,
    zone: 'Wholesale Zone',
    notes: 'Bulk rice and cooking oil',
    totalAmount: 25000,
    platformFee: 3750,
    guidePayout: 21250,
    paymentMethod: 'mpesa',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking-4',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-4',
    status: 'pending',
    scheduledDate: '2026-06-08',
    scheduledTime: '11:00',
    duration: 1.5,
    zone: 'Spices Zone',
    notes: 'Looking for quality turmeric and cardamom',
    totalAmount: 20000,
    platformFee: 3000,
    guidePayout: 17000,
    paymentMethod: 'mpesa',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking-5',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-5',
    status: 'cancelled',
    scheduledDate: '2026-05-25',
    scheduledTime: '15:00',
    duration: 2,
    zone: 'Kitchenware Zone',
    notes: 'Pots and pans for new kitchen',
    totalAmount: 30000,
    platformFee: 4500,
    guidePayout: 25500,
    paymentMethod: 'mpesa',
    paymentStatus: 'refunded',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    cancelledAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    cancellationReason: 'Schedule conflict',
  },
  {
    id: 'booking-6',
    seekerId: 'demo-seeker-1',
    guideId: 'demo-guide-1',
    status: 'pending',
    scheduledDate: '2026-06-10',
    scheduledTime: '09:30',
    duration: 2,
    zone: 'Electronics Zone',
    notes: 'Need laptop charger and screen protector',
    totalAmount: 35000,
    platformFee: 5250,
    guidePayout: 29750,
    paymentMethod: 'mpesa',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  // Guide perspective bookings (seekers who booked with demo-guide-1)
  {
    id: 'booking-7',
    seekerId: 'temp-seeker-a',
    guideId: 'demo-guide-1',
    status: 'pending',
    scheduledDate: '2026-06-06',
    scheduledTime: '13:00',
    duration: 2,
    zone: 'Electronics Zone',
    notes: 'Phone screen replacement and accessories',
    totalAmount: 40000,
    platformFee: 6000,
    guidePayout: 34000,
    paymentMethod: 'mpesa',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    seekerName: 'James Mwangi',
  },
  {
    id: 'booking-8',
    seekerId: 'temp-seeker-b',
    guideId: 'demo-guide-1',
    status: 'confirmed',
    scheduledDate: '2026-06-04',
    scheduledTime: '10:00',
    duration: 3,
    zone: 'Fabrics Zone',
    notes: 'Wedding fabric shopping',
    totalAmount: 50000,
    platformFee: 7500,
    guidePayout: 42500,
    paymentMethod: 'mpesa',
    paymentStatus: 'escrow',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    seekerName: 'Amina Rashid',
  },
  {
    id: 'booking-9',
    seekerId: 'temp-seeker-c',
    guideId: 'demo-guide-1',
    status: 'completed',
    scheduledDate: '2026-05-30',
    scheduledTime: '08:00',
    duration: 2,
    zone: 'Electronics Zone',
    notes: 'Speaker and headphones',
    totalAmount: 30000,
    platformFee: 4500,
    guidePayout: 25500,
    paymentMethod: 'mpesa',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 3.9 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    seekerName: 'David Kimaro',
  },
];

const guideNames: Record<string, string> = {
  'demo-guide-1': 'Hamisi Juma',
  'demo-guide-2': 'Fatma Hassan',
  'demo-guide-3': 'Asha Mohamed',
  'demo-guide-4': 'Mwanaildi Juma',
  'demo-guide-5': 'Halima Abdi',
};

const guideRatings: Record<string, number> = {
  'demo-guide-1': 4.8,
  'demo-guide-2': 4.7,
  'demo-guide-3': 4.9,
  'demo-guide-4': 4.6,
  'demo-guide-5': 4.7,
};

// Demo user IDs that should always use demo data
const DEMO_USER_IDS = ['demo-seeker-1', 'demo-guide-1', 'demo-guide-2', 'demo-guide-3', 'demo-guide-4', 'demo-guide-5'];
const isDemoUserId = (id: string | null) => id ? DEMO_USER_IDS.includes(id) || id.startsWith('temp_') || id.startsWith('demo_') : false;

// GET /api/bookings?userId=xxx&role=seeker|guide
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required', success: false }, { status: 400 });
    }

    const sanitizedRole = sanitizeRole(role);

    // Use demo data for demo users or when database is unavailable
    const useDemo = isDemoUserId(userId);

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
        if (sanitizedRole === 'guide') {
          // Guide sees bookings for them
          const sessions = await db.session.findMany({
            where: { guideId: userId },
            include: {
              seeker: { select: { id: true, name: true, avatarUrl: true } },
              request: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          const bookings = sessions.map(s => ({
            id: s.id,
            seekerId: s.seekerId,
            seekerName: s.seeker.name,
            seekerAvatar: s.seeker.avatarUrl,
            guideId: s.guideId,
            status: s.completedAt ? 'completed' : s.startedAt ? 'in_progress' : s.disputeFlag ? 'disputed' : 'pending',
            scheduledDate: s.createdAt.toISOString().split('T')[0],
            scheduledTime: '10:00',
            duration: 2,
            zone: 'Kariakoo Market',
            notes: s.request?.description || '',
            totalAmount: s.amount,
            platformFee: s.platformFee,
            guidePayout: s.amount - s.platformFee,
            paymentMethod: 'mpesa',
            paymentStatus: s.escrowStatus,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }));

          return NextResponse.json({ bookings, success: true });
        } else {
          // Seeker sees their own bookings
          const sessions = await db.session.findMany({
            where: { seekerId: userId },
            include: {
              guide: { select: { id: true, name: true, avatarUrl: true } },
              request: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          const bookings = sessions.map(s => ({
            id: s.id,
            seekerId: s.seekerId,
            guideId: s.guideId,
            guideName: s.guide.name,
            guideAvatar: s.guide.avatarUrl,
            guideRating: 4.5,
            status: s.completedAt ? 'completed' : s.startedAt ? 'in_progress' : s.disputeFlag ? 'disputed' : 'pending',
            scheduledDate: s.createdAt.toISOString().split('T')[0],
            scheduledTime: '10:00',
            duration: 2,
            zone: 'Kariakoo Market',
            notes: s.request?.description || '',
            totalAmount: s.amount,
            platformFee: s.platformFee,
            guidePayout: s.amount - s.platformFee,
            paymentMethod: 'mpesa',
            paymentStatus: s.escrowStatus,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }));

          return NextResponse.json({ bookings, success: true });
        }
      } catch (dbError) {
        console.error('Database query error, falling back to demo data:', dbError);
      }
    }

    // Demo mode: filter demo bookings
    let bookings = DEMO_BOOKINGS;

    if (sanitizedRole === 'guide') {
      bookings = bookings.filter(b => b.guideId === userId);
      // Add guide-specific data
      bookings = bookings.map(b => ({
        ...b,
        seekerName: (b as Record<string, unknown>).seekerName || 'Seeker',
      }));
    } else {
      bookings = bookings.filter(b => b.seekerId === userId);
      // Add guide names
      bookings = bookings.map(b => ({
        ...b,
        guideName: guideNames[b.guideId] || 'Guide',
        guideRating: guideRatings[b.guideId] || 4.5,
      }));
    }

    return NextResponse.json({ bookings, success: true, demoMode: true });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', success: false },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guideId, seekerId, date, startTime, endTime, zone, notes } = body;

    // Validate required fields
    if (!guideId || !seekerId || !date || !startTime) {
      return NextResponse.json(
        { error: 'guideId, seekerId, date, and startTime are required', success: false },
        { status: 400 }
      );
    }

    const sanitizedGuideId = sanitizeString(guideId, 50);
    const sanitizedSeekerId = sanitizeString(seekerId, 50);
    const sanitizedDate = sanitizeString(date, 20);
    const sanitizedStartTime = sanitizeString(startTime, 10);
    const sanitizedEndTime = sanitizeString(endTime || '', 10);
    const sanitizedZone = sanitizeString(zone || '', 100);
    const sanitizedNotes = sanitizeString(notes || '', 500);

    // Calculate amounts (guide rate: 15,000 TZS/hour default)
    const startHour = parseInt(sanitizedStartTime.split(':')[0]) || 10;
    const endHour = sanitizedEndTime ? parseInt(sanitizedEndTime.split(':')[0]) || 12 : startHour + 2;
    const duration = Math.max(1, endHour - startHour);
    const totalAmount = duration * 15000;
    const platformFee = Math.round(totalAmount * 0.15);
    const guidePayout = totalAmount - platformFee;

    // Try database first
    let dbAvailable = true;
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbAvailable = false;
    }

    if (dbAvailable) {
      try {
        // Create a request first
        const newRequest = await db.request.create({
          data: {
            seekerId: sanitizedSeekerId,
            description: sanitizedNotes,
            budget: totalAmount,
            status: 'matched',
          },
        });

        // Create session
        const session = await db.session.create({
          data: {
            requestId: newRequest.id,
            guideId: sanitizedGuideId,
            seekerId: sanitizedSeekerId,
            sessionCode: `SES-${Date.now().toString(36).toUpperCase()}`,
            amount: totalAmount,
            platformFee,
            escrowStatus: 'pending',
          },
          include: {
            guide: { select: { id: true, name: true, avatarUrl: true } },
            seeker: { select: { id: true, name: true, avatarUrl: true } },
          },
        });

        return NextResponse.json({
          booking: {
            id: session.id,
            seekerId: session.seekerId,
            guideId: session.guideId,
            guideName: session.guide.name,
            status: 'pending',
            scheduledDate: sanitizedDate,
            scheduledTime: sanitizedStartTime,
            duration,
            zone: sanitizedZone,
            notes: sanitizedNotes,
            totalAmount,
            platformFee,
            guidePayout,
            paymentMethod: 'mpesa',
            paymentStatus: 'pending',
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
          },
          success: true,
        });
      } catch (dbError) {
        console.error('Database create error, falling back to demo:', dbError);
      }
    }

    // Demo mode: return mock booking
    const mockBooking = {
      id: `booking-${Date.now()}`,
      seekerId: sanitizedSeekerId,
      guideId: sanitizedGuideId,
      guideName: guideNames[sanitizedGuideId] || 'Guide',
      guideRating: guideRatings[sanitizedGuideId] || 4.5,
      status: 'pending',
      scheduledDate: sanitizedDate,
      scheduledTime: sanitizedStartTime,
      duration,
      zone: sanitizedZone,
      notes: sanitizedNotes,
      totalAmount,
      platformFee,
      guidePayout,
      paymentMethod: 'mpesa',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ booking: mockBooking, success: true, demoMode: true });
  } catch (error) {
    console.error('Bookings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking', success: false },
      { status: 500 }
    );
  }
}
