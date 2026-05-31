'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Users, ShieldCheck, AlertTriangle, DollarSign, TrendingUp, Store,
  Compass, BarChart3, Sparkles, Brain, Zap, Activity, Eye, Bot,
  Megaphone, FileText, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

const AI_INSIGHTS = [
  { label: 'Revenue Forecast', value: '+22%', desc: 'Next 30 days', icon: TrendingUp, color: 'text-[#10B981]' },
  { label: 'Churn Risk', value: '8 users', desc: 'At risk of leaving', icon: AlertTriangle, color: 'text-[#F59E0B]' },
  { label: 'Fraud Score', value: '2.1/10', desc: 'Low risk today', icon: ShieldCheck, color: 'text-[#10B981]' },
  { label: 'AI Confidence', value: '94%', desc: 'Prediction accuracy', icon: Brain, color: 'text-[#065F46]' },
];

const MANAGEMENT_ACTIONS = [
  { icon: Users, label: 'Users', href: '/admin/users', count: '12.4K' },
  { icon: Compass, label: 'Guides', href: '/admin/guides', count: '12 pending' },
  { icon: Store, label: 'Vendors', href: '/admin/vendors', count: '8 pending' },
  { icon: AlertTriangle, label: 'Disputes', href: '/admin/disputes', count: '3 open' },
  { icon: ShieldCheck, label: 'Fraud', href: '/admin/fraud', count: '2 new' },
  { icon: DollarSign, label: 'Revenue', href: '/admin/revenue', count: '450M TZS' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', count: 'Live' },
  { icon: Brain, label: 'AI Center', href: '/admin/ai-insights', count: '7 tools' },
  { icon: Megaphone, label: 'Broadcast', href: '/admin/broadcast', count: 'Send' },
  { icon: FileText, label: 'Audit Log', href: '/admin/audit', count: '2.1K' },
  { icon: Settings, label: 'Settings', href: '/admin/settings', count: 'Config' },
];

export default function AdminDashboard() {
  const { user, language, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">{l('Admin Dashboard', 'Dashibodi ya Msimamizi')}</h1>
            <p className="text-sm text-[#94A3B8] mt-1">{l('AI-powered platform management', 'Usimamizi wa jukwaa unaotumia AI')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34D399]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[10px] font-bold text-[#34D399] uppercase">AI Active</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-gradient-to-r from-[#065F46] to-[#059669] p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-[#FBBF24]" />
              <h2 className="font-bold text-white">{l('AI Insights', 'Ufafanuzi wa AI')}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#FBBF24]/20 text-[10px] font-bold text-[#FBBF24]">LIVE</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AI_INSIGHTS.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Icon className={`w-4 h-4 ${insight.color} mb-1`} />
                    <p className="text-xl font-bold text-white">{insight.value}</p>
                    <p className="text-[10px] text-white/60">{insight.label}</p>
                    <p className="text-[9px] text-white/40">{insight.desc}</p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push('/admin/ai-insights')}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium text-white"
            >
              <Sparkles className="w-4 h-4" />
              Open AI Command Center
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: l('Total Users', 'Watumiaji'), value: '12,450', change: '+340', color: '#34D399' },
          { icon: Compass, label: l('Active Guides', 'Miongozo Hai'), value: '2,500', change: '+28', color: '#34D399' },
          { icon: Store, label: l('Vendors', 'Wauzaji'), value: '3,200', change: '+15', color: '#FBBF24' },
          { icon: DollarSign, label: l('Revenue (MTZS)', 'Mapato'), value: '450', change: '+18%', color: '#FBBF24' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl">
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold text-[#F1F5F9]">{stat.value}</p>
            <p className="text-[10px] text-[#94A3B8]">{stat.label}</p>
            <p className="text-[10px] text-[#34D399] mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />{stat.change}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1E293B] border border-[#334155] p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-[#F1F5F9] flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-[#34D399]" />
            {l('Revenue Trend', 'Mwelekeo wa Mapato')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#34D399] flex items-center gap-1"><TrendingUp className="w-3 h-3" />+18%</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34D399]/10 text-[9px] font-bold text-[#34D399]">
              <Sparkles className="w-3 h-3" /> AI Forecast
            </span>
          </div>
        </div>
        <div className="h-32 flex items-end gap-1.5">
          {[40, 65, 55, 80, 70, 90, 85, 95, 75, 88, 92, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-[#065F46] hover:bg-[#34D399] transition-colors cursor-pointer" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-[#64748B]">
          <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
        </div>
        {/* AI Forecast line */}
        <div className="mt-3 p-2 rounded-lg bg-[#065F46]/20 border border-[#065F46]/30">
          <p className="text-[10px] text-[#34D399] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI predicts 22% revenue growth next month based on seasonal patterns and user activity trends.
          </p>
        </div>
      </motion.div>

      {/* Management Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold text-[#F1F5F9] mb-3">{l('Management', 'Usimamizi')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MANAGEMENT_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl text-left hover:border-[#34D399]/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-[#34D399] group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] text-[#64748B] font-medium">{action.count}</span>
                </div>
                <h4 className="font-semibold text-xs text-[#F1F5F9]">{action.label}</h4>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity with AI tagging */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-bold text-[#F1F5F9] mb-3">{l('Recent Activity', 'Shughuli za Hivi Karibu')}</h2>
        <div className="space-y-2">
          {[
            { text: 'New guide verification request from Omar S.', time: '5 min ago', type: 'guide', ai: true },
            { text: 'AI flagged suspicious rating pattern on vendor #892', time: '12 min ago', type: 'fraud', ai: true },
            { text: 'Dispute #452 escalated by seeker', time: '15 min ago', type: 'dispute', ai: false },
            { text: 'AI revenue forecast updated: +22% next month', time: '1 hour ago', type: 'revenue', ai: true },
            { text: 'Vendor "Spice Paradise" submitted verification', time: '2 hours ago', type: 'vendor', ai: false },
          ].map((activity, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] p-3 rounded-xl flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.type === 'guide' ? 'bg-[#34D399]' : activity.type === 'dispute' ? 'bg-[#F87171]' : activity.type === 'fraud' ? 'bg-[#FBBF24]' : activity.type === 'revenue' ? 'bg-[#34D399]' : 'bg-[#22D3EE]'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-[#F1F5F9]">{activity.text}</p>
                  {activity.ai && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#34D399]/10 text-[8px] font-bold text-[#34D399]">AI</span>
                  )}
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34D399]/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#34D399]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F5F9]">{l('Admin AI Assistant', 'Msaidizi wa AI wa Msimamizi')}</p>
            <p className="text-xs text-[#94A3B8]">{l('Ask anything about platform analytics, user behavior, or fraud', 'Uliza chochote kuhusu uchambuzi, tabia ya mtumiaji, au udanganyifu')}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#34D399] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
