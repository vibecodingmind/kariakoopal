'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Search, Sparkles, Loader2, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, Info, AlertCircle,
  ThumbsUp, ThumbsDown, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ───────────────────────────────────────────────────────────

interface CulturalInsight {
  category: string;
  title: string;
  description: string;
  doAdvice: string;
  dontAdvice: string;
  severity: 'info' | 'important' | 'critical';
}

// ─── Constants ───────────────────────────────────────────────────────

const ZONES = [
  { id: 'zone-electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki' },
  { id: 'zone-fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge' },
  { id: 'zone-wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla' },
  { id: 'zone-spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo' },
  { id: 'zone-kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo' },
  { id: 'zone-artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii' },
];

const CATEGORIES = [
  { id: 'greetings', label: 'Greetings', labelSw: 'Salamu', icon: '👋' },
  { id: 'gestures', label: 'Gestures', labelSw: 'Ishara', icon: '🤚' },
  { id: 'bargaining', label: 'Bargaining', labelSw: 'Kujadiliana', icon: '🤝' },
  { id: 'dress_code', label: 'Dress Code', labelSw: 'Mavazi', icon: '👔' },
  { id: 'food', label: 'Food', labelSw: 'Chakula', icon: '🍽️' },
  { id: 'customs', label: 'Customs', labelSw: 'Mila', icon: '🏛️' },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Info; label: string; labelSw: string }> = {
  info: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: Info, label: 'Info', labelSw: 'Habari' },
  important: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: AlertCircle, label: 'Important', labelSw: 'Muhimu' },
  critical: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, label: 'Critical', labelSw: 'Muhimu Sana' },
};

// ─── Insight Card ────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: CulturalInsight; index: number }) {
  const { language } = useAuthStore();
  const sw = language === 'sw';
  const severityCfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const SeverityIcon = severityCfg.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className={`rounded-2xl border-2 ${severityCfg.border} ${severityCfg.bg} overflow-hidden`}>
        <div className="p-4 sm:p-5 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${severityCfg.bg} flex items-center justify-center`}>
              <SeverityIcon className={`w-5 h-5 ${severityCfg.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${severityCfg.bg} ${severityCfg.color} border ${severityCfg.border} text-xs font-bold`}>
                  {sw ? severityCfg.labelSw : severityCfg.label}
                </Badge>
                <Badge className="bg-[#ECFDF5] dark:bg-[#064E3B] text-[#065F46] dark:text-[#34D399] border-0 text-xs capitalize">
                  {insight.category}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">{insight.title}</h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">{insight.description}</p>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#065F46] dark:text-[#34D399] font-semibold flex items-center gap-1">
            {expanded ? (sw ? 'Ficha' : 'Show less') : (sw ? 'Soma zaidi' : 'Read more')}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {/* Do / Don't */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                {insight.doAdvice && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">{sw ? 'Fanya' : 'DO'}</p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">{insight.doAdvice}</p>
                    </div>
                  </div>
                )}
                {insight.dontAdvice && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/80 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">{sw ? "Usifanye" : "DON'T"}</p>
                      <p className="text-sm text-red-800 dark:text-red-300">{insight.dontAdvice}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function AICulturePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [zoneId, setZoneId] = useState('zone-spices');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [insights, setInsights] = useState<CulturalInsight[]>([]);
  const [existingInsights, setExistingInsights] = useState<CulturalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('');

  const fetchInsights = useCallback(async (category?: string, query?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/cultural-translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId,
          category: category || selectedCategory || undefined,
          query: query || searchQuery || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to get cultural insights');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      if (data.insights) setInsights(data.insights);
      if (data.existingInsights) setExistingInsights(data.existingInsights);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, selectedCategory, searchQuery]);

  // Load on zone change
  useEffect(() => {
    if (zoneId) {
      fetchInsights();
    }
  }, [zoneId, fetchInsights]);

  const handleCategoryClick = (catId: string) => {
    const newCat = selectedCategory === catId ? '' : catId;
    setSelectedCategory(newCat);
    fetchInsights(newCat, undefined);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchInsights(undefined, searchQuery);
    }
  };

  const allInsights = [...insights, ...existingInsights.filter(ei => !insights.some(i => i.title === ei.title))];
  const filteredInsights = activeFilter
    ? allInsights.filter(i => i.severity === activeFilter)
    : allInsights;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <Globe className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI Culture
              </span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-[#065F46] dark:text-[#34D399]">{sw ? 'Mkalimani' : 'Cultural'}</span>{' '}
            <span className="text-[#F59E0B] dark:text-[#FBBF24]">{sw ? 'wa Utamaduni' : 'Translator'}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
            {sw ? 'Elewa utamaduni wa Kariakoo' : 'Understand Kariakoo culture before you go'}
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-6">
        {/* Zone selection */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
            <Globe className="w-4 h-4 text-[#F59E0B]" />
            {sw ? 'Chagua Eneo' : 'Select Zone'}
          </label>
          <div className="flex flex-wrap gap-2">
            {ZONES.map(z => (
              <button key={z.id} onClick={() => setZoneId(z.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zoneId === z.id ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
                {sw ? z.nameSw : z.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
            <Filter className="w-4 h-4 text-[#F59E0B]" />
            {sw ? 'Kategoria' : 'Category'}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedCategory === cat.id ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] shadow-md' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'}`}>
                <span>{cat.icon}</span>
                {sw ? cat.labelSw : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder={sw ? 'Uliza kuhusu utamaduni...' : 'Ask about cultural norms...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="h-12 rounded-xl pr-10 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
            />
          </div>
          <button onClick={handleSearch} disabled={isLoading} className="px-5 rounded-xl bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22] font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">{sw ? 'Chuja:' : 'Filter:'}</span>
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setActiveFilter(activeFilter === key ? '' : key)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${activeFilter === key ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-transparent bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
              <cfg.icon className="w-3 h-3" />
              {sw ? cfg.labelSw : cfg.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-[#065F46] dark:text-[#34D399] animate-spin" />
            <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">{sw ? 'Inapata vidokezo...' : 'Loading insights...'}</span>
          </div>
        )}

        {/* Insights grid */}
        {!isLoading && filteredInsights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredInsights.map((insight, i) => (
              <InsightCard key={`${insight.title}-${i}`} insight={insight} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredInsights.length === 0 && !error && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{sw ? 'Bonyeza kategoria au uliza swali kupata vidokezo' : 'Select a category or search to get cultural insights'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
