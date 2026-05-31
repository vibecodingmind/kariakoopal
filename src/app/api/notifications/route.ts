import { NextResponse } from 'next/server';

// ── Demo notifications ──
const demoNotifications = [
  { id: 'n1', userId: 'demo', type: 'session', title: 'New Session Request', message: 'Amina Hassan wants a guide for the Fabrics Zone tomorrow at 10:00 AM.', read: false, actionUrl: '/guide/sessions', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'n2', userId: 'demo', type: 'payment', title: 'Payment Received', message: 'TZS 25,000 has been credited to your wallet for session #S-2847.', read: false, actionUrl: '/wallet', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'n3', userId: 'demo', type: 'system', title: 'System Update', message: 'Kariako Guide v2.5 is now available with improved map features.', read: false, actionUrl: '/settings', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n4', userId: 'demo', type: 'session', title: 'Session Completed', message: 'Your session with Juma Michael has been marked as completed.', read: true, actionUrl: '/seeker/history', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: 'n5', userId: 'demo', type: 'payment', title: 'Subscription Renewal', message: 'Your Pro subscription will renew on March 15, 2026.', read: false, actionUrl: '/guide/subscriptions', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: 'n6', userId: 'demo', type: 'warning', title: 'Fraud Alert', message: 'Unusual activity detected on your account. Please review your recent sessions.', read: false, actionUrl: '/settings/security', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: 'n7', userId: 'demo', type: 'success', title: 'Review Received', message: 'Fatima Abdallah left a 5-star review!', read: true, actionUrl: '/guide/profile', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n8', userId: 'demo', type: 'info', title: 'New Zone Available', message: 'The Artisanal Zone is now available for guided tours.', read: true, actionUrl: '/guide/profile', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
  { id: 'n9', userId: 'demo', type: 'payment', title: 'Payout Processed', message: 'Your payout of TZS 85,000 has been sent to M-Pesa.', read: true, actionUrl: '/wallet', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'n10', userId: 'demo', type: 'session', title: 'Buddy Match Found', message: 'We found a buddy match for you in the Spices Zone.', read: false, actionUrl: '/market', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
  { id: 'n11', userId: 'demo', type: 'system', title: 'Holiday Schedule', message: 'Kariakoo market will have special hours during Eid al-Fitr.', read: true, actionUrl: '/events', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'n12', userId: 'demo', type: 'error', title: 'Payment Failed', message: 'Your wallet top-up of TZS 10,000 failed. Please try again.', read: false, actionUrl: '/wallet', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
];

// GET /api/notifications - Return list of notifications
export async function GET() {
  return NextResponse.json({
    notifications: demoNotifications,
    unreadCount: demoNotifications.filter((n) => !n.read).length,
  });
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ids, markAll } = body;

    if (markAll) {
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (ids && Array.isArray(ids)) {
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
