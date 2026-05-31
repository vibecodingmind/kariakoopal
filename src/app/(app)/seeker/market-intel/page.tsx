'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, TrendingUp, Package, Tag, Lock, Shield,
  ShoppingCart, Check, Search, Star, Eye, ChevronRight,
  Library
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = [
  { value: 'all', label: 'All', labelSw: 'Zote', icon: BookOpen, color: '#065F46' },
  { value: 'market_intel', label: 'Market Intel', labelSw: 'Taarifa ya Soko', icon: TrendingUp, color: '#34D399' },
  { value: 'food_spots', label: 'Food Spots', labelSw: 'Maeneo ya Chakula', icon: Package, color: '#F59E0B' },
  { value: 'hidden_gems', label: 'Hidden Gems', labelSw: 'Rasilimali Zilizofichwa', icon: BookOpen, color: '#A78BFA' },
  { value: 'fashion_tips', label: 'Fashion Tips', labelSw: 'Vidokezo vya Mitindo', icon: Tag, color: '#EC4899' },
  { value: 'safety', label: 'Safety', labelSw: 'Usalama', icon: Shield, color: '#F87171' },
];

interface ContentItem {
  id: string;
  guideId: string;
  title: string;
  description: string;
  coverUrl: string;
  category: string;
  accessType: string;
  price: number;
  purchases: number;
  rating: number;
  purchased?: boolean;
}

const DEMO_CONTENT: ContentItem[] = [
  { id: 'c1', guideId: 'g1', title: 'Kariakoo Fabric Price Guide 2026', description: 'Complete guide to fabric prices in Kariakoo market with bargaining tips. Covers kanga, kitenge, and African prints with price ranges and negotiation strategies.', coverUrl: '', category: 'market_intel', accessType: 'one_time', price: 5000, purchases: 28, rating: 4.8 },
  { id: 'c2', guideId: 'g2', title: 'Hidden Street Food Map', description: '15 secret food spots only locals know about. From the best chapati stand to where to find fresh coconut water at 5am.', coverUrl: '', category: 'food_spots', accessType: 'one_time', price: 3000, purchases: 42, rating: 4.9 },
  { id: 'c3', guideId: 'g3', title: 'Safety Tips for Night Shopping', description: 'Essential safety guide for evening market visits. Areas to avoid, how to carry valuables, and emergency contacts.', coverUrl: '', category: 'safety', accessType: 'one_time', price: 0, purchases: 156, rating: 4.5, purchased: true },
  { id: 'c4', guideId: 'g1', title: 'Kariakoo Fashion District Guide', description: 'Where to find the best tailors, fabric shops, and fashion accessories in the market district.', coverUrl: '', category: 'fashion_tips', accessType: 'one_time', price: 4000, purchases: 19, rating: 4.7 },
  { id: 'c5', guideId: 'g4', title: 'Secret Rooftop Views', description: '5 hidden rooftop viewpoints in Kariakoo that offer stunning panoramic views of Dar es Salaam.', coverUrl: '', category: 'hidden_gems', accessType: 'one_time', price: 2500, purchases: 33, rating: 4.6, purchased: true },
  { id: 'c6', guideId: 'g2', title: 'Weekly Price Trends Report', description: 'Updated every Monday — track price changes across all major market categories for the week.', coverUrl: '', category: 'market_intel', accessType: 'subscription', price: 2000, purchases: 87, rating: 4.4 },
];

export default function SeekerMarketIntelPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [content, setContent] = useState<ContentItem[]>(DEMO_CONTENT);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const owned = content.filter(c => c.purchased);
  const filtered = content.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handlePurchase = async (id: string) => {
    setPurchasing(id);
    try {
      const res = await fetch(`/api/premium-content/${id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'current' }),
      });
      if (res.ok) {
        setContent(prev => prev.map(c => c.id === id ? { ...c, purchased: true } : c));
        setMessage(l('Content purchased!', 'Maudhui yamenunuliwa!'));
      } else {
        setMessage(l('Purchase failed', 'Kununua imekataa'));
      }
    } catch {
      // Demo: mark as purchased anyway
      setContent(prev => prev.map(c => c.id === id ? { ...c, purchased: true } : c));
      setMessage(l('Content purchased!', 'Maudhui yamenunuliwa!'));
    }
    setPurchasing(null);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
          {l('Market Intel', 'Taarifa ya Soko')}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {l('Premium market insights from local guides', 'Taarifa za kulipia za soko kutoka kwa waongozaji')}
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl p-1">
          <TabsTrigger value="browse" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-[#065F46] data-[state=active]:text-white">
            {l('Browse', 'Vinjari')}
          </TabsTrigger>
          <TabsTrigger value="owned" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-[#065F46] data-[state=active]:text-white">
            <Library className="w-3 h-3 mr-1" />
            {l('My Library', 'Maktaba Yangu')} ({owned.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={l('Search content...', 'Tafuta maudhui...')}
              className="w-full pl-9"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  category === cat.value
                    ? 'text-white shadow-md'
                    : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                }`}
                style={category === cat.value ? { background: cat.color } : {}}
              >
                <cat.icon className="w-3 h-3" />
                {l(cat.label, cat.labelSw)}
              </button>
            ))}
          </div>

          {/* Content grid */}
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[0];
              const isPurchased = item.purchased || item.price === 0;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="kcard p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Cover image placeholder */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cat.color}15` }}
                    >
                      <cat.icon className="w-7 h-7" style={{ color: cat.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{item.title}</p>
                        {item.accessType === 'subscription' && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-[#A78BFA] text-white">
                            {l('SUB', 'USAJILI')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{item.description}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[#94A3B8] flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                          {item.rating}
                        </span>
                        <span className="text-xs text-[#94A3B8] flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> {item.purchases}
                        </span>
                        {!isPurchased && item.price > 0 && (
                          <span className="text-xs font-bold text-[#F59E0B]">TZS {item.price.toLocaleString()}</span>
                        )}
                        {item.price === 0 && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-[#ECFDF5] text-[#065F46]">FREE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#334155]">
                    {isPurchased ? (
                      <Button className="w-full bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5] rounded-xl h-9">
                        <Check className="w-4 h-4 mr-1" />
                        {l('Read Now', 'Soma Sasa')}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(item.id)}
                        disabled={purchasing === item.id}
                        className="w-full bg-gradient-to-r from-[#065F46] to-[#059669] text-white rounded-xl h-9"
                      >
                        {purchasing === item.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                            {l('Purchase for TZS', 'Nunua kwa TZS')} {item.price.toLocaleString()}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="owned" className="mt-4 space-y-3">
          {owned.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">{l('No purchased content yet', 'Hakuna maudhui yaliyonunuliwa bado')}</p>
            </div>
          ) : (
            owned.map((item, i) => {
              const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[0];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="kcard p-4 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cat.color}18` }}
                  >
                    <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <p className="text-xs text-[#64748B]">{l(cat.label, cat.labelSw)}</p>
                  </div>
                  <Button className="bg-[#065F46] text-white rounded-xl h-8 px-3 text-xs">
                    {l('Read', 'Soma')}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-20 left-4 right-4 p-3 rounded-xl bg-[#ECFDF5] text-[#065F46] text-sm font-medium text-center z-50 shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </div>
  );
}
