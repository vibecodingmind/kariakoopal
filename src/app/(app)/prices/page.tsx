'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Search, TrendingDown, TrendingUp, Minus, DollarSign, ChevronRight, RefreshCw, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const PRICES = [
  { id: 1, item: 'Samsung Galaxy A54', category: 'Electronics', zone: 'Electronics Zone', min: 450000, max: 550000, fair: true, updated: '2h ago' },
  { id: 2, item: 'iPhone 15 Pro', category: 'Electronics', zone: 'Electronics Zone', min: 2800000, max: 3200000, fair: false, updated: '1h ago' },
  { id: 3, item: 'Bluetooth Speaker', category: 'Electronics', zone: 'Electronics Zone', min: 25000, max: 40000, fair: true, updated: '4h ago' },
  { id: 4, item: 'Power Bank 20000mAh', category: 'Electronics', zone: 'Electronics Zone', min: 25000, max: 35000, fair: true, updated: '6h ago' },
  { id: 5, item: 'Kanga Fabric Set (pair)', category: 'Fabrics', zone: 'Fabrics Zone', min: 15000, max: 25000, fair: true, updated: '3h ago' },
  { id: 6, item: 'Kitenge Fabric (6 yards)', category: 'Fabrics', zone: 'Fabrics Zone', min: 35000, max: 55000, fair: true, updated: '5h ago' },
  { id: 7, item: 'Lace Fabric (yard)', category: 'Fabrics', zone: 'Fabrics Zone', min: 8000, max: 15000, fair: true, updated: '2h ago' },
  { id: 8, item: 'Rice (50kg bag)', category: 'Wholesale', zone: 'Wholesale Zone', min: 65000, max: 80000, fair: true, updated: '1h ago' },
  { id: 9, item: 'Cooking Oil (20L)', category: 'Wholesale', zone: 'Wholesale Zone', min: 58000, max: 68000, fair: false, updated: '30m ago' },
  { id: 10, item: 'Sugar (50kg bag)', category: 'Wholesale', zone: 'Wholesale Zone', min: 120000, max: 140000, fair: true, updated: '2h ago' },
  { id: 11, item: 'Turmeric Powder (1kg)', category: 'Spices', zone: 'Spices Zone', min: 8000, max: 12000, fair: true, updated: '3h ago' },
  { id: 12, item: 'Cardamom (100g)', category: 'Spices', zone: 'Spices Zone', min: 5000, max: 8000, fair: true, updated: '4h ago' },
  { id: 13, item: 'Stainless Steel Pot Set', category: 'Kitchenware', zone: 'Kitchenware Zone', min: 45000, max: 65000, fair: true, updated: '5h ago' },
  { id: 14, item: 'Handwoven Basket', category: 'Artisanal', zone: 'Artisanal Zone', min: 12000, max: 20000, fair: true, updated: '6h ago' },
];

const CATEGORIES = ['All', 'Electronics', 'Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Artisanal'];

const EXCHANGE_RATES = [
  { currency: 'USD', flag: '🇺🇸', rate: 2580 },
  { currency: 'EUR', flag: '🇪🇺', rate: 2800 },
  { currency: 'KES', flag: '🇰🇪', rate: 17.8 },
  { currency: 'UGX', flag: '🇺🇬', rate: 0.69 },
];

export default function PricesPage() {
  const router = useRouter();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [watchList, setWatchList] = useState<number[]>([]);
  const [convertAmount, setConvertAmount] = useState(100);

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filtered = PRICES.filter(p => {
    if (activeCategory > 0 && p.category !== CATEGORIES[activeCategory]) return false;
    if (search && !p.item.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleWatch = (id: number) => {
    setWatchList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Price Radar', 'Rada ya Bei')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{l('Real-time fair market prices across Kariakoo', 'Bei za haki za soko za wakati halisi Kariakoo')}</p>
      </motion.div>

      {/* Search */}
      <div className="ksearch flex items-center gap-2 px-4 py-3">
        <Search className="w-4 h-4 text-[#64748B]" />
        <input type="text" placeholder={l('Search items...', 'Tafuta bidhaa...')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#64748B]" />
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => (
          <button key={cat} onClick={() => setActiveCategory(i)} className={`ktag whitespace-nowrap ${activeCategory === i ? 'ktag-active' : 'ktag-inactive'}`}>{cat}</button>
        ))}
      </div>

      {/* Watch List Badge */}
      {watchList.length > 0 && (
        <div className="kcard p-3 flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-[#065F46]" />{watchList.length} {l('items on watch list', 'bidhaa kwenye orodha')}</span>
          <button onClick={() => setWatchList([])} className="text-xs text-[#DC2626]">{l('Clear', 'Futa')}</button>
        </div>
      )}

      {/* Price Cards */}
      <div className="space-y-3">
        {filtered.map((price, i) => (
          <motion.div
            key={price.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="kcard p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{price.item}</h4>
                  {price.fair ? <TrendingDown className="w-3.5 h-3.5 text-[#10B981]" /> : <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />}
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{price.zone}</p>
                <p className="text-base font-bold text-[#065F46] dark:text-[#34D399] mt-1.5">
                  TZS {price.min.toLocaleString()} — {price.max.toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`kbadge ${price.fair ? 'kbadge-verified' : 'kbadge-pending'}`}>
                  {price.fair ? l('Fair', 'Haki') : l('Moderate', 'Wastani')}
                </span>
                <button onClick={() => toggleWatch(price.id)} className={`text-xs px-2 py-1 rounded-md transition-colors ${watchList.includes(price.id) ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] hover:text-[#065F46]'}`}>
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-[#64748B]">
              <RefreshCw className="w-3 h-3" />{l('Updated', 'Ilisasishwa')} {price.updated}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Currency Converter */}
      <div className="kcard p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#065F46]" />{l('Currency Converter', 'Kibadilishaji cha Fedha')}</h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            value={convertAmount}
            onChange={e => setConvertAmount(Number(e.target.value))}
            className="kinput w-24 text-center"
          />
          <span className="text-sm font-medium">USD → TZS</span>
        </div>
        <div className="space-y-2">
          {EXCHANGE_RATES.map(er => (
            <div key={er.currency} className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#475569] last:border-0">
              <span className="text-sm flex items-center gap-2"><span>{er.flag}</span>{er.currency}</span>
              <span className="text-sm font-medium">{(convertAmount * er.rate).toLocaleString()} TZS</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-5 text-center">
        <DollarSign className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
        <h3 className="font-bold text-white">{l('Want Better Prices?', 'Unataka Bei Bora?')}</h3>
        <p className="text-sm text-white/70 mt-1">{l('A local guide can negotiate the best deals for you', 'Mwongozo wa karibu anaweza kujadili mikataba bora kwa ajili yako')}</p>
        <button onClick={() => router.push(isAuthenticated ? '/seeker/find' : '/auth')} className="kbtn-yellow mt-3 text-sm">{l('Get a Guide', 'Pata Mwongozo')}</button>
      </motion.div>
    </div>
  );
}
