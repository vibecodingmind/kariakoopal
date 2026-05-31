'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion } from 'framer-motion';
import {
  Trophy, Flame, Star, Gift, ArrowLeft, CheckCircle2, MessageSquare,
  LogIn, UserPlus, Share2, ShoppingCart, Percent, Languages, Wallet,
  Crown, Clock, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { TIER_CONFIG, EARN_ACTIONS, type TierName } from '@/lib/loyalty-data';

// ── Icon Map ──
const ICON_MAP: Record<string, React.ElementType> = {
  CheckCircle2, MessageSquare, LogIn, UserPlus, Share2, ShoppingCart,
  Percent, Languages, Wallet, Crown, Clock, Gift, Trophy, Star,
};

// ── Reward Icon Component ──
function RewardIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Gift;
  return <Icon className={className || 'w-5 h-5'} />;
}

interface LoyaltyData {
  id: string;
  userId: string;
  points: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  tier: TierName;
  nextTier: TierName | null;
  nextTierPoints: number;
  progressPercent: number;
  transactions: Array<{
    id: string;
    points: number;
    type: string;
    reason: string;
    metadata: string;
    createdAt: string;
  }>;
}

interface Reward {
  id: string;
  name: string;
  nameSw: string;
  description: string;
  descriptionSw: string;
  pointsCost: number;
  type: string;
  value: number;
  isActive: boolean;
  icon: string;
}

