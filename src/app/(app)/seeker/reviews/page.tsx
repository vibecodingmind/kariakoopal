'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Star, MessageSquare, PenLine, X, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Demo fallback data ──
const DEMO_REVIEWS = [
  { id: 'r1', guideName: 'Mwanaildi J.', guideZone: 'fabrics', rating: 5, text: 'Excellent guide! Helped me find the best kanga at half the price I would have paid alone. Very knowledgeable about fabric quality.', date: '2025-05-28', session: '2h Fabrics Tour', revieweeId: 'u1' },
  { id: 'r2', guideName: 'Asha Mohamed', guideZone: 'wholesale', rating: 5, text: 'Asha knows every wholesale dealer. Saved me over 200K TZS on my bulk purchase. Highly recommended!', date: '2025-05-25', session: '3h Wholesale Run', revieweeId: 'u1' },
  { id: 'r3', guideName: 'Halima Abdi', guideZone: 'kitchenware', rating: 4, text: 'Good guide for kitchen items. A bit rushed at the end but overall helpful in finding quality pots.', date: '2025-05-22', session: '1.5h Kitchen Tour', revieweeId: 'u1' },
  { id: 'r4', guideName: 'Joseph Mtei', guideZone: 'spices', rating: 5, text: 'The spice market is overwhelming without a guide. Joseph made it easy and I got amazing deals on cardamom.', date: '2025-05-20', session: '2h Spice Market', revieweeId: 'u1' },
  { id: 'r5', guideName: 'Fatma Hassan', guideZone: 'electronics', rating: 3, text: 'Decent experience but she seemed distracted. Still helped me avoid tourist trap prices on a phone.', date: '2025-05-18', session: '1h Electronics Quick', revieweeId: 'u1' },
  { id: 'r6', guideName: 'Mwanaildi J.', guideZone: 'fabrics', rating: 4, text: 'Second time with Mwanaildi. Still great at negotiating but the market was very crowded this time.', date: '2025-05-15', session: '2h Fabrics Return', revieweeId: 'u1' },
  { id: 'r7', guideName: 'Asha Mohamed', guideZone: 'wholesale', rating: 5, text: 'Came back for another wholesale trip. Asha remembered my preferences and found even better deals!', date: '2025-05-10', session: '4h Full Wholesale', revieweeId: 'u1' },
  { id: 'r8', guideName: 'Halima Abdi', guideZone: 'kitchenware', rating: 4, text: 'Very patient and thorough. Showed me comparison shopping between different stalls.', date: '2025-05-05', session: '2h Kitchen Deep Dive', revieweeId: 'u1' },
];

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0891B2', fabrics: '#7C3AED', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#F59E0B', artisanal: '#8B5E3C',
};

