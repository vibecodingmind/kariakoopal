'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Camera, CheckCircle, MapPin, Award, Clock,
  ChevronRight, Zap, Star, Shield, Keyboard, ArrowRight,
  Navigation, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input as ShadInput } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// ── Types ──

interface CheckIn {
  id: string;
  guideName: string;
  location: string;
  time: string;
  date: string;
  pointsEarned: number;
  status: 'verified' | 'pending';
}

interface Badge_ {
  id: string;
  name: string;
  icon: React.ElementType;
  unlocked: boolean;
  description: string;
  progress: number;
}

// ── Demo Data ──

const RECENT_CHECKINS: CheckIn[] = [
  { id: 'c1', guideName: 'Mwanamvua J.', location: 'Kariakoo Market - Zone A', time: '10:30 AM', date: 'Today', pointsEarned: 50, status: 'verified' },
  { id: 'c2', guideName: 'Asha M.', location: 'Kisutu Street Fabric Row', time: '2:15 PM', date: 'Yesterday', pointsEarned: 35, status: 'verified' },
  { id: 'c3', guideName: 'Hassan K.', location: 'Mchikichini Market', time: '9:00 AM', date: '2 days ago', pointsEarned: 45, status: 'pending' },
  { id: 'c4', guideName: 'Fatma H.', location: 'Nyamwezi Street Electronics', time: '11:45 AM', date: '3 days ago', pointsEarned: 60, status: 'verified' },
  { id: 'c5', guideName: 'Ramadhani S.', location: 'Central Spice Market', time: '3:00 PM', date: '5 days ago', pointsEarned: 40, status: 'verified' },
];

