'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { t, Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Timer,
  DollarSign,
  Shield,
  ArrowLeft,
  X,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Scissors,
  Banknote,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'escrow';

interface Booking {
  id: string;
  seekerId: string;
  guideId: string;
  seekerName?: string;
  seekerAvatar?: string | null;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  zone: string;
  notes: string;
  totalAmount: number;
  platformFee: number;
  guidePayout: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  disputeReason?: string;
  disputedAt?: string;
}

// ── Helpers ──
function formatTZS(amount: number, lang: Language): string {
  return `TZS ${new Intl.NumberFormat(lang === 'sw' ? 'sw-TZ' : 'en-US').format(amount)}`;
}

function formatDate(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function timeAgo(dateStr: string, lang: Language): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'sw' ? 'Sasa hivi' : 'Just now';
  if (mins < 60) return lang === 'sw' ? `Dakika ${mins} iliyopita` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'sw' ? `Saa ${hrs} iliyopita` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return lang === 'sw' ? `Siku ${days} iliyopita` : `${days}d ago`;
}

const seekerNames: Record<string, string> = {
  'demo-seeker-1': 'Sarah Johnson',
};

// ── Status Badge Component ──
function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
    pending: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', icon: Clock, label: 'Pending' },
    confirmed: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2, label: 'Confirmed' },
    in_progress: { color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800', icon: Timer, label: 'In Progress' },
    completed: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700', icon: CheckCircle2, label: 'Completed' },
    cancelled: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', icon: X, label: 'Cancelled' },
    disputed: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800', icon: AlertTriangle, label: 'Disputed' },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}>
      <span className="relative flex items-center justify-center">
        <Icon className="w-3 h-3" />
        {(status === 'confirmed' || status === 'in_progress') && (
          <span className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-40 bg-current" />
        )}
      </span>
      {c.label}
    </span>
  );
}

