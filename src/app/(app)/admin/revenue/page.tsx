'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  Banknote, TrendingUp, ArrowDownToLine, CreditCard,
  Download, Filter, ArrowLeft, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

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
  { month: 'Jan', value: 720000 }, { month: 'Feb', value: 890000 },
  { month: 'Mar', value: 1050000 }, { month: 'Apr', value: 980000 },
  { month: 'May', value: 1240000 }, { month: 'Jun', value: 1150000 },
  { month: 'Jul', value: 1380000 }, { month: 'Aug', value: 1120000 },
  { month: 'Sep', value: 1450000 }, { month: 'Oct', value: 1290000 },
  { month: 'Nov', value: 1580000 }, { month: 'Dec', value: 1720000 },
];

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

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.value));

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
    a.href = url; a.download = `kariako-revenue-${period}.csv`; a.click();
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

      {/* Monthly Revenue Chart — CSS Bars */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="kcard p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
            {l('Monthly Revenue', 'Mapato ya Kila Mwezi')}
          </h3>
          <span className="text-xs text-[#059669] font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />+18%
          </span>
        </div>
        <div className="h-44 flex items-end gap-1.5">
          {MONTHLY_REVENUE.map((m, i) => {
            const pct = (m.value / maxRevenue) * 100;
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <span className="absolute -top-6 text-[9px] font-bold text-[#065F46] dark:text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity">
                  {(m.value / 1e6).toFixed(1)}M
                </span>
                <div className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${pct}%`, minHeight: '4px',
                    background: isCurrent
                      ? 'linear-gradient(180deg, #F59E0B, #D97706)'
                      : 'linear-gradient(180deg, #065F46, #059669)',
                  }}
                />
                <span className="text-[8px] text-[#64748B] dark:text-[#94A3B8]">{m.month}</span>
              </div>
            );
          })}
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
