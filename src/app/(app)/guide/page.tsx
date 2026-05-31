'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  DollarSign, Users, Clock, Star, TrendingUp, Package, MapPin,
  ChevronRight, Zap, Sparkles, Brain, BarChart3, CalendarCheck,
  Award, Eye, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';

const AI_TOOLS = [
  { title: 'AI Analytics', subtitle: 'Smart insights', href: '/guide/analytics', icon: Brain, color: 'from-[#065F46] to-[#059669]' },
  { title: 'Profile AI Tips', subtitle: 'Boost visibility', href: '/guide/profile', icon: Sparkles, color: 'from-[#F59E0B] to-[#FBBF24]' },
];

const GUIDE_ACTIONS = [
  { title: 'Sessions', subtitle: 'Manage bookings', href: '/guide/sessions', icon: Zap, color: 'text-[#065F46]' },
  { title: 'Packages', subtitle: 'Create deals', href: '/guide/packages', icon: Package, color: 'text-[#F59E0B]' },
  { title: 'Earnings', subtitle: 'View payouts', href: '/guide/earnings', icon: DollarSign, color: 'text-[#10B981]' },
  { title: 'Profile', subtitle: 'Edit details', href: '/guide/profile', icon: MapPin, color: 'text-[#3B82F6]' },
  { title: 'Reviews', subtitle: 'See feedback', href: '/guide/reviews', icon: Star, color: 'text-[#F59E0B]' },
  { title: 'Availability', subtitle: 'Set schedule', href: '/guide/availability', icon: CalendarCheck, color: 'text-[#065F46]' },
  { title: 'Subscriptions', subtitle: 'Plan tiers', href: '/guide/subscriptions', icon: Award, color: 'text-[#8B5CF6]' },
  { title: 'Mentorship', subtitle: 'Grow skills', href: '/guide/mentorship', icon: Eye, color: 'text-[#0891B2]' },
];

export default function GuideDashboard() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Welcome with AI Badge */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">{l('Hello,', 'Hujambo,')}</p>
            <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{user.name} 🧭</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/10">
            <Sparkles className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />
            <span className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399] uppercase">AI Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-[#10B981] font-medium">{l('Online', 'Mtandaoni')}</span>
        </div>
      </motion.div>

      {/* Earnings Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard-green p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
          <Sparkles className="w-3 h-3 text-[#FBBF24]" />
          <span className="text-[9px] font-bold text-[#FBBF24]">AI Insight</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">{l("This Month's Earnings", 'Mapato ya Mwezi Huu')}</span>
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
        </div>
        <p className="text-3xl font-bold text-white">TZS 425,000</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3 text-[#10B981]" />
          <span className="text-xs text-[#10B981]">+12% {l('from last month', 'kutoka mwezi uliopita')}</span>
        </div>
        <p className="text-xs text-white/50 mt-2">AI predicts 18% growth next month based on seasonal trends</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <div className="kcard p-3 text-center">
          <Users className="w-5 h-5 text-[#065F46] mx-auto mb-1" />
          <p className="text-lg font-bold">28</p>
          <p className="text-[10px] text-[#64748B]">{l('Sessions', 'Vipindi')}</p>
        </div>
        <div className="kcard p-3 text-center">
          <Star className="w-5 h-5 text-[#F59E0B] mx-auto mb-1 fill-[#F59E0B]" />
          <p className="text-lg font-bold">4.8</p>
          <p className="text-[10px] text-[#64748B]">{l('Rating', 'Alama')}</p>
        </div>
        <div className="kcard p-3 text-center">
          <Clock className="w-5 h-5 text-[#065F46] mx-auto mb-1" />
          <p className="text-lg font-bold">42h</p>
          <p className="text-[10px] text-[#64748B]">{l('Hours', 'Masaa')}</p>
        </div>
      </motion.div>

      {/* AI Tools */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
          <h2 className="text-sm font-bold uppercase tracking-wider">{l('AI Tools', 'Vifaa vya AI')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.href}
                onClick={() => router.push(tool.href)}
                className={`bg-gradient-to-br ${tool.color} p-4 rounded-2xl text-left group transition-transform active:scale-[0.98]`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-5 h-5 text-white" />
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-bold text-white uppercase">AI</span>
                </div>
                <h3 className="font-bold text-sm text-white">{tool.title}</h3>
                <p className="text-xs text-white/70 mt-0.5">{tool.subtitle}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3">{l('Manage', 'Simamia')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {GUIDE_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="kcard p-3 text-center hover:shadow-md transition-all group"
              >
                <Icon className={`w-5 h-5 ${action.color} mx-auto mb-1.5 group-hover:scale-110 transition-transform`} />
                <h3 className="font-bold text-[10px]">{action.title}</h3>
                <p className="text-[8px] text-[#64748B] mt-0.5">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Pending Requests */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold mb-3">{l('Pending Requests', 'Maombi Yanayosubiri')}</h2>
        <div className="space-y-3">
          {[
            { name: 'Tourist from Kenya', need: 'Wholesale bulk buy', zone: 'Wholesale Zone', budget: 50000, aiMatch: 92 },
            { name: 'Business buyer', need: '50 kanga sets', zone: 'Fabrics Zone', budget: 25000, aiMatch: 85 },
          ].map((req, i) => (
            <div key={i} className="kcard p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{req.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/10 text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">
                    <Sparkles className="w-3 h-3" /> {req.aiMatch}% match
                  </span>
                  <span className="text-sm font-bold text-[#065F46]">TZS {req.budget.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-[#64748B]">{req.need} · {req.zone}</p>
              <div className="flex gap-2 mt-3">
                <button className="kbtn flex-1 text-xs py-2">{l('Accept', 'Kubali')}</button>
                <button className="kbtn-outline flex-1 text-xs py-2">{l('Decline', 'Kataa')}</button>
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
            <p className="text-xs text-[#64748B]">{l('Get tips to boost your earnings', 'Pata vidokezo vya kuongeza mapato')}</p>
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
