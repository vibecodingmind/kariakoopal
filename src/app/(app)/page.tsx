'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Search, Store, Zap, Scissors, Package, ChefHat, Flower2, Paintbrush,
  MapPin, ChevronRight, Star, ShieldCheck, TrendingDown, TrendingUp,
  Compass, Users, Clock, ArrowRight, Sparkles, Flame, Bell, Eye, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Data ──

const ZONES = [
  { id: 'electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', color: '#0077B6', icon: Zap, stalls: 340, desc: 'Phones, gadgets, accessories & repairs', descSw: 'Simu, vifaa na urekebishaji', trend: '+12%', trending: true },
  { id: 'fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge', color: '#8A2BE2', icon: Scissors, stalls: 520, desc: 'Kanga, kitenge, lace & fashion fabrics', descSw: 'Kanga, kitenge, lace na nguo za mitindo', trend: '+8%', trending: true },
  { id: 'wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla', color: '#14B8A6', icon: Package, stalls: 280, desc: 'Bulk goods, rice, oil & supplies', descSw: 'Bidhaa za jumla, mchele, mafuta na vifaa', trend: '+5%', trending: false },
  { id: 'spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo', color: '#EF4444', icon: Flower2, stalls: 150, desc: 'Turmeric, cardamom, cinnamon & herbs', descSw: 'Haldi, iliki, mdalasini na mimea', trend: '+15%', trending: true },
  { id: 'kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo', color: '#FFA500', icon: ChefHat, stalls: 190, desc: 'Pots, utensils, cookware & home goods', descSw: 'Sufuria, vifaa na bidhaa za nyumba', trend: '+3%', trending: false },
  { id: 'artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii', color: '#8B5E3C', icon: Paintbrush, stalls: 95, desc: 'Handwoven baskets, carvings & crafts', descSw: 'Vikapu, uchongaji na sanaa za mkono', trend: '+20%', trending: true },
];

const FEATURED_VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', zone: 'electronics', stall: 'A-12', rating: 4.8, verified: true, category: 'Phones', categorySw: 'Simu' },
  { id: 'v2', name: 'Mama Kanga Shop', zone: 'fabrics', stall: 'B-45', rating: 4.9, verified: true, category: 'Fabrics', categorySw: 'Vitenge' },
  { id: 'v3', name: 'Al-Falah Wholesale', zone: 'wholesale', stall: 'C-08', rating: 4.7, verified: true, category: 'Bulk', categorySw: 'Jumla' },
  { id: 'v4', name: 'Spice Paradise', zone: 'spices', stall: 'D-22', rating: 4.6, verified: false, category: 'Spices', categorySw: 'Viungo' },
  { id: 'v5', name: 'Kitchen World', zone: 'kitchenware', stall: 'E-15', rating: 4.5, verified: true, category: 'Kitchen', categorySw: 'Jikoni' },
  { id: 'v6', name: 'Craft Masters', zone: 'artisanal', stall: 'F-08', rating: 4.7, verified: true, category: 'Crafts', categorySw: 'Sanaa' },
];

const TOP_GUIDES = [
  { id: 'g1', name: 'Mwanaildi J.', specialty: 'Fabrics & Village', zone: 'fabrics', rating: 4.8, sessions: 156, status: 'online' as const, verified: true },
  { id: 'g3', name: 'Asha Mohamed', specialty: 'Wholesale Specialist', zone: 'wholesale', rating: 4.9, sessions: 210, status: 'online' as const, verified: true },
  { id: 'g5', name: 'Halima Abdi', specialty: 'Kitchenware Pro', zone: 'kitchenware', rating: 4.7, sessions: 134, status: 'online' as const, verified: true },
];

const HOT_PRICES = [
  { item: 'Samsung Galaxy A54', itemSw: 'Samsung Galaxy A54', category: 'Electronics', min: 450000, max: 550000, fair: true, direction: 'down' as const },
  { item: 'Cooking Oil (20L)', itemSw: 'Mafuta ya Kupika (20L)', category: 'Wholesale', min: 58000, max: 68000, fair: false, direction: 'up' as const },
  { item: 'Kanga Set (pair)', itemSw: 'Kanga (joho)', category: 'Fabrics', min: 15000, max: 25000, fair: true, direction: 'down' as const },
  { item: 'Rice (50kg bag)', itemSw: 'Mchele (mzigo 50kg)', category: 'Wholesale', min: 65000, max: 80000, fair: true, direction: 'down' as const },
];

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0077B6', fabrics: '#8A2BE2', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#FFA500', artisanal: '#8B5E3C',
};

// ── Component ──

