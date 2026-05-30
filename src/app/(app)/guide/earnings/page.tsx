'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const PAYOUTS = [
  { id: 'pay1', date: 'May 30, 2026', amount: 125000, status: 'processed', method: 'M-Pesa' },
  { id: 'pay2', date: 'May 25, 2026', amount: 95000, status: 'processed', method: 'M-Pesa' },
  { id: 'pay3', date: 'May 20, 2026', amount: 75000, status: 'processed', method: 'Tigo Pesa' },
  { id: 'pay4', date: 'May 28, 2026', amount: 55000, status: 'pending', method: 'M-Pesa' },
];

export default function GuideEarningsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Earnings', 'Mapato')}</h1>
      </motion.div>

      {/* Total Earnings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard-green p-5">
        <p className="text-sm text-white/70">{l('Total Earnings', 'Jumla ya Mapato')}</p>
        <p className="text-3xl font-bold text-white mt-1">TZS 425,000</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3 text-[#10B981]" />
          <span className="text-xs text-[#10B981]">+12% {l('this month', 'mwezi huu')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/60">{l('Available', 'Inapatikana')}</p>
            <p className="text-lg font-bold text-[#FFD23F]">TZS 55,000</p>
          </div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-xs text-white/60">{l('Pending', 'Inasubiri')}</p>
            <p className="text-lg font-bold text-white">TZS 55,000</p>
          </div>
        </div>
        <button className="kbtn-yellow w-full mt-4 text-sm">{l('Withdraw to M-Pesa', 'Toa kwa M-Pesa')}</button>
      </motion.div>

      {/* Payout History */}
      <div>
        <h2 className="text-lg font-bold mb-3">{l('Payout History', 'Historia ya Malipo')}</h2>
        <div className="space-y-2">
          {PAYOUTS.map((payout, i) => (
            <motion.div key={payout.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${payout.status === 'processed' ? 'bg-[#E8F5EE]' : 'bg-[#FEF3C7]'}`}>
                  {payout.status === 'processed' ? <ArrowUpRight className="w-4 h-4 text-[#0B5D3A]" /> : <Clock className="w-4 h-4 text-[#D97706]" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{payout.method}</p>
                  <p className="text-xs text-[#6C757D]">{payout.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">TZS {payout.amount.toLocaleString()}</p>
                <span className={`kbadge text-[8px] ${payout.status === 'processed' ? 'kbadge-verified' : 'kbadge-pending'}`}>{payout.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
