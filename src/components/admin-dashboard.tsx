'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { t, Language } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api, adminApi, zonesApi, priceRadarApi, fraudAlertsApi, seasonalEventsApi } from '@/lib/api';
import {
  BarChart3,
  Users,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Menu,
  LayoutDashboard,
  ClipboardCheck,
  Map,
  TrendingUp,
  UserCog,
  Scale,
  MessageSquare,
  Clock,
  Activity,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw,
  Phone,
  Ban,
  Mail,
  Send,
  Gavel,
  RotateCcw,
  Info,
  ColorPicker,
  Save,
  Store,
  Package,
  ArrowLeftRight,
  Sparkles,
  Church,
  Sun,
  ShoppingBag,
  Lightbulb,
  Bell,
  Truck,
  Tag,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

// ── Types ──

type AdminView = 'overview' | 'verification' | 'zones' | 'price-radar' | 'analytics' | 'users' | 'disputes' | 'fraud' | 'vendors' | 'calendar' | 'packages';

interface AdminStats {
  users: { seekers: number; guides: number; admins: number; total: number };
  sessions: { active: number; total: number };
  requests: { open: number; matched: number; completed: number; cancelled: number };
  revenue: { total: number };
  rating: { average: number };
  guides: { pendingVerification: number };
  zones: number;
  vendors: number;
}

interface PendingGuide {
  id: string;
  userId: string;
  bio: string;
  idDocumentUrl: string | null;
  status: string;
  zones: string;
  languages: string;
  createdAt: string;
  user: { id: string; name: string; phone: string; avatarUrl: string | null };
  badges: { id: string; badgeType: string }[];
}

interface ZoneItem {
  id: string;
  name: string;
  nameSw: string;
  description: string;
  geoBounds: string;
  color: string;
  createdAt: string;
  _count: { vendors: number; priceRadar: number; requests: number };
}

interface PriceRadarEntry {
  id: string;
  category: string;
  zoneId: string;
  priceMin: number;
  priceMax: number;
  updatedAt: string;
  updatedBy: string;
  zone: { id: string; name: string; nameSw: string; color: string };
}

interface UserItem {
  id: string;
  phone: string;
  name: string;
  role: string;
  languagePref: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  guideProfile?: {
    id: string;
    status: string;
    avgRating: number;
    totalSessions: number;
    currentStatus: string;
  } | null;
  badges?: { id: string; badgeType: string }[];
}

interface DisputeItem {
  id: string;
  sessionCode: string;
  guideId: string;
  seekerId: string;
  escrowStatus: string;
  amount: number;
  disputeReason: string | null;
  disputeFlag: boolean;
  emergencyFlag: boolean;
  createdAt: string;
  updatedAt: string;
  guide: { id: string; name: string; phone: string };
  seeker: { id: string; name: string; phone: string };
  request: { id: string; description: string };
  messages: { id: string; content: string; senderId: string; sender: { id: string; name: string }; createdAt: string }[];
}

interface FraudAlertItem {
  id: string;
  entityType: string;
  entityId: string;
  alertType: string;
  confidence: number;
  details: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VendorWithVerification {
  id: string;
  name: string;
  zoneId: string;
  categories: string;
  stallNumber: string;
  contact: string;
  approved: boolean;
  recommendations: number;
  openHours: string;
  createdAt: string;
  updatedAt: string;
  zone: { id: string; name: string; nameSw: string; color: string };
  verification?: {
    id: string;
    isVerified: boolean;
    verifiedAt: string | null;
    monthlyFee: number;
    qrCode: string;
  } | null;
}

interface SeasonalEventItem {
  id: string;
  title: string;
  titleSw: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string | null;
  affectedZones: string;
  insiderTip: string;
  insiderTipSw: string;
  createdAt: string;
  updatedAt: string;
}

interface PackageDealItem {
  id: string;
  guideId: string;
  title: string;
  description: string;
  duration: number;
  zoneIds: string;
  price: number;
  includesDelivery: boolean;
  sessionsCompleted: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Zone color mapping ──
const zoneColors: Record<string, string> = {
  vyombo: '#F97316',
  electronics: '#0EA5E9',
  fabric: '#EC4899',
  spices: '#EF4444',
  wholesale: '#14B8A6',
};

const chartColors = ['#F97316', '#0EA5E9', '#EC4899', '#EF4444', '#14B8A6', '#8B5CF6', '#F59E0B'];

// ── Helpers ──
function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' TZS';
}

function formatDate(dateStr: string, lang: Language): string {
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string, lang: Language): string {
  try {
    return new Date(dateStr).toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-pink-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Navigation items ──
const navItems: { key: AdminView; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { key: 'overview', icon: LayoutDashboard, labelKey: 'admin_dashboard' },
  { key: 'verification', icon: ClipboardCheck, labelKey: 'verification_queue' },
  { key: 'vendors', icon: Store, labelKey: 'vendor_directory' },
  { key: 'fraud', icon: ShieldAlert, labelKey: 'fraud_title' },
  { key: 'zones', icon: MapPin, labelKey: 'zone_management' },
  { key: 'price-radar', icon: BarChart3, labelKey: 'price_radar_mgmt' },
  { key: 'calendar', icon: Calendar, labelKey: 'calendar_title' },
  { key: 'packages', icon: Package, labelKey: 'package_title' },
  { key: 'analytics', icon: TrendingUp, labelKey: 'analytics' },
  { key: 'users', icon: UserCog, labelKey: 'user_management' },
  { key: 'disputes', icon: Scale, labelKey: 'dispute_resolution' },
];

// ── Admin Sidebar (declared outside render to avoid lint error) ──
function AdminSidebar({ lang, view, onNavigate, pendingCount }: { lang: Language; view: AdminView; onNavigate: (v: AdminView) => void; pendingCount: number }) {
  return (
    <div className="flex flex-col h-full ksidebar">
      <div className="p-4 border-b border-white/20">
        <h2 className="font-bold text-lg flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-[var(--chimbo-yellow)]" />
          </div>
          <span className="text-white">{t('admin_dashboard', lang)}</span>
        </h2>
        <p className="text-xs text-white/60 mt-1">Chimbo Direct Admin</p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full ${view === item.key ? 'ksidebar-item-active' : 'ksidebar-item'}`}
          >
            <item.icon className={`h-4 w-4 ${view === item.key ? 'text-white' : 'text-white/60'}`} />
            <span className="flex-1 text-left">{t(item.labelKey, lang)}</span>
            {item.key === 'overview' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/20">
        <div className="text-xs text-white/50">
          <p>v1.0.0 &bull; Chimbo Direct</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export function AdminDashboard() {
  const { language } = useAuthStore();
  const lang = language as Language;

  const [view, setView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingGuides, setPendingGuides] = useState<PendingGuide[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [priceEntries, setPriceEntries] = useState<PriceRadarEntry[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertItem[]>([]);
  const [vendorsWithVer, setVendorsWithVer] = useState<VendorWithVerification[]>([]);
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEventItem[]>([]);
  const [packageDeals, setPackageDeals] = useState<PackageDealItem[]>([]);
  const [sessions, setSessions] = useState<{ id: string; createdAt: string; amount: number; status: string; guideRating: number | null; seekerRating: number | null; startedAt: string | null }[]>([]);

  // Fetch all data
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<{ stats: AdminStats }>('/admin/stats');
      setStats(data.stats);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata takwimu' : 'Failed to load stats');
    }
  }, [lang]);

  const fetchPendingGuides = useCallback(async () => {
    try {
      const data = await api.get<{ guides: PendingGuide[] }>('/guides?status=pending');
      setPendingGuides(data.guides || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata waongozaji' : 'Failed to load pending guides');
    }
  }, [lang]);

  const fetchZones = useCallback(async () => {
    try {
      const data = await api.get<{ zones: ZoneItem[] }>('/zones');
      setZones(data.zones || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata maeneo' : 'Failed to load zones');
    }
  }, [lang]);

  const fetchPriceEntries = useCallback(async () => {
    try {
      const data = await api.get<{ entries: PriceRadarEntry[] }>('/price-radar');
      setPriceEntries(data.entries || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata rada ya bei' : 'Failed to load price entries');
    }
  }, [lang]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.get<{ users: UserItem[] }>('/users');
      setUsers(data.users || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata watumiaji' : 'Failed to load users');
    }
  }, [lang]);

  const fetchDisputes = useCallback(async () => {
    try {
      const data = await api.get<{ disputes: DisputeItem[] }>('/admin/disputes');
      setDisputes(data.disputes || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata migogoro' : 'Failed to load disputes');
    }
  }, [lang]);

  const fetchFraudAlerts = useCallback(async () => {
    try {
      const data = await api.get<{ items: FraudAlertItem[] }>('/fraud-alerts');
      setFraudAlerts(data.items || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata tahadhari' : 'Failed to load fraud alerts');
    }
  }, [lang]);

  const fetchVendorsWithVerification = useCallback(async () => {
    try {
      const [verData, venData] = await Promise.all([
        api.get<{ items: { id: string; vendorId: string; isVerified: boolean; verifiedAt: string | null; monthlyFee: number; qrCode: string }[] }>('/vendor-verifications'),
        api.get<{ vendors: VendorWithVerification[] }>('/vendors'),
      ]);
      const verifications = verData.items || [];
      const vendors = venData.vendors || [];
      const merged = vendors.map((v: VendorWithVerification) => {
        const ver = verifications.find((vv) => vv.vendorId === v.id);
        return { ...v, verification: ver || null };
      });
      setVendorsWithVer(merged);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata wauzaji' : 'Failed to load vendors');
    }
  }, [lang]);

  const fetchSeasonalEvents = useCallback(async () => {
    try {
      const data = await api.get<{ items: SeasonalEventItem[] }>('/seasonal-events');
      setSeasonalEvents(data.items || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata matukio' : 'Failed to load seasonal events');
    }
  }, [lang]);

  const fetchPackageDeals = useCallback(async () => {
    try {
      const data = await api.get<{ items: PackageDealItem[] }>('/package-deals');
      setPackageDeals(data.items || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata vifurushi' : 'Failed to load package deals');
    }
  }, [lang]);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: { id: string; createdAt: string; amount: number; status: string; guideRating: number | null; seekerRating: number | null; startedAt: string | null }[] }>('/sessions');
      setSessions(data.sessions || []);
    } catch {
      // Sessions are optional for analytics, don't show error toast
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchPendingGuides(),
        fetchZones(),
        fetchPriceEntries(),
        fetchUsers(),
        fetchDisputes(),
        fetchFraudAlerts(),
        fetchVendorsWithVerification(),
        fetchSeasonalEvents(),
        fetchPackageDeals(),
        fetchSessions(),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchStats, fetchPendingGuides, fetchZones, fetchPriceEntries, fetchUsers, fetchDisputes, fetchFraudAlerts, fetchVendorsWithVerification, fetchSeasonalEvents, fetchPackageDeals, fetchSessions]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col ksidebar">
        <AdminSidebar lang={lang} view={view} onNavigate={(v) => { setView(v); setSidebarOpen(false); }} pendingCount={pendingGuides.length + disputes.length} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 ksidebar border-r-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AdminSidebar lang={lang} view={view} onNavigate={(v) => { setView(v); setSidebarOpen(false); }} pendingCount={pendingGuides.length + disputes.length} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="knav sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--chimbo-green-light)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-base gradient-text-green">
                {t(navItems.find(n => n.key === view)?.labelKey || 'admin_dashboard', lang)}
              </h1>
            </div>
            <button
              onClick={() => { fetchStats(); fetchPendingGuides(); fetchDisputes(); }}
              className="kbtn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('refresh', lang)}</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {loading ? <LoadingSkeleton /> : (
            <>
              {view === 'overview' && <OverviewView lang={lang} stats={stats} zones={zones} disputes={disputes} pendingGuides={pendingGuides} users={users} onNavigate={setView} fraudAlerts={fraudAlerts} />}
              {view === 'verification' && <VerificationView lang={lang} guides={pendingGuides} onRefresh={fetchPendingGuides} />}
              {view === 'vendors' && <VendorsView lang={lang} vendors={vendorsWithVer} zones={zones} onRefresh={fetchVendorsWithVerification} />}
              {view === 'fraud' && <FraudView lang={lang} alerts={fraudAlerts} onRefresh={fetchFraudAlerts} />}
              {view === 'zones' && <ZonesView lang={lang} zones={zones} onRefresh={fetchZones} />}
              {view === 'price-radar' && <PriceRadarView lang={lang} entries={priceEntries} zones={zones} onRefresh={fetchPriceEntries} />}
              {view === 'calendar' && <CalendarView lang={lang} events={seasonalEvents} zones={zones} onRefresh={fetchSeasonalEvents} />}
              {view === 'packages' && <PackagesView lang={lang} deals={packageDeals} onRefresh={fetchPackageDeals} />}
              {view === 'analytics' && <AnalyticsView lang={lang} stats={stats} zones={zones} users={users} sessions={sessions} />}
              {view === 'users' && <UsersView lang={lang} users={users} onRefresh={fetchUsers} />}
              {view === 'disputes' && <DisputesView lang={lang} disputes={disputes} onRefresh={fetchDisputes} />}
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden knav border-t-0">
          <div className="flex overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-2 text-[10px] transition-all ${
                  view === item.key ? 'gradient-text-green font-semibold' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="truncate max-w-[56px]">{t(item.labelKey, lang).split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}

// ── Loading Skeleton ──
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kcard p-4"><div className="h-20 w-full shimmer rounded-lg" /></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="kcard p-4"><div className="h-48 w-full shimmer rounded-lg" /></div>
        ))}
      </div>
      <div className="kcard p-4"><div className="h-32 w-full shimmer rounded-lg" /></div>
    </div>
  );
}

// ── 1. Overview Dashboard ──
function OverviewView({ lang, stats, zones, disputes, pendingGuides, users, onNavigate, fraudAlerts }: {
  lang: Language; stats: AdminStats | null; zones: ZoneItem[];
  disputes: DisputeItem[]; pendingGuides: PendingGuide[]; users: UserItem[];
  onNavigate: (v: AdminView) => void; fraudAlerts: FraudAlertItem[];
}) {
  if (!stats) return null;

  const onlineGuides = users.filter(u => u.role === 'guide' && u.guideProfile?.currentStatus === 'online').length;
  const fraudFlags = disputes.filter(d => d.emergencyFlag).length;

  const metrics = [
    { label: t('total_users', lang), value: stats.users.total, icon: Users, sub: `${stats.users.seekers} S / ${stats.users.guides} G / ${stats.users.admins} A`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', change: '+4.2%', changeColor: 'text-[var(--chimbo-green)]' },
    { label: t('active_sessions_a', lang), value: stats.sessions.active, icon: Activity, sub: `${onlineGuides} ${t('online', lang)}`, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', change: '', changeColor: '' },
    { label: t('total_revenue', lang) + ' (Escrow)', value: formatTZS(stats.revenue.total), icon: DollarSign, sub: `${stats.sessions.total} ${t('total', lang)}`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', change: '+12.5%', changeColor: 'text-[var(--chimbo-yellow)]' },
    { label: t('avg_rating', lang), value: stats.rating.average.toFixed(1), icon: Star, sub: '/ 5.0', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', change: '', changeColor: '' },
    { label: t('fraud_flags', lang), value: fraudAlerts.filter(a => a.status === 'pending').length, icon: AlertTriangle, sub: fraudAlerts.length + ' ' + (lang === 'sw' ? 'tahadhari jumla' : 'total alerts'), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', change: '', changeColor: '' },
    { label: t('requests', lang) || 'Requests', value: stats.requests.open + stats.requests.matched, icon: FileText, sub: `${stats.requests.open} open / ${stats.requests.matched} matched`, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', change: '', changeColor: '' },
  ];

  // Chart data - requests per zone
  const requestsPerZone = zones.map(z => ({
    name: z.name,
    requests: z._count.requests,
    fill: z.color,
  }));

  // Rating distribution computed from real guide data
  const guideRatings = users.filter(u => u.role === 'guide' && u.guideProfile && u.guideProfile.avgRating > 0);
  const ratingBuckets = [0, 0, 0, 0, 0];
  guideRatings.forEach(u => {
    if (u.guideProfile) {
      const bucket = Math.min(Math.floor(u.guideProfile.avgRating) - 1, 4);
      if (bucket >= 0) ratingBuckets[bucket]++;
    }
  });
  const ratingDistribution = [
    { rating: '5 ★', count: ratingBuckets[4], fill: '#065F46' },
    { rating: '4 ★', count: ratingBuckets[3], fill: '#34D399' },
    { rating: '3 ★', count: ratingBuckets[2], fill: '#FBBF24' },
    { rating: '2 ★', count: ratingBuckets[1], fill: '#F97316' },
    { rating: '1 ★', count: ratingBuckets[0], fill: '#EF4444' },
  ];

  // Recent activity from real data
  const recentActivity = [
    ...pendingGuides.slice(0, 3).map(g => ({
      type: 'registration' as const,
      text: `${g.user.name} - ${t('trust_pending', lang)}`,
      time: formatDate(g.createdAt, lang),
      icon: Users,
      color: 'text-amber-500',
    })),
    ...disputes.slice(0, 2).map(d => ({
      type: 'dispute' as const,
      text: `${d.guide.name} vs ${d.seeker.name}`,
      time: formatDate(d.updatedAt, lang),
      icon: AlertTriangle,
      color: 'text-rose-500',
    })),
    {
      type: 'session' as const,
      text: `${stats.sessions.active} ${t('active_sessions_a', lang).toLowerCase()}`,
      time: t('today', lang),
      icon: Activity,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="kcard p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${m.bg}`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              {m.change && (
                <span className={`text-xs font-bold ${m.changeColor}`}>{m.change}</span>
              )}
            </div>
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requests per Zone */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Maombi kwa Eneo' : 'Requests per Zone'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsPerZone}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                    {requestsPerZone.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Usambazaji wa Ukadiriaji' : 'Rating Distribution'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={ratingDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" paddingAngle={2}>
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {ratingDistribution.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: r.fill }} />
                    <span>{r.rating}: {r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="kcard md:col-span-2">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Shughuli za Hivi Karibu' : 'Recent Activity'}</h3>
          </div>
          <div className="p-4 pt-0">
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 ${act.color}`}><act.icon className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <p className="font-medium">{act.text}</p>
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                    </div>
                    <span className="kbadge kbadge-silver">{act.type}</span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_results', lang)}</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Vitendo vya Haraka' : 'Quick Actions'}</h3>
          </div>
          <div className="p-4 pt-0 space-y-3">
            <button
              onClick={() => onNavigate('verification')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--chimbo-green-light)] transition-all border border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[var(--chimbo-green)]" />
                <span className="text-sm">{t('verification_queue', lang)}</span>
              </div>
              <span className={`kbadge ${pendingGuides.length > 0 ? 'kbadge-pending' : 'kbadge-silver'}`}>
                {pendingGuides.length}
              </span>
            </button>
            <button
              onClick={() => onNavigate('disputes')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--chimbo-green-light)] transition-all border border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-sm">{t('dispute_resolution', lang)}</span>
              </div>
              <span className={`kbadge ${disputes.length > 0 ? 'kbadge-urgent' : 'kbadge-silver'}`}>
                {disputes.length}
              </span>
            </button>
            <button
              onClick={() => onNavigate('zones')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--chimbo-green-light)] transition-all border border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--chimbo-green)]" />
                <span className="text-sm">{t('zone_management', lang)}</span>
              </div>
              <span className="kbadge kbadge-silver">{zones.length}</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--chimbo-green-light)] transition-all border border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                <span className="text-sm">{t('user_management', lang)}</span>
              </div>
              <span className="kbadge kbadge-silver">{stats.users.total}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Map Preview */}
      <div className="kcard">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Hali ya Soko' : 'Market Status'}</h3>
        </div>
        <div className="p-4 pt-0">
          <div className="grid grid-cols-5 gap-2">
            {zones.map(zone => (
              <div key={zone.id} className="text-center p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]" style={{ borderColor: zone.color + '40' }}>
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: zone.color + '20' }}>
                  <MapPin className="h-4 w-4" style={{ color: zone.color }} />
                </div>
                <p className="text-xs font-medium">{zone.name}</p>
                <p className="text-[10px] text-muted-foreground">{zone._count.vendors} V &bull; {zone._count.requests} R</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Guide Verification Queue ──
function VerificationView({ lang, guides, onRefresh }: {
  lang: Language; guides: PendingGuide[]; onRefresh: () => void;
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectGuideId, setRejectGuideId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const filteredGuides = dateFilter
    ? guides.filter(g => new Date(g.createdAt).toISOString().slice(0, 10) >= dateFilter)
    : guides;

  const approveGuide = async (guideId: string) => {
    setProcessing(guideId);
    try {
      await adminApi.verify({ type: 'guide', id: guideId, approved: true });
      toast.success(lang === 'sw' ? 'Mwongozo amekubaliwa' : 'Guide approved successfully');
      onRefresh();
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kukubali' : 'Failed to approve guide');
    } finally {
      setProcessing(null);
    }
  };

  const rejectGuide = async (guideId: string, reason: string) => {
    setProcessing(guideId);
    try {
      await adminApi.verify({ type: 'guide', id: guideId, approved: false });
      toast.success(lang === 'sw' ? 'Mwongozo amekataliwa' : 'Guide rejected');
      onRefresh();
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kukataa' : 'Failed to reject guide');
    } finally {
      setProcessing(null);
      setRejectDialogOpen(false);
    }
  };

  const approveAll = async () => {
    for (const g of filteredGuides) {
      await approveGuide(g.userId);
    }
  };

  const rejectAll = async () => {
    for (const g of filteredGuides) {
      await rejectGuide(g.userId, 'Bulk rejection');
    }
  };

  const getTierBadge = (guide: PendingGuide) => {
    const hasGold = guide.badges?.some(b => b.badgeType === 'gold' || b.badgeType === 'premium');
    const hasSilver = guide.badges?.some(b => b.badgeType === 'silver' || b.badgeType === 'verified');
    if (hasGold) return <span className="kbadge kbadge-gold">Gold</span>;
    if (hasSilver) return <span className="kbadge kbadge-silver">Silver</span>;
    return <span className="kbadge kbadge-pending">{lang === 'sw' ? 'Mwanzo' : 'Basic'}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-40 text-sm kinput"
            placeholder={t('date', lang)}
          />
          {dateFilter && (
            <button className="kbtn-outline px-3 py-1.5 text-sm" onClick={() => setDateFilter('')}>
              {t('clear_filters', lang)}
            </button>
          )}
        </div>
        {filteredGuides.length > 0 && (
          <div className="flex gap-2">
            <button onClick={approveAll} className="kbtn flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Kubali Wote' : 'Approve All'}
            </button>
            <button onClick={rejectAll} className="kbtn-danger flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <XCircle className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Kataa Wote' : 'Reject All'}
            </button>
          </div>
        )}
      </div>

      {/* Verification Table */}
      {filteredGuides.length === 0 ? (
        <div className="kcard p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-[var(--chimbo-green)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">
            {lang === 'sw' ? 'Waongozaji wote wamethibitishwa!' : 'All guides verified!'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw' ? 'Hakuna waongozaji wanaosubiri uthibitisho' : 'No pending guide verifications'}
          </p>
        </div>
      ) : (
        <div className="kcard overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <TableHead>{lang === 'sw' ? 'Maombi' : 'Applicant'}</TableHead>
                  <TableHead>{lang === 'sw' ? 'Hali ya NIDA' : 'NIDA ID Status'}</TableHead>
                  <TableHead>{lang === 'sw' ? 'Daraja' : 'Tier'}</TableHead>
                  <TableHead>{t('actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuides.map(guide => (
                  <TableRow key={guide.id} className="border-b border-[var(--border)]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(guide.user.id)}`}>
                          {getInitials(guide.user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{guide.user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {guide.user.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guide.idDocumentUrl ? (
                        <span className="kbadge kbadge-verified">{lang === 'sw' ? 'Imewasilishwa' : 'Submitted'}</span>
                      ) : (
                        <span className="kbadge kbadge-pending">{lang === 'sw' ? 'Haijawasilishwa' : 'Not Submitted'}</span>
                      )}
                    </TableCell>
                    <TableCell>{getTierBadge(guide)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          className="kbtn flex items-center gap-1.5 py-1.5 px-3 text-xs"
                          onClick={() => approveGuide(guide.userId)}
                          disabled={processing === guide.userId}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t('approve_guide', lang)}
                        </button>
                        <button
                          className="kbtn-danger flex items-center gap-1.5 py-1.5 px-3 text-xs"
                          onClick={() => { setRejectGuideId(guide.userId); setRejectDialogOpen(true); }}
                          disabled={processing === guide.userId}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t('reject_guide', lang)}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{t('reject_guide', lang)}</DialogTitle>
            <DialogDescription>
              {lang === 'sw' ? 'Toa sababu ya kukataa mwongozo huu' : 'Provide a reason for rejecting this guide'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder={lang === 'sw' ? 'Sababu ya kukataa...' : 'Rejection reason...'}
            rows={3}
            className="kinput"
          />
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setRejectDialogOpen(false)}>{t('cancel', lang)}</button>
            <button
              className="kbtn-danger px-4 py-2 text-sm"
              onClick={() => rejectGuide(rejectGuideId, rejectReason)}
              disabled={!rejectReason.trim()}
            >
              {t('reject_guide', lang)}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 3. Zone Management ──
function ZonesView({ lang, zones, onRefresh }: {
  lang: Language; zones: ZoneItem[]; onRefresh: () => void;
}) {
  const [editZone, setEditZone] = useState<ZoneItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteZoneId, setDeleteZoneId] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameSw, setFormNameSw] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#059669');
  const [saving, setSaving] = useState(false);

  const openEdit = (zone: ZoneItem) => {
    setEditZone(zone);
    setFormName(zone.name);
    setFormNameSw(zone.nameSw);
    setFormDesc(zone.description);
    setFormColor(zone.color);
    setEditDialogOpen(true);
  };

  const openCreate = () => {
    setFormName('');
    setFormNameSw('');
    setFormDesc('');
    setFormColor('#059669');
    setCreateDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editZone) return;
    setSaving(true);
    try {
      await zonesApi.update(editZone.id, { name: formName, nameSw: formNameSw, description: formDesc, color: formColor });
      toast.success(lang === 'sw' ? 'Eneo limehifadhiwa' : 'Zone saved');
      onRefresh();
      setEditDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kuhifadhi' : 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const createZone = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await zonesApi.create({ name: formName, nameSw: formNameSw, description: formDesc, color: formColor });
      toast.success(lang === 'sw' ? 'Eneo limeundwa' : 'Zone created');
      onRefresh();
      setCreateDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kuunda' : 'Failed to create zone');
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async () => {
    setSaving(true);
    try {
      await zonesApi.delete(deleteZoneId);
      toast.success(lang === 'sw' ? 'Eneo limefutwa' : 'Zone deleted');
      onRefresh();
      setDeleteDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kufuta' : 'Failed to delete zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="kbtn flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" />
          {lang === 'sw' ? 'Eneo Jipya' : 'New Zone'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <div key={zone.id} className="kcard p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }} />
                <h3 className="font-semibold gradient-text-green">{zone.name}</h3>
              </div>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--chimbo-green-light)] transition-colors border border-[var(--border)]" onClick={() => openEdit(zone)}>
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-[var(--border)]" onClick={() => { setDeleteZoneId(zone.id); setDeleteDialogOpen(true); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {zone.nameSw && <p className="text-xs text-muted-foreground mb-2">SW: {zone.nameSw}</p>}
            {zone.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{zone.description}</p>}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <p className="text-sm font-semibold">{zone._count.vendors}</p>
                <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Wauzaji' : 'Vendors'}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <p className="text-sm font-semibold">{zone._count.priceRadar}</p>
                <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Bei' : 'Prices'}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--muted)]">
                <p className="text-sm font-semibold">{zone._count.requests}</p>
                <p className="text-[10px] text-muted-foreground">{t('requests', lang) || 'Req.'}</p>
              </div>
            </div>

            {/* Mini zone boundary preview */}
            <div className="mt-3 h-16 rounded-lg bg-[var(--muted)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-2 rounded" style={{ backgroundColor: zone.color + '15', border: `2px dashed ${zone.color}40` }} />
              <MapPin className="h-4 w-4 relative z-10" style={{ color: zone.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{t('edit', lang)} {lang === 'sw' ? 'Eneo' : 'Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{lang === 'sw' ? 'Jina' : 'Name'}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Jina (Kiswahili)' : 'Swahili Name'}</Label>
              <Input value={formNameSw} onChange={e => setFormNameSw(e.target.value)} className="kinput" />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Rangi' : 'Color'}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                <Input value={formColor} onChange={e => setFormColor(e.target.value)} className="w-28 kinput" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setEditDialogOpen(false)}>{t('cancel', lang)}</button>
            <button className="kbtn px-4 py-2 text-sm" onClick={saveEdit} disabled={saving || !formName.trim()}>
              {saving ? t('loading', lang) : t('save', lang)}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{lang === 'sw' ? 'Unda Eneo Jipya' : 'Create New Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{lang === 'sw' ? 'Jina' : 'Name'} *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Hardware" className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Jina (Kiswahili)' : 'Swahili Name'}</Label>
              <Input value={formNameSw} onChange={e => setFormNameSw(e.target.value)} placeholder="mf. Vifaa" className="kinput" />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Rangi' : 'Color'}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                <Input value={formColor} onChange={e => setFormColor(e.target.value)} className="w-28 kinput" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setCreateDialogOpen(false)}>{t('cancel', lang)}</button>
            <button className="kbtn px-4 py-2 text-sm" onClick={createZone} disabled={saving || !formName.trim()}>
              {saving ? t('loading', lang) : lang === 'sw' ? 'Unda' : 'Create'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="kcard border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="gradient-text-green">{lang === 'sw' ? 'Futa Eneo?' : 'Delete Zone?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'sw' ? 'Kitendo hiki hakiwezi kubadilishwa. Wauzaji na bei zote zitafutwa.' : 'This cannot be undone. All vendors and prices in this zone will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="kbtn-outline">{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteZone} className="kbtn-danger">
              {t('delete', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── 4. Price Radar Management ──
function PriceRadarView({ lang, entries, zones, onRefresh }: {
  lang: Language; entries: PriceRadarEntry[]; zones: ZoneItem[];
  onRefresh: () => void;
}) {
  const [filterZone, setFilterZone] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editEntry, setEditEntry] = useState<PriceRadarEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formZoneId, setFormZoneId] = useState('');
  const [formPriceMin, setFormPriceMin] = useState(0);
  const [formPriceMax, setFormPriceMax] = useState(0);
  const [saving, setSaving] = useState(false);

  // Get unique categories
  const categories = Array.from(new Set(entries.map(e => e.category)));

  const filtered = entries.filter(e => {
    if (filterZone !== 'all' && e.zoneId !== filterZone) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    return true;
  });

  const openEdit = (entry: PriceRadarEntry) => {
    setEditEntry(entry);
    setFormCategory(entry.category);
    setFormZoneId(entry.zoneId);
    setFormPriceMin(entry.priceMin);
    setFormPriceMax(entry.priceMax);
    setEditDialogOpen(true);
  };

  const openCreate = () => {
    setFormCategory('');
    setFormZoneId(zones[0]?.id || '');
    setFormPriceMin(0);
    setFormPriceMax(0);
    setCreateDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      await priceRadarApi.update(editEntry.id, { category: formCategory, zoneId: formZoneId, priceMin: formPriceMin, priceMax: formPriceMax });
      toast.success(lang === 'sw' ? 'Bei imehifadhiwa' : 'Price updated');
      onRefresh();
      setEditDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kuhifadhi' : 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  const createEntry = async () => {
    if (!formCategory.trim() || !formZoneId) return;
    setSaving(true);
    try {
      await priceRadarApi.create({ category: formCategory, zoneId: formZoneId, priceMin: formPriceMin, priceMax: formPriceMax });
      toast.success(lang === 'sw' ? 'Bei imeundwa' : 'Price entry created');
      onRefresh();
      setCreateDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kuunda' : 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    setSaving(true);
    try {
      await priceRadarApi.delete(deleteEntryId);
      toast.success(lang === 'sw' ? 'Bei imefutwa' : 'Price entry deleted');
      onRefresh();
      setDeleteDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kufuta' : 'Failed to delete entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-36 text-sm kinput"><SelectValue placeholder={t('filters', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Maeneo yote' : 'All Zones'}</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 text-sm kinput"><SelectValue placeholder={t('category', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Aina zote' : 'All Categories'}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterZone !== 'all' || filterCategory !== 'all') && (
            <button className="kbtn-outline px-3 py-1.5 text-sm" onClick={() => { setFilterZone('all'); setFilterCategory('all'); }}>
              {t('clear_filters', lang)}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button className="kbtn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => toast.info(lang === 'sw' ? 'Usafirishaji unakuja' : 'Bulk import coming soon')}>
            <Upload className="h-3.5 w-3.5" />
            {lang === 'sw' ? 'Liza' : 'Import'}
          </button>
          <button onClick={openCreate} className="kbtn flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Plus className="h-3.5 w-3.5" />
            {lang === 'sw' ? 'Mpya' : 'New'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="kcard overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--border)] bg-[var(--muted)]">
                <TableHead>{t('category', lang)}</TableHead>
                <TableHead>{lang === 'sw' ? 'Eneo' : 'Zone'}</TableHead>
                <TableHead>{t('min_price', lang)}</TableHead>
                <TableHead>{t('max_price', lang)}</TableHead>
                <TableHead>{t('last_updated', lang)}</TableHead>
                <TableHead>{lang === 'sw' ? 'Aliyehariri' : 'Updated By'}</TableHead>
                <TableHead className="w-20">{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('no_results', lang)}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(entry => (
                  <TableRow key={entry.id} className="border-b border-[var(--border)]">
                    <TableCell className="font-medium text-sm">{entry.category}</TableCell>
                    <TableCell>
                      <span className="kbadge kbadge-silver" style={{ borderColor: entry.zone.color, color: entry.zone.color }}>
                        {entry.zone.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatTZS(entry.priceMin)}</TableCell>
                    <TableCell className="text-sm">{formatTZS(entry.priceMax)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(entry.updatedAt, lang)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.updatedBy}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--chimbo-green-light)] transition-colors border border-[var(--border)]" onClick={() => openEdit(entry)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-[var(--border)]" onClick={() => { setDeleteEntryId(entry.id); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{t('edit', lang)} {t('price_radar_title', lang)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('category', lang)}</Label>
              <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Eneo' : 'Zone'}</Label>
              <Select value={formZoneId} onValueChange={setFormZoneId}>
                <SelectTrigger className="kinput"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('min_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMin} onChange={e => setFormPriceMin(Number(e.target.value))} className="kinput" />
              </div>
              <div>
                <Label>{t('max_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMax} onChange={e => setFormPriceMax(Number(e.target.value))} className="kinput" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setEditDialogOpen(false)}>{t('cancel', lang)}</button>
            <button className="kbtn px-4 py-2 text-sm" onClick={saveEdit} disabled={saving}>{saving ? t('loading', lang) : t('save', lang)}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{lang === 'sw' ? 'Unda Bei Mpya' : 'New Price Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('category', lang)} *</Label>
              <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Rice Cooker" className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Eneo' : 'Zone'} *</Label>
              <Select value={formZoneId} onValueChange={setFormZoneId}>
                <SelectTrigger className="kinput"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('min_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMin} onChange={e => setFormPriceMin(Number(e.target.value))} className="kinput" />
              </div>
              <div>
                <Label>{t('max_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMax} onChange={e => setFormPriceMax(Number(e.target.value))} className="kinput" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setCreateDialogOpen(false)}>{t('cancel', lang)}</button>
            <button className="kbtn px-4 py-2 text-sm" onClick={createEntry} disabled={saving || !formCategory.trim()}>
              {saving ? t('loading', lang) : lang === 'sw' ? 'Unda' : 'Create'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="kcard border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="gradient-text-green">{lang === 'sw' ? 'Futa Bei?' : 'Delete Price Entry?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'sw' ? 'Kitendo hiki hakiwezi kubadilishwa.' : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="kbtn-outline">{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEntry} className="kbtn-danger">
              {t('delete', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── 5. Analytics View ──
function AnalyticsView({ lang, stats, zones, users, sessions }: {
  lang: Language; stats: AdminStats | null; zones: ZoneItem[];
  users: UserItem[]; sessions: { id: string; createdAt: string; amount: number; status: string; guideRating: number | null; seekerRating: number | null; startedAt: string | null }[];
}) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');

  if (!stats) return null;

  // Generate chart data from real session data
  const generateTimeData = () => {
    const now = new Date();
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 12;

    if (dateRange === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearData = months.map((label, i) => {
        const monthSessions = sessions.filter(s => {
          const d = new Date(s.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === i;
        });
        return {
          name: label,
          sessions: monthSessions.length,
          revenue: monthSessions.reduce((sum, s) => sum + s.amount, 0),
        };
      });
      return yearData;
    }

    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = sessions.filter(s => s.createdAt.slice(0, 10) === dateStr);
      return {
        name: d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'short', day: 'numeric' }),
        sessions: daySessions.length,
        revenue: daySessions.reduce((sum, s) => sum + s.amount, 0),
      };
    });
  };

  const timeData = generateTimeData();

  const requestsPerZone = zones.map(z => ({
    name: z.name,
    requests: z._count.requests,
    fill: z.color,
  }));

  // Rating distribution computed from real guide ratings
  const guideRatings = users.filter(u => u.role === 'guide' && u.guideProfile && u.guideProfile.avgRating > 0);
  const ratingBucketsAnalytics = [0, 0, 0, 0, 0];
  guideRatings.forEach(u => {
    if (u.guideProfile) {
      const bucket = Math.min(Math.floor(u.guideProfile.avgRating) - 1, 4);
      if (bucket >= 0) ratingBucketsAnalytics[bucket]++;
    }
  });
  const ratingDist = [
    { name: '5 ★', value: ratingBucketsAnalytics[4], fill: '#065F46' },
    { name: '4 ★', value: ratingBucketsAnalytics[3], fill: '#34D399' },
    { name: '3 ★', value: ratingBucketsAnalytics[2], fill: '#FBBF24' },
    { name: '2 ★', value: ratingBucketsAnalytics[1], fill: '#F97316' },
    { name: '1 ★', value: ratingBucketsAnalytics[0], fill: '#EF4444' },
  ];

  // Guide activity heatmap computed from real session start times
  const heatmapData = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 6 }, (_, slot) => {
      const slotStart = slot * 3 + 6; // 6-9, 9-12, 12-15, 15-18, 18-21, 21-24
      const slotEnd = slotStart + 3;
      return sessions.filter(s => {
        if (!s.startedAt) return false;
        const d = new Date(s.startedAt);
        const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0..Sun=6
        const hour = d.getHours();
        return dayOfWeek === day && hour >= slotStart && hour < slotEnd;
      }).length;
    })
  );
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slotLabels = ['6-9', '9-12', '12-15', '15-18', '18-21', '21-24'];

  const handleExport = () => {
    try {
      const csvRows = ['Date,Sessions,Revenue'];
      timeData.forEach(row => {
        csvRows.push(`${row.name},${row.sessions},${row.revenue}`);
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chimbo-analytics-${dateRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(lang === 'sw' ? 'Data imeshushwa' : 'Data exported!');
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kushusha data' : 'Export failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Range Picker + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={dateRange} onValueChange={v => setDateRange(v as typeof dateRange)}>
          <TabsList>
            <TabsTrigger value="week">{t('this_week', lang)}</TabsTrigger>
            <TabsTrigger value="month">{t('this_month', lang)}</TabsTrigger>
            <TabsTrigger value="year">{lang === 'sw' ? 'Mwaka' : 'Year'}</TabsTrigger>
          </TabsList>
        </Tabs>
        <button className="kbtn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
          {t('download', lang)}
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requests per Zone */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Maombi kwa Eneo' : 'Requests per Zone'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsPerZone}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                    {requestsPerZone.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sessions Over Time */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Vikao kwa Muda' : 'Sessions Over Time'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={dateRange === 'week' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#065F46" strokeWidth={2} dot={dateRange === 'week' ? true : false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Mapato kwa Muda' : 'Revenue Over Time'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={dateRange === 'week' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => formatTZS(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#FBBF24" strokeWidth={2} dot={dateRange === 'week' ? true : false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="kcard">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Usambazaji wa Ukadiriaji' : 'Rating Distribution'}</h3>
          </div>
          <div className="p-4 pt-0">
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="70%" height="100%">
                <PieChart>
                  <Pie data={ratingDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2} label={({ name, value }) => `${name}: ${value}`}>
                    {ratingDist.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {ratingDist.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: r.fill }} />
                    <span>{r.name}: {r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Activity Heatmap */}
      <div className="kcard">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium gradient-text-green">{lang === 'sw' ? 'Shughuli za Waongozaji' : 'Guide Activity Heatmap'}</h3>
        </div>
        <div className="p-4 pt-0">
          <div className="overflow-x-auto">
            <div className="inline-grid grid-cols-7 gap-1 min-w-full">
              {/* Header */}
              <div />
              {dayLabels.map(d => (
                <div key={d} className="text-xs text-center text-muted-foreground pb-1">{d}</div>
              ))}
              {/* Rows */}
              {slotLabels.map((slot, si) => (
                <>
                  <div key={slot} className="text-xs text-muted-foreground pr-2 flex items-center">{slot}</div>
                  {dayLabels.map((_, di) => {
                    const val = heatmapData[di][si];
                    const intensity = val / 4;
                    return (
                      <div
                        key={`${si}-${di}`}
                        className="h-8 rounded text-xs flex items-center justify-center font-medium"
                        style={{ backgroundColor: `rgba(11, 93, 58, ${0.1 + intensity * 0.8})`, color: intensity > 0.5 ? 'white' : 'inherit' }}
                        title={`${val} guides active`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{lang === 'sw' ? 'Chini' : 'Low'}</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((op, i) => (
                <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(11, 93, 58, ${op})` }} />
              ))}
            </div>
            <span>{lang === 'sw' ? 'Juu' : 'High'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 6. User Management ──
function UsersView({ lang, users, onRefresh }: {
  lang: Language; users: UserItem[]; onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'role' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredUsers = users
    .filter(u => {
      if (filterRole !== 'all' && u.role !== filterRole) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.phone.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return dir * a.name.localeCompare(b.name);
      if (sortField === 'role') return dir * a.role.localeCompare(b.role);
      return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <button onClick={() => toggleSort(field)} className="inline-flex ml-1">
      {sortField === field ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-30" />}
    </button>
  );

  const handleAction = async (userId: string, action: 'suspend' | 'ban' | 'message') => {
    setActionLoading(userId);
    if (action === 'message') {
      toast.info(lang === 'sw' ? 'Ujumbe umetumwa' : 'Message sent (simulated)');
      setActionLoading(null);
      return;
    }
    try {
      await api.patch<{ success: boolean }>('/users', {
        id: userId,
        name: action === 'suspend' ? '[SUSPENDED]' : '[BANNED]',
      });
      toast.success(action === 'suspend'
        ? (lang === 'sw' ? 'Mtumiaji amesimamishwa' : 'User suspended')
        : (lang === 'sw' ? 'Mtumiaji amezuiwa' : 'User banned')
      );
      onRefresh();
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu' : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      seeker: 'text-sky-700 dark:text-sky-300',
      guide: 'text-emerald-700 dark:text-emerald-300',
      admin: 'text-violet-700 dark:text-violet-300',
    };
    return (
      <span className={`kbadge kbadge-silver ${colors[role] || ''}`}>
        {role}
      </span>
    );
  };

  const statusBadge = (user: UserItem) => {
    if (user.role === 'guide' && user.guideProfile) {
      const s = user.guideProfile.status;
      if (s === 'pending') return <span className="kbadge kbadge-pending">{t('pending', lang)}</span>;
      if (s === 'suspended') return <span className="kbadge kbadge-urgent">{t('trust_suspended', lang)}</span>;
      if (s === 'active') return <span className="kbadge kbadge-verified">{t('trust_verified', lang)}</span>;
    }
    return <span className="kbadge kbadge-silver">{t('active', lang)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'sw' ? 'Tafuta kwa jina au simu...' : 'Search by name or phone...'}
              className="pl-8 text-sm kinput"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-32 text-sm kinput"><SelectValue placeholder={t('role', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Wote' : 'All Roles'}</SelectItem>
              <SelectItem value="seeker">Seeker</SelectItem>
              <SelectItem value="guide">Guide</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">{filteredUsers.length} {lang === 'sw' ? 'watumiaji' : 'users'}</span>
      </div>

      {/* Table */}
      <div className="kcard overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--border)] bg-[var(--muted)]">
                <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                  {t('name', lang)} <SortIcon field="name" />
                </TableHead>
                <TableHead>{t('phone', lang)}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('role')}>
                  {t('role', lang)} <SortIcon field="role" />
                </TableHead>
                <TableHead>{t('status', lang)}</TableHead>
                <TableHead>{t('rating', lang)}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  {lang === 'sw' ? 'Alijiunga' : 'Joined'} <SortIcon field="createdAt" />
                </TableHead>
                <TableHead className="w-24">{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('no_results', lang)}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-[var(--chimbo-green-light)] border-b border-[var(--border)]"
                    onClick={() => { setSelectedUser(user); setDetailOpen(true); }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium ${getAvatarColor(user.id)}`}>
                          {getInitials(user.name)}
                        </div>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.phone}</TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell>{statusBadge(user)}</TableCell>
                    <TableCell className="text-sm">
                      {user.guideProfile ? user.guideProfile.avgRating.toFixed(1) : '\u2014'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt, lang)}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--chimbo-green-light)] transition-colors border border-[var(--border)]" onClick={() => handleAction(user.id, 'suspend')} disabled={actionLoading === user.id} title="Suspend">
                          <Ban className="h-3.5 w-3.5 text-amber-500" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--chimbo-green-light)] transition-colors border border-[var(--border)]" onClick={() => handleAction(user.id, 'message')} disabled={actionLoading === user.id} title="Message">
                          <Mail className="h-3.5 w-3.5 text-sky-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="kcard border-[var(--border)] max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(selectedUser.id)}`}>
                    {getInitials(selectedUser.name)}
                  </div>
                  <span className="gradient-text-green">{selectedUser.name}</span>
                </DialogTitle>
                <DialogDescription>{roleBadge(selectedUser.role)} {statusBadge(selectedUser)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('phone', lang)}</p>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('language', lang)}</p>
                    <p>{selectedUser.languagePref === 'sw' ? 'Kiswahili' : 'English'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{lang === 'sw' ? 'Alijiunga' : 'Joined'}</p>
                    <p>{formatDate(selectedUser.createdAt, lang)}</p>
                  </div>
                  {selectedUser.guideProfile && (
                    <>
                      <div>
                        <p className="text-muted-foreground text-xs">{t('rating', lang)}</p>
                        <p>{selectedUser.guideProfile.avgRating.toFixed(1)} / 5.0</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{lang === 'sw' ? 'Vikao' : 'Sessions'}</p>
                        <p>{selectedUser.guideProfile.totalSessions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{lang === 'sw' ? 'Hali' : 'Status'}</p>
                        <p>{selectedUser.guideProfile.currentStatus}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <button className="kbtn-outline flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => handleAction(selectedUser.id, 'message')}>
                  <Send className="h-3.5 w-3.5" /> {lang === 'sw' ? 'Ujumbe' : 'Message'}
                </button>
                <button className="kbtn-danger flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => handleAction(selectedUser.id, 'suspend')}>
                  <Ban className="h-3.5 w-3.5" /> {lang === 'sw' ? 'Simamisha' : 'Suspend'}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 7. Dispute Resolution ──
function DisputesView({ lang, disputes, onRefresh }: {
  lang: Language; disputes: DisputeItem[]; onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ sessionId: string; action: string } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const resolveDispute = async (sessionId: string, resolution: string) => {
    setProcessing(sessionId);
    try {
      await api.post<{ success: boolean }>('/admin/disputes', { sessionId, resolution, reason: adminNotes[sessionId] || '' });
      toast.success(resolution === 'release'
        ? (lang === 'sw' ? 'Escrow imetolewa kwa mwongozo' : 'Escrow released to guide')
        : (lang === 'sw' ? 'Pesa zimerudishwa kwa mtafuta' : 'Refund issued to seeker')
      );
      onRefresh();
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kusuluhisha' : 'Failed to resolve dispute');
    } finally {
      setProcessing(null);
      setConfirmDialogOpen(false);
    }
  };

  const statusColor = (d: DisputeItem): string => {
    if (d.escrowStatus === 'disputed') return 'text-rose-600';
    if (d.escrowStatus === 'released') return 'text-emerald-600';
    return 'text-amber-600';
  };

  const statusLabel = (d: DisputeItem): string => {
    if (d.escrowStatus === 'disputed') return lang === 'sw' ? 'Wazi' : 'Open';
    if (d.escrowStatus === 'released') return lang === 'sw' ? 'Imesuluhishwa' : 'Resolved';
    return lang === 'sw' ? 'Inachunguzwa' : 'Under Review';
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-500" />
        <h2 className="font-semibold text-base">{lang === 'sw' ? 'Vikao Vilivyotajwa (Migogoro)' : 'Flagged Sessions (Disputes)'}</h2>
      </div>

      {disputes.length === 0 ? (
        <div className="kcard p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-[var(--chimbo-green)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">
            {lang === 'sw' ? 'Hakuna migogoro!' : 'No disputes!'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'sw' ? 'Jukwaa limekuwa salama' : 'Platform is dispute-free'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <div key={dispute.id} className="kcard p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">#{dispute.sessionCode || dispute.id.slice(-6)}</span>
                    <span className={`kbadge ${dispute.escrowStatus === 'disputed' ? 'kbadge-urgent' : dispute.escrowStatus === 'released' ? 'kbadge-verified' : 'kbadge-pending'}`}>
                      {statusLabel(dispute)}
                    </span>
                    {dispute.emergencyFlag && (
                      <span className="kbadge kbadge-urgent flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {t('trust_emergency', lang)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{dispute.guide.name}</span>
                      <span className="text-muted-foreground">{lang === 'sw' ? 'dhidi ya' : 'vs'}</span>
                      <span className="font-medium">{dispute.seeker.name}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatTZS(dispute.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(dispute.updatedAt, lang)}</p>
                </div>
              </div>

              {/* Dispute Reason */}
              <div className="mb-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400">
                <p className="text-xs font-medium">{lang === 'sw' ? 'Sababu ya mgogoro:' : 'Dispute reason:'}</p>
                <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                  {dispute.disputeReason || (lang === 'sw' ? 'Hakuna sababu iliyotolewa' : 'No reason provided')}
                </p>
              </div>

              {/* Request Description */}
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {lang === 'sw' ? 'Ombi:' : 'Request:'} {dispute.request.description}
              </p>

              {/* Expand/Collapse */}
              <button
                onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
                className="text-xs gradient-text-green font-medium hover:underline flex items-center gap-1"
              >
                {expandedId === dispute.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expandedId === dispute.id
                  ? (lang === 'sw' ? 'Ficha maelezo' : 'Hide details')
                  : (lang === 'sw' ? 'Tazama maelezo' : 'View details')
                }
              </button>

              {/* Expanded Details */}
              {expandedId === dispute.id && (
                <div className="mt-3 space-y-3">
                  {/* Messages */}
                  {dispute.messages && dispute.messages.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5">{lang === 'sw' ? 'Ujumbe wa hivi karibu' : 'Recent Messages'}</p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {dispute.messages.slice(0, 5).map(msg => (
                          <div key={msg.id} className="text-xs p-2 rounded-lg bg-[var(--muted)]">
                            <span className="font-medium">{msg.sender.name}:</span> {msg.content}
                            <span className="text-[10px] text-muted-foreground ml-2">{formatDateTime(msg.createdAt, lang)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <p className="text-xs font-medium mb-1">{lang === 'sw' ? 'Maoni ya Msimamizi' : 'Admin Notes'}</p>
                    <Textarea
                      value={adminNotes[dispute.id] || ''}
                      onChange={e => setAdminNotes(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      placeholder={lang === 'sw' ? 'Andika maoni yako...' : 'Write your notes...'}
                      rows={2}
                      className="text-xs kinput"
                    />
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--muted)]">
                      <p className="text-muted-foreground">{t('amount', lang)}</p>
                      <p className="font-medium">{formatTZS(dispute.amount)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--muted)]">
                      <p className="text-muted-foreground">{lang === 'sw' ? 'Ada ya Jukwaa' : 'Platform Fee'}</p>
                      <p className="font-medium">{formatTZS(dispute.amount * 0.12)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--muted)]">
                      <p className="text-muted-foreground">{t('escrow_held', lang)}</p>
                      <p className="font-medium">{dispute.escrowStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-3 flex gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  className="kbtn flex items-center gap-1.5 py-2 px-3 text-sm flex-1"
                  onClick={() => {
                    setConfirmAction({ sessionId: dispute.id, action: 'release' });
                    setConfirmDialogOpen(true);
                  }}
                  disabled={processing === dispute.id}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  {lang === 'sw' ? 'Tolea Mwongozo' : 'Force Release'}
                </button>
                <button
                  className="kbtn-danger flex items-center gap-1.5 py-2 px-3 text-sm flex-1"
                  onClick={() => {
                    setConfirmAction({ sessionId: dispute.id, action: 'refund' });
                    setConfirmDialogOpen(true);
                  }}
                  disabled={processing === dispute.id}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {lang === 'sw' ? 'Rudisha Mtafuta' : 'Force Refund'}
                </button>
                <button
                  className="kbtn-outline flex items-center gap-1.5 py-2 px-3 text-sm"
                  onClick={() => toast.info(lang === 'sw' ? 'Maombi ya maelezo zaidi yametumwa' : 'More info requested')}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{lang === 'sw' ? 'Maelezo' : 'Info'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="kcard border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="gradient-text-green">
              {confirmAction?.action === 'release'
                ? (lang === 'sw' ? 'Tolea Mwongozo Escrow?' : 'Release Escrow to Guide?')
                : (lang === 'sw' ? 'Rudisha Pesa kwa Mtafuta?' : 'Refund to Seeker?')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'release'
                ? (lang === 'sw' ? 'Escrow itatolewa kwa mwongozo. Kitendo hakiwezi kubadilishwa.' : 'Escrow will be released to the guide. This cannot be undone.')
                : (lang === 'sw' ? 'Pesa zitarudishwa kwa mtafuta. Kitendo hakiwezi kubadilishwa.' : 'Funds will be refunded to the seeker. This cannot be undone.')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="kbtn-outline">{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && resolveDispute(confirmAction.sessionId, confirmAction.action)}
              className={confirmAction?.action === 'release' ? 'kbtn' : 'kbtn-danger'}
            >
              {confirmAction?.action === 'release'
                ? (lang === 'sw' ? 'Tolea Mwongozo' : 'Release to Guide')
                : (lang === 'sw' ? 'Rudisha Mtafuta' : 'Refund Seeker')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── 8. Fraud Alerts View ──
function FraudView({ lang, alerts, onRefresh }: {
  lang: Language; alerts: FraudAlertItem[]; onRefresh: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = filterStatus === 'all' ? alerts : alerts.filter(a => a.status === filterStatus);

  const reviewAlert = async (alertId: string, action: 'dismiss' | 'escalate') => {
    setProcessing(alertId);
    try {
      await fraudAlertsApi.update(alertId, { status: action === 'dismiss' ? 'dismissed' : 'investigating' });
      toast.success(action === 'dismiss'
        ? (lang === 'sw' ? 'Tahadhari imeondolewa' : 'Alert dismissed')
        : (lang === 'sw' ? 'Tahadhari imepandishwa' : 'Alert escalated')
      );
      onRefresh();
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu' : 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-rose-600';
    if (c >= 0.5) return 'text-amber-600';
    return 'text-sky-600';
  };

  const confidenceBadge = (c: number) => {
    if (c >= 0.8) return 'kbadge-urgent';
    if (c >= 0.5) return 'kbadge-pending';
    return 'kbadge-silver';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 text-sm kinput"><SelectValue placeholder={t('status', lang)} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'sw' ? 'Zote' : 'All Status'}</SelectItem>
            <SelectItem value="pending">{t('pending', lang)}</SelectItem>
            <SelectItem value="dismissed">{lang === 'sw' ? 'Zilizoodolewa' : 'Dismissed'}</SelectItem>
            <SelectItem value="escalated">{lang === 'sw' ? 'Zilizopandishwa' : 'Escalated'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="kcard p-12 text-center">
          <ShieldCheck className="h-12 w-12 text-[var(--chimbo-green)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">{lang === 'sw' ? 'Hakuna tahadhari!' : 'No fraud alerts!'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Jukwaa ni salama' : 'Platform is secure'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={alert.id} className="kcard p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className={`h-4 w-4 ${confidenceColor(alert.confidence)}`} />
                    <span className="font-semibold text-sm">{alert.alertType}</span>
                    <span className={`kbadge ${confidenceBadge(alert.confidence)}`}>
                      {Math.round(alert.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.details}</p>
                </div>
                <span className={`kbadge ${
                  alert.status === 'pending' ? 'kbadge-pending' :
                  alert.status === 'escalated' ? 'kbadge-urgent' : 'kbadge-silver'
                }`}>
                  {alert.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span>{alert.entityType}: {alert.entityId.slice(-8)}</span>
                <span>{formatDate(alert.createdAt, lang)}</span>
              </div>
              {alert.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    className="kbtn flex items-center gap-1.5 py-1.5 px-3 text-xs"
                    onClick={() => reviewAlert(alert.id, 'escalate')}
                    disabled={processing === alert.id}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {lang === 'sw' ? 'Pandisha' : 'Escalate'}
                  </button>
                  <button
                    className="kbtn-outline flex items-center gap-1.5 py-1.5 px-3 text-xs"
                    onClick={() => reviewAlert(alert.id, 'dismiss')}
                    disabled={processing === alert.id}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {lang === 'sw' ? 'Ondoa' : 'Dismiss'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 9. Vendors View ──
function VendorsView({ lang, vendors, zones, onRefresh }: {
  lang: Language; vendors: VendorWithVerification[]; zones: ZoneItem[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  const filtered = vendors.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.contact.includes(search)) return false;
    if (filterZone !== 'all' && v.zoneId !== filterZone) return false;
    if (filterVerified === 'verified' && !v.verification?.isVerified) return false;
    if (filterVerified === 'unverified' && v.verification?.isVerified) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta muuzaji...' : 'Search vendors...'} className="pl-8 text-sm kinput" />
          </div>
          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-36 text-sm kinput"><SelectValue placeholder={lang === 'sw' ? 'Eneo' : 'Zone'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Maeneo yote' : 'All Zones'}</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="kcard p-12 text-center">
          <Store className="h-12 w-12 text-[var(--chimbo-yellow)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">{lang === 'sw' ? 'Hakuna wauzaji' : 'No vendors found'}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(vendor => (
            <div key={vendor.id} className="kcard p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm gradient-text-green">{vendor.name}</h3>
                  <p className="text-xs text-muted-foreground">{vendor.stallNumber} &bull; {vendor.contact}</p>
                </div>
                <span className={`kbadge ${vendor.verification?.isVerified ? 'kbadge-verified' : 'kbadge-pending'}`}>
                  {vendor.verification?.isVerified ? (lang === 'sw' ? 'Thibitishwa' : 'Verified') : (lang === 'sw' ? 'Haijathibitishwa' : 'Unverified')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{vendor.categories}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" style={{ color: vendor.zone.color }} />
                <span>{vendor.zone.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 rounded-lg bg-[var(--muted)] text-center">
                  <p className="text-sm font-semibold">{vendor.recommendations}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Mapendekezo' : 'Recs'}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--muted)] text-center">
                  <p className="text-sm font-semibold">{vendor.approved ? '\u2713' : '\u2717'}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Idhini' : 'Approved'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 10. Calendar / Seasonal Events View ──
function CalendarView({ lang, events, zones, onRefresh }: {
  lang: Language; events: SeasonalEventItem[]; zones: ZoneItem[];
  onRefresh: () => void;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTitleSw, setFormTitleSw] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('festival');
  const [formStartDate, setFormStartDate] = useState('');
  const [formAffectedZones, setFormAffectedZones] = useState('');
  const [saving, setSaving] = useState(false);

  const createEvent = async () => {
    if (!formTitle.trim() || !formStartDate) return;
    setSaving(true);
    try {
      await seasonalEventsApi.create({
        title: formTitle, titleSw: formTitleSw, type: formType,
        startDate: formStartDate, affectedZones: formAffectedZones ? [formAffectedZones] : [],
        insiderTip: '', insiderTipSw: '',
      });
      toast.success(lang === 'sw' ? 'Tukio limeundwa' : 'Event created');
      onRefresh();
      setCreateDialogOpen(false);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu' : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'festival': return Church;
      case 'holiday': return Sun;
      case 'market': return ShoppingBag;
      case 'cultural': return Lightbulb;
      default: return Calendar;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setCreateDialogOpen(true)} className="kbtn flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" />
          {lang === 'sw' ? 'Tukio Jipya' : 'New Event'}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="kcard p-12 text-center">
          <Calendar className="h-12 w-12 text-[var(--chimbo-yellow)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">{lang === 'sw' ? 'Hakuna matukio' : 'No seasonal events'}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => {
            const Icon = typeIcon(event.type);
            return (
              <div key={event.id} className="kcard p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--chimbo-green-light)] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[var(--chimbo-green)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm gradient-text-green">{event.title}</h3>
                    {event.titleSw && <p className="text-xs text-muted-foreground">{event.titleSw}</p>}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.startDate, lang)}{event.endDate ? ` - ${formatDate(event.endDate, lang)}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="kbadge kbadge-silver">{event.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="kcard border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="gradient-text-green">{lang === 'sw' ? 'Unda Tukio Jipya' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{lang === 'sw' ? 'Kichwa' : 'Title'} *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Kichwa (Kiswahili)' : 'Swahili Title'}</Label>
              <Input value={formTitleSw} onChange={e => setFormTitleSw(e.target.value)} className="kinput" />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="kinput" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Aina' : 'Type'}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="kinput"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="market">Market Day</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Tarehe ya Kuanza' : 'Start Date'} *</Label>
              <Input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="kinput" />
            </div>
          </div>
          <DialogFooter>
            <button className="kbtn-outline px-4 py-2 text-sm" onClick={() => setCreateDialogOpen(false)}>{t('cancel', lang)}</button>
            <button className="kbtn px-4 py-2 text-sm" onClick={createEvent} disabled={saving || !formTitle.trim()}>
              {saving ? t('loading', lang) : lang === 'sw' ? 'Unda' : 'Create'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 11. Package Deals View ──
function PackagesView({ lang, deals, onRefresh }: {
  lang: Language; deals: PackageDealItem[]; onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      {deals.length === 0 ? (
        <div className="kcard p-12 text-center">
          <Package className="h-12 w-12 text-[var(--chimbo-yellow)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg gradient-text-green">{lang === 'sw' ? 'Hakuna vifurushi' : 'No package deals'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'sw' ? 'Waongozaji bado hawajaunda vifurushi' : 'Guides haven\'t created packages yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="kcard p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm gradient-text-green">{deal.title}</h3>
                <span className={`kbadge ${deal.isActive ? 'kbadge-verified' : 'kbadge-silver'}`}>
                  {deal.isActive ? (lang === 'sw' ? 'Hai' : 'Active') : (lang === 'sw' ? 'Haitumiki' : 'Inactive')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{deal.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--muted)]">
                  <p className="text-sm font-semibold">{deal.duration}h</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Muda' : 'Hours'}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--muted)]">
                  <p className="text-sm font-semibold">{deal.sessionsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Vikao' : 'Sessions'}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--muted)]">
                  <p className="text-sm font-semibold">{formatTZS(deal.price)}</p>
                  <p className="text-[10px] text-muted-foreground">{t('price', lang)}</p>
                </div>
              </div>
              {deal.includesDelivery && (
                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--chimbo-green)]">
                  <Truck className="h-3 w-3" />
                  {lang === 'sw' ? 'Inajumuisha usafirishaji' : 'Includes delivery'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
