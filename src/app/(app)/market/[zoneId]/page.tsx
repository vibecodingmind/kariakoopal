'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  ArrowLeft, Search, Star, ShieldCheck, MapPin, Clock, ThumbsUp,
  Navigation, Grid3X3, List, ChevronRight, Phone, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const ZONE_DATA: Record<string, {
  name: string; nameSw: string; color: string; desc: string; descSw: string;
  stalls: number; tips: string; tipsSw: string;
  vendors: { id: string; name: string; stall: string; category: string; rating: number; recommendations: number; verified: boolean; contact: string; hours: string }[];
  prices: { item: string; min: number; max: number; fair: boolean }[];
}> = {
  electronics: {
    name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki', color: '#0891B2',
    desc: 'The tech hub of Kariakoo — phones, accessories, gadgets & expert repairs.',
    descSw: 'Kituo cha teknolojia cha Kariakoo — simu, vifaa na urekebishaji wa kitaalamu.',
    stalls: 340, tips: 'Bargain hard on accessories — margins are 40-60%. Always test phones before paying.', tipsSw: 'Jadili sana kwa vifaa — faida ni 40-60%. Jaribu simu kabla ya kulipa.',
    vendors: [
      { id: 'v1', name: 'Zaki Electronics', stall: 'A-12', category: 'Phones', rating: 4.8, recommendations: 234, verified: true, contact: '+255712001234', hours: '8:00-19:00' },
      { id: 'v10', name: 'Digital World', stall: 'A-28', category: 'Gadgets', rating: 4.5, recommendations: 156, verified: true, contact: '+255713005678', hours: '8:30-18:30' },
      { id: 'v11', name: 'Mobile Fix Hub', stall: 'A-45', category: 'Repairs', rating: 4.6, recommendations: 189, verified: false, contact: '+255714009012', hours: '9:00-20:00' },
      { id: 'v12', name: 'Tech Connect', stall: 'A-03', category: 'Accessories', rating: 4.3, recommendations: 98, verified: false, contact: '+255715003456', hours: '8:00-18:00' },
    ],
    prices: [
      { item: 'Samsung Galaxy A54', min: 450000, max: 550000, fair: true },
      { item: 'iPhone 15 Pro', min: 2800000, max: 3200000, fair: false },
      { item: 'Bluetooth Speaker', min: 25000, max: 40000, fair: true },
      { item: 'Power Bank 20000mAh', min: 25000, max: 35000, fair: true },
    ],
  },
  fabrics: {
    name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge', color: '#7C3AED',
    desc: 'Vibrant textiles — kanga, kitenge, lace, silk & custom tailoring.',
    descSw: 'Nguo zenye rangi — kanga, kitenge, lace, hariri na ushonaji maalum.',
    stalls: 520, tips: 'Buy in pairs (kanga sets) for better prices. Morning visits get best selection.', tipsSw: 'Nunua jozi (seti za kanga) kwa bei nzuri. Zianga asubuhi kupata chaguo bora.',
    vendors: [
      { id: 'v2', name: 'Mama Kanga Shop', stall: 'B-45', category: 'Kanga', rating: 4.9, recommendations: 312, verified: true, contact: '+255716007890', hours: '7:00-18:00' },
      { id: 'v20', name: 'Kitenge Palace', stall: 'B-12', category: 'Kitenge', rating: 4.7, recommendations: 278, verified: true, contact: '+255717001234', hours: '7:30-18:30' },
      { id: 'v21', name: 'Lace & Silk House', stall: 'B-67', category: 'Lace', rating: 4.5, recommendations: 145, verified: false, contact: '+255718005678', hours: '8:00-17:30' },
      { id: 'v22', name: 'Fashion Fabrics', stall: 'B-23', category: 'Fashion', rating: 4.6, recommendations: 198, verified: true, contact: '+255719009012', hours: '8:00-18:00' },
    ],
    prices: [
      { item: 'Kanga Fabric Set (pair)', min: 15000, max: 25000, fair: true },
      { item: 'Kitenge Fabric (6 yards)', min: 35000, max: 55000, fair: true },
      { item: 'Lace Fabric (yard)', min: 8000, max: 15000, fair: true },
    ],
  },
  wholesale: {
    name: 'Wholesale Zone', nameSw: 'Eneo la Jumla', color: '#14B8A6',
    desc: 'Bulk buying paradise — rice, oil, sugar & household supplies by the sack.',
    descSw: 'Peponi ya kununua jumla — mchele, mafuta, sukari na vifaa vya nyumba kwa gunia.',
    stalls: 280, tips: 'Bring a local guide for best wholesale prices. Buy 10+ units for bulk discounts.', tipsSw: 'Leta mwongozo wa karibu kwa bei bora za jumla. Nunua vitu 10+ kwa punguzo.',
    vendors: [
      { id: 'v3', name: 'Al-Falah Wholesale', stall: 'C-08', category: 'Bulk', rating: 4.7, recommendations: 267, verified: true, contact: '+255720003456', hours: '6:00-17:00' },
      { id: 'v30', name: 'Grain Masters', stall: 'C-22', category: 'Grains', rating: 4.6, recommendations: 189, verified: true, contact: '+255721007890', hours: '6:00-16:30' },
    ],
    prices: [
      { item: 'Rice (50kg bag)', min: 65000, max: 80000, fair: true },
      { item: 'Cooking Oil (20L)', min: 58000, max: 68000, fair: false },
      { item: 'Sugar (50kg bag)', min: 120000, max: 140000, fair: true },
    ],
  },
  spices: {
    name: 'Spices Zone', nameSw: 'Eneo la Viungo', color: '#EF4444',
    desc: 'Aromatic treasures — turmeric, cardamom, cinnamon, cloves & herbal remedies.',
    descSw: 'Hazina za harufu — haldi, iliki, mdalasini, karafuu na dawa za mimea.',
    stalls: 150, tips: 'Smell before you buy — fresh spices have strong aromas. Ask for "mixed spice" deals.', tipsSw: 'Pumua kabla ya kununua — viungo safi vina harufu kali. Uliza kwa mpango wa "viungo mchanganyiko".',
    vendors: [
      { id: 'v4', name: 'Spice Paradise', stall: 'D-22', category: 'Spices', rating: 4.6, recommendations: 178, verified: false, contact: '+255722001234', hours: '8:00-17:00' },
      { id: 'v40', name: 'Zanzibar Spice House', stall: 'D-05', category: 'Spices', rating: 4.8, recommendations: 210, verified: true, contact: '+255723005678', hours: '7:30-17:30' },
    ],
    prices: [
      { item: 'Turmeric Powder (1kg)', min: 8000, max: 12000, fair: true },
      { item: 'Cardamom (100g)', min: 5000, max: 8000, fair: true },
      { item: 'Cinnamon Sticks (500g)', min: 6000, max: 9000, fair: true },
    ],
  },
  kitchenware: {
    name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo', color: '#F59E0B',
    desc: 'Everything for the kitchen — pots, pans, utensils & home essentials.',
    descSw: 'Kila kitu kwa jikoni — sufuria, vifaa na mahitaji ya nyumba.',
    stalls: 190, tips: 'Stainless steel items come with 1-year warranty at verified stalls.', tipsSw: 'Vitu vya stainless steel huja na dhamana ya mwaka 1 kwa maduka yaliyothibitishwa.',
    vendors: [
      { id: 'v5', name: 'Kitchen World', stall: 'E-15', category: 'Kitchen', rating: 4.5, recommendations: 145, verified: true, contact: '+255724009012', hours: '8:00-18:00' },
      { id: 'v50', name: 'Home Essentials', stall: 'E-30', category: 'Home', rating: 4.4, recommendations: 112, verified: false, contact: '+255725003456', hours: '8:30-18:30' },
    ],
    prices: [
      { item: 'Stainless Steel Pot Set', min: 45000, max: 65000, fair: true },
      { item: 'Plastic Storage Set (5pc)', min: 12000, max: 18000, fair: true },
    ],
  },
  artisanal: {
    name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii', color: '#8B5E3C',
    desc: 'Handcrafted treasures — baskets, carvings, jewelry & traditional crafts.',
    descSw: 'Hazina za mikono — vikapu, uchongaji, mapambo na sanaa za jadi.',
    stalls: 95, tips: 'Each piece tells a story — ask the artisan about their craft. Custom orders welcome.', tipsSw: 'Kila kipande kina hadithi — uliza mfundi kuhusu sanaa yake. Maagizo maalum yanakaribishwa.',
    vendors: [
      { id: 'v6', name: 'Craft Masters', stall: 'F-08', category: 'Crafts', rating: 4.7, recommendations: 98, verified: true, contact: '+255726007890', hours: '9:00-17:00' },
      { id: 'v60', name: 'Basket Weavers', stall: 'F-12', category: 'Baskets', rating: 4.5, recommendations: 76, verified: false, contact: '+255727001234', hours: '9:00-16:00' },
    ],
    prices: [
      { item: 'Handwoven Basket', min: 12000, max: 20000, fair: true },
      { item: 'Wooden Carving (medium)', min: 25000, max: 45000, fair: true },
    ],
  },
};

