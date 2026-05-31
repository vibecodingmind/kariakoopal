'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Search, Store, Zap, Scissors, Package, ChefHat, Flower2, Paintbrush,
  MapPin, ChevronRight, Star, ShieldCheck, TrendingDown, TrendingUp,
  Compass, Users, Clock, ArrowRight, Sparkles, Flame, Bell
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
    <div className="px-4 py-3 space-y-5 pb-24">
      {/* ═══ HERO SEARCH ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="khero-search relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {l('Explore Market', 'Gundua Soko')}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {l('Discover 10,000+ stalls across 6 zones', 'Gundua maduka zaidi ya 10,000 katika maeneo 6')}
              </p>
            </div>
            <AnimatePresence>
              {showNotification && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => { setShowNotification(false); router.push(isAuthenticated ? '/seeker/find' : '/auth'); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative"
                >
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FFD23F] rounded-full" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Search Input */}
          <div className={`flex items-center gap-2 bg-white dark:bg-[#161B22] rounded-xl px-3 py-2.5 transition-shadow ${searchFocused ? 'shadow-lg ring-2 ring-[#FFD23F]/50' : 'shadow-md'}`}>
            <Search className="w-4 h-4 text-[#6C757D] shrink-0" />
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
              <button onClick={() => setSearch('')} className="text-xs text-[#6C757D] hover:text-[#0A4D3C]">✕</button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => router.push('/guides')} className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg py-2 transition-colors">
              <Compass className="w-4 h-4 text-[#FFD23F]" />
              <span className="text-xs font-semibold text-white">{l('Find Guide', 'Tafuta Mwongozo')}</span>
            </button>
            <button onClick={() => router.push('/prices')} className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg py-2 transition-colors">
              <TrendingDown className="w-4 h-4 text-[#FFD23F]" />
              <span className="text-xs font-semibold text-white">{l('Price Radar', 'Rada ya Bei')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ LIVE MARKET STATS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { value: '10K+', label: l('Stalls', 'Maduka'), color: '#0A4D3C' },
          { value: '6', label: l('Zones', 'Maeneo'), color: '#0077B6' },
          { value: '2.5K+', label: l('Guides', 'Miongozo'), color: '#14B8A6' },
        ].map((stat, i) => (
          <div key={i} className="kcard p-3 text-center">
            <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] font-medium text-[#6C757D] dark:text-[#8B949E] uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══ MARKET ZONES ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#333] dark:text-[#F0F6FC]">{l('Market Zones', 'Maeneo ya Soko')}</h2>
          <button onClick={() => router.push('/market')} className="text-xs font-semibold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5">
            {l('See All', 'Tazama Zote')} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ZONES.map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              onClick={() => router.push(`/market/${zone.id}`)}
              className="kcard p-3.5 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: zone.color + '15' }}>
                  <zone.icon className="w-4.5 h-4.5" style={{ color: zone.color }} />
                </div>
                {zone.trending && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#10B981]">
                    <Flame className="w-3 h-3" /> {zone.trend}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[13px] text-[#333] dark:text-[#F0F6FC] group-hover:text-[#0A4D3C] dark:group-hover:text-[#2EA77A] transition-colors leading-tight">
                {sw ? zone.nameSw : zone.name}
              </h3>
              <p className="text-[11px] text-[#6C757D] dark:text-[#8B949E] mt-0.5 line-clamp-1">
                {sw ? zone.descSw : zone.desc}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] font-semibold" style={{ color: zone.color }}>{zone.stalls}+ {l('stalls', 'maduka')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6C757D] group-hover:text-[#0A4D3C] transition-colors" />
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#333] dark:text-[#F0F6FC]">{l('Hot Prices', 'Bei Moto')}</h2>
            <span className="kbadge kbadge-live flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-dot" />{l('LIVE', 'MOJA KWA MOJA')}</span>
          </div>
          <button onClick={() => router.push('/prices')} className="text-xs font-semibold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5">
            {l('All Prices', 'Bei Zote')} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {HOT_PRICES.map((price, i) => (
            <motion.div
              key={price.item}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              onClick={() => router.push('/prices')}
              className="kcard p-3 cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{sw ? price.itemSw : price.item}</h4>
                    {price.direction === 'down' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#6C757D] mt-0.5">{price.category}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#0A4D3C] dark:text-[#2EA77A]">
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#333] dark:text-[#F0F6FC]">{l('Featured Vendors', 'Wauzaji Bora')}</h2>
          <button onClick={() => router.push('/vendors')} className="text-xs font-semibold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5">
            {l('See All', 'Tazama Zote')} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {FEATURED_VENDORS.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              onClick={() => router.push(`/vendors/${vendor.id}`)}
              className="kcard p-3 min-w-[170px] cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: ZONE_COLORS[vendor.zone] || '#0B5D3A' }}>
                  {vendor.name.charAt(0)}
                </div>
                {vendor.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D3A] shrink-0" />}
              </div>
              <h4 className="font-semibold text-xs truncate">{vendor.name}</h4>
              <p className="text-[10px] text-[#6C757D] mt-0.5 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />{vendor.stall}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />
                <span className="text-[11px] font-semibold">{vendor.rating}</span>
                <span className="ml-auto kbadge text-[8px]" style={{ background: (ZONE_COLORS[vendor.zone] || '#999') + '15', color: ZONE_COLORS[vendor.zone] }}>
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#333] dark:text-[#F0F6FC]">{l('Top Guides', 'Miongozo Bora')}</h2>
            <Sparkles className="w-4 h-4 text-[#FFD23F]" />
          </div>
          <button onClick={() => router.push('/guides')} className="text-xs font-semibold text-[#0A4D3C] dark:text-[#2EA77A] flex items-center gap-0.5">
            {l('All Guides', 'Wote')} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {TOP_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              onClick={() => router.push(`/guides/${guide.id}`)}
              className="kcard p-3.5 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-[#10B981]"
                    style={{ background: ZONE_COLORS[guide.zone] || '#0B5D3A' }}
                  >
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white dark:border-[#161B22]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-sm truncate">{guide.name}</h4>
                    {guide.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D3A] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#6C757D]">{guide.specialty}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />
                      <span className="text-xs font-semibold">{guide.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#6C757D]" />
                      <span className="text-xs text-[#6C757D]">{guide.sessions} {l('sessions', 'vipindi')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-[#10B981]">{l('ONLINE', 'MTANDAONI')}</span>
                  <ChevronRight className="w-4 h-4 text-[#6C757D] mt-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ CTA: FIND A GUIDE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="kcard-green p-5 text-center"
      >
        <Compass className="w-8 h-8 text-[#FFD23F] mx-auto mb-2" />
        <h3 className="font-bold text-white text-lg">{l('Navigate Like a Local', 'Tembea Kama Mtaa')}</h3>
        <p className="text-sm text-white/70 mt-1 leading-relaxed">
          {l(
            'Get a verified guide to find the best deals, avoid tourist traps, and negotiate like a pro.',
            'Pata mwongozo aliyethibitishwa kupata mikataba bora, kuepuka mitego na kujadili kama mtaalamu.'
          )}
        </p>
        <button
          onClick={() => router.push(isAuthenticated ? '/seeker/find' : '/auth')}
          className="kbtn-yellow mt-4 w-full text-sm"
        >
          {l('Find My Guide', 'Pata Mwongozo Wangu')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* ═══ CTA: JOIN AS GUIDE (if not authenticated) ═══ */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="kcard p-5 text-center border-dashed border-2 border-[#0A4D3C]/20 dark:border-[#2EA77A]/20"
        >
          <Store className="w-8 h-8 text-[#0A4D3C] dark:text-[#2EA77A] mx-auto mb-2" />
          <h3 className="font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Are You a Local Expert?', 'Wewe ni Mtaalamu wa Karibu?')}</h3>
          <p className="text-sm text-[#6C757D] dark:text-[#8B949E] mt-1">
            {l('Join as a guide and monetize your local knowledge.', 'Jiunge kama mwongozo na pata pato kutoka kwa ujuzi wako.')}
          </p>
          <button
            onClick={() => router.push('/auth?role=guide')}
            className="kbtn-outline mt-3 text-sm"
          >
            {l('Join as Guide', 'Jiunge kama Mwongozo')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
