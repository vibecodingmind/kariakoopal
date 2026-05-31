'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import {
  MapPin, Search, ShoppingBag, Clock, Star, ChevronRight, Compass,
  TrendingUp, Users, Package, Bell, Sparkles, Brain, CalendarDays,
  Handshake, Languages, UserCheck, QrCode, Gift, Navigation,
  Zap, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Onboarding } from '@/components/onboarding';

const AI_QUICK_ACTIONS = [
  { title: 'Plan Trip', subtitle: 'AI itinerary', href: '/seeker/ai-trip-planner', icon: CalendarDays, bg: 'bg-gradient-to-br from-[#065F46] to-[#059669]', text: 'text-white', badge: 'AI' },
  { title: 'Negotiate', subtitle: 'Haggle helper', href: '/seeker/ai-haggle', icon: Handshake, bg: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]', text: 'text-[#065F46]', badge: 'AI' },
  { title: 'Translate', subtitle: 'EN ↔ SW', href: '/seeker/ai-translate', icon: Languages, bg: 'bg-gradient-to-br from-[#0891B2] to-[#06B6D4]', text: 'text-white', badge: 'AI' },
  { title: 'Match Guide', subtitle: 'Find perfect fit', href: '/seeker/ai-match', icon: UserCheck, bg: 'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]', text: 'text-white', badge: 'AI' },
];

const PLATFORM_ACTIONS = [
  { title: 'Shopping List', subtitle: 'Plan your buys', href: '/seeker/shopping-list', icon: ShoppingBag, color: 'text-[#F59E0B]' },
  { title: 'Price Radar', subtitle: 'Fair prices', href: '/prices', icon: TrendingUp, color: 'text-[#065F46]' },
  { title: 'Find Buddy', subtitle: 'Share costs', href: '/seeker/buddy', icon: Users, color: 'text-[#3B82F6]' },
  { title: 'QR Check-in', subtitle: 'Scan & earn', href: '/seeker/qr-checkin', icon: QrCode, color: 'text-[#065F46]' },
  { title: 'Live Location', subtitle: 'Stay safe', href: '/seeker/live-location', icon: Navigation, color: 'text-[#DC2626]' },
  { title: 'Referrals', subtitle: 'Earn rewards', href: '/seeker/referrals', icon: Gift, color: 'text-[#F59E0B]' },
];

export default function SeekerDashboard() {
  const { user, language, isAuthenticated } = useAuthStore();
  const { showOnboarding, completeOnboarding } = useAppStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.id?.startsWith('demo-') && showOnboarding) {
      completeOnboarding();
    }
  }, [isAuthenticated, user, showOnboarding, completeOnboarding]);

  if (isAuthenticated && user?.role === 'seeker' && showOnboarding) {
    return <Onboarding />;
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Welcome with AI Badge */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">{l('Welcome back,', 'Karibu tena,')}</p>
            <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{user.name} 👋</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/10">
            <Sparkles className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />
            <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399] uppercase">AI Ready</span>
          </div>
        </div>
      </motion.div>

      {/* AI Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] uppercase tracking-wider">{l('AI Tools', 'Vifaa vya AI')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {AI_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className={`${action.bg} p-4 rounded-2xl text-left relative overflow-hidden group transition-transform active:scale-[0.98]`}
              >
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[8px] font-bold text-white uppercase">
                  {action.badge}
                </div>
                <Icon className={`w-6 h-6 ${action.text} mb-2 group-hover:scale-110 transition-transform`} />
                <h3 className={`font-bold text-sm ${action.text}`}>{action.title}</h3>
                <p className={`text-xs ${action.text} opacity-70 mt-0.5`}>{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Platform Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] uppercase tracking-wider mb-3">{l('Quick Actions', 'Vitendo vya Haraka')}</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {PLATFORM_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="kcard p-3 text-center hover:shadow-md transition-all group"
              >
                <Icon className={`w-5 h-5 ${action.color} mx-auto mb-1.5 group-hover:scale-110 transition-transform`} />
                <h3 className="font-bold text-[11px]">{action.title}</h3>
                <p className="text-[9px] text-[#64748B] mt-0.5">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Active Session */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold mb-3">{l('Active Session', 'Kipindi Kinachoendelea')}</h2>
        <div className="kcard-green p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse-dot" />
              <span className="text-sm font-medium text-white">{l('Live Session', 'Kipendi cha Moja kwa Moja')}</span>
            </div>
            <span className="kbadge kbadge-live">{l('ACTIVE', 'INAYOENDA')}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#065F46] font-bold">MJ</div>
            <div>
              <p className="text-white font-semibold text-sm">Mwanaildi Juma</p>
              <p className="text-white/60 text-xs">{l('Fabrics & Village Guide', 'Mwongozo wa Vitenge na Kijiji')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l('1h 23m', '1s 23d')}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l('Fabrics Zone', 'Eneo la Vitenge')}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />4.8</span>
          </div>
          <button className="kbtn-yellow w-full text-sm">{l('Open Session', 'Fungua Kipindi')}</button>
        </div>
      </motion.div>

      {/* Recent History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{l('Recent', 'Ya Hivi Karibu')}</h2>
          <button onClick={() => router.push('/seeker/history')} className="text-sm text-[#065F46] dark:text-[#34D399] font-medium">{l('See All', 'Tazama Zote')}</button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Electronics Shopping', guide: 'Fatma Hassan', date: '2 days ago', rating: 5, amount: 'TZS 35,000' },
            { name: 'Wholesale Bulk Buy', guide: 'Asha Mohamed', date: '1 week ago', rating: 5, amount: 'TZS 75,000' },
          ].map((session, i) => (
            <div key={i} className="kcard p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-[#065F46]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{session.name}</p>
                  <p className="text-xs text-[#64748B]">{session.guide} · {session.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#065F46]">{session.amount}</p>
                <div className="flex items-center gap-0.5 justify-end">{Array.from({ length: session.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Assistant CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kcard-glass p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#065F46]/10 dark:bg-[#34D399]/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{l('Ask Kariako AI', 'Uliza Kariako AI')}</p>
            <p className="text-xs text-[#64748B]">{l('24/7 help for anything Kariakoo', 'Msaada wa saa zote kwa Kariakoo')}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#065F46] dark:text-[#34D399] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
