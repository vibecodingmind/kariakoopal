'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useGuideStore } from '@/lib/stores/guide-store';
import { useSessionStore } from '@/lib/stores/session-store';
import { t, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// API client
import {
  api,
  guidesApi,
  requestsApi,
  sessionsApi,
  messagesApi,
  payoutsApi,
  badgesApi,
  seasonalEventsApi,
  marketStoriesApi,
  mentorshipsApi,
  sessionRecordingsApi,
  guideSubscriptionsApi,
  exchangeRatesApi,
  type GuideSubscription,
  type SeasonalEvent,
  type MarketStory,
  type Mentorship,
  type SessionRecording as SessionRecordingType,
  type ExchangeRate,
} from '@/lib/api';

// Socket.io hooks
import { useSocketIO, useSessionChat, useGuideRequests, useSessionUpdates, useLiveLocations } from '@/hooks/use-socket';
import { emitGuideStatus, emitChatMessage, emitJoinSession, emitLeaveSession } from '@/lib/socket';

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// lucide icons
import {
  Home,
  Radio,
  Clock,
  DollarSign,
  User,
  MapPin,
  Star,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Crown,
  TrendingUp,
  RefreshCw,
  X,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Camera,
  Globe,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Send,
  MessageSquare,
  Activity,
  Wallet,
  CircleDollarSign,
  Banknote,
  CircleAlert,
  Timer,
  Package,
  Scissors,
  Flame,
  CalendarCheck,
  Trophy,
  Medal,
  WifiOff,
  GraduationCap,
  Calendar,
  Mic,
  BarChart3,
  Navigation,
  BookOpen,
} from 'lucide-react';

// Shared components
import { SessionTracker } from '@/components/session-tracker';
import { SessionChat } from '@/components/session-chat';
import { GoogleMap } from '@/components/google-map';
import { BadgeDisplay } from '@/components/badge-display';
import { RatingStars } from '@/components/rating-stars';
import { EscrowPayment } from '@/components/escrow-payment';
import { EmergencyPanel } from '@/components/emergency-panel';
import { SubscriptionTiers } from '@/components/subscription-tiers';
import { PackageDeals } from '@/components/package-deals';
import { MentorshipProgram } from '@/components/mentorship-program';
import { SeasonalCalendar } from '@/components/seasonal-calendar';
import MarketStoriesComp from '@/components/market-stories';
import { USSDOfflineMode } from '@/components/ussd-offline-mode';
import { GuideInsights } from '@/components/guide-insights';
import { VoiceMessages } from '@/components/voice-messages';
import { MultiCurrency } from '@/components/multi-currency';
import { SessionRecording } from '@/components/session-recording';
import { SmartTimeout } from '@/components/smart-timeout';
import { IndoorNavigation } from '@/components/indoor-navigation';
import { toast } from 'sonner';

// ── Types ──

type GuideView = 'home' | 'requests' | 'session' | 'earnings' | 'badges' | 'profile' | 'subscription' | 'packages' | 'mentorship' | 'calendar' | 'stories' | 'insights';

interface Zone {
  id: string;
  name: string;
  nameSw: string;
  color: string;
  nameKey: string;
}

interface RequestItem {
  id: string;
  seekerId: string;
  description: string;
  zoneIds: string;
  budget: number;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  seeker?: { id: string; name: string; phone: string; avatarUrl: string | null };
  zones?: Zone[];
  sessions?: SessionItem[];
}

interface SessionItem {
  id: string;
  requestId: string;
  guideId: string;
  seekerId: string;
  sessionCode: string;
  startedAt: string | null;
  completedAt: string | null;
  escrowStatus: string;
  amount: number;
  platformFee: number;
  ratingSeeker: number | null;
  ratingGuide: number | null;
  reviewSeeker: string | null;
  reviewGuide: string | null;
  disputeFlag: boolean;
  disputeReason: string | null;
  emergencyFlag: boolean;
  seekerConfirmed: boolean;
  guideConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  guide?: { id: string; name: string; phone: string; avatarUrl: string | null };
  seeker?: { id: string; name: string; phone: string; avatarUrl: string | null };
  request?: { id: string; description: string; status: string; budget: number };
  messages?: MessageItem[];
}

interface MessageItem {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  translatedContent: string | null;
  createdAt: string;
  sender?: { id: string; name: string; avatarUrl: string | null };
}

interface PayoutItem {
  id: string;
  guideId: string;
  amount: number;
  status: string;
  mobileMoneyNumber: string;
  processedAt: string | null;
  createdAt: string;
}

interface GuideProfileData {
  id: string;
  userId: string;
  bio: string;
  idDocumentUrl: string | null;
  status: 'pending' | 'active' | 'suspended';
  zones: string[];
  languages: string[];
  avgRating: number;
  totalSessions: number;
  isOnline: boolean;
  currentStatus: 'online' | 'offline' | 'busy';
  createdAt: string;
  updatedAt: string;
}

interface BadgeData {
  id: string;
  guideId: string;
  badgeType: string;
  awardedAt: string;
}

interface LeaderboardGuideData {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  totalSessions: number;
  sessionsThisWeek: number;
  zones: string[];
  isVerifiedElite: boolean;
}

// ── Helpers ──

function formatTZS(amount: number, lang: Language): string {
  return `TZS ${new Intl.NumberFormat(lang === 'sw' ? 'sw-TZ' : 'en-US').format(amount)}`;
}

function formatDate(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = [
  'bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600',
  'bg-teal-600', 'bg-orange-600', 'bg-purple-600', 'bg-indigo-600',
];

function getAvatarColor(id: string): string {
  return avatarColors[id.charCodeAt(0) % avatarColors.length];
}

const zoneColorMap: Record<string, { bg: string; text: string }> = {
  zone_vyombo: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  zone_electronics: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  zone_fabric: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  zone_spices: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  zone_wholesale: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
};

const allBadgeTypes = [
  'vyombo_specialist', 'electronics_pro', 'top_rated', '100_sessions',
  'fabric_expert', 'spice_master', 'wholesale_guru', 'verified_elite',
  '7_day_streak', 'guide_of_week',
];

const badgeIconMap: Record<string, React.ElementType> = {
  vyombo_specialist: Package,
  electronics_pro: Zap,
  top_rated: Star,
  '100_sessions': Trophy,
  fabric_expert: Scissors,
  spice_master: Flame,
  wholesale_guru: Package,
  verified_elite: ShieldCheck,
  '7_day_streak': CalendarCheck,
  guide_of_week: Crown,
};

const badgeColorMap: Record<string, { color: string; bg: string }> = {
  vyombo_specialist: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800' },
  electronics_pro: { color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800' },
  top_rated: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  '100_sessions': { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  fabric_expert: { color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800' },
  spice_master: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
  wholesale_guru: { color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800' },
  verified_elite: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  '7_day_streak': { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800' },
  guide_of_week: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800' },
};

const defaultBadgeConfig = { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700' };

const allLanguages = ['sw', 'en', 'ar', 'fr', 'de', 'zh', 'it'];

const langLabelMap: Record<string, string> = {
  sw: 'Kiswahili', en: 'English', ar: 'العربية', fr: 'Français',
  de: 'Deutsch', zh: '中文', it: 'Italiano',
};

// Simulated request data removed — all data comes from real API + Socket.io

// ── Component ──

export function GuideDashboard() {
  const { user, language, guideProfile, badges, setGuideProfile, setBadges } = useAuthStore();
  const guideStore = useGuideStore();
  const { setActiveSession, clearSession, setSessionHistory } = useSessionStore();
  const lang = language as Language;

  // Socket.io hooks
  const { startLocationTracking } = useSocketIO();

  // View state
  const [view, setView] = useState<GuideView>('home');

  // Data state
  const [zones, setZones] = useState<Zone[]>([]);
  const [profile, setProfile] = useState<GuideProfileData | null>(null);
  const [myBadges, setMyBadges] = useState<BadgeData[]>([]);
  const [liveRequests, setLiveRequests] = useState<RequestItem[]>([]);
  const [activeSessionData, setActiveSessionData] = useState<SessionItem | null>(null);
  const [sessionMessages, setSessionMessages] = useState<MessageItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [leaderboardGuides, setLeaderboardGuides] = useState<LeaderboardGuideData[]>([]);

  // Additional data from API
  const [subscriptions, setSubscriptions] = useState<GuideSubscription[]>([]);
  const [mentorshipsData, setMentorshipsData] = useState<Mentorship[]>([]);
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([]);
  const [marketStories, setMarketStories] = useState<MarketStory[]>([]);
  const [sessionRecordings, setSessionRecordings] = useState<SessionRecordingType[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [seekerLocation, setSeekerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isLoadingMentorships, setIsLoadingMentorships] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status toggle
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);

  // Active session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: 'cl_1', text: lang === 'sw' ? 'Kutana na muombaji' : 'Meet seeker', completed: false },
    { id: 'cl_2', text: lang === 'sw' ? 'Thibitisha kodi ya kikao' : 'Confirm session code', completed: false },
    { id: 'cl_3', text: lang === 'sw' ? 'Onyesha maeneo ya soko' : 'Show market zones', completed: false },
  ]);

  // Earnings dialog
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutMobileNumber, setPayoutMobileNumber] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');

  // Profile edit state
  const [editBio, setEditBio] = useState('');
  const [editZones, setEditZones] = useState<string[]>([]);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Session feature state
  const [sessionTab, setSessionTab] = useState<'chat' | 'map' | 'navigation'>('chat');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordings, setVoiceRecordings] = useState<Array<{ id: string; duration: number; transcription: string; timestamp: number }>>([]);
  const [isSessionRecording, setIsSessionRecording] = useState(false);
  const [sessionRecordingDuration, setSessionRecordingDuration] = useState(0);
  const [guideRecordingConsent, setGuideRecordingConsent] = useState(false);
  const [seekerRecordingConsent, setSeekerRecordingConsent] = useState(false);
  const [lastSessionActivity, setLastSessionActivity] = useState(Date.now());
  const [isUssdOffline, setIsUssdOffline] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('TZS');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Location tracking cleanup ref
  const locationCleanupRef = useRef<(() => void) | null>(null);

  // ── Data Fetching ──

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoadingProfile(true);
    try {
      const data = await api.get<Record<string, unknown>>(`/guides/${user.id}`);
      const raw = (data as Record<string, unknown>).guide || data;
      const g = ((raw as Record<string, unknown>).guideProfile || raw) as Record<string, unknown>;
      if (g) {
        const profileZones = typeof g.zones === 'string' ? JSON.parse(g.zones as string) : (g.zones as string[]) || [];
        const profileLanguages = typeof g.languages === 'string' ? JSON.parse(g.languages as string) : (g.languages as string[]) || [];
        const profileData: GuideProfileData = {
          id: g.id as string,
          userId: (g.userId as string) || user.id,
          bio: (g.bio as string) || '',
          idDocumentUrl: (g.idDocumentUrl as string | null) || null,
          status: (g.status as 'pending' | 'active' | 'suspended') || 'pending',
          zones: profileZones,
          languages: profileLanguages,
          avgRating: (g.avgRating as number) || 0,
          totalSessions: (g.totalSessions as number) || 0,
          isOnline: (g.isOnline as boolean) || false,
          currentStatus: (g.currentStatus as 'online' | 'offline' | 'busy') || 'offline',
          createdAt: (g.createdAt as string) || '',
          updatedAt: (g.updatedAt as string) || '',
        };
        setProfile(profileData);
        setGuideProfile(profileData);
        setEditBio(profileData.bio);
        setEditZones(profileData.zones);
        setEditLanguages(profileData.languages);
        guideStore.setOnline(profileData.isOnline);
        guideStore.setStatus(profileData.currentStatus);
        guideStore.setCurrentZoneIds(profileData.zones);
      }

      // Fetch badges separately via badges API
      try {
        const badgesList = await badgesApi.list();
        const rawBadges = Array.isArray(badgesList) ? badgesList : [];
        const guideBadges = rawBadges.filter((b: { guideId: string }) => b.guideId === (g?.id || user.id));
        setMyBadges(guideBadges);
        setBadges(guideBadges);
      } catch {
        // Badges fetch is non-critical
      }
    } catch {
      setError(lang === 'sw' ? 'Imeshindwa kupakia wasifu' : 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, lang, setGuideProfile, setBadges, guideStore]);

  const fetchZones = useCallback(async () => {
    setIsLoadingZones(true);
    try {
      const zonesList = await api.get<unknown>('/zones');
      const raw = (Array.isArray(zonesList) ? zonesList : (zonesList as Record<string, unknown[] & Record<string, unknown>>).zones || []) as Array<Record<string, unknown>>;
      const mapped: Zone[] = raw.map((z) => ({
        id: z.id as string,
        name: z.name as string,
        nameSw: (z.nameSw as string) || (z.name as string),
        color: z.color as string,
        nameKey: `zone_${(z.name as string).toLowerCase()}`,
      }));
      setZones(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingZones(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setIsLoadingRequests(true);
    try {
      const data = await requestsApi.list();
      const raw = Array.isArray(data) ? data : ((data as Record<string, unknown>).requests || []) as unknown[];
      const apiRequests = raw as RequestItem[];

      setLiveRequests(apiRequests);
      guideStore.setLiveRequests(apiRequests.map((r) => ({
        id: r.id,
        seekerId: r.seekerId,
        description: r.description,
        zoneIds: typeof r.zoneIds === 'string' ? JSON.parse(r.zoneIds || '[]') : r.zoneIds || [],
        budget: r.budget,
        photoUrl: r.photoUrl,
        status: r.status as 'open' | 'matched' | 'active' | 'completed' | 'cancelled',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        seekerName: r.seeker?.name,
        seekerPhone: r.seeker?.phone,
        zoneNames: r.zones?.map((z) => z.name),
      })));
    } catch {
      /* ignore */
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user, guideStore]);

  const fetchActiveSession = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const data = await api.get<Record<string, unknown>>(`/sessions/${sessionId}`);
      const session = (data as Record<string, unknown>).session || data;
      setActiveSessionData(session as SessionItem);
      setSessionMessages(((session as SessionItem).messages || []) as MessageItem[]);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await sessionsApi.list();
      const raw = Array.isArray(data) ? data : ((data as Record<string, unknown>).sessions || []) as unknown[];
      const sessionsList = raw as SessionItem[];
      setSessions(sessionsList);
      setSessionHistory(sessionsList as unknown as import('@/lib/stores/session-store').Session[]);

      // Check for active session
      const active = sessionsList.find(
        (s) => s.escrowStatus === 'held' && !s.completedAt
      );
      if (active) {
        setActiveSessionId(active.id);
        fetchActiveSession(active.id);
        emitJoinSession(active.id);
      }
    } catch {
      /* ignore */
    }
  }, [user, fetchActiveSession, setSessionHistory]);

  const fetchPayouts = useCallback(async () => {
    if (!user) return;
    setIsLoadingPayouts(true);
    try {
      const data = await payoutsApi.list();
      const raw = Array.isArray(data) ? data : ((data as Record<string, unknown>).payouts || []) as unknown[];
      setPayouts(raw as PayoutItem[]);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingPayouts(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await guidesApi.list();
      const raw = Array.isArray(data) ? data : ((data as Record<string, unknown>).guides || []) as unknown[];
      const guidesList = raw as Array<Record<string, unknown>>;
      const mapped = guidesList.map((g) => {
        const gp = (g.guideProfile || g) as Record<string, unknown>;
        const profileZones = typeof gp.zones === 'string' ? JSON.parse(gp.zones as string) : (gp.zones as string[]) || [];
        const u = (g.user || g) as Record<string, unknown>;
        const b = (gp.badges || g.badges || []) as Array<Record<string, string>>;
        return {
          id: (u?.id as string) || (gp.userId as string),
          name: (u?.name as string) || '',
          avatarUrl: (u?.avatarUrl as string | null) || null,
          rating: (gp.avgRating as number) || 0,
          totalSessions: (gp.totalSessions as number) || 0,
          sessionsThisWeek: Math.floor((gp.totalSessions as number || 0) * 0.1),
          zones: profileZones,
          isVerifiedElite: b.some((badge) => badge.badgeType === 'verified_elite'),
        };
      }).sort((a, b) => b.rating - a.rating);
      setLeaderboardGuides(mapped);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Additional fetch functions ──

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    setIsLoadingSubscriptions(true);
    try {
      const data = await guideSubscriptionsApi.list();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }, [user]);

  const fetchMentorships = useCallback(async () => {
    if (!user) return;
    setIsLoadingMentorships(true);
    try {
      const data = await mentorshipsApi.list();
      setMentorshipsData(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingMentorships(false);
    }
  }, [user]);

  const fetchSeasonalEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await seasonalEventsApi.list();
      setSeasonalEvents(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const fetchMarketStories = useCallback(async () => {
    setIsLoadingStories(true);
    try {
      const data = await marketStoriesApi.list();
      setMarketStories(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingStories(false);
    }
  }, []);

  const fetchSessionRecordings = useCallback(async () => {
    try {
      const data = await sessionRecordingsApi.list();
      setSessionRecordings(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const data = await exchangeRatesApi.list();
      setExchangeRates(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Socket.io real-time hooks ──

  // Receive new guide requests via Socket.io
  useGuideRequests(useCallback((req) => {
    setLiveRequests((prev) => {
      const newReq: RequestItem = {
        id: req.requestId,
        seekerId: req.seekerId,
        description: req.description,
        zoneIds: JSON.stringify(req.zoneIds),
        budget: req.budget || 0,
        photoUrl: null,
        status: 'open',
        createdAt: new Date(req.timestamp).toISOString(),
        updatedAt: new Date(req.timestamp).toISOString(),
        seeker: { id: req.seekerId, name: req.seekerName, phone: '', avatarUrl: null },
      };
      if (prev.some((r) => r.id === newReq.id)) return prev;
      return [newReq, ...prev.slice(0, 19)];
    });
    toast.info(lang === 'sw' ? 'Ombi jipya limeingia!' : 'New request just came in!');
  }, [lang]));

  // Receive real-time chat messages via Socket.io
  useSessionChat(activeSessionId, useCallback((msg) => {
    setSessionMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, {
        id: msg.id,
        sessionId: msg.sessionId,
        senderId: msg.senderId,
        content: msg.content,
        translatedContent: msg.translatedContent,
        createdAt: new Date(msg.timestamp).toISOString(),
        sender: undefined,
      }];
    });
  }, []));

  // Receive session status updates via Socket.io
  useSessionUpdates(useCallback((update) => {
    if (update.sessionId === activeSessionId) {
      fetchActiveSession(update.sessionId);
    }
    if (update.status === 'completed' || update.status === 'cancelled') {
      fetchSessions();
    }
  }, [activeSessionId, fetchActiveSession, fetchSessions]));

  // Receive live location updates from seeker during session
  useLiveLocations(useCallback((loc) => {
    if (activeSessionId && loc.userId !== user?.id) {
      setSeekerLocation({ lat: loc.lat, lng: loc.lng });
    }
  }, [activeSessionId, user?.id]));

  // ── Initial data loading ──

  useEffect(() => {
    fetchZones();
    fetchLeaderboard();
    fetchSeasonalEvents();
    fetchMarketStories();
    fetchSessionRecordings();
    fetchExchangeRates();
  }, [fetchZones, fetchLeaderboard, fetchSeasonalEvents, fetchMarketStories, fetchSessionRecordings, fetchExchangeRates]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSessions();
      fetchPayouts();
      fetchSubscriptions();
      fetchMentorships();
    }
  }, [user, fetchProfile, fetchSessions, fetchPayouts, fetchSubscriptions, fetchMentorships]);

  // ── Fetch requests when online ──

  useEffect(() => {
    if (guideStore.isOnline && user) {
      fetchRequests();
      // Poll every 10 seconds when online as a fallback alongside Socket.io
      const interval = setInterval(fetchRequests, 10000);
      return () => clearInterval(interval);
    } else {
      setLiveRequests([]);
    }
  }, [guideStore.isOnline, user, fetchRequests]);

  // ── Start location tracking when in active session ──

  useEffect(() => {
    if (activeSessionId && guideStore.isOnline) {
      const cleanup = startLocationTracking();
      locationCleanupRef.current = cleanup;
      return () => {
        cleanup();
        locationCleanupRef.current = null;
      };
    }
  }, [activeSessionId, guideStore.isOnline, startLocationTracking]);

  // ── Session chat polling (fallback alongside Socket.io) ──

  useEffect(() => {
    if (!activeSessionId || view !== 'session') return;
    const interval = setInterval(() => {
      fetchActiveSession(activeSessionId);
    }, 15000); // Reduced frequency since Socket.io handles real-time
    return () => clearInterval(interval);
  }, [activeSessionId, view, fetchActiveSession]);

  // ── Actions ──

  const handleToggleStatus = useCallback(async (newStatus: 'online' | 'offline' | 'busy') => {
    if (!user) return;
    setStatusToggleLoading(true);
    try {
      await api.patch(`/guides/${user.id}`, {
        currentStatus: newStatus,
        isOnline: newStatus === 'online',
      });
      emitGuideStatus(newStatus);
      guideStore.setStatus(newStatus);
      if (profile) {
        setProfile({ ...profile, currentStatus: newStatus, isOnline: newStatus === 'online' });
      }
      toast.success(
        newStatus === 'online'
          ? lang === 'sw' ? 'Uko mtandaoni sasa!' : 'You are now online!'
          : newStatus === 'busy'
            ? lang === 'sw' ? 'Hali yako ni masilini' : 'Status set to busy'
            : lang === 'sw' ? 'Umetoka mtandaoni' : 'You are now offline'
      );
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kubadilisha hali' : 'Failed to change status');
    } finally {
      setStatusToggleLoading(false);
    }
  }, [user, lang, profile, guideStore]);

  const handleAcceptRequest = useCallback(async (request: RequestItem) => {
    if (!user) return;

    // Enforce one active session at a time
    if (activeSessionId) {
      toast.error(lang === 'sw' ? 'Una kikao kinachoendelea. Maliza kwanza!' : 'You have an active session. Finish it first!');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<unknown>('/sessions', {
        requestId: request.id,
        guideId: user.id,
      });
      const session = ((data as Record<string, unknown>).session || data) as SessionItem;
      toast.success(lang === 'sw' ? 'Ombi limekubaliwa! Kikao kimeanza' : 'Request accepted! Session started');

      // Update status to busy
      emitGuideStatus('busy');
      guideStore.setStatus('busy');
      if (profile) {
        setProfile({ ...profile, currentStatus: 'busy' });
      }

      setActiveSessionId((session as SessionItem).id || null);
      setActiveSessionData(session as SessionItem);
      setSessionMessages([]);
      setActiveSession(session as unknown as import('@/lib/stores/session-store').Session);

      // Join the session room via Socket.io
      emitJoinSession(session.id);

      // Remove accepted request from list
      setLiveRequests((prev) => prev.filter((r) => r.id !== request.id));

      setView('session');
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukubali ombi' : 'Failed to accept request');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, activeSessionId, lang, profile, guideStore, fetchSessions]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeSessionId || !user) return;
    try {
      await messagesApi.send({
        sessionId: activeSessionId,
        content,
      });
      emitChatMessage(activeSessionId, content);
      fetchActiveSession(activeSessionId);
    } catch {
      /* ignore */
    }
  }, [activeSessionId, user, fetchActiveSession]);

  const handleCompleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await api.patch(`/sessions/${activeSessionId}`, { action: 'complete' });
      emitLeaveSession(activeSessionId);
      toast.success(lang === 'sw' ? 'Kikao kimemalizika!' : 'Session completed!');
      clearSession();
      setActiveSessionId(null);
      setActiveSessionData(null);
      setSeekerLocation(null);
      emitGuideStatus('online');
      guideStore.setStatus('online');
      if (profile) {
        setProfile({ ...profile, currentStatus: 'online', isOnline: true });
      }
      fetchSessions();
      fetchPayouts();
      fetchProfile();
      setView('home');
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukamilisha kikao' : 'Failed to complete session');
    }
  }, [activeSessionId, lang, profile, guideStore, clearSession, fetchSessions, fetchPayouts, fetchProfile]);

  const handleConfirmSession = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await api.patch(`/sessions/${activeSessionId}`, { action: 'confirm', guideConfirmed: true });
      toast.success(lang === 'sw' ? 'Umethibitisha kikao!' : 'You confirmed the session!');
      fetchActiveSession(activeSessionId);
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kuthibitisha' : 'Failed to confirm');
    }
  }, [activeSessionId, lang, fetchActiveSession]);

  const handleEmergency = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await api.patch(`/sessions/${activeSessionId}`, { action: 'emergency' });
      toast.error(lang === 'sw' ? 'Tahadhari imetumwa! Msaada unakuja.' : 'Emergency alert sent! Help is on the way.');
    } catch {
      /* ignore */
    }
  }, [activeSessionId, lang]);

  const handleRequestPayout = useCallback(async () => {
    if (!user || !payoutMobileNumber.trim()) return;
    setIsSubmitting(true);
    try {
      await payoutsApi.create({
        guideId: user.id,
        amount: parseFloat(payoutAmount) || 0,
        mobileMoneyNumber: payoutMobileNumber.trim(),
      });
      toast.success(lang === 'sw' ? 'Ombi la malipo limewasilishwa!' : 'Payout request submitted!');
      setPayoutDialogOpen(false);
      setPayoutMobileNumber('');
      setPayoutAmount('');
      fetchPayouts();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kuwasilisha ombi la malipo' : 'Failed to request payout');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, payoutMobileNumber, payoutAmount, lang, fetchPayouts]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setIsProfileSaving(true);
    try {
      await api.patch(`/guides/${user.id}`, {
        bio: editBio.trim(),
        zones: editZones,
        languages: editLanguages,
      });
      toast.success(lang === 'sw' ? 'Wasifu umehifadhiwa!' : 'Profile saved!');
      setIsProfileEditing(false);
      fetchProfile();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kuhifadhi wasifu' : 'Failed to save profile');
    } finally {
      setIsProfileSaving(false);
    }
  }, [user, editBio, editZones, editLanguages, lang, fetchProfile]);

  const handleToggleChecklist = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item)
    );
  };

  const handleAddChecklistItem = (text: string) => {
    setChecklist((prev) => [
      ...prev,
      { id: `cl_${Date.now()}`, text, completed: false },
    ]);
  };

  // ── Derived data ──

  const earningsData = useMemo(() => {
    const pending = (payouts as PayoutItem[])
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const released = (payouts as PayoutItem[])
      .filter((p) => p.status === 'processed')
      .reduce((sum, p) => sum + p.amount, 0);
    const thisWeek = (sessions as SessionItem[])
      .filter((s) => {
        if (!s.completedAt) return false;
        const d = new Date(s.completedAt);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      })
      .reduce((sum, s) => sum + (s.amount - s.platformFee), 0);
    const totalEarned = (sessions as SessionItem[])
      .filter((s) => s.completedAt)
      .reduce((sum, s) => sum + (s.amount - s.platformFee), 0);

    return { pending, released, weekly: thisWeek, total: totalEarned };
  }, [payouts, sessions]);

  const weeklyEarningsData = useMemo(() => {
    // Generate last 7 days of earnings
    const days: Array<{ label: string; amount: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const dayEarnings = sessions
        .filter((s) => {
          if (!s.completedAt) return false;
          const d = new Date(s.completedAt);
          return d >= dayStart && d < dayEnd;
        })
        .reduce((sum, s) => sum + (s.amount - s.platformFee), 0);

      days.push({
        label: date.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { weekday: 'short' }),
        amount: dayEarnings,
      });
    }
    return days;
  }, [sessions, lang]);

  const guideOfWeek = useMemo(() => {
    const eligible = leaderboardGuides.filter((g) => g.rating >= 4.5);
    return eligible.length > 0 ? eligible[0] : null;
  }, [leaderboardGuides]);

  const currentGuideRank = useMemo(() => {
    if (!user) return -1;
    const idx = leaderboardGuides.findIndex((g) => g.id === user.id);
    return idx + 1;
  }, [leaderboardGuides, user]);

  const earnedBadgeTypes = useMemo(() => {
    return new Set(myBadges.map((b) => b.badgeType));
  }, [myBadges]);

  // ── Navigation ──

  const navigateTo = (v: GuideView) => {
    if (v === 'requests' && guideStore.isOnline) {
      fetchRequests();
    }
    if (v === 'session' && activeSessionId) {
      fetchActiveSession(activeSessionId);
    }
    if (v === 'earnings') {
      fetchPayouts();
    }
    if (v === 'badges') {
      fetchLeaderboard();
    }
    setView(v);
  };

  // ── Render helpers ──

  const renderBackButton = (targetView: GuideView = 'home') => (
    <button
      className="gap-1.5 mb-4 text-muted-foreground hover:text-chimbo-green text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--chimbo-green-light)] transition-colors flex items-center border border-border"
      onClick={() => navigateTo(targetView)}
    >
      <ArrowLeft className="size-4" />
      {t('back', lang)}
    </button>
  );

  // ── Urgency color for requests ──
  const getRequestUrgency = (createdAt: string): 'new' | 'standard' | 'aging' => {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    if (ageMs < 60000) return 'new';
    if (ageMs < 300000) return 'standard';
    return 'aging';
  };

  const urgencyColors: Record<string, string> = {
    new: 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    standard: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    aging: 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
  };

  // ─── HOME VIEW ───
  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold gradient-text-green">
          {t('welcome', lang)}, {user?.name?.split(' ')[0] || ''}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('tagline', lang)}</p>
      </div>

      {/* Status Toggle - Prominent */}
      <div className={cn(
        'kcard overflow-hidden p-6 transition-all duration-300',
        guideStore.status === 'online' && 'border-emerald-400 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
        guideStore.status === 'busy' && 'border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',
        guideStore.status === 'offline' && 'border-gray-300 dark:border-gray-600',
      )}>
          <div className="text-center space-y-4">
            {/* Animated status indicator */}
            <div className="flex justify-center">
              {guideStore.status === 'online' && (
                <div className="relative">
                  <div className="size-20 rounded-full bg-chimbo-green flex items-center justify-center">
                    <Eye className="size-10 text-white" />
                  </div>
                  <div className="absolute inset-0 size-20 rounded-full bg-chimbo-green/40 animate-ping" />
                </div>
              )}
              {guideStore.status === 'busy' && (
                <div className="size-20 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="size-10 text-white" />
                </div>
              )}
              {guideStore.status === 'offline' && (
                <div className="size-20 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
                  <EyeOff className="size-10 text-white" />
                </div>
              )}
            </div>

            {/* Status message */}
            <div>
              {guideStore.status === 'online' && (
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {lang === 'sw' ? 'Uko mtandaoni - Unaweza kuonekana na watafuta' : 'You are visible to seekers'}
                </p>
              )}
              {guideStore.status === 'busy' && (
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {lang === 'sw' ? 'Uko masilini - Una kikao kinachoendelea' : 'You are in an active session'}
                </p>
              )}
              {guideStore.status === 'offline' && (
                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {lang === 'sw' ? 'Kuwa mtandaoni kupokea maombi' : 'Go online to receive requests'}
                </p>
              )}
            </div>

            {/* Toggle buttons */}
            <div className="flex gap-2 justify-center">
              <button
                className={cn(
                  'h-11 px-5 gap-2 rounded-lg font-semibold transition-all flex items-center justify-center',
                  guideStore.status === 'online'
                    ? 'kbtn'
                    : 'kbtn-outline'
                )}
                onClick={() => handleToggleStatus('online')}
                disabled={statusToggleLoading || guideStore.status === 'online'}
              >
                {statusToggleLoading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                {t('go_online', lang)}
              </button>
              <button
                className={cn(
                  'h-11 px-5 gap-2 rounded-lg font-semibold transition-all flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  guideStore.status === 'offline' && 'ring-2 ring-gray-400'
                )}
                onClick={() => handleToggleStatus('offline')}
                disabled={statusToggleLoading || guideStore.status === 'offline'}
              >
                <EyeOff className="size-4" />
                {t('go_offline', lang)}
              </button>
            </div>
          </div>
        </div>

      {/* Active session banner */}
      {activeSessionData && (
        <div
          className="kcard cursor-pointer p-4 flex items-center gap-3"
          onClick={() => navigateTo('session')}
        >
            <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Clock className="size-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{t('active_session_g', lang)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {activeSessionData.seeker?.name || 'Seeker'} &middot; {activeSessionData.sessionCode}
              </p>
            </div>
            <span className="kbadge kbadge-pending">
              {t('active', lang)}
            </span>
        </div>
      )}

      {/* Session Value Card */}
      <div className="kcard-green p-4 flex items-center gap-3">
        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <CircleDollarSign className="size-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{lang === 'sw' ? 'Thamani la kikao' : 'Session Value'}</p>
          <p className="text-2xl font-bold text-white">TZS 45,000</p>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kcard p-4 text-center">
            <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="size-5 text-chimbo-green" />
            </div>
            <p className="text-2xl font-bold gradient-text-green">{profile?.totalSessions || 0}</p>
            <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Vikao vyote' : 'Total Sessions'}</p>
        </div>
        <div className="kcard p-4 text-center">
            <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-2">
              <Star className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold gradient-text-gold">{profile?.avgRating?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Wastani wa ukadiriaji' : 'Avg Rating'}</p>
        </div>
        <div className="kcard p-4 text-center">
            <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-2">
              <DollarSign className="size-5 text-chimbo-green" />
            </div>
            <p className="text-lg font-bold gradient-text-green">{formatTZS(earningsData.weekly, lang)}</p>
            <p className="text-xs text-muted-foreground">{t('weekly_total', lang)}</p>
        </div>
      </div>

      {/* Badges showcase - horizontal scroll */}
      {myBadges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold gradient-text-green">{t('my_badges', lang)}</h2>
            <Button variant="ghost" size="sm" className="text-xs text-chimbo-green" onClick={() => navigateTo('badges')}>
              {t('see_all', lang)}
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {myBadges.slice(0, 6).map((badge) => {
              const config = badgeColorMap[badge.badgeType] || defaultBadgeConfig;
              const Icon = badgeIconMap[badge.badgeType] || Award;
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-1 rounded-lg border p-2.5 min-w-[72px]',
                    config.bg
                  )}
                >
                  <Icon className={cn('size-6', config.color)} />
                  <span className="text-[9px] font-medium text-center text-foreground leading-tight">
                    {t(`badge_${badge.badgeType}`, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="kcard-yellow cursor-pointer p-4 flex items-center gap-3" onClick={() => navigateTo('subscription')}>
          <div className="size-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
            <Crown className="size-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Usajili wako' : 'Your Subscription'}</p>
            <p className="text-xs text-muted-foreground">{(() => {
              const tier = subscriptions.length > 0 ? subscriptions[0].tier : 'starter';
              if (lang === 'sw') {
                return tier === 'pro' ? 'Pro - Bure zaidi!' : tier === 'elite' ? 'Elite - Viwango vya juu!' : 'Starter - Boresha hadi Pro';
              }
              return tier === 'pro' ? 'Pro - More features!' : tier === 'elite' ? 'Elite - Top tier!' : 'Starter - Upgrade to Pro';
            })()}</p>
          </div>
          <span className="kbadge kbadge-gold">{subscriptions.length > 0 ? subscriptions[0].tier.charAt(0).toUpperCase() + subscriptions[0].tier.slice(1) : 'Starter'}</span>
      </div>

      {/* USSD Offline Info Card */}
      <div className="kcard cursor-pointer p-4" onClick={() => navigateTo('profile')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <WifiOff className="size-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Hali ya Nje ya Mtandao' : 'Offline Mode'}</p>
              <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Tumia USSD bila mtandao' : 'Use USSD without internet'}</p>
            </div>
            <Badge variant="outline" className="text-xs">{isUssdOffline ? (lang === 'sw' ? 'Nje' : 'Offline') : (lang === 'sw' ? 'Mtandaoni' : 'Online')}</Badge>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3 border border-border">
            <Phone className="size-5 text-gray-600 dark:text-gray-300 shrink-0" />
            <p className="text-xl font-mono font-bold tracking-wider text-foreground">*150*99#</p>
          </div>
      </div>

      {/* Feature Quick Links */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{lang === 'sw' ? 'Zaidi ya Huduma' : 'More Features'}</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('packages')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <Package className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Vifurushi' : 'Packages'}</p>
          </div>
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('mentorship')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <GraduationCap className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Ushauri' : 'Mentorship'}</p>
          </div>
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('calendar')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <Calendar className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Kalenda' : 'Calendar'}</p>
          </div>
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('stories')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <BookOpen className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Hadithi' : 'Stories'}</p>
          </div>
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('insights')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <BarChart3 className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Uchambuzi' : 'Insights'}</p>
          </div>
          <div className="kcard cursor-pointer p-3 text-center" onClick={() => navigateTo('subscription')}>
              <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center mx-auto mb-1.5">
                <Crown className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[11px] font-medium text-foreground">{lang === 'sw' ? 'Usajili' : 'Plans'}</p>
          </div>
        </div>
      </div>

      {/* Guide of the Week banner */}
      {guideOfWeek && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">{t('guide_of_week', lang)}</h2>
          <div className="kcard-yellow overflow-hidden p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'size-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400',
                  getAvatarColor(guideOfWeek.id)
                )}>
                  {getInitials(guideOfWeek.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{guideOfWeek.name}</h3>
                    <Crown className="size-4 text-amber-500" />
                  </div>
                  <RatingStars rating={guideOfWeek.rating} size="sm" showNumeric />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {guideOfWeek.zones.slice(0, 2).map((z) => {
                      const zc = zoneColorMap[z];
                      return (
                        <Badge key={z} variant="secondary" className={cn('text-[9px] h-4 px-1.5', zc?.bg, zc?.text)}>
                          {t(z, lang)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{lang === 'sw' ? 'Shughuli za hivi karibu' : 'Recent Activity'}</h2>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{lang === 'sw' ? 'Hakuna shughuli bado' : 'No activity yet'}</p>
            </div>
          ) : (
            sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="kcard p-3 flex items-center gap-3 cursor-pointer">
                  <div className={cn(
                    'size-8 rounded-full flex items-center justify-center shrink-0',
                    getAvatarColor(session.seeker?.id || '')
                  )}>
                    <span className="text-white text-xs font-bold">
                      {session.seeker?.name ? getInitials(session.seeker.name) : '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.seeker?.name || 'Seeker'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(session.createdAt, lang)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatTZS(session.amount - session.platformFee, lang)}</p>
                    <Badge className={cn(
                      'text-[9px] h-4',
                      session.completedAt ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    )}>
                      {session.completedAt ? t('completed', lang) : t('active', lang)}
                    </Badge>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ─── LIVE REQUESTS VIEW ───
  const renderRequests = () => {
    if (!guideStore.isOnline) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('live_requests', lang)}</h1>
          </div>
          <div className="text-center py-16 text-muted-foreground">
            <EyeOff className="size-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">{lang === 'sw' ? 'Hupo mtandaoni' : 'You are offline'}</p>
            <p className="text-sm mt-1">{lang === 'sw' ? 'Kuwa mtandaoni kupokea maombi' : 'Go online to receive requests'}</p>
            <button className="kbtn mt-4 gap-2" onClick={() => handleToggleStatus('online')}>
              <Eye className="size-4" />
              {t('go_online', lang)}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('live_requests', lang)}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === 'sw' ? `Maombi ${liveRequests.length} yanapatikana` : `${liveRequests.length} requests available`}
            </p>
          </div>
          <button className="kbtn-outline gap-1.5 text-sm" onClick={fetchRequests}>
            <RefreshCw className="size-3.5" />
            {t('refresh', lang)}
          </button>
        </div>

        {isLoadingRequests ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : liveRequests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Radio className="size-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">{lang === 'sw' ? 'Hakuna maombi sasa' : 'No requests right now'}</p>
            <p className="text-sm mt-1">{lang === 'sw' ? 'Baki mtandaoni! Maombi yataingia.' : 'Stay online! Requests will come in.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {liveRequests.map((request) => {
              const urgency = getRequestUrgency(request.createdAt);
              const seekerFirstName = request.seeker?.name?.split(' ')[0] || (lang === 'sw' ? 'Muombaji' : 'Seeker');

              return (
                <div key={request.id} className={cn('kcard overflow-hidden', urgencyColors[urgency])}>
                    <div className="p-4 space-y-3">
                    {/* Header: name + urgency badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'size-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                          getAvatarColor(request.seekerId)
                        )}>
                          {seekerFirstName[0]}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{seekerFirstName}</span>
                      </div>
                      <span className={cn(
                        'kbadge',
                        urgency === 'new' && 'kbadge-live',
                        urgency === 'standard' && 'kbadge-pending',
                        urgency === 'aging' && 'kbadge-urgent',
                      )}>
                        {urgency === 'new' && (lang === 'sw' ? 'Jipya' : 'New')}
                        {urgency === 'standard' && (lang === 'sw' ? 'Kawaida' : 'Standard')}
                        {urgency === 'aging' && (lang === 'sw' ? 'Zamani' : 'Aging')}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-foreground line-clamp-2">{request.description}</p>

                    {/* Zone + Budget */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {request.zones && request.zones.length > 0
                          ? request.zones.map((z) => t(z.nameKey, lang)).join(', ')
                          : lang === 'sw' ? 'Eneo la soko' : 'Market zone'}
                      </div>
                      <span className="font-bold text-chimbo-green text-sm">
                        {formatTZS(request.budget, lang)}
                      </span>
                    </div>

                    {/* Time posted */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {lang === 'sw' ? 'Lilitumwa' : 'Posted'} {formatDateTime(request.createdAt, lang)}
                    </div>

                    {/* Accept button */}
                    <button
                      className="kbtn w-full h-11 text-base font-semibold gap-2"
                      onClick={() => handleAcceptRequest(request)}
                      disabled={isSubmitting || !!activeSessionId}
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      {t('accept_request', lang)}
                    </button>
                    {activeSessionId && (
                      <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                        {lang === 'sw' ? 'Maliza kikao cha sasa kwanza' : 'Finish your current session first'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── ACTIVE SESSION VIEW ───
  const renderSession = () => {
    if (!activeSessionData) {
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-foreground">{t('active_session_g', lang)}</h1>
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">{t('no_sessions', lang)}</p>
            <p className="text-sm mt-1">{lang === 'sw' ? 'Kubali ombi kuanza kikao' : 'Accept a request to start a session'}</p>
            <button className="kbtn mt-4 gap-2" onClick={() => navigateTo('requests')}>
              <Radio className="size-4" />
              {t('live_requests', lang)}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Smart Timeout Indicator */}
        <SmartTimeout
          sessionId={activeSessionData.id}
          lastActivityTime={lastSessionActivity}
          isActive={!!activeSessionId}
          onStillHere={() => setLastSessionActivity(Date.now())}
          onAutoComplete={handleCompleteSession}
          language={lang}
          className="!p-3 !space-y-0"
        />

        {/* Session Tracker */}
        <SessionTracker
          sessionCode={activeSessionData.sessionCode}
          startedAt={activeSessionData.startedAt}
          escrowStatus={activeSessionData.escrowStatus as 'pending' | 'held' | 'released' | 'refunded' | 'disputed'}
          seekerConfirmed={activeSessionData.seekerConfirmed}
          guideConfirmed={activeSessionData.guideConfirmed}
          checklist={checklist}
          onToggleChecklist={handleToggleChecklist}
          onAddChecklistItem={handleAddChecklistItem}
          onMarkComplete={handleConfirmSession}
          onEmergency={handleEmergency}
        />

        {/* Seeker info card */}
        <div className="kcard p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'size-12 rounded-full flex items-center justify-center text-white font-bold',
                getAvatarColor(activeSessionData.seeker?.id || '')
              )}>
                {activeSessionData.seeker?.name ? getInitials(activeSessionData.seeker.name) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{activeSessionData.seeker?.name || 'Seeker'}</p>
                <p className="text-xs text-muted-foreground">{activeSessionData.seeker?.phone || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-chimbo-green">
                  {formatTZS(activeSessionData.amount, lang)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {lang === 'sw' ? 'Ada' : 'Fee'}: {formatTZS(activeSessionData.platformFee, lang)}
                </p>
              </div>
            </div>
        </div>

        {/* Request details */}
        {activeSessionData.request && (
          <div className="kcard p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {lang === 'sw' ? 'Maelezo ya ombi' : 'Request Details'}
              </p>
              <p className="text-sm text-foreground">{activeSessionData.request.description}</p>
          </div>
        )}

        {/* Chat/Map/Navigation toggle */}
        <div className="flex gap-2">
          <button
            className={cn(
              'flex-1 h-10 gap-2 rounded-lg font-semibold transition-all flex items-center justify-center text-sm',
              sessionTab === 'chat' ? 'kbtn' : 'kbtn-outline'
            )}
            onClick={() => setSessionTab('chat')}
          >
            <MessageSquare className="size-4" />
            {lang === 'sw' ? 'Mazungumzo' : 'Chat'}
          </button>
          <button
            className={cn(
              'flex-1 h-10 gap-2 rounded-lg font-semibold transition-all flex items-center justify-center text-sm',
              sessionTab === 'map' ? 'kbtn' : 'kbtn-outline'
            )}
            onClick={() => setSessionTab('map')}
          >
            <MapPin className="size-4" />
            {lang === 'sw' ? 'Ramani' : 'Map'}
          </button>
          <button
            className={cn(
              'flex-1 h-10 gap-2 rounded-lg font-semibold transition-all flex items-center justify-center text-sm',
              sessionTab === 'navigation' ? 'kbtn' : 'kbtn-outline'
            )}
            onClick={() => setSessionTab('navigation')}
          >
            <Navigation className="size-4" />
            {lang === 'sw' ? 'Urambazaji' : 'Navigate'}
          </button>
        </div>

        {/* Chat view */}
        {sessionTab === 'chat' && (
          <>
            <div className="kcard overflow-hidden">
              <SessionChat
                sessionId={activeSessionData.id}
                currentUserId={user?.id || ''}
                messages={sessionMessages.map((m) => ({
                  id: m.id,
                  sessionId: m.sessionId,
                  senderId: m.senderId,
                  content: m.content,
                  translatedContent: m.translatedContent,
                  createdAt: m.createdAt,
                  senderName: m.sender?.name,
                }))}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingSession}
                className="h-[300px]"
              />
            </div>
            {/* Voice Messages in session */}
            <VoiceMessages
              onSendVoice={(recording) => {
                handleSendMessage(`[Voice] ${recording.transcription}`);
              }}
              onRecordStart={() => setIsVoiceRecording(true)}
              onRecordStop={() => setIsVoiceRecording(false)}
              isRecording={isVoiceRecording}
              recordings={voiceRecordings}
              language={lang}
              className="!p-3"
            />
          </>
        )}

        {/* Map view */}
        {sessionTab === 'map' && (
          <GoogleMap
            zones={zones.map((z) => ({
              id: z.id,
              name: z.name,
              nameKey: z.nameKey,
            }))}
            guides={[{ id: user?.id || 'me', name: user?.name || 'You', isOnline: true, ...(seekerLocation ? {} : {}) }]}
            showUserLocation={true}
            interactive={true}
          />
        )}

        {/* Seeker live location indicator */}
        {seekerLocation && sessionTab === 'map' && (
          <div className="kcard p-3 flex items-center gap-2">
              <div className="size-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {lang === 'sw' ? 'Mahali pa muombaji:' : 'Seeker location:'} {seekerLocation.lat.toFixed(4)}, {seekerLocation.lng.toFixed(4)}
              </span>
          </div>
        )}

        {/* Indoor Navigation tab */}
        {sessionTab === 'navigation' && (
          <IndoorNavigation
            zoneId={profile?.zones[0] || 'zone_vyombo'}
            waypoints={[
              { id: 'wp1', label: lang === 'sw' ? 'Lango Kuu' : 'Main Entrance', x: 20, y: 80, type: 'exit' as const, direction: 'straight' as const, distance: '50m' },
              { id: 'wp2', label: lang === 'sw' ? 'Makutano ya Kwanza' : 'First Junction', x: 40, y: 60, type: 'junction' as const, direction: 'right' as const, distance: '30m', landmark: lang === 'sw' ? 'Duka la chuma' : 'Hardware shop' },
              { id: 'wp3', label: lang === 'sw' ? 'Duka la Vyombo' : 'Utensils Stall', x: 60, y: 40, type: 'stall' as const, direction: 'left' as const, distance: '20m' },
              { id: 'wp4', label: lang === 'sw' ? 'Alama ya Soko' : 'Market Landmark', x: 80, y: 30, type: 'landmark' as const, direction: 'straight' as const, distance: '40m' },
            ]}
            currentWaypointId="wp1"
            language={lang}
          />
        )}

        {/* Session Recording controls */}
        <SessionRecording
          sessionId={activeSessionData.id}
          guideConsent={guideRecordingConsent}
          seekerConsent={seekerRecordingConsent}
          isRecording={isSessionRecording}
          duration={sessionRecordingDuration}
          onGrantConsent={() => setGuideRecordingConsent(true)}
          onStartRecording={async () => {
            setIsSessionRecording(true);
            try {
              await sessionRecordingsApi.create({
                sessionId: activeSessionData.id,
                guideConsent: true,
                seekerConsent: seekerRecordingConsent,
              });
            } catch {
              // Recording start attempt is non-critical
            }
          }}
          onStopRecording={async () => {
            setIsSessionRecording(false);
            try {
              fetchSessionRecordings();
            } catch {
              // Recording stop is non-critical
            }
          }}
          language={lang}
          className="!p-3"
        />

        {/* Mark Complete button (large, prominent) */}
        <button
          className="kbtn w-full h-12 text-base font-semibold gap-2"
          onClick={handleCompleteSession}
        >
          <CheckCircle2 className="size-5" />
          {t('mark_complete', lang)}
        </button>

        {/* Escrow Payment */}
        <EscrowPayment
          amount={activeSessionData.amount}
          platformFee={activeSessionData.platformFee}
          escrowStatus={activeSessionData.escrowStatus as 'pending' | 'held' | 'released' | 'refunded' | 'disputed'}
          isGuide={true}
          language={lang}
          onPaymentComplete={() => {
            toast.success(lang === 'sw' ? 'Malipo yamefanikiwa!' : 'Payment successful!');
            fetchActiveSession(activeSessionData.id);
          }}
          onReleaseEscrow={async () => {
            try {
              await api.patch(`/sessions/${activeSessionData.id}`, { action: 'release' });
              toast.success(lang === 'sw' ? 'Malipo yametolewa!' : 'Payment released!');
              fetchActiveSession(activeSessionData.id);
            } catch {
              toast.error(lang === 'sw' ? 'Imeshindwa kutoa malipo' : 'Failed to release payment');
            }
          }}
        />

        {/* Emergency Panel */}
        <EmergencyPanel
          sessionId={activeSessionData.id}
          sessionCode={activeSessionData.sessionCode}
          guideName={user?.name}
          seekerName={activeSessionData.seeker?.name}
          language={lang}
          onEmergencyTriggered={(data) => {
            handleEmergency();
            console.log('Emergency triggered:', data);
          }}
        />

        {/* Both parties confirmation note */}
        <p className="text-xs text-center text-muted-foreground">
          {lang === 'sw'
            ? 'Kila upande lazima uthibitishe kikao kikamilike'
            : 'Both parties must confirm for session to complete'}
        </p>
      </div>
    );
  };

  // ─── EARNINGS VIEW ───
  const renderEarnings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('earnings_dashboard', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {lang === 'sw' ? 'Muhtasari wa mapato yako' : 'Your earnings summary'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="kcard border-amber-300 dark:border-amber-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-muted-foreground">{t('pending_earnings', lang)}</span>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatTZS(earningsData.pending, lang)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{lang === 'sw' ? 'Inasubiri (escrow)' : 'In escrow'}</p>
        </div>
        <div className="kcard border-emerald-300 dark:border-emerald-600 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="size-4 text-chimbo-green" />
              <span className="text-xs text-muted-foreground">{t('released_earnings', lang)}</span>
            </div>
            <p className="text-lg font-bold text-chimbo-green">{formatTZS(earningsData.released, lang)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{lang === 'sw' ? 'Inapatikana' : 'Available'}</p>
        </div>
        <div className="kcard p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs text-muted-foreground">{t('weekly_total', lang)}</span>
            </div>
            <p className="text-lg font-bold gradient-text-green">{formatTZS(earningsData.weekly, lang)}</p>
        </div>
        <div className="kcard p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="size-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-muted-foreground">{t('all_time', lang)}</span>
            </div>
            <p className="text-lg font-bold gradient-text-green">{formatTZS(earningsData.total, lang)}</p>
        </div>
      </div>

      {/* Earnings chart - simple bar chart last 7 days */}
      <div className="kcard overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">{lang === 'sw' ? 'Mapato ya siku 7 zilizopita' : 'Last 7 Days Earnings'}</h3>
        </div>
        <div className="p-4 pt-0">
          <div className="flex items-end gap-2 h-32">
            {weeklyEarningsData.map((day, i) => {
              const maxAmount = Math.max(...weeklyEarningsData.map((d) => d.amount), 1);
              const heightPct = Math.max((day.amount / maxAmount) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">
                    {day.amount > 0 ? `${(day.amount / 1000).toFixed(0)}k` : ''}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all',
                      day.amount > 0
                        ? 'bg-chimbo-green'
                        : 'bg-muted-foreground/20'
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="kcard p-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{lang === 'sw' ? 'Ada ya jukwaa' : 'Platform fee'}</span>
          </div>
          <span className="font-bold text-foreground">12%</span>
      </div>

      {/* Request Payout button */}
      <button
        className="kbtn w-full h-12 text-base gap-2"
        onClick={() => setPayoutDialogOpen(true)}
        disabled={earningsData.released <= 0}
      >
        <DollarSign className="size-5" />
        {lang === 'sw' ? 'Omba malipo' : 'Request Payout'}
      </button>

      {/* Multi-Currency Display */}
      <MultiCurrency
        amountInTZS={earningsData.released}
        onCurrencyChange={setSelectedCurrency}
        showMore={false}
        language={lang}
      />

      {/* Quick link to Insights */}
      <div className="kcard cursor-pointer p-4 flex items-center gap-3" onClick={() => navigateTo('insights')}>
          <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center shrink-0">
            <BarChart3 className="size-5 text-chimbo-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Uchambuzi wa Utendaji' : 'Performance Insights'}</p>
            <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Tazama takwimu zako' : 'View your stats'}</p>
          </div>
          <ArrowLeft className="size-4 text-muted-foreground rotate-180" />
      </div>

      {/* Payout History */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{t('payout_history', lang)}</h2>
        {isLoadingPayouts ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{lang === 'sw' ? 'Hakuna historia ya malipo' : 'No payout history'}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {payouts.map((payout) => (
              <div key={payout.id} className="kcard p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{formatTZS(payout.amount, lang)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payout.createdAt, lang)}</p>
                    {payout.mobileMoneyNumber && (
                      <p className="text-[10px] text-muted-foreground">
                        {t('mobile_money', lang)}: {payout.mobileMoneyNumber}
                      </p>
                    )}
                  </div>
                  <Badge className={cn(
                    'text-[10px] h-5',
                    payout.status === 'processed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                    payout.status === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                    payout.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                  )}>
                    {t(payout.status as 'pending' | 'completed', lang)}
                  </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'sw' ? 'Omba malipo' : 'Request Payout'}</DialogTitle>
            <DialogDescription>
              {lang === 'sw'
                ? 'Weka nambari ya pesa ya simu kupokea malipo'
                : 'Enter your mobile money number to receive payout'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t('amount', lang)}</label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={formatTZS(earningsData.released, lang)}
                  className="pl-9"
                  max={earningsData.released}
                  min={0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'sw' ? 'Inapatikana' : 'Available'}: {formatTZS(earningsData.released, lang)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('mobile_money', lang)}</label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={payoutMobileNumber}
                  onChange={(e) => setPayoutMobileNumber(e.target.value)}
                  placeholder={lang === 'sw' ? 'Mfano: 0712 345 678' : 'e.g. 0712 345 678'}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              {t('cancel', lang)}
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={!payoutMobileNumber.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {t('submit', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ─── BADGES & LEADERBOARD VIEW ───
  const renderBadges = () => (
    <div className="space-y-6">
      {/* My Badges section */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{t('my_badges', lang)}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allBadgeTypes.map((badgeType) => {
            const isEarned = earnedBadgeTypes.has(badgeType);
            const config = badgeColorMap[badgeType] || defaultBadgeConfig;
            const Icon = badgeIconMap[badgeType] || Award;
            const badgeData = myBadges.find((b) => b.badgeType === badgeType);

            return (
              <div
                key={badgeType}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  isEarned ? config.bg : 'bg-muted/30 border-muted opacity-50'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center rounded-md p-2',
                  isEarned ? config.bg : 'bg-muted/50'
                )}>
                  <Icon className={cn('size-5', isEarned ? config.color : 'text-muted-foreground/50')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', isEarned ? 'text-foreground' : 'text-muted-foreground')}>
                    {t(`badge_${badgeType}`, lang)}
                  </p>
                  {isEarned && badgeData ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(badgeData.awardedAt, lang)}
                    </p>
                  ) : (
                    <div className="mt-1">
                      <div className="kprogress w-full">
                        <div
                          className="kprogress-bar"
                          style={{ width: `${Math.min(Math.random() * 80 + 10, 95)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {lang === 'sw' ? 'Bado hujaipata' : 'Not yet earned'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{t('leaderboard', lang)}</h2>

        {/* Guide of the Week featured */}
        {guideOfWeek && (
          <div className="kcard-yellow overflow-hidden mb-4 p-4">
              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs font-medium mb-2">
                <Crown className="size-3.5" />
                {t('guide_of_week', lang)}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'size-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400',
                  getAvatarColor(guideOfWeek.id)
                )}>
                  {getInitials(guideOfWeek.name)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{guideOfWeek.name}</h3>
                  <RatingStars rating={guideOfWeek.rating} size="sm" showNumeric />
                </div>
              </div>
          </div>
        )}

        {/* Leaderboard list */}
        <div className="space-y-2">
          {leaderboardGuides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('no_guides', lang)}</p>
            </div>
          ) : (
            leaderboardGuides.map((guide, idx) => {
              const position = idx + 1;
              const isCurrentUser = guide.id === user?.id;
              const PosIcon = position === 1 ? Crown : position === 2 ? Medal : position === 3 ? Award : null;

              return (
                <div
                  key={guide.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    isCurrentUser
                      ? 'border-chimbo-green bg-[var(--chimbo-green-light)] ring-1 ring-chimbo-green/30'
                      : position <= 3
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                        : 'kcard'
                  )}
                >
                  {/* Position */}
                  <div className="shrink-0 w-8 flex items-center justify-center">
                    {PosIcon ? (
                      <PosIcon className={cn(
                        'size-6',
                        position === 1 && 'text-amber-500',
                        position === 2 && 'text-gray-400',
                        position === 3 && 'text-orange-400',
                      )} />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{position}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={cn(
                    'size-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                    getAvatarColor(guide.id)
                  )}>
                    {getInitials(guide.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={cn('font-medium text-sm truncate', isCurrentUser ? 'text-chimbo-green font-bold' : 'text-foreground')}>
                        {guide.name} {isCurrentUser && `(${lang === 'sw' ? 'Wewe' : 'You'})`}
                      </h4>
                      {guide.isVerifiedElite && (
                        <span className="kbadge kbadge-gold text-[9px] h-4 px-1">
                          <Star className="size-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                          Elite
                        </span>
                      )}
                    </div>
                    <RatingStars rating={guide.rating} size="sm" showNumeric={false} />
                  </div>

                  {/* Sessions this week */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-foreground">{guide.sessionsThisWeek}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {lang === 'sw' ? 'vikao' : 'sessions'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current position */}
        {currentGuideRank > 0 && (
          <div className="kcard mt-4 p-3 flex items-center justify-between bg-[var(--chimbo-green-light)] border-chimbo-green/20">
              <span className="text-sm text-muted-foreground">{lang === 'sw' ? 'Nafasi yako' : 'Your position'}</span>
              <span className="text-lg font-bold text-chimbo-green">#{currentGuideRank}</span>
          </div>
        )}
      </div>
    </div>
  );

  // ─── SUBSCRIPTION VIEW ───
  const renderSubscription = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <SubscriptionTiers
        currentTier={subscriptions.length > 0 ? subscriptions[0].tier : 'starter'}
        onUpgrade={async (tier) => {
          if (!user) return;
          try {
            await guideSubscriptionsApi.create({
              guideId: user.id,
              tier,
              autoRenew: true,
            });
            toast.success(lang === 'sw' ? `Umehamia ${tier}!` : `Upgraded to ${tier}!`);
            fetchSubscriptions();
          } catch {
            toast.error(lang === 'sw' ? 'Imeshindwa kubadilisha usajili' : 'Failed to upgrade subscription');
          }
        }}
        language={lang}
      />
    </div>
  );

  // ─── PACKAGES VIEW ───
  const renderPackages = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <PackageDeals
        packages={[
          { id: 'pkg1', title: lang === 'sw' ? 'Safari ya Soko la Vyombo' : 'Kitchenware Market Tour', duration: 2, zones: [lang === 'sw' ? 'Vyombo' : 'Utensils'], price: 45000, deliveryIncluded: true, sessionsCompleted: 12, isPopular: true },
          { id: 'pkg2', title: lang === 'sw' ? 'Uzalishaji wa Elektroniki' : 'Electronics Wholesale Run', duration: 3, zones: [lang === 'sw' ? 'Elektroniki' : 'Electronics'], price: 85000, deliveryIncluded: false, sessionsCompleted: 8 },
          { id: 'pkg3', title: lang === 'sw' ? 'Kitenge na Nguo' : 'Kitenge & Fabric Trail', duration: 2, zones: [lang === 'sw' ? 'Kitambaa' : 'Fabric'], price: 35000, deliveryIncluded: true, sessionsCompleted: 15 },
        ]}
        guideName={user?.name || ''}
        onBook={(pkgId) => {
          toast.success(lang === 'sw' ? 'Kifurushi kimehifadhiwa!' : 'Package booked!');
        }}
        language={lang}
      />
    </div>
  );

  // ─── MENTORSHIP VIEW ───
  const renderMentorship = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <MentorshipProgram
        menteeSessionsCompleted={profile?.totalSessions || 0}
        menteeSessionsRequired={10}
        isEligible={(profile?.totalSessions || 0) >= 10 && (profile?.avgRating || 0) >= 4.0}
        isMentee={mentorshipsData.some((m) => m.menteeId === user?.id && m.status === 'active')}
        availableMentors={[
          { id: 'mentor1', name: 'Mama Asha', rating: 4.9, specialties: [lang === 'sw' ? 'Vyombo' : 'Utensils', lang === 'sw' ? 'Vyakula' : 'Spices'], totalSessions: 250, menteesCount: 5 },
          { id: 'mentor2', name: 'Uncle Juma', rating: 4.8, specialties: [lang === 'sw' ? 'Elektroniki' : 'Electronics'], totalSessions: 180, menteesCount: 3 },
        ]}
        onRequestMentor={async (mentorId) => {
          if (!user) return;
          try {
            await mentorshipsApi.create({
              mentorId,
              menteeId: user.id,
              sessionsRequired: 10,
            });
            toast.success(lang === 'sw' ? 'Ombi la ushauri limetumwa!' : 'Mentorship request sent!');
            fetchMentorships();
          } catch {
            toast.error(lang === 'sw' ? 'Imeshindwa kutuma ombi' : 'Failed to send request');
          }
        }}
        language={lang}
      />
    </div>
  );

  // ─── CALENDAR VIEW ───
  const renderCalendar = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <SeasonalCalendar
        events={seasonalEvents.length > 0 ? seasonalEvents.map((evt) => ({
          id: evt.id,
          title: lang === 'sw' ? evt.titleSw : evt.title,
          date: evt.startDate,
          type: (evt.type === 'cultural' || evt.type === 'religious' || evt.type === 'seasonal' || evt.type === 'commercial' ? evt.type : 'seasonal') as 'cultural' | 'religious' | 'seasonal' | 'commercial',
          zonesAffected: evt.affectedZones.map((zId) => {
            const zone = zones.find((z) => z.id === zId);
            return zone ? (lang === 'sw' ? zone.nameSw : zone.name) : zId;
          }),
          insiderTip: lang === 'sw' ? (evt.insiderTipSw || evt.insiderTip || '') : (evt.insiderTip || ''),
          dateRange: evt.startDate !== evt.endDate ? `${Math.ceil((new Date(evt.endDate).getTime() - new Date(evt.startDate).getTime()) / 86400000)} days` : undefined,
        })) : [
          { id: 'evt_fallback', title: lang === 'sw' ? 'Hakuna matukio' : 'No events', date: new Date().toISOString(), type: 'seasonal' as const, zonesAffected: [] as string[], insiderTip: '' },
        ]}
        onSetReminder={(eventId) => {
          toast.success(lang === 'sw' ? 'Kumbusho limewekwa!' : 'Reminder set!');
        }}
        language={lang}
      />
    </div>
  );

  // ─── STORIES VIEW ───
  const renderStories = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <MarketStoriesComp
        stories={marketStories.length > 0 ? marketStories.map((story) => ({
          id: story.id,
          guideName: user?.name || 'Guide',
          vendorName: story.vendorId || '',
          zoneName: zones.find((z) => z.id === story.zoneId)?.name || story.zoneId,
          text: story.content,
          textSw: story.content,
          tags: story.tags || [],
          createdAt: story.createdAt,
        })) : [
          { id: 'story_empty', guideName: '', vendorName: '', zoneName: '', text: lang === 'sw' ? 'Hakuna hadithi bado' : 'No stories yet', textSw: 'Hakuna hadithi bado', tags: [], createdAt: new Date().toISOString() },
        ]}
        language={lang}
        onPlayAudio={(storyId) => {
          const story = marketStories.find((s) => s.id === storyId);
          if (story?.audioUrl) {
            toast.info(lang === 'sw' ? 'Inacheza sauti...' : 'Playing audio...');
          } else {
            toast.info(lang === 'sw' ? 'Hakuna sauti inayopatikana' : 'No audio available');
          }
        }}
        onAddStory={async () => {
          if (!user || !profile) return;
          try {
            await marketStoriesApi.create({
              guideId: profile.id,
              zoneId: profile.zones[0] || '',
              title: lang === 'sw' ? 'Hadithi yangu' : 'My Story',
              content: '',
              tags: [],
            });
            toast.info(lang === 'sw' ? 'Hadithi mpya imeundwa!' : 'New story created!');
            fetchMarketStories();
          } catch {
            toast.error(lang === 'sw' ? 'Imeshindwa kuunda hadithi' : 'Failed to create story');
          }
        }}
      />
    </div>
  );

  // ─── INSIGHTS VIEW ───
  const renderInsights = () => (
    <div className="space-y-6 p-4">
      {renderBackButton()}
      <GuideInsights
        avgDuration={45}
        percentile={78}
        topZone={lang === 'sw' ? 'Vyombo' : 'Utensils'}
        revenue={earningsData.total}
        repeatRate={32}
        weeklyEarnings={weeklyEarningsData.map((d) => d.amount)}
        growthPercent={15}
        bestCategory={lang === 'sw' ? 'Vyombo vya Chakula' : 'Kitchenware'}
        suggestion={lang === 'sw' ? 'Elektroniki - mahali pa kuzingatia' : 'Electronics - area to focus on'}
        language={lang}
      />
    </div>
  );

  // ─── PROFILE VIEW ───
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('nav_profile', lang)}</h1>
        {!isProfileEditing ? (
          <button className="kbtn-outline gap-1.5 text-sm" onClick={() => setIsProfileEditing(true)}>
            {t('edit', lang)}
          </button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              setIsProfileEditing(false);
              setEditBio(profile?.bio || '');
              setEditZones(profile?.zones || []);
              setEditLanguages(profile?.languages || []);
            }}>
              {t('cancel', lang)}
            </Button>
            <button className="kbtn text-sm" onClick={handleSaveProfile} disabled={isProfileSaving}>
              {isProfileSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {t('save', lang)}
            </button>
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="kcard p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={cn(
                'size-20 rounded-full flex items-center justify-center text-white font-bold text-2xl',
                getAvatarColor(user?.id || '')
              )}>
                {user?.name ? getInitials(user.name) : '?'}
              </div>
              {isProfileEditing && (
                <button className="absolute bottom-0 right-0 size-7 rounded-full bg-chimbo-green text-white flex items-center justify-center shadow-md">
                  <Camera className="size-3.5" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.name || ''}</h2>
              <p className="text-sm text-muted-foreground">{user?.phone || ''}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <RatingStars rating={profile?.avgRating || 0} size="sm" showNumeric />
                <span className="text-xs text-muted-foreground">
                  ({profile?.totalSessions || 0} {lang === 'sw' ? 'vikao' : 'sessions'})
                </span>
              </div>
            </div>
          </div>
      </div>

      {/* Account Status */}
      <div className="kcard p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Hali ya akaunti' : 'Account Status'}</span>
            <span className={cn(
              'kbadge',
              profile?.status === 'active' && 'kbadge-verified',
              profile?.status === 'pending' && 'kbadge-pending',
              profile?.status === 'suspended' && 'kbadge-urgent',
            )}>
              {profile?.status === 'active' && t('trust_verified', lang)}
              {profile?.status === 'pending' && t('trust_pending', lang)}
              {profile?.status === 'suspended' && t('trust_suspended', lang)}
            </span>
          </div>

          {/* ID Verification */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Uthibitisho wa kitambulisho' : 'ID Verification'}</span>
            <div className="flex items-center gap-1.5">
              {profile?.idDocumentUrl ? (
                <>
                  <ShieldCheck className="size-4 text-chimbo-green" />
                  <span className="text-xs text-chimbo-green">{t('trust_verified', lang)}</span>
                </>
              ) : (
                <>
                  <CircleAlert className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">{lang === 'sw' ? 'Hakuna hati' : 'No document'}</span>
                </>
              )}
            </div>
          </div>
      </div>

      {/* Bio */}
      <div className="kcard p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Wasifu wako' : 'Your Bio'}</label>
          {isProfileEditing ? (
            <Textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={lang === 'sw' ? 'Eleza uzoefu wako na ujuzi...' : 'Describe your experience and skills...'}
              className="min-h-[100px]"
              maxLength={500}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {profile?.bio || (lang === 'sw' ? 'Hakuna wasifu bado' : 'No bio yet')}
            </p>
          )}
      </div>

      {/* Zone Specializations */}
      <div className="kcard p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Maeneo unayojua' : 'Zone Specializations'}</label>
          <div className="flex flex-wrap gap-2">
            {isLoadingZones ? (
              <Skeleton className="shimmer h-8 w-40" />
            ) : (
              zones.map((zone) => {
                const isSelected = isProfileEditing
                  ? editZones.includes(zone.id)
                  : profile?.zones.includes(zone.id);
                const zc = zoneColorMap[zone.nameKey];
                return (
                  <button
                    key={zone.id}
                    type="button"
                    disabled={!isProfileEditing}
                    onClick={() => {
                      if (isProfileEditing) {
                        setEditZones((prev) =>
                          isSelected ? prev.filter((id) => id !== zone.id) : [...prev, zone.id]
                        );
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      isSelected
                        ? `${zc?.bg || 'bg-[var(--chimbo-green-light)]'} ${zc?.text || 'text-chimbo-green'} border-current`
                        : 'border-border text-muted-foreground',
                      isProfileEditing && 'cursor-pointer hover:border-foreground/30',
                      !isProfileEditing && 'cursor-default'
                    )}
                  >
                    <MapPin className="size-3" />
                    {lang === 'sw' ? zone.nameSw : zone.name}
                  </button>
                );
              })
            )}
          </div>
      </div>

      {/* Languages Spoken */}
      <div className="kcard p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Lugha unazozungumza' : 'Languages Spoken'}</label>
          <div className="flex flex-wrap gap-2">
            {allLanguages.map((langCode) => {
              const isSelected = isProfileEditing
                ? editLanguages.includes(langCode)
                : profile?.languages.includes(langCode);
              return (
                <button
                  key={langCode}
                  type="button"
                  disabled={!isProfileEditing}
                  onClick={() => {
                    if (isProfileEditing) {
                      setEditLanguages((prev) =>
                        isSelected ? prev.filter((l) => l !== langCode) : [...prev, langCode]
                      );
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-[var(--chimbo-green-light)] text-chimbo-green border-chimbo-green/30'
                      : 'border-border text-muted-foreground',
                    isProfileEditing && 'cursor-pointer hover:border-foreground/30',
                    !isProfileEditing && 'cursor-default'
                  )}
                >
                  <Globe className="size-3" />
                  {langLabelMap[langCode] || langCode.toUpperCase()}
                </button>
              );
            })}
          </div>
      </div>

      {/* USSD Offline Mode */}
      <div className="kcard cursor-pointer p-4">
          <div className="flex items-center gap-2 mb-3">
            <WifiOff className="size-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-foreground">{lang === 'sw' ? 'Hali ya Nje ya Mtandao' : 'Offline Mode'}</span>
          </div>
          <USSDOfflineMode
            ussdCode="*150*99#"
            onToggleOffline={(isOffline) => {
              setIsUssdOffline(isOffline);
              toast.info(isOffline ? (lang === 'sw' ? 'Umehamia hali ya USSD' : 'Switched to USSD mode') : (lang === 'sw' ? 'Umerudi mtandaoni' : 'Back online'));
            }}
            language={lang}
            className="!p-0 !border-0 !shadow-none"
          />
      </div>

      {/* Subscription Link */}
      <div className="kcard cursor-pointer p-4 flex items-center gap-3" onClick={() => navigateTo('subscription')}>
          <div className="size-10 rounded-full bg-[var(--chimbo-green-light)] flex items-center justify-center shrink-0">
            <Crown className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Usajili wako' : 'Your Subscription'}</p>
            <p className="text-xs text-muted-foreground">{(() => {
              const tier = subscriptions.length > 0 ? subscriptions[0].tier : 'starter';
              const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
              return `${tierLabel} - ${lang === 'sw' ? 'Boresha hadi Pro' : 'Upgrade to Pro'}`;
            })()}</p>
          </div>
          <ArrowLeft className="size-4 text-muted-foreground rotate-180" />
      </div>
    </div>
  );

  // ── Main render ──

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Error banner */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="size-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setError(null); fetchProfile(); }}>
              {t('retry', lang)}
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="knav sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold gradient-text-green">{t('app_name', lang)}</h1>
            {guideStore.status === 'online' && (
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-chimbo-green animate-pulse" />
                <span className="text-xs text-chimbo-green font-medium">{t('online', lang)}</span>
              </span>
            )}
            {guideStore.status === 'busy' && (
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('busy', lang)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium gap-1"
              onClick={() => useAuthStore.getState().setLanguage(lang === 'sw' ? 'en' : 'sw')}
            >
              <Globe className="size-3.5" />
              {lang === 'sw' ? 'EN' : 'SW'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {isLoadingProfile ? (
          <div className="space-y-6">
            <Skeleton className="shimmer h-10 w-48" />
            <Skeleton className="shimmer h-48 rounded-xl" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="shimmer h-24 rounded-xl" />
              <Skeleton className="shimmer h-24 rounded-xl" />
              <Skeleton className="shimmer h-24 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {view === 'home' && renderHome()}
            {view === 'requests' && renderRequests()}
            {view === 'session' && renderSession()}
            {view === 'earnings' && renderEarnings()}
            {view === 'badges' && renderBadges()}
            {view === 'profile' && renderProfile()}
            {view === 'subscription' && renderSubscription()}
            {view === 'packages' && renderPackages()}
            {view === 'mentorship' && renderMentorship()}
            {view === 'calendar' && renderCalendar()}
            {view === 'stories' && renderStories()}
            {view === 'insights' && renderInsights()}
          </>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 knav border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {[
            { key: 'home' as GuideView, icon: Home, label: t('nav_home', lang) },
            { key: 'requests' as GuideView, icon: Radio, label: t('live_requests', lang) },
            { key: 'session' as GuideView, icon: Clock, label: t('active_session_g', lang) },
            { key: 'earnings' as GuideView, icon: Wallet, label: t('nav_earnings', lang) },
            { key: 'profile' as GuideView, icon: User, label: t('nav_profile', lang) },
          ].map((tab) => {
            const isActive = view === tab.key;
            const showBadge = tab.key === 'requests' && guideStore.isOnline && liveRequests.length > 0;
            const showSessionIndicator = tab.key === 'session' && !!activeSessionId;

            return (
              <button
                key={tab.key}
                onClick={() => navigateTo(tab.key)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 px-2 rounded-lg transition-colors relative',
                  isActive
                    ? 'text-chimbo-green'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={tab.label}
              >
                <div className="relative">
                  <tab.icon className={cn('size-5', isActive && 'stroke-[2.5]')} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {liveRequests.length > 9 ? '9+' : liveRequests.length}
                    </span>
                  )}
                  {showSessionIndicator && (
                    <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
