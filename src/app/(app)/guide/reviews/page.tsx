'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Star, MessageSquare, Reply, ArrowUpDown, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// ── Demo fallback data ──
const DEMO_REVIEWS = [
  { id: 'r1', seekerName: 'Sarah K.', rating: 5, text: 'Incredible guide! Knows every corner of the fabric market. Got the best deals on kanga sets.', date: '2025-05-28', zone: 'Fabrics', responded: true, response: 'Thank you Sarah! It was a pleasure guiding you. Come back anytime!', revieweeId: 'u1', reviewerId: 's1' },
  { id: 'r2', seekerName: 'Mike T.', rating: 5, text: 'Best investment for my wholesale trip. Saved over 300K TZS by following the advice on bulk buying.', date: '2025-05-26', zone: 'Wholesale', responded: true, response: 'Asante Mike! Happy to help you save money.', revieweeId: 'u1', reviewerId: 's2' },
  { id: 'r3', seekerName: 'Anna L.', rating: 4, text: 'Very knowledgeable and friendly. Only minor issue was the session ran a bit over the scheduled time.', date: '2025-05-24', zone: 'Fabrics', responded: false, response: '', revieweeId: 'u1', reviewerId: 's3' },
  { id: 'r4', seekerName: 'James O.', rating: 5, text: 'Third time booking this guide. Each time is better than the last. True market expert!', date: '2025-05-22', zone: 'Spices', responded: false, response: '', revieweeId: 'u1', reviewerId: 's4' },
  { id: 'r5', seekerName: 'Priya S.', rating: 3, text: 'Decent guide but seemed a bit rushed. Would have liked more time at the spice stalls.', date: '2025-05-20', zone: 'Spices', responded: true, response: 'Sorry about that Priya! Next time I\'ll make sure to pace the session better.', revieweeId: 'u1', reviewerId: 's5' },
  { id: 'r6', seekerName: 'David M.', rating: 5, text: 'My wife and I had an amazing experience. Helped us find beautiful kitenge fabrics at great prices.', date: '2025-05-18', zone: 'Fabrics', responded: false, response: '', revieweeId: 'u1', reviewerId: 's6' },
  { id: 'r7', seekerName: 'Emma W.', rating: 4, text: 'Good negotiation skills. Helped me avoid the tourist price markup on kitchenware.', date: '2025-05-16', zone: 'Kitchenware', responded: false, response: '', revieweeId: 'u1', reviewerId: 's7' },
  { id: 'r8', seekerName: 'Omar A.', rating: 2, text: 'Was 15 minutes late to our meeting point. Once we started it was okay but the delay was frustrating.', date: '2025-05-14', zone: 'Electronics', responded: true, response: 'I sincerely apologize for the delay Omar. It won\'t happen again.', revieweeId: 'u1', reviewerId: 's8' },
];

