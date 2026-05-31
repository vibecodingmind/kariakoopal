'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  Banknote, TrendingUp, ArrowDownToLine, CreditCard,
  Download, Filter, ArrowLeft, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart as PieChartIcon, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Line, ComposedChart,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'year';

interface Transaction {
  id: string; date: string; type: 'M-Pesa' | 'Subscription' | 'Escrow';
  amount: number; status: 'completed' | 'pending' | 'failed'; description: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2025-05-31', type: 'M-Pesa', amount: 350000, status: 'completed', description: 'Session payment from James K.' },
  { id: 't2', date: '2025-05-31', type: 'Subscription', amount: 45000, status: 'completed', description: 'Guide Pro plan — Fatma H.' },
  { id: 't3', date: '2025-05-30', type: 'Escrow', amount: 120000, status: 'pending', description: 'Escrow hold — Omar S. session' },
  { id: 't4', date: '2025-05-30', type: 'M-Pesa', amount: 89000, status: 'completed', description: 'Session payment from Amina S.' },
  { id: 't5', date: '2025-05-29', type: 'M-Pesa', amount: 215000, status: 'completed', description: 'Multiple session payments' },
  { id: 't6', date: '2025-05-29', type: 'Subscription', amount: 95000, status: 'completed', description: 'Guide Elite plan — Mwanamvua J.' },
  { id: 't7', date: '2025-05-28', type: 'Escrow', amount: 67000, status: 'pending', description: 'Escrow hold — David M. session' },
  { id: 't8', date: '2025-05-28', type: 'M-Pesa', amount: 54000, status: 'failed', description: 'Failed payment — Hassan M.' },
  { id: 't9', date: '2025-05-27', type: 'M-Pesa', amount: 178000, status: 'completed', description: 'Session payment batch' },
  { id: 't10', date: '2025-05-27', type: 'Subscription', amount: 45000, status: 'completed', description: 'Guide Pro plan — Asha M.' },
  { id: 't11', date: '2025-05-26', type: 'M-Pesa', amount: 295000, status: 'completed', description: 'Tour group payment' },
  { id: 't12', date: '2025-05-25', type: 'Escrow', amount: 88000, status: 'pending', description: 'Escrow release — Said B.' },
];

const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 720000, mpesa: 520000, subscription: 140000, escrow: 60000, forecast: 650000 },
  { month: 'Feb', revenue: 890000, mpesa: 640000, subscription: 180000, escrow: 70000, forecast: 800000 },
  { month: 'Mar', revenue: 1050000, mpesa: 750000, subscription: 220000, escrow: 80000, forecast: 950000 },
  { month: 'Apr', revenue: 980000, mpesa: 700000, subscription: 200000, escrow: 80000, forecast: 920000 },
  { month: 'May', revenue: 1240000, mpesa: 890000, subscription: 260000, escrow: 90000, forecast: 1100000 },
  { month: 'Jun', revenue: 1150000, mpesa: 820000, subscription: 240000, escrow: 90000, forecast: 1080000 },
  { month: 'Jul', revenue: 1380000, mpesa: 990000, subscription: 290000, escrow: 100000, forecast: 1250000 },
  { month: 'Aug', revenue: 1120000, mpesa: 800000, subscription: 230000, escrow: 90000, forecast: 1050000 },
  { month: 'Sep', revenue: 1450000, mpesa: 1040000, subscription: 300000, escrow: 110000, forecast: 1320000 },
  { month: 'Oct', revenue: 1290000, mpesa: 920000, subscription: 270000, escrow: 100000, forecast: 1200000 },
  { month: 'Nov', revenue: 1580000, mpesa: 1130000, subscription: 330000, escrow: 120000, forecast: 1450000 },
  { month: 'Dec', revenue: 1720000, mpesa: 1230000, subscription: 360000, escrow: 130000, forecast: 1580000 },
];

const REVENUE_BREAKDOWN = [
  { name: 'M-Pesa', value: 9570000, color: '#34D399' },
  { name: 'Subscriptions', value: 3020000, color: '#FBBF24' },
  { name: 'Escrow', value: 1120000, color: '#22D3EE' },
];

const formatTZS = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
};

const TYPE_BADGE: Record<Transaction['type'], string> = {
  'M-Pesa': 'kbadge-live', 'Subscription': 'kbadge-gold', 'Escrow': 'kbadge-silver',
};

const TYPE_BG: Record<Transaction['type'], string> = {
  'M-Pesa': 'bg-[#ECFDF5] dark:bg-[#064E3B]',
  'Subscription': 'bg-[#FEF3C7] dark:bg-[#78350F]',
  'Escrow': 'bg-[#F1F5F9] dark:bg-[#334155]',
};

const TYPE_ICON: Record<Transaction['type'], typeof Banknote> = {
  'M-Pesa': Banknote, 'Subscription': CreditCard, 'Escrow': ArrowDownToLine,
};

