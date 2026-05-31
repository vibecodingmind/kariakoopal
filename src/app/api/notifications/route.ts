import { NextRequest, NextResponse } from 'next/server';

// ── Demo notifications with enhanced types ──
const demoNotifications = [
  { id: 'n1', userId: 'demo', type: 'booking_new', title: 'New Booking Request', message: 'Amina Hassan wants a guide for the Fabrics Zone tomorrow at 10:00 AM.', read: false, actionUrl: '/guide/sessions', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'n2', userId: 'demo', type: 'booking_confirmed', title: 'Booking Confirmed', message: 'Your booking with Mwanaildi Juma for Electronics Zone has been confirmed.', read: false, actionUrl: '/seeker/bookings', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'n3', userId: 'demo', type: 'payment_received', title: 'Payment Received', message: 'TZS 25,000 has been credited to your wallet for session #S-2847.', read: false, actionUrl: '/wallet', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'n4', userId: 'demo', type: 'chat_message', title: 'New Message from Fatma', message: 'Tuna vitambaa vya kanga vipya! Njoo uone 🌟', read: false, actionUrl: '/chat', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 'n5', userId: 'demo', type: 'guide_verified', title: 'Guide Verified!', message: 'Your identity has been verified. You now have access to premium features.', read: false, actionUrl: '/guide/profile', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'n6', userId: 'demo', type: 'system_announcement', title: 'System Update', message: 'Kariako Guide v2.5 is now available with improved map features.', read: false, actionUrl: '/settings', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n7', userId: 'demo', type: 'review_received', title: 'New Review', message: 'James K. left a 5-star review: "Amazing guide! Very helpful."', read: true, actionUrl: '/guide/profile', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: 'n8', userId: 'demo', type: 'booking_cancelled', title: 'Booking Cancelled', message: 'Your booking for Spices Zone has been cancelled by the seeker.', read: true, actionUrl: '/guide/sessions', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: 'n9', userId: 'demo', type: 'payment_failed', title: 'Payment Failed', message: 'Your wallet top-up of TZS 10,000 failed. Please try again.', read: false, actionUrl: '/wallet', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: 'n10', userId: 'demo', type: 'payment_received', title: 'Subscription Renewal', message: 'Your Pro subscription will renew on March 15, 2026.', read: false, actionUrl: '/guide/subscriptions', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: 'n11', userId: 'demo', type: 'booking_new', title: 'Buddy Match Found', message: 'We found a buddy match for you in the Spices Zone.', read: true, actionUrl: '/market', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n12', userId: 'demo', type: 'system_announcement', title: 'Holiday Schedule', message: 'Kariakoo market will have special hours during Eid al-Fitr.', read: true, actionUrl: '/events', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'n13', userId: 'demo', type: 'chat_message', title: 'Message from Amina', message: 'Naomba msaada kwa spices zone kesho', read: true, actionUrl: '/chat', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
];

// GET /api/notifications - Return list of notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || 'demo';

    // Filter by userId (in demo mode, show all)
    let notifications = demoNotifications;

    // Cursor-based pagination
    if (cursor) {
      const cursorIdx = notifications.findIndex(n => n.id === cursor);
      if (cursorIdx > 0) {
        notifications = notifications.slice(0, cursorIdx);
      }
    }

    const limited = notifications.slice(0, limit);
    const hasMore = notifications.length > limit;
    const nextCursor = hasMore ? limited[limited.length - 1]?.id : null;

    return NextResponse.json({
      notifications: limited,
      unreadCount: demoNotifications.filter(n => !n.read).length,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all as read
      demoNotifications.forEach(n => { n.read = true; });
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
        unreadCount: 0,
      });
    }

    if (notificationId) {
      const notification = demoNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        unreadCount: demoNotifications.filter(n => !n.read).length,
      });
    }

    return NextResponse.json({ error: 'Invalid request. Provide notificationId or markAll.' }, { status: 400 });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// PUT /api/notifications - Mark notification(s) as read (legacy support)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, markAll } = body;

    if (markAll) {
      demoNotifications.forEach(n => { n.read = true; });
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (ids && Array.isArray(ids)) {
      ids.forEach((id: string) => {
        const notification = demoNotifications.find(n => n.id === id);
        if (notification) notification.read = true;
      });
      return NextResponse.json({
        success: true,
        message: `${ids.length} notification(s) marked as read`,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
