'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Heart, Star, MapPin, Store, Compass, X, ShieldCheck, Trash2, Zap, Scissors, Package, Flower2, ChefHat, Paintbrush } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0891B2', fabrics: '#7C3AED', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#F59E0B', artisanal: '#8B5E3C',
};

const ZONE_ICONS: Record<string, typeof Zap> = {
  electronics: Zap, fabrics: Scissors, wholesale: Package,
  spices: Flower2, kitchenware: ChefHat, artisanal: Paintbrush,
};

const SAVED_GUIDES = [
  { id: 'g1', name: 'Mwanaildi J.', specialty: 'Fabrics & Village', zone: 'fabrics', rating: 4.8, sessions: 156, online: true, verified: true },
  { id: 'g3', name: 'Asha Mohamed', specialty: 'Wholesale Specialist', zone: 'wholesale', rating: 4.9, sessions: 210, online: true, verified: true },
  { id: 'g5', name: 'Halima Abdi', specialty: 'Kitchenware Pro', zone: 'kitchenware', rating: 4.7, sessions: 134, online: false, verified: true },
  { id: 'g7', name: 'Joseph Mtei', specialty: 'Spice Market Expert', zone: 'spices', rating: 4.6, sessions: 98, online: true, verified: false },
  { id: 'g9', name: 'Fatma Hassan', specialty: 'Electronics Guide', zone: 'electronics', rating: 4.5, sessions: 87, online: false, verified: true },
];

const SAVED_VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', zone: 'electronics', stall: 'A-12', rating: 4.8, verified: true },
  { id: 'v2', name: 'Mama Kanga Shop', zone: 'fabrics', stall: 'B-45', rating: 4.9, verified: true },
  { id: 'v3', name: 'Al-Falah Wholesale', zone: 'wholesale', stall: 'C-08', rating: 4.7, verified: true },
  { id: 'v4', name: 'Spice Paradise', zone: 'spices', stall: 'D-22', rating: 4.6, verified: false },
  { id: 'v5', name: 'Kitchen World', zone: 'kitchenware', stall: 'E-15', rating: 4.5, verified: true },
];

const SAVED_ZONES = [
  { id: 'electronics', name: 'Electronics Zone', color: '#0891B2', stalls: 340 },
  { id: 'fabrics', name: 'Fabrics Zone', color: '#7C3AED', stalls: 520 },
  { id: 'wholesale', name: 'Wholesale Zone', color: '#14B8A6', stalls: 280 },
  { id: 'spices', name: 'Spices Zone', color: '#EF4444', stalls: 150 },
  { id: 'kitchenware', name: 'Kitchenware Zone', color: '#F59E0B', stalls: 190 },
  { id: 'artisanal', name: 'Artisanal Zone', color: '#8B5E3C', stalls: 95 },
];

export default function FavoritesPage() {
  const { user, isAuthenticated, language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [tab, setTab] = useState<'guides' | 'vendors' | 'zones'>('guides');
  const [savedGuides, setSavedGuides] = useState(SAVED_GUIDES);
  const [savedVendors, setSavedVendors] = useState(SAVED_VENDORS);
  const [savedZones, setSavedZones] = useState(SAVED_ZONES);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seeker') router.replace('/auth');
  }, [isAuthenticated, user, router]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  const tabs = [
    { key: 'guides' as const, label: l('Guides', 'Miongozo'), count: savedGuides.length },
    { key: 'vendors' as const, label: l('Vendors', 'Wauzaji'), count: savedVendors.length },
    { key: 'zones' as const, label: l('Zones', 'Maeneo'), count: savedZones.length },
  ];

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
          <Heart className="w-5 h-5 text-[#065F46] dark:text-[#34D399] fill-[#065F46] dark:fill-[#34D399]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#0F172A] dark:text-[#F1F5F9]">{l('Favorites', 'Vipendwa')}</h1>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{l('Your saved items', 'Vitu ulivyohifadhi')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`ktag ${tab === t.key ? 'ktag-active' : 'ktag-inactive'}`}
          >
            {t.label} <span className="text-[10px] opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'guides' && (
          <motion.div key="guides" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {savedGuides.length === 0 ? (
              <div className="kcard p-8 text-center">
                <Heart className="w-12 h-12 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-3" />
                <p className="font-bold text-[#64748B]">{l('No saved guides yet', 'Hakuna miongozo uliyohifadhi')}</p>
                <p className="text-xs text-[#64748B] mt-1">{l('Browse guides and tap the heart to save', 'Tafuta miongozo na bonyeza moyo kuhifadhi')}</p>
              </div>
            ) : savedGuides.map((guide, i) => (
              <motion.div key={guide.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="kcard p-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {guide.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {guide.online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white dark:border-[#1E293B]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm truncate">{guide.name}</h4>
                      {guide.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />}
                    </div>
                    <p className="text-xs text-[#64748B]">{guide.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                        <span className="text-xs font-bold">{guide.rating}</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">{guide.sessions} {l('sessions', 'vipindi')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/seeker/find`} className="kbtn text-[10px] py-1.5 px-3">{l('Book', 'Buka')}</Link>
                    <button onClick={() => setSavedGuides(prev => prev.filter(g => g.id !== guide.id))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] dark:hover:bg-[#2D1B1B] transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#DC2626]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'vendors' && (
          <motion.div key="vendors" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {savedVendors.length === 0 ? (
              <div className="kcard p-8 text-center">
                <Store className="w-12 h-12 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-3" />
                <p className="font-bold text-[#64748B]">{l('No saved vendors yet', 'Hakuna wauzaji uliyohifadhi')}</p>
              </div>
            ) : savedVendors.map((vendor, i) => (
              <motion.div key={vendor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="kcard p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${ZONE_COLORS[vendor.zone]}, ${ZONE_COLORS[vendor.zone]}CC)` }}
                  >
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm truncate">{vendor.name}</h4>
                      {vendor.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] dark:text-[#34D399]" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#64748B] flex items-center gap-0.5"><MapPin className="w-3 h-3" />{vendor.stall}</span>
                      <div className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" /><span className="text-xs font-bold">{vendor.rating}</span></div>
                    </div>
                  </div>
                  <button onClick={() => setSavedVendors(prev => prev.filter(v => v.id !== vendor.id))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] dark:hover:bg-[#2D1B1B] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#DC2626]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'zones' && (
          <motion.div key="zones" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-2 gap-3">
            {savedZones.length === 0 ? (
              <div className="col-span-2 kcard p-8 text-center">
                <Compass className="w-12 h-12 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-3" />
                <p className="font-bold text-[#64748B]">{l('No saved zones yet', 'Hakuna maeneo uliyohifadhi')}</p>
              </div>
            ) : savedZones.map((zone, i) => {
              const ZIcon = ZONE_ICONS[zone.id] || Compass;
              return (
                <motion.div key={zone.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/market/${zone.id}`} className="kcard p-4 block">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: zone.color + '15' }}>
                      <ZIcon className="w-5 h-5" style={{ color: zone.color }} />
                    </div>
                    <h4 className="font-bold text-xs leading-tight">{zone.name}</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{zone.stalls}+ {l('stalls', 'maduka')}</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
