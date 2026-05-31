'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Share2, Gift, Users, TrendingUp, CheckCircle,
  MessageSquare, Send, Link2, ChevronRight, Award, Star,
  Zap, Crown, Medal, Trophy, RefreshCw, Loader2, Trophy as Leaderboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Types ──

interface ReferralTier {
  name: string;
  range: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  reward: string;
  current: boolean;
}

interface ReferredPerson {
  id: string;
  referrerId: string;
  refereeId: string | null;
  code: string;
  status: 'active' | 'pending' | 'rewarded' | 'converted';
  reward: number;
  createdAt: string;
  convertedAt: string | null;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  totalReferrals: number;
  totalEarnings: number;
  rank: number;
}

// ── Demo Data ──

const REFERRAL_TIERS: ReferralTier[] = [
  { name: 'Bronze', range: '1-5', icon: Medal, color: '#CD7F32', bgColor: '#FDF2E9', reward: '500 TZS per referral', current: true },
  { name: 'Silver', range: '6-15', icon: Award, color: '#94A3B8', bgColor: '#F1F5F9', reward: '1,000 TZS per referral', current: false },
  { name: 'Gold', range: '16-30', icon: Trophy, color: '#F59E0B', bgColor: '#FEF3C7', reward: '2,500 TZS per referral', current: false },
  { name: 'Platinum', range: '31+', icon: Crown, color: '#7C3AED', bgColor: '#F3E8FF', reward: '5,000 TZS per referral', current: false },
];

