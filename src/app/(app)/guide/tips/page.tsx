'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  Heart, MessageCircle, EyeOff, TrendingUp, DollarSign,
  Calendar, ArrowUpRight, Gift
} from 'lucide-react';

interface TipEntry {
  id: string;
  sessionId: string;
  fromUserId: string;
  amount: number;
  message: string;
  isAnonymous: boolean;
  createdAt: string;
}

interface TipStats {
  total: number;
  count: number;
  average: number;
  thisMonth: number;
}

const DEMO_TIPS: TipEntry[] = [
  { id: 't1', sessionId: 's1', fromUserId: 'user1', amount: 5000, message: 'Great guide! Very helpful with bargaining.', isAnonymous: false, createdAt: '2026-06-02T10:30:00Z' },
  { id: 't2', sessionId: 's2', fromUserId: 'user2', amount: 10000, message: 'Amazing experience, thank you!', isAnonymous: false, createdAt: '2026-06-01T14:20:00Z' },
  { id: 't3', sessionId: 's3', fromUserId: 'user3', amount: 2000, message: '', isAnonymous: true, createdAt: '2026-05-30T09:15:00Z' },
  { id: 't4', sessionId: 's4', fromUserId: 'user4', amount: 5000, message: 'Knows all the best spots!', isAnonymous: false, createdAt: '2026-05-28T16:45:00Z' },
  { id: 't5', sessionId: 's5', fromUserId: 'user5', amount: 2000, message: 'Thanks for the fabric tips', isAnonymous: true, createdAt: '2026-05-25T11:00:00Z' },
];

const DEMO_STATS: TipStats = {
  total: 24000,
  count: 5,
  average: 4800,
  thisMonth: 17000,
};

export default function GuideTipsPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [tips, setTips] = useState<TipEntry[]>([]);
  const [stats, setStats] = useState<TipStats>(DEMO_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tips?userId=current&direction=received');
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.tips?.length) {
            setTips(data.tips);
            setStats(data.stats);
          } else {
            setTips(DEMO_TIPS);
            setStats(DEMO_STATS);
          }
        } else if (!cancelled) {
          setTips(DEMO_TIPS);
          setStats(DEMO_STATS);
        }
      } catch {
        if (!cancelled) {
          setTips(DEMO_TIPS);
          setStats(DEMO_STATS);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="px-4 py-4 space-y-5 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#F43F5E] fill-[#F43F5E]" />
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
            {l('Tips Received', 'Zawadi Zilizopokelewa')}
          </h1>
        </div>
        <p className="text-sm text-[#64748B] mt-1">
          {l('Tips from happy tourists after sessions', 'Zawadi kutoka kwa watalii wenye furaha baada ya vikao')}
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="kcard-green p-4"
        >
          <DollarSign className="w-5 h-5 text-white/70 mb-1" />
          <p className="text-2xl font-bold text-white">TZS {stats.total.toLocaleString()}</p>
          <p className="text-xs text-white/70">{l('Total Tips', 'Jumla ya Zawadi')}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="kcard p-4"
        >
          <TrendingUp className="w-5 h-5 text-[#F59E0B] mb-1" />
          <p className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">TZS {stats.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-[#64748B]">{l('This Month', 'Mwezi Huu')}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="kcard p-4"
        >
          <Gift className="w-5 h-5 text-[#A78BFA] mb-1" />
          <p className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{stats.count}</p>
          <p className="text-xs text-[#64748B]">{l('Total Count', 'Jumla ya Idadi')}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="kcard p-4"
        >
          <ArrowUpRight className="w-5 h-5 text-[#34D399] mb-1" />
          <p className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">TZS {Math.round(stats.average).toLocaleString()}</p>
          <p className="text-xs text-[#64748B]">{l('Average Tip', 'Wastani')}</p>
        </motion.div>
      </div>

      {/* Tips list */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-[#065F46] dark:text-[#34D399]">
          {l('Recent Tips', 'Zawadi za Hivi Karibu')}
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FCE7F3] flex items-center justify-center shrink-0">
                  {tip.isAnonymous ? (
                    <EyeOff className="w-4 h-4 text-[#EC4899]" />
                  ) : (
                    <Heart className="w-4 h-4 text-[#F43F5E] fill-[#F43F5E]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">
                      {tip.isAnonymous
                        ? l('Anonymous Tourist', 'Mtalii Asiyejulikana')
                        : l('Tourist', 'Mtalii')}
                    </p>
                    {tip.isAnonymous && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-[#FCE7F3] text-[#EC4899]">
                        {l('ANON', 'BILA JINA')}
                      </span>
                    )}
                  </div>
                  {tip.message && (
                    <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 shrink-0" />
                      {tip.message}
                    </p>
                  )}
                  <p className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                    TZS {tip.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
