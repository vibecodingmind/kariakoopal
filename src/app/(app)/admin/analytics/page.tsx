'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Star, CheckCircle2, Clock, MapPin, Globe, TrendingUp, ArrowLeft,
} from 'lucide-react';

const WEEKLY_SESSIONS = [
  { day: 'Mon', completed: 42, cancelled: 3 },
  { day: 'Tue', completed: 38, cancelled: 5 },
  { day: 'Wed', completed: 45, cancelled: 2 },
  { day: 'Thu', completed: 52, cancelled: 4 },
  { day: 'Fri', completed: 48, cancelled: 6 },
  { day: 'Sat', completed: 65, cancelled: 3 },
  { day: 'Sun', completed: 58, cancelled: 2 },
];

const PEAK_HOURS = [
  { hour: '6am', value: 12 }, { hour: '7am', value: 28 }, { hour: '8am', value: 85 },
  { hour: '9am', value: 62 }, { hour: '10am', value: 78 }, { hour: '11am', value: 55 },
  { hour: '12pm', value: 48 }, { hour: '1pm', value: 52 }, { hour: '2pm', value: 90 },
  { hour: '3pm', value: 72 }, { hour: '4pm', value: 65 }, { hour: '5pm', value: 58 },
  { hour: '6pm', value: 42 }, { hour: '7pm', value: 30 }, { hour: '8pm', value: 18 },
  { hour: '9pm', value: 10 }, { hour: '10pm', value: 5 },
];

const GEO_DISTRIBUTION = [
  { country: 'Tanzania', pct: 78, color: '#065F46' },
  { country: 'Kenya', pct: 12, color: '#059669' },
  { country: 'Uganda', pct: 5, color: '#34D399' },
  { country: 'Other', pct: 5, color: '#94A3B8' },
];

const POPULAR_ZONES = [
  { name: 'Kariakoo Main Market', visits: 4520, pct: 92, trend: '+12%' },
  { name: 'Electronics Zone', visits: 3180, pct: 65, trend: '+8%' },
  { name: 'Spices Alley', visits: 2890, pct: 59, trend: '+15%' },
  { name: 'Fabrics Row', visits: 2450, pct: 50, trend: '+5%' },
  { name: 'Wholesale Block', visits: 1920, pct: 39, trend: '-2%' },
  { name: 'Fresh Produce Hub', visits: 1640, pct: 34, trend: '+3%' },
];

