'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar, Clock, Star, X, AlertTriangle, CheckCircle2,
  Loader2, Timer, ArrowLeft, Wallet, Scissors, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GuideBookingCard, Booking, formatTZS } from '@/components/booking-card';

// ── Earnings Summary Card ──
function EarningsSummary({ bookings, lang }: { bookings: Booking[]; lang: Language }) {
  const sw = lang === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
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
          <h3 className="text-sm font-semibold text-white">{l('Earnings Summary', 'Muhtasari wa Mapato')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium">{l('Total Earned', 'Jumla Imepatikana')}</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatTZS(totalEarned, lang)}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium">{l('In Escrow', 'Kwenye Dhamana')}</p>
            <p className="text-lg font-bold text-sky-300 mt-0.5">{formatTZS(inEscrow, lang)}</p>
          </div>
        </div>
      </div>
      <div className="p-3 bg-[#ECFDF5] dark:bg-[#064E3B]/30 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{l('Gross total', 'Jumla halisi')}</span>
          <span className="font-medium">{formatTZS(totalGross, lang)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            {l('Platform fee (15%)', 'Ada ya jukwaa (15%)')}
          </span>
          <span className="font-medium text-amber-600 dark:text-amber-400">-{formatTZS(totalFees, lang)}</span>
        </div>
        <div className="border-t border-emerald-200 dark:border-emerald-800 pt-1.5 flex justify-between text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{l('Your earnings', 'Mapato yako')}</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatTZS(totalEarned, lang)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page Component ──
export default function GuideBookingsPage() {
  const { user, language } = useAuthStore();
  const lang = language as Language;
  const sw = lang === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'active' | 'completed'>('all');
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
      toast.error(l('Failed to load bookings', 'Imeshindwa kupakia maombi'));
    } finally {
      setIsLoading(false);
    }
  }, [user, sw]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Derived data
  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const active = bookings.filter(b => b.status === 'in_progress');
  const completed = bookings.filter(b => ['completed', 'cancelled', 'disputed'].includes(b.status));

  const filteredBookings = activeFilter === 'pending' ? pending
    : activeFilter === 'confirmed' ? confirmed
    : activeFilter === 'active' ? active
    : activeFilter === 'completed' ? completed
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
        toast.success(l('Booking confirmed! Payment held in escrow.', 'Maombi yamethibitishwa! Malipo yamehifadhiwa.'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to confirm');
      }
    } catch {
      toast.error(l('Failed to confirm', 'Imeshindwa kuthibitisha'));
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
        toast.success(l('Booking declined', 'Maombi yamekataliwa'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to decline');
      }
    } catch {
      toast.error(l('Failed to decline', 'Imeshindwa kukataa'));
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
        toast.success(l('Session started! Enjoy your Kariakoo experience.', 'Kikao kimeanza! Furahia uzoefu wa Kariakoo.'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to start');
      }
    } catch {
      toast.error(l('Failed to start', 'Imeshindwa kuanza'));
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
        toast.success(l('Session completed! Payment released.', 'Kikao kimemalizika! Malipo yameachiliwa.'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to complete');
      }
    } catch {
      toast.error(l('Failed to complete', 'Imeshindwa kukamilisha'));
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
        toast.success(l('Dispute filed', 'Mgomvo umewasilishwa'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to dispute');
      }
    } catch {
      toast.error(l('Failed to file dispute', 'Imeshindwa kuwasilisha mgomvo'));
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
              {l('Guide Bookings', 'Maombi ya Mwongozo')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('Manage your bookings and sessions', 'Dhibiti maombi na vikao vyako')}
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
                  {pending.length} {l(pending.length === 1 ? 'request waiting' : 'requests waiting', pending.length === 1 ? 'ombi unangoja' : 'maombi yanangoja')}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {l('Accept or decline quickly', 'Kubali au kataa haraka')}
                </p>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setActiveFilter('pending')}>
                {l('View', 'Tazama')}
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
                  {l('Session in progress!', 'Kikao kinaendelea!')}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  {active[0].zone} · {active[0].seekerName}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: l('All', 'Zote'), count: bookings.length },
            { key: 'pending' as const, label: l('Pending', 'Zinangoja'), count: pending.length },
            { key: 'confirmed' as const, label: l('Confirmed', 'Zilizothibitishwa'), count: confirmed.length },
            { key: 'active' as const, label: l('Active', 'Aktivi'), count: active.length },
            { key: 'completed' as const, label: l('Completed', 'Zilizokamilika'), count: completed.length },
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
                activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
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
                ? l('No pending requests', 'Hakuna maombi yanangoja')
                : activeFilter === 'active'
                ? l('No active sessions', 'Hakuna vikao vinavyoendelea')
                : l('No bookings yet', 'Hakuna maombi')
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {l('Go online to receive more requests!', 'Kuwa mtandaoni kupata maombi zaidi!')}
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
              {l('Decline Booking', 'Kataa Maombi')}
            </DialogTitle>
            <DialogDescription>
              {l('Why are you declining?', 'Kwa nini unataka kukataa?')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={l('Reason for declining (optional)...', 'Sababu ya kukataa (si lazima)...')}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)} disabled={isActioning}>
              {l('Go Back', 'Rudi')}
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={isActioning}>
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              {l('Decline', 'Kataa')}
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
              {l('File Dispute', 'Lalamika')}
            </DialogTitle>
            <DialogDescription>
              {l('Our team will review within 24 hours. Payment will be held in escrow.', 'Timu yetu itakagua ndani ya masaa 24. Malipo yatahifadhiwa kwenye dhamana.')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={l('Describe the issue...', 'Eleza tatizo lako...')}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} disabled={isActioning}>
              {l('Go Back', 'Rudi')}
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleDispute} disabled={isActioning || !disputeReason.trim()}>
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
              {l('File Dispute', 'Wasilisha Mgomvo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
