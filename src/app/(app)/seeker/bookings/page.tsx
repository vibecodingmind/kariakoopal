'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Language } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar, Clock, Star, X, AlertTriangle, CheckCircle2,
  Loader2, Timer, MessageSquare, ArrowLeft, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SeekerBookingCard, Booking, BookingStatus } from '@/components/booking-card';
import { useRouter } from 'next/navigation';

// ── Main Page Component ──
export default function SeekerBookingsPage() {
  const { user, language } = useAuthStore();
  const lang = language as Language;
  const sw = lang === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'>('all');
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
      toast.error(l('Failed to load bookings', 'Imeshindwa kupakia maombi'));
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
  const completed = bookings.filter(b => b.status === 'completed');
  const cancelled = bookings.filter(b => ['cancelled', 'disputed'].includes(b.status));

  const filteredBookings = activeFilter === 'upcoming' ? upcoming
    : activeFilter === 'active' ? active
    : activeFilter === 'completed' ? completed
    : activeFilter === 'cancelled' ? cancelled
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
        toast.success(l('Booking cancelled', 'Maombi yameghairiwa'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch {
      toast.error(l('Failed to cancel', 'Imeshindwa kughairi'));
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

  const handleComplete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(l('Session completed!', 'Kikao kimemalizika!'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to complete');
      }
    } catch {
      toast.error(l('Failed to complete', 'Imeshindwa kukamilisha'));
    }
  };

  const handleReview = async () => {
    if (!actionBookingId) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/bookings/${actionBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review_seeker', rating: reviewRating, review: reviewText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(l('Thank you for your review!', 'Asante kwa tathmini yako!'));
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error(l('Failed to submit review', 'Imeshindwa kuwasilisha tathmini'));
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
          <div className="flex-1">
            <h1 className="text-xl font-bold gradient-text-green">
              {l('My Bookings', 'Maombi Yangu')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('Manage your guide bookings', 'Dhibiti maombi yako ya mwongozo')}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-[#065F46] hover:bg-[#064E3B] text-white"
            onClick={() => router.push('/guides')}
          >
            <Search className="w-3 h-3 mr-1" />
            {l('Book a Guide', 'Pata Mwongozo')}
          </Button>
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
                  {l('Session in progress!', 'Kikao kinaendelea!')}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  {active[0].zone} · {active[0].guideName}
                </p>
              </div>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={() => router.push(`/seeker/session/${active[0].id}`)}>
                {l('View', 'Tazama')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: l('All', 'Zote'), count: bookings.length },
            { key: 'upcoming' as const, label: l('Upcoming', 'Zijazo'), count: upcoming.length },
            { key: 'active' as const, label: l('Active', 'Aktivi'), count: active.length },
            { key: 'completed' as const, label: l('Completed', 'Zilizokamilika'), count: completed.length },
            { key: 'cancelled' as const, label: l('Cancelled', 'Zilizoghairiwa'), count: cancelled.length },
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
              {l('No bookings yet', 'Hakuna maombi')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {l('Find a guide and start exploring Kariakoo!', 'Pata mwongozo na anza kutembelea Kariakoo!')}
            </p>
            <Button
              className="mt-4 bg-[#065F46] hover:bg-[#064E3B] text-white"
              onClick={() => router.push('/guides')}
            >
              <Search className="w-4 h-4 mr-2" />
              {l('Find a Guide', 'Tafuta Mwongozo')}
            </Button>
          </motion.div>
        )}

        {/* Bookings List */}
        {!isLoading && filteredBookings.length > 0 && (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map(booking => (
                <SeekerBookingCard
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
              {l('Cancel Booking', 'Ghairi Maombi')}
            </DialogTitle>
            <DialogDescription>
              {l('Why are you cancelling? This action cannot be undone.', 'Kwa nini unataka kughairi? Hii haitaweza kubadilishwa.')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={l('Reason for cancellation (optional)...', 'Sababu ya kughairi (si lazima)...')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isActioning}>
              {l('Go Back', 'Rudi')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isActioning}>
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              {l('Cancel Booking', 'Ghairi')}
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
              {l('Our team will review within 24 hours. Your payment will be held in escrow.', 'Timu yetu itakagua ndani ya masaa 24. Malipo yako yatahifadhiwa.')}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {l('Rate Your Guide', 'Tathmini Mwongozo')}
            </DialogTitle>
            <DialogDescription>
              {l('Share your experience to help others', 'Jumuisha maoni yako kusaidia wengine')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-1 py-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setReviewRating(star)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder={l('Your feedback (optional)...', 'Maoni yako (si lazima)...')}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isActioning}>
              {l('Go Back', 'Rudi')}
            </Button>
            <Button className="bg-[#065F46] hover:bg-[#064E3B] text-white" onClick={handleReview} disabled={isActioning}>
              {isActioning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Star className="w-4 h-4 mr-1" />}
              {l('Submit Review', 'Wasilisha Tathmini')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