export default function HomePage() {
  const router = useRouter();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const l = (en: string, swText: string) => (sw ? swText : en);

  // Auto-hide notification after 5s
  useEffect(() => {
    const timer = setTimeout(() => setShowNotification(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="px-4 py-3 space-y-6 pb-24">
      {/* ═══ HERO SEARCH ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="khero-search relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FFD23F]/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/3 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {l('Explore Market', 'Gundua Soko')}
              </h1>
              <p className="text-sm text-white/60 mt-1 font-medium">
                {l('Discover 10,000+ stalls across 6 zones', 'Gundua maduka zaidi ya 10,000 katika maeneo 6')}
              </p>
            </div>
            <AnimatePresence>
              {showNotification && (
                <motion.button
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  onClick={() => { setShowNotification(false); router.push(isAuthenticated ? '/seeker/find' : '/auth'); }}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center relative backdrop-blur-sm transition-colors"
                >
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FFD23F] rounded-full animate-pulse-dot" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Search Input */}
          <div className={`flex items-center gap-2.5 bg-white dark:bg-[#161B22] rounded-2xl px-4 py-3 transition-all duration-300 ${searchFocused ? 'shadow-xl ring-2 ring-[#FFD23F]/40' : 'shadow-lg'}`}>
            <Search className="w-4.5 h-4.5 text-[#6C757D] shrink-0" />
            <input
              type="text"
              placeholder={l('Search vendors, zones, items...', 'Tafuta wauzaji, maeneo, bidhaa...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6C757D] dark:placeholder:text-[#8B949E]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#6C757D] hover:text-[#0A4D3C] font-medium transition-colors">✕</button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2.5 mt-4">
            <button onClick={() => router.push('/guides')} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-2.5 transition-all backdrop-blur-sm">
              <Compass className="w-4 h-4 text-[#FFD23F]" />
              <span className="text-xs font-bold text-white">{l('Find Guide', 'Tafuta Mwongozo')}</span>
            </button>
            <button onClick={() => router.push('/prices')} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-2.5 transition-all backdrop-blur-sm">
              <BarChart3 className="w-4 h-4 text-[#FFD23F]" />
              <span className="text-xs font-bold text-white">{l('Price Radar', 'Rada ya Bei')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ LIVE MARKET STATS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { value: '10K+', label: l('Stalls', 'Maduka'), color: '#0A4D3C', bg: '#E8F5EE' },
          { value: '6', label: l('Zones', 'Maeneo'), color: '#0077B6', bg: '#DBEAFE' },
          { value: '2.5K+', label: l('Guides', 'Miongozo'), color: '#14B8A6', bg: '#CCFBF1' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3 }}
            className="kcard-glass p-3.5 text-center"
          >
            <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] font-bold text-[#6C757D] dark:text-[#8B949E] uppercase tracking-widest mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ MARKET ZONES ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333] dark:text-[#F0F6FC]">{l('Market Zones', 'Maeneo ya Soko')}</h2>
          <button onClick={() => router.push('/market')} className="text-xs font-bold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5 hover:gap-1.5 transition-all">
            {l('See All', 'Tazama Zote')} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ZONES.map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push(`/market/${zone.id}`)}
              className="kcard p-4 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: zone.color + '12' }}>
                  <zone.icon className="w-5 h-5" style={{ color: zone.color }} />
                </div>
                {zone.trending && (
                  <span className="flex items-center gap-0.5 text-[9px] font-black text-[#10B981] bg-[#10B981]/8 px-1.5 py-0.5 rounded-md">
                    <Flame className="w-3 h-3" /> {zone.trend}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[13px] text-[#333] dark:text-[#F0F6FC] group-hover:text-[#0A4D3C] dark:group-hover:text-[#2EA77A] transition-colors leading-tight">
                {sw ? zone.nameSw : zone.name}
              </h3>
              <p className="text-[11px] text-[#6C757D] dark:text-[#8B949E] mt-1 line-clamp-1">
                {sw ? zone.descSw : zone.desc}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E9ECEF]/50 dark:border-[#30363D]/50">
                <span className="text-[11px] font-bold" style={{ color: zone.color }}>{zone.stalls}+ {l('stalls', 'maduka')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6C757D] group-hover:text-[#0A4D3C] group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ HOT PRICES ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-[#333] dark:text-[#F0F6FC]">{l('Hot Prices', 'Bei Moto')}</h2>
            <span className="kbadge kbadge-live flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" />{l('LIVE', 'MOJA KWA MOJA')}</span>
          </div>
          <button onClick={() => router.push('/prices')} className="text-xs font-bold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5 hover:gap-1.5 transition-all">
            {l('All Prices', 'Bei Zote')} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {HOT_PRICES.map((price, i) => (
            <motion.div
              key={price.item}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              whileHover={{ x: 4 }}
              onClick={() => router.push('/prices')}
              className="kcard p-3.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm truncate">{sw ? price.itemSw : price.item}</h4>
                    {price.direction === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-[#10B981] shrink-0" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#6C757D] mt-0.5 font-medium">{price.category}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-black text-[#0A4D3C] dark:text-[#2EA77A]">
                    TZS {price.min.toLocaleString()}
                  </p>
                  <span className={`kbadge text-[9px] ${price.fair ? 'kbadge-verified' : 'kbadge-pending'}`}>
                    {price.fair ? l('Fair', 'Haki') : l('Watch', 'Tazama')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ FEATURED VENDORS ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333] dark:text-[#F0F6FC]">{l('Featured Vendors', 'Wauzaji Bora')}</h2>
          <button onClick={() => router.push('/vendors')} className="text-xs font-bold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5 hover:gap-1.5 transition-all">
            {l('See All', 'Tazama Zote')} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {FEATURED_VENDORS.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              whileHover={{ y: -4 }}
              onClick={() => router.push(`/vendors/${vendor.id}`)}
              className="kcard p-4 min-w-[180px] cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm" style={{ background: `linear-gradient(135deg, ${ZONE_COLORS[vendor.zone]}, ${ZONE_COLORS[vendor.zone]}CC)` }}>
                  {vendor.name.charAt(0)}
                </div>
                {vendor.verified && <ShieldCheck className="w-4 h-4 text-[#0B5D3A] shrink-0" />}
              </div>
              <h4 className="font-bold text-xs truncate">{vendor.name}</h4>
              <p className="text-[10px] text-[#6C757D] mt-0.5 flex items-center gap-1 font-medium">
                <MapPin className="w-2.5 h-2.5" />{vendor.stall}
              </p>
              <div className="flex items-center gap-1 mt-2.5">
                <Star className="w-3.5 h-3.5 fill-[#FFD23F] text-[#FFD23F]" />
                <span className="text-[11px] font-bold">{vendor.rating}</span>
                <span className="ml-auto kbadge text-[8px]" style={{ background: (ZONE_COLORS[vendor.zone] || '#999') + '12', color: ZONE_COLORS[vendor.zone] }}>
                  {sw ? vendor.categorySw : vendor.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ TOP GUIDES ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#333] dark:text-[#F0F6FC]">{l('Top Guides', 'Miongozo Bora')}</h2>
            <Sparkles className="w-4 h-4 text-[#FFD23F]" />
          </div>
          <button onClick={() => router.push('/guides')} className="text-xs font-bold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5 hover:gap-1.5 transition-all">
            {l('All Guides', 'Wote')} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {TOP_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              whileHover={{ x: 4 }}
              onClick={() => router.push(`/guides/${guide.id}`)}
              className="kcard p-4 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm ring-2 ring-[#10B981] shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${ZONE_COLORS[guide.zone]}, ${ZONE_COLORS[guide.zone]}CC)` }}
                  >
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white dark:border-[#161B22] shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm truncate">{guide.name}</h4>
                    {guide.verified && <ShieldCheck className="w-4 h-4 text-[#0B5D3A] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#6C757D] font-medium">{guide.specialty}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />
                      <span className="text-xs font-bold">{guide.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#6C757D]" />
                      <span className="text-xs text-[#6C757D] font-medium">{guide.sessions} {l('sessions', 'vipindi')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/8 px-2 py-0.5 rounded-md">{l('ONLINE', 'MTANDAONI')}</span>
                  <ChevronRight className="w-4 h-4 text-[#6C757D] mt-1.5 group-hover:text-[#0A4D3C] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ CTA: FIND A GUIDE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="kcard-green p-6 text-center"
      >
        <div className="relative z-10">
          <Compass className="w-10 h-10 text-[#FFD23F] mx-auto mb-3" />
          <h3 className="font-black text-white text-xl">{l('Navigate Like a Local', 'Tembea Kama Mtaa')}</h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed max-w-xs mx-auto">
            {l(
              'Get a verified guide to find the best deals, avoid tourist traps, and negotiate like a pro.',
              'Pata mwongozo aliyethibitishwa kupata mikataba bora, kuepuka mitego na kujadili kama mtaalamu.'
            )}
          </p>
          <button
            onClick={() => router.push(isAuthenticated ? '/seeker/find' : '/auth')}
            className="kbtn-yellow mt-5 w-full text-sm"
          >
            {l('Find My Guide', 'Pata Mwongozo Wangu')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ═══ CTA: JOIN AS GUIDE ═══ */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="kcard-premium p-6 text-center"
        >
          <Store className="w-10 h-10 text-[#0A4D3C] dark:text-[#2EA77A] mx-auto mb-3" />
          <h3 className="font-black text-[#0A4D3C] dark:text-[#2EA77A]">{l('Are You a Local Expert?', 'Wewe ni Mtaalamu wa Karibu?')}</h3>
          <p className="text-sm text-[#6C757D] dark:text-[#8B949E] mt-2">
            {l('Join as a guide and monetize your local knowledge.', 'Jiunge kama mwongozo na pata pato kutoka kwa ujuzi wako.')}
          </p>
          <button
            onClick={() => router.push('/auth?role=guide')}
            className="kbtn-outline mt-4 text-sm"
          >
            {l('Join as Guide', 'Jiunge kama Mwongozo')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
