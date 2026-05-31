'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Star, Eye, MousePointerClick, Calendar, MapPin,
  ChevronRight, Sparkles, Check, X, TrendingUp, Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BOOST_OPTIONS = [
  { type: 'profile', label: 'Profile Boost', labelSw: 'Boosta Profaili', desc: 'Appear first in search results', descSw: 'Ona kwanza katika matokeo ya utafutaji', dailyRate: 5000, icon: Star, color: '#F59E0B' },
  { type: 'package', label: 'Package Boost', labelSw: 'Boosta Pakiti', desc: 'Promote a specific package deal', descSw: 'Tangaza pakiti mahususi', dailyRate: 3000, icon: Rocket, color: '#34D399' },
  { type: 'tour', label: 'Tour Boost', labelSw: 'Boosta Ziara', desc: 'Boost a group tour listing', descSw: 'Boosta orodha ya ziara ya kikundi', dailyRate: 4000, icon: Sparkles, color: '#A78BFA' },
];

interface BoostListing {
  id: string;
  type: string;
  targetId: string;
  zoneId: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  cost: number;
  status: string;
  createdAt: string;
}

export default function GuideBoostPage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const l = (en: string, swText: string) => (sw ? swText : en);

  const [activeTab, setActiveTab] = useState<'create' | 'active'>('create');
  const [selectedType, setSelectedType] = useState('profile');
  const [zoneId, setZoneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeBoosts, setActiveBoosts] = useState<BoostListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const selectedOption = BOOST_OPTIONS.find(o => o.type === selectedType)!;

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const estimatedCost = days * selectedOption.dailyRate;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/featured?status=active');
        const data = await res.json();
        if (!cancelled) setActiveBoosts(data.listings || []);
      } catch {
        // Demo fallback
        if (!cancelled) setActiveBoosts([
          { id: 'b1', type: 'profile', targetId: '', zoneId: 'zone1', startDate: '2026-06-01', endDate: '2026-06-07', impressions: 342, clicks: 28, cost: 35000, status: 'active', createdAt: '2026-06-01' },
          { id: 'b2', type: 'package', targetId: 'pkg1', zoneId: '', startDate: '2026-06-03', endDate: '2026-06-10', impressions: 187, clicks: 15, cost: 21000, status: 'active', createdAt: '2026-06-03' },
        ]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    if (!startDate || !endDate) {
      setMessage(sw ? 'Tafadhali chagua tarehe' : 'Please select dates');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: 'current',
          type: selectedType,
          targetId: '',
          zoneId,
          startDate,
          endDate,
        }),
      });
      if (res.ok) {
        setMessage(sw ? 'Boosta imeundwa!' : 'Boost created!');
        fetchBoosts();
        setActiveTab('active');
      } else {
        setMessage(sw ? 'Hitilafu imetokea' : 'An error occurred');
      }
    } catch {
      setMessage(sw ? 'Hitilafu imetokea' : 'An error occurred');
    }
    setSubmitting(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetch(`/api/featured/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBoosts();
    } catch {
      // ignore
    }
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#065F46] dark:text-[#34D399]">
          {l('Boost & Promote', 'Boosta & Tangaza')}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {l('Get more visibility in search results', 'Pata mwonekano zaidi katika matokeo ya utafutaji')}
        </p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'create'
              ? 'bg-[#065F46] text-white shadow-lg shadow-emerald-500/20'
              : 'bg-[#F1F5F9] text-[#64748B]'
          }`}
        >
          {l('Create Boost', 'Unda Boosta')}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-[#065F46] text-white shadow-lg shadow-emerald-500/20'
              : 'bg-[#F1F5F9] text-[#64748B]'
          }`}
        >
          {l('Active Boosts', 'Boosta Hai')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Boost type selection */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                {l('Select Boost Type', 'Chagua Aina ya Boosta')}
              </p>
              {BOOST_OPTIONS.map((option) => (
                <motion.button
                  key={option.type}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedType(option.type)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                    selectedType === option.type
                      ? 'border-[#065F46] bg-[#ECFDF5] dark:bg-[#065F46]/20'
                      : 'border-[#E2E8F0] bg-white dark:bg-[#1E293B]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${option.color}18` }}
                  >
                    <option.icon className="w-5 h-5" style={{ color: option.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{l(option.label, option.labelSw)}</p>
                    <p className="text-xs text-[#64748B]">{l(option.desc, option.descSw)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#F59E0B]">TZS {option.dailyRate.toLocaleString()}</p>
                    <p className="text-[10px] text-[#64748B]">{l('/day', '/siku')}</p>
                  </div>
                  {selectedType === option.type && (
                    <Check className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Zone targeting */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                <MapPin className="w-4 h-4 inline mr-1" />
                {l('Zone Targeting (Optional)', 'Lenga Eneo (Hiari)')}
              </p>
              <Input
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                placeholder={l('e.g. Kariakoo Market', 'mf. Soko la Kariakoo')}
                className="w-full"
              />
              <p className="text-[10px] text-[#94A3B8]">
                {l('Leave empty to boost across all zones', 'Acha wazi ili boosta katika maeneo yote')}
              </p>
            </div>

            {/* Date range */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#065F46] dark:text-[#34D399]">
                <Calendar className="w-4 h-4 inline mr-1" />
                {l('Date Range', 'Kipindi cha Tarehe')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#94A3B8]">{l('Start Date', 'Tarehe ya Kuanza')}</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#94A3B8]">{l('End Date', 'Tarehe ya Mwisho')}</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Preview card */}
            {days > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="kcard p-4 border-2 border-[#065F46]/20"
              >
                <p className="text-xs font-bold text-[#065F46] dark:text-[#34D399] mb-3">
                  {l('Preview — How You Appear', 'Hakiki — Jinsi Uvionavyo')}
                </p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#065F46]/20">
                  <div className="w-10 h-10 rounded-full bg-[#065F46] flex items-center justify-center">
                    <Star className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{l('Your Name', 'Jina Lako')}</p>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F59E0B] text-white">
                        {l('PROMOTED', 'IMETANGAZWA')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">{l('Top-rated guide in Kariakoo', 'Mwongozo bora Kariakoo')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                  <div>
                    <p className="text-xs text-[#64748B]">{l('Duration', 'Muda')}</p>
                    <p className="text-sm font-bold">{days} {l('days', 'siku')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">{l('Estimated Cost', 'Gharama ya Makisio')}</p>
                    <p className="text-lg font-bold text-[#F59E0B]">TZS {estimatedCost.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-xl text-sm text-center font-medium ${
                  message.includes('!') ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-red-50 text-red-600'
                }`}
              >
                {message}
              </motion.div>
            )}

            <Button
              onClick={handleCreate}
              disabled={submitting || days === 0}
              className="w-full bg-gradient-to-r from-[#065F46] to-[#059669] hover:from-[#059669] hover:to-[#34D399] text-white font-bold rounded-xl h-12 shadow-lg shadow-emerald-500/20"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  {l('Launch Boost', 'Anzisha Boosta')}
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#065F46]/20 border-t-[#065F46] rounded-full animate-spin" />
              </div>
            ) : activeBoosts.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <p className="text-sm text-[#64748B]">{l('No active boosts yet', 'Hakuna boosta hai bado')}</p>
              </div>
            ) : (
              activeBoosts.map((boost, i) => (
                <motion.div
                  key={boost.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="kcard p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F59E0B] text-white uppercase">
                        {boost.type}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        boost.status === 'active'
                          ? 'bg-[#ECFDF5] text-[#065F46]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}>
                        {boost.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePause(boost.id, boost.status)}
                      className="text-xs text-[#065F46] dark:text-[#34D399] font-medium"
                    >
                      {boost.status === 'active' ? l('Pause', 'Sitisha') : l('Resume', 'Endelea')}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] text-center">
                      <Eye className="w-4 h-4 text-[#64748B] mx-auto mb-1" />
                      <p className="text-xs font-bold">{boost.impressions}</p>
                      <p className="text-[10px] text-[#94A3B8]">{l('Views', 'Maoni')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] text-center">
                      <MousePointerClick className="w-4 h-4 text-[#64748B] mx-auto mb-1" />
                      <p className="text-xs font-bold">{boost.clicks}</p>
                      <p className="text-[10px] text-[#94A3B8]">{l('Clicks', 'Bofyo')}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] text-center">
                      <TrendingUp className="w-4 h-4 text-[#64748B] mx-auto mb-1" />
                      <p className="text-xs font-bold">{boost.impressions > 0 ? ((boost.clicks / boost.impressions) * 100).toFixed(1) : '0'}%</p>
                      <p className="text-[10px] text-[#94A3B8]">CTR</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(boost.startDate).toLocaleDateString()} — {new Date(boost.endDate).toLocaleDateString()}</span>
                    </div>
                    <span className="font-bold text-[#F59E0B]">TZS {boost.cost.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
