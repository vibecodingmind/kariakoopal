'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, DollarSign, TrendingDown, Shield, AlertTriangle,
  CheckCircle2, Info, Loader2, ChevronRight, Sparkles,
  ArrowLeft, BarChart3, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/stores/auth-store';

// ─── Types ───────────────────────────────────────────────────────────

interface PriceOracleResult {
  fairPrice: number;
  estimatedMin: number;
  estimatedMax: number;
  confidence: number;
  verdict: 'great_deal' | 'fair' | 'overpriced' | 'ripoff';
  tips: string[];
  similarItems: { category: string; priceMin: number; priceMax: number; zone: string }[];
}

interface FormData {
  itemName: string;
  category: string;
  zoneId: string;
  vendorPrice: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const CATEGORIES = [
  'Electronics', 'Fabrics', 'Wholesale', 'Spices', 'Kitchenware', 'Artisanal',
];

const ZONES = [
  { id: 'zone-electronics', name: 'Electronics Zone', nameSw: 'Eneo la Elektroniki' },
  { id: 'zone-fabrics', name: 'Fabrics Zone', nameSw: 'Eneo la Vitenge' },
  { id: 'zone-wholesale', name: 'Wholesale Zone', nameSw: 'Eneo la Jumla' },
  { id: 'zone-spices', name: 'Spices Zone', nameSw: 'Eneo la Viungo' },
  { id: 'zone-kitchenware', name: 'Kitchenware Zone', nameSw: 'Eneo la Chombo' },
  { id: 'zone-artisanal', name: 'Artisanal Zone', nameSw: 'Eneo la Kisanii' },
];

const ITEM_SUGGESTIONS = [
  'Smartphone', 'Kanga fabric', 'Phone case', 'Turmeric',
  'Bluetooth speaker', 'Kitenge fabric', 'Basmati rice',
  'Cardamom', 'Sufuria set', 'Tanzanite', 'Maasai necklace',
  'Cooking oil', 'USB cable', 'Silk fabric', 'Ebony carving',
];

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2; label: string; labelSw: string }> = {
  great_deal: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', icon: CheckCircle2, label: 'Great Deal!', labelSw: 'Bei Nzuri!' },
  fair: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', icon: Shield, label: 'Fair Price', labelSw: 'Bei ya Haki' },
  overpriced: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', icon: AlertTriangle, label: 'Overpriced', labelSw: 'Bei ya Juu' },
  ripoff: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', icon: AlertTriangle, label: 'Ripoff!', labelSw: 'Ubabe!' },
};

