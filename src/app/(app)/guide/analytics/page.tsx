'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Eye, TrendingUp, Clock, Users, MapPin, Globe, Trophy, BarChart3, Star, ArrowUpRight, ArrowDownRight, Minus, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const WEEKLY_VIEWS = [
  { day: 'Mon', views: 42 },
  { day: 'Tue', views: 58 },
  { day: 'Wed', views: 65 },
  { day: 'Thu', views: 49 },
  { day: 'Fri', views: 72 },
  { day: 'Sat', views: 88 },
  { day: 'Sun', views: 34 },
];

const EARNINGS_TREND = [
  { day: 'Mon', amount: 25000 },
  { day: 'Tue', amount: 45000 },
  { day: 'Wed', amount: 35000 },
  { day: 'Thu', amount: 50000 },
  { day: 'Fri', amount: 65000 },
  { day: 'Sat', amount: 85000 },
  { day: 'Sun', amount: 20000 },
];

const TOP_ZONES = [
  { name: 'Fabrics', bookings: 28, pct: 38, color: '#7C3AED' },
  { name: 'Wholesale', bookings: 22, pct: 30, color: '#14B8A6' },
  { name: 'Spices', bookings: 12, pct: 16, color: '#EF4444' },
  { name: 'Kitchenware', bookings: 8, pct: 11, color: '#F59E0B' },
  { name: 'Electronics', bookings: 4, pct: 5, color: '#0891B2' },
];

const MAX_VIEWS = Math.max(...WEEKLY_VIEWS.map(d => d.views));
const MAX_EARNINGS = Math.max(...EARNINGS_TREND.map(d => d.amount));

