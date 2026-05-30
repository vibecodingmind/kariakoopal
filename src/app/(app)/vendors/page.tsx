'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Search, Star, ShieldCheck, MapPin, Phone, Clock, ThumbsUp,
  Filter, ChevronRight, Store, ArrowUpDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const VENDORS = [
  { id: 'v1', name: 'Zaki Electronics', zone: 'electronics', zoneName: 'Electronics Zone', stall: 'A-12', category: 'Phones', rating: 4.8, recs: 234, verified: true, contact: '+255712001234', hours: '8:00-19:00' },
  { id: 'v2', name: 'Mama Kanga Shop', zone: 'fabrics', zoneName: 'Fabrics Zone', stall: 'B-45', category: 'Kanga', rating: 4.9, recs: 312, verified: true, contact: '+255716007890', hours: '7:00-18:00' },
  { id: 'v3', name: 'Al-Falah Wholesale', zone: 'wholesale', zoneName: 'Wholesale Zone', stall: 'C-08', category: 'Bulk', rating: 4.7, recs: 267, verified: true, contact: '+255720003456', hours: '6:00-17:00' },
  { id: 'v4', name: 'Spice Paradise', zone: 'spices', zoneName: 'Spices Zone', stall: 'D-22', category: 'Spices', rating: 4.6, recs: 178, verified: false, contact: '+255722001234', hours: '8:00-17:00' },
  { id: 'v5', name: 'Kitchen World', zone: 'kitchenware', zoneName: 'Kitchenware Zone', stall: 'E-15', category: 'Kitchen', rating: 4.5, recs: 145, verified: true, contact: '+255724009012', hours: '8:00-18:00' },
  { id: 'v6', name: 'Craft Masters', zone: 'artisanal', zoneName: 'Artisanal Zone', stall: 'F-08', category: 'Crafts', rating: 4.7, recs: 98, verified: true, contact: '+255726007890', hours: '9:00-17:00' },
  { id: 'v10', name: 'Digital World', zone: 'electronics', zoneName: 'Electronics Zone', stall: 'A-28', category: 'Gadgets', rating: 4.5, recs: 156, verified: true, contact: '+255713005678', hours: '8:30-18:30' },
  { id: 'v20', name: 'Kitenge Palace', zone: 'fabrics', zoneName: 'Fabrics Zone', stall: 'B-12', category: 'Kitenge', rating: 4.7, recs: 278, verified: true, contact: '+255717001234', hours: '7:30-18:30' },
  { id: 'v30', name: 'Grain Masters', zone: 'wholesale', zoneName: 'Wholesale Zone', stall: 'C-22', category: 'Grains', rating: 4.6, recs: 189, verified: true, contact: '+255721007890', hours: '6:00-16:30' },
  { id: 'v40', name: 'Zanzibar Spice House', zone: 'spices', zoneName: 'Spices Zone', stall: 'D-05', category: 'Spices', rating: 4.8, recs: 210, verified: true, contact: '+255723005678', hours: '7:30-17:30' },
  { id: 'v50', name: 'Home Essentials', zone: 'kitchenware', zoneName: 'Kitchenware Zone', stall: 'E-30', category: 'Home', rating: 4.4, recs: 112, verified: false, contact: '+255725003456', hours: '8:30-18:30' },
  { id: 'v60', name: 'Basket Weavers', zone: 'artisanal', zoneName: 'Artisanal Zone', stall: 'F-12', category: 'Baskets', rating: 4.5, recs: 76, verified: false, contact: '+255727001234', hours: '9:00-16:00' },
];

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0077B6', fabrics: '#8A2BE2', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#FFA500', artisanal: '#8B5E3C',
};

const CATEGORIES = ['All', 'Electronics', 'Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Crafts'];

export default function VendorsPage() {
  const router = useRouter();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [sortBy, setSortBy] = useState<'recs' | 'rating' | 'name'>('recs');

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filtered = VENDORS.filter(v => {
    if (activeCategory > 0) {
      const catMap: Record<number, string> = { 1: 'electronics', 2: 'fabrics', 3: 'wholesale', 4: 'spices', 5: 'kitchenware', 6: 'artisanal' };
      if (v.zone !== catMap[activeCategory]) return false;
    }
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'recs') return b.recs - a.recs;
    if (sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Vendor Directory', 'Orodha ya Wauzaji')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{l('Browse verified stalls across Kariakoo', 'Vinjua maduka yaliyothibitishwa Kariakoo')}</p>
      </motion.div>

      {/* Search */}
      <div className="ksearch flex items-center gap-2 px-4 py-3">
        <Search className="w-4 h-4 text-[#6C757D]" />
        <input type="text" placeholder={l('Search vendors...', 'Tafuta wauzaji...')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6C757D]" />
        <button onClick={() => setSortBy(sortBy === 'recs' ? 'rating' : sortBy === 'rating' ? 'name' : 'recs')} className="flex items-center gap-1 text-xs text-[#6C757D] hover:text-[#0A4D3A]">
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === 'recs' ? l('Recs', 'Map.)') : sortBy === 'rating' ? l('Rating', 'Alama') : l('Name', 'Jina')}
        </button>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} onClick={() => setActiveCategory(i)} className={`ktag whitespace-nowrap ${activeCategory === i ? 'ktag-active' : 'ktag-inactive'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Vendor Cards */}
      <div className="space-y-3">
        {filtered.map((vendor, i) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => router.push(`/vendors/${vendor.id}`)}
            className="kcard p-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: ZONE_COLORS[vendor.zone] || '#0B5D3A' }}>
                {vendor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm truncate">{vendor.name}</h4>
                  {vendor.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D3A] shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#6C757D] flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.stall}</span>
                  <span className="kbadge text-[8px]" style={{ background: (ZONE_COLORS[vendor.zone] || '#999') + '15', color: ZONE_COLORS[vendor.zone] }}>{vendor.category}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6C757D] shrink-0" />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E9ECEF] dark:border-[#30363D]">
              <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#FFD23F] text-[#FFD23F]" /><span className="text-xs font-medium">{vendor.rating}</span></div>
              <div className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-[#0B5D3A]" /><span className="text-xs">{vendor.recs}</span></div>
              <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#6C757D]" /><span className="text-xs text-[#6C757D]">{vendor.hours}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      {!isAuthenticated && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-yellow p-5 text-center">
          <Store className="w-8 h-8 text-[#0A4D3C] mx-auto mb-2" />
          <h3 className="font-bold text-[#0A4D3C]">{l('Become a Verified Vendor', 'Kuwa Muuzaji Aliyethibitishwa')}</h3>
          <p className="text-sm text-[#0A4D3C]/70 mt-1">{l('Get discovered by thousands of buyers', 'Patikana na wanunuzi elfu')}</p>
          <button onClick={() => router.push('/auth')} className="kbtn mt-3 text-sm">{l('Get Started', 'Anza Sasa')}</button>
        </motion.div>
      )}
    </div>
  );
}
