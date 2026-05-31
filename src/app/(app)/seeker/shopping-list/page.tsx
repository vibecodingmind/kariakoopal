'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ShoppingBag, Plus, Check, Trash2, MapPin, X, Share2, Download, Sparkles, ChevronDown, ChevronUp, Edit3, Tag, DollarSign, Filter, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  targetPrice: number;
  actualPrice: number;
  category: string;
  zone: string;
  priority: 'must-have' | 'nice-to-have';
  purchased: boolean;
  notes: string;
}

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'fabrics', name: 'Fabrics & Textiles', emoji: '🧵' },
  { id: 'spices', name: 'Spices & Herbs', emoji: '🌶️' },
  { id: 'food', name: 'Food & Beverages', emoji: '🍚' },
  { id: 'souvenirs', name: 'Souvenirs & Crafts', emoji: '🎭' },
  { id: 'kitchenware', name: 'Kitchenware', emoji: '🍳' },
  { id: 'wholesale', name: 'Wholesale', emoji: '📦' },
  { id: 'general', name: 'General', emoji: '🛒' },
];

const DEMO_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Kanga Fabric Set', quantity: 5, targetPrice: 20000, actualPrice: 18000, category: 'fabrics', zone: 'Fabrics Zone', priority: 'must-have', purchased: true, notes: 'Traditional patterns preferred' },
  { id: '2', name: 'Samsung Galaxy A54', quantity: 1, targetPrice: 500000, actualPrice: 0, category: 'electronics', zone: 'Electronics Zone', priority: 'must-have', purchased: false, notes: 'Check warranty' },
  { id: '3', name: 'Turmeric Powder (1kg)', quantity: 3, targetPrice: 10000, actualPrice: 8500, category: 'spices', zone: 'Spices Zone', priority: 'nice-to-have', purchased: true, notes: '' },
  { id: '4', name: 'Rice (50kg bag)', quantity: 2, targetPrice: 72000, actualPrice: 0, category: 'wholesale', zone: 'Wholesale Zone', priority: 'must-have', purchased: false, notes: 'Pakistani basmati if available' },
  { id: '5', name: 'Stainless Steel Pot Set', quantity: 1, targetPrice: 55000, actualPrice: 52000, category: 'kitchenware', zone: 'Kitchenware Zone', priority: 'nice-to-have', purchased: true, notes: '' },
  { id: '6', name: 'Tanzanite Earrings', quantity: 1, targetPrice: 150000, actualPrice: 0, category: 'souvenirs', zone: 'Jewelry Zone', priority: 'nice-to-have', purchased: false, notes: 'Gift for mom' },
  { id: '7', name: 'Zanzibar Cloves (500g)', quantity: 2, targetPrice: 15000, actualPrice: 0, category: 'spices', zone: 'Spices Zone', priority: 'nice-to-have', purchased: false, notes: '' },
  { id: '8', name: 'Power Bank 20000mAh', quantity: 2, targetPrice: 25000, actualPrice: 0, category: 'electronics', zone: 'Electronics Zone', priority: 'must-have', purchased: false, notes: 'Anker or Xiaomi brand' },
];

const AI_SUGGESTIONS = [
  { basedOn: 'Kanga Fabric Set', suggestion: 'Kitenge Fabric (matching set)', reason: 'Popular combo purchase' },
  { basedOn: 'Samsung Galaxy A54', suggestion: 'Phone Case + Screen Protector', reason: 'Essential accessories' },
  { basedOn: 'Turmeric Powder', suggestion: 'Cardamom Pods', reason: 'Spice collection starter' },
];

