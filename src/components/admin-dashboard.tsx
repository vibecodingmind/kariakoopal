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
import {
  BarChart3,
  Users,
  ShieldCheck,
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

type AdminView = 'overview' | 'verification' | 'zones' | 'price-radar' | 'analytics' | 'users' | 'disputes';

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
  { key: 'zones', icon: MapPin, labelKey: 'zone_management' },
  { key: 'price-radar', icon: BarChart3, labelKey: 'price_radar_mgmt' },
  { key: 'analytics', icon: TrendingUp, labelKey: 'analytics' },
  { key: 'users', icon: UserCog, labelKey: 'user_management' },
  { key: 'disputes', icon: Scale, labelKey: 'dispute_resolution' },
];

// ── Admin Sidebar (declared outside render to avoid lint error) ──
function AdminSidebar({ lang, view, onNavigate }: { lang: Language; view: AdminView; onNavigate: (v: AdminView) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          {t('admin_dashboard', lang)}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Kariako Guide Admin</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              view === item.key
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey, lang)}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>v1.0.0 • Kariako Guide</p>
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

  // Fetch all data
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data.stats);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata takwimu' : 'Failed to load stats');
    }
  }, [lang]);

  const fetchPendingGuides = useCallback(async () => {
    try {
      const res = await fetch('/api/guides?status=pending');
      const data = await res.json();
      setPendingGuides(data.guides || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata waongozaji' : 'Failed to load pending guides');
    }
  }, [lang]);

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      setZones(data.zones || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata maeneo' : 'Failed to load zones');
    }
  }, [lang]);

  const fetchPriceEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/price-radar');
      const data = await res.json();
      setPriceEntries(data.entries || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata rada ya bei' : 'Failed to load price entries');
    }
  }, [lang]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata watumiaji' : 'Failed to load users');
    }
  }, [lang]);

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch {
      toast.error(lang === 'sw' ? 'Hitilafu ya kupata migogoro' : 'Failed to load disputes');
    }
  }, [lang]);

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
      ]);
      setLoading(false);
    };
    load();
  }, [fetchStats, fetchPendingGuides, fetchZones, fetchPriceEntries, fetchUsers, fetchDisputes]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-card">
        <AdminSidebar lang={lang} view={view} onNavigate={(v) => { setView(v); setSidebarOpen(false); }} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AdminSidebar lang={lang} view={view} onNavigate={(v) => { setView(v); setSidebarOpen(false); }} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-base">
                {t(navItems.find(n => n.key === view)?.labelKey || 'admin_dashboard', lang)}
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchPendingGuides(); fetchDisputes(); }} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('refresh', lang)}</span>
            </Button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {loading ? <LoadingSkeleton /> : (
            <>
              {view === 'overview' && <OverviewView lang={lang} stats={stats} zones={zones} disputes={disputes} pendingGuides={pendingGuides} users={users} onNavigate={setView} />}
              {view === 'verification' && <VerificationView lang={lang} guides={pendingGuides} onRefresh={fetchPendingGuides} />}
              {view === 'zones' && <ZonesView lang={lang} zones={zones} onRefresh={fetchZones} />}
              {view === 'price-radar' && <PriceRadarView lang={lang} entries={priceEntries} zones={zones} onRefresh={fetchPriceEntries} />}
              {view === 'analytics' && <AnalyticsView lang={lang} stats={stats} zones={zones} users={users} />}
              {view === 'users' && <UsersView lang={lang} users={users} onRefresh={fetchUsers} />}
              {view === 'disputes' && <DisputesView lang={lang} disputes={disputes} onRefresh={fetchDisputes} />}
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden border-t bg-card">
          <div className="flex overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  view === item.key ? 'text-primary' : 'text-muted-foreground'
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
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

// ── 1. Overview Dashboard ──
function OverviewView({ lang, stats, zones, disputes, pendingGuides, users, onNavigate }: {
  lang: Language; stats: AdminStats | null; zones: ZoneItem[];
  disputes: DisputeItem[]; pendingGuides: PendingGuide[]; users: UserItem[];
  onNavigate: (v: AdminView) => void;
}) {
  if (!stats) return null;

  const onlineGuides = users.filter(u => u.role === 'guide' && u.guideProfile?.currentStatus === 'online').length;
  const fraudFlags = disputes.filter(d => d.emergencyFlag).length;

  const metrics = [
    { label: t('total_users', lang), value: stats.users.total, icon: Users, sub: `${stats.users.seekers} S / ${stats.users.guides} G / ${stats.users.admins} A`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: t('active_sessions_a', lang), value: stats.sessions.active, icon: Activity, sub: `${onlineGuides} ${t('online', lang)}`, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30' },
    { label: t('total_revenue', lang), value: formatTZS(stats.revenue.total), icon: DollarSign, sub: `${stats.sessions.total} ${t('total', lang)}`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: t('avg_rating', lang), value: stats.rating.average.toFixed(1), icon: Star, sub: '/ 5.0', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: t('fraud_flags', lang), value: fraudFlags, icon: AlertTriangle, sub: disputes.length + ' ' + t('dispute_resolution', lang).toLowerCase(), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: t('requests', lang) || 'Requests', value: stats.requests.open + stats.requests.matched, icon: FileText, sub: `${stats.requests.open} open / ${stats.requests.matched} matched`, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  ];

  // Chart data - requests per zone
  const requestsPerZone = zones.map(z => ({
    name: z.name,
    requests: z._count.requests,
    fill: z.color,
  }));

  // Rating distribution (simulated)
  const ratingDistribution = [
    { rating: '5 ★', count: 8, fill: '#10B981' },
    { rating: '4 ★', count: 12, fill: '#0EA5E9' },
    { rating: '3 ★', count: 5, fill: '#F59E0B' },
    { rating: '2 ★', count: 2, fill: '#F97316' },
    { rating: '1 ★', count: 1, fill: '#EF4444' },
  ];

  // Recent activity (simulated from data)
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
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requests per Zone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Maombi kwa Eneo' : 'Requests per Zone'}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Usambazaji wa Ukadiriaji' : 'Rating Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Shughuli za Hivi Karibu' : 'Recent Activity'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 ${act.color}`}><act.icon className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <p className="font-medium">{act.text}</p>
                      <p className="text-xs text-muted-foreground">{act.time}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{act.type}</Badge>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('no_results', lang)}</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Vitendo vya Haraka' : 'Quick Actions'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => onNavigate('verification')}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{t('verification_queue', lang)}</span>
              </div>
              <Badge variant={pendingGuides.length > 0 ? 'destructive' : 'secondary'}>
                {pendingGuides.length}
              </Badge>
            </button>
            <button
              onClick={() => onNavigate('disputes')}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-sm">{t('dispute_resolution', lang)}</span>
              </div>
              <Badge variant={disputes.length > 0 ? 'destructive' : 'secondary'}>
                {disputes.length}
              </Badge>
            </button>
            <button
              onClick={() => onNavigate('zones')}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">{t('zone_management', lang)}</span>
              </div>
              <Badge variant="secondary">{zones.length}</Badge>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                <span className="text-sm">{t('user_management', lang)}</span>
              </div>
              <Badge variant="secondary">{stats.users.total}</Badge>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Mini Map Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Hali ya Soko' : 'Market Status'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {zones.map(zone => (
              <div key={zone.id} className="text-center p-3 rounded-lg border" style={{ borderColor: zone.color }}>
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: zone.color + '20' }}>
                  <MapPin className="h-4 w-4" style={{ color: zone.color }} />
                </div>
                <p className="text-xs font-medium">{zone.name}</p>
                <p className="text-[10px] text-muted-foreground">{zone._count.vendors} V • {zone._count.requests} R</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, action: 'approve' }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, action: 'reject', reason }),
      });
      if (!res.ok) throw new Error();
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-40 text-sm"
            placeholder={t('date', lang)}
          />
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
              {t('clear_filters', lang)}
            </Button>
          )}
        </div>
        {filteredGuides.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={approveAll} className="gap-1.5 text-emerald-600 hover:text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Kubali Wote' : 'Approve All'}
            </Button>
            <Button size="sm" variant="outline" onClick={rejectAll} className="gap-1.5 text-rose-600 hover:text-rose-700">
              <XCircle className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Kataa Wote' : 'Reject All'}
            </Button>
          </div>
        )}
      </div>

      {/* Guide Cards */}
      {filteredGuides.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">
              {lang === 'sw' ? 'Waongozaji wote wamethibitishwa!' : 'All guides verified!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'sw' ? 'Hakuna waongozaji wanaosubiri uthibitisho' : 'No pending guide verifications'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuides.map(guide => (
            <Card key={guide.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(guide.user.id)}`}>
                    {getInitials(guide.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{guide.user.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {guide.user.phone}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {t('pending', lang)}
                  </Badge>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{guide.bio || (lang === 'sw' ? 'Hakuna wasifu' : 'No bio provided')}</p>
                </div>

                {guide.idDocumentUrl && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {lang === 'sw' ? 'Kitambulisho kimewasilishwa' : 'ID document submitted'}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {lang === 'sw' ? 'Alituma' : 'Applied'}: {formatDate(guide.createdAt, lang)}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approveGuide(guide.userId)}
                    disabled={processing === guide.userId}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('approve_guide', lang)}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1.5"
                    onClick={() => { setRejectGuideId(guide.userId); setRejectDialogOpen(true); }}
                    disabled={processing === guide.userId}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {t('reject_guide', lang)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reject_guide', lang)}</DialogTitle>
            <DialogDescription>
              {lang === 'sw' ? 'Toa sababu ya kukataa mwongozo huu' : 'Provide a reason for rejecting this guide'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder={lang === 'sw' ? 'Sababu ya kukataa...' : 'Rejection reason...'}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button variant="destructive" onClick={() => rejectGuide(rejectGuideId, rejectReason)} disabled={!rejectReason.trim()}>
              {t('reject_guide', lang)}
            </Button>
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
  const [formColor, setFormColor] = useState('#4CAF50');
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
    setFormColor('#4CAF50');
    setCreateDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editZone) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/zones/${editZone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, nameSw: formNameSw, description: formDesc, color: formColor }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, nameSw: formNameSw, description: formDesc, color: formColor }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch(`/api/zones/${deleteZoneId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
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
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {lang === 'sw' ? 'Eneo Jipya' : 'New Zone'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <Card key={zone.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }} />
                  <h3 className="font-semibold">{zone.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(zone)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => { setDeleteZoneId(zone.id); setDeleteDialogOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {zone.nameSw && <p className="text-xs text-muted-foreground mb-2">SW: {zone.nameSw}</p>}
              {zone.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{zone.description}</p>}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-sm font-semibold">{zone._count.vendors}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Wauzaji' : 'Vendors'}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-sm font-semibold">{zone._count.priceRadar}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Bei' : 'Prices'}</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-sm font-semibold">{zone._count.requests}</p>
                  <p className="text-[10px] text-muted-foreground">{t('requests', lang) || 'Req.'}</p>
                </div>
              </div>

              {/* Mini zone boundary preview */}
              <div className="mt-3 h-16 rounded border bg-muted/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-2 rounded" style={{ backgroundColor: zone.color + '15', border: `2px dashed ${zone.color}40` }} />
                <MapPin className="h-4 w-4 relative z-10" style={{ color: zone.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit', lang)} {lang === 'sw' ? 'Eneo' : 'Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{lang === 'sw' ? 'Jina' : 'Name'}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Jina (Kiswahili)' : 'Swahili Name'}</Label>
              <Input value={formNameSw} onChange={e => setFormNameSw(e.target.value)} />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Rangi' : 'Color'}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                <Input value={formColor} onChange={e => setFormColor(e.target.value)} className="w-28" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={saveEdit} disabled={saving || !formName.trim()}>
              {saving ? t('loading', lang) : t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'sw' ? 'Unda Eneo Jipya' : 'Create New Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{lang === 'sw' ? 'Jina' : 'Name'} *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Hardware" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Jina (Kiswahili)' : 'Swahili Name'}</Label>
              <Input value={formNameSw} onChange={e => setFormNameSw(e.target.value)} placeholder="mf. Vifaa" />
            </div>
            <div>
              <Label>{t('description', lang)}</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Rangi' : 'Color'}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                <Input value={formColor} onChange={e => setFormColor(e.target.value)} className="w-28" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={createZone} disabled={saving || !formName.trim()}>
              {saving ? t('loading', lang) : lang === 'sw' ? 'Unda' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === 'sw' ? 'Futa Eneo?' : 'Delete Zone?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'sw' ? 'Kitendo hiki hakiwezi kubadilishwa. Wauzaji na bei zote zitafutwa.' : 'This cannot be undone. All vendors and prices in this zone will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteZone} className="bg-rose-600 hover:bg-rose-700">
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
      const res = await fetch(`/api/price-radar/${editEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: formCategory, zoneId: formZoneId, priceMin: formPriceMin, priceMax: formPriceMax, updatedBy: 'admin' }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch('/api/price-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: formCategory, zoneId: formZoneId, priceMin: formPriceMin, priceMax: formPriceMax, updatedBy: 'admin' }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch(`/api/price-radar/${deleteEntryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
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
            <SelectTrigger className="w-36 text-sm"><SelectValue placeholder={t('filters', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Maeneo yote' : 'All Zones'}</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 text-sm"><SelectValue placeholder={t('category', lang)} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'sw' ? 'Aina zote' : 'All Categories'}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterZone !== 'all' || filterCategory !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterZone('all'); setFilterCategory('all'); }}>
              {t('clear_filters', lang)}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info(lang === 'sw' ? 'Usafirishaji unakuja' : 'Bulk import coming soon')}>
            <Upload className="h-3.5 w-3.5" />
            {lang === 'sw' ? 'Liza' : 'Import'}
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {lang === 'sw' ? 'Mpya' : 'New'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium text-sm">{entry.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: entry.zone.color, color: entry.zone.color }}>
                          {entry.zone.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatTZS(entry.priceMin)}</TableCell>
                      <TableCell className="text-sm">{formatTZS(entry.priceMax)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(entry.updatedAt, lang)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.updatedBy}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => { setDeleteEntryId(entry.id); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit', lang)} {t('price_radar_title', lang)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('category', lang)}</Label>
              <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Eneo' : 'Zone'}</Label>
              <Select value={formZoneId} onValueChange={setFormZoneId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('min_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMin} onChange={e => setFormPriceMin(Number(e.target.value))} />
              </div>
              <div>
                <Label>{t('max_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMax} onChange={e => setFormPriceMax(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? t('loading', lang) : t('save', lang)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'sw' ? 'Unda Bei Mpya' : 'New Price Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('category', lang)} *</Label>
              <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Rice Cooker" />
            </div>
            <div>
              <Label>{lang === 'sw' ? 'Eneo' : 'Zone'} *</Label>
              <Select value={formZoneId} onValueChange={setFormZoneId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('min_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMin} onChange={e => setFormPriceMin(Number(e.target.value))} />
              </div>
              <div>
                <Label>{t('max_price', lang)} (TZS)</Label>
                <Input type="number" value={formPriceMax} onChange={e => setFormPriceMax(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('cancel', lang)}</Button>
            <Button onClick={createEntry} disabled={saving || !formCategory.trim()}>
              {saving ? t('loading', lang) : lang === 'sw' ? 'Unda' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === 'sw' ? 'Futa Bei?' : 'Delete Price Entry?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'sw' ? 'Kitendo hiki hakiwezi kubadilishwa.' : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEntry} className="bg-rose-600 hover:bg-rose-700">
              {t('delete', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── 5. Analytics View ──
function AnalyticsView({ lang, stats, zones, users }: {
  lang: Language; stats: AdminStats | null; zones: ZoneItem[];
  users: UserItem[];
}) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');

  if (!stats) return null;

  // Generate simulated chart data based on date range
  const generateTimeData = () => {
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 12;
    const labels = dateRange === 'year'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : Array.from({ length: days }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          return d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'short', day: 'numeric' });
        });

    return labels.map((label, i) => ({
      name: label,
      sessions: Math.floor(Math.random() * 15) + 3 + i * 0.5,
      revenue: Math.floor(Math.random() * 50000) + 10000 + i * 2000,
    }));
  };

  const timeData = generateTimeData();

  const requestsPerZone = zones.map(z => ({
    name: z.name,
    requests: z._count.requests,
    fill: z.color,
  }));

  const ratingDist = [
    { name: '5 ★', value: 8, fill: '#10B981' },
    { name: '4 ★', value: 12, fill: '#0EA5E9' },
    { name: '3 ★', value: 5, fill: '#F59E0B' },
    { name: '2 ★', value: 2, fill: '#F97316' },
    { name: '1 ★', value: 1, fill: '#EF4444' },
  ];

  // Guide activity heatmap (simplified - 7 days x 6 time slots)
  const heatmapData = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 6 }, (_, slot) => Math.floor(Math.random() * 5))
  );
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slotLabels = ['6-9', '9-12', '12-15', '15-18', '18-21', '21-24'];

  const handleExport = () => {
    toast.success(lang === 'sw' ? 'Data inashushwa...' : 'Exporting data...');
    // Simulated export
    setTimeout(() => toast.success(lang === 'sw' ? 'Data imeshushwa' : 'Data exported!'), 1500);
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
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {t('download', lang)}
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requests per Zone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Maombi kwa Eneo' : 'Requests per Zone'}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Sessions Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Vikao kwa Muda' : 'Sessions Over Time'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={dateRange === 'week' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#0EA5E9" strokeWidth={2} dot={dateRange === 'week' ? true : false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Mapato kwa Muda' : 'Revenue Over Time'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={dateRange === 'week' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => formatTZS(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={dateRange === 'week' ? true : false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Usambazaji wa Ukadiriaji' : 'Rating Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Guide Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{lang === 'sw' ? 'Shughuli za Waongozaji' : 'Guide Activity Heatmap'}</CardTitle>
        </CardHeader>
        <CardContent>
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
                        style={{ backgroundColor: `rgba(16, 185, 129, ${0.1 + intensity * 0.8})`, color: intensity > 0.5 ? 'white' : 'inherit' }}
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
                <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(16, 185, 129, ${op})` }} />
              ))}
            </div>
            <span>{lang === 'sw' ? 'Juu' : 'High'}</span>
          </div>
        </CardContent>
      </Card>
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
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: action === 'suspend' ? '[SUSPENDED]' : '[BANNED]',
        }),
      });
      if (!res.ok) throw new Error();
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
      seeker: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
      guide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      admin: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    };
    return (
      <Badge variant="secondary" className={`text-xs ${colors[role] || ''}`}>
        {role}
      </Badge>
    );
  };

  const statusBadge = (user: UserItem) => {
    if (user.role === 'guide' && user.guideProfile) {
      const s = user.guideProfile.status;
      if (s === 'pending') return <Badge variant="outline" className="text-amber-600 text-[10px]">{t('pending', lang)}</Badge>;
      if (s === 'suspended') return <Badge variant="outline" className="text-rose-600 text-[10px]">{t('trust_suspended', lang)}</Badge>;
      if (s === 'active') return <Badge variant="outline" className="text-emerald-600 text-[10px]">{t('trust_verified', lang)}</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{t('active', lang)}</Badge>;
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
              className="pl-8 text-sm"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-32 text-sm"><SelectValue placeholder={t('role', lang)} /></SelectTrigger>
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
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                      className="cursor-pointer hover:bg-muted/50"
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
                        {user.guideProfile ? user.guideProfile.avgRating.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt, lang)}</TableCell>
                      <TableCell>
                        <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction(user.id, 'suspend')} disabled={actionLoading === user.id} title="Suspend">
                            <Ban className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction(user.id, 'message')} disabled={actionLoading === user.id} title="Message">
                            <Mail className="h-3.5 w-3.5 text-sky-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(selectedUser.id)}`}>
                    {getInitials(selectedUser.name)}
                  </div>
                  {selectedUser.name}
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
                <Button variant="outline" size="sm" onClick={() => handleAction(selectedUser.id, 'message')}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> {lang === 'sw' ? 'Ujumbe' : 'Message'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction(selectedUser.id, 'suspend')}>
                  <Ban className="h-3.5 w-3.5 mr-1.5" /> {lang === 'sw' ? 'Simamisha' : 'Suspend'}
                </Button>
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
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, resolution, reason: adminNotes[sessionId] || '' }),
      });
      if (!res.ok) throw new Error();
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
    if (d.escrowStatus === 'disputed') return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30';
    if (d.escrowStatus === 'released') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
  };

  const statusLabel = (d: DisputeItem): string => {
    if (d.escrowStatus === 'disputed') return lang === 'sw' ? 'Wazi' : 'Open';
    if (d.escrowStatus === 'released') return lang === 'sw' ? 'Imesuluhishwa' : 'Resolved';
    return lang === 'sw' ? 'Inachunguzwa' : 'Under Review';
  };

  return (
    <div className="space-y-4">
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">
              {lang === 'sw' ? 'Hakuna migogoro!' : 'No disputes!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'sw' ? 'Jukwaa limekuwa salama' : 'Platform is dispute-free'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <Card key={dispute.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">#{dispute.sessionCode || dispute.id.slice(-6)}</span>
                      <Badge className={`text-[10px] ${statusColor(dispute)}`}>
                        {statusLabel(dispute)}
                      </Badge>
                      {dispute.emergencyFlag && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {t('trust_emergency', lang)}
                        </Badge>
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
                <div className="mb-3 p-2 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{lang === 'sw' ? 'Sababu ya mgogoro:' : 'Dispute reason:'}</p>
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
                  className="text-xs text-primary hover:underline flex items-center gap-1"
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
                            <div key={msg.id} className="text-xs p-2 rounded bg-muted/50">
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
                        className="text-xs"
                      />
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">{t('amount', lang)}</p>
                        <p className="font-medium">{formatTZS(dispute.amount)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">{lang === 'sw' ? 'Ada ya Jukwaa' : 'Platform Fee'}</p>
                        <p className="font-medium">{formatTZS(dispute.amount * 0.12)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">{t('escrow_held', lang)}</p>
                        <p className="font-medium">{dispute.escrowStatus}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 flex-1"
                    onClick={() => {
                      setConfirmAction({ sessionId: dispute.id, action: 'release' });
                      setConfirmDialogOpen(true);
                    }}
                    disabled={processing === dispute.id}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    {lang === 'sw' ? 'Tolea Mwongozo' : 'Release to Guide'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 flex-1 border-sky-300 text-sky-600 hover:bg-sky-50"
                    onClick={() => {
                      setConfirmAction({ sessionId: dispute.id, action: 'refund' });
                      setConfirmDialogOpen(true);
                    }}
                    disabled={processing === dispute.id}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {lang === 'sw' ? 'Rudisha Mtafuta' : 'Refund Seeker'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => toast.info(lang === 'sw' ? 'Maombi ya maelezo zaidi yametumwa' : 'More info requested')}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{lang === 'sw' ? 'Maelezo' : 'Info'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
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
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && resolveDispute(confirmAction.sessionId, confirmAction.action)}
              className={confirmAction?.action === 'release' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}
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