// ── Payment Status Badge ──
function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { color: string; bg: string; label: string }> = {
    pending: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', label: 'Payment Pending' },
    escrow: { color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', label: 'In Escrow' },
    paid: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Paid Out' },
    refunded: { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/30', label: 'Refunded' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.bg} ${c.color}`}>
      <Shield className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

// ── Earnings Summary Card ──
function EarningsSummary({ bookings, lang }: { bookings: Booking[]; lang: Language }) {
  const sw = lang === 'sw';
  const completed = bookings.filter(b => b.status === 'completed');
  const totalEarned = completed.reduce((sum, b) => sum + b.guidePayout, 0);
  const totalFees = completed.reduce((sum, b) => sum + b.platformFee, 0);
  const totalGross = completed.reduce((sum, b) => sum + b.totalAmount, 0);
  const inEscrow = bookings.filter(b => b.paymentStatus === 'escrow').reduce((sum, b) => sum + b.guidePayout, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kcard overflow-hidden"
    >
      <div className="bg-gradient-to-br from-[#065F46] to-[#064E3B] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5 text-[#34D399]" />
          <h3 className="text-sm font-semibold text-white">{sw ? 'Muhtasari wa Mapato' : 'Earnings Summary'}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium">{sw ? 'Jumla Imepatikana' : 'Total Earned'}</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatTZS(totalEarned, lang)}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium">{sw ? 'Kwenye Dhamana' : 'In Escrow'}</p>
            <p className="text-lg font-bold text-sky-300 mt-0.5">{formatTZS(inEscrow, lang)}</p>
          </div>
        </div>
      </div>
      <div className="p-3 bg-[#ECFDF5] dark:bg-[#064E3B]/30 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{sw ? 'Jumla halisi' : 'Gross total'}</span>
          <span className="font-medium">{formatTZS(totalGross, lang)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            {sw ? 'Ada ya jukwaa (15%)' : 'Platform fee (15%)'}
          </span>
          <span className="font-medium text-amber-600 dark:text-amber-400">-{formatTZS(totalFees, lang)}</span>
        </div>
        <div className="border-t border-emerald-200 dark:border-emerald-800 pt-1.5 flex justify-between text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{sw ? 'Mapato yako' : 'Your earnings'}</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatTZS(totalEarned, lang)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Booking Card Component (Guide Perspective) ──
function GuideBookingCard({
  booking,
  lang,
  isExpanded,
  onToggle,
  onConfirm,
  onDecline,
  onStart,
  onComplete,
  onDispute,
}: {
  booking: Booking;
  lang: Language;
  isExpanded: boolean;
  onToggle: () => void;
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDispute: (id: string) => void;
}) {
  const seekerName = booking.seekerName || seekerNames[booking.seekerId] || 'Seeker';
  const sw = lang === 'sw';

  // Urgency indicator for pending requests
  const urgency = booking.status === 'pending'
    ? (Date.now() - new Date(booking.createdAt).getTime() < 120000 ? 'new' : 'standard')
    : 'none';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`kcard overflow-hidden transition-all duration-300 ${
        booking.status === 'in_progress' ? 'ring-2 ring-sky-400 dark:ring-sky-600' : ''
      } ${
        booking.status === 'pending' && urgency === 'new' ? 'ring-2 ring-amber-400 dark:ring-amber-600' : ''
      } ${
        booking.status === 'confirmed' ? 'ring-2 ring-emerald-400 dark:ring-emerald-600' : ''
      }`}
    >
      <div
        className="p-4 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          {/* Seeker Avatar */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {seekerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{seekerName}</p>
                  {urgency === 'new' && booking.status === 'pending' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {/* Details */}
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(booking.scheduledDate, lang)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(booking.scheduledTime)}
              </span>
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {booking.duration}h
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
              <span className="truncate">{booking.zone}</span>
            </div>

            {/* Earnings highlight */}
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatTZS(booking.guidePayout, lang)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {sw ? 'baada ya ada' : 'after fee'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              {/* Payment Info */}
              <div className="flex items-center justify-between">
                <PaymentBadge status={booking.paymentStatus} />
                <span className="text-xs text-muted-foreground">
                  {booking.paymentMethod.toUpperCase()}
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Malipo ya muombaji' : 'Seeker pays'}</span>
                  <span className="font-medium">{formatTZS(booking.totalAmount, lang)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    {sw ? 'Ada ya jukwaa (15%)' : 'Platform fee (15%)'}
                  </span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">-{formatTZS(booking.platformFee, lang)}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{sw ? 'Wewe unapata' : 'You earn'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatTZS(booking.guidePayout, lang)}</span>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">{sw ? 'Maombi ya muombaji' : 'Seeker request'}:</span>
                  <p className="mt-0.5 text-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground font-medium">{sw ? 'Muda' : 'Timeline'}:</span>
                <div className="space-y-1 pl-2 border-l-2 border-[#065F46]/20 dark:border-[#34D399]/20">
                  <p className="text-muted-foreground pl-2">
                    {sw ? 'Iliundwa' : 'Created'}: {timeAgo(booking.createdAt, lang)}
                  </p>
                  {booking.confirmedAt && (
                    <p className="text-emerald-600 dark:text-emerald-400 pl-2">
                      {sw ? 'Imethibitishwa' : 'Confirmed'}: {timeAgo(booking.confirmedAt, lang)}
                    </p>
                  )}
                  {booking.startedAt && (
                    <p className="text-sky-600 dark:text-sky-400 pl-2">
                      {sw ? 'Ilianza' : 'Started'}: {timeAgo(booking.startedAt, lang)}
                    </p>
                  )}
                  {booking.completedAt && (
                    <p className="text-gray-600 dark:text-gray-400 pl-2">
                      {sw ? 'Imekamilika' : 'Completed'}: {timeAgo(booking.completedAt, lang)}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {booking.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-[#065F46] hover:bg-[#064E3B] text-white flex-1"
                      onClick={(e) => { e.stopPropagation(); onConfirm(booking.id); }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {sw ? 'Kubali' : 'Accept'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 flex-1"
                      onClick={(e) => { e.stopPropagation(); onDecline(booking.id); }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      {sw ? 'Kataa' : 'Decline'}
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    size="sm"
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                    onClick={(e) => { e.stopPropagation(); onStart(booking.id); }}
                  >
                    <Timer className="w-3 h-3 mr-1" />
                    {sw ? 'Anza Kikao' : 'Start Session'}
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-[#065F46] hover:bg-[#064E3B] text-white"
                      onClick={(e) => { e.stopPropagation(); onComplete(booking.id); }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {sw ? 'Maliza Kikao' : 'End Session'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      onClick={(e) => { e.stopPropagation(); onDispute(booking.id); }}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {sw ? 'Lalamika' : 'Dispute'}
                    </Button>
                  </>
                )}
                {booking.status === 'disputed' && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                    <Shield className="w-3.5 h-3.5" />
                    {sw ? 'Timu inakagua - malipo yamehifadhiwa' : 'Team reviewing - payment held'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page Component ──
export default function GuideBookingsPage() {
  const { user, language } = useAuthStore();
  const lang = language as Language;
  const sw = lang === 'sw';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'upcoming' | 'active' | 'past'>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Dialogs
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings?userId=${user.id}&role=guide`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kupakia maombi' : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [user, sw]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Derived data
  const pending = bookings.filter(b => b.status === 'pending');
  const upcoming = bookings.filter(b => b.status === 'confirmed');
  const active = bookings.filter(b => b.status === 'in_progress');
  const past = bookings.filter(b => ['completed', 'cancelled', 'disputed'].includes(b.status));

  const filteredBookings = activeFilter === 'pending' ? pending
    : activeFilter === 'upcoming' ? upcoming
    : activeFilter === 'active' ? active
    : activeFilter === 'past' ? past
    : bookings;

  // Actions
  const handleConfirm = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Maombi yamethibitishwa! Malipo yamehifadhiwa.' : 'Booking confirmed! Payment held in escrow.');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to confirm');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kuthibitisha' : 'Failed to confirm');
    }
  };

  const handleDecline = async () => {
    if (!actionBookingId) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/bookings/${actionBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: declineReason || 'Declined by guide' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Maombi yamekataliwa' : 'Booking declined');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to decline');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kukataa' : 'Failed to decline');
    } finally {
      setIsActioning(false);
      setDeclineDialogOpen(false);
      setDeclineReason('');
      setActionBookingId(null);
    }
  };

  const handleStart = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Kikao kimeanza! Furahia uzoefu wa Kariakoo.' : 'Session started! Enjoy your Kariakoo experience.');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to start');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kuanza' : 'Failed to start');
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Kikao kimemalizika! Malipo yameachiliwa.' : 'Session completed! Payment released.');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to complete');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kukamilisha' : 'Failed to complete');
    }
  };

  const handleDispute = async () => {
    if (!actionBookingId) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/bookings/${actionBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispute', reason: disputeReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Mgomvo umewasilishwa' : 'Dispute filed');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to dispute');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kuwasilisha mgomvo' : 'Failed to file dispute');
    } finally {
      setIsActioning(false);
      setDisputeDialogOpen(false);
      setDisputeReason('');
      setActionBookingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-border hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold gradient-text-green">
              {sw ? 'Maombi ya Mwongozo' : 'Guide Bookings'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sw ? 'Dhibiti maombi na vikao vyako' : 'Manage your bookings and sessions'}
            </p>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="mb-6">
          <EarningsSummary bookings={bookings} lang={lang} />
        </div>

        {/* Pending Requests Alert */}
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 border-2 border-amber-300 dark:border-amber-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                  {pending.length} {sw ? (pending.length === 1 ? 'ombi unangoja' : 'maombi yanangoja') : (pending.length === 1 ? 'request waiting' : 'requests waiting')}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {sw ? 'Kubali au kataa haraka' : 'Accept or decline quickly'}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setActiveFilter('pending')}
              >
                {sw ? 'Tazama' : 'View'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Active Session Banner */}
        {active.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/30 border-2 border-sky-300 dark:border-sky-700"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-sky-500/30 animate-ping" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-sky-800 dark:text-sky-200">
                  {sw ? 'Kikao kinaendelea!' : 'Session in progress!'}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  {active[0].zone} &middot; {formatTime(active[0].scheduledTime)}
                </p>
              </div>
              <BookingStatusBadge status="in_progress" />
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: sw ? 'Zote' : 'All', count: bookings.length },
            { key: 'pending' as const, label: sw ? 'Zinangoja' : 'Pending', count: pending.length },
            { key: 'upcoming' as const, label: sw ? 'Zijazo' : 'Upcoming', count: upcoming.length },
            { key: 'active' as const, label: sw ? 'Aktivi' : 'Active', count: active.length },
            { key: 'past' as const, label: sw ? 'Zilizopita' : 'Past', count: past.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-[#065F46] text-white shadow-sm'
                  : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-muted-foreground hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                activeFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="kcard p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#065F46] dark:text-[#34D399]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {activeFilter === 'pending'
                ? (sw ? 'Hakuna maombi yanangoja' : 'No pending requests')
                : activeFilter === 'active'
                ? (sw ? 'Hakuna vikao vinavyoendelea' : 'No active sessions')
                : (sw ? 'Hakuna maombi' : 'No bookings yet')
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {sw ? 'Kuwa mtandaoni kupata maombi zaidi!' : 'Go online to receive more requests!'}
            </p>
          </motion.div>
        )}

        {/* Bookings List */}
        {!isLoading && filteredBookings.length > 0 && (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map(booking => (
                <GuideBookingCard
                  key={booking.id}
                  booking={booking}
                  lang={lang}
                  isExpanded={expandedBooking === booking.id}
                  onToggle={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                  onConfirm={handleConfirm}
                  onDecline={(id) => { setActionBookingId(id); setDeclineDialogOpen(true); }}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onDispute={(id) => { setActionBookingId(id); setDisputeDialogOpen(true); }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              {sw ? 'Kataa Maombi' : 'Decline Booking'}
            </DialogTitle>
            <DialogDescription>
              {sw ? 'Kwa nini unataka kukataa?' : 'Why are you declining?'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={sw ? 'Sababu ya kukataa (si lazima)...' : 'Reason for declining (optional)...'}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)} disabled={isActioning}>
              {sw ? 'Rudi' : 'Go Back'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              {sw ? 'Kataa' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {sw ? 'Lalamika' : 'File Dispute'}
            </DialogTitle>
            <DialogDescription>
              {sw ? 'Timu yetu itakagua ndani ya masaa 24. Malipo yatahifadhiwa kwenye dhamana.' : 'Our team will review within 24 hours. Payment will be held in escrow.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={sw ? 'Eleza tatizo lako...' : 'Describe the issue...'}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} disabled={isActioning}>
              {sw ? 'Rudi' : 'Go Back'}
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleDispute}
              disabled={isActioning || !disputeReason.trim()}
            >
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
              {sw ? 'Wasilisha Mgomvo' : 'File Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
