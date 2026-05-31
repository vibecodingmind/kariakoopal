// Kariako Guide Platform - Analytics & Monitoring System
// Simple console/logging-based analytics (can be upgraded to Sentry/PostHog later)

// ── Event Types ──

export type AnalyticsEvent =
  | 'page_view'
  | 'booking_created'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'chat_message_sent'
  | 'ai_feature_used'
  | 'ai_vision_scan'
  | 'ai_haggle_used'
  | 'search_performed'
  | 'guide_matched'
  | 'session_started'
  | 'session_completed'
  | 'session_cancelled'
  | 'user_login'
  | 'user_logout'
  | 'user_registered'
  | 'guide_verification_submitted'
  | 'guide_verification_approved'
  | 'guide_verification_rejected'
  | 'emergency_alert'
  | 'error_occurred'
  | 'wallet_deposit'
  | 'wallet_withdrawal'
  | 'notification_sent'
  | 'email_sent';

// ── Event Data ──

export interface AnalyticsEventData {
  userId?: string;
  userRole?: 'seeker' | 'guide' | 'admin';
  sessionId?: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp?: string;
  page?: string;
  error?: string;
  duration?: number;
}

// ── In-memory event store (for demo) ──

const eventStore: { event: AnalyticsEvent; data: AnalyticsEventData; timestamp: string }[] = [];
const MAX_STORE_SIZE = 1000;

// ── Track Event ──

export function trackEvent(event: AnalyticsEvent, data: AnalyticsEventData = {}): void {
  const timestamp = new Date().toISOString();
  const eventData = {
    event,
    data: {
      ...data,
      timestamp: data.timestamp || timestamp,
    },
    timestamp,
  };

  // Add to in-memory store
  eventStore.push(eventData);
  if (eventStore.length > MAX_STORE_SIZE) {
    eventStore.shift(); // Remove oldest event
  }

  // Console logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] ${event}`, data.metadata || '');
  }

  // In production, this would send to:
  // - PostHog for product analytics
  // - Sentry for error tracking
  // - Custom analytics backend
}

// ── Track Page View ──

export function trackPageView(page: string, userId?: string, userRole?: string): void {
  trackEvent('page_view', {
    userId,
    userRole: userRole as any,
    page,
    metadata: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    },
  });
}

// ── Track Error ──

export function trackError(error: string, userId?: string, metadata?: Record<string, string>): void {
  trackEvent('error_occurred', {
    userId,
    error,
    metadata: metadata || {},
  });

  // In production, this would also send to Sentry
  console.error(`🚨 [Analytics Error] ${error}`, metadata);
}

// ── Track AI Feature ──

export function trackAIFeature(feature: string, userId?: string, metadata?: Record<string, string | number>): void {
  trackEvent('ai_feature_used', {
    userId,
    metadata: { feature, ...metadata },
  });
}

// ── Get Analytics Summary ──

export function getAnalyticsSummary() {
  const totalEvents = eventStore.length;
  const eventsByType: Record<string, number> = {};
  const eventsByHour: Record<string, number> = {};
  const errors: string[] = [];
  const uniqueUsers = new Set<string>();

  eventStore.forEach(({ event, data, timestamp }) => {
    // Count by type
    eventsByType[event] = (eventsByType[event] || 0) + 1;

    // Count by hour
    const hour = timestamp.substring(0, 13); // YYYY-MM-DDTHH
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;

    // Collect errors
    if (event === 'error_occurred' && data.error) {
      errors.push(data.error);
    }

    // Unique users
    if (data.userId) {
      uniqueUsers.add(data.userId);
    }
  });

  return {
    totalEvents,
    uniqueUsers: uniqueUsers.size,
    eventsByType,
    eventsByHour,
    recentErrors: errors.slice(-10),
    topEvents: Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count })),
  };
}

// ── Get Recent Events ──

export function getRecentEvents(limit = 50) {
  return eventStore.slice(-limit).reverse();
}

// ── Performance Tracking ──

export function trackPerformance(label: string, startTime: number): void {
  const duration = Date.now() - startTime;
  trackEvent('ai_feature_used', {
    metadata: {
      label,
      duration,
    },
  });

  if (duration > 5000) {
    console.warn(`⚠️ [Performance] ${label} took ${duration}ms`);
  }
}
