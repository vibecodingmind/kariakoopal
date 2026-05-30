// ── API Client for Kariako Guide Platform ──
// Centralized fetch wrapper with error handling, auth, and typed responses

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      data?.error || `Request failed with status ${res.status}`,
      data
    );
  }

  return res.json();
}

// ── Generic CRUD helpers ──

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ── Typed API responses ──

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Zone APIs ──

export interface Zone {
  id: string;
  name: string;
  nameSw: string;
  description: string;
  descriptionSw: string;
  geoBounds: unknown;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const zonesApi = {
  list: () => api.get<Zone[]>('/zones'),
  get: (id: string) => api.get<Zone>(`/zones/${id}`),
  create: (data: Partial<Zone>) => api.post<Zone>('/zones', data),
  update: (id: string, data: Partial<Zone>) => api.patch<Zone>(`/zones/${id}`, data),
  delete: (id: string) => api.delete<Zone>(`/zones/${id}`),
};

// ── Guide APIs ──

export interface GuideWithProfile {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: string;
  avatarUrl: string | null;
  guideProfile: {
    id: string;
    bio: string;
    status: string;
    zones: string[];
    languages: string[];
    avgRating: number;
    totalSessions: number;
    isOnline: boolean;
    currentStatus: string;
  } | null;
}

export const guidesApi = {
  list: () => api.get<GuideWithProfile[]>('/guides'),
  get: (id: string) => api.get<GuideWithProfile>(`/guides/${id}`),
  update: (id: string, data: Partial<GuideWithProfile>) => api.patch<GuideWithProfile>(`/guides/${id}`, data),
};

// ── Request APIs ──

export interface SessionRequest {
  id: string;
  seekerId: string;
  description: string;
  zoneIds: string[];
  budget: number | null;
  preferredLanguage: string;
  status: 'open' | 'matched' | 'active' | 'completed' | 'cancelled';
  guideId: string | null;
  createdAt: string;
  updatedAt: string;
  seeker?: { id: string; name: string; phone: string; avatarUrl: string | null };
  guide?: { id: string; name: string; phone: string; avatarUrl: string | null };
}

export const requestsApi = {
  list: () => api.get<SessionRequest[]>('/requests'),
  create: (data: { description: string; zoneIds: string[]; budget?: number; preferredLanguage?: string }) =>
    api.post<SessionRequest>('/requests', data),
  update: (id: string, data: Partial<SessionRequest>) => api.patch<SessionRequest>(`/requests/${id}`, data),
};

// ── Session APIs ──

export interface Session {
  id: string;
  requestId: string;
  guideId: string;
  seekerId: string;
  sessionCode: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  escrowStatus: 'held' | 'released' | 'refunded';
  amount: number;
  platformFee: number;
  guideRating: number | null;
  seekerRating: number | null;
  startedAt: string | null;
  endedAt: string | null;
  hasDispute: boolean;
  hasEmergency: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  request?: SessionRequest;
  guide?: { id: string; name: string; avatarUrl: string | null };
  seeker?: { id: string; name: string; avatarUrl: string | null };
}

export const sessionsApi = {
  list: () => api.get<Session[]>('/sessions'),
  create: (data: { requestId: string; guideId: string }) =>
    api.post<Session>('/sessions', data),
  update: (id: string, data: Partial<Session>) => api.patch<Session>(`/sessions/${id}`, data),
};

// ── Message APIs ──

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  translatedContent: string | null;
  createdAt: string;
  sender?: { id: string; name: string; avatarUrl: string | null };
}

export const messagesApi = {
  list: (sessionId: string) => api.get<Message[]>(`/messages?sessionId=${sessionId}`),
  send: (data: { sessionId: string; content: string; translatedContent?: string }) =>
    api.post<Message>('/messages', data),
};

// ── Vendor APIs ──