// ── Animation ──

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ── Main Component ──

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('CHIMBO-2026-X7K9');
  const [referrals, setReferrals] = useState<ReferredPerson[]>([]);
  const [stats, setStats] = useState({ total: 7, earnings: 4500, active: 4 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch referral data
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await fetch('/api/referrals?userId=demo-seeker-1');
        if (res.ok) {
          const data = await res.json();
          if (data.referralCode) setReferralCode(data.referralCode);
          if (data.referrals) {
            const mapped = data.referrals.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              referrerId: r.referrerId as string,
              refereeId: (r.refereeId as string) || null,
              code: r.code as string,
              status: (r.status as string) as ReferredPerson['status'],
              reward: (r.reward as number) || 0,
              createdAt: r.createdAt as string,
              convertedAt: (r.convertedAt as string) || null,
            }));
            setReferrals(mapped);
          }
          if (data.stats) setStats(data.stats);
          if (data.leaderboard) setLeaderboard(data.leaderboard);
        }
      } catch {
        // Use defaults
        setReferrals([
          { id: 'r1', referrerId: 'demo-seeker-1', refereeId: 'ref-1', code: referralCode, status: 'rewarded', reward: 500, createdAt: '2026-05-28T10:00:00.000Z', convertedAt: '2026-05-28T10:00:00.000Z' },
          { id: 'r2', referrerId: 'demo-seeker-1', refereeId: 'ref-2', code: referralCode, status: 'converted', reward: 500, createdAt: '2026-05-26T10:00:00.000Z', convertedAt: '2026-05-26T10:00:00.000Z' },
          { id: 'r3', referrerId: 'demo-seeker-1', refereeId: 'ref-3', code: referralCode, status: 'rewarded', reward: 500, createdAt: '2026-05-22T10:00:00.000Z', convertedAt: '2026-05-22T10:00:00.000Z' },
          { id: 'r4', referrerId: 'demo-seeker-1', refereeId: 'ref-4', code: referralCode, status: 'converted', reward: 500, createdAt: '2026-05-20T10:00:00.000Z', convertedAt: '2026-05-20T10:00:00.000Z' },
          { id: 'r5', referrerId: 'demo-seeker-1', refereeId: null, code: referralCode, status: 'pending', reward: 0, createdAt: '2026-05-18T10:00:00.000Z', convertedAt: null },
          { id: 'r6', referrerId: 'demo-seeker-1', refereeId: 'ref-6', code: referralCode, status: 'converted', reward: 500, createdAt: '2026-05-15T10:00:00.000Z', convertedAt: '2026-05-15T10:00:00.000Z' },
          { id: 'r7', referrerId: 'demo-seeker-1', refereeId: 'ref-7', code: referralCode, status: 'rewarded', reward: 500, createdAt: '2026-05-12T10:00:00.000Z', convertedAt: '2026-05-12T10:00:00.000Z' },
        ]);
        setLeaderboard([
          { userId: 'lb-1', name: 'Amina K.', avatar: 'AK', totalReferrals: 15, totalEarnings: 15000, rank: 1 },
          { userId: 'lb-2', name: 'Joseph M.', avatar: 'JM', totalReferrals: 12, totalEarnings: 12000, rank: 2 },
          { userId: 'demo-seeker-1', name: 'You', avatar: 'YO', totalReferrals: 7, totalEarnings: 4500, rank: 3 },
          { userId: 'lb-4', name: 'Grace T.', avatar: 'GT', totalReferrals: 5, totalEarnings: 2500, rank: 4 },
          { userId: 'lb-5', name: 'David S.', avatar: 'DS', totalReferrals: 3, totalEarnings: 1500, rank: 5 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleShare = useCallback((platform: string) => {
    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${referralCode}`;
    const text = `Join me on ChimboDirect! Use my referral code: ${referralCode} or click here: ${referralLink}`;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(text)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(`${referralLink}`).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  }, [referralCode]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rewarded': return 'Rewarded';
      case 'converted': return 'Active';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rewarded': return 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]';
      case 'converted': return 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]';
      default: return 'border-[#94A3B8]/30 text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]';
    }
  };

  const getAvatarGradient = (status: string) => {
    switch (status) {
      case 'rewarded': return 'bg-gradient-to-br from-[#065F46] to-[#059669]';
      case 'converted': return 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]';
      default: return 'bg-[#94A3B8]';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-5">
        <div className="h-8 w-48 bg-[#F1F5F9] dark:bg-[#334155] rounded-lg animate-pulse" />
        <div className="h-40 bg-[#F1F5F9] dark:bg-[#334155] rounded-2xl animate-pulse" />
        <div className="h-24 bg-[#F1F5F9] dark:bg-[#334155] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-4 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">Referral Program</h1>
        <p className="text-sm text-[#64748B] mt-1">Invite friends and earn rewards</p>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        variants={itemVariants}
        className="kcard-green p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-sm text-white/70 font-medium">Your Referral Code</span>
          </div>
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xl font-bold text-white tracking-wider font-mono">{referralCode}</p>
            <button
              onClick={handleCopyCode}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors active:scale-90"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-[#34D399]" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
          {/* Referral link */}
          <div className="mt-3 flex items-center gap-2 bg-white/5 rounded-lg p-2.5">
            <Link2 className="w-3.5 h-3.5 text-white/50" />
            <p className="text-xs text-white/50 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref={referralCode}
            </p>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#34D399] mt-2 text-center font-medium"
            >
              Copied to clipboard!
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Share Options */}
      <motion.div variants={itemVariants} className="kcard p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          Share Your Code
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { platform: 'whatsapp', icon: MessageSquare, label: 'WhatsApp', color: '#25D366' },
            { platform: 'telegram', icon: Send, label: 'Telegram', color: '#0088CC' },
            { platform: 'twitter', icon: Star, label: 'Twitter', color: '#1DA1F2' },
            { platform: 'sms', icon: MessageSquare, label: 'SMS', color: '#0891B2' },
            { platform: 'copy', icon: Link2, label: 'Copy Link', color: '#64748B' },
          ].map((share, i) => (
            <button
              key={i}
              onClick={() => handleShare(share.platform)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${share.color}15` }}
              >
                <share.icon className="w-5 h-5" style={{ color: share.color }} />
              </div>
              <span className="text-[9px] font-medium text-center">{share.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Referral Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Referrals', value: stats.total.toString(), icon: Users, color: '#065F46' },
          { label: 'Earnings', value: `TZS ${(stats.earnings / 1000).toFixed(1)}K`, icon: TrendingUp, color: '#10B981' },
          { label: 'Active', value: stats.active.toString(), icon: Zap, color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="kcard p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#64748B] font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs: Tiers / History / Leaderboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#F1F5F9] dark:bg-[#334155] rounded-xl p-1 h-auto">
          <TabsTrigger value="overview" className="flex-1 text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E293B] data-[state=active]:shadow-sm rounded-lg">Tiers</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E293B] data-[state=active]:shadow-sm rounded-lg">History</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E293B] data-[state=active]:shadow-sm rounded-lg">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Tiers Tab */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          {REFERRAL_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`kcard p-4 flex items-center gap-4 relative ${tier.current ? 'ring-2' : ''}`}
              style={tier.current ? { ringColor: tier.color } : {}}
            >
              {tier.current && (
                <div className="absolute -top-2 -right-2">
                  <span className="kbadge kbadge-gold text-[7px]">Current</span>
                </div>
              )}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: tier.bgColor }}
              >
                <tier.icon className="w-6 h-6" style={{ color: tier.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{tier.name}</p>
                  <span className="text-xs text-[#64748B]">{tier.range} referrals</span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{tier.reward}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
            </motion.div>
          ))}

          {/* Progress to next tier */}
          <div className="kcard p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Progress to Silver</span>
              <span className="text-xs font-bold text-[#94A3B8]">{stats.total}/15</span>
            </div>
            <div className="h-2 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stats.total / 15) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[#CD7F32] to-[#94A3B8]"
              />
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-1.5">{Math.max(0, 15 - stats.total)} more referrals to reach Silver tier</p>
          </div>

          {/* How it works */}
          <div className="kcard p-4 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Star className="w-4 h-4 text-[#F59E0B]" />
              How It Works
            </h4>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Share your referral code with friends' },
                { step: '2', text: 'They sign up using your code' },
                { step: '3', text: 'You both get TZS 500 wallet credit!' },
                { step: '4', text: 'Earn more as you climb the tiers' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#065F46] dark:text-[#34D399]">{item.step}</span>
                  </div>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {referrals.length === 0 ? (
            <div className="kcard p-8 text-center">
              <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm text-[#64748B]">No referrals yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Share your code to start earning!</p>
            </div>
          ) : (
            referrals.map((person, i) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="kcard p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${getAvatarGradient(person.status)}`}>
                    {person.refereeId ? (person.refereeId as string).substring(0, 2).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{person.refereeId ? `User ${person.refereeId.substring(0, 6)}...` : 'Pending signup'}</p>
                    <p className="text-[10px] text-[#64748B]">{new Date(person.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {person.reward > 0 && (
                    <span className="text-sm font-bold text-[#10B981]">+TZS {person.reward}</span>
                  )}
                  <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${getStatusColor(person.status)}`}>
                    {getStatusLabel(person.status)}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4 space-y-2">
          <div className="kcard p-4 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Leaderboard className="w-4 h-4 text-[#F59E0B]" />
              Top Referrers
            </h4>
            <p className="text-xs text-[#64748B]">Earn the most referrals this month to win bonus rewards!</p>
          </div>
          {leaderboard.map((entry, i) => {
            const isYou = entry.userId === 'demo-seeker-1';
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`kcard p-3.5 flex items-center gap-3 ${isYou ? 'ring-2 ring-[#065F46] dark:ring-[#34D399]' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  entry.rank === 1 ? 'bg-[#F59E0B] text-white' :
                  entry.rank === 2 ? 'bg-[#94A3B8] text-white' :
                  entry.rank === 3 ? 'bg-[#CD7F32] text-white' :
                  'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
                }`}>
                  {entry.rank}
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${isYou ? 'bg-gradient-to-br from-[#065F46] to-[#34D399]' : 'bg-gradient-to-br from-[#64748B] to-[#94A3B8]'}`}>
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {entry.name}
                    {isYou && <span className="ml-1.5 text-xs text-[#065F46] dark:text-[#34D399]">(You)</span>}
                  </p>
                  <p className="text-[10px] text-[#64748B]">{entry.totalReferrals} referrals</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">TZS {entry.totalEarnings.toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
