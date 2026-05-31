'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Search, MapPin, DollarSign, Zap, ChevronRight, Users, Star, ShieldCheck, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const AVAILABLE_GUIDES = [
  { id: 'g1', name: 'Mwanaildi Juma', specialty: 'Fabrics & Village', zone: 'fabrics', rating: 4.8, sessions: 156, status: 'online', price: 15000, verified: true },
  { id: 'g3', name: 'Asha Mohamed', specialty: 'Wholesale Specialist', zone: 'wholesale', rating: 4.9, sessions: 210, status: 'online', price: 25000, verified: true },
  { id: 'g5', name: 'Halima Abdi', specialty: 'Kitchenware Pro', zone: 'kitchenware', rating: 4.7, sessions: 134, status: 'online', price: 15000, verified: true },
  { id: 'g7', name: 'Khadija Mussa', specialty: 'Textiles & Fashion', zone: 'fabrics', rating: 4.8, sessions: 189, status: 'online', price: 20000, verified: true },
  { id: 'g8', name: 'Said Bakari', specialty: 'General Navigator', zone: 'all', rating: 4.3, sessions: 78, status: 'online', price: 12000, verified: true },
];

export default function FindGuidePage() {
  const router = useRouter();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [budget, setBudget] = useState(0);
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'quick' | 'custom'>('quick');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth');
  }, [isAuthenticated, router]);

  const l = (en: string, swText: string) => (sw ? swText : en);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0A4D3C] dark:text-[#2EA77A]">{l('Find a Guide', 'Tafuta Mwongozo')}</h1>
        <p className="text-sm text-[#6C757D] mt-1">{l('Get matched with a verified local expert', 'Patanishwa na mtaalamu wa karibu aliye thibitishwa')}</p>
      </motion.div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setStep('quick')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${step === 'quick' ? 'bg-[#0B5D3A] text-white' : 'bg-[#F1F3F5] dark:bg-[#21262D] text-[#6C757D]'}`}>
          {l('Quick Match', 'Patanisha Haraka')}
        </button>
        <button onClick={() => setStep('custom')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${step === 'custom' ? 'bg-[#0B5D3A] text-white' : 'bg-[#F1F3F5] dark:bg-[#21262D] text-[#6C757D]'}`}>
          {l('Custom Request', 'Omba Maalum')}
        </button>
      </div>

      {step === 'quick' ? (
        <>
          {/* Search & Filter */}
          <div className="ksearch flex items-center gap-2 px-4 py-3">
            <Search className="w-4 h-4 text-[#6C757D]" />
            <input type="text" placeholder={l('Search guides...', 'Tafuta miongozo...')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6C757D]" />
          </div>

          {/* Available Now */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse-dot" />
              {l('Available Now', 'Wapo Sasa')} ({AVAILABLE_GUIDES.filter(g => g.status === 'online').length})
            </h2>
            <div className="space-y-3">
              {AVAILABLE_GUIDES.filter(g => g.status === 'online').filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.specialty.toLowerCase().includes(search.toLowerCase())).map((guide, i) => (
                <motion.div key={guide.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kcard p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0B5D3A] flex items-center justify-center text-white font-bold ring-2 ring-[#10B981]">
                      {guide.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-sm">{guide.name}</h4>
                        {guide.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D3A]" />}
                      </div>
                      <p className="text-xs text-[#6C757D]">{guide.specialty}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 fill-[#FFD23F] text-[#FFD23F]" />{guide.rating}</span>
                        <span className="flex items-center gap-1 text-xs text-[#6C757D]"><Users className="w-3 h-3" />{guide.sessions}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0A4D3C]">TZS {guide.price.toLocaleString()}</p>
                      <p className="text-[10px] text-[#6C757D]">{l('per session', 'kwa kipindi')}</p>
                    </div>
                  </div>
                  <button className="kbtn w-full mt-3 text-sm">{l('Request Guide', 'Omba Mwongozo')}</button>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Custom Request Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{l('What do you need?', 'Unahitaji nini?')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={l('e.g., I need to buy 50 kanga sets for my shop...', 'k.m., Ninahitaji kununua seti 50 za kanga kwa duka langu...')}
                className="kinput w-full h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{l('Which zone?', 'Eneo gani?')}</label>
              <div className="grid grid-cols-2 gap-2">
                {['Electronics', 'Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Any Zone'].map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-colors ${selectedZone === zone ? 'bg-[#0B5D3A] text-white' : 'bg-[#F1F3F5] dark:bg-[#21262D] text-[#6C757D] hover:bg-[#E8F5EE]'}`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{l('Budget (TZS)', 'Bajeti (TZS)')}</label>
              <input type="number" value={budget || ''} onChange={e => setBudget(Number(e.target.value))} placeholder="e.g., 25000" className="kinput w-full" />
            </div>

            <button className="kbtn w-full text-sm h-11" disabled={!description}>
              <MessageSquare className="w-4 h-4" />
              {l('Submit Request', 'Wasilisha Ombi')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