// Demo rating history data
const DEMO_RATING_HISTORY = [
  { id: 'rh1', rating: 5, avgRating: 4.3, reviewCount: 24, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'rh2', rating: 4, avgRating: 4.2, reviewCount: 23, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'rh3', rating: 5, avgRating: 4.2, reviewCount: 22, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'rh4', rating: 3, avgRating: 4.1, reviewCount: 21, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'rh5', rating: 5, avgRating: 4.2, reviewCount: 20, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'rh6', rating: 4, avgRating: 4.1, reviewCount: 19, createdAt: new Date(Date.now() - 86400000 * 13).toISOString() },
  { id: 'rh7', rating: 5, avgRating: 4.0, reviewCount: 18, createdAt: new Date(Date.now() - 86400000 * 16).toISOString() },
  { id: 'rh8', rating: 4, avgRating: 3.9, reviewCount: 17, createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
];

const DEMO_RATING_STATS = {
  averageRating: 4.3,
  totalReviews: 24,
  ratingDistribution: { 1: 1, 2: 2, 3: 3, 4: 8, 5: 10 },
  trendDirection: 'up' as const,
  thirtyDayAverage: 4.5,
  previousAverage: 4.1,
  responseRate: 67,
};

export default function AnalyticsPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [ratingStats, setRatingStats] = useState(DEMO_RATING_STATS);
  const [ratingHistory, setRatingHistory] = useState(DEMO_RATING_HISTORY);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'guide') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  const fetchRatingStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/guides/${user.id}/rating-stats`);
      if (res.ok) {
        const data = await res.json();
        setRatingStats({
          averageRating: data.averageRating,
          totalReviews: data.totalReviews,
          ratingDistribution: data.ratingDistribution,
          trendDirection: data.trendDirection,
          thirtyDayAverage: data.thirtyDayAverage,
          previousAverage: data.previousAverage,
          responseRate: data.responseRate,
        });
        if (data.ratingHistory?.length > 0) {
          setRatingHistory(data.ratingHistory);
        }
      }
    } catch {
      // Use demo data
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRatingStats();
  }, [fetchRatingStats]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  // Rating history chart: find min/max for scaling
  const avgRatings = ratingHistory.map(h => h.avgRating);
  const minRating = Math.max(0, Math.floor(Math.min(...avgRatings) * 2) / 2 - 0.5);
  const maxRating = Math.min(5, Math.ceil(Math.max(...avgRatings) * 2) / 2 + 0.5);
  const ratingRange = maxRating - minRating || 1;

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('Analytics', 'Uchambuzi')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{l('Your performance insights', 'Maelezo ya utendaji wako')}</p>
        </div>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setPeriod('week')} className={`ktag ${period === 'week' ? 'ktag-active' : 'ktag-inactive'}`}>
          {l('This Week', 'Wiki Hii')}
        </button>
        <button onClick={() => setPeriod('month')} className={`ktag ${period === 'month' ? 'ktag-active' : 'ktag-inactive'}`}>
          {l('This Month', 'Mwezi Huu')}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Eye, label: l('Profile Views', 'Kuangaliwa'), value: '342', trend: '+18%', color: '#065F46' },
          { icon: TrendingUp, label: l('Booking Rate', 'Kiwango cha Buki'), value: '78%', trend: '+5%', color: '#F59E0B' },
          { icon: Clock, label: l('Avg Session', 'Kipindi cha Wastani'), value: '1.5h', trend: '+12min', color: '#0891B2' },
          { icon: Users, label: l('Repeat Clients', 'Wateka Warudifu'), value: '45%', trend: '+8%', color: '#7C3AED' },
        ].map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="kcard p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: metric.color + '12' }}>
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <span className="text-[10px] font-bold text-[#10B981]">{metric.trend}</span>
            </div>
            <p className="text-2xl font-black">{metric.value}</p>
            <p className="text-[10px] font-semibold text-[#64748B] mt-0.5">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Views Chart */}
      <div className="kcard p-4">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Profile Views', 'Kuangaliwa kwa Wasifu')}
        </h3>
        <div className="flex items-end gap-2 h-32">
          {WEEKLY_VIEWS.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.views / MAX_VIEWS) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="w-full rounded-t-lg bg-gradient-to-t from-[#065F46] to-[#34D399] min-h-[4px] relative group cursor-pointer"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.views}
                </div>
              </motion.div>
              <span className="text-[9px] font-semibold text-[#64748B]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Trend */}
      <div className="kcard p-4">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          {l('Earnings Trend', 'Mwelekeo wa Mapato')}
        </h3>
        <div className="flex items-end gap-2 h-24">
          {EARNINGS_TREND.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.amount / MAX_EARNINGS) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="w-full rounded-t-lg bg-gradient-to-t from-[#F59E0B] to-[#FBBF24] min-h-[4px] relative group cursor-pointer"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {(d.amount / 1000).toFixed(0)}K
                </div>
              </motion.div>
              <span className="text-[9px] font-semibold text-[#64748B]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Zones */}
      <div className="kcard p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Top Zones', 'Maeneo Bora')}
        </h3>
        <div className="space-y-3">
          {TOP_ZONES.map((zone, i) => (
            <div key={zone.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#64748B] w-4">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{zone.name}</span>
                  <span className="text-[10px] font-bold text-[#64748B]">{zone.bookings} {l('bookings', 'buki')}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${zone.pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${zone.color}, ${zone.color}AA)` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Demographics */}
      <div className="kcard p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Client Demographics', 'Demografia ya Wateja')}
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-[#065F46] to-[#059669] text-center">
            <p className="text-2xl font-black text-white">65%</p>
            <p className="text-[10px] font-bold text-white/70">{l('Local', 'Wenyeji')}</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-center">
            <p className="text-2xl font-black text-white">35%</p>
            <p className="text-[10px] font-bold text-white/70">{l('Tourist', 'Watalii')}</p>
          </div>
        </div>
      </div>

      {/* Comparison Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="kcard-green p-5 text-center"
      >
        <div className="relative z-10">
          <Trophy className="w-10 h-10 text-[#F59E0B] mx-auto mb-2" />
          <h3 className="font-black text-white text-lg">{l('Top 15% of Guides', '15% Bora za Miongozo')}</h3>
          <p className="text-sm text-white/60 mt-1">
            {l('Your booking rate and ratings put you among the top performers on ChimboDirect.', 'Kiwango chako cha buki na alama kinakuweka miongoni mwa wafanyabiashara bora kwenye ChimboDirect.')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