const BADGES: Badge_[] = [
  { id: 'b1', name: 'First Steps', icon: Star, unlocked: true, description: 'Complete your first check-in', progress: 100 },
  { id: 'b2', name: 'Explorer', icon: Navigation, unlocked: true, description: 'Check-in at 5 different locations', progress: 100 },
  { id: 'b3', name: 'Regular', icon: CheckCircle, unlocked: false, description: 'Check-in 10 times', progress: 60 },
  { id: 'b4', name: 'Social Butterfly', icon: UserCheck, unlocked: false, description: 'Check-in with 5 different guides', progress: 80 },
  { id: 'b5', name: 'Zone Master', icon: MapPin, unlocked: false, description: 'Visit all market zones', progress: 35 },
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

// ── Scanning Animation Component ──

function ScanningAnimation() {
  return (
    <div className="relative w-56 h-56 mx-auto">
      {/* Viewfinder corners */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#34D399] rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#34D399] rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#34D399] rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#34D399] rounded-br-xl" />
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#34D399] to-transparent"
        initial={{ top: '5%' }}
        animate={{ top: ['5%', '95%', '5%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center pulse */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <QrCode className="w-16 h-16 text-[#34D399]/30" />
      </motion.div>

      {/* Glow ring */}
      <motion.div
        className="absolute inset-4 rounded-2xl border-2 border-[#34D399]/20"
        animate={{ borderColor: ['rgba(52,211,153,0.1)', 'rgba(52,211,153,0.3)', 'rgba(52,211,153,0.1)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// ── Main Component ──

export default function QRCheckInPage() {
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'badges'>('scan');

  const handleManualCheckIn = () => {
    if (!manualCode.trim()) return;
    setCheckingIn(true);
    setTimeout(() => {
      setCheckingIn(false);
      setCheckInSuccess(true);
      setTimeout(() => {
        setCheckInSuccess(false);
        setManualCode('');
      }, 2500);
    }, 1500);
  };

  const totalPoints = RECENT_CHECKINS.reduce((sum, c) => sum + c.pointsEarned, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-4 space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">QR Check-in</h1>
        <p className="text-sm text-[#64748B] mt-1">Scan to verify your session and earn points</p>
      </motion.div>

      {/* Stats bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Points', value: totalPoints.toString(), icon: Zap, color: '#F59E0B' },
          { label: 'Check-ins', value: RECENT_CHECKINS.length.toString(), icon: CheckCircle, color: '#10B981' },
          { label: 'Badges', value: BADGES.filter(b => b.unlocked).length.toString(), icon: Award, color: '#7C3AED' },
        ].map((stat, i) => (
          <div key={i} className="kcard p-3 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#64748B] font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tab Switcher */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {[
          { key: 'scan' as const, label: 'Scan', icon: Camera },
          { key: 'history' as const, label: 'History', icon: Clock },
          { key: 'badges' as const, label: 'Badges', icon: Award },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-[#065F46] text-white dark:bg-[#34D399] dark:text-[#022C22]'
                : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-5"
          >
            {/* Scanner Area */}
            <div className="kcard-glass p-6 flex flex-col items-center">
              {checkInSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-[#10B981]" />
                  </motion.div>
                  <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">Check-in Verified!</p>
                  <p className="text-sm text-[#64748B] mt-1">+50 points earned</p>
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-sm font-bold text-[#F59E0B]">New Badge: Regular</span>
                  </div>
                </motion.div>
              ) : checkingIn ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-[#065F46]/20 border-t-[#065F46] mx-auto mb-4"
                  />
                  <p className="font-semibold">Verifying check-in...</p>
                  <p className="text-sm text-[#64748B] mt-1">Please wait a moment</p>
                </div>
              ) : (
                <>
                  <ScanningAnimation />
                  <p className="text-sm font-medium text-[#64748B] mt-4">Point your camera at the QR code</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Your guide will provide the check-in code</p>
                </>
              )}
            </div>

            {/* Manual Code Input */}
            <div className="kcard p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                  <span className="text-sm font-semibold">Manual Check-in</span>
                </div>
                <button
                  onClick={() => setShowManual(!showManual)}
                  className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold"
                >
                  {showManual ? 'Hide' : 'Enter Code'}
                </button>
              </div>

              <AnimatePresence>
                {showManual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <ShadInput
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      placeholder="Enter check-in code (e.g. KG-2026-ABC)"
                      className="h-11"
                    />
                    <Button
                      onClick={handleManualCheckIn}
                      disabled={!manualCode.trim() || checkingIn}
                      className="w-full h-11 bg-[#065F46] hover:bg-[#047857] dark:bg-[#34D399] dark:text-[#022C22] dark:hover:bg-[#6EE7B7]"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Verify Check-in
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Check-in Benefits */}
            <div className="kcard p-5 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                Check-in Benefits
              </h3>
              <div className="space-y-2">
                {[
                  { icon: Zap, label: 'Earn Points', desc: 'Get 35-60 points per verified check-in', color: '#F59E0B' },
                  { icon: Award, label: 'Unlock Badges', desc: 'Earn badges for milestones and achievements', color: '#7C3AED' },
                  { icon: Shield, label: 'Verified Sessions', desc: 'Proof of attendance for dispute resolution', color: '#10B981' },
                  { icon: Star, label: 'Build Trust Score', desc: 'Regular check-ins improve your trust rating', color: '#0891B2' },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${benefit.color}15` }}>
                      <benefit.icon className="w-4 h-4" style={{ color: benefit.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{benefit.label}</p>
                      <p className="text-xs text-[#64748B]">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-2"
          >
            {RECENT_CHECKINS.map((checkin, i) => (
              <motion.div
                key={checkin.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="kcard p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    checkin.status === 'verified' ? 'bg-[#ECFDF5] dark:bg-[#064E3B]' : 'bg-[#FEF3C7] dark:bg-[#422006]'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      checkin.status === 'verified' ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{checkin.guideName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#64748B]" />
                      <p className="text-xs text-[#64748B]">{checkin.location}</p>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{checkin.date} · {checkin.time}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#F59E0B]" />
                    <span className="text-sm font-bold text-[#F59E0B]">+{checkin.pointsEarned}</span>
                  </div>
                  <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${
                    checkin.status === 'verified'
                      ? 'border-[#10B981]/30 text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]'
                      : 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#422006]'
                  }`}>
                    {checkin.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`kcard p-4 flex items-center gap-4 ${!badge.unlocked ? 'opacity-60' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]'
                    : 'bg-[#F1F5F9] dark:bg-[#334155]'
                }`}>
                  <badge.icon className={`w-6 h-6 ${badge.unlocked ? 'text-white' : 'text-[#94A3B8]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{badge.name}</p>
                    {badge.unlocked && (
                      <span className="kbadge kbadge-gold text-[7px]">Unlocked</span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">{badge.description}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#334155] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${badge.progress}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#065F46] to-[#34D399]"
                    />
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{badge.progress}% complete</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
