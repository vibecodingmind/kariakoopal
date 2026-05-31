// Chimbo Direct - Web Push Notification Helper
// Server-side utility for sending push notifications

// ── Types ──

interface PushNotificationPayload {
  title: string;
  body: string;
  type: 'new_message' | 'booking_confirmed' | 'booking_new' | 'escrow_release' | 'payment_received' | 'guide_verified' | 'dispute' | 'info';
  url?: string;
  actionUrl?: string;
  tag?: string;
  notificationId?: string;
  conversationId?: string;
  bookingId?: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ── Send Push Notification ──

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, this would:
    // 1. Look up the user's push subscription from UserSecurity
    // 2. Use web-push library to send the notification
    // 3. Handle expired subscriptions

    console.log(`🔔 [Push Notification] Sending to user ${userId}:`, {
      title: payload.title,
      type: payload.type,
    });

    // Demo mode: log instead of sending
    return {
      success: true,
      message: `Push notification queued for user ${userId} (demo mode)`,
    };
  } catch (error) {
    console.error('Push notification send error:', error);
    return {
      success: false,
      message: 'Failed to send push notification',
    };
  }
}

// ── Send Push to Multiple Users ──

export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

// ── Notification Templates ──

export const NotificationTemplates = {
  newMessage: (senderName: string, messagePreview: string, conversationId: string): PushNotificationPayload => ({
    title: `Message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    type: 'new_message',
    url: `/chat/${conversationId}`,
    actionUrl: `/chat/${conversationId}`,
    tag: `chat-${conversationId}`,
    conversationId,
  }),

  bookingConfirmed: (guideName: string, zone: string, bookingId: string): PushNotificationPayload => ({
    title: 'Booking Confirmed! ✅',
    body: `Your session with ${guideName} in ${zone} has been confirmed.`,
    type: 'booking_confirmed',
    url: '/seeker/bookings',
    actionUrl: '/seeker/bookings',
    tag: `booking-${bookingId}`,
    bookingId,
  }),

  bookingNew: (seekerName: string, zone: string, budget: number): PushNotificationPayload => ({
    title: 'New Booking Request 📋',
    body: `${seekerName} wants a guide in ${zone}. Budget: TZS ${budget.toLocaleString()}`,
    type: 'booking_new',
    url: '/guide/sessions',
    actionUrl: '/guide/sessions',
  }),

  escrowRelease: (amount: number, sessionId: string): PushNotificationPayload => ({
    title: 'Payment Released! 💰',
    body: `TZS ${amount.toLocaleString()} has been released to your wallet.`,
    type: 'escrow_release',
    url: '/wallet',
    actionUrl: '/wallet',
    tag: `escrow-${sessionId}`,
  }),

  paymentReceived: (amount: number, description: string): PushNotificationPayload => ({
    title: 'Payment Received 💵',
    body: `TZS ${amount.toLocaleString()} - ${description}`,
    type: 'payment_received',
    url: '/wallet',
    actionUrl: '/wallet',
  }),

  guideVerified: (status: 'approved' | 'pending' | 'rejected'): PushNotificationPayload => ({
    title: status === 'approved' ? 'Verification Approved! ✅' : status === 'rejected' ? 'Verification Update' : 'Verification In Progress',
    body: status === 'approved'
      ? 'Your guide verification has been approved. You can now accept bookings!'
      : status === 'rejected'
        ? 'Your verification was not approved. Please review and reapply.'
        : 'Your verification documents are being reviewed (24-48 hours).',
    type: 'guide_verified',
    url: '/guide/profile',
    actionUrl: '/guide/profile',
  }),

  dispute: (sessionId: string, reason: string): PushNotificationPayload => ({
    title: 'Dispute Filed ⚠️',
    body: `A dispute has been filed. Funds are frozen until resolved. Reason: ${reason}`,
    type: 'dispute',
    url: '/wallet',
    actionUrl: '/wallet',
    tag: `dispute-${sessionId}`,
  }),
};
