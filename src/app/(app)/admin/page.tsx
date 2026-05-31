'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Users, ShieldCheck, AlertTriangle, DollarSign, TrendingUp, Store, Compass, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Admin Dashboard', 'Dashibodi ya Msimamizi')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Platform overview & management', 'Muhtasari wa jukwaa na usimamizi')}</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: l('Total Users', 'Watumiaji'), value: '12,450', color: '#065F46' },
          { icon: Compass, label: l('Active Guides', 'Miongozo Hai'), value: '2,500', color: '#34D399' },
          { icon: Store, label: l('Vendors', 'Wauzaji'), value: '3,200', color: '#F59E0B' },
          { icon: DollarSign, label: l('Revenue (MTZS)', 'Mapato (MTZS)'), value: '450', color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="kcard p-4">
            <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Revenue Chart Placeholder */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="kcard p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-1"><BarChart3 className="w-4 h-4 text-[#065F46]" />{l('Revenue Trend', 'Mwelekeo wa Mapato')}</h3>
          <span className="text-xs text-[#10B981] flex items-center gap-1"><TrendingUp className="w-3 h-3" />+18%</span>
        </div>
        <div className="h-32 flex items-end gap-1.5">
          {[40, 65, 55, 80, 70, 90, 85, 95, 75, 88, 92, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-[#065F46] transition-all hover:bg-[#34D399]" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-[#64748B]">
          <span>Jan</span><span>Jun</span><span>Dec</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold mb-3">{l('Management', 'Usimamizi')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Compass, label: l('Manage Guides', 'Simamia Miongozo'), href: '/admin/guides', count: '12 pending' },
            { icon: Store, label: l('Manage Vendors', 'Simamia Wauzaji'), href: '/admin/vendors', count: '8 pending' },
            { icon: AlertTriangle, label: l('Disputes', 'Migogoro'), href: '/admin/disputes', count: '3 open' },
            { icon: ShieldCheck, label: l('Fraud Alerts', 'Tahadhari za Dhuluma'), href: '/admin/fraud', count: '2 new' },
          ].map((action, i) => (
            <button key={i} onClick={() => router.push(action.href)} className="kcard p-4 text-left hover:shadow-md transition-all">
              <action.icon className="w-6 h-6 text-[#065F46] mb-2" />
              <h4 className="font-semibold text-xs">{action.label}</h4>
              <p className="text-[10px] text-[#64748B] mt-0.5">{action.count}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold mb-3">{l('Recent Activity', 'Shughuli za Hivi Karibu')}</h2>
        <div className="space-y-2">
          {[
            { text: 'New guide verification request from Omar S.', time: '5 min ago', type: 'guide' },
            { text: 'Dispute #452 escalated by seeker', time: '15 min ago', type: 'dispute' },
            { text: 'Fraud alert triggered: Rating manipulation', time: '1 hour ago', type: 'fraud' },
            { text: 'Vendor "Spice Paradise" submitted verification', time: '2 hours ago', type: 'vendor' },
          ].map((activity, i) => (
            <div key={i} className="kcard p-3 flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.type === 'guide' ? 'bg-[#065F46]' : activity.type === 'dispute' ? 'bg-[#DC2626]' : activity.type === 'fraud' ? 'bg-[#F59E0B]' : 'bg-[#0891B2]'}`} />
              <div>
                <p className="text-xs">{activity.text}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
