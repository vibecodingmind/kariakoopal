'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSessionStore } from '@/lib/stores/session-store';
import { t, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// API Client
import {
  api,
  zonesApi,
  type Zone as ApiZone,
  guidesApi,
  type GuideWithProfile,
  requestsApi,
  type SessionRequest,
  sessionsApi,
  type Session as ApiSession,
  messagesApi,
  type Message as ApiMessage,
  vendorsApi,
  type Vendor as ApiVendor,
  priceRadarApi,
  type PriceRadarEntry,
  packageDealsApi,
  type PackageDeal,
  seasonalEventsApi,
  type SeasonalEvent,
  marketStoriesApi,
  type MarketStory,
  buddyMatchesApi,
  type BuddyMatch,
  exchangeRatesApi,
  type ExchangeRate,
  navWaypointsApi,
  type NavWaypoint,
} from '@/lib/api';

// Socket.io hooks
import {
  useSocketIO,
  useSessionChat,
  useSessionUpdates,
  useLiveLocations,
} from '@/hooks/use-socket';
import {
  emitChatMessage,
  emitJoinSession,
  emitLeaveSession,
  type ChatMessage as SocketChatMessage,
} from '@/lib/socket';

// shadcn/ui
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  FileText,
  Radar,
  Store,
  MessageSquare,
  Clock,
  ArrowLeft,
  Plus,
  MapPin,
  DollarSign,
  Camera,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Star,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  ShieldCheck,
  Crown,
  TrendingUp,
  RefreshCw,
  X,
  Radio,
  Bell,
  ShoppingCart,
  Package,
  Navigation,
  Mic,
  Scale,
  ThermometerSun,
  BookOpen,
  Heart,
  Route,
} from 'lucide-react';

// Shared components
import { SessionTracker } from '@/components/session-tracker';
import { SessionChat } from '@/components/session-chat';
import { PriceRadarPanel } from '@/components/price-radar-panel';
import { VendorDirectory } from '@/components/vendor-directory';
import { GoogleMap } from '@/components/google-map';
import { GuideCard } from '@/components/guide-card';
import { RatingStars } from '@/components/rating-stars';
import { Leaderboard } from '@/components/leaderboard';
import { EscrowPayment } from '@/components/escrow-payment';
import { EmergencyPanel } from '@/components/emergency-panel';

// Feature components
import { HagglingAssistant } from '@/components/haggling-assistant';
import { GroupTour } from '@/components/group-tour';
import { MarketHeatmap } from '@/components/market-heatmap';
import { ShoppingList } from '@/components/shopping-list';
import { RouteOptimizer, type RouteStop } from '@/components/route-optimizer';
import MarketStories from '@/components/market-stories';
import { SeasonalCalendar } from '@/components/seasonal-calendar';
import { IndoorNavigation } from '@/components/indoor-navigation';
import { SessionRecording } from '@/components/session-recording';
import { BuddySystem } from '@/components/buddy-system';
import { SmartTimeout } from '@/components/smart-timeout';
import { VoiceMessages } from '@/components/voice-messages';
import { MultiCurrency } from '@/components/multi-currency';
import { PackageDeals } from '@/components/package-deals';
import { toast } from 'sonner';

// ── Types ──

type SeekerView =
  | 'home'
  | 'post-request'
  | 'my-requests'
  | 'matching'
  | 'session'
  | 'history'
  | 'price-radar'
  | 'vendors'
  | 'haggling'
  | 'group-tour'
  | 'heatmap'
  | 'shopping-list'
  | 'stories'
  | 'calendar'
  | 'buddy'
  | 'packages';

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

interface GuideData {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  rating: number;
  totalSessions: number;
  status: string;
  currentStatus: string;
  zones: string[];
  languages: string[];
  badgeTypes: string[];
  isVerifiedElite: boolean;
}

interface PriceItem {
  id: string;
  category: string;
  zoneId: string;
  zoneNameKey: string;
  minPrice: number;
  maxPrice: number;
  updatedAt: string;
}

