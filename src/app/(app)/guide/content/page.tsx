'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Edit3, Trash2, Eye, DollarSign, Tag,
  Image, Lock, Unlock, TrendingUp, Package, ChevronDown, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { value: 'market_intel', label: 'Market Intel', labelSw: 'Taarifa ya Soko', icon: TrendingUp, color: '#34D399' },
  { value: 'food_spots', label: 'Food Spots', labelSw: 'Maeneo ya Chakula', icon: Package, color: '#F59E0B' },
  { value: 'hidden_gems', label: 'Hidden Gems', labelSw: 'Rasilimali Zilizofichwa', icon: BookOpen, color: '#A78BFA' },
  { value: 'fashion_tips', label: 'Fashion Tips', labelSw: 'Vidokezo vya Mitindo', icon: Tag, color: '#EC4899' },
  { value: 'safety', label: 'Safety', labelSw: 'Usalama', icon: Lock, color: '#F87171' },
];

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  accessType: string;
  price: number;
  purchases: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

const DEMO_CONTENT: ContentItem[] = [
  { id: 'c1', title: 'Kariakoo Fabric Price Guide 2026', description: 'Complete guide to fabric prices in Kariakoo market with bargaining tips', category: 'market_intel', accessType: 'one_time', price: 5000, purchases: 28, rating: 4.8, isActive: true, createdAt: '2026-05-15' },
  { id: 'c2', title: 'Hidden Street Food Map', description: '15 secret food spots only locals know about', category: 'food_spots', accessType: 'one_time', price: 3000, purchases: 42, rating: 4.9, isActive: true, createdAt: '2026-05-20' },
  { id: 'c3', title: 'Safety Tips for Night Shopping', description: 'Essential safety guide for evening market visits', category: 'safety', accessType: 'one_time', price: 0, purchases: 156, rating: 4.5, isActive: true, createdAt: '2026-05-10' },
];

export default function GuideContentPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [content, setContent] = useState<ContentItem[]>(DEMO_CONTENT);
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'market_intel',
    accessType: 'one_time',
    price: 5000,
  });

  // Stats
  const totalRevenue = content.reduce((a, c) => a + c.price * c.purchases, 0);
  const totalPurchases = content.reduce((a, c) => a + c.purchases, 0);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/premium-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId: 'current', ...newItem }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(prev => [data.content, ...prev]);
      }
    } catch {
      // Demo fallback
    }
    setContent(prev => [{
      id: `c${Date.now()}`,
      ...newItem,
      purchases: 0,
      rating: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setShowCreate(false);
    setNewItem({ title: '', description: '', category: 'market_intel', accessType: 'one_time', price: 5000 });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/premium-content/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setContent(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
            {l('Premium Content', 'Maudhui ya Kulipia')}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {l('Create and sell market insights', 'Unda na uze taarifa za soko')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#065F46] text-white rounded-xl h-10"
        >
          <Plus className="w-4 h-4 mr-1" />
          {l('New', 'Mpya')}
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="kcard-green p-4">
          <DollarSign className="w-5 h-5 text-white/70 mb-1" />
          <p className="text-2xl font-bold text-white">TZS {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-white/70">{l('Total Revenue', 'Jumla ya Mapato')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kcard p-4">
          <Eye className="w-5 h-5 text-[#A78BFA] mb-1" />
          <p className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{totalPurchases}</p>
          <p className="text-xs text-[#64748B]">{l('Total Purchases', 'Jumla ya Ununuzi')}</p>
        </motion.div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="kcard p-4 space-y-3 border-2 border-[#065F46]/20"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">{l('Create Content', 'Unda Maudhui')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <Input
              value={newItem.title}
              onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
              placeholder={l('Content title', 'Kichwa cha maudhui')}
              className="w-full"
            />

            <Textarea
              value={newItem.description}
              onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))}
              placeholder={l('Description / preview text', 'Maelezo / maandishi ya hakiki')}
              className="w-full min-h-[60px] resize-none"
            />

            {/* Category selector */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setNewItem(p => ({ ...p, category: cat.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    newItem.category === cat.value
                      ? 'text-white shadow-md'
                      : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                  }`}
                  style={newItem.category === cat.value ? { background: cat.color } : {}}
                >
                  <cat.icon className="w-3 h-3" />
                  {l(cat.label, cat.labelSw)}
                </button>
              ))}
            </div>

            {/* Access type */}
            <div className="flex gap-2">
              {['one_time', 'subscription'].map(type => (
                <button
                  key={type}
                  onClick={() => setNewItem(p => ({ ...p, accessType: type }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    newItem.accessType === type
                      ? 'bg-[#065F46] text-white'
                      : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                  }`}
                >
                  {type === 'one_time' ? l('One-time', 'Mara moja') : l('Subscription', 'Usajili')}
                </button>
              ))}
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-[#94A3B8]">{l('Price (TZS)', 'Bei (TZS)')} — 0 = {l('Free preview', 'Hakiki bila malipo')}</label>
              <Input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!newItem.title}
              className="w-full bg-[#065F46] text-white rounded-xl"
            >
              {l('Publish Content', 'Chapisha Maudhui')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content list */}
      <div className="space-y-3">
        {content.filter(c => c.isActive).map((item, i) => {
          const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[0];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="kcard p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${cat.color}18` }}
                >
                  <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    {item.price === 0 && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-[#ECFDF5] text-[#065F46]">FREE</span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.purchases} {l('purchases', 'wanunuzi')}
                    </span>
                    <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                      {item.accessType === 'one_time' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {item.accessType === 'one_time' ? l('One-time', 'Mara moja') : l('Sub', 'Usajili')}
                    </span>
                    {item.price > 0 && (
                      <span className="text-xs font-bold text-[#F59E0B]">TZS {item.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