// ── API Review type ──
interface ApiReview {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewerName?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function GuideReviewsPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [filter, setFilter] = useState<'all' | 'positive' | 'critical'>('all');
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API state
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avgRating, setAvgRating] = useState('0.0');
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'guide') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?revieweeId=${user?.id || 'demo'}`);
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
      setReviews(DEMO_REVIEWS.map(r => ({
        id: r.id,
        sessionId: `s-${r.id}`,
        reviewerId: r.reviewerId,
        reviewerName: r.seekerName,
        revieweeId: r.revieweeId,
        rating: r.rating,
        comment: r.text,
        response: r.responded ? r.response : null,
        respondedAt: r.responded ? new Date(r.date).toISOString() : null,
        createdAt: new Date(r.date).toISOString(),
        updatedAt: new Date(r.date).toISOString(),
      })));
      const demoAvg = (DEMO_REVIEWS.reduce((a, r) => a + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1);
      setAvgRating(demoAvg);
      setTotalReviews(DEMO_REVIEWS.length);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'guide') {
      fetchReviews();
    }
  }, [isAuthenticated, user, fetchReviews]);

  // Submit response to a review
  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, response: responseText.trim(), respondedAt: new Date().toISOString() } : r
        ));
        toast.success(l('Response sent!', 'Jibu limetumwa!'));
      } else {
        // Demo mode: just update locally
        setReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, response: responseText.trim(), respondedAt: new Date().toISOString() } : r
        ));
        toast.success(l('Response saved!', 'Jibu limehifadhiwa!'));
      }
    } catch {
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, response: responseText.trim(), respondedAt: new Date().toISOString() } : r
      ));
    }
    setRespondingTo(null);
    setResponseText('');
    setIsSubmitting(false);
  };

  // Compute rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.round(r.rating) === stars).length,
  }));
  const total = reviews.length || 1;
  const responseRate = reviews.length > 0 ? Math.round((reviews.filter(r => !!r.response).length / reviews.length) * 100) : 0;

  // Filter & sort
  let filtered = reviews.filter(r => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'critical') return r.rating <= 3;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
          <Star className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('Reviews', 'Mapitio')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{l('What seekers say about you', 'Wanaotafuta wanasemaje kuhusu wewe')}</p>
        </div>
      </div>

      {/* Rating Overview */}
      <div className="kcard-green p-5">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{isLoading ? '—' : avgRating}</p>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(avgRating)) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-white/20'}`} />
              ))}
            </div>
            <p className="text-xs text-white/60 mt-1">{totalReviews} {l('reviews', 'mapitio')}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingBreakdown.map(r => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-xs text-white/70 w-4">{r.stars}</span>
                <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all"
                    style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-white/60 w-6 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="kcard-glass p-3 text-center">
          <p className="text-lg font-black text-[#065F46] dark:text-[#34D399]">{isLoading ? '—' : avgRating}</p>
          <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{l('Avg Rating', 'Wastani')}</p>
        </div>
        <div className="kcard-glass p-3 text-center">
          <p className="text-lg font-black text-[#F59E0B]">{isLoading ? '—' : totalReviews}</p>
          <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{l('Total', 'Jumla')}</p>
        </div>
        <div className="kcard-glass p-3 text-center">
          <p className="text-lg font-black text-[#065F46] dark:text-[#34D399]">{responseRate}%</p>
          <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{l('Replied', 'Kumjibu')}</p>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: l('All', 'Zote') },
            { key: 'positive' as const, label: l('4-5 ★', '4-5 ★') },
            { key: 'critical' as const, label: l('1-3 ★', '1-3 ★') },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`ktag ${filter === f.key ? 'ktag-active' : 'ktag-inactive'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setSort(sort === 'newest' ? 'highest' : sort === 'highest' ? 'lowest' : 'newest')}
          className="flex items-center gap-1 text-xs font-semibold text-[#065F46] dark:text-[#34D399]"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sort === 'newest' ? l('Newest', 'Mpya') : sort === 'highest' ? l('Highest', 'Juu') : l('Lowest', 'Chini')}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kcard p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#334155]" />
                <div className="flex-1">
                  <div className="h-3.5 w-28 rounded bg-[#E2E8F0] dark:bg-[#334155] mb-1.5" />
                  <div className="h-2.5 w-20 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-[#E2E8F0] dark:bg-[#334155]" />
                <div className="h-3 w-3/4 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="kcard p-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-[#94A3B8] mb-2" />
            <p className="text-sm text-[#64748B]">{l('No reviews yet', 'Hakuna mapitio bado')}</p>
          </div>
        ) : (
          filtered.map((review, i) => {
            const name = review.reviewerName || 'Seeker';
            const zones = ['Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Electronics'];
            const zoneHint = zones.find(z => review.comment.toLowerCase().includes(z.toLowerCase())) || 'Fabrics';
            const hasResponse = !!review.response;

            return (
              <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="kcard p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#14B8A6] flex items-center justify-center text-white font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm">{name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#64748B]">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="kbadge text-[9px] kbadge-pending">{zoneHint}</span>
                </div>
                <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">{review.comment}</p>

                {/* Response */}
                {hasResponse && review.response && (
                  <div className="mt-3 p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#065F46]/10 dark:border-[#34D399]/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Reply className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
                      <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">{l('Your Response', 'Jibu Lako')}</span>
                    </div>
                    <p className="text-xs text-[#0F172A] dark:text-[#F1F5F9]">{review.response}</p>
                  </div>
                )}

                {/* Respond Button / Form */}
                {!hasResponse && (
                  <div className="mt-3">
                    {respondingTo === review.id ? (
                      <div className="space-y-2">
                        <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
                          placeholder={l('Write your response...', 'Andika jibu lako...')}
                          className="kinput w-full h-16 text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => { setRespondingTo(null); setResponseText(''); }}
                            className="kbtn-ghost text-xs py-1.5 px-3"
                          >{l('Cancel', 'Ghairi')}</button>
                          <button
                            onClick={() => handleRespond(review.id)}
                            disabled={!responseText.trim() || isSubmitting}
                            className="kbtn text-xs py-1.5 px-3 disabled:opacity-40 flex items-center gap-1"
                          >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {isSubmitting ? l('Sending...', 'Inatuma...') : l('Send', 'Tuma')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRespondingTo(review.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#065F46] dark:text-[#34D399] hover:underline"
                      >
                        <Reply className="w-3.5 h-3.5" />{l('Respond', 'Jibu')}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
