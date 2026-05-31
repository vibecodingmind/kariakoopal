'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ShoppingBag, Plus, Check, Trash2, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShoppingItem {
  id: string; name: string; quantity: number; price: number; category: string; zone: string; purchased: boolean;
}

const DEMO_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Kanga Fabric Set', quantity: 5, price: 20000, category: 'Fabrics', zone: 'Fabrics Zone', purchased: false },
  { id: '2', name: 'Samsung Galaxy A54', quantity: 1, price: 500000, category: 'Electronics', zone: 'Electronics Zone', purchased: false },
  { id: '3', name: 'Turmeric Powder (1kg)', quantity: 3, price: 10000, category: 'Spices', zone: 'Spices Zone', purchased: true },
  { id: '4', name: 'Rice (50kg bag)', quantity: 2, price: 72000, category: 'Wholesale', zone: 'Wholesale Zone', purchased: false },
  { id: '5', name: 'Stainless Steel Pot Set', quantity: 1, price: 55000, category: 'Kitchenware', zone: 'Kitchenware Zone', purchased: true },
];

export default function ShoppingListPage() {
  const { language } = useAuthStore();
  const router = useRouter();
  const sw = language === 'sw';
  const [items, setItems] = useState<ShoppingItem[]>(DEMO_ITEMS);
  const [newItem, setNewItem] = useState('');
  const l = (en: string, swText: string) => (sw ? swText : en);

  const togglePurchased = (id: string) => setItems(prev => prev.map(item => item.id === id ? { ...item, purchased: !item.purchased } : item));
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), name: newItem, quantity: 1, price: 0, category: 'General', zone: '', purchased: false }]);
    setNewItem('');
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const purchased = items.filter(i => i.purchased).length;

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Shopping List', 'Orodha ya Manunuzi')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{purchased}/{items.length} {l('items purchased', 'bidhaa zimenunuliwa')}</p>
      </motion.div>

      {/* Progress */}
      <div className="kcard p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{l('Progress', 'Maendeleo')}</span>
          <span className="text-sm font-bold text-[#0A4D3C]">{Math.round((purchased / items.length) * 100)}%</span>
        </div>
        <div className="kprogress-green">
          <div className="kprogress-bar" style={{ width: `${(purchased / items.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6C757D]">{l('Total', 'Jumla')}: TZS {total.toLocaleString()}</span>
          <span className="text-xs text-[#6C757D]">{items.length - purchased} {l('remaining', 'zimesalia')}</span>
        </div>
      </div>

      {/* Add Item */}
      <div className="flex gap-2">
        <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={l('Add item...', 'Ongeza bidhaa...')} className="kinput flex-1" onKeyDown={e => e.key === 'Enter' && addItem()} />
        <button onClick={addItem} className="kbtn px-3"><Plus className="w-4 h-4" /></button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <AnimatePresence>
          {items.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} className={`kcard p-3 flex items-center gap-3 ${item.purchased ? 'opacity-60' : ''}`}>
              <button onClick={() => togglePurchased(item.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${item.purchased ? 'bg-[#0B5D3A] border-[#0B5D3A]' : 'border-[#E5E7EB] dark:border-[#30363D]'}`}>
                {item.purchased && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.purchased ? 'line-through text-[#6C757D]' : ''}`}>{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.zone && <span className="text-[10px] text-[#6C757D] flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.zone}</span>}
                  <span className="text-xs text-[#6C757D]">x{item.quantity}</span>
                </div>
              </div>
              {item.price > 0 && <span className="text-xs font-medium">TZS {(item.price * item.quantity).toLocaleString()}</span>}
              <button onClick={() => removeItem(item.id)} className="text-[#6C757D] hover:text-[#E63946] transition-colors"><Trash2 className="w-4 h-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="kcard-green p-4 text-center">
        <ShoppingBag className="w-6 h-6 text-[#FFD23F] mx-auto mb-2" />
        <h3 className="font-bold text-white text-sm">{l('Need help shopping?', 'Unahitaji msaada wa manunuzi?')}</h3>
        <button onClick={() => router.push('/seeker/find')} className="kbtn-yellow mt-2 text-sm">{l('Get a Guide', 'Pata Mwongozo')}</button>
      </div>
    </div>
  );
}
