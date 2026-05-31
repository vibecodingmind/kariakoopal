'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Search, Star, ShieldCheck, MapPin, ChevronRight, Compass, Users, Clock, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const GUIDES = [
  { id: 'g1', name: 'Mwanaildi Juma', specialty: 'Fabrics & Village', zone: 'fabrics', rating: 4.8, sessions: 156, status: 'online' as const, verified: true, languages: ['Swahili', 'English', 'Arabic'], bio: 'Born and raised in Kariakoo. I know every fabric stall by name and can get you the best kanga deals in the market.' },
  { id: 'g2', name: 'Fatma Hassan', specialty: 'Electronics Expert', zone: 'electronics', rating: 4.6, sessions: 98, status: 'busy' as const, verified: true, languages: ['Swahili', 'English'], bio: 'Tech enthusiast who knows which stalls sell genuine products and which to avoid. Expert at price negotiation for electronics.' },
  { id: 'g3', name: 'Asha Mohamed', specialty: 'Wholesale Specialist', zone: 'wholesale', rating: 4.9, sessions: 210, status: 'online' as const, verified: true, languages: ['Swahili', 'English', 'Hindi'], bio: 'The wholesale queen of Kariakoo. I have direct relationships with importers and can get you bulk prices unavailable to walk-in buyers.' },
  { id: 'g4', name: 'Juma Ramadhani', specialty: 'Spices & Herbs', zone: 'spices', rating: 4.5, sessions: 67, status: 'offline' as const, verified: true, languages: ['Swahili', 'English'], bio: 'Spice connoisseur with deep knowledge of traditional remedies. I can identify authentic spices and help you avoid adulterated products.' },
  { id: 'g5', name: 'Halima Abdi', specialty: 'Kitchenware Pro', zone: 'kitchenware', rating: 4.7, sessions: 134, status: 'online' as const, verified: true, languages: ['Swahili', 'English'], bio: 'I help families and businesses find the best kitchenware at fair prices. I know which brands last and which are knockoffs.' },
  { id: 'g6', name: 'Omar Selemani', specialty: 'Artisanal Crafts', zone: 'artisanal', rating: 4.4, sessions: 45, status: 'offline' as const, verified: false, languages: ['Swahili'], bio: 'Artisan turned guide. I can introduce you to master craftsmen and help you find unique handcrafted pieces at fair prices.' },
  { id: 'g7', name: 'Khadija Mussa', specialty: 'Textiles & Fashion', zone: 'fabrics', rating: 4.8, sessions: 189, status: 'online' as const, verified: true, languages: ['Swahili', 'English', 'French'], bio: 'Fashion designer who sources all materials from Kariakoo. I know the latest trends and can help you find exactly what you need.' },
  { id: 'g8', name: 'Said Bakari', specialty: 'General Navigator', zone: 'all', rating: 4.3, sessions: 78, status: 'busy' as const, verified: true, languages: ['Swahili', 'English'], bio: 'Your all-rounder guide. I cover every zone in Kariakoo and can help with everything from finding a specific item to arranging delivery.' },
];

const ZONE_COLORS: Record<string, string> = {
  electronics: '#0891B2', fabrics: '#7C3AED', wholesale: '#14B8A6',
  spices: '#EF4444', kitchenware: '#F59E0B', artisanal: '#8B5E3C', all: '#3730A3',
};

const STATUS_MAP = {
  online: { color: '#10B981', label: 'Online', labelSw: 'Mtandaoni' },
  busy: { color: '#F59E0B', label: 'Busy', labelSw: 'Machwa' },
  offline: { color: '#78716C', label: 'Offline', labelSw: 'Nje ya Mtandao' },
};

const SPECIALTIES = ['All', 'Fabrics', 'Electronics', 'Wholesale', 'Spices', 'Kitchenware', 'Artisanal', 'General'];

export default function GuidesPage() {
  const router = useRouter();
  const { language, isAuthenticated } = useAuthStore();
  const sw = language === 'sw';
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'sessions'>('rating');

  const l = (en: string, swText: string) => (sw ? swText : en);

  const filtered = GUIDES.filter(g => {
    if (activeSpec > 0) {
      const specMap: Record<number, string> = { 1: 'fabrics', 2: 'electronics', 3: 'wholesale', 4: 'spices', 5: 'kitchenware', 6: 'artisanal', 7: 'all' };
      if (g.zone !== specMap[activeSpec]) return false;
    }
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.specialty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : b.sessions - a.sessions);

  return (
    <div className="px-4 py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#312E81] dark:text-[#818CF8]">{l('Browse Guides', 'Vinjua Miongozo')}</h1>
        <p className="text-sm text-[#78716C] mt-1">{l('Verified local experts who know Kariakoo inside out', 'Wataalamu wa karibu waliothibitishwa wanaojua Kariakoo vizuri')}</p>
      </motion.div>

      {/* Search */}
      <div className="ksearch flex items-center gap-2 px-4 py-3">
        <Search className="w-4 h-4 text-[#78716C]" />
        <input type="text" placeholder={l('Search guides...', 'Tafuta miongozo...')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#78716C]" />
        <button onClick={() => setSortBy(sortBy === 'rating' ? 'sessions' : 'rating')} className="text-xs text-[#78716C] hover:text-[#0A4D3A] font-medium">
          {sortBy === 'rating' ? l('Top Rated', 'Bora') : l('Most Active', 'Hodzi')}
        </button>
      </div>

      {/* Specialty Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPECIALTIES.map((spec, i) => (
          <button key={spec} onClick={() => setActiveSpec(i)} className={`ktag whitespace-nowrap ${activeSpec === i ? 'ktag-active' : 'ktag-inactive'}`}>
            {spec}
          </button>
        ))}
      </div>

      {/* Guide Cards */}
      <div className="space-y-3">
        {filtered.map((guide, i) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => router.push(`/guides/${guide.id}`)}
            className="kcard p-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${guide.status === 'online' ? 'ring-2 ring-[#10B981]' : guide.status === 'busy' ? 'ring-2 ring-[#F59E0B]' : ''}`} style={{ background: ZONE_COLORS[guide.zone] || '#3730A3' }}>
                  {guide.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#1A1832]" style={{ background: STATUS_MAP[guide.status].color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm truncate">{guide.name}</h4>
                  {guide.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#3730A3] shrink-0" />}
                </div>
                <p className="text-xs text-[#78716C]">{guide.specialty}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" /><span className="text-xs font-medium">{guide.rating}</span></div>
                  <div className="flex items-center gap-1"><Users className="w-3 h-3 text-[#78716C]" /><span className="text-xs text-[#78716C]">{guide.sessions} {l('sessions', 'vipindi')}</span></div>
                  <span className="text-[10px] font-medium" style={{ color: STATUS_MAP[guide.status].color }}>{sw ? STATUS_MAP[guide.status].labelSw : STATUS_MAP[guide.status].label}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#78716C] shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Join CTA */}
      {!isAuthenticated && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kcard-green p-5 text-center">
          <Compass className="w-8 h-8 text-[#D97706] mx-auto mb-2" />
          <h3 className="font-bold text-white">{l('Join as a Guide', 'Jiunge kama Mwongozo')}</h3>
          <p className="text-sm text-white/70 mt-1">{l('Monetize your local expertise and help visitors navigate Kariakoo', 'Pata pato kutoka kwa utaalamu wako wa karibu na wasaidie wageni kusoma Kariakoo')}</p>
          <button onClick={() => router.push('/auth?role=guide')} className="kbtn-yellow mt-3 text-sm">{l('Apply Now', 'Omba Sasa')}</button>
        </motion.div>
      )}
    </div>
  );
}
