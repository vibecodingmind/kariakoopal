'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Share2, Gift, Users, TrendingUp, CheckCircle,
  MessageSquare, Send, Link2, ChevronRight, Award, Star,
  Zap, Crown, Medal, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  name: string;
  date: string;
  status: 'active' | 'pending' | 'rewarded';
  earned: number;
  avatar: string;
}

// ── Demo Data ──

const REFERRAL_CODE = 'CHIMBO-2026-X7K9';

const REFERRAL_TIERS: ReferralTier[] = [
  { name: 'Bronze', range: '1-5', icon: Medal, color: '#CD7F32', bgColor: '#FDF2E9', reward: '500 TZS per referral', current: true },
  { name: 'Silver', range: '6-15', icon: Award, color: '#94A3B8', bgColor: '#F1F5F9', reward: '1,000 TZS per referral', current: false },
  { name: 'Gold', range: '16-30', icon: Trophy, color: '#F59E0B', bgColor: '#FEF3C7', reward: '2,500 TZS per referral', current: false },
  { name: 'Platinum', range: '31+', icon: Crown, color: '#7C3AED', bgColor: '#F3E8FF', reward: '5,000 TZS per referral', current: false },
];

const REFERRAL_STATS = {
  total: 7,
  earnings: 4500,
  active: 4,
};

const REFERRAL_HISTORY: ReferredPerson[] = [
  { id: 'r1', name: 'Amina K.', date: 'May 28, 2026', status: 'rewarded', earned: 500, avatar: 'AK' },
  { id: 'r2', name: 'Joseph M.', date: 'May 26, 2026', status: 'active', earned: 500, avatar: 'JM' },
  { id: 'r3', name: 'Grace T.', date: 'May 22, 2026', status: 'rewarded', earned: 500, avatar: 'GT' },
  { id: 'r4', name: 'David S.', date: 'May 20, 2026', status: 'active', earned: 500, avatar: 'DS' },
  { id: 'r5', name: 'Halima R.', date: 'May 18, 2026', status: 'pending', earned: 0, avatar: 'HR' },
  { id: 'r6', name: 'Peter N.', date: 'May 15, 2026', status: 'active', earned: 500, avatar: 'PN' },
  { id: 'r7', name: 'Fatma A.', date: 'May 12, 2026', status: 'rewarded', earned: 500, avatar: 'FA' },
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Join me on ChimboDirect! Use my referral code: ${REFERRAL_CODE}`;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`);
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(text)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

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
            <p className="text-xl font-bold text-white tracking-wider font-mono">{REFERRAL_CODE}</p>
            <button
              onClick={handleCopyCode}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors active:scale-90"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-[#34D399]" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#34D399] mt-2 text-center font-medium"
            >
              Code copied to clipboard!
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
        <div className="grid grid-cols-4 gap-3">
          {[
            { platform: 'whatsapp', icon: MessageSquare, label: 'WhatsApp', color: '#25D366' },
            { platform: 'telegram', icon: Send, label: 'Telegram', color: '#0088CC' },
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
              <span className="text-[10px] font-medium">{share.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Referral Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Referrals', value: REFERRAL_STATS.total.toString(), icon: Users, color: '#065F46' },
          { label: 'Earnings', value: `TZS ${(REFERRAL_STATS.earnings / 1000).toFixed(1)}K`, icon: TrendingUp, color: '#10B981' },
          { label: 'Active', value: REFERRAL_STATS.active.toString(), icon: Zap, color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="kcard p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#64748B] font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Referral Tiers */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#F59E0B]" />
          Referral Tiers
        </h3>
        <div className="space-y-2">
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
        </div>
        {/* Progress to next tier */}
        <div className="kcard p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Progress to Silver</span>
            <span className="text-xs font-bold text-[#94A3B8]">7/15</span>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '47%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#CD7F32] to-[#94A3B8]"
            />
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-1.5">8 more referrals to reach Silver tier</p>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          People You&apos;ve Referred
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {REFERRAL_HISTORY.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                  person.status === 'rewarded' ? 'bg-gradient-to-br from-[#065F46] to-[#059669]' :
                  person.status === 'active' ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]' :
                  'bg-[#94A3B8]'
                }`}>
                  {person.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium">{person.name}</p>
                  <p className="text-[10px] text-[#64748B]">{person.date}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                {person.earned > 0 && (
                  <span className="text-sm font-bold text-[#10B981]">+TZS {person.earned}</span>
                )}
                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                  person.status === 'rewarded' ? 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]' :
                  person.status === 'active' ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]' :
                  'border-[#94A3B8]/30 text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  {person.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