const STATUS_COLOR: Record<Transaction['status'], string> = {
  completed: 'text-[#059669]', pending: 'text-[#F59E0B]', failed: 'text-[#DC2626]',
};

const STATUS_BADGE: Record<Transaction['status'], string> = {
  completed: 'kbadge-verified', pending: 'kbadge-pending', failed: 'kbadge-urgent',
};

export default function AdminRevenuePage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalForecast = MONTHLY_REVENUE.reduce((s, m) => s + m.forecast, 0);
  const growthPct = ((totalRevenue - totalForecast) / totalForecast * 100).toFixed(1);

  const periods: { key: Period; label: string; labelSw: string }[] = [
    { key: 'today', label: 'Today', labelSw: 'Leo' },
    { key: 'week', label: 'This Week', labelSw: 'Wiki Hii' },
    { key: 'month', label: 'This Month', labelSw: 'Mwezi Huu' },
    { key: 'year', label: 'This Year', labelSw: 'Mwaka Huu' },
  ];

  const exportCSV = () => {
    const headers = 'Date,Type,Amount (TZS),Status,Description\n';
    const rows = TRANSACTIONS.map((t) => `${t.date},${t.type},${t.amount},${t.status},"${t.description}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chimbo-revenue-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 space-y-5 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="kbtn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold gradient-text-green">{l('Revenue Dashboard', 'Dashibodi ya Mapato')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{l('Financial overview & transactions', 'Muhtasari wa kifedha na miamala')}</p>
        </div>
        <button onClick={exportCSV} className="kbtn-yellow text-xs py-2 px-3 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />{l('Export CSV', 'Pakua CSV')}
        </button>
      </motion.div>

      {/* Revenue Cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        {[
          { icon: Banknote, label: l('Total Revenue', 'Jumla ya Mapato'), value: 'TZS 12.4M', trend: '+18%', up: true, color: '#065F46' },
          { icon: Banknote, label: l('M-Pesa Revenue', 'Mapato ya M-Pesa'), value: 'TZS 8.2M', trend: '+22%', up: true, color: '#059669' },
          { icon: CreditCard, label: l('Subscriptions', 'Usajili'), value: 'TZS 2.8M', trend: '+8%', up: true, color: '#F59E0B' },
          { icon: ArrowDownToLine, label: l('Escrow Held', 'Escrow Iliyoshikwa'), value: 'TZS 1.4M', trend: '-3%', up: false, color: '#DC2626' },
        ].map((card, i) => (
          <div key={i} className="kcard-glass p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${card.up ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{card.trend}
              </span>
            </div>
            <p className="text-lg font-bold">{card.value}</p>
            <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{card.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Period Filter */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Filter className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] self-center shrink-0" />
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`ktag whitespace-nowrap ${period === p.key ? 'ktag-active' : 'ktag-inactive'}`}>
            {sw ? p.labelSw : p.label}
          </button>
        ))}
      </motion.div>

      {/* Monthly Revenue — Modern Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#065F46]/50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#34D399]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9]">{l('Monthly Revenue', 'Mapato ya Kila Mwezi')}</h3>
                <p className="text-[10px] text-[#64748B]">{l('Revenue breakdown by source & AI forecast', 'Mgawanyiko wa mapato kwa chanzo na utabiri wa AI')}</p>
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
        </div>

        {/* Stacked Bar + Forecast Line Chart */}
        <div className="px-2 mt-3">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="mpesaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#065F46" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="escrowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0891B2" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9 }} tickFormatter={formatTZS} width={48} />
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
                  const labels: Record<string, string> = {
                    mpesa: 'M-Pesa',
                    subscription: 'Subscriptions',
                    escrow: 'Escrow',
                    forecast: 'AI Forecast',
                  };
                  return [`TZS ${formatTZS(value)}`, labels[name] || name];
                }}
                cursor={{ fill: '#34D399', opacity: 0.05 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontSize: 10 }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    mpesa: 'M-Pesa',
                    subscription: 'Subscriptions',
                    escrow: 'Escrow',
                    forecast: 'AI Forecast',
                  };
                  return <span style={{ color: '#94A3B8', fontSize: 10 }}>{labels[value] || value}</span>;
                }}
              />
              {/* Stacked Bars */}
              <Bar dataKey="mpesa" stackId="revenue" fill="url(#mpesaGrad)" radius={[0, 0, 0, 0]} barSize={28} />
              <Bar dataKey="subscription" stackId="revenue" fill="url(#subGrad)" radius={[0, 0, 0, 0]} barSize={28} />
              <Bar dataKey="escrow" stackId="revenue" fill="url(#escrowGrad)" radius={[4, 4, 0, 0]} barSize={28} />
              {/* Forecast Line */}
              <Area type="monotone" dataKey="forecast" stroke="#FBBF24" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastAreaGrad)" dot={false} activeDot={{ r: 4, fill: '#FBBF24', stroke: '#0F172A', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="px-5 py-2 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#065F46] to-[#34D399]" />
            <span className="text-[10px] text-[#94A3B8]">M-Pesa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#D97706] to-[#FBBF24]" />
            <span className="text-[10px] text-[#94A3B8]">{l('Subscriptions', 'Usajili')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#0891B2] to-[#22D3EE]" />
            <span className="text-[10px] text-[#94A3B8]">Escrow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0 border-t-2 border-dashed border-[#FBBF24]" />
            <span className="text-[10px] text-[#94A3B8]">{l('AI Forecast', 'Utabiri wa AI')}</span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="mx-5 mb-5 p-3 rounded-xl bg-gradient-to-r from-[#065F46]/30 to-[#059669]/10 border border-[#065F46]/40">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#34D399]">{l('AI Revenue Forecast', 'Utabiri wa Mapato wa AI')}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                {l(
                  `Annual revenue trending ${growthPct}% above forecast. M-Pesa remains the dominant channel at 70%. AI predicts 22% growth next quarter driven by holiday tourism in Kariakoo.`,
                  `Mapato ya mwaka yanaenda ${growthPct}% juu ya utabiri. M-Pesa inabaki kuwa chanzo kikuu kwa 70%. AI inatabiri ukuaji wa 22% robo ijayo kutokana na utalii wa likizo Kariakoo.`
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Breakdown Donut + Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#065F46]/50 flex items-center justify-center">
              <PieChartIcon className="w-3.5 h-3.5 text-[#34D399]" />
            </div>
            <h3 className="font-bold text-sm text-[#F1F5F9]">{l('Revenue Mix', 'Mchanganyiko wa Mapato')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={REVENUE_BREAKDOWN}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {REVENUE_BREAKDOWN.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                formatter={(value: number, name: string) => [`TZS ${formatTZS(value)}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {REVENUE_BREAKDOWN.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[#94A3B8]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F1F5F9]">TZS {formatTZS(item.value)}</span>
                  <span className="text-[10px] text-[#64748B]">{((item.value / REVENUE_BREAKDOWN.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-2xl">
          <h3 className="font-bold text-sm text-[#F1F5F9] mb-4">{l('Key Metrics', 'Vipimo Muhimu')}</h3>
          <div className="space-y-3">
            {[
              { label: l('Avg Monthly Revenue', 'Wastani wa Mwezi'), value: `TZS ${formatTZS(totalRevenue / 12)}`, icon: Banknote, color: '#34D399' },
              { label: l('Peak Month', 'Mwezi wa Juu'), value: 'Dec — TZS 1.7M', icon: TrendingUp, color: '#FBBF24' },
              { label: l('M-Pesa Share', 'Sehemu ya M-Pesa'), value: '70%', icon: CreditCard, color: '#34D399' },
              { label: l('Growth Rate', 'Kiwango cha Ukuaji'), value: `+${growthPct}%`, icon: ArrowUpRight, color: '#22D3EE' },
              { label: l('Escrow Pending', 'Escrow Inasubiri'), value: 'TZS 155K', icon: ArrowDownToLine, color: '#F59E0B' },
              { label: l('vs Forecast', 'dhidi ya Utabiri'), value: Number(growthPct) > 0 ? `+${growthPct}%` : `${growthPct}%`, icon: Sparkles, color: Number(growthPct) > 0 ? '#34D399' : '#F87171' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0F172A]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#64748B]">{m.label}</p>
                  <p className="text-sm font-bold text-[#F1F5F9]">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Transaction Log */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-bold mb-3">{l('Transaction Log', 'Kumbukumbu ya Miamala')}</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {TRANSACTIONS.map((tx, i) => {
            const TxIcon = TYPE_ICON[tx.type];
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }} className="kcard p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_BG[tx.type]}`}>
                  <TxIcon className={`w-4 h-4 ${tx.type === 'M-Pesa' ? 'text-[#059669]' : tx.type === 'Subscription' ? 'text-[#F59E0B]' : 'text-[#64748B]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`kbadge ${TYPE_BADGE[tx.type]}`}>{tx.type}</span>
                    <span className={`kbadge ${STATUS_BADGE[tx.status]}`}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">{tx.description}</p>
                  <p className="text-[10px] text-[#94A3B8]">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">TZS {(tx.amount / 1000).toFixed(0)}K</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Payout Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-sm font-bold mb-3">{l('Payout Summary', 'Muhtasari wa Malipo')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: l('Total Payouts', 'Jumla ya Malipo'), value: 'TZS 9.6M', color: '#065F46', icon: Banknote },
            { label: l('Pending', 'Inasubiri'), value: 'TZS 340K', color: '#F59E0B', icon: ArrowDownToLine },
            { label: l('Avg Payout', 'Wastani'), value: 'TZS 85K', color: '#059669', icon: TrendingUp },
          ].map((item, i) => (
            <div key={i} className="kcard p-3 text-center">
              <item.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: item.color }} />
              <p className="text-sm font-bold">{item.value}</p>
              <p className="text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
