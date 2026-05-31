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
  ChevronUp,
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2,
  Phone,
  Timer,
  MessageSquare,
  DollarSign,
  Shield,
  ArrowLeft,
  Filter,
  Package,
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
  guideName?: string;
  guideAvatar?: string | null;
  guideRating?: number;
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

const guideNames: Record<string, string> = {
  'demo-guide-1': 'Hamisi Juma',
  'demo-guide-2': 'Fatma Hassan',
  'demo-guide-3': 'Asha Mohamed',
  'demo-guide-4': 'Mwanaildi Juma',
  'demo-guide-5': 'Halima Abdi',
};

const guideRatings: Record<string, number> = {
  'demo-guide-1': 4.8,
  'demo-guide-2': 4.7,
  'demo-guide-3': 4.9,
  'demo-guide-4': 4.6,
  'demo-guide-5': 4.7,
};

// ── Status Badge Component ──
function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { color: string; bg: string; icon: React.ElementType; label: string; labelSw: string; pulse?: boolean }> = {
    pending: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', icon: Clock, label: 'Pending', labelSw: 'Inasubiri' },
    confirmed: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2, label: 'Confirmed', labelSw: 'Imethibitishwa', pulse: true },
    in_progress: { color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800', icon: Timer, label: 'In Progress', labelSw: 'Inaendelea', pulse: true },
    completed: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700', icon: CheckCircle2, label: 'Completed', labelSw: 'Imekamilika' },
    cancelled: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', icon: X, label: 'Cancelled', labelSw: 'Imeghairiwa' },
    disputed: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800', icon: AlertTriangle, label: 'Disputed', labelSw: 'Mgomvo' },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}>
      <span className="relative flex items-center justify-center">
        <Icon className="w-3 h-3" />
        {c.pulse && (
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
    paid: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Paid' },
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

// ── Booking Card Component ──
function BookingCard({
  booking,
  lang,
  isExpanded,
  onToggle,
  onCancel,
  onDispute,
  onComplete,
  onReview,
}: {
  booking: Booking;
  lang: Language;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel: (id: string) => void;
  onDispute: (id: string) => void;
  onComplete: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const guideName = booking.guideName || guideNames[booking.guideId] || 'Guide';
  const guideRating = booking.guideRating || guideRatings[booking.guideId] || 4.5;
  const sw = lang === 'sw';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`kcard overflow-hidden transition-all duration-300 ${
        booking.status === 'in_progress' ? 'ring-2 ring-sky-400 dark:ring-sky-600' : ''
      } ${
        booking.status === 'confirmed' ? 'ring-2 ring-emerald-400 dark:ring-emerald-600' : ''
      }`}
    >
      <div
        className="p-4 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          {/* Guide Avatar */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {guideName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{guideName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs text-muted-foreground">{guideRating}</span>
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

            {/* Amount + expand toggle */}
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                {formatTZS(booking.totalAmount, lang)}
              </span>
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
                  {sw ? 'Malipo' : 'Payment'}: {booking.paymentMethod.toUpperCase()}
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Jumla' : 'Total'}</span>
                  <span className="font-medium">{formatTZS(booking.totalAmount, lang)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Ada ya jukwaa (15%)' : 'Platform fee (15%)'}</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">-{formatTZS(booking.platformFee, lang)}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Malipo kwa mwongozo' : 'Guide payout'}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatTZS(booking.guidePayout, lang)}</span>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">{sw ? 'Maelezo' : 'Notes'}:</span>
                  <p className="mt-0.5 text-foreground">{booking.notes}</p>
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
                  {booking.cancelledAt && (
                    <p className="text-red-600 dark:text-red-400 pl-2">
                      {sw ? 'Imeghairiwa' : 'Cancelled'}: {timeAgo(booking.cancelledAt, lang)}
                      {booking.cancellationReason && ` — ${booking.cancellationReason}`}
                    </p>
                  )}
                  {booking.disputedAt && (
                    <p className="text-orange-600 dark:text-orange-400 pl-2">
                      {sw ? 'Mgomvo' : 'Disputed'}: {timeAgo(booking.disputedAt, lang)}
                      {booking.disputeReason && ` — ${booking.disputeReason}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {booking.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onCancel(booking.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    {sw ? 'Ghairi' : 'Cancel'}
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onCancel(booking.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    {sw ? 'Ghairi' : 'Cancel'}
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-[#065F46] hover:bg-[#064E3B] text-white"
                      onClick={() => onComplete(booking.id)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {sw ? 'Kamilisha' : 'Complete'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      onClick={() => onDispute(booking.id)}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {sw ? 'Lalamika' : 'Dispute'}
                    </Button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <Button
                    size="sm"
                    className="bg-[#065F46] hover:bg-[#064E3B] text-white"
                    onClick={() => onReview(booking.id)}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {sw ? 'Tathmini' : 'Review'}
                  </Button>
                )}
                {booking.status === 'disputed' && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                    <Shield className="w-3.5 h-3.5" />
                    {sw ? 'Timu yetu inakagua' : 'Our team is reviewing'}
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
export default function SeekerBookingsPage() {
  const { user, language } = useAuthStore();
  const lang = language as Language;
  const sw = lang === 'sw';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'active' | 'past'>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings?userId=${user.id}&role=seeker`);
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
  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const active = bookings.filter(b => b.status === 'in_progress');
  const past = bookings.filter(b => ['completed', 'cancelled', 'disputed'].includes(b.status));

  const filteredBookings = activeFilter === 'upcoming' ? upcoming
    : activeFilter === 'active' ? active
    : activeFilter === 'past' ? past
    : bookings;

  // Actions
  const handleCancel = async () => {
    if (!actionBookingId) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/bookings/${actionBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Maombi yameghairiwa' : 'Booking cancelled');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kughairi' : 'Failed to cancel');
    } finally {
      setIsActioning(false);
      setCancelDialogOpen(false);
      setCancelReason('');
      setActionBookingId(null);
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

  const handleComplete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(sw ? 'Kikao kimemalizika!' : 'Session completed!');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to complete');
      }
    } catch {
      toast.error(sw ? 'Imeshindwa kukamilisha' : 'Failed to complete');
    }
  };

  const handleReview = async () => {
    if (!actionBookingId) return;
    setIsActioning(true);
    try {
      // Submit review via reviews API
      toast.success(sw ? 'Asante kwa tathmini yako!' : 'Thank you for your review!');
    } catch {
      toast.error(sw ? 'Imeshindwa kuwasilisha tathmini' : 'Failed to submit review');
    } finally {
      setIsActioning(false);
      setReviewDialogOpen(false);
      setReviewRating(5);
      setReviewText('');
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
              {sw ? 'Maombi Yangu' : 'My Bookings'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sw ? 'Dhibiti maombi yako ya mwongozo' : 'Manage your guide bookings'}
            </p>
          </div>
        </div>

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
              {sw ? 'Hakuna maombi' : 'No bookings yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {sw ? 'Pata mwongozo na anza kutembelea Kariakoo!' : 'Find a guide and start exploring Kariakoo!'}
            </p>
          </motion.div>
        )}

        {/* Bookings List */}
        {!isLoading && filteredBookings.length > 0 && (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  lang={lang}
                  isExpanded={expandedBooking === booking.id}
                  onToggle={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                  onCancel={(id) => { setActionBookingId(id); setCancelDialogOpen(true); }}
                  onDispute={(id) => { setActionBookingId(id); setDisputeDialogOpen(true); }}
                  onComplete={handleComplete}
                  onReview={(id) => { setActionBookingId(id); setReviewDialogOpen(true); }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              {sw ? 'Ghairi Maombi' : 'Cancel Booking'}
            </DialogTitle>
            <DialogDescription>
              {sw ? 'Kwa nini unataka kughairi? Hii haitaweza kubadilishwa.' : 'Why are you cancelling? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={sw ? 'Sababu ya kughairi (si lazima)...' : 'Reason for cancellation (optional)...'}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isActioning}>
              {sw ? 'Rudi' : 'Go Back'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              {sw ? 'Ghairi' : 'Cancel Booking'}
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
              {sw ? 'Timu yetu itakagua ndani ya masaa 24. Malipo yako yatahifadhiwa.' : 'Our team will review within 24 hours. Your payment will be held in escrow.'}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {sw ? 'Tathmini Mwongozo' : 'Rate Your Guide'}
            </DialogTitle>
            <DialogDescription>
              {sw ? 'Jumuisha maoni yako kusaidia wengine' : 'Share your experience to help others'}
            </DialogDescription>
          </DialogHeader>
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1 py-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setReviewRating(star)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= reviewRating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder={sw ? 'Maoni yako (si lazima)...' : 'Your feedback (optional)...'}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isActioning}>
              {sw ? 'Rudi' : 'Go Back'}
            </Button>
            <Button
              className="bg-[#065F46] hover:bg-[#064E3B] text-white"
              onClick={handleReview}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Star className="w-4 h-4 mr-1" />}
              {sw ? 'Wasilisha Tathmini' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
