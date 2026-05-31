'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { DollarSign, Users, Clock, Star, TrendingUp, Package, MapPin, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-[#6C757D]">{l('Hello,', 'Hujambo,')}</p>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{user.name} 🧭</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-[#10B981] font-medium">{l('Online', 'Mtandaoni')}</span>
        </div>
      </motion.div>

      {/* Earnings Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard-green p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">{l('This Month\'s Earnings', 'Mapato ya Mwezi Huu')}</span>
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
        </div>
        <p className="text-3xl font-bold text-white">TZS 425,000</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3 text-[#10B981]" />
          <span className="text-xs text-[#10B981]">+12% {l('from last month', 'kutoka mwezi uliopita')}</span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <div className="kcard p-3 text-center">
          <Users className="w-5 h-5 text-[#0B5D3A] mx-auto mb-1" />
          <p className="text-lg font-bold">28</p>
          <p className="text-[10px] text-[#6C757D]">{l('Sessions', 'Vipindi')}</p>
        </div>
        <div className="kcard p-3 text-center">
          <Star className="w-5 h-5 text-[#FFD23F] mx-auto mb-1 fill-[#FFD23F]" />
          <p className="text-lg font-bold">4.8</p>
          <p className="text-[10px] text-[#6C757D]">{l('Rating', 'Alama')}</p>
        </div>
        <div className="kcard p-3 text-center">
          <Clock className="w-5 h-5 text-[#0B5D3A] mx-auto mb-1" />
          <p className="text-lg font-bold">42h</p>
          <p className="text-[10px] text-[#6C757D]">{l('Hours', 'Masaa')}</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push('/guide/sessions')} className="kcard p-4 text-left">
          <Zap className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Sessions', 'Vipindi')}</h3>
          <p className="text-xs text-[#6C757D]">{l('Manage bookings', 'Simamia uhifadhi')}</p>
        </button>
        <button onClick={() => router.push('/guide/packages')} className="kcard p-4 text-left">
          <Package className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Packages', 'Pakiti')}</h3>
          <p className="text-xs text-[#6C757D]">{l('Create deals', 'Unda mikataba')}</p>
        </button>
        <button onClick={() => router.push('/guide/earnings')} className="kcard p-4 text-left">
          <DollarSign className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Earnings', 'Mapato')}</h3>
          <p className="text-xs text-[#6C757D]">{l('View payouts', 'Tazama malipo')}</p>
        </button>
        <button onClick={() => router.push('/guide/profile')} className="kcard p-4 text-left">
          <MapPin className="w-6 h-6 text-[#0B5D3A] mb-2" />
          <h3 className="font-bold text-sm">{l('Profile', 'Wasifu')}</h3>
          <p className="text-xs text-[#6C757D]">{l('Edit details', 'Hariri maelezo')}</p>
        </button>
      </motion.div>

      {/* Pending Requests */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-lg font-bold mb-3">{l('Pending Requests', 'Maombi Yanayosubiri')}</h2>
        <div className="space-y-3">
          {[
            { name: 'Tourist from Kenya', need: 'Wholesale bulk buy', zone: 'Wholesale Zone', budget: 50000 },
            { name: 'Business buyer', need: '50 kanga sets', zone: 'Fabrics Zone', budget: 25000 },
          ].map((req, i) => (
            <div key={i} className="kcard p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{req.name}</h4>
                <span className="text-sm font-bold text-[#0A4D3C]">TZS {req.budget.toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#6C757D]">{req.need} · {req.zone}</p>
              <div className="flex gap-2 mt-3">
                <button className="kbtn flex-1 text-xs py-2">{l('Accept', 'Kubali')}</button>
                <button className="kbtn-outline flex-1 text-xs py-2">{l('Decline', 'Kataa')}</button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
