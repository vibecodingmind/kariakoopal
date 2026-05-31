import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Auth helper: extract user ID from auth_token cookie ──
function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('demo_token_')) {
    const parts = token.split('_');
    return parts.length >= 4 ? parts[2] : null;
  }
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    return parts.length >= 3 ? parts[1] : null;
  }
  if (token.startsWith('temp_token_')) {
    return null;
  }
  return null;
}

// ── Demo notifications (fallback) ──
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
    const userIdParam = searchParams.get('userId');

    // Extract user ID from auth cookie or query param
    const authToken = request.cookies.get('auth_token')?.value;
    const userId = (authToken ? getUserIdFromToken(authToken) : null) || userIdParam || 'demo';

    try {
      // Build the query with cursor-based pagination
      const whereClause: Record<string, unknown> = { userId };

      const notifications = await db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // take one extra to determine hasMore
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
      });

      const hasMore = notifications.length > limit;
      const limited = hasMore ? notifications.slice(0, limit) : notifications;

      // Get unread count
      const unreadCount = await db.notification.count({
        where: { userId, read: false },
      });

      return NextResponse.json({
        notifications: limited.map(n => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          titleSw: n.titleSw,
          message: n.message,
          bodySw: n.bodySw,
          read: n.read,
          actionUrl: n.actionUrl,
          imageUrl: n.imageUrl,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
        pagination: {
          hasMore,
          nextCursor: hasMore ? limited[limited.length - 1]?.id : null,
          limit,
        },
      });
    } catch (dbError) {
      console.error('DB query failed, falling back to demo data:', dbError);

      // Demo fallback
      let notifications = demoNotifications;

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
    }
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
      try {
        // Extract user ID from auth cookie
        const authToken = request.cookies.get('auth_token')?.value;
        const userId = authToken ? getUserIdFromToken(authToken) : null;

        if (userId) {
          await db.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
          });
        } else {
          // Demo fallback
          demoNotifications.forEach(n => { n.read = true; });
        }

        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
          unreadCount: 0,
        });
      } catch (dbError) {
        console.error('DB update failed, falling back to demo data:', dbError);
        demoNotifications.forEach(n => { n.read = true; });
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
          unreadCount: 0,
        });
      }
    }

    if (notificationId) {
      try {
        await db.notification.update({
          where: { id: notificationId },
          data: { read: true },
        });

        // Get updated unread count for the user
        const notification = await db.notification.findUnique({ where: { id: notificationId } });
        const unreadCount = notification
          ? await db.notification.count({ where: { userId: notification.userId, read: false } })
          : 0;

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
          unreadCount,
        });
      } catch (dbError) {
        console.error('DB update failed, falling back to demo data:', dbError);
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
    }

    return NextResponse.json({ error: 'Invalid request. Provide notificationId or markAll.' }, { status: 400 });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// PUT /api/notifications - Mark notification(s) as read (batch / legacy support)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, markAll } = body;

    if (markAll) {
      try {
        const authToken = request.cookies.get('auth_token')?.value;
        const userId = authToken ? getUserIdFromToken(authToken) : null;

        if (userId) {
          await db.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
          });
        } else {
          demoNotifications.forEach(n => { n.read = true; });
        }

        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
        });
      } catch (dbError) {
        console.error('DB update failed, falling back to demo data:', dbError);
        demoNotifications.forEach(n => { n.read = true; });
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read',
        });
      }
    }

    if (ids && Array.isArray(ids)) {
      try {
        await db.notification.updateMany({
          where: { id: { in: ids as string[] } },
          data: { read: true },
        });

        return NextResponse.json({
          success: true,
          message: `${ids.length} notification(s) marked as read`,
        });
      } catch (dbError) {
        console.error('DB update failed, falling back to demo data:', dbError);
        (ids as string[]).forEach((id: string) => {
          const notification = demoNotifications.find(n => n.id === id);
          if (notification) notification.read = true;
        });
        return NextResponse.json({
          success: true,
          message: `${ids.length} notification(s) marked as read`,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// POST /api/notifications - Create a new notification (for internal use by other APIs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, titleSw, message, bodySw, actionUrl, imageUrl } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      );
    }

    try {
      const notification = await db.notification.create({
        data: {
          userId,
          type,
          title,
          titleSw: titleSw || null,
          message,
          bodySw: bodySw || null,
          actionUrl: actionUrl || null,
          imageUrl: imageUrl || null,
        },
      });

      return NextResponse.json({
        notification: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          titleSw: notification.titleSw,
          message: notification.message,
          bodySw: notification.bodySw,
          read: notification.read,
          actionUrl: notification.actionUrl,
          imageUrl: notification.imageUrl,
          createdAt: notification.createdAt.toISOString(),
        },
      }, { status: 201 });
    } catch (dbError) {
      console.error('DB create failed for notification:', dbError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