// ── Review type from API ──
interface ApiReview {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewerName?: string;
  revieweeId: string;
  revieweeName?: string;
  rating: number;
  comment: string;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Skeleton component for loading ──
function ReviewSkeleton() {
  return (
    <div className="kcard p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#334155]" />
        <div className="flex-1">
          <div className="h-3.5 w-28 rounded bg-[#E2E8F0] dark:bg-[#334155] mb-1.5" />
          <div className="h-2.5 w-20 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
        </div>
        <div className="h-2.5 w-16 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-[#E2E8F0] dark:bg-[#334155]" />
        <div className="h-3 w-3/4 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [hoverStar, setHoverStar] = useState(0);

  // ── API state ──
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [avgRating, setAvgRating] = useState('0.0');
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seeker') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  // ── Fetch reviews from API ──
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?reviewerId=${user?.id || 'demo'}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAvgRating(String(data.averageRating || '0.0'));
        setTotalReviews(data.totalReviews || 0);
      } else {
        throw new Error('API failed');
      }
    } catch {
      // Fall back to demo data
      setReviews(
        DEMO_REVIEWS.map(r => ({
          id: r.id,
          sessionId: `s-${r.id}`,
          reviewerId: user?.id || 'demo',
          revieweeId: r.revieweeId,
          revieweeName: r.guideName,
          rating: r.rating,
          comment: r.text,
          createdAt: new Date(r.date).toISOString(),
          updatedAt: new Date(r.date).toISOString(),
        }))
      );
      const demoAvg = (DEMO_REVIEWS.reduce((a, r) => a + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1);
      setAvgRating(demoAvg);
      setTotalReviews(DEMO_REVIEWS.length);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'seeker') {
      fetchReviews();
    }
  }, [isAuthenticated, user, fetchReviews]);

  // ── Submit review via API ──
  const handleSubmit = async () => {
    if (!formRating || !formText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `s-new-${Date.now()}`,
          reviewerId: user?.id || 'demo',
          revieweeId: 'u1', // Default guide for demo
          rating: formRating,
          comment: formText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          setReviews(prev => [data.review, ...prev]);
          setTotalReviews(prev => prev + 1);
          const newAvg = reviews.length > 0
            ? ((reviews.reduce((a, r) => a + r.rating, 0) + formRating) / (reviews.length + 1)).toFixed(1)
            : formRating.toFixed(1);
          setAvgRating(newAvg);
        }
        setSubmitSuccess(true);
        setFormRating(0);
        setFormText('');
        setShowForm(false);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch {
      // Silently fail - UI stays responsive
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filter reviews ──
  const filtered = reviews.filter(r => {
    if (filter === '5') return r.rating === 5;
    if (filter === '4') return r.rating === 4;
    if (filter === '3') return r.rating <= 3;
    return true;
  });

  // ── Map API review to display format ──
  const displayReview = (r: ApiReview) => {
    // Try to infer zone from comment or use default
    const zones = ['fabrics', 'wholesale', 'spices', 'kitchenware', 'electronics', 'artisanal'];
    const zoneHint = zones.find(z => r.comment.toLowerCase().includes(z)) || 'fabrics';
    return {
      id: r.id,
      guideName: r.revieweeName || 'Guide',
      guideZone: zoneHint,
      rating: r.rating,
      text: r.comment,
      date: new Date(r.createdAt).toLocaleDateString('en-CA'),
      session: r.sessionId?.startsWith('s-') ? 'Session' : r.sessionId,
      hasResponse: !!r.response,
      response: r.response,
    };
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('My Reviews', 'Mapitio Yangu')}</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{l('Your session feedback', 'Maoni ya vipindi vyako')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="kcard-glass p-4 text-center">
          <p className="text-2xl font-black text-[#065F46] dark:text-[#34D399]">{isLoading ? '—' : avgRating}</p>
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{l('Avg Given', 'Wastani')}</p>
        </div>
        <div className="kcard-glass p-4 text-center">
          <p className="text-2xl font-black text-[#F59E0B]">{isLoading ? '—' : totalReviews}</p>
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{l('Total Reviews', 'Jumla')}</p>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#065F46]/20"
          >
            <CheckCircle2 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            <span className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">
              {l('Review submitted!', 'Mapitio yametumwa!')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: l('All', 'Zote') },
          { key: '5' as const, label: '5 ★' },
          { key: '4' as const, label: '4 ★' },
          { key: '3' as const, label: l('3 & below', '3 na chini') },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`ktag ${filter === f.key ? 'ktag-active' : 'ktag-inactive'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Write Review Button */}
      <button onClick={() => setShowForm(!showForm)}
        className="kbtn-yellow w-full flex items-center justify-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        {l('Write a Review', 'Andika Mapitio')}
      </button>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="kcard p-4 space-y-4 overflow-hidden"
          >
            <h3 className="font-bold text-sm">{l('Write Your Review', 'Andika Mapitio Yako')}</h3>
            
            {/* Star Rating */}
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{l('Rating', 'Alama')}</label>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setFormRating(s)} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                    className="transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 transition-colors ${(s <= formRating || s <= hoverStar) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{l('Your Review', 'Mapitio Yako')}</label>
              <textarea value={formText} onChange={e => setFormText(e.target.value)}
                placeholder={l('Share your experience...', 'Shiriki uzoefu wako...')}
                className="kinput w-full mt-1.5 h-24 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setFormRating(0); setFormText(''); }}
                className="kbtn-ghost flex-1 flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" />{l('Cancel', 'Ghairi')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formRating || !formText.trim() || isSubmitting}
                className="kbtn flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSubmitting ? l('Sending...', 'Inatuma...') : l('Submit', 'Tuma')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="kcard p-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-[#94A3B8] mb-2" />
            <p className="text-sm text-[#64748B]">{l('No reviews yet', 'Hakuna mapitio bado')}</p>
          </div>
        ) : (
          filtered.map((review, i) => {
            const dr = displayReview(review);
            return (
              <motion.div key={dr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="kcard p-4"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-white font-bold text-sm">
                    {dr.guideName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm">{dr.guideName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= dr.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#64748B]">{dr.session}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{dr.date}
                  </span>
                </div>
                <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">{dr.text}</p>

                {/* Guide response if exists */}
                {dr.hasResponse && dr.response && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#065F46]/10">
                    <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">{l('Guide replied', 'Mwongozo amejibu')}</span>
                    <p className="text-xs text-[#0F172A] dark:text-[#F1F5F9] mt-0.5">{dr.response}</p>
                  </div>
                )}

                <div className="mt-2.5">
                  <span className="kbadge text-[9px]" style={{ background: (ZONE_COLORS[dr.guideZone] || '#999') + '15', color: ZONE_COLORS[dr.guideZone] }}>
                    {dr.guideZone}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
