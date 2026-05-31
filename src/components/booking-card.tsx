'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Star, ChevronDown, X,
  CheckCircle2, Timer, AlertTriangle, Shield, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Language } from '@/lib/i18n';

// ── Types ──
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'escrow';

export interface Booking {
  id: string;
  seekerId: string;
  guideId: string;
  guideName?: string;
  seekerName?: string;
  guideAvatar?: string | null;
  seekerAvatar?: string | null;
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
export function formatTZS(amount: number, lang: Language): string {
  return `TZS ${new Intl.NumberFormat(lang === 'sw' ? 'sw-TZ' : 'en-US').format(amount)}`;
}

export function formatDate(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

export function timeAgo(dateStr: string, lang: Language): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'sw' ? 'Sasa hivi' : 'Just now';
  if (mins < 60) return lang === 'sw' ? `Dakika ${mins} iliyopita` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'sw' ? `Saa ${hrs} iliyopita` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return lang === 'sw' ? `Siku ${days} iliyopita` : `${days}d ago`;
}

// ── Status Badge Component ──
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
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
  const sw = false; // Will use the lang prop pattern instead

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
export function PaymentBadge({ status }: { status: PaymentStatus }) {
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

// ── Seeker Booking Card ──
export function SeekerBookingCard({
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
  const guideName = booking.guideName || 'Guide';
  const guideRating = booking.guideRating || 4.5;
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#065F46] to-[#34D399] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {guideName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
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
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.scheduledDate, lang)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(booking.scheduledTime)}</span>
              <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{booking.duration}h</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
              <span className="truncate">{booking.zone}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">{formatTZS(booking.totalAmount, lang)}</span>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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
              <div className="flex items-center justify-between">
                <PaymentBadge status={booking.paymentStatus} />
                <span className="text-xs text-muted-foreground">{sw ? 'Malipo' : 'Payment'}: {booking.paymentMethod.toUpperCase()}</span>
              </div>
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
              {booking.notes && (
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">{sw ? 'Maelezo' : 'Notes'}:</span>
                  <p className="mt-0.5 text-foreground">{booking.notes}</p>
                </div>
              )}
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground font-medium">{sw ? 'Muda' : 'Timeline'}:</span>
                <div className="space-y-1 pl-2 border-l-2 border-[#065F46]/20 dark:border-[#34D399]/20">
                  <p className="text-muted-foreground pl-2">{sw ? 'Iliundwa' : 'Created'}: {timeAgo(booking.createdAt, lang)}</p>
                  {booking.confirmedAt && <p className="text-emerald-600 dark:text-emerald-400 pl-2">{sw ? 'Imethibitishwa' : 'Confirmed'}: {timeAgo(booking.confirmedAt, lang)}</p>}
                  {booking.startedAt && <p className="text-sky-600 dark:text-sky-400 pl-2">{sw ? 'Ilianza' : 'Started'}: {timeAgo(booking.startedAt, lang)}</p>}
                  {booking.completedAt && <p className="text-gray-600 dark:text-gray-400 pl-2">{sw ? 'Imekamilika' : 'Completed'}: {timeAgo(booking.completedAt, lang)}</p>}
                  {booking.cancelledAt && <p className="text-red-600 dark:text-red-400 pl-2">{sw ? 'Imeghairiwa' : 'Cancelled'}: {timeAgo(booking.cancelledAt, lang)}{booking.cancellationReason ? ` — ${booking.cancellationReason}` : ''}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {booking.status === 'pending' && (
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onCancel(booking.id)}>
                    <X className="w-3 h-3 mr-1" />{sw ? 'Ghairi' : 'Cancel'}
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onCancel(booking.id)}>
                    <X className="w-3 h-3 mr-1" />{sw ? 'Ghairi' : 'Cancel'}
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <>
                    <Button size="sm" className="bg-[#065F46] hover:bg-[#064E3B] text-white" onClick={() => onComplete(booking.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />{sw ? 'Kamilisha' : 'Complete'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30" onClick={() => onDispute(booking.id)}>
                      <AlertTriangle className="w-3 h-3 mr-1" />{sw ? 'Lalamika' : 'Dispute'}
                    </Button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <Button size="sm" className="bg-[#065F46] hover:bg-[#064E3B] text-white" onClick={() => onReview(booking.id)}>
                    <Star className="w-3 h-3 mr-1" />{sw ? 'Tathmini' : 'Review'}
                  </Button>
                )}
                {booking.status === 'disputed' && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                    <Shield className="w-3.5 h-3.5" />{sw ? 'Timu yetu inakagua' : 'Our team is reviewing'}
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

// ── Guide Booking Card ──
export function GuideBookingCard({
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
  const seekerName = booking.seekerName || 'Seeker';
  const sw = lang === 'sw';

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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {seekerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{seekerName}</p>
                  {urgency === 'new' && booking.status === 'pending' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">NEW</span>
                  )}
                </div>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.scheduledDate, lang)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(booking.scheduledTime)}</span>
              <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{booking.duration}h</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
              <span className="truncate">{booking.zone}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatTZS(booking.guidePayout, lang)}</span>
                <span className="text-[10px] text-muted-foreground">{sw ? 'baada ya ada' : 'after fee'}</span>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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
              <div className="flex items-center justify-between">
                <PaymentBadge status={booking.paymentStatus} />
                <span className="text-xs text-muted-foreground">{booking.paymentMethod.toUpperCase()}</span>
              </div>
              <div className="bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Malipo ya muombaji' : 'Seeker pays'}</span>
                  <span className="font-medium">{formatTZS(booking.totalAmount, lang)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sw ? 'Ada ya jukwaa (15%)' : 'Platform fee (15%)'}</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">-{formatTZS(booking.platformFee, lang)}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{sw ? 'Wewe unapata' : 'You earn'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatTZS(booking.guidePayout, lang)}</span>
                </div>
              </div>
              {booking.notes && (
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">{sw ? 'Maombi ya muombaji' : 'Seeker request'}:</span>
                  <p className="mt-0.5 text-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900">{booking.notes}</p>
                </div>
              )}
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground font-medium">{sw ? 'Muda' : 'Timeline'}:</span>
                <div className="space-y-1 pl-2 border-l-2 border-[#065F46]/20 dark:border-[#34D399]/20">
                  <p className="text-muted-foreground pl-2">{sw ? 'Iliundwa' : 'Created'}: {timeAgo(booking.createdAt, lang)}</p>
                  {booking.confirmedAt && <p className="text-emerald-600 dark:text-emerald-400 pl-2">{sw ? 'Imethibitishwa' : 'Confirmed'}: {timeAgo(booking.confirmedAt, lang)}</p>}
                  {booking.startedAt && <p className="text-sky-600 dark:text-sky-400 pl-2">{sw ? 'Ilianza' : 'Started'}: {timeAgo(booking.startedAt, lang)}</p>}
                  {booking.completedAt && <p className="text-gray-600 dark:text-gray-400 pl-2">{sw ? 'Imekamilika' : 'Completed'}: {timeAgo(booking.completedAt, lang)}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {booking.status === 'pending' && (
                  <>
                    <Button size="sm" className="bg-[#065F46] hover:bg-[#064E3B] text-white flex-1" onClick={(e) => { e.stopPropagation(); onConfirm(booking.id); }}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />{sw ? 'Kubali' : 'Accept'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 flex-1" onClick={(e) => { e.stopPropagation(); onDecline(booking.id); }}>
                      <X className="w-3 h-3 mr-1" />{sw ? 'Kataa' : 'Decline'}
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={(e) => { e.stopPropagation(); onStart(booking.id); }}>
                    <Timer className="w-3 h-3 mr-1" />{sw ? 'Anza Kikao' : 'Start Session'}
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <>
                    <Button size="sm" className="bg-[#065F46] hover:bg-[#064E3B] text-white" onClick={(e) => { e.stopPropagation(); onComplete(booking.id); }}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />{sw ? 'Maliza Kikao' : 'End Session'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30" onClick={(e) => { e.stopPropagation(); onDispute(booking.id); }}>
                      <AlertTriangle className="w-3 h-3 mr-1" />{sw ? 'Lalamika' : 'Dispute'}
                    </Button>
                  </>
                )}
                {booking.status === 'disputed' && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                    <Shield className="w-3.5 h-3.5" />{sw ? 'Timu inakagua - malipo yamehifadhiwa' : 'Team reviewing - payment held'}
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
