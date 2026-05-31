'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Star, MessageSquare, Reply, ArrowUpDown, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const RATING_BREAKDOWN = [
  { stars: 5, count: 45 },
  { stars: 4, count: 28 },
  { stars: 3, count: 8 },
  { stars: 2, count: 3 },
  { stars: 1, count: 1 },
];

const TOTAL = RATING_BREAKDOWN.reduce((a, r) => a + r.count, 0);
const AVG = (RATING_BREAKDOWN.reduce((a, r) => a + r.stars * r.count, 0) / TOTAL).toFixed(1);

const DEMO_REVIEWS = [
  { id: 'r1', seekerName: 'Sarah K.', rating: 5, text: 'Incredible guide! Mwanaildi knows every corner of the fabric market. Got the best deals on kanga sets.', date: '2025-05-28', zone: 'Fabrics', responded: true, response: 'Thank you Sarah! It was a pleasure guiding you. Come back anytime!' },
  { id: 'r2', seekerName: 'Mike T.', rating: 5, text: 'Best investment for my wholesale trip. Saved over 300K TZS by following Mwanaildi\'s advice on bulk buying.', date: '2025-05-26', zone: 'Wholesale', responded: true, response: 'Asante Mike! Happy to help you save money.' },
  { id: 'r3', seekerName: 'Anna L.', rating: 4, text: 'Very knowledgeable and friendly. Only minor issue was the session ran a bit over the scheduled time.', date: '2025-05-24', zone: 'Fabrics', responded: false, response: '' },
  { id: 'r4', seekerName: 'James O.', rating: 5, text: 'Third time booking Mwanaildi. Each time is better than the last. True market expert!', date: '2025-05-22', zone: 'Spices', responded: false, response: '' },
  { id: 'r5', seekerName: 'Priya S.', rating: 3, text: 'Decent guide but seemed a bit rushed. Would have liked more time at the spice stalls.', date: '2025-05-20', zone: 'Spices', responded: true, response: 'Sorry about that Priya! Next time I\'ll make sure to pace the session better.' },
  { id: 'r6', seekerName: 'David M.', rating: 5, text: 'My wife and I had an amazing experience. Mwanaildi helped us find beautiful kitenge fabrics at great prices.', date: '2025-05-18', zone: 'Fabrics', responded: false, response: '' },
  { id: 'r7', seekerName: 'Emma W.', rating: 4, text: 'Good negotiation skills. Helped me avoid the tourist price markup on kitchenware.', date: '2025-05-16', zone: 'Kitchenware', responded: false, response: '' },
  { id: 'r8', seekerName: 'Omar A.', rating: 2, text: 'Was 15 minutes late to our meeting point. Once we started it was okay but the delay was frustrating.', date: '2025-05-14', zone: 'Electronics', responded: true, response: 'I sincerely apologize for the delay Omar. It won\'t happen again.' },
  { id: 'r9', seekerName: 'Lucy N.', rating: 5, text: 'Exceeded all expectations! The spice market tour was the highlight of my trip to Dar.', date: '2025-05-12', zone: 'Spices', responded: false, response: '' },
  { id: 'r10', seekerName: 'Tom H.', rating: 4, text: 'Very professional and well-prepared. Had a clear route planned out for maximum efficiency.', date: '2025-05-10', zone: 'Wholesale', responded: false, response: '' },
];

export default function GuideReviewsPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [filter, setFilter] = useState<'all' | 'positive' | 'critical'>('all');
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'guide') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  let filtered = DEMO_REVIEWS.filter(r => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'critical') return r.rating <= 3;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const responseRate = Math.round((DEMO_REVIEWS.filter(r => r.responded).length / DEMO_REVIEWS.length) * 100);

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
            <p className="text-4xl font-black text-white">{AVG}</p>
            <div className="flex mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(AVG)) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-white/20'}`} />
              ))}
            </div>
            <p className="text-xs text-white/60 mt-1">{TOTAL} {l('reviews', 'mapitio')}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {RATING_BREAKDOWN.map(r => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-xs text-white/70 w-4">{r.stars}</span>
                <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all"
                    style={{ width: `${(r.count / TOTAL) * 100}%` }}
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
          <p className="text-lg font-black text-[#065F46] dark:text-[#34D399]">{AVG}</p>
          <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{l('Avg Rating', 'Wastani')}</p>
        </div>
        <div className="kcard-glass p-3 text-center">
          <p className="text-lg font-black text-[#F59E0B]">{TOTAL}</p>
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
        {filtered.map((review, i) => (
          <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="kcard p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#14B8A6] flex items-center justify-center text-white font-bold text-sm">
                {review.seekerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm">{review.seekerName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#64748B]">{review.date}</span>
                </div>
              </div>
              <span className="kbadge text-[9px] kbadge-pending">{review.zone}</span>
            </div>
            <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">{review.text}</p>
            
            {/* Response */}
            {review.responded && review.response && (
              <div className="mt-3 p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#065F46]/10 dark:border-[#34D399]/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Reply className="w-3 h-3 text-[#065F46] dark:text-[#34D399]" />
                  <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">{l('Your Response', 'Jibu Lako')}</span>
                </div>
                <p className="text-xs text-[#0F172A] dark:text-[#F1F5F9]">{review.response}</p>
              </div>
            )}

            {/* Respond Button / Form */}
            {!review.responded && (
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
                      <button disabled={!responseText.trim()}
                        className="kbtn text-xs py-1.5 px-3 disabled:opacity-40"
                      >{l('Send', 'Tuma')}</button>
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
        ))}
      </div>
    </div>
  );
}