export default function AdminAnalyticsPage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, s: string) => (sw ? s : en);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  const maxDay = Math.max(...WEEKLY_SESSIONS.map((d) => d.completed + d.cancelled));
  const maxPeak = Math.max(...PEAK_HOURS.map((p) => p.value));

  return (
    <div className="px-4 py-4 space-y-5 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="kbtn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold gradient-text-green">{l('Analytics Center', 'Kituo cha Uchambuzi')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{l('Platform performance insights', 'Mwongozo wa utendaji wa jukwaa')}</p>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: l('Active Users', 'Watumiaji Hai'), value: '342', sub: l('+24 today', '+24 leo'), color: '#065F46', bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]' },
          { icon: BarChart3, label: l('Sessions Today', 'Vipindi Leo'), value: '89', sub: l('+12% vs avg', '+12% dhidi ya wastani'), color: '#059669', bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]' },
          { icon: Star, label: l('Avg Rating', 'Wastani wa Ukadiriaji'), value: '4.7', sub: l('Last 30 days', 'Siku 30 zilizopita'), color: '#F59E0B', bg: 'bg-[#FEF3C7] dark:bg-[#78350F]' },
          { icon: CheckCircle2, label: l('Completion Rate', 'Kiwango cha Ukamilishaji'), value: '94%', sub: l('348 of 370', '348 kati ya 370'), color: '#059669', bg: 'bg-[#ECFDF5] dark:bg-[#064E3B]' },
        ].map((m, i) => (
          <div key={i} className="kcard p-4">
            <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-2`}>
              <m.icon className="w-4.5 h-4.5" style={{ color: m.color }} />
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{m.label}</p>
            <p className="text-[9px] text-[#059669] mt-1">{m.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* 7-Day Session Completion Trend */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            {l('7-Day Completion Trend', 'Mwelekeo wa Wiki 7 za Ukamilishaji')}
          </h3>
          <span className="kbadge kbadge-live">{l('This Week', 'Wiki Hii')}</span>
        </div>
        <div className="h-36 flex items-end gap-2">
          {WEEKLY_SESSIONS.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center" style={{ height: 130, justifyContent: 'flex-end' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.completed / maxDay) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className="w-full rounded-t-md"
                  style={{ background: 'linear-gradient(180deg, #065F46, #34D399)', minHeight: 4 }}
                />
                {d.cancelled > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.cancelled / maxDay) * 100}%` }}
                    transition={{ duration: 0.4, delay: i * 0.06 + 0.3 }}
                    className="w-full rounded-b-sm"
                    style={{ background: '#FEE2E2', minHeight: 2 }}
                  />
                )}
              </div>
              <span className="text-[8px] text-[#64748B] dark:text-[#94A3B8]">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#065F46] to-[#34D399]" />
            <span className="text-[10px] text-[#64748B]">{l('Completed', 'Imekamilika')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#FEE2E2]" />
            <span className="text-[10px] text-[#64748B]">{l('Cancelled', 'Zimeghairiwa')}</span>
          </div>
        </div>
      </motion.div>

      {/* User Distribution */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('User Distribution', 'Uenezi wa Watumiaji')}
        </h3>
        <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#065F46] to-[#059669] flex items-center justify-center" style={{ width: '65%' }}>
            <span className="text-[10px] font-bold text-white">65% {l('Seekers', 'Watafuta')}</span>
          </div>
          <div className="bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] flex items-center justify-center" style={{ width: '30%' }}>
            <span className="text-[10px] font-bold text-white">30% {l('Guides', 'Miongozo')}</span>
          </div>
          <div className="bg-[#334155] dark:bg-[#475569] flex items-center justify-center" style={{ width: '5%' }}>
            <span className="text-[7px] font-bold text-white">5%</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <span>222 {l('seekers', 'watafuta')}</span>
          <span>103 {l('guides', 'miongozo')}</span>
          <span>17 {l('admins', 'wasimamizi')}</span>
        </div>
      </motion.div>

      {/* Peak Hours */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#F59E0B]" />
          {l('Peak Activity Hours', 'Masaa ya Shughuli Nyingi')}
        </h3>
        <div className="space-y-1.5">
          {PEAK_HOURS.map((p, i) => {
            const isPeak = p.value >= 80;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] w-8 text-right shrink-0">{p.hour}</span>
                <div className="flex-1 h-4 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.value / maxPeak) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.04 }}
                    className={`h-full rounded-full ${isPeak ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]' : 'bg-gradient-to-r from-[#065F46] to-[#059669]'}`}
                  />
                </div>
                {isPeak && <TrendingUp className="w-3 h-3 text-[#F59E0B] shrink-0" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Geographic Distribution */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }} className="kcard p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          {l('Geographic Distribution', 'Uenezi wa Kijiografia')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {GEO_DISTRIBUTION.map((geo, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: `${geo.color}18`, border: `1.5px solid ${geo.color}40` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: geo.color }} />
              <span className="text-xs font-semibold">{geo.country}</span>
              <span className="text-xs font-bold" style={{ color: geo.color }}>{geo.pct}%</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Popular Zones Ranking */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#F59E0B]" />
          {l('Popular Zones', 'Maeneo Maarufu')}
        </h2>
        <div className="space-y-2">
          {POPULAR_ZONES.map((zone, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className="kcard p-3"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  i === 0 ? 'bg-[#FEF3C7] dark:bg-[#78350F]' :
                  i === 1 ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' :
                  'bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  <span className={`text-xs font-bold ${
                    i === 0 ? 'text-[#F59E0B]' : i === 1 ? 'text-[#059669]' : 'text-[#64748B]'
                  }`}>#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{zone.name}</p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{zone.visits.toLocaleString()} {l('visits', 'ziara')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <TrendingUp className={`w-3 h-3 ${zone.trend.startsWith('+') ? 'text-[#059669]' : 'text-[#DC2626]'}`} />
                  <span className={`text-xs font-bold ${zone.trend.startsWith('+') ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{zone.trend}</span>
                </div>
              </div>
              <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#065F46] to-[#34D399]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
