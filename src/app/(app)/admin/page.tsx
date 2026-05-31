'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Users, ShieldCheck, AlertTriangle, DollarSign, TrendingUp, Store,
  Compass, BarChart3, Sparkles, Brain, Zap, Activity, Eye, Bot,
  Megaphone, FileText, Settings, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Line, ComposedChart
} from 'recharts';

const AI_INSIGHTS = [
  { label: 'Revenue Forecast', value: '+22%', desc: 'Next 30 days', icon: TrendingUp, color: 'text-[#10B981]' },
  { label: 'Churn Risk', value: '8 users', desc: 'At risk of leaving', icon: AlertTriangle, color: 'text-[#F59E0B]' },
  { label: 'Fraud Score', value: '2.1/10', desc: 'Low risk today', icon: ShieldCheck, color: 'text-[#10B981]' },
  { label: 'AI Confidence', value: '94%', desc: 'Prediction accuracy', icon: Brain, color: 'text-[#065F46]' },
];

type RevPeriod = '7D' | '30D' | '90D' | '1Y';

const REVENUE_DATA: Record<RevPeriod, { name: string; revenue: number; forecast: number; bookings: number }[]> = {
  '7D': [
    { name: 'Mon', revenue: 320000, forecast: 340000, bookings: 18 },
    { name: 'Tue', revenue: 450000, forecast: 420000, bookings: 24 },
    { name: 'Wed', revenue: 380000, forecast: 400000, bookings: 21 },
    { name: 'Thu', revenue: 520000, forecast: 490000, bookings: 28 },
    { name: 'Fri', revenue: 680000, forecast: 620000, bookings: 35 },
    { name: 'Sat', revenue: 890000, forecast: 810000, bookings: 48 },
    { name: 'Sun', revenue: 750000, forecast: 780000, bookings: 41 },
  ],
  '30D': [
    { name: 'W1', revenue: 2800000, forecast: 2600000, bookings: 124 },
    { name: 'W2', revenue: 3200000, forecast: 3000000, bookings: 142 },
    { name: 'W3', revenue: 3500000, forecast: 3300000, bookings: 156 },
    { name: 'W4', revenue: 3900000, forecast: 3600000, bookings: 168 },
  ],
  '90D': [
    { name: 'Jan', revenue: 7200000, forecast: 6800000, bookings: 320 },
    { name: 'Feb', revenue: 8900000, forecast: 8200000, bookings: 385 },
    { name: 'Mar', revenue: 10500000, forecast: 9800000, bookings: 448 },
  ],
  '1Y': [
    { name: 'Jan', revenue: 7200000, forecast: 6500000, bookings: 320 },
    { name: 'Feb', revenue: 8900000, forecast: 8000000, bookings: 385 },
    { name: 'Mar', revenue: 10500000, forecast: 9500000, bookings: 448 },
    { name: 'Apr', revenue: 9800000, forecast: 9200000, bookings: 420 },
    { name: 'May', revenue: 12400000, forecast: 11000000, bookings: 530 },
    { name: 'Jun', revenue: 11500000, forecast: 10800000, bookings: 492 },
    { name: 'Jul', revenue: 13800000, forecast: 12500000, bookings: 590 },
    { name: 'Aug', revenue: 11200000, forecast: 10500000, bookings: 480 },
    { name: 'Sep', revenue: 14500000, forecast: 13200000, bookings: 620 },
    { name: 'Oct', revenue: 12900000, forecast: 12000000, bookings: 552 },
    { name: 'Nov', revenue: 15800000, forecast: 14500000, bookings: 675 },
    { name: 'Dec', revenue: 17200000, forecast: 15800000, bookings: 735 },
  ],
};

const formatTZS = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
};

