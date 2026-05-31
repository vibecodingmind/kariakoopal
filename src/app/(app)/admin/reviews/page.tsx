'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Eye, Clock, User, Star, MessageSquare, CheckCircle, XCircle, Edit3, Flag, BarChart3, Search, Filter, ChevronDown, X, Send } from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

interface Review {
  id: string;
  guideName: string;
  seekerName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  date: string;
  flagReason?: string;
  autoFlagReason?: string;
  response?: string;
}

const DEMO_REVIEWS: Review[] = [
  { id: 'r1', guideName: 'James Mwangi', seekerName: 'Sarah K.', rating: 5, text: 'Amazing experience! James knew every corner of the electronics zone and got me the best deals on phones. Highly recommend!', status: 'approved', date: '2 hours ago' },
  { id: 'r2', guideName: 'Fatima Hassan', seekerName: 'Bot User', rating: 5, text: 'Good', status: 'flagged', date: '3 hours ago', autoFlagReason: 'Very short review (<10 chars) with extreme rating. Possible spam.' },
  { id: 'r3', guideName: 'Peter Kimathi', seekerName: 'David R.', rating: 1, text: 'Terrible guide. Did not show up on time and was rude when I asked about prices. Waste of money!!!', status: 'pending', date: '5 hours ago', autoFlagReason: 'Extreme 1-star rating without detailed context. Possible revenge review.' },
  { id: 'r4', guideName: 'Amina Juma', seekerName: 'Michael T.', rating: 4, text: 'Good tour of the spice market. Amina was knowledgeable about all the different spices and helped me negotiate fair prices. Only downside was the tour ran a bit long.', status: 'approved', date: '1 day ago' },
  { id: 'r5', guideName: 'James Mwangi', seekerName: 'New User', rating: 5, text: '5 stars!!! Best guide ever!!! Amazing!!! Wonderful!!! Fantastic!!!', status: 'flagged', date: '6 hours ago', autoFlagReason: 'Duplicate excessive praise pattern. Same user posted 3 similar reviews for same guide in 24 hours.' },
  { id: 'r6', guideName: 'Hassan Omar', seekerName: 'Lisa M.', rating: 3, text: 'Average experience. The guide was okay but seemed distracted and didn\'t know much about the fabric zone. Probably better for electronics.', status: 'pending', date: '1 day ago' },
  { id: 'r7', guideName: 'Grace John', seekerName: 'Robert P.', rating: 5, text: 'Grace was phenomenal! She helped me find authentic Maasai jewelry at wholesale prices. Her Swahili negotiation skills saved me at least 30% on every purchase. The market tour was well-paced and she knew all the hidden gems.', status: 'approved', date: '2 days ago' },
];

const FLAG_REASONS = [
  'Spam / Duplicate',
  'Inappropriate Language',
  'Fake Review',
  'Revenge Rating',
  'Off Topic',
  'Contains Personal Info',
];