export default function ShoppingListPage() {
  const { language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [items, setItems] = useState<ShoppingItem[]>(DEMO_ITEMS);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState<'must-have' | 'nice-to-have'>('nice-to-have');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const togglePurchased = (id: string) => setItems(prev => prev.map(item => item.id === id ? { ...item, purchased: !item.purchased } : item));
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(), name: newItem, quantity: 1,
      targetPrice: parseInt(newTargetPrice) || 0, actualPrice: 0,
      category: newCategory, zone: '', priority: newPriority,
      purchased: false, notes: '',
    }]);
    setNewItem('');
    setNewTargetPrice('');
    setShowAddForm(false);
  };

  const filteredItems = categoryFilter === 'all' ? items : items.filter(i => i.category === categoryFilter);

  const totalTarget = items.reduce((sum, item) => sum + item.targetPrice * item.quantity, 0);
  const totalActual = items.reduce((sum, item) => sum + (item.purchased ? item.actualPrice * item.quantity : 0), 0);
  const totalRemaining = items.filter(i => !i.purchased).reduce((sum, item) => sum + item.targetPrice * item.quantity, 0);
  const purchasedCount = items.filter(i => i.purchased).length;

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const shareList = async () => {
    const text = items.map(i => `[${i.purchased ? '✓' : '○'}] ${i.name} x${i.quantity} - TZS ${i.targetPrice.toLocaleString()}`).join('\n');
    const summary = `\n\nTotal: TZS ${totalTarget.toLocaleString()} | Purchased: ${purchasedCount}/${items.length}`;
    if (navigator.share) {
      await navigator.share({ title: 'Chimbo Direct Shopping List', text: text + summary });
    } else {
      await navigator.clipboard.writeText(text + summary);
    }
  };

  const exportList = () => {
    const text = items.map(i => `${i.purchased ? '✓' : '○'} ${i.name} x${i.quantity} | Target: TZS ${i.targetPrice.toLocaleString()} | ${i.purchased ? `Actual: TZS ${i.actualPrice.toLocaleString()}` : 'Not purchased'} | ${i.priority} | ${i.category}`).join('\n');
    const summary = `\n\n--- Summary ---\nTotal Target: TZS ${totalTarget.toLocaleString()}\nTotal Actual: TZS ${totalActual.toLocaleString()}\nRemaining: TZS ${totalRemaining.toLocaleString()}\nItems: ${purchasedCount}/${items.length} purchased`;
    const blob = new Blob([text + summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chimbo-shopping-list-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{l('Shopping List', 'Orodha ya Manunuzi')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{purchasedCount}/{items.length} {l('items purchased', 'bidhaa zimenunuliwa')}</p>
      </motion.div>

      {/* Budget Tracker */}
      <div className="kcard p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">TZS {totalTarget.toLocaleString()}</p>
            <p className="text-[10px] text-[#64748B]">{l('Budget', 'Bajeti')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#F59E0B]">TZS {totalActual.toLocaleString()}</p>
            <p className="text-[10px] text-[#64748B]">{l('Spent', 'Matumizi')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#64748B]">TZS {totalRemaining.toLocaleString()}</p>
            <p className="text-[10px] text-[#64748B]">{l('Remaining', 'Imesalia')}</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#065F46] to-[#34D399] transition-all duration-500" style={{ width: `${items.length > 0 ? (purchasedCount / items.length) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[#64748B]">{Math.round((purchasedCount / items.length) * 100)}% {l('complete', 'kamili')}</span>
          {totalActual > 0 && totalTarget > 0 && (
            <span className={`text-[10px] font-medium ${totalActual <= totalTarget ? 'text-[#065F46]' : 'text-[#DC2626]'}`}>
              {totalActual <= totalTarget ? l('Under budget', 'Chini ya bajeti') : l('Over budget!', 'Zaidi ya bajeti!')} (TZS {Math.abs(totalTarget - totalActual).toLocaleString()})
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => setShowAddForm(true)} className="kbtn flex-1 text-xs py-2 flex items-center justify-center gap-1"><Plus className="w-3 h-3" />{l('Add Item', 'Ongeza Bidhaa')}</button>
        <button onClick={shareList} className="kbtn-outline text-xs py-2 px-3 flex items-center gap-1"><Share2 className="w-3 h-3" />{l('Share', 'Shiriki')}</button>
        <button onClick={exportList} className="kbtn-outline text-xs py-2 px-3 flex items-center gap-1"><Download className="w-3 h-3" /></button>
      </div>

      {/* Add Item Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="kcard p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{l('Add Item', 'Ongeza Bidhaa')}</h3>
              <button onClick={() => setShowAddForm(false)} className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={l('Item name...', 'Jina la bidhaa...')} className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] outline-none" onKeyDown={e => e.key === 'Enter' && addItem()} />
            <div className="grid grid-cols-2 gap-2">
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
              <input type="number" value={newTargetPrice} onChange={e => setNewTargetPrice(e.target.value)} placeholder={l('Target price', 'Bei lengwa')} className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:ring-2 focus:ring-[#065F46] outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNewPriority('must-have')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newPriority === 'must-have' ? 'bg-[#065F46] text-white border-[#065F46]' : 'border-[#E2E8F0] dark:border-[#334155] text-[#64748B]'}`}>{l('Must Have', 'Lazima')}</button>
              <button onClick={() => setNewPriority('nice-to-have')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newPriority === 'nice-to-have' ? 'bg-[#F59E0B] text-white border-[#F59E0B]' : 'border-[#E2E8F0] dark:border-[#334155] text-[#64748B]'}`}>{l('Nice to Have', 'Nzuri Kuwa Nayo')}</button>
            </div>
            <button onClick={addItem} className="kbtn w-full py-2 text-sm">{l('Add to List', 'Ongeza kwenye Orodha')}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === 'all' ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'}`}>{l('All', 'Zote')}</button>
        {CATEGORIES.filter(c => items.some(i => i.category === c.id)).map(c => (
          <button key={c.id} onClick={() => setCategoryFilter(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === c.id ? 'bg-[#065F46] text-white' : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'}`}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* Items by Category */}
      <div className="space-y-3">
        {Object.entries(groupedItems).map(([category, catItems]) => {
          const catInfo = CATEGORIES.find(c => c.id === category);
          const isExpanded = expandedCategory === category || Object.keys(groupedItems).length <= 3;
          const catPurchased = catItems.filter(i => i.purchased).length;
          return (
            <div key={category} className="kcard overflow-hidden">
              <button onClick={() => setExpandedCategory(isExpanded ? null : category)} className="w-full p-3 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">{catInfo?.emoji}</span>
                  <span className="font-semibold text-sm">{catInfo?.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#065F46]/10 text-[#065F46] dark:bg-[#34D399]/10 dark:text-[#34D399]">{catPurchased}/{catItems.length}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-3 pb-3 space-y-2">
                      {catItems.map(item => (
                        <div key={item.id} className={`flex items-center gap-3 p-2 rounded-xl ${item.purchased ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/30 opacity-75' : 'bg-[#F8FAFC] dark:bg-[#1E293B]'}`}>
                          <button onClick={() => togglePurchased(item.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${item.purchased ? 'bg-[#065F46] border-[#065F46]' : 'border-[#E2E8F0] dark:border-[#475569]'}`}>
                            {item.purchased && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.purchased ? 'line-through text-[#64748B]' : ''}`}>{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.priority === 'must-have' ? 'bg-[#065F46]/10 text-[#065F46] dark:bg-[#34D399]/10 dark:text-[#34D399]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>{item.priority === 'must-have' ? l('Must', 'Lazima') : l('Nice', 'Nzuri')}</span>
                              <span className="text-[10px] text-[#64748B]">x{item.quantity}</span>
                              {item.zone && <span className="text-[10px] text-[#64748B] flex items-center gap-0.5"><MapPin className="w-2 h-2" />{item.zone}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {item.purchased && item.actualPrice > 0 ? (
                              <p className="text-xs font-bold text-[#065F46]">TZS {(item.actualPrice * item.quantity).toLocaleString()}</p>
                            ) : item.targetPrice > 0 ? (
                              <p className="text-xs text-[#64748B]">~TZS {(item.targetPrice * item.quantity).toLocaleString()}</p>
                            ) : null}
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* AI Suggestions */}
      <div className="kcard p-4">
        <button onClick={() => setShowSuggestions(!showSuggestions)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span className="font-semibold text-sm">{l('AI Suggestions', 'Mapendekezo ya AI')}</span>
          </div>
          {showSuggestions ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>
        <AnimatePresence>
          {showSuggestions && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-2">
                {AI_SUGGESTIONS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[#FEF3C7]/50 dark:bg-[#78350F]/20">
                    <Sparkles className="w-3 h-3 text-[#F59E0B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{s.suggestion}</p>
                      <p className="text-[10px] text-[#64748B]">{l('Based on', 'Kulingana na')} {s.basedOn} · {s.reason}</p>
                    </div>
                    <button onClick={() => { setNewItem(s.suggestion); setShowAddForm(true); }} className="text-[10px] text-[#065F46] dark:text-[#34D399] font-bold">{l('Add', 'Ongeza')}</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Get a Guide CTA */}
      <div className="kcard-green p-4 text-center">
        <ShoppingBag className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
        <h3 className="font-bold text-white text-sm">{l('Need help shopping?', 'Unahitaji msaada wa manunuzi?')}</h3>
        <p className="text-xs text-white/60 mt-1">{l('Share your list with a local guide for the best deals', 'Shiriki orodha yako na mwongozo wa ndani kwa bei bora')}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => router.push('/seeker/find')} className="kbtn-yellow flex-1 text-sm">{l('Get a Guide', 'Pata Mwongoz')}</button>
          <button onClick={shareList} className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium flex items-center gap-1"><Share2 className="w-3 h-3" />{l('Share', 'Shiriki')}</button>
        </div>
      </div>
    </div>
  );
}
