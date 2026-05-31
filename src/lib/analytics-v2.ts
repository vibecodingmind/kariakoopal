import { db } from '@/lib/db';

export async function trackEvent(eventType: string, userId?: string, metadata?: Record<string, unknown>, value?: number, entityType?: string, entityId?: string) {
  return db.analyticsEvent.create({
    data: {
      eventType,
      userId: userId || null,
      metadata: JSON.stringify(metadata || {}),
      value: value || 0,
      entity_type: entityType || null,
      entityId: entityId || null,
    },
  });
}

export async function generateReport(type: 'daily' | 'weekly' | 'monthly', periodStart: Date, periodEnd: Date, generatedBy: string = 'system') {
  const events = await db.analyticsEvent.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
    orderBy: { createdAt: 'asc' },
  });

  const eventCounts: Record<string, number> = {};
  const totalValue = events.reduce((sum, e) => sum + e.value, 0);
  const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));

  for (const e of events) {
    eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;
  }

  const bookings = events.filter(e => e.eventType === 'booking').length;
  const signups = events.filter(e => e.eventType === 'signup').length;
  const cancellations = events.filter(e => e.eventType === 'cancellation').length;

  const data = {
    totalEvents: events.length,
    uniqueUsers: uniqueUsers.size,
    totalValue,
    bookings,
    signups,
    cancellations,
    eventCounts,
    conversionRate: signups > 0 ? ((bookings / signups) * 100).toFixed(1) : '0',
    avgBookingValue: bookings > 0 ? (totalValue / bookings).toFixed(0) : '0',
  };

  // Simple AI-like insights
  const insights: string[] = [];
  if (bookings > signups * 2) insights.push('High booking-to-signup ratio indicates strong conversion');
  if (cancellations > bookings * 0.3) insights.push('Cancellation rate above 30% - investigate causes');
  if (uniqueUsers.size > 0 && events.length / uniqueUsers.size > 10) insights.push('High engagement: avg ' + Math.round(events.length / uniqueUsers.size) + ' events per user');
  if (totalValue > 0) insights.push(`Total revenue: TZS ${totalValue.toLocaleString()}`);
  if (eventCounts['dispute'] > 0) insights.push(`${eventCounts['dispute']} disputes filed - monitor for patterns`);

  const report = await db.analyticsReport.create({
    data: {
      type,
      periodStart,
      periodEnd,
      data: JSON.stringify(data),
      insights: JSON.stringify(insights),
      generatedBy,
    },
  });

  return { report, data, insights };
}

export async function getRealtimeStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayEvents,
    onlineGuides,
    todayBookings,
    newSignups,
    avgRating,
  ] = await Promise.all([
    db.analyticsEvent.count({ where: { createdAt: { gte: today } } }),
    db.guideProfile.count({ where: { isOnline: true } }),
    db.analyticsEvent.count({ where: { eventType: 'booking', createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.guideProfile.aggregate({ _avg: { avgRating: true } }),
  ]);

  const revenueResult = await db.analyticsEvent.aggregate({
    _sum: { value: true },
    where: { createdAt: { gte: today }, eventType: { in: ['booking', 'tip'] } },
  });

  return {
    activeSessions: todayEvents,
    onlineGuides,
    todayBookings,
    revenueToday: revenueResult._sum.value || 0,
    newSignups,
    avgRating: avgRating._avg.avgRating || 0,
  };
}