export default function AdminReviewsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [officialResponse, setOfficialResponse] = useState('');
  const [flagReason, setFlagReason] = useState('');

  const filteredReviews = reviews.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery && !r.guideName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.seekerName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  const handleAction = (reviewId: string, action: 'approve' | 'reject' | 'flag') => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      switch (action) {
        case 'approve': return { ...r, status: 'approved' as ReviewStatus, autoFlagReason: undefined };
        case 'reject': return { ...r, status: 'rejected' as ReviewStatus };
        case 'flag': return { ...r, status: 'flagged' as ReviewStatus, flagReason };
        default: return r;
      }
    }));
    setFlagReason('');
    setSelectedReview(null);
  };

  const addResponse = (reviewId: string) => {
    if (!officialResponse.trim()) return;
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response: officialResponse } : r));
    setOfficialResponse('');
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Review Moderation', 'Udhibiti wa Mapitio')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Moderate and manage user reviews', 'Dhibiti na udhibiti mapitio ya watumiaji')}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: l('Pending', 'Inasubiri'), value: stats.pending, color: '#F59E0B' },
          { label: l('Flagged', 'Bendera'), value: stats.flagged, color: '#DC2626' },
          { label: l('Approved', 'Imeidhinishwa'), value: stats.approved, color: '#065F46' },
          { label: l('Rejected', 'Imekataliwa'), value: stats.rejected, color: '#64748B' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-3 text-center">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#64748B]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={l('Search reviews...', 'Tafuta mapitio...')} className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ReviewStatus | 'all')} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm">
          <option value="all">{l('All Status', 'Hali Yote')}</option>
          <option value="pending">{l('Pending', 'Inasubiri')}</option>
          <option value="flagged">{l('Flagged', 'Bendera')}</option>
          <option value="approved">{l('Approved', 'Imeidhinishwa')}</option>
          <option value="rejected">{l('Rejected', 'Imekataliwa')}</option>
        </select>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredReviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.03 }} className={`kcard overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${review.status === 'flagged' ? 'border-l-4 border-l-red-500' : review.status === 'pending' ? 'border-l-4 border-l-amber-500' : ''}`} onClick={() => setSelectedReview(review)}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />)}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${review.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : review.status === 'flagged' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : review.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{review.status}</span>
                  </div>
                  <span className="text-[10px] text-[#64748B]">{review.date}</span>
                </div>
                <p className="text-sm text-[#64748B] mb-2 line-clamp-2">{review.text}</p>
                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{review.seekerName} → {review.guideName}</span>
                </div>
                {review.autoFlagReason && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{l('Auto-flagged:', 'Bendera kiotomatiki:')} {review.autoFlagReason}</span>
                  </div>
                )}
                {review.response && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-[#065F46] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/30 p-2 rounded-lg">
                    <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{l('Official Response:', 'Jibu Rasmi:')} {review.response}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setSelectedReview(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{l('Review Detail', 'Maelezo ya Mapitio')}</h2>
                  <button onClick={() => setSelectedReview(null)} className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-5 h-5 ${j < selectedReview.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0] dark:text-[#334155]'}`} />)}
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color: selectedReview.status === 'flagged' ? '#DC2626' : selectedReview.status === 'pending' ? '#F59E0B' : '#065F46' }}>{selectedReview.status}</span>
                  </div>
                  <p className="text-sm">{selectedReview.text}</p>
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span>{l('By', 'Na')}: {selectedReview.seekerName}</span>
                    <span>→</span>
                    <span>{l('For', 'Kwa')}: {selectedReview.guideName}</span>
                    <span>·</span>
                    <span>{selectedReview.date}</span>
                  </div>
                </div>

                {selectedReview.autoFlagReason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">{l('Auto-Flag Reason', 'Sababu ya Bendera Kiotomatiki')}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{selectedReview.autoFlagReason}</p>
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="space-y-3 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <p className="text-xs font-semibold text-[#64748B]">{l('Moderation Actions', 'Vitendo vya Udhibiti')}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(selectedReview.id, 'approve')} className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" />{l('Approve', 'Idhinisha')}</button>
                    <button onClick={() => handleAction(selectedReview.id, 'reject')} className="flex-1 text-xs py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />{l('Reject', 'Kataa')}</button>
                    <button onClick={() => { setFlagReason('Inappropriate content'); handleAction(selectedReview.id, 'flag'); }} className="flex-1 text-xs py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1"><Flag className="w-3 h-3" />{l('Flag', 'Bendera')}</button>
                  </div>
                </div>

                {/* Official Response */}
                <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <p className="text-xs font-semibold text-[#64748B]">{l('Official Response', 'Jibu Rasmi')}</p>
                  {selectedReview.response ? (
                    <div className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/30">
                      <p className="text-sm">{selectedReview.response}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={officialResponse} onChange={e => setOfficialResponse(e.target.value)} placeholder={l('Write official response...', 'Andika jibu rasmi...')} className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] outline-none" onKeyDown={e => e.key === 'Enter' && addResponse(selectedReview.id)} />
                      <button onClick={() => addResponse(selectedReview.id)} className="kbtn px-3 py-2"><Send className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