// ── Circular Progress Ring ──
function ProgressRing({ percent, tier, size = 140 }: { percent: number; tier: TierName; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const tierColor = TIER_CONFIG[tier]?.color || '#CD7F32';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-[#E2E8F0] dark:text-[#334155]" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke={tierColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color: tierColor }}>{TIER_CONFIG[tier]?.icon}</span>
        <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mt-0.5">{TIER_CONFIG[tier]?.name}</span>
      </div>
    </div>
  );
}

// ── Streak Day Dots ──
function StreakDots({ currentStreak }: { currentStreak: number }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1; // Monday=0

  return (
    <div className="flex items-center gap-1.5">
      {days.map((day, i) => {
        const isActive = i <= adjustedToday && (adjustedToday - i) < currentStreak;
        const isToday = i === adjustedToday;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              isActive
                ? isToday ? 'bg-[#F59E0B] text-white ring-2 ring-[#F59E0B]/30' : 'bg-[#065F46] text-white'
                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8]'
            }`}>
              {isActive ? '✓' : day}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Reason Label Helper ──
function getReasonLabel(reason: string, sw: boolean): string {
  const labels: Record<string, { en: string; sw: string }> = {
    session_completed:      { en: 'Session Completed',   sw: 'Kipindi Kimekamilika' },
    review_written:         { en: 'Review Written',      sw: 'Mapitio Yameandikwa' },
    daily_login:            { en: 'Daily Login',         sw: 'Kuingia Kila Siku' },
    referral_completed:     { en: 'Referral Bonus',      sw: 'Zawadi ya Mwaliko' },
    social_share:           { en: 'Social Share',        sw: 'Kushiriki' },
    shopping_list_completed:{ en: 'Shopping List Done',  sw: 'Orodha Imekamilika' },
    streak_bonus_7day:      { en: '7-Day Streak Bonus',  sw: 'Zawadi ya Siku 7' },
    redeemed_discount:      { en: 'Reward Redeemed',     sw: 'Zawadi Imetumika' },
  };
  const l = labels[reason];
  return l ? (sw ? l.sw : l.en) : reason;
}

export default function LoyaltyPage() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [data, setData] = useState<LoyaltyData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth'); return; }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch(`/api/loyalty?userId=${user.id}`).then(r => r.json()),
      fetch('/api/loyalty/rewards').then(r => r.json()),
    ]).then(([loyaltyData, rewardsData]) => {
      setData(loyaltyData);
      setRewards(rewardsData.rewards || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const handleRedeem = async (reward: Reward) => {
    if (!user?.id || !data || data.points < reward.pointsCost) return;
    setRedeeming(reward.id);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rewardId: reward.id }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(sw ? `Umeomba: ${reward.nameSw || reward.name}` : `Redeemed: ${reward.name}`);
        if (result.account) {
          setData(prev => prev ? { ...prev, ...result.account, transactions: prev.transactions } : prev);
        }
        // Record daily login points for demo
        await fetch('/api/loyalty/earn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, points: 10, type: 'daily_login', reason: 'daily_login' }),
        });
      } else {
        toast.error(result.error || 'Redemption failed');
      }
    } catch {
      toast.error(sw ? 'Hitilafu' : 'Redemption failed');
    }
    setRedeeming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#065F46] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tierInfo = data ? TIER_CONFIG[data.tier] : TIER_CONFIG.bronze;

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">{l('Loyalty & Rewards', 'Uaminifu na Zawadi')}</h1>
          <p className="text-xs text-[#64748B]">{l('Earn points, unlock rewards', 'Pata pointi, fungua zawadi')}</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${tierInfo.color}20` }}>
          <Trophy className="w-4 h-4" style={{ color: tierInfo.color }} />
          <span className="text-xs font-bold" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
        </div>
      </motion.div>

      {/* Tier Progress Ring */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="kcard p-6 flex flex-col items-center"
      >
        <ProgressRing percent={data?.progressPercent || 0} tier={data?.tier || 'bronze'} />
        <div className="text-center mt-4">
          <p className="text-3xl font-black text-[#0F172A] dark:text-[#F1F5F9]">
            {data?.points?.toLocaleString() || 0}
            <span className="text-sm font-semibold text-[#64748B] ml-1">{l('pts', 'pt')}</span>
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {data?.nextTier
              ? l(`${data.nextTierPoints - (data?.points || 0)} pts to ${TIER_CONFIG[data.nextTier].name}`, `${data.nextTierPoints - (data?.points || 0)} pt hadi ${TIER_CONFIG[data.nextTier].nameSw}`)
              : l('Max tier reached!', 'Umeifikia kiwango cha juu!')
            }
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full mt-4">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
            {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
              <span key={key} style={{ color: cfg.color }} className={data?.tier === key ? 'text-sm' : 'opacity-50'}>
                {cfg.icon} {cfg.name}
              </span>
            ))}
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: tierInfo.color }}
              initial={{ width: 0 }}
              animate={{ width: `${data?.progressPercent || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <p className="text-xs text-[#64748B] mt-2">{l(`Lifetime: ${(data?.lifetimePoints || 0).toLocaleString()} pts`, `Jumla: ${(data?.lifetimePoints || 0).toLocaleString()} pt`)}</p>
      </motion.div>

      {/* Streak Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="kcard p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">{l('Daily Streak', 'Mfululizo wa Siku')}</p>
              <p className="text-xs text-[#64748B]">{l('Keep it alive!', 'Endelea!')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#F59E0B]">{data?.currentStreak || 0}</p>
            <p className="text-[10px] text-[#64748B]">{l('days', 'siku')}</p>
          </div>
        </div>

        <StreakDots currentStreak={data?.currentStreak || 0} />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#334155]">
          <p className="text-xs text-[#64748B]">
            {l(`Best: ${data?.longestStreak || 0} days`, `Bora: ${data?.longestStreak || 0} siku`)}
          </p>
          {data?.currentStreak && data.currentStreak >= 7 ? (
            <span className="px-2 py-1 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold">
              {l('Streak Bonus Active!', 'Zawadi ya Mfululizo!')}
            </span>
          ) : null}
        </div>
      </motion.div>

      {/* Earn Points */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F1F5F9]">{l('Earn Points', 'Pata Pointi')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {EARN_ACTIONS.map((action, i) => {
            const Icon = ICON_MAP[action.icon] || Star;
            return (
              <motion.div key={action.reason} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.05 }}
                className="kcard p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#065F46]/10 dark:bg-[#34D399]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{sw ? action.labelSw : action.label}</p>
                    <p className="text-sm font-black text-[#F59E0B] mt-0.5">+{action.points}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Rewards Shop */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F1F5F9]">{l('Rewards Shop', 'Duka la Zawadi')}</h2>
          </div>
          <span className="text-xs text-[#64748B]">{data?.points?.toLocaleString() || 0} {l('pts available', 'pt zinazopatikana')}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {rewards.map((reward, i) => {
            const canRedeem = (data?.points || 0) >= reward.pointsCost;
            const isRedeeming = redeeming === reward.id;
            return (
              <motion.div key={reward.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.06 }}
                className="kcard p-4 min-w-[160px] max-w-[180px] flex flex-col items-center text-center shrink-0"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${canRedeem ? 'bg-[#065F46]/10 dark:bg-[#34D399]/10' : 'bg-[#F1F5F9] dark:bg-[#334155]'}`}>
                  <RewardIcon name={reward.icon} className={`w-6 h-6 ${canRedeem ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#94A3B8]'}`} />
                </div>
                <p className="text-xs font-bold mb-0.5">{sw ? reward.nameSw : reward.name}</p>
                <p className="text-[10px] text-[#64748B] mb-2 line-clamp-2">{sw ? reward.descriptionSw : reward.description}</p>
                <p className="text-sm font-black text-[#F59E0B] mb-2">{reward.pointsCost} pts</p>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || isRedeeming}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    canRedeem
                      ? 'bg-[#065F46] text-white hover:bg-[#065F46]/90 active:scale-95'
                      : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  {isRedeeming ? '...' : canRedeem ? l('Redeem', 'Omba') : l('Need more pts', 'Hitaji zaidi')}
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F1F5F9]">{l('Recent Activity', 'Shughuli za Hivi Karibu')}</h2>
        </div>
        <div className="space-y-2">
          {(data?.transactions || []).slice(0, 8).map((tx, i) => {
            const isPositive = tx.points > 0;
            const meta = (() => { try { return JSON.parse(tx.metadata || '{}'); } catch { return {}; } })();
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.04 }}
                className="kcard p-3 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isPositive ? 'bg-[#065F46]/10 dark:bg-[#34D399]/10' : 'bg-[#FEE2E2] dark:bg-[#2D1B1B]'
                }`}>
                  {isPositive
                    ? <Sparkles className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                    : <Gift className="w-4 h-4 text-[#DC2626]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{getReasonLabel(tx.reason, sw)}</p>
                  {meta.guideName && <p className="text-[10px] text-[#64748B]">{meta.guideName}</p>}
                  {meta.rewardName && <p className="text-[10px] text-[#64748B]">{meta.rewardName}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isPositive ? 'text-[#065F46] dark:text-[#34D399]' : 'text-[#DC2626]'}`}>
                    {isPositive ? '+' : ''}{tx.points}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    {new Date(tx.createdAt).toLocaleDateString(sw ? 'sw-TZ' : 'en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Claim Daily Points CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="kcard-green p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{l('Claim Daily Points', 'Pata Pointi za Leo')}</p>
            <p className="text-xs text-white/60">{l('Earn 10 pts just for visiting!', 'Pata 10 pt kwa kutembelea!')}</p>
          </div>
          <button
            onClick={async () => {
              if (!user?.id) return;
              try {
                const res = await fetch('/api/loyalty/earn', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, points: 10, type: 'daily_login', reason: 'daily_login' }),
                });
                const result = await res.json();
                if (result.success) {
                  toast.success(sw ? 'Umapata +10 pointi!' : 'You earned +10 points!');
                  if (result.account) setData(prev => prev ? { ...prev, ...result.account, transactions: prev.transactions } : prev);
                } else {
                  toast.info(sw ? 'Umeshapata leo!' : 'Already claimed today!');
                }
              } catch { toast.error(sw ? 'Hitilafu' : 'Failed'); }
            }}
            className="px-4 py-2 rounded-xl bg-white text-[#065F46] text-xs font-bold hover:bg-white/90 active:scale-95 transition-all"
          >
            {l('Claim', 'Pata')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