const MANAGEMENT_ACTIONS = [
  { icon: Users, label: 'Users', href: '/admin/users', count: '12.4K' },
  { icon: Compass, label: 'Guides', href: '/admin/guides', count: '12 pending' },
  { icon: Store, label: 'Vendors', href: '/admin/vendors', count: '8 pending' },
  { icon: AlertTriangle, label: 'Disputes', href: '/admin/disputes', count: '3 open' },
  { icon: ShieldCheck, label: 'Fraud', href: '/admin/fraud', count: '2 new' },
  { icon: DollarSign, label: 'Revenue', href: '/admin/revenue', count: '450M TZS' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', count: 'Live' },
  { icon: Brain, label: 'AI Center', href: '/admin/ai-insights', count: '7 tools' },
  { icon: Megaphone, label: 'Broadcast', href: '/admin/broadcast', count: 'Send' },
  { icon: FileText, label: 'Audit Log', href: '/admin/audit', count: '2.1K' },
  { icon: Settings, label: 'Settings', href: '/admin/settings', count: 'Config' },
];

export default function AdminDashboard() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);
  const [revPeriod, setRevPeriod] = useState<RevPeriod>('1Y');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  const currentData = REVENUE_DATA[revPeriod];
  const totalRevenue = currentData.reduce((s, d) => s + d.revenue, 0);
  const totalForecast = currentData.reduce((s, d) => s + d.forecast, 0);
  const totalBookings = currentData.reduce((s, d) => s + d.bookings, 0);
  const growthPct = ((totalRevenue - totalForecast) / totalForecast * 100).toFixed(1);
  const peakMonth = currentData.reduce((max, d) => d.revenue > max.revenue ? d : max, currentData[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">{l('Admin Dashboard', 'Dashibodi ya Msimamizi')}</h1>
            <p className="text-sm text-[#94A3B8] mt-1">{l('AI-powered platform management', 'Usimamizi wa jukwaa unaotumia AI')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34D399]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[10px] font-bold text-[#34D399] uppercase">AI Active</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-gradient-to-r from-[#065F46] to-[#059669] p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-[#FBBF24]" />
              <h2 className="font-bold text-white">{l('AI Insights', 'Ufafanuzi wa AI')}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#FBBF24]/20 text-[10px] font-bold text-[#FBBF24]">LIVE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AI_INSIGHTS.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Icon className={`w-4 h-4 ${insight.color} mb-1`} />
                    <p className="text-xl font-bold text-white">{insight.value}</p>
                    <p className="text-[10px] text-white/60">{insight.label}</p>
                    <p className="text-[9px] text-white/40">{insight.desc}</p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push('/admin/ai-insights')}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium text-white"
            >
              <Sparkles className="w-4 h-4" />
              Open AI Command Center
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: l('Total Users', 'Watumiaji'), value: '12,450', change: '+340', color: '#34D399' },
          { icon: Compass, label: l('Active Guides', 'Miongozo Hai'), value: '2,500', change: '+28', color: '#34D399' },
          { icon: Store, label: l('Vendors', 'Wauzaji'), value: '3,200', change: '+15', color: '#FBBF24' },
          { icon: DollarSign, label: l('Revenue (MTZS)', 'Mapato'), value: '450', change: '+18%', color: '#FBBF24' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl">
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-[#F1F5F9]">{stat.value}</p>
            <p className="text-[10px] text-[#94A3B8]">{stat.label}</p>
            <p className="text-[10px] text-[#34D399] mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />{stat.change}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Revenue Trend — Modern Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
        {/* Header Row */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#065F46]/50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#34D399]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9]">{l('Revenue Trend', 'Mwelekeo wa Mapato')}</h3>
                <p className="text-[10px] text-[#64748B]">{l('Platform revenue vs AI forecast', 'Mapato ya jukwaa dhidi ya utabiri wa AI')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#34D399] font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />+{growthPct}%
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FBBF24]/10 text-[9px] font-bold text-[#FBBF24]">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center gap-1 mt-3 mb-4">
            {(['7D', '30D', '90D', '1Y'] as RevPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setRevPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  revPeriod === p
                    ? 'bg-[#065F46] text-[#34D399] shadow-lg shadow-[#065F46]/30'
                    : 'bg-[#0F172A] text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E293B]'
                }`}
              >
                {p}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => router.push('/admin/revenue')}
              className="text-[10px] text-[#64748B] hover:text-[#34D399] transition-colors flex items-center gap-1"
            >
              {l('View Details', 'Tazama Maelezo')} →
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="px-2">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={currentData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                {/* Revenue gradient */}
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#065F46" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#065F46" stopOpacity={0.02} />
                </linearGradient>
                {/* Forecast gradient */}
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.01} />
                </linearGradient>
                {/* Bar gradient */}
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#065F46" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 9 }}
                tickFormatter={formatTZS}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#94A3B8', fontSize: 11, fontWeight: 600, marginBottom: 6 }}
                itemStyle={{ padding: '2px 0' }}
                formatter={(value: number, name: string) => {
                  const label = name === 'revenue' ? 'Revenue' : name === 'forecast' ? 'AI Forecast' : 'Bookings';
                  const formatted = name === 'bookings' ? value.toString() : `TZS ${formatTZS(value)}`;
                  return [formatted, label];
                }}
                cursor={{ fill: '#34D399', opacity: 0.05 }}
              />
              {/* Forecast area (behind) */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#FBBF24"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="url(#forecastGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#FBBF24', stroke: '#0F172A', strokeWidth: 2 }}
              />
              {/* Revenue bars */}
              <Bar
                dataKey="revenue"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                barSize={revPeriod === '1Y' ? 28 : revPeriod === '90D' ? 40 : 36}
                opacity={0.85}
              />
              {/* Revenue line overlay */}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#34D399"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#34D399', stroke: '#0F172A', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="px-5 py-2 flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#065F46] to-[#34D399]" />
            <span className="text-[10px] text-[#94A3B8]">{l('Revenue', 'Mapato')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed border-[#FBBF24]" />
            <span className="text-[10px] text-[#94A3B8]">{l('AI Forecast', 'Utabiri wa AI')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-[#0F172A]" />
            <span className="text-[10px] text-[#94A3B8]">{l('Trend Line', 'Mstari wa Mwelekeo')}</span>
          </div>
        </div>

        {/* Mini Metrics Row */}
        <div className="px-5 pb-5 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: DollarSign,
              label: l('Total Revenue', 'Jumla'),
              value: `TZS ${formatTZS(totalRevenue)}`,
              sub: l('This period', 'Kipindi hiki'),
              color: '#34D399',
            },
            {
              icon: TrendingUp,
              label: l('vs Forecast', 'dhidi ya Utabiri'),
              value: `+${growthPct}%`,
              sub: Number(growthPct) > 0 ? l('Above forecast', 'Juu ya utabiri') : l('Below forecast', 'Chini ya utabiri'),
              color: Number(growthPct) > 0 ? '#34D399' : '#F87171',
            },
            {
              icon: Calendar,
              label: l('Peak Period', 'Kipindi cha Juu'),
              value: peakMonth?.name || '-',
              sub: `TZS ${formatTZS(peakMonth?.revenue || 0)}`,
              color: '#FBBF24',
            },
            {
              icon: Activity,
              label: l('Bookings', 'Maazimio'),
              value: totalBookings.toLocaleString(),
              sub: l('Total sessions', 'Jumla ya vikao'),
              color: '#22D3EE',
            },
          ].map((m, i) => (
            <div key={i} className="bg-[#0F172A] rounded-xl p-3">
              <m.icon className="w-3.5 h-3.5 mb-1" style={{ color: m.color }} />
              <p className="text-sm font-bold text-[#F1F5F9]">{m.value}</p>
              <p className="text-[9px] text-[#64748B]">{m.label}</p>
              <p className="text-[8px] text-[#475569]">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* AI Forecast Insight */}
        <div className="mx-5 mb-5 p-3 rounded-xl bg-gradient-to-r from-[#065F46]/30 to-[#059669]/10 border border-[#065F46]/40">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#34D399]">{l('AI Revenue Forecast', 'Utabiri wa Mapato wa AI')}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                {l(
                  `Revenue is trending ${growthPct}% above forecast. AI predicts 22% growth next month based on seasonal patterns, user activity, and Kariakoo market trends.`,
                  `Mapato yanaenda ${growthPct}% juu ya utabiri. AI inatabiri ukuaji wa 22% mwezi ujao kulingana na mifumo ya msimu na shughuli za watumiaji.`
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Management Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold text-[#F1F5F9] mb-3">{l('Management', 'Usimamizi')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MANAGEMENT_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl text-left hover:border-[#34D399]/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-[#34D399] group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-[#64748B] font-medium">{action.count}</span>
                </div>
                <h4 className="font-semibold text-xs text-[#F1F5F9]">{action.label}</h4>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity with AI tagging */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-bold text-[#F1F5F9] mb-3">{l('Recent Activity', 'Shughuli za Hivi Karibu')}</h2>
        <div className="space-y-2">
          {[
            { text: 'New guide verification request from Omar S.', time: '5 min ago', type: 'guide', ai: true },
            { text: 'AI flagged suspicious rating pattern on vendor #892', time: '12 min ago', type: 'fraud', ai: true },
            { text: 'Dispute #452 escalated by seeker', time: '15 min ago', type: 'dispute', ai: false },
            { text: 'AI revenue forecast updated: +22% next month', time: '1 hour ago', type: 'revenue', ai: true },
            { text: 'Vendor "Spice Paradise" submitted verification', time: '2 hours ago', type: 'vendor', ai: false },
          ].map((activity, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] p-3 rounded-xl flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.type === 'guide' ? 'bg-[#34D399]' : activity.type === 'dispute' ? 'bg-[#F87171]' : activity.type === 'fraud' ? 'bg-[#FBBF24]' : activity.type === 'revenue' ? 'bg-[#34D399]' : 'bg-[#22D3EE]'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-[#F1F5F9]">{activity.text}</p>
                  {activity.ai && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#34D399]/10 text-[8px] font-bold text-[#34D399]">AI</span>
                  )}
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34D399]/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#34D399]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F5F9]">{l('Admin AI Assistant', 'Msaidizi wa AI wa Msimamizi')}</p>
            <p className="text-xs text-[#94A3B8]">{l('Ask anything about platform analytics, user behavior, or fraud', 'Uliza chochote kuhusu uchambuzi, tabia ya mtumiaji, au udanganyifu')}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#34D399] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