function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString()}`;
}

// ─── Price Gauge Component ───────────────────────────────────────

function PriceGauge({ vendorPrice, estimatedMin, estimatedMax, fairPrice }: {
  vendorPrice: number; estimatedMin: number; estimatedMax: number; fairPrice: number;
}) {
  const range = estimatedMax * 1.5 - estimatedMin * 0.5;
  const start = estimatedMin * 0.5;
  const getPercent = (val: number) => Math.max(0, Math.min(100, ((val - start) / range) * 100));

  const vendorPct = getPercent(vendorPrice);
  const fairPct = getPercent(fairPrice);
  const minPct = getPercent(estimatedMin);
  const maxPct = getPercent(estimatedMax);

  return (
    <div className="space-y-3">
      <div className="relative h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* Fair zone */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-200"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        {/* Very cheap zone */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-400/40"
          style={{ left: '0%', width: `${minPct}%` }}
        />
        {/* Expensive zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-300/40"
          style={{ left: `${maxPct}%`, width: `${100 - maxPct}%` }}
        />
        {/* Fair price marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-[#065F46] dark:bg-[#34D399]"
          style={{ left: `${fairPct}%` }}
        />
        {/* Vendor price marker */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-red-500 rounded-full shadow-lg"
          style={{ left: `${vendorPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
        <span>{formatTZS(Math.round(start))}</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatTZS(estimatedMin)}</span>
        <span className="text-[#065F46] dark:text-[#34D399] font-bold">{formatTZS(fairPrice)}</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatTZS(estimatedMax)}</span>
        <span>{formatTZS(Math.round(start + range))}</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-400/40" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Great</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-300 to-amber-200" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-300/40" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Overpriced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-3 rounded-sm bg-[#065F46]" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-3 rounded-sm bg-red-500" />
          <span className="text-[#64748B] dark:text-[#94A3B8]">Vendor</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function AIPriceOraclePage() {
  const { language } = useAuthStore();
  const sw = language === 'sw';

  const [formData, setFormData] = useState<FormData>({
    itemName: '',
    category: '',
    zoneId: '',
    vendorPrice: '',
  });
  const [result, setResult] = useState<PriceOracleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<{ item: string; price: number; verdict: string }[]>([]);

  const isFormValid = formData.itemName.trim() !== '' && formData.zoneId !== '';

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/price-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: formData.itemName,
          category: formData.category || undefined,
          zoneId: formData.zoneId,
          vendorPrice: formData.vendorPrice ? Number(formData.vendorPrice) : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to get price estimate');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Request failed');

      setResult(data);
      setHistory(prev => [{
        item: formData.itemName,
        price: formData.vendorPrice ? Number(formData.vendorPrice) : data.fairPrice,
        verdict: data.verdict,
      }, ...prev].slice(0, 10));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isFormValid]);

  const verdictConfig = result ? VERDICT_CONFIG[result.verdict] : null;
  const VerdictIcon = verdictConfig?.icon || Shield;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #065F46 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#065F46]/10 dark:bg-[#34D399]/5 blur-3xl" />
        <div className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-[#065F46]/10 dark:bg-[#34D399]/10 px-4 py-1.5 rounded-full mb-4">
              <DollarSign className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              <span className="text-xs font-semibold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider">
                AI Price Oracle
              </span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-[#065F46] dark:text-[#34D399]">{sw ? 'Ramani ya Bei' : 'Price'}</span>{' '}
            <span className="text-[#F59E0B] dark:text-[#FBBF24]">{sw ? 'ya AI' : 'Oracle'}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
            {sw ? 'Pata bei ya haki kabla ya kununua' : 'Know the fair price before you buy'}
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16 space-y-6">
        {/* Input Form */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-md border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-8 space-y-6">
          {/* Item name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
              <Search className="w-4 h-4 text-[#F59E0B]" />
              {sw ? 'Kitu unachotaka' : 'What are you buying?'}
            </label>
            <div className="relative">
              <Input
                placeholder={sw ? 'Mfano: Kanga, Simu, Viungo...' : 'e.g. Kanga fabric, Smartphone, Spices...'}
                value={formData.itemName}
                onChange={(e) => setFormData(p => ({ ...p, itemName: e.target.value }))}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-12 rounded-xl border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]"
              />
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {ITEM_SUGGESTIONS.filter(s => s.toLowerCase().includes(formData.itemName.toLowerCase()) || formData.itemName === '').map(s => (
                      <button key={s} onMouseDown={() => { setFormData(p => ({ ...p, itemName: s })); setShowSuggestions(false); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B] text-[#0F172A] dark:text-[#F1F5F9] transition-colors">
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Category & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                <BarChart3 className="w-4 h-4 text-[#F59E0B]" />
                {sw ? 'Kategoria' : 'Category'}
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFormData(p => ({ ...p, category: p.category === cat ? '' : cat }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${formData.category === cat ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
                <Shield className="w-4 h-4 text-[#F59E0B]" />
                {sw ? 'Eneo' : 'Zone'}
              </label>
              <div className="flex flex-wrap gap-2">
                {ZONES.map(z => (
                  <button key={z.id} onClick={() => setFormData(p => ({ ...p, zoneId: p.zoneId === z.id ? '' : z.id }))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${formData.zoneId === z.id ? 'bg-[#065F46] dark:bg-[#34D399] text-white dark:text-[#022C22]' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]'}`}>
                    {sw ? z.nameSw : z.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor price */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-3">
              <DollarSign className="w-4 h-4 text-[#F59E0B]" />
              {sw ? 'Bei ya muuzaji' : "Vendor's asking price"}
              <span className="text-xs font-normal text-[#94A3B8]">({sw ? 'si lazima' : 'optional'})</span>
            </label>
            <div className="relative max-w-xs">
              <Input type="number" placeholder="0" value={formData.vendorPrice} onChange={(e) => setFormData(p => ({ ...p, vendorPrice: e.target.value }))} className="h-12 rounded-xl pr-16 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">TZS</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isFormValid || isLoading} className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] bg-[length:200%_100%] hover:bg-right shadow-lg shadow-[#065F46]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-2.5">
            {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />{sw ? 'Inahesabu...' : 'Analyzing...'} </>) : (<><Sparkles className="w-5 h-5" />{sw ? 'Angalia Bei' : 'Check Price'}<ChevronRight className="w-4 h-4" /></>)}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div><p className="text-sm font-semibold text-red-700 dark:text-red-400">{sw ? 'Hitilafu' : 'Error'}</p><p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{error}</p></div>
            </div>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              {/* Verdict Card */}
              {verdictConfig && (
                <div className={`p-5 sm:p-6 rounded-2xl border-2 ${verdictConfig.border} ${verdictConfig.bg}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${verdictConfig.bg}`}>
                      <VerdictIcon className={`w-6 h-6 ${verdictConfig.color}`} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${verdictConfig.color}`}>
                        {sw ? verdictConfig.labelSw : verdictConfig.label}
                      </h2>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {sw ? 'Uwiano wa kuaminika' : 'Confidence'}: {(result.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#065F46] dark:text-[#34D399]">
                      {formatTZS(result.fairPrice)}
                    </span>
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      {sw ? 'bei ya haki' : 'fair price'}
                    </span>
                  </div>

                  {/* Price gauge */}
                  {formData.vendorPrice && Number(formData.vendorPrice) > 0 && (
                    <PriceGauge
                      vendorPrice={Number(formData.vendorPrice)}
                      estimatedMin={result.estimatedMin}
                      estimatedMax={result.estimatedMax}
                      fairPrice={result.fairPrice}
                    />
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
                      {sw ? 'Chini' : 'Min'}: {formatTZS(result.estimatedMin)}
                    </Badge>
                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 text-xs">
                      {sw ? 'Juu' : 'Max'}: {formatTZS(result.estimatedMax)}
                    </Badge>
                    {formData.vendorPrice && Number(formData.vendorPrice) > 0 && (
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs">
                        {sw ? 'Muuzaji' : 'Vendor'}: {formatTZS(Number(formData.vendorPrice))}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Tips */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#065F46] to-[#059669] dark:from-[#022C22] dark:to-[#065F46] py-4 px-5">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Lightbulb className="w-4 h-4 text-[#FBBF24]" />
                    {sw ? 'Vidokezo vya Bei' : 'Price Tips'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                    {result.tips.map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
                          </div>
                          <p className="text-sm text-[#0F172A] dark:text-[#F1F5F9] leading-relaxed">{tip}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Similar items from PriceRadar */}
              {result.similarItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-[#065F46] dark:text-[#34D399]" />
                    {sw ? 'Vitu vinavyofanana' : 'Similar Items'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.similarItems.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 space-y-2">
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{item.category}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{item.zone}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">{formatTZS(item.priceMin)}</span>
                          <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">-</span>
                          <span className="text-lg font-bold text-[#F59E0B] dark:text-[#FBBF24]">{formatTZS(item.priceMax)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#065F46] dark:text-[#34D399]" />
              {sw ? 'Historia ya Uchunguzi' : 'Recent Checks'}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((h, i) => {
                const cfg = VERDICT_CONFIG[h.verdict];
                return (
                  <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-3">
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>{sw ? cfg.labelSw : cfg.label}</Badge>
                    <span className="text-sm text-[#0F172A] dark:text-[#F1F5F9] font-medium">{h.item}</span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] ml-auto">{formatTZS(h.price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