interface VendorItem {
  id: string;
  name: string;
  zoneId: string;
  zoneNameKey: string;
  categories: string[];
  stallNumber: string;
  recommendations: number;
  openHours: string;
  isApproved: boolean;
  x?: number;
  y?: number;
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

function formatDuration(startStr: string, endStr: string): string {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const diffMs = Math.max(0, end - start);
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

const zoneColorMap: Record<string, { bg: string; text: string }> = {
  zone_vyombo: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  zone_electronics: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' },
  zone_fabric: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  zone_spices: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  zone_wholesale: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
};

const statusColorMap: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  matched: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  active: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const escrowStatusMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  held: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  released: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  disputed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ── Component ──

export function SeekerDashboard() {
  const { user, language } = useAuthStore();
  const { setActiveSession, setSessionHistory, clearSession } = useSessionStore();
  const lang = language as Language;

  // Socket.io integration
  const { startLocationTracking } = useSocketIO();

  // View state
  const [view, setView] = useState<SeekerView>('home');

  // Data state
  const [zones, setZones] = useState<Zone[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [marketStories, setMarketStories] = useState<MarketStory[]>([]);
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([]);
  const [buddyMatches, setBuddyMatches] = useState<BuddyMatch[]>([]);
  const [packageDealList, setPackageDealList] = useState<PackageDeal[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [navWaypoints, setNavWaypoints] = useState<NavWaypoint[]>([]);

  // Loading states
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingBuddies, setIsLoadingBuddies] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post request form state
  const [requestDescription, setRequestDescription] = useState('');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [requestBudget, setRequestBudget] = useState('');
  const [requestPhoto, setRequestPhoto] = useState(false);

  // My Requests filter
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Live Matching state
  const [matchingRequestId, setMatchingRequestId] = useState<string | null>(null);
  const [matchedGuides, setMatchedGuides] = useState<GuideData[]>([]);
  const [isWaitingForGuides, setIsWaitingForGuides] = useState(false);
  const [matchTimer, setMatchTimer] = useState(0);
  const [zoneExpanded, setZoneExpanded] = useState(false);

  // Active Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionData, setActiveSessionData] = useState<SessionItem | null>(null);
  const [sessionMessages, setSessionMessages] = useState<MessageItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);

  // Rating dialog
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);

  // Session History filter
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ── Feature component state ──
  // Haggling
  const [hagglingCategory, setHagglingCategory] = useState('electronics');
  const [hagglingVendorPrice, setHagglingVendorPrice] = useState(150000);

  // Session enhancements
  const [sessionSidebarTab, setSessionSidebarTab] = useState<'tools' | 'indoor' | 'recording' | 'haggling'>('tools');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordings, setVoiceRecordings] = useState<Array<{ id: string; duration: number; transcription: string; timestamp: number }>>([]);
  const [seekerRecordingConsent, setSeekerRecordingConsent] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // ── Socket.io real-time chat handler ──
  const handleSocketMessage = useCallback((msg: SocketChatMessage) => {
    setSessionMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [
        ...prev,
        {
          id: msg.id,
          sessionId: msg.sessionId,
          senderId: msg.senderId,
          content: msg.content,
          translatedContent: msg.translatedContent,
          createdAt: new Date(msg.timestamp).toISOString(),
        },
      ];
    });
    setLastActivityTime(Date.now());
  }, []);

  // Use Socket.io for session chat
  useSessionChat(activeSessionId, handleSocketMessage);

  // Use Socket.io for session updates
  useSessionUpdates(useCallback((update) => {
    if (update.sessionId === activeSessionId) {
      fetchActiveSession(update.sessionId);
    }
    if (update.status === 'completed' || update.status === 'cancelled') {
      fetchSessions();
      fetchRequests();
    }
  }, [activeSessionId]));

  // Use Socket.io for live locations
  useLiveLocations(useCallback(() => {
    // Location updates from guide are received - map will reflect
  }, []));

  // ── Data Fetching ──

  const fetchZones = useCallback(async () => {
    setIsLoadingZones(true);
    try {
      const data = await zonesApi.list();
      const rawZones = Array.isArray(data) ? data : [];
      const mapped = rawZones.map((z: ApiZone) => ({
        id: z.id,
        name: z.name,
        nameSw: z.nameSw || z.name,
        color: z.color,
        nameKey: `zone_${z.name.toLowerCase()}`,
      }));
      setZones(mapped);
    } catch {
      setError(lang === 'sw' ? 'Imeshindwa kupakia maeneo' : 'Failed to load zones');
    } finally {
      setIsLoadingZones(false);
    }
  }, [lang]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setIsLoadingRequests(true);
    try {
      const data = await requestsApi.list();
      const rawRequests = Array.isArray(data) ? data : [];
      // Filter to this seeker's requests
      const myRequests = rawRequests.filter((r: SessionRequest) => r.seekerId === user.id);
      setRequests(myRequests as unknown as RequestItem[]);
    } catch {
      setError(lang === 'sw' ? 'Imeshindwa kupakia maombi' : 'Failed to load requests');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user, lang]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoadingSessions(true);
    try {
      const data = await sessionsApi.list();
      const rawSessions = Array.isArray(data) ? data : [];
      // Filter to this seeker's sessions
      const mySessions = rawSessions.filter((s: ApiSession) => s.seekerId === user.id);
      setSessions(mySessions as unknown as SessionItem[]);
      setSessionHistory(mySessions as unknown as SessionItem[]);
    } catch {
      setError(lang === 'sw' ? 'Imeshindwa kupakia vikao' : 'Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, lang, setSessionHistory]);

  const fetchGuides = useCallback(async () => {
    setIsLoadingGuides(true);
    try {
      const data = await guidesApi.list();
      const rawGuides = Array.isArray(data) ? data : [];
      const mapped = rawGuides.map((g: GuideWithProfile) => {
        const profile = g.guideProfile;
        return {
          id: g.id,
          name: g.name,
          avatarUrl: g.avatarUrl,
          bio: profile?.bio || '',
          rating: profile?.avgRating || 0,
          totalSessions: profile?.totalSessions || 0,
          status: profile?.status || 'pending',
          currentStatus: profile?.currentStatus || 'offline',
          zones: profile?.zones || [],
          languages: profile?.languages || [],
          badgeTypes: [] as string[],
          isVerifiedElite: false,
        };
      });
      setGuides(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingGuides(false);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const data = await priceRadarApi.list();
      const rawPrices = Array.isArray(data) ? data : [];
      const mapped = rawPrices.map((e: PriceRadarEntry) => {
        const matchingZone = zones.find((z) => z.id === e.zoneId);
        return {
          id: e.id,
          category: e.category,
          zoneId: e.zoneId,
          zoneNameKey: matchingZone ? matchingZone.nameKey : '',
          minPrice: e.priceMin,
          maxPrice: e.priceMax,
          updatedAt: e.updatedAt,
        };
      });
      setPrices(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingPrices(false);
    }
  }, [zones]);

  const fetchVendors = useCallback(async () => {
    setIsLoadingVendors(true);
    try {
      const data = await vendorsApi.list();
      const rawVendors = Array.isArray(data) ? data : [];
      const mapped = rawVendors
        .filter((v: ApiVendor) => v.approved)
        .map((v: ApiVendor) => {
          const matchingZone = zones.find((z) => z.id === v.zoneId);
          return {
            id: v.id,
            name: v.name,
            zoneId: v.zoneId,
            zoneNameKey: matchingZone ? matchingZone.nameKey : '',
            categories: v.categories || [],
            stallNumber: v.stallNumber || '',
            recommendations: 0,
            openHours: '8:00-18:00',
            isApproved: v.approved,
            x: v.geoLat ? (v.geoLat - -6.82) * 5000 + 50 : 10 + Math.random() * 80,
            y: v.geoLng ? (v.geoLng - 39.27) * 5000 + 50 : 10 + Math.random() * 80,
          };
        });
      setVendors(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingVendors(false);
    }
  }, [zones]);

  const fetchMarketStories = useCallback(async () => {
    setIsLoadingStories(true);
    try {
      const data = await marketStoriesApi.list();
      const rawStories = Array.isArray(data) ? data : [];
      setMarketStories(rawStories);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingStories(false);
    }
  }, []);

  const fetchSeasonalEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const data = await seasonalEventsApi.list();
      const rawEvents = Array.isArray(data) ? data : [];
      setSeasonalEvents(rawEvents);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const fetchBuddyMatches = useCallback(async () => {
    setIsLoadingBuddies(true);
    try {
      const data = await buddyMatchesApi.list();
      const rawMatches = Array.isArray(data) ? data : [];
      setBuddyMatches(rawMatches);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingBuddies(false);
    }
  }, []);

  const fetchPackageDeals = useCallback(async () => {
    setIsLoadingPackages(true);
    try {
      const data = await packageDealsApi.list();
      const rawPackages = Array.isArray(data) ? data : [];
      setPackageDealList(rawPackages);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const data = await exchangeRatesApi.list();
      const rawRates = Array.isArray(data) ? data : [];
      setExchangeRates(rawRates);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchNavWaypoints = useCallback(async () => {
    try {
      const data = await navWaypointsApi.list();
      const rawWaypoints = Array.isArray(data) ? data : [];
      setNavWaypoints(rawWaypoints);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchActiveSession = useCallback(async (sessionId: string) => {
    try {
      const data = await sessionsApi.update(sessionId, {});
      // sessionsApi.update with empty body is just a GET-like fetch for the session
      // Actually use api.get for the specific session
      const sessionData = await api.get<ApiSession>(`/sessions/${sessionId}`);
      if (sessionData) {
        setActiveSessionData(sessionData as unknown as SessionItem);
      }
      // Also fetch messages for this session
      const msgs = await messagesApi.list(sessionId);
      const rawMsgs = Array.isArray(msgs) ? msgs : [];
      setSessionMessages(rawMsgs as unknown as MessageItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Initial data loading ──

  useEffect(() => {
    fetchZones();
    fetchGuides();
  }, [fetchZones, fetchGuides]);

  // Fetch prices & vendors after zones are loaded (they depend on zone mapping)
  useEffect(() => {
    if (zones.length > 0) {
      fetchPrices();
      fetchVendors();
    }
  }, [zones, fetchPrices, fetchVendors]);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchSessions();
    }
  }, [user, fetchRequests, fetchSessions]);

  // Fetch feature data on mount
  useEffect(() => {
    fetchMarketStories();
    fetchSeasonalEvents();
    fetchBuddyMatches();
    fetchPackageDeals();
    fetchExchangeRates();
    fetchNavWaypoints();
  }, [fetchMarketStories, fetchSeasonalEvents, fetchBuddyMatches, fetchPackageDeals, fetchExchangeRates, fetchNavWaypoints]);

  // Start location tracking when authenticated
  useEffect(() => {
    if (user) {
      const stopTracking = startLocationTracking();
      return stopTracking;
    }
  }, [user, startLocationTracking]);

  // ── Check for active session on load ──

  useEffect(() => {
    const activeSession = sessions.find(
      (s) => s.escrowStatus === 'held' && !s.completedAt
    );
    if (activeSession && view === 'home') {
      setActiveSessionId(activeSession.id);
      fetchActiveSession(activeSession.id);
    }
  }, [sessions, view, fetchActiveSession]);

  // ── Socket.io: Join/leave session rooms ──

  useEffect(() => {
    if (activeSessionId) {
      emitJoinSession(activeSessionId);
      return () => {
        emitLeaveSession(activeSessionId);
      };
    }
  }, [activeSessionId]);

  // ── Live matching: use Socket.io + timer fallback ──

  useEffect(() => {
    if (!isWaitingForGuides) return;
    const interval = setInterval(() => {
      setMatchTimer((prev) => {
        const next = prev + 1;
        // Gradually show online guides as matched at 3s, 8s, 15s
        if (next === 3 && matchedGuides.length === 0) {
          const onlineGuides = guides.filter(
            (g) => g.currentStatus === 'online' && g.status === 'active'
          );
          if (onlineGuides.length > 0) {
            const guide = onlineGuides[0];
            setMatchedGuides((prev) =>
              prev.find((g) => g.id === guide.id) ? prev : [...prev, guide]
            );
            toast.success(lang === 'sw' ? 'Mwongozo amepatikana!' : 'A guide has been found!');
          }
        }
        if (next === 8 && matchedGuides.length <= 1) {
          const onlineGuides = guides.filter(
            (g) => g.currentStatus === 'online' && g.status === 'active'
          );
          if (onlineGuides.length > 1) {
            const guide = onlineGuides[1];
            setMatchedGuides((prev) =>
              prev.find((g) => g.id === guide.id) ? prev : [...prev, guide]
            );
            toast.success(lang === 'sw' ? 'Mwongozo mwingine amepatikana!' : 'Another guide found!');
          }
        }
        if (next === 15) {
          const onlineGuides = guides.filter(
            (g) => g.currentStatus === 'online' && g.status === 'active'
          );
          if (onlineGuides.length > 2) {
            const guide = onlineGuides[2];
            setMatchedGuides((prev) =>
              prev.find((g) => g.id === guide.id) ? prev : [...prev, guide]
            );
          }
        }
        // Zone expansion notification at 5 min
        if (next === 300 && !zoneExpanded) {
          setZoneExpanded(true);
          toast.info(lang === 'sw' ? 'Maeneo yamepanuliwa kutafuta waongozaji zaidi' : 'Zones expanded to find more guides');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isWaitingForGuides, matchedGuides, guides, lang, zoneExpanded]);

  // ── Session chat: Socket.io replaces polling (with fallback) ──

  useEffect(() => {
    if (!activeSessionId || view !== 'session') return;
    // Fallback polling every 10s (Socket.io handles real-time)
    const interval = setInterval(() => {
      fetchActiveSession(activeSessionId);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSessionId, view, fetchActiveSession]);

  // ── Refresh price radar periodically ──

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ── Actions ──

  const handleCreateRequest = useCallback(async () => {
    if (!user || !requestDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const newRequest = await requestsApi.create({
        description: requestDescription.trim(),
        zoneIds: selectedZoneIds,
        budget: parseFloat(requestBudget) || undefined,
        preferredLanguage: lang,
      });
      toast.success(lang === 'sw' ? 'Ombi limewasilishwa!' : 'Request submitted!');
      setRequestDescription('');
      setSelectedZoneIds([]);
      setRequestBudget('');
      setRequestPhoto(false);
      setMatchingRequestId(newRequest.id || null);
      setMatchedGuides([]);
      setIsWaitingForGuides(true);
      setMatchTimer(0);
      setZoneExpanded(false);
      setView('matching');
      fetchRequests();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kuwasilisha ombi' : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, requestDescription, selectedZoneIds, requestBudget, lang, fetchRequests]);

  const handleAcceptGuide = useCallback(async (guideId: string) => {
    if (!matchingRequestId) return;
    try {
      const req = requests.find((r) => r.id === matchingRequestId);
      const newSession = await sessionsApi.create({
        requestId: matchingRequestId,
        guideId,
      });
      toast.success(lang === 'sw' ? 'Mwongozo amekubaliwa! Kikao kimeanza' : 'Guide accepted! Session started');
      setIsWaitingForGuides(false);
      setActiveSessionId(newSession.id || null);
      setActiveSessionData(newSession as unknown as SessionItem);
      setSessionMessages([]);
      setActiveSession(newSession as unknown as import('@/lib/stores/session-store').Session);
      emitJoinSession(newSession.id);
      setView('session');
      fetchRequests();
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukubali mwongozo' : 'Failed to accept guide');
    }
  }, [matchingRequestId, requests, setActiveSession, fetchRequests, fetchSessions]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeSessionId || !user) return;
    try {
      // Emit via Socket.io for real-time delivery
      emitChatMessage(activeSessionId, content);
      // Also persist via REST API
      await messagesApi.send({
        sessionId: activeSessionId,
        content,
      });
      // Refresh messages from server
      fetchActiveSession(activeSessionId);
    } catch {
      /* ignore */
    }
  }, [activeSessionId, user, fetchActiveSession]);

  const handleCompleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await sessionsApi.update(activeSessionId, {
        status: 'completed',
      } as Partial<ApiSession>);
      toast.success(lang === 'sw' ? 'Kikao kimemalizika!' : 'Session completed!');
      setRatingSessionId(activeSessionId);
      setRatingOpen(true);
      fetchActiveSession(activeSessionId);
      fetchRequests();
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukamilisha kikao' : 'Failed to complete session');
    }
  }, [activeSessionId, fetchActiveSession, fetchRequests, fetchSessions]);

  const handleEmergency = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await sessionsApi.update(activeSessionId, {
        hasEmergency: true,
      } as Partial<ApiSession>);
      toast.error(lang === 'sw' ? 'Tahadhari imetumwa! Msaada unakuja.' : 'Emergency alert sent! Help is on the way.');
    } catch {
      /* ignore */
    }
  }, [activeSessionId]);

  const handleSubmitRating = useCallback(async () => {
    if (!ratingSessionId) return;
    try {
      await sessionsApi.update(ratingSessionId, {
        seekerRating: ratingValue,
      } as Partial<ApiSession>);
      toast.success(lang === 'sw' ? 'Asante kwa ukadiriaji wako!' : 'Thank you for your rating!');
      setRatingOpen(false);
      setRatingSessionId(null);
      setRatingValue(5);
      setReviewText('');
      clearSession();
      setActiveSessionId(null);
      setActiveSessionData(null);
      setView('home');
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kuwasilisha ukadiriaji' : 'Failed to submit rating');
    }
  }, [ratingSessionId, ratingValue, clearSession, fetchSessions]);

  const handleCancelRequest = useCallback(async (requestId: string) => {
    try {
      await requestsApi.update(requestId, {
        status: 'cancelled',
      } as Partial<SessionRequest>);
      toast.success(lang === 'sw' ? 'Ombi limeghairiwa' : 'Request cancelled');
      fetchRequests();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kughairi ombi' : 'Failed to cancel request');
    }
  }, [fetchRequests]);

  // ── Derived data ──

  const activeSession = sessions.find((s) => s.escrowStatus === 'held' && !s.completedAt);
  const openRequest = requests.find((r) => r.status === 'open');
  const completedSessions = sessions.filter((s) => s.completedAt);
  const guideOfWeek = useMemo(() => {
    const activeGuides = guides.filter((g) => g.status === 'active' && g.rating >= 4.5);
    return activeGuides.length > 0 ? activeGuides[0] : null;
  }, [guides]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === 'all') return requests;
    return requests.filter((r) => r.status === requestFilter);
  }, [requests, requestFilter]);

  const filteredHistory = useMemo(() => {
    let result = completedSessions;
    if (historyDateFrom) {
      const from = new Date(historyDateFrom).getTime();
      result = result.filter((s) => new Date(s.createdAt).getTime() >= from);
    }
    if (historyDateTo) {
      const to = new Date(historyDateTo).getTime() + 86400000;
      result = result.filter((s) => new Date(s.createdAt).getTime() <= to);
    }
    return result;
  }, [completedSessions, historyDateFrom, historyDateTo]);

  // ── Navigation ──

  const navigateTo = (v: SeekerView) => {
    if (v === 'matching' && openRequest) {
      setMatchingRequestId(openRequest.id);
      setMatchedGuides([]);
      setIsWaitingForGuides(true);
      setMatchTimer(0);
      setZoneExpanded(false);
    }
    if (v === 'session' && activeSessionId) {
      fetchActiveSession(activeSessionId);
    }
    if (v === 'my-requests') {
      fetchRequests();
    }
    if (v === 'history') {
      fetchSessions();
    }
    setView(v);
  };

  // ── Render helpers ──

  const renderBackButton = (targetView: SeekerView = 'home') => (
    <button
      className="kbtn-outline flex items-center gap-1.5 mb-4 py-1.5 text-sm"
      onClick={() => navigateTo(targetView)}
    >
      <ArrowLeft className="size-4" />
      {t('back', lang)}
    </button>
  );

  // ── Sub-views ──

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

      {/* Online status indicator */}
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse-dot" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('online', lang)}</span>
      </div>

      {/* Navigation tabs: Market | Guides | Escrow */}
      <div className="knav rounded-xl p-1 flex gap-1">
        <button className="knav-link knav-link-active flex-1 text-center">{lang === 'sw' ? 'Soko' : 'Market'}</button>
        <button className="knav-link flex-1 text-center" onClick={() => navigateTo('matching')}>{lang === 'sw' ? 'Waongozaji' : 'Guides'}</button>
        <button className="knav-link flex-1 text-center" onClick={() => navigateTo('price-radar')}>{lang === 'sw' ? 'Dhamana' : 'Escrow'}</button>
      </div>

      {/* Active Request Card - with LIVE badge */}
      {activeSession && (
        <div
          className="kcard cursor-pointer"
          onClick={() => {
            setActiveSessionId(activeSession.id);
            fetchActiveSession(activeSession.id);
            setActiveSession(activeSession as unknown as import('@/lib/stores/session-store').Session);
            setView('session');
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-kariako-green animate-pulse-dot" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{t('active_session', lang)}</p>
                  <span className="kbadge kbadge-live">LIVE</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {activeSession.guide?.name || 'Guide'} &middot; {activeSession.sessionCode}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="kbtn-outline text-xs py-1.5 px-3 flex-1" onClick={(e) => { e.stopPropagation(); navigateTo('session'); }}>
                {lang === 'sw' ? 'Tazama Kikao' : 'View Session'}
              </button>
              <button className="kbtn text-xs py-1.5 px-3 flex-1" onClick={(e) => { e.stopPropagation(); navigateTo('session'); }}>
                <MapPin className="size-3" />
                {lang === 'sw' ? 'Fuata Mwongozo' : 'Track Guide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open request banner - Active Request Card style */}
      {openRequest && !activeSession && (
        <div
          className="kcard cursor-pointer"
          onClick={() => navigateTo('matching')}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Radio className="size-5 text-kariako-green animate-pulse-dot" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Ombi lako lipo wazi' : 'Your request is open'}</p>
                  <span className="kbadge kbadge-live">LIVE</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{openRequest.description}</p>
                <p className="text-xs text-kariako-green font-medium mt-0.5">{lang === 'sw' ? 'Inatafuta waongozaji...' : 'Matching with guides...'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="kbtn-outline text-xs py-1.5 px-3 flex-1" onClick={(e) => { e.stopPropagation(); handleCancelRequest(openRequest.id); }}>
                {lang === 'sw' ? 'Ghairi Utafutaji' : 'Cancel Search'}
              </button>
              <button className="kbtn text-xs py-1.5 px-3 flex-1" onClick={(e) => { e.stopPropagation(); navigateTo('matching'); }}>
                <Zap className="size-3" />
                {lang === 'sw' ? 'Ongeza Mwonekano' : 'Boost Visibility'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Radar Card - with category badges */}
      {prices.length > 0 && (
        <div className="kcard">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radar className="size-5 text-kariako-green" />
              <h3 className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Rada ya Bei' : 'Price Radar'}</h3>
            </div>
            <div className="space-y-3">
              {prices.slice(0, 3).map((price) => {
                const categoryBadgeClass = price.category.toLowerCase().includes('electronic')
                  ? 'kbadge kbadge-electronics'
                  : price.category.toLowerCase().includes('kitchen') || price.category.toLowerCase().includes('vyombo')
                  ? 'kbadge kbadge-kitchenware'
                  : price.category.toLowerCase().includes('fabric') || price.category.toLowerCase().includes('kitenge')
                  ? 'kbadge kbadge-fabrics'
                  : price.category.toLowerCase().includes('spice') || price.category.toLowerCase().includes('spices')
                  ? 'kbadge kbadge-spices'
                  : 'kbadge kbadge-wholesale';
                const priceRange = price.maxPrice - price.minPrice;
                const barWidth = Math.min(100, Math.max(20, (priceRange / price.maxPrice) * 100));
                return (
                  <div key={price.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={categoryBadgeClass}>{price.category}</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatTZS(price.minPrice, lang)} - {formatTZS(price.maxPrice, lang)}
                      </span>
                    </div>
                    <div className="kprogress">
                      <div className="kprogress-bar" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="kbtn-outline w-full mt-3 text-xs py-2" onClick={() => navigateTo('price-radar')}>
              {lang === 'sw' ? 'Tazama Bei Zote' : 'View All Prices'}
            </button>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="kcard overflow-hidden">
        <div className="relative">
          <GoogleMap
            zones={zones.map((z) => ({
              id: z.id,
              name: z.name,
              nameKey: z.nameKey,
            }))}
            vendors={vendors.slice(0, 7).map((v) => ({ id: v.id, name: v.name, zoneId: v.zoneId }))}
            guides={guides.filter((g) => g.currentStatus === 'online').slice(0, 3).map((g) => ({ id: g.id, name: g.name, rating: g.rating, isOnline: g.currentStatus === 'online' }))}
            showUserLocation={true}
            interactive={true}
          />
          {/* Map overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <div className="kmap-badge">
              <MapPin className="size-3.5 text-kariako-green" />
              <span>{guides.filter((g) => g.currentStatus === 'online').length || 12} {lang === 'sw' ? 'Waongozaji' : 'Guides Nearby'}</span>
            </div>
            <div className="kmap-badge">
              <ShieldCheck className="size-3.5 text-kariako-yellow" />
              <span>{lang === 'sw' ? 'Dhamana Imethibitishwa' : 'Escrow Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Identity Card - Green background */}
      <div className="kcard-green p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-kariako-yellow" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{lang === 'sw' ? 'Wasifu Uliothibitishwa' : 'Verified Profile'}</p>
            <p className="text-xs text-white/70">{user?.name || 'Seeker'}</p>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/80">{lang === 'sw' ? 'Alama ya Kuaminiwa Escrow' : 'Escrow Trust Score'}</span>
            <span className="text-xs font-bold text-kariako-yellow">85%</span>
          </div>
          <div className="ktrust-progress">
            <div className="ktrust-progress-bar" style={{ width: '85%' }} />
          </div>
        </div>
        <p className="text-xs text-white/60">
          {lang === 'sw'
            ? 'Wasifu wako umethibitishwa. Malipo yanalindwa na Escrow.'
            : 'Your profile is verified. Payments are protected by Escrow.'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="kcard cursor-pointer group"
          onClick={() => navigateTo('post-request')}
        >
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('post_request', lang)}</span>
          </div>
        </div>

        <div
          className="kcard cursor-pointer group"
          onClick={() => navigateTo('price-radar')}
        >
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radar className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('nav_price_radar', lang)}</span>
          </div>
        </div>

        <div
          className="kcard cursor-pointer group"
          onClick={() => navigateTo('vendors')}
        >
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('nav_vendors', lang)}</span>
          </div>
        </div>

        <div
          className="kcard cursor-pointer group"
          onClick={() => navigateTo('my-requests')}
        >
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('my_requests', lang)}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="kcard">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Shughuli za hivi karibu' : 'Recent Activity'}</h3>
          </div>
          <div className="space-y-2">
            {isLoadingRequests ? (
              Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg shimmer" />)
            ) : requests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('no_requests', lang)}</p>
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setExpandedRequest(req.id);
                    navigateTo('my-requests');
                  }}
                >
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{req.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(req.createdAt, lang)}</p>
                  </div>
                  <Badge className={cn('text-[10px] h-5', statusColorMap[req.status] || '')}>
                    {t(req.status as keyof typeof statusColorMap, lang)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Popular Zones Card */}
      {zones.length > 0 && (
        <div className="kcard">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="size-4 text-kariako-green" />
              <h3 className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Maeneo Maarufu' : 'Popular Zones'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {zones.slice(0, 4).map((zone) => {
                const zc = zoneColorMap[zone.nameKey];
                return (
                  <div
                    key={zone.id}
                    className="rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-border"
                    onClick={() => navigateTo('vendors')}
                  >
                    <div className={cn('h-16 flex items-center justify-center', zc?.bg || 'bg-muted')}>
                      <MapPin className={cn('size-6', zc?.text || 'text-muted-foreground')} />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {lang === 'sw' ? zone.nameSw : zone.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feature quick actions */}
      <div>
        <h2 className="text-lg font-bold gradient-text-green mb-3">{lang === 'sw' ? 'Vipengee Zaidi' : 'More Features'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="kcard cursor-pointer group" onClick={() => navigateTo('group-tour')}>
            <div className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="size-5 text-kariako-green" />
              </div>
              <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Safari ya Kikundi' : 'Group Tour'}</span>
            </div>
          </div>

          <div className="kcard cursor-pointer group" onClick={() => navigateTo('heatmap')}>
            <div className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <ThermometerSun className="size-5 text-kariako-green" />
              </div>
              <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Joto la Soko' : 'Market Heatmap'}</span>
            </div>
          </div>

          <div className="kcard cursor-pointer group" onClick={() => navigateTo('shopping-list')}>
            <div className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="size-5 text-kariako-green" />
              </div>
              <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Orodha ya Ununuzi' : 'Shopping List'}</span>
            </div>
          </div>

          <div className="kcard cursor-pointer group" onClick={() => navigateTo('packages')}>
            <div className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="size-5 text-kariako-green" />
              </div>
              <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Vifurushi' : 'Package Deals'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* More feature links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kcard cursor-pointer group" onClick={() => navigateTo('stories')}>
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Hadithi za Soko' : 'Market Stories'}</span>
          </div>
        </div>

        <div className="kcard cursor-pointer group" onClick={() => navigateTo('calendar')}>
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Kalenda ya Msimu' : 'Seasonal Calendar'}</span>
          </div>
        </div>

        <div className="kcard cursor-pointer group" onClick={() => navigateTo('buddy')}>
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Rafiki Pamoja' : 'Buddy System'}</span>
          </div>
        </div>

        <div className="kcard cursor-pointer group" onClick={() => navigateTo('haggling')}>
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-kariako-green-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="size-5 text-kariako-green" />
            </div>
            <span className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Msaidizi wa Bishi' : 'Haggling Helper'}</span>
          </div>
        </div>
      </div>

      {/* Guide of the Week */}
      {guideOfWeek && (
        <div>
          <h2 className="text-lg font-bold gradient-text-green mb-3">{t('guide_of_week', lang)}</h2>
          <div className="kcard overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'size-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-kariako-yellow',
                  ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'][guideOfWeek.id.charCodeAt(0) % 5]
                )}>
                  {guideOfWeek.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{guideOfWeek.name}</h3>
                    <Crown className="size-4 text-kariako-yellow" />
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
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="kcard h-12 flex items-center justify-start gap-2 px-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => navigateTo('history')}
        >
          <Clock className="size-4 text-muted-foreground" />
          {t('session_history', lang)}
        </button>
        <button
          className="kcard h-12 flex items-center justify-start gap-2 px-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => navigateTo('matching')}
          disabled={!openRequest}
        >
          <Users className="size-4 text-muted-foreground" />
          {lang === 'sw' ? 'Waongozaji' : 'Guides'}
        </button>
      </div>
    </div>
  );

  // ─── POST REQUEST VIEW ───
  const renderPostRequest = () => (
    <div className="space-y-6">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold gradient-text-green">{t('post_request', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('request_description', lang)}</p>
      </div>

      <div className="kcard">
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('description', lang)}</label>
            <Textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder={t('request_description', lang)}
              className="mt-1.5 min-h-[100px] kinput border-0 bg-transparent focus:ring-0 focus:outline-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{requestDescription.length}/500</p>
          </div>

          {/* Zone selector */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('request_zone', lang)}</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {isLoadingZones ? (
                <Skeleton className="h-8 w-40 rounded-lg shimmer" />
              ) : (
                zones.map((zone) => {
                  const isSelected = selectedZoneIds.includes(zone.id);
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneIds((prev) =>
                          isSelected ? prev.filter((id) => id !== zone.id) : [...prev, zone.id]
                        );
                      }}
                      className={cn(
                        'ktag',
                        isSelected ? 'ktag-active' : 'ktag-inactive'
                      )}
                    >
                      <MapPin className="size-3" />
                      {lang === 'sw' ? zone.nameSw : zone.name}
                      {isSelected && <X className="size-3" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('request_budget', lang)}</label>
            <div className="relative mt-1.5">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
              <Input
                type="number"
                value={requestBudget}
                onChange={(e) => setRequestBudget(e.target.value)}
                placeholder="0"
                className="pl-9 kinput border-0 bg-transparent focus:ring-0 focus:outline-none"
                min={0}
              />
            </div>
            {requestBudget && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatTZS(parseFloat(requestBudget) || 0, lang)}
              </p>
            )}
          </div>

          {/* Photo attachment (simulated) */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('request_photo', lang)}</label>
            <div className="mt-1.5">
              <button
                type="button"
                className={cn(
                  'gap-2 flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  requestPhoto ? 'kbtn' : 'kbtn-outline'
                )}
                onClick={() => setRequestPhoto(!requestPhoto)}
              >
                <Camera className="size-4" />
                {requestPhoto
                  ? lang === 'sw' ? 'Picha imeongezwa ✓' : 'Photo added ✓'
                  : t('request_photo', lang)}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className="kbtn w-full h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateRequest}
            disabled={!requestDescription.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('loading', lang)}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {t('submit', lang)}
              </>
            )}
          </button>

          {/* Quick links */}
          <div className="flex gap-2 pt-2">
            <button
              className="kbtn-outline flex-1 h-9 text-xs gap-1.5"
              onClick={() => navigateTo('shopping-list')}
            >
              <ShoppingCart className="size-3.5" />
              {lang === 'sw' ? 'Orodha ya Ununuzi' : 'Shopping List'}
            </button>
            <button
              className="kbtn-outline flex-1 h-9 text-xs gap-1.5"
              onClick={() => navigateTo('buddy')}
            >
              <Heart className="size-3.5" />
              {lang === 'sw' ? 'Rafiki Pamoja' : 'Buddy System'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MY REQUESTS VIEW ───
  const renderMyRequests = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold gradient-text-green">{t('my_requests', lang)}</h1>
        <button className="kbtn flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => navigateTo('post-request')}>
          <Plus className="size-3.5" />
          {t('post_request', lang)}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'open', 'matched', 'active', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            className={cn(
              'h-8 text-xs shrink-0 px-3 rounded-lg font-medium transition-colors',
              requestFilter === status
                ? 'kbtn'
                : 'kbtn-outline'
            )}
            onClick={() => setRequestFilter(status)}
          >
            {status === 'all' ? (lang === 'sw' ? 'Zote' : 'All') : t(status as 'open', lang)}
          </button>
        ))}
      </div>

      {/* Request list */}
      {isLoadingRequests ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl shimmer" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_requests', lang)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isExpanded = expandedRequest === req.id;
            const parsedZoneIds = typeof req.zoneIds === 'string' ? JSON.parse(req.zoneIds || '[]') : req.zoneIds;
            return (
              <div key={req.id} className="kcard overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{req.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(req.zones || []).map((z) => {
                          const zKey = `zone_${(z.name || '').toLowerCase()}`;
                          const zc = zoneColorMap[zKey];
                          return (
                            <Badge key={z.id} variant="secondary" className={cn('text-[9px] h-4 px-1.5', zc?.bg, zc?.text)}>
                              <MapPin className="size-2.5 mr-0.5" />
                              {lang === 'sw' ? z.nameSw || z.name : z.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={cn('text-[10px] h-5', statusColorMap[req.status] || '')}>
                        {t((req.status || 'open') as 'open', lang)}
                      </Badge>
                      {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {req.budget > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="size-3" />
                        {formatTZS(req.budget, lang)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(req.createdAt, lang)}
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('status', lang)}</span>
                      <Badge className={cn('text-[10px] h-5', statusColorMap[req.status] || '')}>
                        {t((req.status || 'open') as 'open', lang)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('budget', lang)}</span>
                      <span className="text-xs font-medium text-foreground">{formatTZS(req.budget, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('date', lang)}</span>
                      <span className="text-xs font-medium text-foreground">{formatDateTime(req.createdAt, lang)}</span>
                    </div>

                    {/* Sessions for this request */}
                    {req.sessions && req.sessions.length > 0 && (
                      <div className="pt-2 border-t border-border mt-2">
                        <p className="text-xs font-medium text-foreground mb-1.5">{lang === 'sw' ? 'Vikao' : 'Sessions'}</p>
                        {req.sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between py-1 text-xs">
                            <span className="text-foreground">{s.guide?.name || 'Guide'}</span>
                            <Badge className={cn('text-[9px] h-4', escrowStatusMap[s.escrowStatus] || '')}>
                              {s.escrowStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {req.status === 'open' && (
                        <>
                          <button
                            className="kbtn flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMatchingRequestId(req.id);
                              setMatchedGuides([]);
                              setIsWaitingForGuides(true);
                              setMatchTimer(0);
                              setZoneExpanded(false);
                              setView('matching');
                            }}
                          >
                            <Users className="size-3" />
                            {lang === 'sw' ? 'Tazama waongozaji' : 'View guides'}
                          </button>
                          <button
                            className="kbtn-danger h-8 text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(req.id);
                            }}
                          >
                            {t('cancel', lang)}
                          </button>
                        </>
                      )}
                      {req.status === 'matched' && (
                        <button
                          className="kbtn flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const session = sessions.find((s) => s.requestId === req.id);
                            if (session) {
                              setActiveSessionId(session.id);
                              fetchActiveSession(session.id);
                              setActiveSession(session as unknown as import('@/lib/stores/session-store').Session);
                              setView('session');
                            }
                          }}
                        >
                          {t('active_session', lang)}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── LIVE MATCHING VIEW ───
  const renderMatching = () => {
    const matchingRequest = requests.find((r) => r.id === matchingRequestId) || openRequest;
    return (
      <div className="space-y-4">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Kupeleleza waongozaji' : 'Finding Guides'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw' ? 'Wafanyakazi wanaangalia ombi lako...' : 'Guides are reviewing your request...'}
          </p>
        </div>

        {/* The open request */}
        {matchingRequest && (
          <div className="kcard">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-kariako-green-light flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-kariako-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{matchingRequest.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(matchingRequest.zones || []).map((z) => (
                      <Badge key={z.id} variant="secondary" className="text-[9px] h-4">
                        {lang === 'sw' ? z.nameSw || z.name : z.name}
                      </Badge>
                    ))}
                  </div>
                  {matchingRequest.budget > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{formatTZS(matchingRequest.budget, lang)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting animation */}
        {isWaitingForGuides && matchedGuides.length === 0 && (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="size-16 rounded-full bg-kariako-green-light flex items-center justify-center">
                <Loader2 className="size-8 text-kariako-green animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-kariako-green flex items-center justify-center animate-pulse-dot">
                <Users className="size-3 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mt-3">
              {lang === 'sw' ? 'Inasubiri waongozaji...' : 'Waiting for guides...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(matchTimer / 60)}:{(matchTimer % 60).toString().padStart(2, '0')} {lang === 'sw' ? 'ilipita' : 'elapsed'}
            </p>
          </div>
        )}

        {/* Zone expansion notification */}
        {zoneExpanded && (
          <div className="kcard p-3 flex items-center gap-2 border-kariako-yellow">
            <Bell className="size-4 text-kariako-yellow shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {lang === 'sw' ? 'Maeneo yamepanuliwa baada ya dakika 5 kutafuta waongozaji zaidi' : 'Zones expanded after 5 min to find more guides'}
            </p>
          </div>
        )}

        {/* Matched guides */}
        {matchedGuides.length > 0 && (
          <div>
            <h2 className="text-base font-bold gradient-text-green mb-3 flex items-center gap-2">
              <Users className="size-4" />
              {lang === 'sw' ? `Waongozaji ${matchedGuides.length} wamepatikana` : `${matchedGuides.length} guide${matchedGuides.length > 1 ? 's' : ''} found`}
            </h2>
            <div className="space-y-3">
              {matchedGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  language={lang}
                  view="seeker"
                  onAccept={handleAcceptGuide}
                />
              ))}
            </div>
          </div>
        )}

        {/* Still searching indicator */}
        {isWaitingForGuides && matchedGuides.length > 0 && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {lang === 'sw' ? 'Bado inatafuta waongozaji zaidi...' : 'Still searching for more guides...'}
            </div>
          </div>
        )}

        {/* No request */}
        {!matchingRequest && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="size-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{lang === 'sw' ? 'Hakuna ombi wazi' : 'No open request'}</p>
            <button className="kbtn mt-3 px-4 py-2 text-sm" onClick={() => navigateTo('post-request')}>
              {t('post_request', lang)}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── ACTIVE SESSION VIEW ───
  const renderActiveSession = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold gradient-text-green">{t('active_session', lang)}</h1>
      </div>

      {!activeSessionData ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_sessions', lang)}</p>
        </div>
      ) : (
        <>
          {/* SmartTimeout indicator at top */}
          <SmartTimeout
            sessionId={activeSessionData.id}
            lastActivityTime={lastActivityTime}
            isActive={!activeSessionData.completedAt && activeSessionData.escrowStatus === 'held'}
            onStillHere={() => setLastActivityTime(Date.now())}
            onAutoComplete={handleCompleteSession}
            language={lang}
          />

          {/* Session Tracker */}
          <SessionTracker
            sessionCode={activeSessionData.sessionCode}
            startedAt={activeSessionData.startedAt}
            escrowStatus={activeSessionData.escrowStatus as 'pending' | 'held' | 'released' | 'refunded' | 'disputed'}
            seekerConfirmed={activeSessionData.seekerConfirmed}
            guideConfirmed={activeSessionData.guideConfirmed}
            checklist={checklist}
            onMarkComplete={handleCompleteSession}
            onEmergency={handleEmergency}
            onToggleChecklist={(itemId) => {
              setChecklist((prev) =>
                prev.map((item) =>
                  item.id === itemId ? { ...item, completed: !item.completed } : item
                )
              );
            }}
            onAddChecklistItem={(text) => {
              setChecklist((prev) => [
                ...prev,
                { id: `item-${Date.now()}`, text, completed: false },
              ]);
            }}
          />

          {/* Guide info */}
          {activeSessionData.guide && (
            <div className="kcard">
              <div className="p-4 flex items-center gap-3">
                <div className={cn(
                  'size-11 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'][
                    (activeSessionData.guide.id || '').charCodeAt(0) % 5
                  ]
                )}>
                  {activeSessionData.guide.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{activeSessionData.guide.name}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Mwongozo wako' : 'Your guide'}</p>
                </div>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  {t('online', lang)}
                </span>
              </div>
            </div>
          )}

          {/* Request info */}
          {activeSessionData.request && (
            <div className="kcard">
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{t('description', lang)}</p>
                <p className="text-sm text-foreground">{activeSessionData.request.description}</p>
                {activeSessionData.request.budget > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('budget', lang)}: {formatTZS(activeSessionData.request.budget, lang)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MultiCurrency for session amount */}
          {activeSessionData.amount > 0 && (
            <MultiCurrency
              amountInTZS={activeSessionData.amount}
              onCurrencyChange={() => {}}
              showMore={false}
              language={lang}
            />
          )}

          {/* Toggle: Chat / Map / Tools */}
          <div className="flex gap-2">
            <button
              className={cn(
                'flex-1 h-10 gap-1.5 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                showChat ? 'kbtn' : 'kbtn-outline'
              )}
              onClick={() => { setShowChat(true); setShowMap(false); setSessionSidebarTab('tools'); }}
            >
              <MessageSquare className="size-4" />
              {lang === 'sw' ? 'Mazungumzo' : 'Chat'}
            </button>
            <button
              className={cn(
                'flex-1 h-10 gap-1.5 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                showMap ? 'kbtn' : 'kbtn-outline'
              )}
              onClick={() => { setShowMap(true); setShowChat(false); setSessionSidebarTab('tools'); }}
            >
              <MapPin className="size-4" />
              {lang === 'sw' ? 'Ramani' : 'Map'}
            </button>
            <button
              className={cn(
                'flex-1 h-10 gap-1.5 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                !showChat && !showMap ? 'kbtn' : 'kbtn-outline'
              )}
              onClick={() => { setShowChat(false); setShowMap(false); }}
            >
              <Zap className="size-4" />
              {lang === 'sw' ? 'Zana' : 'Tools'}
            </button>
          </div>

          {/* Chat with VoiceMessages */}
          {showChat && (
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
                language={lang}
                onSendMessage={handleSendMessage}
              />
              {/* Voice Messages */}
              <div className="border-t border-border p-3">
                <VoiceMessages
                  onSendVoice={(recording) => {
                    setVoiceRecordings((prev) => [...prev, recording]);
                    handleSendMessage(recording.transcription);
                  }}
                  onRecordStart={() => setIsVoiceRecording(true)}
                  onRecordStop={() => setIsVoiceRecording(false)}
                  isRecording={isVoiceRecording}
                  recordings={voiceRecordings}
                  language={lang}
                />
              </div>
            </div>
          )}

          {/* Map */}
          {showMap && (
            <GoogleMap
              zones={zones.map((z) => ({
                id: z.id,
                name: z.name,
                nameKey: z.nameKey,
              }))}
              guides={activeSessionData.guide ? [{
                id: activeSessionData.guide.id,
                name: activeSessionData.guide.name,
              }] : []}
              className="w-full"
              showUserLocation={true}
              interactive={true}
            />
          )}

          {/* Session Tools (tabbed sidebar) */}
          {!showChat && !showMap && (
            <div className="space-y-4">
              {/* Tool tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'tools' as const, icon: Zap, label: lang === 'sw' ? 'Zana' : 'Tools' },
                  { id: 'indoor' as const, icon: Navigation, label: lang === 'sw' ? 'Ndani' : 'Indoor' },
                  { id: 'recording' as const, icon: Mic, label: lang === 'sw' ? 'Rekodi' : 'Record' },
                  { id: 'haggling' as const, icon: Scale, label: lang === 'sw' ? 'Bishi' : 'Haggle' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      'h-8 text-xs shrink-0 gap-1 flex items-center px-3 rounded-lg font-medium transition-colors',
                      sessionSidebarTab === tab.id
                        ? 'kbtn'
                        : 'kbtn-outline'
                    )}
                    onClick={() => setSessionSidebarTab(tab.id)}
                  >
                    <tab.icon className="size-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tools tab content */}
              {sessionSidebarTab === 'tools' && (
                <>
                  {/* Escrow Payment */}
                  <EscrowPayment
                    amount={activeSessionData.amount}
                    platformFee={activeSessionData.platformFee}
                    escrowStatus={activeSessionData.escrowStatus as 'pending' | 'held' | 'released' | 'refunded' | 'disputed'}
                    isGuide={false}
                    language={lang}
                    onPaymentComplete={() => {
                      toast.success(lang === 'sw' ? 'Malipo yamefanikiwa!' : 'Payment successful!');
                      fetchActiveSession(activeSessionData.id);
                    }}
                    onReleaseEscrow={async () => {
                      try {
                        await sessionsApi.update(activeSessionData.id, {
                          escrowStatus: 'released',
                        } as Partial<ApiSession>);
                        toast.success(lang === 'sw' ? 'Malipo yametolewa!' : 'Payment released!');
                        fetchActiveSession(activeSessionData.id);
                      } catch {
                        toast.error(lang === 'sw' ? 'Imeshindwa kutoa malipo' : 'Failed to release payment');
                      }
                    }}
                    onDisputeEscrow={async (reason) => {
                      try {
                        await sessionsApi.update(activeSessionData.id, {
                          escrowStatus: 'disputed',
                        } as Partial<ApiSession>);
                        toast.success(lang === 'sw' ? 'Mgogoro umetumwa' : 'Dispute submitted');
                        fetchActiveSession(activeSessionData.id);
                      } catch {
                        toast.error(lang === 'sw' ? 'Imeshindwa kuwasilisha mgogoro' : 'Failed to submit dispute');
                      }
                    }}
                  />

                  {/* Emergency Panel */}
                  <EmergencyPanel
                    sessionId={activeSessionData.id}
                    sessionCode={activeSessionData.sessionCode}
                    guideName={activeSessionData.guide?.name}
                    seekerName={user?.name}
                    language={lang}
                    onEmergencyTriggered={(data) => {
                      handleEmergency();
                    }}
                  />
                </>
              )}

              {/* Indoor Navigation tab - uses real waypoints from API */}
              {sessionSidebarTab === 'indoor' && (
                <IndoorNavigation
                  zoneId={activeSessionData.request?.description?.includes('spice') ? 'zone_spices' : zones[0]?.id || 'zone_vyombo'}
                  waypoints={navWaypoints.length > 0
                    ? navWaypoints.slice(0, 5).map((wp) => ({
                        id: wp.id,
                        label: lang === 'sw' ? wp.labelSw : wp.label,
                        x: wp.floorPlanX || 50,
                        y: wp.floorPlanY || 50,
                        type: (wp.qrCode ? 'junction' : 'stall') as 'exit' | 'junction' | 'stall',
                        direction: 'straight' as const,
                        distance: '10m',
                        landmark: lang === 'sw' ? wp.labelSw : wp.label,
                      }))
                    : [
                        { id: 'wp-1', label: lang === 'sw' ? 'Lango Kuu' : 'Main Entrance', x: 10, y: 90, type: 'exit' as const, direction: 'straight' as const, distance: '0m', landmark: lang === 'sw' ? 'Mlango mkuu' : 'Main gate' },
                        { id: 'wp-2', label: lang === 'sw' ? 'Mkutano A' : 'Junction A', x: 30, y: 70, type: 'junction' as const, direction: 'right' as const, distance: '20m', landmark: lang === 'sw' ? 'Duka la chai' : 'Tea shop' },
                        { id: 'wp-3', label: lang === 'sw' ? 'Duka la Mama Asha' : 'Mama Asha Stall', x: 50, y: 50, type: 'stall' as const, direction: 'left' as const, distance: '15m', landmark: lang === 'sw' ? 'Alama ya rangi nyekundu' : 'Red sign' },
                      ]
                  }
                  currentWaypointId={navWaypoints[0]?.id || 'wp-1'}
                  language={lang}
                />
              )}

              {/* Session Recording tab */}
              {sessionSidebarTab === 'recording' && (
                <SessionRecording
                  sessionId={activeSessionData.id}
                  guideConsent={true}
                  seekerConsent={seekerRecordingConsent}
                  isRecording={isRecording}
                  duration={recordingDuration}
                  onGrantConsent={() => setSeekerRecordingConsent(true)}
                  onStartRecording={() => {
                    setIsRecording(true);
                    setRecordingDuration(0);
                  }}
                  onStopRecording={() => {
                    setIsRecording(false);
                    toast.success(lang === 'sw' ? 'Rekodi imehifadhiwa!' : 'Recording saved!');
                  }}
                  language={lang}
                />
              )}

              {/* Haggling Assistant tab - uses real price radar data */}
              {sessionSidebarTab === 'haggling' && prices.length > 0 && (
                <HagglingAssistant
                  category={prices[0].category}
                  vendorPrice={prices[0].maxPrice}
                  fairMin={prices[0].minPrice}
                  fairMax={prices[0].maxPrice}
                  zoneName={lang === 'sw' ? 'Kariakoo' : 'Kariakoo'}
                  language={lang}
                  onAcceptCounter={(price) => {
                    toast.success(lang === 'sw' ? `Umekubali TZS ${price.toLocaleString()}` : `Accepted TZS ${price.toLocaleString()}`);
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ─── SESSION HISTORY VIEW ───
  const renderSessionHistory = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold gradient-text-green">{t('session_history', lang)}</h1>
      </div>

      {/* Date range filter */}
      <div className="kcard">
        <div className="p-3 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">{lang === 'sw' ? 'Kutoka' : 'From'}</label>
            <Input
              type="date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              className="h-9 text-xs mt-1 kinput border-0 bg-transparent focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">{lang === 'sw' ? 'Hadi' : 'To'}</label>
            <Input
              type="date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              className="h-9 text-xs mt-1 kinput border-0 bg-transparent focus:ring-0 focus:outline-none"
            />
          </div>
          <button
            className="kbtn-outline h-9 text-xs px-3"
            onClick={() => {
              setHistoryDateFrom('');
              setHistoryDateTo('');
            }}
          >
            {t('clear_filters', lang)}
          </button>
        </div>
      </div>

      {/* Session list */}
      {isLoadingSessions ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl shimmer" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_sessions', lang)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((session) => {
            const isExpanded = expandedHistory === session.id;
            return (
              <div key={session.id} className="kcard overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedHistory(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'size-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                      ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'][
                        (session.guide?.id || '').charCodeAt(0) % 5
                      ]
                    )}>
                      {(session.guide?.name || 'G').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{session.guide?.name || 'Guide'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(session.createdAt, lang)}</span>
                        {session.startedAt && session.completedAt && (
                          <span>&middot; {formatDuration(session.startedAt, session.completedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-foreground">{formatTZS(session.amount, lang)}</span>
                      {session.ratingSeeker && (
                        <div className="flex items-center gap-0.5">
                          <Star className="size-3 text-kariako-yellow fill-kariako-yellow" />
                          <span className="text-xs text-muted-foreground">{session.ratingSeeker}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded receipt */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('session_code', lang)}</span>
                      <span className="font-mono font-medium text-foreground">{session.sessionCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('duration', lang)}</span>
                      <span className="font-medium text-foreground">
                        {session.startedAt && session.completedAt
                          ? formatDuration(session.startedAt, session.completedAt)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('cost', lang)}</span>
                      <span className="font-medium text-foreground">{formatTZS(session.amount, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{lang === 'sw' ? 'Ada ya jukwaa' : 'Platform fee'}</span>
                      <span className="font-medium text-foreground">{formatTZS(session.platformFee, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{lang === 'sw' ? 'Malipo ya mwongozo' : 'Guide payout'}</span>
                      <span className="font-medium text-foreground">{formatTZS(session.amount - session.platformFee, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('payment', lang)}</span>
                      <Badge className={cn('text-[9px] h-4', escrowStatusMap[session.escrowStatus] || '')}>
                        {session.escrowStatus}
                      </Badge>
                    </div>
                    {session.ratingSeeker && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t('rating', lang)}</span>
                        <RatingStars rating={session.ratingSeeker} size="sm" showNumeric={false} />
                      </div>
                    )}
                    {session.reviewSeeker && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('review', lang)}</p>
                        <p className="text-xs text-foreground italic">&quot;{session.reviewSeeker}&quot;</p>
                      </div>
                    )}
                    {session.request && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('description', lang)}</p>
                        <p className="text-xs text-foreground">{session.request.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── PRICE RADAR VIEW ───
  const renderPriceRadar = () => (
    <div className="space-y-4">
      {renderBackButton()}

      {/* MultiCurrency at top */}
      {prices.length > 0 && (
        <MultiCurrency
          amountInTZS={prices[0].maxPrice}
          onCurrencyChange={() => {}}
          showMore={false}
          language={lang}
        />
      )}

      <PriceRadarPanel
        prices={prices}
        zones={zones.map((z) => ({ id: z.id, nameKey: z.nameKey }))}
        language={lang}
        isLoading={isLoadingPrices}
        onSuggestUpdate={async (priceId, suggestion) => {
          try {
            await priceRadarApi.update(priceId, {
              priceMin: suggestion,
            } as Partial<PriceRadarEntry>);
            toast.success(lang === 'sw' ? 'Mapendekezo yamewasilishwa!' : 'Suggestion submitted!');
            fetchPrices();
          } catch {
            toast.error(lang === 'sw' ? 'Imeshindwa kuwasilisha mapendekezo' : 'Failed to submit suggestion');
          }
        }}
      />

      {/* Negotiate button */}
      {prices.length > 0 && (
        <div className="kcard">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-kariako-green-light flex items-center justify-center">
                <Scale className="size-5 text-kariako-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{lang === 'sw' ? 'Piga Bishi' : 'Negotiate Prices'}</p>
                <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Pata bei ya haki kwa kutumia msaidizi wetu' : 'Get fair prices with our assistant'}</p>
              </div>
            </div>
            <button className="kbtn flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => {
              const firstPrice = prices[0];
              setHagglingCategory(firstPrice.category);
              setHagglingVendorPrice(firstPrice.maxPrice);
              navigateTo('haggling');
            }}>
              <Scale className="size-3.5" />
              {lang === 'sw' ? 'Bishi' : 'Negotiate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── VENDOR DIRECTORY VIEW ───
  const renderVendors = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <VendorDirectory
        vendors={vendors}
        zones={zones.map((z) => ({ id: z.id, nameKey: z.nameKey }))}
        language={lang}
        isLoading={isLoadingVendors}
        onRegisterVendor={async (data) => {
          try {
            await vendorsApi.create(data as Partial<ApiVendor>);
            toast.success(lang === 'sw' ? 'Muuzaji amesajiliwa!' : 'Vendor registered!');
            fetchVendors();
          } catch {
            toast.error(lang === 'sw' ? 'Imeshindwa kusajili muuzaji' : 'Failed to register vendor');
          }
        }}
      />
    </div>
  );

  // ─── HAGGLING ASSISTANT VIEW ───
  const renderHaggling = () => {
    const priceEntry = prices.find((p) => p.category === hagglingCategory) || prices[0];
    return (
      <div className="space-y-6">
        {renderBackButton('price-radar')}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Msaidizi wa Bishi' : 'Haggling Assistant'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Pata bei ya haki kwa bidhaa zako' : 'Get fair prices for your items'}</p>
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap gap-2">
          {prices.map((p) => (
            <button
              key={p.id}
              className={cn(
                'h-8 text-xs px-3 rounded-lg font-medium transition-colors',
                hagglingCategory === p.category
                  ? 'kbtn'
                  : 'kbtn-outline'
              )}
              onClick={() => {
                setHagglingCategory(p.category);
                setHagglingVendorPrice(p.maxPrice);
              }}
            >
              {p.category}
            </button>
          ))}
        </div>

        {priceEntry ? (
          <HagglingAssistant
            category={priceEntry.category}
            vendorPrice={hagglingVendorPrice}
            fairMin={priceEntry.minPrice}
            fairMax={priceEntry.maxPrice}
            zoneName={lang === 'sw' ? 'Kariakoo' : 'Kariakoo'}
            language={lang}
            onAcceptCounter={(price) => {
              toast.success(lang === 'sw' ? `Umekubali TZS ${price.toLocaleString()}` : `Accepted TZS ${price.toLocaleString()}`);
            }}
          />
        ) : (
          <div className="kcard">
            <div className="p-6 text-center text-muted-foreground">
              <Scale className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{lang === 'sw' ? 'Hakuna data ya bei' : 'No price data available'}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── GROUP TOUR VIEW ───
  const renderGroupTour = () => {
    // Use buddy matches data for group tour context
    const activeBuddyMatches = buddyMatches.filter((b) => b.status === 'matched' || b.status === 'pending');
    const buddyCount = activeBuddyMatches.length;
    const matchedGuideId = activeBuddyMatches[0]?.guideId;
    const matchedGuide = matchedGuideId ? guides.find((g) => g.id === matchedGuideId) : guides[0];
    const matchedZone = activeBuddyMatches[0]?.zoneId
      ? zones.find((z) => z.id === activeBuddyMatches[0].zoneId)
      : zones[0];

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Safari ya Kikundi' : 'Group Tour'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Onga na wengine na okoa pesa' : 'Join others and save money'}</p>
        </div>
        <GroupTour
          guideName={matchedGuide?.name || (lang === 'sw' ? 'Mwongozo' : 'Guide')}
          zoneName={matchedZone ? (lang === 'sw' ? matchedZone.nameSw : matchedZone.name) : (lang === 'sw' ? 'Kariakoo - Vyombo' : 'Kariakoo - Utensils')}
          maxSeekers={4}
          currentSeekers={Math.min(buddyCount + 1, 3)}
          pricePerSeeker={25000}
          soloPrice={45000}
          discountPercent={44}
          timeSlot="10:00 AM - 12:00 PM"
          language={lang}
          onJoinGroup={async () => {
            if (!user) return;
            try {
              await buddyMatchesApi.create({
                seeker1Id: user.id,
                zoneId: matchedZone?.id || zones[0]?.id,
              } as Partial<BuddyMatch>);
              toast.success(lang === 'sw' ? 'Umejiunga na kikundi!' : 'You joined the group!');
              fetchBuddyMatches();
            } catch {
              toast.error(lang === 'sw' ? 'Imeshindwa kujiunga' : 'Failed to join group');
            }
          }}
          onCreateGroup={async () => {
            if (!user) return;
            try {
              await buddyMatchesApi.create({
                seeker1Id: user.id,
                zoneId: matchedZone?.id || zones[0]?.id,
              } as Partial<BuddyMatch>);
              toast.success(lang === 'sw' ? 'Kikundi kimeundwa!' : 'Group created!');
              fetchBuddyMatches();
            } catch {
              toast.error(lang === 'sw' ? 'Imeshindwa kuunda kikundi' : 'Failed to create group');
            }
          }}
        />
      </div>
    );
  };

  // ─── MARKET HEATMAP VIEW ───
  const renderHeatmap = () => (
    <div className="space-y-6">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Joto la Soko' : 'Market Heatmap'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Tazama msongamano wa maeneo' : 'See crowd density by zone'}</p>
      </div>
      <MarketHeatmap
        zones={zones.map((z) => {
          // Calculate density based on active sessions in this zone
          const zoneActiveSessions = sessions.filter(
            (s) => !s.completedAt && s.escrowStatus === 'held'
          ).length;
          const baseDensity = 30 + zoneActiveSessions * 10;
          return {
            zoneId: z.id,
            zoneName: z.name,
            zoneNameKey: z.nameKey,
            color: z.color,
            currentDensity: Math.min(baseDensity, 95),
            bestTime: lang === 'sw' ? '8:00 AM' : '8:00 AM',
            busiestTime: lang === 'sw' ? '12:00 PM' : '12:00 PM',
            avgSessionDuration: 25 + (z.id.charCodeAt(0) % 3) * 10,
          };
        })}
        language={lang}
      />
    </div>
  );

  // ─── SHOPPING LIST VIEW ───
  const renderShoppingList = () => {
    const shoppingPrices = prices.map((p) => ({
      category: p.category,
      zoneId: p.zoneId,
      min: p.minPrice,
      max: p.maxPrice,
    }));

    const routeStops: RouteStop[] = zones.slice(0, 3).map((z, i) => ({
      id: z.id,
      zoneId: z.id,
      zoneName: z.name,
      zoneNameKey: z.nameKey,
      items: prices
        .filter((p) => p.zoneId === z.id)
        .slice(0, 2)
        .map((p) => p.category) || [lang === 'sw' ? 'Bidhaa 1' : 'Item 1'],
      estimatedTime: 15 + i * 10,
      color: z.color,
    }));

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Orodha ya Ununuzi' : 'Shopping List'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Panga bidhaa zako na pata bei' : 'Organize your items and get prices'}</p>
        </div>

        <ShoppingList
          zones={zones}
          prices={shoppingPrices}
          language={lang}
          onOptimizeRoute={() => setShowRouteOptimizer(true)}
        />

        {/* Route Optimizer toggle */}
        <div className="flex gap-2">
          <button
            className="kbtn-outline flex-1 h-10 gap-2"
            onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
          >
            <Route className="size-4" />
            {showRouteOptimizer
              ? (lang === 'sw' ? 'Ficha Njia' : 'Hide Route')
              : (lang === 'sw' ? 'Boresha Njia' : 'Optimize Route')}
          </button>
        </div>

        {showRouteOptimizer && (
          <RouteOptimizer
            stops={routeStops}
            totalTime={routeStops.reduce((sum, s) => sum + s.estimatedTime, 0)}
            totalDistance="1.2 km"
            language={lang}
            onReorder={(newStops) => {
              toast.success(lang === 'sw' ? 'Njia imeboreshwa!' : 'Route optimized!');
            }}
            onStartRoute={() => {
              toast.success(lang === 'sw' ? 'Njia imeanza!' : 'Route started!');
            }}
          />
        )}
      </div>
    );
  };

  // ─── MARKET STORIES VIEW ───
  const renderStories = () => {
    // Map API stories to the format expected by the MarketStories component
    const mappedStories = marketStories.map((story) => {
      const guide = guides.find((g) => g.id === story.guideId);
      const vendor = vendors.find((v) => v.id === story.vendorId);
      const zone = zones.find((z) => z.id === story.zoneId);
      return {
        id: story.id,
        guideName: guide?.name || (lang === 'sw' ? 'Mwongozo' : 'Guide'),
        vendorName: vendor?.name || (lang === 'sw' ? 'Muuzaji' : 'Vendor'),
        zoneName: zone ? (lang === 'sw' ? zone.nameSw : zone.name) : (lang === 'sw' ? 'Kariakoo' : 'Kariakoo'),
        audioUrl: story.audioUrl || 'mock-audio.mp3',
        text: story.content,
        textSw: story.content,
        tags: story.tags || [],
        createdAt: story.createdAt,
      };
    });

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Hadithi za Soko' : 'Market Stories'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Sikiliza kutoka kwa waongozaji na wauzaji' : 'Hear from guides and vendors'}</p>
        </div>
        {isLoadingStories ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <MarketStories
            stories={mappedStories.length > 0 ? mappedStories : []}
            language={lang}
            onPlayAudio={(storyId) => {
              toast.info(lang === 'sw' ? 'Inacheza sauti...' : 'Playing audio...');
            }}
            onAddStory={async () => {
              toast.info(lang === 'sw' ? 'Shiriki hadithi yako!' : 'Share your story!');
            }}
          />
        )}
      </div>
    );
  };

  // ─── SEASONAL CALENDAR VIEW ───
  const renderCalendar = () => {
    // Map API seasonal events to the format expected by SeasonalCalendar
    const mappedEvents = seasonalEvents.map((evt) => {
      const affectedZoneNames = evt.affectedZones.map((zId) => {
        const zone = zones.find((z) => z.id === zId);
        return zone ? (lang === 'sw' ? zone.nameSw : zone.name) : zId;
      });
      return {
        id: evt.id,
        title: lang === 'sw' ? evt.titleSw : evt.title,
        date: evt.startDate === evt.endDate ? evt.startDate : `${evt.startDate} - ${evt.endDate}`,
        type: evt.type,
        zonesAffected: affectedZoneNames.length > 0 ? affectedZoneNames : [lang === 'sw' ? 'Maeneo yote' : 'All Zones'],
        insiderTip: lang === 'sw' ? (evt.insiderTipSw || evt.insiderTip || '') : (evt.insiderTip || ''),
      };
    });

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Kalenda ya Msimu' : 'Seasonal Calendar'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Matukio ya soko na nyakati bora' : 'Market events and best times'}</p>
        </div>
        {isLoadingEvents ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <SeasonalCalendar
            events={mappedEvents}
            onSetReminder={(eventId) => {
              toast.success(lang === 'sw' ? 'Kumbusho limewekwa!' : 'Reminder set!');
            }}
            language={lang}
          />
        )}
      </div>
    );
  };

  // ─── BUDDY SYSTEM VIEW ───
  const renderBuddy = () => {
    // Derive buddy data from real buddy matches API
    const activeBuddies = buddyMatches
      .filter((b) => b.status === 'matched' || b.status === 'pending')
      .map((b, i) => ({
        id: b.seeker2Id || `buddy-${b.id}`,
        name: lang === 'sw' ? `Mtafuta ${i + 1}` : `Seeker ${i + 1}`,
        rating: 4.0 + (i % 3) * 0.3,
        sessionsCompleted: 5 + (i % 5) * 3,
      }));

    const firstBuddyMatch = buddyMatches[0];
    const buddyZone = firstBuddyMatch?.zoneId
      ? zones.find((z) => z.id === firstBuddyMatch.zoneId)
      : zones[0];

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Rafiki Pamoja' : 'Buddy System'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Onga na watafuta wengine kwa usalama' : 'Join other seekers for safety'}</p>
        </div>
        {isLoadingBuddies ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <BuddySystem
            zoneId={buddyZone?.id || 'zone_1'}
            zoneName={buddyZone ? (lang === 'sw' ? buddyZone.nameSw : buddyZone.name) : 'Kariakoo'}
            timeSlot="10:00 AM - 12:00 PM"
            currentBuddies={activeBuddies.length > 0 ? activeBuddies : [
              { id: 'placeholder-1', name: 'Amina J.', rating: 4.5, sessionsCompleted: 8 },
              { id: 'placeholder-2', name: 'David M.', rating: 4.2, sessionsCompleted: 5 },
            ]}
            seekerRating={4.3}
            onInvite={async (buddyId) => {
              if (!user) return;
              try {
                await buddyMatchesApi.create({
                  seeker1Id: user.id,
                  seeker2Id: buddyId,
                  zoneId: buddyZone?.id,
                } as Partial<BuddyMatch>);
                toast.success(lang === 'sw' ? 'Umekaribisha rafiki!' : 'You invited a buddy!');
                fetchBuddyMatches();
              } catch {
                toast.error(lang === 'sw' ? 'Imeshindwa kukaribisha' : 'Failed to invite buddy');
              }
            }}
            language={lang}
          />
        )}
      </div>
    );
  };

  // ─── PACKAGE DEALS VIEW ───
  const renderPackages = () => {
    // Map API package deals to the format expected by PackageDeals component
    const mappedPackages = packageDealList.map((pkg) => {
      const guide = guides.find((g) => g.id === pkg.guideId);
      const zoneNames = (pkg.zoneIds || []).map((zId) => {
        const zone = zones.find((z) => z.id === zId);
        return zone ? (lang === 'sw' ? zone.nameSw : zone.name) : zId;
      });
      return {
        id: pkg.id,
        title: pkg.title,
        duration: pkg.duration,
        zones: zoneNames.length > 0 ? zoneNames : ['Kariakoo'],
        price: pkg.price,
        deliveryIncluded: pkg.includes?.includes('delivery') || false,
        sessionsCompleted: 0,
        isPopular: false,
      };
    });

    return (
      <div className="space-y-6">
        {renderBackButton()}
        <div>
          <h1 className="text-xl font-bold gradient-text-green">{lang === 'sw' ? 'Vifurushi' : 'Package Deals'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Vifurushi vya bei nafuu kutoka kwa waongozaji' : 'Discounted bundles from guides'}</p>
        </div>
        {isLoadingPackages ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <PackageDeals
            packages={mappedPackages}
            guideName={packageDealList[0] ? (guides.find((g) => g.id === packageDealList[0].guideId)?.name || (lang === 'sw' ? 'Mwongozo' : 'Guide')) : (lang === 'sw' ? 'Mwongozo' : 'Guide')}
            onBook={async (packageId) => {
              try {
                const pkg = packageDealList.find((p) => p.id === packageId);
                if (pkg) {
                  await sessionsApi.create({
                    requestId: '',
                    guideId: pkg.guideId,
                  });
                  toast.success(lang === 'sw' ? 'Kifurushi kimehifadhiwa!' : 'Package booked!');
                }
              } catch {
                toast.error(lang === 'sw' ? 'Imeshindwa kuhifadhi' : 'Failed to book package');
              }
            }}
            language={lang}
          />
        )}
      </div>
    );
  };

  // ── Main Layout ──

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="knav sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <button
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => navigateTo('home')}
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <h1 className="text-base font-bold gradient-text-green">
              {view === 'home' && (lang === 'sw' ? 'Kariako Guide' : 'Kariako Guide')}
              {view === 'post-request' && t('post_request', lang)}
              {view === 'my-requests' && t('my_requests', lang)}
              {view === 'matching' && (lang === 'sw' ? 'Waongozaji' : 'Guides')}
              {view === 'session' && t('active_session', lang)}
              {view === 'history' && t('session_history', lang)}
              {view === 'price-radar' && t('price_radar_title', lang)}
              {view === 'vendors' && t('vendor_directory', lang)}
              {view === 'haggling' && (lang === 'sw' ? 'Msaidizi wa Bishi' : 'Haggling Assistant')}
              {view === 'group-tour' && (lang === 'sw' ? 'Safari ya Kikundi' : 'Group Tour')}
              {view === 'heatmap' && (lang === 'sw' ? 'Joto la Soko' : 'Market Heatmap')}
              {view === 'shopping-list' && (lang === 'sw' ? 'Orodha ya Ununuzi' : 'Shopping List')}
              {view === 'stories' && (lang === 'sw' ? 'Hadithi za Soko' : 'Market Stories')}
              {view === 'calendar' && (lang === 'sw' ? 'Kalenda ya Msimu' : 'Seasonal Calendar')}
              {view === 'buddy' && (lang === 'sw' ? 'Rafiki Pamoja' : 'Buddy System')}
              {view === 'packages' && (lang === 'sw' ? 'Vifurushi' : 'Package Deals')}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {activeSession && (
              <button
                className="kbtn h-8 gap-1 text-xs px-3"
                onClick={() => {
                  setActiveSessionId(activeSession.id);
                  fetchActiveSession(activeSession.id);
                  setActiveSession(activeSession as unknown as import('@/lib/stores/session-store').Session);
                  setView('session');
                }}
              >
                <Clock className="size-3" />
                {t('active_session', lang)}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">
        {/* Error banner */}
        {error && (
          <div className="mb-4 kcard p-3 flex items-center gap-2 border-red-200 dark:border-red-800">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button
              className="kbtn-outline h-7 text-xs px-2"
              onClick={() => {
                setError(null);
                fetchZones();
                fetchRequests();
                fetchSessions();
              }}
            >
              <RefreshCw className="size-3 mr-1 inline" />
              {t('retry', lang)}
            </button>
          </div>
        )}

        {view === 'home' && renderHome()}
        {view === 'post-request' && renderPostRequest()}
        {view === 'my-requests' && renderMyRequests()}
        {view === 'matching' && renderMatching()}
        {view === 'session' && renderActiveSession()}
        {view === 'history' && renderSessionHistory()}
        {view === 'price-radar' && renderPriceRadar()}
        {view === 'vendors' && renderVendors()}
        {view === 'haggling' && renderHaggling()}
        {view === 'group-tour' && renderGroupTour()}
        {view === 'heatmap' && renderHeatmap()}
        {view === 'shopping-list' && renderShoppingList()}
        {view === 'stories' && renderStories()}
        {view === 'calendar' && renderCalendar()}
        {view === 'buddy' && renderBuddy()}
        {view === 'packages' && renderPackages()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 knav z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-2">
          {[
            { id: 'home' as SeekerView, icon: Home, label: t('nav_home', lang) },
            { id: 'my-requests' as SeekerView, icon: FileText, label: t('nav_requests', lang) },
            { id: 'price-radar' as SeekerView, icon: Radar, label: t('nav_price_radar', lang) },
            { id: 'vendors' as SeekerView, icon: Store, label: t('nav_vendors', lang) },
            { id: 'history' as SeekerView, icon: Clock, label: t('nav_sessions', lang) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]',
                view === item.id
                  ? 'text-kariako-green'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="kcard border-border">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{t('rate_experience', lang)}</DialogTitle>
            <DialogDescription>
              {lang === 'sw'
                ? 'Tafadhali kadiria uzoefu wako na mwongozo'
                : 'Please rate your experience with the guide'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Star rating */}
            <div className="flex flex-col items-center gap-2">
              <RatingStars
                rating={ratingValue}
                size="lg"
                interactive
                onRate={(val) => setRatingValue(val)}
                showNumeric={false}
              />
              <span className="text-sm font-medium text-foreground">
                {ratingValue}/5 {ratingValue >= 4 ? '⭐' : ratingValue >= 3 ? '👍' : '😔'}
              </span>
            </div>

            {/* Review text */}
            <div>
              <label className="text-sm font-medium text-foreground">{t('write_review', lang)}</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={lang === 'sw' ? 'Andika maoni yako hapa...' : 'Write your review here...'}
                className="mt-1.5 kinput border-0 bg-transparent focus:ring-0 focus:outline-none"
                maxLength={300}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              className="kbtn-outline h-9 px-4"
              onClick={() => setRatingOpen(false)}
            >
              {t('cancel', lang)}
            </button>
            <button
              className="kbtn h-9 px-6"
              onClick={handleSubmitRating}
              disabled={ratingValue === 0}
            >
              {t('submit', lang)}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
