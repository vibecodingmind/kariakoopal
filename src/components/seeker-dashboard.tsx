'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSessionStore } from '@/lib/stores/session-store';
import { t, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
} from 'lucide-react';

// Shared components
import { SessionTracker } from '@/components/session-tracker';
import { SessionChat } from '@/components/session-chat';
import { PriceRadarPanel } from '@/components/price-radar-panel';
import { VendorDirectory } from '@/components/vendor-directory';
import { MapView } from '@/components/map-view';
import { GuideCard } from '@/components/guide-card';
import { RatingStars } from '@/components/rating-stars';
import { Leaderboard } from '@/components/leaderboard';
import { EscrowPayment } from '@/components/escrow-payment';
import { EmergencyPanel } from '@/components/emergency-panel';
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
  | 'vendors';

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

  // View state
  const [view, setView] = useState<SeekerView>('home');

  // Data state
  const [zones, setZones] = useState<Zone[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  // Loading states
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
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

  // ── Data Fetching ──

  const fetchZones = useCallback(async () => {
    setIsLoadingZones(true);
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      const mapped = (data.zones || []).map((z: Zone & { nameSw?: string }) => ({
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
      const res = await fetch(`/api/requests?seekerId=${user.id}`);
      const data = await res.json();
      setRequests(data.requests || []);
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
      const res = await fetch(`/api/sessions?seekerId=${user.id}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setSessionHistory(data.sessions || []);
    } catch {
      setError(lang === 'sw' ? 'Imeshindwa kupakia vikao' : 'Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, lang, setSessionHistory]);

  const fetchGuides = useCallback(async () => {
    setIsLoadingGuides(true);
    try {
      const res = await fetch('/api/guides?status=active');
      const data = await res.json();
      const mapped = (data.guides || []).map((g: Record<string, unknown>) => {
        const profileZones = typeof g.zones === 'string' ? JSON.parse(g.zones as string) : (g.zones as string[]) || [];
        const profileLanguages = typeof g.languages === 'string' ? JSON.parse(g.languages as string) : (g.languages as string[]) || [];
        const user = g.user as Record<string, unknown> | undefined;
        const badges = (g.badges as Array<Record<string, string>>) || [];
        return {
          id: (user?.id as string) || (g.userId as string),
          name: (user?.name as string) || '',
          avatarUrl: (user?.avatarUrl as string | null) || null,
          bio: (g.bio as string) || '',
          rating: (g.avgRating as number) || 0,
          totalSessions: (g.totalSessions as number) || 0,
          status: (g.status as string) || 'pending',
          currentStatus: (g.currentStatus as string) || 'offline',
          zones: profileZones,
          languages: profileLanguages,
          badgeTypes: badges.map((b) => b.badgeType),
          isVerifiedElite: badges.some((b) => b.badgeType === 'verified_elite'),
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
      const res = await fetch('/api/price-radar');
      const data = await res.json();
      const mapped = (data.entries || []).map((e: Record<string, unknown>) => {
        const zone = e.zone as Record<string, string> | undefined;
        return {
          id: e.id as string,
          category: e.category as string,
          zoneId: e.zoneId as string,
          zoneNameKey: zone ? `zone_${(zone.name || '').toLowerCase()}` : '',
          minPrice: e.priceMin as number,
          maxPrice: e.priceMax as number,
          updatedAt: e.updatedAt as string,
        };
      });
      setPrices(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    setIsLoadingVendors(true);
    try {
      const res = await fetch('/api/vendors?approved=true');
      const data = await res.json();
      const mapped = (data.vendors || []).map((v: Record<string, unknown>) => {
        const zone = v.zone as Record<string, string> | undefined;
        const cats = typeof v.categories === 'string' ? JSON.parse(v.categories as string) : (v.categories as string[]) || [];
        return {
          id: v.id as string,
          name: v.name as string,
          zoneId: v.zoneId as string,
          zoneNameKey: zone ? `zone_${(zone.name || '').toLowerCase()}` : '',
          categories: cats,
          stallNumber: (v.stallNumber as string) || '',
          recommendations: (v.recommendations as number) || 0,
          openHours: (v.openHours as string) || '8:00-18:00',
          isApproved: (v.approved as boolean) || false,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
        };
      });
      setVendors(mapped);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  const fetchActiveSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.session) {
        setActiveSessionData(data.session);
        setSessionMessages(data.session.messages || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Initial data loading ──

  useEffect(() => {
    fetchZones();
    fetchGuides();
    fetchPrices();
    fetchVendors();
  }, [fetchZones, fetchGuides, fetchPrices, fetchVendors]);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchSessions();
    }
  }, [user, fetchRequests, fetchSessions]);

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

  // ── Live matching timer ──

  useEffect(() => {
    if (!isWaitingForGuides) return;
    const interval = setInterval(() => {
      setMatchTimer((prev) => {
        const next = prev + 1;
        // Simulate guide matching at 3s, 8s, 15s
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

  // ── Session chat polling ──

  useEffect(() => {
    if (!activeSessionId || view !== 'session') return;
    const interval = setInterval(() => {
      fetchActiveSession(activeSessionId);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSessionId, view, fetchActiveSession]);

  // ── Actions ──

  const handleCreateRequest = async () => {
    if (!user || !requestDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seekerId: user.id,
          description: requestDescription.trim(),
          zoneIds: selectedZoneIds,
          budget: parseFloat(requestBudget) || 0,
          photoUrl: requestPhoto ? 'photo_mock.jpg' : null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast.success(lang === 'sw' ? 'Ombi limewasilishwa!' : 'Request submitted!');
      setRequestDescription('');
      setSelectedZoneIds([]);
      setRequestBudget('');
      setRequestPhoto(false);
      setMatchingRequestId(data.request?.id || null);
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
  };

  const handleAcceptGuide = async (guideId: string) => {
    if (!user || !matchingRequestId) return;
    try {
      const req = requests.find((r) => r.id === matchingRequestId);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: matchingRequestId,
          guideId,
          seekerId: user.id,
          amount: req?.budget || 0,
          platformFee: Math.round((req?.budget || 0) * 0.1),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast.success(lang === 'sw' ? 'Mwongozo amekubaliwa! Kikao kimeanza' : 'Guide accepted! Session started');
      setIsWaitingForGuides(false);
      setActiveSessionId(data.session?.id || null);
      setActiveSessionData(data.session || null);
      setSessionMessages([]);
      setActiveSession(data.session);
      setView('session');
      fetchRequests();
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukubali mwongozo' : 'Failed to accept guide');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId || !user) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          senderId: user.id,
          content,
        }),
      });
      fetchActiveSession(activeSessionId);
    } catch {
      /* ignore */
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSessionId) return;
    try {
      await fetch(`/api/sessions/${activeSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      toast.success(lang === 'sw' ? 'Kikao kimemalizika!' : 'Session completed!');
      setRatingSessionId(activeSessionId);
      setRatingOpen(true);
      fetchActiveSession(activeSessionId);
      fetchRequests();
      fetchSessions();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kukamilisha kikao' : 'Failed to complete session');
    }
  };

  const handleEmergency = async () => {
    if (!activeSessionId) return;
    try {
      await fetch(`/api/sessions/${activeSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emergency' }),
      });
      toast.error(lang === 'sw' ? 'Tahadhari imetumwa! Msaada unakuja.' : 'Emergency alert sent! Help is on the way.');
    } catch {
      /* ignore */
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingSessionId) return;
    try {
      await fetch(`/api/sessions/${ratingSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          ratingSeeker: ratingValue,
          reviewSeeker: reviewText.trim(),
        }),
      });
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
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      toast.success(lang === 'sw' ? 'Ombi limeghairiwa' : 'Request cancelled');
      fetchRequests();
    } catch {
      toast.error(lang === 'sw' ? 'Imeshindwa kughairi ombi' : 'Failed to cancel request');
    }
  };

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
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 mb-4 text-muted-foreground hover:text-foreground"
      onClick={() => navigateTo(targetView)}
    >
      <ArrowLeft className="size-4" />
      {t('back', lang)}
    </Button>
  );

  // ── Sub-views ──

  // ─── HOME VIEW ───
  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('welcome', lang)}, {user?.name?.split(' ')[0] || ''}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('tagline', lang)}</p>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <Card
          className="border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveSessionId(activeSession.id);
            fetchActiveSession(activeSession.id);
            setActiveSession(activeSession);
            setView('session');
          }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
              <Clock className="size-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{t('active_session', lang)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {activeSession.guide?.name || 'Guide'} &middot; {activeSession.sessionCode}
              </p>
            </div>
            <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 text-xs">
              {t('active', lang)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Open request banner */}
      {openRequest && !activeSession && (
        <Card
          className="border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigateTo('matching')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0">
              <Radio className="size-5 text-emerald-700 dark:text-emerald-300 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{lang === 'sw' ? 'Ombi lako lipo wazi' : 'Your request is open'}</p>
              <p className="text-xs text-muted-foreground truncate">{openRequest.description}</p>
            </div>
            <Badge className="bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200 text-xs">
              {t('open', lang)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigateTo('post-request')}
        >
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('post_request', lang)}</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigateTo('price-radar')}
        >
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radar className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('nav_price_radar', lang)}</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigateTo('vendors')}
        >
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('nav_vendors', lang)}</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigateTo('my-requests')}
        >
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="size-11 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-foreground">{t('my_requests', lang)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Map overview */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{lang === 'sw' ? 'Ramani ya Kariakoo' : 'Kariakoo Map'}</h2>
        <MapView
          zones={zones.map((z) => ({
            id: z.id,
            name: z.name,
            nameKey: z.nameKey,
            color: '',
            bgColor: '',
            x: 5 + Math.random() * 70,
            y: 5 + Math.random() * 60,
            w: 25 + Math.random() * 10,
            h: 25 + Math.random() * 15,
          }))}
          vendors={vendors.slice(0, 7).map((v) => ({ id: v.id, name: v.name, zoneId: v.zoneId, x: v.x || 50, y: v.y || 50 }))}
          guides={guides.filter((g) => g.currentStatus === 'online').slice(0, 3).map((g) => ({ id: g.id, name: g.name, x: 15 + Math.random() * 70, y: 15 + Math.random() * 60 }))}
        />
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">{lang === 'sw' ? 'Shughuli za hivi karibu' : 'Recent Activity'}</h2>
        <div className="space-y-2">
          {isLoadingRequests ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('no_requests', lang)}</p>
            </div>
          ) : (
            requests.slice(0, 3).map((req) => (
              <Card
                key={req.id}
                className="cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => {
                  setExpandedRequest(req.id);
                  navigateTo('my-requests');
                }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{req.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(req.createdAt, lang)}</p>
                  </div>
                  <Badge className={cn('text-[10px] h-6', statusColorMap[req.status] || '')}>
                    {t(req.status as keyof typeof statusColorMap, lang)}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Guide of the Week */}
      {guideOfWeek && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">{t('guide_of_week', lang)}</h2>
          <Card className="overflow-hidden border-amber-300 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'size-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400',
                  ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'][guideOfWeek.id.charCodeAt(0) % 5]
                )}>
                  {guideOfWeek.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 justify-start gap-2"
          onClick={() => navigateTo('history')}
        >
          <Clock className="size-4" />
          {t('session_history', lang)}
        </Button>
        <Button
          variant="outline"
          className="h-12 justify-start gap-2"
          onClick={() => navigateTo('matching')}
          disabled={!openRequest}
        >
          <Users className="size-4" />
          {lang === 'sw' ? 'Waongozaji' : 'Guides'}
        </Button>
      </div>
    </div>
  );

  // ─── POST REQUEST VIEW ───
  const renderPostRequest = () => (
    <div className="space-y-6">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('post_request', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('request_description', lang)}</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('description', lang)}</label>
            <Textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder={t('request_description', lang)}
              className="mt-1.5 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{requestDescription.length}/500</p>
          </div>

          {/* Zone selector */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('request_zone', lang)}</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {isLoadingZones ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                zones.map((zone) => {
                  const isSelected = selectedZoneIds.includes(zone.id);
                  const zc = zoneColorMap[zone.nameKey];
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
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        isSelected
                          ? `${zc?.bg || 'bg-primary/10'} ${zc?.text || 'text-primary'} border-current`
                          : 'border-border text-muted-foreground hover:border-foreground/30'
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
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                value={requestBudget}
                onChange={(e) => setRequestBudget(e.target.value)}
                placeholder="0"
                className="pl-9"
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
              <Button
                type="button"
                variant={requestPhoto ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setRequestPhoto(!requestPhoto)}
              >
                <Camera className="size-4" />
                {requestPhoto
                  ? lang === 'sw' ? 'Picha imeongezwa ✓' : 'Photo added ✓'
                  : t('request_photo', lang)}
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 text-base"
            onClick={handleCreateRequest}
            disabled={!requestDescription.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t('loading', lang)}
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                {t('submit', lang)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ─── MY REQUESTS VIEW ───
  const renderMyRequests = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">{t('my_requests', lang)}</h1>
        <Button size="sm" className="gap-1.5" onClick={() => navigateTo('post-request')}>
          <Plus className="size-3.5" />
          {t('post_request', lang)}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'open', 'matched', 'active', 'completed', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={requestFilter === status ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={() => setRequestFilter(status)}
          >
            {status === 'all' ? (lang === 'sw' ? 'Zote' : 'All') : t(status as 'open', lang)}
          </Button>
        ))}
      </div>

      {/* Request list */}
      {isLoadingRequests ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
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
              <Card key={req.id} className="overflow-hidden">
                <CardContent
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
                </CardContent>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/30 space-y-2">
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
                      <div className="pt-2 border-t mt-2">
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
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
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
                            <Users className="size-3 mr-1" />
                            {lang === 'sw' ? 'Tazama waongozaji' : 'View guides'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(req.id);
                            }}
                          >
                            {t('cancel', lang)}
                          </Button>
                        </>
                      )}
                      {req.status === 'matched' && (
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const session = sessions.find((s) => s.requestId === req.id);
                            if (session) {
                              setActiveSessionId(session.id);
                              fetchActiveSession(session.id);
                              setActiveSession(session);
                              setView('session');
                            }
                          }}
                        >
                          {t('active_session', lang)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
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
          <h1 className="text-xl font-bold text-foreground">{lang === 'sw' ? 'Kupeleleza waongozaji' : 'Finding Guides'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw' ? 'Wafanyakazi wanaangalia ombi lako...' : 'Guides are reviewing your request...'}
          </p>
        </div>

        {/* The open request */}
        {matchingRequest && (
          <Card className="border-emerald-300 dark:border-emerald-600">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
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
            </CardContent>
          </Card>
        )}

        {/* Waiting animation */}
        {isWaitingForGuides && matchedGuides.length === 0 && (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="size-8 text-primary animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
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
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
            <Bell className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {lang === 'sw' ? 'Maeneo yamepanuliwa baada ya dakika 5 kutafuta waongozaji zaidi' : 'Zones expanded after 5 min to find more guides'}
            </p>
          </div>
        )}

        {/* Matched guides */}
        {matchedGuides.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
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
            <Button size="sm" className="mt-3" onClick={() => navigateTo('post-request')}>
              {t('post_request', lang)}
            </Button>
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
        <h1 className="text-xl font-bold text-foreground">{t('active_session', lang)}</h1>
      </div>

      {!activeSessionData ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="size-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('no_sessions', lang)}</p>
        </div>
      ) : (
        <>
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
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
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
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">
                  {t('online', lang)}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Request info */}
          {activeSessionData.request && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{t('description', lang)}</p>
                <p className="text-sm text-foreground">{activeSessionData.request.description}</p>
                {activeSessionData.request.budget > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('budget', lang)}: {formatTZS(activeSessionData.request.budget, lang)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Toggle: Chat / Map */}
          <div className="flex gap-2">
            <Button
              variant={showChat ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-10 gap-1.5"
              onClick={() => { setShowChat(true); setShowMap(false); }}
            >
              <MessageSquare className="size-4" />
              {lang === 'sw' ? 'Mazungumzo' : 'Chat'}
            </Button>
            <Button
              variant={showMap ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-10 gap-1.5"
              onClick={() => { setShowMap(true); setShowChat(false); }}
            >
              <MapPin className="size-4" />
              {lang === 'sw' ? 'Ramani' : 'Map'}
            </Button>
          </div>

          {/* Chat */}
          {showChat && (
            <Card className="overflow-hidden">
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
            </Card>
          )}

          {/* Map */}
          {showMap && (
            <MapView
              zones={zones.map((z) => ({
                id: z.id,
                name: z.name,
                nameKey: z.nameKey,
                color: '',
                bgColor: '',
                x: 5 + Math.random() * 70,
                y: 5 + Math.random() * 60,
                w: 25 + Math.random() * 10,
                h: 25 + Math.random() * 15,
              }))}
              guides={activeSessionData.guide ? [{
                id: activeSessionData.guide.id,
                name: activeSessionData.guide.name,
                x: 20 + Math.random() * 60,
                y: 20 + Math.random() * 60,
              }] : []}
              className="w-full"
            />
          )}

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
                await fetch(`/api/sessions/${activeSessionData.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'release' }),
                });
                toast.success(lang === 'sw' ? 'Malipo yametolewa!' : 'Payment released!');
                fetchActiveSession(activeSessionData.id);
              } catch {
                toast.error(lang === 'sw' ? 'Imeshindwa kutoa malipo' : 'Failed to release payment');
              }
            }}
            onDisputeEscrow={async (reason) => {
              try {
                await fetch(`/api/sessions/${activeSessionData.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'dispute', disputeReason: reason }),
                });
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
              console.log('Emergency triggered:', data);
            }}
          />
        </>
      )}
    </div>
  );

  // ─── SESSION HISTORY VIEW ───
  const renderSessionHistory = () => (
    <div className="space-y-4">
      {renderBackButton()}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('session_history', lang)}</h1>
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">{lang === 'sw' ? 'Kutoka' : 'From'}</label>
            <Input
              type="date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              className="h-9 text-xs mt-1"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">{lang === 'sw' ? 'Hadi' : 'To'}</label>
            <Input
              type="date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              className="h-9 text-xs mt-1"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              setHistoryDateFrom('');
              setHistoryDateTo('');
            }}
          >
            {t('clear_filters', lang)}
          </Button>
        </CardContent>
      </Card>

      {/* Session list */}
      {isLoadingSessions ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
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
              <Card key={session.id} className="overflow-hidden">
                <CardContent
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
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-muted-foreground">{session.ratingSeeker}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Expanded receipt */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/30 space-y-2">
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
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">{t('review', lang)}</p>
                        <p className="text-xs text-foreground italic">&quot;{session.reviewSeeker}&quot;</p>
                      </div>
                    )}
                    {session.request && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">{t('description', lang)}</p>
                        <p className="text-xs text-foreground">{session.request.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
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
      <PriceRadarPanel
        prices={prices}
        zones={zones.map((z) => ({ id: z.id, nameKey: z.nameKey }))}
        language={lang}
        isLoading={isLoadingPrices}
        onSuggestUpdate={(priceId, suggestion) => {
          toast.success(lang === 'sw' ? 'Mapendekezo yamewasilishwa!' : 'Suggestion submitted!');
        }}
      />
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
        onRegisterVendor={(data) => {
          toast.success(lang === 'sw' ? 'Muuzaji amesajiliwa!' : 'Vendor registered!');
        }}
      />
    </div>
  );

  // ── Main Layout ──

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => navigateTo('home')}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <h1 className="text-base font-bold text-foreground">
              {view === 'home' && (lang === 'sw' ? 'Kariako Guide' : 'Kariako Guide')}
              {view === 'post-request' && t('post_request', lang)}
              {view === 'my-requests' && t('my_requests', lang)}
              {view === 'matching' && (lang === 'sw' ? 'Waongozaji' : 'Guides')}
              {view === 'session' && t('active_session', lang)}
              {view === 'history' && t('session_history', lang)}
              {view === 'price-radar' && t('price_radar_title', lang)}
              {view === 'vendors' && t('vendor_directory', lang)}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {activeSession && (
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => {
                  setActiveSessionId(activeSession.id);
                  fetchActiveSession(activeSession.id);
                  setActiveSession(activeSession);
                  setView('session');
                }}
              >
                <Clock className="size-3" />
                {t('active_session', lang)}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setError(null);
                fetchZones();
                fetchRequests();
                fetchSessions();
              }}
            >
              <RefreshCw className="size-3 mr-1" />
              {t('retry', lang)}
            </Button>
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
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50">
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
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rate_experience', lang)}</DialogTitle>
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
                className="mt-1.5"
                maxLength={300}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingOpen(false)}>
              {t('cancel', lang)}
            </Button>
            <Button onClick={handleSubmitRating}>
              {t('submit_review', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
