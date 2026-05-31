'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Users, Star, Flame, ArrowLeft, Zap, Gift, TrendingUp } from 'lucide-react';
import { TIER_CONFIG, DEMO_LOYALTY_ACCOUNT, DEMO_LOYALTY_TRANSACTIONS, getReasonLabel } from '@/lib/loyalty-data';

export default function AdminLoyaltyPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth');
  }, [isAuthenticated, router]);

  // Demo stats
  const stats = {
    totalMembers: 1247,
    totalPointsIssued: 284500,
    totalPointsRedeemed: 67200,
    activeStreaks: 342,
    bronzeCount: 580,
    silverCount: 389,
    goldCount: 198,
    diamondCount: 80,
  };

  const tierData = [
    { name: 'Bronze', count: stats.bronzeCount, color: TIER_CONFIG.bronze.color },
    { name: 'Silver', count: stats.silverCount, color: TIER_CONFIG.silver.color },
    { name: 'Gold', count: stats.goldCount, color: TIER_CONFIG.gold.color },
    { name: 'Diamond', count: stats.diamondCount, color: TIER_CONFIG.diamond.color },
  ];

  const maxCount = Math.max(...tierData.map(t => t.count));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Loyalty Program</h1>
          <p className="text-sm text-white/50">Points, streaks & rewards management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.totalMembers.toLocaleString(), icon: Users, color: 'from-emerald-600 to-emerald-700' },
          { label: 'Points Issued', value: stats.totalPointsIssued.toLocaleString(), icon: Zap, color: 'from-amber-500 to-amber-600' },
          { label: 'Points Redeemed', value: stats.totalPointsRedeemed.toLocaleString(), icon: Gift, color: 'from-purple-600 to-purple-700' },
          { label: 'Active Streaks', value: stats.activeStreaks.toLocaleString(), icon: Flame, color: 'from-red-500 to-red-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tier Distribution */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white/5 rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-white">Tier Distribution</h2>
        </div>
        <div className="space-y-3">
          {tierData.map((tier) => (
            <div key={tier.name} className="flex items-center gap-3">
              <span className="text-sm font-medium text-white/70 w-20">{tier.name}</span>
              <div className="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-lg flex items-center px-3"
                  style={{ backgroundColor: tier.color + '40' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(tier.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.count}</span>
                </motion.div>
              </div>
              <span className="text-xs text-white/40 w-16 text-right">{((tier.count / stats.totalMembers) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/5 rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-white">Recent Activity</h2>
        </div>
        <div className="space-y-2">
          {DEMO_LOYALTY_TRANSACTIONS.slice(0, 8).map((tx, i) => {
            const isPositive = tx.points > 0;
            return (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {isPositive ? <Star className="w-4 h-4 text-emerald-400" /> : <Gift className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{getReasonLabel(tx.reason, false)}</p>
                    <p className="text-xs text-white/30">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{tx.points} pts
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