export default function ZonePage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const zoneId = params.zoneId as string;
  const zone = ZONE_DATA[zoneId];
  const l = (en: string, swText: string) => (sw ? swText : en);

  if (!zone) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-lg font-semibold text-[#64748B]">{l('Zone not found', 'Eneo halijapatikana')}</p>
        <button onClick={() => router.push('/market')} className="kbtn mt-4">{l('Back to Market', 'Rudi Sokoni')}</button>
      </div>
    );
  }

  const filteredVendors = zone.vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.push('/market')} className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0A4D3A] transition-colors">
          <ArrowLeft className="w-4 h-4" /> {l('Back to Market', 'Rudi Sokoni')}
        </button>
      </motion.div>

      {/* Zone Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kcard p-5" style={{ borderLeft: `4px solid ${zone.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: zone.color + '15' }}>
            <MapPin className="w-5 h-5" style={{ color: zone.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: zone.color }}>{sw ? zone.nameSw : zone.name}</h1>
            <p className="text-xs text-[#64748B]">{zone.stalls}+ {l('stalls', 'maduka')}</p>
          </div>
        </div>
        <p className="text-sm text-[#64748B]">{sw ? zone.descSw : zone.desc}</p>
        <div className="mt-3 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <p className="text-xs font-medium text-[#0A4D3A] dark:text-[#34D399]">💡 {l('Insider Tip', 'Ushauri wa Ndani')}: {sw ? zone.tipsSw : zone.tips}</p>
        </div>
      </motion.div>

      {/* Search */}
      <div className="ksearch flex items-center gap-2 px-4 py-3">
        <Search className="w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          placeholder={l('Search vendors...', 'Tafuta wauzaji...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#64748B]"
        />
        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="text-[#64748B]">
          {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>

      {/* Vendors */}
      <div>
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-3">{l('Vendors', 'Wauzaji')} ({filteredVendors.length})</h2>
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {filteredVendors.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/vendors/${vendor.id}`)}
              className="kcard p-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#065F46] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {vendor.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-sm truncate">{vendor.name}</h4>
                    {vendor.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#64748B]">{l('Stall', 'Duka')} {vendor.stall}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="text-xs font-medium">{vendor.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-[#065F46]" />
                  <span className="text-xs">{vendor.recommendations}</span>
                </div>
                <span className="kbadge text-[8px]" style={{ background: zone.color + '15', color: zone.color }}>{vendor.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Price Preview */}
      {zone.prices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#E2E8F0] mb-3">{l('Price Range', 'Kiwango cha Bei')}</h2>
          <div className="space-y-2">
            {zone.prices.map((p, i) => (
              <div key={i} className="kcard p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.item}</p>
                  <p className="text-xs text-[#64748B]">TZS {p.min.toLocaleString()} - {p.max.toLocaleString()}</p>
                </div>
                <span className={`kbadge ${p.fair ? 'kbadge-verified' : 'kbadge-pending'}`}>
                  {p.fair ? l('Fair', 'Haki') : l('Moderate', 'Wastani')}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/prices')} className="kbtn-outline w-full mt-3 text-sm">
            {l('View All Prices', 'Tazama Bei Zote')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kcard-green p-5 text-center">
        <Navigation className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
        <h3 className="font-bold text-white">{l('Need Navigation Help?', 'Unahitaji Msaada wa Njia?')}</h3>
        <p className="text-sm text-white/70 mt-1">{l('Get a verified guide to navigate this zone', 'Pata mwongozo aliye thibitishwa kusoma eneo hili')}</p>
        <button onClick={() => router.push('/guides')} className="kbtn-yellow mt-3 text-sm">
          {l('Find a Guide', 'Pata Mwongozo')}
        </button>
      </motion.div>
    </div>
  );
}
