'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Search, Store, Zap, Scissors, Package, ChefHat, Flower2, Paintbrush,
  MapPin, ChevronRight, Star, ShieldCheck, Filter, Grid3X3, List, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const ZONES = [
  { id: 'electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', color: '#0891B2', icon: Zap, stalls: 340, desc: 'Phones, gadgets, accessories & repairs', descSw: 'Simu, vifaa na urekebishaji' },
  { id: 'fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge', color: '#7C3AED', icon: Scissors, stalls: 520, desc: 'Kanga, kitenge, lace & fashion fabrics', descSw: 'Kanga, kitenge, lace na nguo za mitindo' },
  { id: 'wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla', color: '#14B8A6', icon: Package, stalls: 280, desc: 'Bulk goods, rice, oil & supplies', descSw: 'Bidhaa za jumla, mchele, mafuta na vifaa' },
  { id: 'spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo', color: '#EF4444', icon: Flower2, stalls: 150, desc: 'Turmeric, cardamom, cinnamon & herbs', descSw: 'Haldi, iliki, mdalasini na mimea' },
  { id: 'kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo', color: '#F59E0B', icon: ChefHat, stalls: 190, desc: 'Pots, utensils, cookware & home goods', descSw: 'Sufuria, vifaa na bidhaa za nyumba' },
  { id: 'artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii', color: '#8B5E3C', icon: Paintbrush, stalls: 95, desc: 'Handwoven baskets, carvings & crafts', descSw: 'Vikapu, uchongaji na sanaa za mkono' },
];

const FEATURED_VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', zone: 'electronics', stall: 'A-12', rating: 4.8, verified: true, category: 'Phones' },
  { id: 'v2', name: 'Mama Kanga Shop', zone: 'fabrics', stall: 'B-45', rating: 4.9, verified: true, category: 'Fabrics' },
  { id: 'v3', name: 'Al-Falah Wholesale', zone: 'wholesale', stall: 'C-08', rating: 4.7, verified: true, category: 'Bulk' },
  { id: 'v4', name: 'Spice Paradise', zone: 'spices', stall: 'D-22', rating: 4.6, verified: false, category: 'Spices' },
  { id: 'v5', name: 'Kitchen World', zone: 'kitchenware', stall: 'E-15', rating: 4.5, verified: true, category: 'Kitchen' },
];

const CATEGORIES = ['All', 'Electronics', 'Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Artisanal'];
const CATEGORIES_SW = ['Zote', 'Elektroniki', 'Vitenge', 'Jumla', 'Viungo', 'Chombo', 'Kisanii'];

export default function MarketPage() {
  const router = useRouter();
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filteredZones = ZONES.filter(z => {
    if (activeCategory === 0) return true;
    return z.id === CATEGORIES[activeCategory]?.toLowerCase();
  }).filter(z => !search || z.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Explore Market', 'Gundua Soko')}</h1>
        <p className="text-sm text-[#78716C] dark:text-[#A1A1AA] mt-1">
          {l('Discover 10,000+ stalls across 6 zones', 'Gundua maduka zaidi ya 10,000 katika maeneo 6')}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <div className="ksearch flex items-center gap-2 px-4 py-3">
          <Search className="w-4 h-4 text-[#78716C]" />
          <input
            type="text"
            placeholder={l('Search zones, vendors, categories...', 'Tafuta maeneo, wauzaji, makundi...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#78716C]"
          />
          <button className="kbtn text-xs py-1.5 px-3">
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Category Chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(i)}
            className={`ktag whitespace-nowrap ${activeCategory === i ? 'ktag-active' : 'ktag-inactive'}`}
          >
            {sw ? CATEGORIES_SW[i] : cat}
          </button>
        ))}
      </motion.div>

      {/* Zone Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#E7E5E4]">{l('Zones', 'Maeneo')}</h2>
        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="text-[#78716C] hover:text-[#312E81] transition-colors">
          {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
        </button>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {filteredZones.map((zone, i) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            onClick={() => router.push(`/market/${zone.id}`)}
            className="kcard p-4 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3`} style={{ backgroundColor: zone.color + '15' }}>
              <zone.icon className="w-5 h-5" style={{ color: zone.color }} />
            </div>
            <h3 className="font-semibold text-sm text-[#1C1917] dark:text-[#E7E5E4] group-hover:text-[#312E81] dark:group-hover:text-[#818CF8] transition-colors">
              {sw ? zone.nameSw : zone.name}
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#A1A1AA] mt-1 line-clamp-2">
              {sw ? zone.descSw : zone.desc}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-semibold" style={{ color: zone.color }}>{zone.stalls}+ {l('stalls', 'maduka')}</span>
              <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#312E81] transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Vendors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#E7E5E4]">{l('Featured Vendors', 'Wauzaji Bora')}</h2>
          <button onClick={() => router.push('/vendors')} className="text-sm font-medium text-[#0A4D3A] dark:text-[#818CF8]">{l('See All', 'Tazama Zote')}</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {FEATURED_VENDORS.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => router.push(`/vendors/${vendor.id}`)}
              className="kcard p-4 min-w-[200px] cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-bold">
                  {vendor.name.charAt(0)}
                </div>
                {vendor.verified && <ShieldCheck className="w-4 h-4 text-[#3730A3]" />}
              </div>
              <h4 className="font-semibold text-sm truncate">{vendor.name}</h4>
              <p className="text-xs text-[#78716C] mt-0.5">{vendor.stall}</p>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                <span className="text-xs font-medium">{vendor.rating}</span>
                <span className="kbadge kbadge-verified ml-auto">{vendor.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Market Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kcard-green p-5 text-center">
        <h3 className="text-lg font-bold text-white mb-2">{l('Live Market Data', 'Data ya Soko ya Moja kwa Moja')}</h3>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-2xl font-bold text-[#D97706]">10K+</p>
            <p className="text-xs text-white/70">{l('Stalls', 'Maduka')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D97706]">6</p>
            <p className="text-xs text-white/70">{l('Zones', 'Maeneo')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D97706]">2.5K+</p>
            <p className="text-xs text-white/70">{l('Guides', 'Miongozo')}</p>
          </div>
        </div>
        <button onClick={() => router.push('/guides')} className="kbtn-yellow mt-4 w-full text-sm">
          {l('Find a Guide', 'Pata Mwongozo')} <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