export interface Vendor {
  id: string;
  name: string;
  zoneId: string;
  categories: string[];
  stallNumber: string | null;
  geoLat: number | null;
  geoLng: number | null;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export const vendorsApi = {
  list: () => api.get<Vendor[]>('/vendors'),
  create: (data: Partial<Vendor>) => api.post<Vendor>('/vendors', data),
};

// ── Price Radar APIs ──

export interface PriceRadarEntry {
  id: string;
  category: string;
  zoneId: string;
  priceMin: number;
  priceMax: number;
  createdAt: string;
  updatedAt: string;
}

export const priceRadarApi = {
  list: () => api.get<PriceRadarEntry[]>('/price-radar'),
  create: (data: Partial<PriceRadarEntry>) => api.post<PriceRadarEntry>('/price-radar', data),
  update: (id: string, data: Partial<PriceRadarEntry>) => api.patch<PriceRadarEntry>(`/price-radar/${id}`, data),
  delete: (id: string) => api.delete<PriceRadarEntry>(`/price-radar/${id}`),
};

// ── Payout APIs ──

export interface Payout {
  id: string;
  guideId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mobileMoneyNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export const payoutsApi = {
  list: () => api.get<Payout[]>('/payouts'),
  create: (data: { guideId: string; amount: number; mobileMoneyNumber?: string }) =>
    api.post<Payout>('/payouts', data),
};

// ── Badge APIs ──

export interface BadgeData {
  id: string;
  guideId: string;
  badgeType: string;
  awardedAt: string;
}

export const badgesApi = {
  list: () => api.get<BadgeData[]>('/badges'),
  create: (data: { guideId: string; badgeType: string }) =>
    api.post<BadgeData>('/badges', data),
};

// ── Fraud Alert APIs ──

export interface FraudAlert {
  id: string;
  entityType: string;
  entityId: string;
  alertType: string;
  confidence: number;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fraudAlertsApi = {
  list: () => api.get<FraudAlert[]>('/fraud-alerts'),
  create: (data: Partial<FraudAlert>) => api.post<FraudAlert>('/fraud-alerts', data),
  update: (id: string, data: Partial<FraudAlert>) => api.patch<FraudAlert>(`/fraud-alerts/${id}`, data),
};

// ── Package Deal APIs ──

export interface PackageDeal {
  id: string;
  guideId: string;
  title: string;
  description: string | null;
  duration: number;
  zoneIds: string[];
  price: number;
  includes: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export const packageDealsApi = {
  list: () => api.get<PackageDeal[]>('/package-deals'),
  create: (data: Partial<PackageDeal>) => api.post<PackageDeal>('/package-deals', data),
  update: (id: string, data: Partial<PackageDeal>) => api.patch<PackageDeal>(`/package-deals/${id}`, data),
  delete: (id: string) => api.delete<PackageDeal>(`/package-deals/${id}`),
};

// ── Seasonal Event APIs ──

export interface SeasonalEvent {
  id: string;
  title: string;
  titleSw: string;
  type: string;
  startDate: string;
  endDate: string;
  affectedZones: string[];
  insiderTip: string | null;
  insiderTipSw: string | null;
  createdAt: string;
  updatedAt: string;
}

export const seasonalEventsApi = {
  list: () => api.get<SeasonalEvent[]>('/seasonal-events'),
  create: (data: Partial<SeasonalEvent>) => api.post<SeasonalEvent>('/seasonal-events', data),
};

// ── Exchange Rate APIs ──

export interface ExchangeRate {
  id: string;
  currency: string;
  rate: number;
  updatedAt: string;
}

export const exchangeRatesApi = {
  list: () => api.get<ExchangeRate[]>('/exchange-rates'),
  create: (data: { currency: string; rate: number }) => api.post<ExchangeRate>('/exchange-rates', data),
};

// ── Market Story APIs ──

export interface MarketStory {
  id: string;
  guideId: string;
  vendorId: string | null;
  zoneId: string;
  title: string;
  content: string;
  audioUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const marketStoriesApi = {
  list: () => api.get<MarketStory[]>('/market-stories'),
  create: (data: Partial<MarketStory>) => api.post<MarketStory>('/market-stories', data),
};

// ── Mentorship APIs ──

export interface Mentorship {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  sessionsDone: number;
  sessionsRequired: number;
  bonusPercent: number;
  createdAt: string;
  updatedAt: string;
}

export const mentorshipsApi = {
  list: () => api.get<Mentorship[]>('/mentorships'),
  create: (data: Partial<Mentorship>) => api.post<Mentorship>('/mentorships', data),
};

// ── Buddy Match APIs ──

export interface BuddyMatch {
  id: string;
  seeker1Id: string;
  seeker2Id: string;
  zoneId: string;
  guideId: string | null;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const buddyMatchesApi = {
  list: () => api.get<BuddyMatch[]>('/buddy-matches'),
  create: (data: Partial<BuddyMatch>) => api.post<BuddyMatch>('/buddy-matches', data),
};

// ── Nav Waypoint APIs ──

export interface NavWaypoint {
  id: string;
  zoneId: string;
  label: string;
  labelSw: string;
  qrCode: string | null;
  floorPlanX: number | null;
  floorPlanY: number | null;
  directions: unknown;
  createdAt: string;
  updatedAt: string;
}

export const navWaypointsApi = {
  list: () => api.get<NavWaypoint[]>('/nav-waypoints'),
  create: (data: Partial<NavWaypoint>) => api.post<NavWaypoint>('/nav-waypoints', data),
};

// ── Vendor Verification APIs ──

export interface VendorVerification {
  id: string;
  vendorId: string;
  isVerified: boolean;
  qrCode: string | null;
  monthlyFee: number;
  createdAt: string;
  updatedAt: string;
}

export const vendorVerificationsApi = {
  list: () => api.get<VendorVerification[]>('/vendor-verifications'),
  create: (data: Partial<VendorVerification>) => api.post<VendorVerification>('/vendor-verifications', data),
};

// ── Session Recording APIs ──

export interface SessionRecording {
  id: string;
  sessionId: string;
  recordingUrl: string | null;
  guideConsent: boolean;
  seekerConsent: boolean;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export const sessionRecordingsApi = {
  list: () => api.get<SessionRecording[]>('/session-recordings'),
  create: (data: Partial<SessionRecording>) => api.post<SessionRecording>('/session-recordings', data),
};

// ── Guide Subscription APIs ──

export interface GuideSubscription {
  id: string;
  guideId: string;
  tier: 'starter' | 'pro' | 'elite';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export const guideSubscriptionsApi = {
  list: () => api.get<GuideSubscription[]>('/guide-subscriptions'),
  create: (data: Partial<GuideSubscription>) => api.post<GuideSubscription>('/guide-subscriptions', data),
};

// ── Group Tour APIs

export interface GroupTour {
  id: string;
  guideId: string;
  zoneId: string;
  title: string;
  description: string;
  descriptionSw: string;
  maxParticipants: number;
  currentCount: number;
  soloPrice: number;
  groupPrice: number;
  timeSlot: string;
  date: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const groupToursApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ items: GroupTour[] }>(`/group-tours${query}`);
  },
  get: (id: string) => api.get<{ item: GroupTour }>(`/group-tours/${id}`),
  create: (data: Record<string, unknown>) => api.post<{ item: GroupTour }>('/group-tours', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<{ item: GroupTour }>(`/group-tours/${id}`, data),
};

// ── Shopping List APIs

export interface ShoppingListItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
  zone: string;
  purchased: boolean;
}

export interface ShoppingListData {
  id: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const shoppingListsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ items: ShoppingListData[] }>(`/shopping-lists${query}`);
  },
  get: (id: string) => api.get<{ item: ShoppingListData }>(`/shopping-lists/${id}`),
  create: (data: Record<string, unknown>) => api.post<{ item: ShoppingListData }>('/shopping-lists', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<{ item: ShoppingListData }>(`/shopping-lists/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/shopping-lists/${id}`),
};

// ── Calendar Reminder APIs

export interface CalendarReminderData {
  id: string;
  userId: string;
  eventId: string;
  createdAt: string;
}

export const calendarRemindersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ items: CalendarReminderData[] }>(`/calendar-reminders${query}`);
  },
  create: (data: Record<string, unknown>) => api.post<{ item: CalendarReminderData }>('/calendar-reminders', data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/calendar-reminders/${id}`),
};

// ── Admin APIs ──

export interface AdminStats {
  totalUsers: number;
  totalGuides: number;
  totalSeekers: number;
  totalSessions: number;
  totalRevenue: number;
  activeDisputes: number;
  pendingVerifications: number;
  fraudAlerts: number;
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  disputes: () => api.get<Session[]>('/admin/disputes'),
  verify: (data: { type: string; id: string; approved: boolean }) =>
    api.post<{ success: boolean }>('/admin/verify', data),
};
