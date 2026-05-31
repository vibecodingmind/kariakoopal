'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MapPin, Star, Clock, MessageSquare, ShieldCheck,
  Phone, AlertTriangle, CheckCircle2, QrCode, Navigation,
  Wallet, Calendar, Timer, X, ChevronRight, Circle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── Types ──
type SessionStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

interface SessionData {
  id: string;
  seekerId: string;
  seekerName: string;
  guideId: string;
  guideName: string;
  guideRating: number;
  guidePhone: string;
  status: SessionStatus;
  scheduledDate: string;
  scheduledTime: string;
  endTime: string;
  duration: number;
  zone: string;
  notes: string;
  sessionCode: string;
  totalAmount: number;
  platformFee: number;
  guidePayout: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  ratingSeeker?: number | null;
  reviewSeeker?: string | null;
  messages: Array<{ id: string; senderId: string; content: string; createdAt: string }>;
}

// ── Status Timeline ──
function StatusTimeline({ status, lang }: { status: SessionStatus; lang: string }) {
  const sw = lang === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const steps = [
    { key: 'pending', label: l('Requested', 'Iliombwa'), icon: Clock },
    { key: 'confirmed', label: l('Confirmed', 'Imethibitishwa'), icon: CheckCircle2 },
    { key: 'in_progress', label: l('In Progress', 'Inaendelea'), icon: Timer },
    { key: 'completed', label: l('Completed', 'Imekamilika'), icon: CheckCircle2 },
  ];

  const statusOrder: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    in_progress: 2,
    completed: 3,
    cancelled: -1,
    disputed: -1,
  };

  const currentIndex = statusOrder[status] ?? 0;
  const isCancelled = status === 'cancelled';
  const isDisputed = status === 'disputed';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <X className="w-5 h-5 text-red-500" />
        <span className="text-sm font-semibold text-red-700 dark:text-red-300">{l('Booking Cancelled', 'Maombi Yamighairiwa')}</span>
      </div>
    );
  }

  if (isDisputed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">{l('Dispute Filed', 'Mgomvo Umewasilishwa')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between relative">
      {/* Background line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E2E8F0] dark:bg-[#334155]" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-[#065F46] dark:bg-[#34D399] transition-all duration-500"
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="relative flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted
                  ? 'bg-[#065F46] dark:bg-[#34D399] border-[#065F46] dark:border-[#34D399] text-white'
                  : 'bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#94A3B8]'
              } ${isCurrent ? 'ring-4 ring-[#065F46]/20 dark:ring-[#34D399]/20' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[10px] font-medium mt-1.5 ${isCompleted ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#94A3B8]'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page Component ──
export default function SessionPage() {
  const { user, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Get session ID from URL
  const sessionId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

  // Fetch session details
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${sessionId}`);
      const data = await res.json();
      if (data.success && data.booking) {
        setSession(data.booking);
        // Set up chat messages from session
        if (data.booking.messages && data.booking.messages.length > 0) {
          setChatMessages(data.booking.messages.map((m: { id: string; senderId: string; content: string; createdAt: string }) => ({
            id: m.id,
            sender: m.senderId === user?.id ? 'seeker' : 'guide',
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        } else {
          setChatMessages([
            { id: '1', sender: 'guide', text: 'Karibu! I\'m at the main entrance. Where are you?', time: '10:05 AM' },
            { id: '2', sender: 'seeker', text: 'I\'m near Stall B-10. I can see the blue sign.', time: '10:07 AM' },
            { id: '3', sender: 'guide', text: 'Perfect! Walk towards the big yellow umbrella — I\'m right there.', time: '10:08 AM' },
          ]);
        }
      }
    } catch {
      toast.error(l('Failed to load session', 'Imeshindwa kupakia kikao'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user, sw]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'seeker',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setMessage('');
  };

  const handleSubmitReview = async () => {
    if (!sessionId) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/bookings/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review_seeker', rating: reviewRating, review: reviewText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(l('Thank you for your review!', 'Asante kwa tathmini yako!'));
        setShowReview(false);
        fetchSession();
      }
    } catch {
      toast.error(l('Failed to submit review', 'Imeshindwa kuwasilisha tathmini'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="kcard-green p-4 h-32 animate-pulse" />
        <div className="kcard p-4 h-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <div key={i} className="kcard p-3 h-16 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const status = session?.status || 'confirmed';
  const isActive = status === 'in_progress';
  const isCompleted = status === 'completed';
  const canReview = isCompleted && !session?.ratingSeeker;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0A4D3A]">
          <ArrowLeft className="w-4 h-4" /> {l('Back', 'Rudi')}
        </button>
      </motion.div>

      {/* Session Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {isActive && (
              <>
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-dot" />
                <span className="text-xs text-white font-medium">{l('LIVE SESSION', 'KIPINDI CHA MOJA KWA MOJA')}</span>
              </>
            )}
            {isCompleted && (
              <span className="text-xs text-white/70 font-medium">{l('SESSION COMPLETED', 'KIPINDI KIMEKAMILIKA')}</span>
            )}
            {status === 'pending' && (
              <span className="text-xs text-white/70 font-medium">{l('AWAITING CONFIRMATION', 'INASUBIRI KUTHIBITISHWA')}</span>
            )}
            {status === 'confirmed' && (
              <span className="text-xs text-white/70 font-medium">{l('SESSION CONFIRMED', 'KIPINDI KIMETHIBITISHWA')}</span>
            )}
          </div>
          <span className={`kbadge ${isActive ? 'kbadge-live' : isCompleted ? 'kbadge-verified' : 'kbadge-pending'}`}>
            {isActive ? l('ACTIVE', 'INAENDA') : isCompleted ? l('DONE', 'IMEKAMILIKA') : l('PENDING', 'INASUBIRI')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#065F46] font-bold">
            {(session?.guideName || 'MJ').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-white font-bold">{session?.guideName || 'Mwanaildi Juma'}</p>
            <p className="text-white/60 text-xs flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />{session?.guideRating || 4.8}</span>
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{session?.zone || 'Fabrics Zone'}</span>
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{session?.duration || 2}h</span>
            </p>
          </div>
        </div>
        <div className="mt-3 p-2 rounded-lg bg-white/10 flex items-center justify-between">
          <span className="text-xs text-white/60">{l('Escrow:', 'Escrow:')} TZS {(session?.totalAmount || 25000).toLocaleString()}</span>
          <span className="kbadge kbadge-gold text-[8px]">
            {session?.paymentStatus === 'released' || session?.paymentStatus === 'paid'
              ? l('RELEASED', 'IMEACHILIWA')
              : l('HELD', 'IMEHIFADHIWA')
            }
          </span>
        </div>
      </motion.div>

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-4">{l('Status', 'Hali')}</h3>
        <StatusTimeline status={status} lang={language} />
      </motion.div>

      {/* Booking Details */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4 space-y-3">
        <h3 className="font-semibold text-sm">{l('Booking Details', 'Maelezo ya Maombi')}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            <div>
              <p className="text-[10px] text-muted-foreground">{l('Date', 'Tarehe')}</p>
              <p className="font-medium">{session?.scheduledDate || 'Jun 5, 2026'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            <div>
              <p className="text-[10px] text-muted-foreground">{l('Time', 'Wakati')}</p>
              <p className="font-medium">{session?.scheduledTime || '10:00 AM'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            <div>
              <p className="text-[10px] text-muted-foreground">{l('Zone', 'Eneo')}</p>
              <p className="font-medium">{session?.zone || 'Electronics Zone'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            <div>
              <p className="text-[10px] text-muted-foreground">{l('Amount', 'Kiasi')}</p>
              <p className="font-bold text-[#065F46] dark:text-[#34D399]">TZS {(session?.totalAmount || 35000).toLocaleString()}</p>
            </div>
          </div>
        </div>
        {session?.notes && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
            <p className="text-xs font-medium text-muted-foreground">{l('Notes', 'Maelezo')}</p>
            <p className="text-sm mt-0.5">{session.notes}</p>
          </div>
        )}
      </motion.div>

      {/* Chat */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
          <MessageSquare className="w-4 h-4 text-[#065F46]" />
          {l('Chat with Guide', 'Mazungumzo na Mwongozo')}
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'seeker' ? 'justify-end' : 'justify-start'}`}>
              <div className={msg.sender === 'seeker' ? 'kchat-seeker' : 'kchat-guide'}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-[10px] mt-1 opacity-60">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={l('Type a message...', 'Andika ujumbe...')}
            className="kinput flex-1"
            onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button onClick={handleSendMessage} className="kbtn px-3">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* QR Check-in & Live Location */}
      {isActive && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <button className="kcard p-4 text-center hover:shadow-md transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-[#065F46]/10 dark:bg-[#34D399]/10 flex items-center justify-center mx-auto mb-2">
              <QrCode className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
            </div>
            <span className="text-xs font-semibold">{l('QR Check-in', 'QR Kuingia')}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{session?.sessionCode || 'SES-XXXX'}</p>
          </button>
          <button className="kcard p-4 text-center hover:shadow-md transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-2">
              <Navigation className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-xs font-semibold">{l('Live Location', 'Eneo la Moja kwa Moja')}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{l('Share location', 'Shiriki eneo')}</p>
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95">
          <Phone className="w-5 h-5 text-[#065F46] dark:text-[#34D399] mx-auto mb-1" />
          <span className="text-[10px] font-medium">{l('Call', 'Piga')}</span>
        </button>
        <button className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] mx-auto mb-1" />
          <span className="text-[10px] font-medium">{l('Emergency', 'Dharura')}</span>
        </button>
        {isActive && (
          <button
            className="kcard p-3 text-center hover:shadow-md transition-all active:scale-95"
            onClick={async () => {
              try {
                const res = await fetch(`/api/bookings/${sessionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete' }),
                });
                const data = await res.json();
                if (data.success) {
                  toast.success(l('Session completed!', 'Kikao kimemalizika!'));
                  fetchSession();
                }
              } catch {
                toast.error(l('Failed to complete', 'Imeshindwa kukamilisha'));
              }
            }}
          >
            <CheckCircle2 className="w-5 h-5 text-[#10B981] mx-auto mb-1" />
            <span className="text-[10px] font-medium">{l('Complete', 'Kamilisha')}</span>
          </button>
        )}
        {!isActive && (
          <button className="kcard p-3 text-center">
            <ShieldCheck className="w-5 h-5 text-[#64748B] mx-auto mb-1" />
            <span className="text-[10px] font-medium">{l('Support', 'Msaada')}</span>
          </button>
        )}
      </div>

      {/* Payment Status */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#065F46]" />
          {l('Payment Status', 'Hali ya Malipo')}
        </h3>
        <div className="bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{l('Total', 'Jumla')}</span>
            <span className="font-medium">TZS {(session?.totalAmount || 35000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{l('Platform fee (15%)', 'Ada ya jukwaa (15%)')}</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">-TZS {(session?.platformFee || 5250).toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">{l('Guide payout', 'Malipo ya mwongozo')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">TZS {(session?.guidePayout || 29750).toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          <span className="text-muted-foreground">
            {session?.paymentStatus === 'released' || session?.paymentStatus === 'paid'
              ? l('Payment released to guide', 'Malipo yameachiliwa kwa mwongozo')
              : l('Payment held in escrow for your protection', 'Malipo yamehifadhiwa kwa ulinzi wako')
            }
          </span>
        </div>
      </motion.div>

      {/* Review/Rating Section */}
      {canReview && !showReview && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
          <h3 className="font-semibold text-sm mb-2">{l('Rate Your Experience', 'Tathmini Uzoefu Wako')}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {l('How was your session with this guide?', 'Uzoefu wako na mwongozo huu ulikuwaje?')}
          </p>
          <Button
            className="w-full bg-[#065F46] hover:bg-[#064E3B] text-white"
            onClick={() => setShowReview(true)}
          >
            <Star className="w-4 h-4 mr-2" />
            {l('Leave a Review', 'acha Tathmini')}
          </Button>
        </motion.div>
      )}

      {showReview && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4 space-y-4">
          <h3 className="font-semibold text-sm">{l('Rate Your Guide', 'Tathmini Mwongozo')}</h3>
          <div className="flex items-center justify-center gap-1 py-2">
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
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder={l('Your feedback (optional)...', 'Maoni yako (si lazima)...')}
            className="kinput w-full"
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowReview(false)}>
              {l('Cancel', 'Ghairi')}
            </Button>
            <Button
              className="flex-1 bg-[#065F46] hover:bg-[#064E3B] text-white"
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? <Circle className="w-4 h-4 mr-1 animate-spin" /> : <Star className="w-4 h-4 mr-1" />}
              {l('Submit', 'Wasilisha')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Existing Review */}
      {session?.ratingSeeker && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-4">
          <h3 className="font-semibold text-sm mb-2">{l('Your Review', 'Tathmini Yako')}</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={`w-4 h-4 ${star <= (session.ratingSeeker || 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
            ))}
          </div>
          {session.reviewSeeker && (
            <p className="text-sm text-muted-foreground">{session.reviewSeeker}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
