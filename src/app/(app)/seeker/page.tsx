'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppStore } from '@/lib/stores/app-store';
import {
  MapPin, Search, ShoppingBag, Clock, Star, ChevronRight, Compass,
  TrendingUp, Users, Package, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Onboarding } from '@/components/onboarding';

export default function SeekerDashboard() {
  const { user, language, isAuthenticated } = useAuthStore();
  const { showOnboarding } = useAppStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth');
  }, [isAuthenticated, router]);

  if (isAuthenticated && user?.role === 'seeker' && showOnboarding) {
    return <Onboarding />;
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-[#6C757D]">{l('Welcome back,', 'Karibu tena,')}</p>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{user.name} 👋</h1>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push('/seeker/find')} className="kcard-green p-4 text-left">
          <Search className="w-6 h-6 text-[#FFD23F] mb-2" />
          <h3 className="font-bold text-white text-sm">{l('Find Guide', 'Tafuta Mwongozo')}</h3>
          <p className="text-xs text-white/60 mt-0.5">{l('Get matched now', 'Patanishwa sasa')}</p>
        </button>
        <button onClick={() => router.push('/seeker/shopping-list')} className="kcard-yellow p-4 text-left">
          <ShoppingBag className="w-6 h-6 text-[#0A4D3C] mb-2" />
          <h3 className="font-bold text-[#0A4D3C] text-sm">{l('Shopping List', 'Orodha ya Manunuzi')}</h3>
          <p className="text-xs text-[#0A4D3C]/60 mt-0.5">{l('Plan your trip', 'Panga safari yako')}</p>
        </button>
        <button onClick={() => router.push('/prices')} className="kcard p-4 text-left">
          <TrendingUp className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Price Radar', 'Rada ya Bei')}</h3>
          <p className="text-xs text-[#6C757D] mt-0.5">{l('Check fair prices', 'Angalia bei za haki')}</p>
        </button>
        <button onClick={() => router.push('/seeker/buddy')} className="kcard p-4 text-left">
          <Users className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Find Buddy', 'Tafuta Rafiki')}</h3>
          <p className="text-xs text-[#6C757D] mt-0.5">{l('Share guide costs', 'Shiriki gharama')}</p>
        </button>
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
            <div className="w-10 h-10 rounded-full bg-[#FFD23F] flex items-center justify-center text-[#0A4D3C] font-bold">MJ</div>
            <div>
              <p className="text-white font-semibold text-sm">Mwanaildi Juma</p>
              <p className="text-white/60 text-xs">{l('Fabrics & Village Guide', 'Mwongozo wa Vitenge na Kijiji')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l('1h 23m', '1s 23d')}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l('Fabrics Zone', 'Eneo la Vitenge')}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />4.8</span>
          </div>
          <button className="kbtn-yellow w-full text-sm">{l('Open Session', 'Fungua Kipindi')}</button>
        </div>
      </motion.div>

      {/* Recent History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{l('Recent', 'Ya Hivi Karibu')}</h2>
          <button onClick={() => router.push('/seeker/history')} className="text-sm text-[#0B5D3A] dark:text-[#2EA77A] font-medium">{l('See All', 'Tazama Zote')}</button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Electronics Shopping', guide: 'Fatma Hassan', date: '2 days ago', rating: 5, amount: 'TZS 35,000' },
            { name: 'Wholesale Bulk Buy', guide: 'Asha Mohamed', date: '1 week ago', rating: 5, amount: 'TZS 75,000' },
          ].map((session, i) => (
            <div key={i} className="kcard p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F3F5] dark:bg-[#21262D] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-[#0B5D3A]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{session.name}</p>
                  <p className="text-xs text-[#6C757D]">{session.guide} · {session.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#0A4D3C]">{session.amount}</p>
                <div className="flex items-center gap-0.5 justify-end">{Array.from({ length: session.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="kcard p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-[#FFD23F]" />
          <span className="text-sm font-semibold">{l('Notifications', 'Arifa')}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-[#FFD23F]/10">
            <Package className="w-4 h-4 text-[#0B5D3A] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">{l('Price drop on Samsung Galaxy A54!', 'Bei imepungua kwa Samsung Galaxy A54!')}</p>
              <p className="text-[10px] text-[#6C757D]">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-[#E8F5EE]">
            <Users className="w-4 h-4 text-[#0B5D3A] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">{l('Buddy match found for Fabrics Zone tour', 'Rafiki amepatikana kwa ziara ya Eneo la Vitenge')}</p>
              <p className="text-[10px] text-[#6C757D]">5 hours ago</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
